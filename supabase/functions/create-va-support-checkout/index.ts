import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type PlanKey = "basic" | "standard" | "comprehensive";

const PLAN_CONFIG: Record<PlanKey, { name: string; amount: number }> = {
  basic: { name: "VA Support – Basic", amount: 5000 }, // S$50
  standard: { name: "VA Support – Standard", amount: 7500 }, // S$75
  comprehensive: { name: "VA Support – Comprehensive", amount: 10000 }, // S$100
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(userError.message);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { plan } = await req.json();
    if (!plan || !(plan in PLAN_CONFIG)) throw new Error("Invalid plan");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    if (!stripeKey) throw new Error("Missing STRIPE_SECRET_KEY");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined = customers.data[0]?.id;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "sgd",
            product_data: {
              name: PLAN_CONFIG[plan as PlanKey].name,
              description: "Monthly subscription for VA Support Services",
            },
            unit_amount: PLAN_CONFIG[plan as PlanKey].amount,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/lead-gen-campaigns?va_subscribe=success`,
      cancel_url: `${req.headers.get("origin")}/lead-gen-campaigns?va_subscribe=canceled`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
