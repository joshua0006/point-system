import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Smart origin detection for development & production
function getAppOrigin(req: Request): string {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  // Priority 1: Use origin header if present
  if (origin) {
    console.log("[ORIGIN-DETECT] Using origin header:", origin);
    return origin;
  }

  // Priority 2: Extract from referer
  if (referer) {
    try {
      const url = new URL(referer);
      const refererOrigin = `${url.protocol}//${url.host}`;
      console.log("[ORIGIN-DETECT] Using referer origin:", refererOrigin);
      return refererOrigin;
    } catch (e) {
      console.error("[ORIGIN-DETECT] Failed to parse referer:", e);
    }
  }

  // Priority 3: Use SITE_URL env var
  const siteUrl = Deno.env.get('SITE_URL');
  if (siteUrl) {
    console.log("[ORIGIN-DETECT] Using SITE_URL env:", siteUrl);
    return siteUrl;
  }

  // Fallback: localhost (development default)
  console.log("[ORIGIN-DETECT] Fallback to localhost");
  return 'http://localhost:5173';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Function started");
    
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY is not set");
      throw new Error("Stripe secret key not configured");
    }
    console.log("Stripe key found");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    if (!authHeader) {
      throw new Error("No authorization header");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");
    console.log("User authenticated:", user.email);

    const requestBody = await req.json();
    const { points } = requestBody;
    if (!points || points <= 0) {
      throw new Error("Invalid points amount");
    }
    console.log("Points requested:", points);
    
    const totalAmountCents = points * 100; // 1 point = $1, so convert to cents

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Get app origin for redirect URLs
    const appOrigin = getAppOrigin(req);

    // Create one-time payment checkout for points
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "sgd",
            product_data: {
              name: `${points} Points Top-up`,
              description: `Add ${points} points to your wallet balance (S$${points})`
            },
            unit_amount: totalAmountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${appOrigin}/thank-you?type=topup&amount=${points}`,
      cancel_url: `${appOrigin}/admin-dashboard?topup=cancelled`,
      metadata: {
        user_id: user.id,
        points: points.toString(),
        type: "points_topup"
      }
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in create-points-checkout:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});