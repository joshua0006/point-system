import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Create Supabase client with service role key to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      throw new Error("No stripe signature header");
    }

    // Note: In production, you should verify the webhook signature
    // const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    
    // For now, we'll parse the body directly (add signature verification in production)
    const event = JSON.parse(body);
    
    logStep("Event received", { type: event.type, id: event.id });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      logStep("Processing checkout session", { sessionId: session.id });

      // Extract metadata from the session
      const userId = session.metadata?.user_id;
      const pointsToAdd = parseInt(session.metadata?.points || "0");

      if (!userId || !pointsToAdd) {
        logStep("Missing metadata", { userId, pointsToAdd });
        throw new Error("Missing user_id or points in session metadata");
      }

      logStep("Adding points to user", { userId, pointsToAdd });

      // Add points to user's balance using the existing database function
      const { error: pointsError } = await supabaseClient.rpc('increment_flexi_credits_balance', {
        user_id: userId,
        credits_to_add: pointsToAdd
      });

      if (pointsError) {
        logStep("Error adding points", pointsError);
        throw pointsError;
      }

      // Create a transaction record for audit trail
      const { error: transactionError } = await supabaseClient
        .from('flexi_credits_transactions')
        .insert({
          user_id: userId,
          type: 'purchase',
          amount: pointsToAdd,
          description: `Stripe Checkout payment - Session ${session.id}`
        });

      if (transactionError) {
        logStep("Error creating transaction record", transactionError);
        // Don't throw here - points were already added, transaction record is just for audit
      }

      logStep("Successfully processed checkout", { userId, pointsToAdd, sessionId: session.id });
    }

    // Handle subscription payments
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object;
      logStep("Processing invoice payment", { invoiceId: invoice.id });

      // Get subscription details
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
      logStep("Retrieved subscription", { subscriptionId: subscription.id });

      // Find user by customer email
      const customer = await stripe.customers.retrieve(invoice.customer);
      const customerEmail = customer.email;
      
      if (!customerEmail) {
        logStep("No customer email found", { customerId: invoice.customer });
        throw new Error("No customer email found");
      }

      // Find user profile by email
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('user_id')
        .eq('email', customerEmail)
        .single();

      if (profileError || !profile) {
        logStep("User profile not found", { email: customerEmail, error: profileError });
        throw new Error(`User profile not found for email: ${customerEmail}`);
      }

      // Get credits amount from subscription metadata or line items
      const lineItem = invoice.lines.data[0];
      const creditsToAdd = parseInt(subscription.metadata?.credits || lineItem.quantity || "0");

      if (!creditsToAdd) {
        logStep("No credits amount found", { subscriptionMetadata: subscription.metadata, lineItem: lineItem.quantity });
        throw new Error("No credits amount found in subscription");
      }

      logStep("Adding subscription credits to user", { userId: profile.user_id, creditsToAdd });

      // Add credits to user's balance
      const { error: creditsError } = await supabaseClient.rpc('increment_flexi_credits_balance', {
        user_id: profile.user_id,
        credits_to_add: creditsToAdd
      });

      if (creditsError) {
        logStep("Error adding subscription credits", creditsError);
        throw creditsError;
      }

      // Create a transaction record
      const { error: transactionError } = await supabaseClient
        .from('flexi_credits_transactions')
        .insert({
          user_id: profile.user_id,
          type: 'purchase',
          amount: creditsToAdd,
          description: `Monthly subscription - Invoice ${invoice.id}`
        });

      if (transactionError) {
        logStep("Error creating subscription transaction record", transactionError);
      }

      logStep("Successfully processed subscription payment", { userId: profile.user_id, creditsToAdd, invoiceId: invoice.id });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Webhook error", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});