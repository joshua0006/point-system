import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const { credits, price } = await req.json();

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

    // Get current subscription item
    const subscriptionItem = currentSubscription.items.data[0];
    const currentPrice = await stripe.prices.retrieve(subscriptionItem.price.id);
    const currentAmount = currentPrice.unit_amount || 0;
    const newAmount = price * 100; // Convert to cents

    logStep("Price comparison", { 
      currentAmount, 
      newAmount, 
      difference: newAmount - currentAmount 
    });

    // Determine plan name based on credits
    let planName = "Starter Plan";
    if (credits === 500) planName = "Plus Plan";
    else if (credits === 750) planName = "Pro Plan";
    else if (credits === 1000) planName = "Ultra Plan";

    // Create new price for the updated subscription
    const newPrice = await stripe.prices.create({
      currency: "sgd",
      unit_amount: newAmount,
      recurring: { interval: "month" },
      product_data: {
        name: `${planName} - ${credits} flexi-credits/month`,
        description: `Monthly subscription for ${credits} flexi-credits (renews 1st of each month)`,
      },
    });

    logStep("Created new price", { priceId: newPrice.id });

    // Update the subscription with proration
    const updatedSubscription = await stripe.subscriptions.update(currentSubscription.id, {
      items: [
        {
          id: subscriptionItem.id,
          price: newPrice.id,
        },
      ],
      proration_behavior: "always_invoice", // This ensures immediate proration
      metadata: {
        user_id: user.id,
        credits: credits.toString(),
        plan_name: planName,
      },
    });

    logStep("Updated subscription", { 
      subscriptionId: updatedSubscription.id,
      newPriceId: newPrice.id 
    });

    return new Response(JSON.stringify({ 
      success: true, 
      subscription_id: updatedSubscription.id,
      message: "Subscription updated successfully with proration"
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