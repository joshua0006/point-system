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
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

// Smart origin detection for development & production
function getAppOrigin(req: Request): string {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  // Priority 1: Use origin header if present
  if (origin) {
    logStep("Using origin header", { origin });
    return origin;
  }

  // Priority 2: Extract from referer
  if (referer) {
    try {
      const url = new URL(referer);
      const refererOrigin = `${url.protocol}//${url.host}`;
      logStep("Using referer origin", { refererOrigin });
      return refererOrigin;
    } catch (e) {
      logStep("Failed to parse referer", { error: e });
    }
  }

  // Priority 3: Use SITE_URL env var
  const siteUrl = Deno.env.get('SITE_URL');
  if (siteUrl) {
    logStep("Using SITE_URL env", { siteUrl });
    return siteUrl;
  }

  // Fallback: localhost (development default)
  logStep("Fallback to localhost");
  return 'http://localhost:5173';
}

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

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      logStep("No existing customer found");
    }

    // Get or create price for this product (monthly SGD)
    const prices = await stripe.prices.list({ 
      product: productId,
      currency: 'sgd', 
      recurring: { interval: 'month' },
      active: true,
      limit: 1 
    });
    
    let priceId;
    if (prices.data.length > 0) {
      priceId = prices.data[0].id;
      logStep("Found existing price", { priceId });
    } else {
      // Create new monthly SGD price for this product
      const newPrice = await stripe.prices.create({
        product: productId,
        currency: 'sgd',
        unit_amount: credits * 100, // S$1 per credit, in cents
        recurring: { interval: 'month' }
      });
      priceId = newPrice.id;
      logStep("Created new price", { priceId, unitAmount: credits * 100 });
    }

    // Determine plan name based on credits
    const planName = `Pro ${Math.ceil(credits / 100)} Plan`;

    // Generate idempotency key for safe retries
    const idempotencyKey = `checkout-${user.id}-${credits}-${Date.now()}`;

    // Calculate billing cycle anchor to the 1st of next month using UTC
    const now = new Date();
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
    const billingCycleAnchor = Math.floor(nextMonth.getTime() / 1000);

    logStep("Billing cycle anchor calculated", {
      currentDate: now.toISOString(),
      nextBillingDate: nextMonth.toISOString(),
      billingCycleAnchor
    });

    // Get app origin for redirect URLs
    const appOrigin = getAppOrigin(req);

    // Create checkout session with fixed price and billing cycle anchor
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${appOrigin}/thank-you?plan_name=${encodeURIComponent(planName)}&credits=${credits}`,
      cancel_url: `${appOrigin}/marketplace?subscription=canceled`,
      metadata: {
        user_id: user.id,
        credits: credits.toString(),
        plan_name: planName
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          credits: credits.toString(),
          plan_name: planName
        },
        billing_cycle_anchor: billingCycleAnchor
      },
      payment_method_types: ['card'],
      billing_address_collection: 'auto',
    }, {
      idempotencyKey
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});