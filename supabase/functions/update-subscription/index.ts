import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Test product IDs for different credit tiers
const PRODUCT_IDS = {
  100: "prod_SzUboV8UxwJDka",
  200: "prod_SzUbZY8giZezYF", 
  300: "prod_SzUcvvnXaTBljA",
  400: "prod_SzUck1vYwJVxxt",
  500: "prod_SzUcrkKADiWfzR",
  600: "prod_SzUc4eBHoTh19o",
  700: "prod_SzUclOFwhQjTa1",
  800: "prod_SzUdjvcoYxEMHu",
  900: "prod_SzUdu9F9ITxI36",
  1000: "prod_SzUedjKY4tBfxX"
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[UPDATE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Validate environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey || !stripeKey) {
      throw new Error("Missing required environment variables");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    logStep("User authenticated", { userId: user.id, email: user.email });

    const { credits } = await req.json();
    
    // Validate credits and get product ID
    const productId = PRODUCT_IDS[credits as keyof typeof PRODUCT_IDS];
    if (!productId) {
      throw new Error(`Invalid credits amount: ${credits}. Must be one of: ${Object.keys(PRODUCT_IDS).join(', ')}`);
    }
    logStep("Product ID found", { credits, productId });

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Find customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      throw new Error("No Stripe customer found");
    }
    const customerId = customers.data[0].id;
    logStep("Found customer", { customerId });

    // Find active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      throw new Error("No active subscription found");
    }

    const currentSubscription = subscriptions.data[0];
    logStep("Found active subscription", { subscriptionId: currentSubscription.id });

    // Get or create price for the new product (monthly SGD)
    const prices = await stripe.prices.list({ 
      product: productId,
      currency: 'sgd', 
      recurring: { interval: 'month' },
      active: true,
      limit: 1 
    });
    
    let newPriceId;
    if (prices.data.length > 0) {
      newPriceId = prices.data[0].id;
      logStep("Found existing price", { priceId: newPriceId });
    } else {
      // Create new monthly SGD price for this product
      const newPrice = await stripe.prices.create({
        product: productId,
        currency: 'sgd',
        unit_amount: credits * 100, // S$1 per credit, in cents
        recurring: { interval: 'month' }
      });
      newPriceId = newPrice.id;
      logStep("Created new price", { priceId: newPriceId, unitAmount: credits * 100 });
    }

    // Determine plan name based on credits
    const planName = `Pro ${Math.ceil(credits / 100)} Plan`;

    // Generate idempotency key for safe retries
    const idempotencyKey = `update-${currentSubscription.id}-${credits}-${Date.now()}`;

    // Get current subscription item
    const subscriptionItem = currentSubscription.items.data[0];

    // Get current plan details for proration calculation
    const currentSubscriptionItem = currentSubscription.items.data[0];
    const currentPrice = await stripe.prices.retrieve(currentSubscriptionItem.price.id);
    const currentCredits = parseInt(currentSubscription.metadata?.credits || "0");
    
    logStep("Current plan details", { 
      currentCredits, 
      newCredits: credits,
      currentPrice: currentPrice.unit_amount 
    });

    // Calculate billing cycle anchor to the 1st of next month if not already aligned
    const nowUtc = new Date();
    const currentAnchor = currentSubscription.billing_cycle_anchor
      ? new Date(currentSubscription.billing_cycle_anchor * 1000)
      : null;
    const isAlreadyFirst = currentAnchor ? currentAnchor.getUTCDate() === 1 : false;
    const nextMonthFirstUtc = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth() + 1, 1, 0, 0, 0));
    const billingCycleAnchor = isAlreadyFirst ? undefined : Math.floor(nextMonthFirstUtc.getTime() / 1000);

    logStep("Billing cycle alignment", {
      currentAnchor: currentAnchor?.toISOString() || null,
      aligningToFirst: !isAlreadyFirst,
      anchorTimestamp: billingCycleAnchor || null,
    });

    // Update subscription maintaining 1st-of-month billing cycle
    const updatedSubscription = await stripe.subscriptions.update(currentSubscription.id, {
      items: [
        {
          id: subscriptionItem.id,
          price: newPriceId,
        },
      ],
      proration_behavior: "always_invoice", // Immediate proration for current month only
      billing_cycle_anchor: billingCycleAnchor, // If undefined, Stripe keeps existing anchor
      metadata: {
        user_id: user.id,
        credits: credits.toString(),
        plan_name: planName,
        previous_credits: currentCredits.toString(),
      },
    }, {
      idempotencyKey
    });

    logStep("Updated subscription", { 
      subscriptionId: updatedSubscription.id,
      newPriceId 
    });

    // For upgrades, grant full credit difference immediately (no proration)
    if (credits > currentCredits) {
      const upgradeCredits = credits - currentCredits;
      
      logStep("Granting full upgrade credits immediately", { 
        upgradeCredits,
        currentCredits,
        newCredits: credits
      });

      // Create Supabase client with service role key to bypass RLS
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (!supabaseServiceKey) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY not set");
      }

      const supabaseService = createClient(
        supabaseUrl,
        supabaseServiceKey,
        { auth: { persistSession: false } }
      );

      // Check for existing upgrade transaction to prevent duplicates
      const { data: existingUpgrade } = await supabaseService
        .from('flexi_credits_transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('description', `Plan upgrade credits - Subscription ${updatedSubscription.id}`)
        .maybeSingle();

      if (existingUpgrade) {
        logStep("Upgrade credits already granted", { subscriptionId: updatedSubscription.id });
      } else {
        // Add full upgrade credits immediately
        const { error: creditsError } = await supabaseService.rpc('increment_flexi_credits_balance', {
          user_id: user.id,
          credits_to_add: upgradeCredits
        });

        if (creditsError) {
          logStep("Error adding upgrade credits", creditsError);
          // Don't throw here - subscription was updated successfully
        } else {
          // Create transaction record
          const { error: transactionError } = await supabaseService
            .from('flexi_credits_transactions')
            .insert({
              user_id: user.id,
              type: 'purchase',
              amount: upgradeCredits,
              description: `Plan upgrade credits - Subscription ${updatedSubscription.id}`
            });

          if (transactionError) {
            logStep("Error creating upgrade transaction record", transactionError);
          } else {
            logStep("Successfully granted full upgrade credits", { upgradeCredits });
          }
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      subscription_id: updatedSubscription.id,
      message: "Subscription updated successfully - Prorated charge for current month only, future billing remains on 1st",
      upgrade_credits_added: credits > currentCredits ? (credits - currentCredits) : 0,
      billing_info: {
        next_billing_date: "1st of next month",
        charge_explanation: "You were charged the prorated difference for the remaining days this month. Your regular billing cycle continues on the 1st of each month."
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in update-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});