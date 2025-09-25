import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-CHECK-USER-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    // Validate environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing required Supabase environment variables");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating admin user");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const adminUser = userData.user;
    if (!adminUser?.email) throw new Error("Admin user not authenticated");
    logStep("Admin authenticated", { adminId: adminUser.id, adminEmail: adminUser.email });

    // Check if the authenticated user is an admin
    const { data: adminProfile, error: adminProfileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('user_id', adminUser.id)
      .single();

    logStep("Admin profile lookup result", { 
      adminProfileError: adminProfileError?.message, 
      adminProfile: adminProfile,
      adminUserId: adminUser.id 
    });

    if (adminProfileError) {
      throw new Error(`Admin profile lookup failed: ${adminProfileError.message}`);
    }
    
    if (!adminProfile) {
      throw new Error("Admin profile not found");
    }
    
    if (!['admin', 'master_admin'].includes(adminProfile.role)) {
      throw new Error(`Insufficient permissions - admin access required. Current role: ${adminProfile.role}`);
    }
    
    logStep("Admin permissions verified", { role: adminProfile.role });

    // Get the target user email from request body
    const { userEmail } = await req.json();
    if (!userEmail) {
      throw new Error("Target user email is required");
    }
    logStep("Target user email provided", { userEmail });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found for target user, returning unsubscribed state");
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
    logStep("Found Stripe customer for target user", { customerId });

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
      const actualEnd = new Date(subscription.current_period_end * 1000).toISOString();

      // Always display next billing as the 1st of the upcoming month
      const nowUtc = new Date();
      const displayNextFirstUtc = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth() + 1, 1, 0, 0, 0));
      subscriptionEnd = displayNextFirstUtc.toISOString();

      logStep("Active subscription found for target user", { subscriptionId: subscription.id, actualEnd, displayNextFirstUtc: subscriptionEnd });
      
      // Get the price details to determine credits and plan name
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;
      const amountInDollars = amount / 100;
      
      // Get credits and plan details from subscription metadata
      creditsPerMonth = parseInt(subscription.metadata?.credits || "0");
      planName = subscription.metadata?.plan_name || "Custom Plan";
      
      // Determine subscription tier based on credits or amount
      if (creditsPerMonth >= 1000) {
        subscriptionTier = "ultra";
      } else if (creditsPerMonth >= 750) {
        subscriptionTier = "pro";
      } else if (creditsPerMonth >= 500) {
        subscriptionTier = "plus";
      } else if (creditsPerMonth >= 250) {
        subscriptionTier = "starter";
      } else {
        subscriptionTier = "custom";
      }
      
      // Fallback to price-based calculation if no metadata
      if (!creditsPerMonth) {
        creditsPerMonth = amountInDollars; // 1:1 ratio fallback
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
      
      logStep("Determined subscription details for target user", { 
        priceId, 
        amount: amountInDollars, 
        subscriptionTier, 
        planName,
        creditsPerMonth 
      });
    } else {
      logStep("No active subscription found for target user");
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      plan_name: planName,
      credits_per_month: creditsPerMonth
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in admin-check-user-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});