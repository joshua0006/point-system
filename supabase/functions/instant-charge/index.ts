import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[INSTANT-CHARGE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const { payment_method_id, amount } = await req.json();
    if (!payment_method_id || !amount || amount < 250) {
      throw new Error("Invalid payment method ID or amount");
    }

    logStep("User authenticated", { userId: user.id, email: user.email, paymentMethodId: payment_method_id, amount });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get customer from Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      throw new Error("Customer not found");
    }

    const customerId = customers.data[0].id;
    logStep("Found customer", { customerId });

    // Create payment intent with saved payment method (including S$9 GST)
    const gstAmount = 900; // S$9 in cents
    const totalAmount = (amount * 100) + gstAmount; // Base amount + GST
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: "sgd",
      customer: customerId,
      payment_method: payment_method_id,
      confirmation_method: "automatic",
      confirm: true,
      off_session: true,
      description: `Points top-up: ${amount} points (S$${amount} + S$9 GST)`,
    });

    logStep("Payment intent created", { paymentIntentId: paymentIntent.id, status: paymentIntent.status });

    if (paymentIntent.status === "succeeded") {
      // Update user's points balance by incrementing current balance
      const { error: updateError } = await supabaseClient
        .rpc('increment_points_balance', { user_id: user.id, points_to_add: amount });

      if (updateError) {
        logStep("Error updating points balance", { error: updateError });
        // Continue with transaction recording even if balance update fails
      } else {
        logStep("Points balance updated successfully", { amount });
      }

      // Create transaction record
      await supabaseClient.from("points_transactions").insert({
        user_id: user.id,
        amount: amount,
        type: "purchase",
        description: `Instant top-up via saved payment method`,
      });

      return new Response(JSON.stringify({ 
        success: true, 
        payment_intent_id: paymentIntent.id,
        amount: amount
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      throw new Error(`Payment failed with status: ${paymentIntent.status}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in instant-charge", { message: errorMessage });
    
    // Handle specific Stripe errors
    if (error.type === "StripeCardError") {
      return new Response(JSON.stringify({ 
        error: "Your card was declined. Please try a different payment method.",
        decline_code: error.decline_code 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});