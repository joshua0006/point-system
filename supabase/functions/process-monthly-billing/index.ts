import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MONTHLY-BILLING] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Monthly billing process started");

    // Use service role to bypass RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    logStep("Processing billing for date", { date: today });

    // Get all participants due for billing today
    const { data: participantsDue, error: fetchError } = await supabase
      .from('campaign_participants')
      .select(`
        *,
        lead_gen_campaigns (*)
      `)
      .eq('billing_status', 'active')
      .lte('next_billing_date', today);

    if (fetchError) {
      logStep("Error fetching participants", { error: fetchError });
      throw fetchError;
    }

    logStep(`Found ${participantsDue?.length || 0} participants due for billing`);

    let processedCount = 0;
    let failedCount = 0;

    for (const participant of participantsDue || []) {
      try {
        logStep("Processing participant", { 
          id: participant.id, 
          user_id: participant.user_id,
          amount: participant.budget_contribution 
        });

        // Get user's current points balance
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('points_balance')
          .eq('user_id', participant.user_id)
          .single();

        if (profileError) {
          logStep("Error fetching user profile", { error: profileError });
          throw profileError;
        }

        const currentBalance = profile.points_balance;
        const billingAmount = participant.budget_contribution;

        if (currentBalance < billingAmount) {
          logStep("Insufficient balance - pausing campaign", { 
            balance: currentBalance, 
            required: billingAmount 
          });

          // Pause the participant due to insufficient funds
          await supabase
            .from('campaign_participants')
            .update({ 
              billing_status: 'paused_insufficient_funds',
              updated_at: new Date().toISOString()
            })
            .eq('id', participant.id);

          failedCount++;
          continue;
        }

        // Deduct points from user's balance
        const { error: deductError } = await supabase.rpc('increment_points_balance', {
          user_id: participant.user_id,
          points_to_add: -billingAmount
        });

        if (deductError) {
          logStep("Error deducting points", { error: deductError });
          throw deductError;
        }

        // Create billing transaction record
        const { error: transactionError } = await supabase
          .from('monthly_billing_transactions')
          .insert({
            participant_id: participant.id,
            campaign_id: participant.campaign_id,
            user_id: participant.user_id,
            amount: billingAmount,
            billing_date: today,
            status: 'completed'
          });

        if (transactionError) {
          logStep("Error creating transaction record", { error: transactionError });
          throw transactionError;
        }

        // Create points transaction record
        const { error: pointsTransactionError } = await supabase
          .from('points_transactions')
          .insert({
            user_id: participant.user_id,
            type: 'deduction',
            amount: billingAmount,
            description: `Monthly billing for campaign: ${participant.campaign_id}`
          });

        if (pointsTransactionError) {
          logStep("Error creating points transaction", { error: pointsTransactionError });
          throw pointsTransactionError;
        }

        // Update participant's next billing date (next month)
        const nextBillingDate = new Date();
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        nextBillingDate.setDate(participant.billing_cycle_day || 1);

        const { error: updateError } = await supabase
          .from('campaign_participants')
          .update({
            next_billing_date: nextBillingDate.toISOString().split('T')[0],
            last_billed_date: today,
            updated_at: new Date().toISOString()
          })
          .eq('id', participant.id);

        if (updateError) {
          logStep("Error updating participant", { error: updateError });
          throw updateError;
        }

        logStep("Successfully processed participant billing", { 
          participantId: participant.id,
          amount: billingAmount,
          nextBilling: nextBillingDate.toISOString().split('T')[0]
        });

        processedCount++;

      } catch (error) {
        logStep("Error processing participant", { 
          participantId: participant.id, 
          error: error.message 
        });
        failedCount++;
      }
    }

    logStep("Monthly billing process completed", { 
      processed: processedCount, 
      failed: failedCount,
      total: participantsDue?.length || 0 
    });

    return new Response(JSON.stringify({
      success: true,
      processed: processedCount,
      failed: failedCount,
      total: participantsDue?.length || 0
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in monthly billing", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});