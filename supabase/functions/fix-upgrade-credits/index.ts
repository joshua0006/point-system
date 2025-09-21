import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, missingCredits, description } = await req.json();
    
    if (!userId || !missingCredits) {
      return new Response(JSON.stringify({ error: "Missing userId or missingCredits" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Add the missing credits
    const { error: creditError } = await supabase.rpc('increment_flexi_credits_balance', {
      user_id: userId,
      credits_to_add: missingCredits
    });

    if (creditError) {
      console.error("Error adding credits:", creditError);
      throw creditError;
    }

    // Log the correction transaction
    const { error: transactionError } = await supabase
      .from('flexi_credits_transactions')
      .insert({
        user_id: userId,
        type: 'admin_credit',
        amount: missingCredits,
        description: description || `Correction: Missing upgrade credits (+${missingCredits})`
      });

    if (transactionError) {
      console.error("Error logging transaction:", transactionError);
    }

    console.log(`Fixed missing credits: +${missingCredits} for user ${userId}`);

    return new Response(JSON.stringify({ 
      success: true, 
      creditsAdded: missingCredits,
      message: "Missing credits have been added"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error in fix-upgrade-credits:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});