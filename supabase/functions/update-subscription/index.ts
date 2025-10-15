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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey || !stripeKey || !supabaseServiceKey) {
      throw new Error("Missing required environment variables");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

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

    // Get current and new price details
    const currentPrice = await stripe.prices.retrieve(currentSubscription.items.data[0].price.id);
    const newPrice = await stripe.prices.retrieve(newPriceId);
    
    const currentCredits = currentPrice.unit_amount! / 100;
    const newCredits = credits;
    const upgradeDifference = newCredits - currentCredits;
    
    logStep("Current plan details", { currentCredits, newCredits, currentPrice: currentPrice.unit_amount });

    // Create plan name based on credits
    const planName = `Pro ${newCredits / 100} Plan`;

    const idempotencyKey = `update-${user.id}-${credits}-${Date.now()}`;

    // Handle upgrades vs downgrades differently
    if (upgradeDifference > 0) {
      // UPGRADE: Create checkout for difference and schedule subscription change
      logStep("Creating upgrade checkout", {
        currentCredits,
        newCredits,
        upgradeDifference,
        upgradeAmount: upgradeDifference * 100
      });

      // Create a checkout session for the upgrade difference
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'sgd',
              product_data: {
                name: `Upgrade to ${planName}`,
                description: `Upgrade difference: ${upgradeDifference} credits`,
              },
              unit_amount: upgradeDifference * 100, // $1 per credit difference in cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment', // One-time payment for the difference
        success_url: `${req.headers.get('origin') || 'https://your-app.com'}/dashboard?upgrade_success=1&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get('origin') || 'https://your-app.com'}/dashboard?upgrade_cancelled=1`,
        metadata: {
          user_id: user.id,
          upgrade_type: 'subscription_change',
          old_credits: currentCredits.toString(),
          new_credits: newCredits.toString(),
          subscription_id: currentSubscription.id,
          new_price_id: newPriceId,
          plan_name: planName
        }
      });

      // NOTE: Subscription will be updated AFTER successful payment via webhook
      // This prevents upgrading the subscription if payment fails or is cancelled

      logStep("Checkout session created", { 
        sessionId: session.id,
        checkoutUrl: session.url,
        upgradeAmount: upgradeDifference * 100
      });

      // NOTE: Credits will be added only after successful payment via webhook
      // Do NOT add credits here to prevent issues if payment fails

      return new Response(JSON.stringify({
        success: true,
        checkout_url: session.url,
        subscription_id: currentSubscription.id,
        upgrade_credits_added: upgradeDifference,
        message: "Redirecting to payment - subscription will upgrade after successful payment",
        billing_info: {
          immediate_charge: `S$${upgradeDifference}`,
          next_billing_date: "1st of next month",
          new_monthly_amount: `S$${newCredits}`,
          explanation: `Complete payment of S$${upgradeDifference} to receive ${upgradeDifference} additional credits immediately. Your subscription will then be upgraded to S$${newCredits}/month starting next billing cycle.`
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
      
    } else if (upgradeDifference < 0) {
      // DOWNGRADE: Just update subscription for next billing cycle, no immediate changes
      logStep("Processing subscription downgrade", {
        currentCredits,
        newCredits,
        creditReduction: Math.abs(upgradeDifference)
      });

      // Update subscription to take effect next billing cycle
      const updatedSubscription = await stripe.subscriptions.update(currentSubscription.id, {
        items: [
          {
            id: currentSubscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: "none", // No immediate changes, takes effect next cycle
        metadata: {
          user_id: user.id,
          credits: credits.toString(),
          plan_name: planName,
          previous_credits: currentCredits.toString(),
          scheduled_downgrade: 'true'
        },
      }, {
        idempotencyKey
      });

      logStep("Subscription downgrade scheduled", {
        subscriptionId: updatedSubscription.id,
        effectiveNextCycle: true
      });

      // Send confirmation email for downgrade
      try {
        await supabaseService.functions.invoke('send-subscription-emails', {
          body: { 
            emailType: 'downgrade',
            subscriptionData: { 
              credits: newCredits,
              planName: planName,
              oldCredits: currentCredits,
              savingsAmount: Math.abs(upgradeDifference)
            },
            userEmail: user.email
          }
        });
        logStep("Downgrade confirmation email sent");
      } catch (emailError) {
        logStep("Warning: Failed to send downgrade confirmation email", { error: emailError });
      }

      // Log transaction for the downgrade (no credits added, just audit trail)
      const { error: downgradeTransactionError } = await supabaseService
        .from('flexi_credits_transactions')
        .insert({
          user_id: user.id,
          amount: 0, // No credits added/removed
          type: 'admin_credit', // Using admin_credit type for plan changes
          description: `Plan downgrade to ${planName} (effective next billing cycle)`
        });

      if (downgradeTransactionError) {
        logStep("Warning: Failed to log downgrade transaction", { error: downgradeTransactionError.message });
      }

      // IMPORTANT: Do NOT add any credits for downgrades
      // Existing credits remain in account, but no new credits are added
      logStep("Downgrade completed - no credits added", {
        existingCreditsPreserved: true,
        newCreditsAdded: 0
      });

      return new Response(JSON.stringify({
        success: true,
        subscription_id: updatedSubscription.id,
        message: "Subscription downgrade scheduled for next billing cycle",
        billing_info: {
          next_billing_date: "1st of next month",
          new_monthly_amount: `S$${newCredits}`,
          monthly_savings: `S$${Math.abs(upgradeDifference)}`,
          explanation: `Your subscription will be downgraded to ${planName} starting next month. You'll be charged S$${newCredits} monthly and save S$${Math.abs(upgradeDifference)} per month. Your existing credits don't expire.`
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
      
    } else {
      // Same plan - no changes needed
      logStep("No plan change detected", { currentCredits, newCredits });
      
      return new Response(JSON.stringify({
        success: true,
        message: "No changes made - you're already on this plan",
        subscription_id: currentSubscription.id
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in update-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});