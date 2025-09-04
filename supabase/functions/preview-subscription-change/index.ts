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
  console.log(`[PREVIEW-SUBSCRIPTION-CHANGE] ${step}${detailsStr}`);
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

    // Get current subscription item
    const subscriptionItem = currentSubscription.items.data[0];

    // Calculate full difference (no proration)
    const currentPriceAmount = (await stripe.prices.retrieve(subscriptionItem.price.id)).unit_amount || 0;
    const newPriceAmount = credits * 100;
    const fullDifference = Math.max(0, newPriceAmount - currentPriceAmount) / 100; // Full difference in dollars

    logStep("Preview calculation completed", { 
      currentPriceAmount,
      newPriceAmount,
      fullDifference,
      isUpgrade: newPriceAmount > currentPriceAmount
    });

    return new Response(JSON.stringify({ 
      success: true,
      current_amount: currentPriceAmount / 100,
      new_amount: newPriceAmount / 100,
      prorated_amount: fullDifference, // This is the full difference, not prorated
      is_upgrade: newPriceAmount > currentPriceAmount,
      immediate_charge: fullDifference > 0,
      upgrade_credits: newPriceAmount > currentPriceAmount ? (credits - (currentPriceAmount / 100)) : 0
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in preview-subscription-change", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});