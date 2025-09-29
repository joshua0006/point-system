import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-user-email",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🚀 Admin check user subscription function started");

    // Get target user email from header
    const userEmail = req.headers.get("x-user-email");
    if (!userEmail) {
      console.log("❌ Missing target user email in x-user-email header");
      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        plan_name: null,
        credits_per_month: 0,
        error: "Target user email is required in x-user-email header"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    console.log("📧 Target user email:", userEmail);

    // Check environment variables
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    console.log("🔑 Environment variables verified");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Find customer by email
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    
    if (customers.data.length === 0) {
      console.log("👤 No customer found for target user, returning unsubscribed state");
      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        plan_name: null,
        credits_per_month: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    console.log("✅ Found Stripe customer:", customerId);

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionTier = null;
    let subscriptionEnd = null;
    let planName = null;
    let creditsPerMonth = 0;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      
      // Always display next billing as the 1st of the upcoming month
      const nowUtc = new Date();
      const displayNextFirstUtc = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth() + 1, 1, 0, 0, 0));
      subscriptionEnd = displayNextFirstUtc.toISOString();

      console.log("💳 Active subscription found:", subscription.id);
      
      // Get the price details
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;
      const amountInDollars = amount / 100;
      
      // Get credits and plan details from subscription metadata
      creditsPerMonth = parseInt(subscription.metadata?.credits || "0");
      planName = subscription.metadata?.plan_name || null;
      
      // Determine subscription tier and plan name
      if (creditsPerMonth >= 1000) {
        subscriptionTier = "ultra";
        planName = planName || "Ultra Plan";
      } else if (creditsPerMonth >= 750) {
        subscriptionTier = "pro";
        planName = planName || "Pro Plan";
      } else if (creditsPerMonth >= 500) {
        subscriptionTier = "plus";
        planName = planName || "Plus Plan";
      } else if (creditsPerMonth >= 250) {
        subscriptionTier = "starter";
        planName = planName || "Starter Plan";
      } else if (creditsPerMonth > 0) {
        subscriptionTier = "custom";
        planName = planName || "Custom Plan";
      } else {
        // Fallback to price-based calculation if no metadata
        creditsPerMonth = amountInDollars;
        if (amountInDollars >= 1000) {
          subscriptionTier = "ultra";
          planName = "Ultra Plan";
        } else if (amountInDollars >= 750) {
          subscriptionTier = "pro";
          planName = "Pro Plan";
        } else if (amountInDollars >= 500) {
          subscriptionTier = "plus";
          planName = "Plus Plan";
        } else if (amountInDollars >= 250) {
          subscriptionTier = "starter";
          planName = "Starter Plan";
        } else {
          subscriptionTier = "custom";
          planName = "Custom Plan";
        }
      }
      
      console.log("📊 Subscription details:", { 
        tier: subscriptionTier, 
        planName,
        creditsPerMonth,
        amount: amountInDollars
      });
    } else {
      console.log("❌ No active subscription found for target user");
    }

    const response = {
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      plan_name: planName,
      credits_per_month: creditsPerMonth
    };

    console.log("✅ Returning response:", response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ ERROR in admin-check-user-subscription:", errorMessage);
    return new Response(JSON.stringify({ 
      error: errorMessage,
      subscribed: false,
      subscription_tier: null,
      subscription_end: null,
      plan_name: null,
      credits_per_month: 0
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});