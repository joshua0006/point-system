import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CONFIRM-UPGRADE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id } = await req.json();
    if (!session_id) {
      return new Response(JSON.stringify({ error: "Missing session_id" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    logStep("Retrieving checkout session", { session_id });
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (!session || session.payment_status !== "paid") {
      logStep("Session not paid or not found", { payment_status: session?.payment_status });
      return new Response(JSON.stringify({ success: false, message: "Session not paid yet" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (session.mode !== "payment" || session.metadata?.upgrade_type !== "subscription_change") {
      logStep("Not an upgrade payment", { mode: session.mode, metadata: session.metadata });
      return new Response(JSON.stringify({ success: false, message: "Not an upgrade session" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const userId = session.metadata.user_id;
    const oldCredits = parseInt(session.metadata.old_credits || "0");
    const newCredits = parseInt(session.metadata.new_credits || "0");
    const planName = session.metadata.plan_name || `Pro ${Math.ceil(newCredits / 100)}`;
    const upgradeCredits = newCredits - oldCredits;

    if (!userId || !upgradeCredits || upgradeCredits <= 0) {
      logStep("Invalid metadata to compute upgrade", { userId, oldCredits, newCredits, upgradeCredits });
      return new Response(JSON.stringify({ success: false, message: "Invalid upgrade details" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Prevent duplicate processing
    const { data: existing } = await supabase
      .from("flexi_credits_transactions")
      .select("id")
      .eq("description", `Plan upgrade credits - Session ${session.id}`)
      .maybeSingle();

    if (existing) {
      logStep("Upgrade already processed", { trxId: existing.id });
      return new Response(JSON.stringify({
        success: true,
        message: "Already processed",
        upgradeCredits,
        planName,
        transactionId: existing.id
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Add credits
    const { error: creditsError } = await supabase.rpc("increment_flexi_credits_balance", {
      user_id: userId,
      credits_to_add: upgradeCredits,
    });

    if (creditsError) {
      logStep("Failed to add credits", { error: creditsError.message });
      return new Response(JSON.stringify({ success: false, error: creditsError.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Log transaction and capture ID
    const { data: transaction, error: trxError } = await supabase
      .from("flexi_credits_transactions")
      .insert({
        user_id: userId,
        amount: upgradeCredits,
        type: "purchase",
        description: `Plan upgrade credits - Session ${session.id}`,
      })
      .select('id')
      .single();

    if (trxError) {
      logStep("Failed to log transaction", { error: trxError.message });
      return new Response(JSON.stringify({
        success: false,
        error: `Transaction creation failed: ${trxError.message}`
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const transactionId = transaction?.id || null;
    logStep("Upgrade confirmed and credits added", { userId, upgradeCredits, planName, transactionId });

    const responsePayload = { success: true, upgradeCredits, planName, transactionId };
    console.log('[CONFIRM-UPGRADE] Returning response:', responsePayload);

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    logStep("Unhandled error", { error: err.message });
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});