import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fixed product IDs for different credit tiers
const PRODUCT_IDS = {
  100: "prod_Syq0MrJ83xjLDx",
  200: "prod_Syq1oZmfLtQRhX", 
  300: "prod_Syq2W7jNs4WHQL",
  400: "prod_SyoIIvJC6RfmrZ",
  500: "prod_Syq4vTHQphmg2f",
  600: "prod_SyoIxmtPCmfSKJ",
  700: "prod_Syq6NJSW5vOxPy",
  800: "prod_Sys82JaSzQuyNU",
  900: "prod_SyoJB0AsJr4Enc",
  1000: "prod_SyoKegoonFM1u2"
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

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

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

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
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

    // Update the subscription with proration
    const updatedSubscription = await stripe.subscriptions.update(currentSubscription.id, {
      items: [
        {
          id: subscriptionItem.id,
          price: newPriceId,
        },
      ],
      proration_behavior: "always_invoice", // This ensures immediate proration
      metadata: {
        user_id: user.id,
        credits: credits.toString(),
        plan_name: planName,
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
      const supabaseService = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

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
            description: `Plan upgrade credits - Immediate full difference`
          });

        if (transactionError) {
          logStep("Error creating upgrade transaction record", transactionError);
        } else {
          logStep("Successfully granted full upgrade credits", { upgradeCredits });
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      subscription_id: updatedSubscription.id,
      message: "Subscription updated successfully - Full upgrade difference charged immediately",
      upgrade_credits_added: credits > currentCredits ? (credits - currentCredits) : 0
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