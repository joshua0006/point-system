import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile || !['admin', 'master_admin'].includes(profile.role)) {
      throw new Error("Unauthorized: Admin access required");
    }

    const { requestId, action, rejectionReason } = await req.json();

    if (!requestId || !action) {
      throw new Error("Missing required fields");
    }

    if (action !== 'approve' && action !== 'reject') {
      throw new Error("Invalid action");
    }

    // Get the reimbursement request
    const { data: request, error: requestError } = await supabase
      .from("reimbursement_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (requestError || !request) {
      throw new Error("Reimbursement request not found");
    }

    if (request.status !== 'pending') {
      throw new Error("Request has already been processed");
    }

    if (action === 'approve') {
      // Update request status
      const { error: updateError } = await supabase
        .from("reimbursement_requests")
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateError) throw updateError;

      // Reduce user's flexi credits balance
      const { error: creditsError } = await supabase.rpc('increment_flexi_credits_balance', {
        user_id: request.user_id,
        credits_to_add: -request.amount
      });

      if (creditsError) {
        console.error("Error reducing flexi credits:", creditsError);
        // Rollback the approval
        await supabase
          .from("reimbursement_requests")
          .update({ status: 'pending', approved_by: null, approved_at: null })
          .eq("id", requestId);
        throw new Error("Failed to reduce flexi credits balance");
      }

      // Create transaction record
      const { error: transactionError } = await supabase
        .from("flexi_credits_transactions")
        .insert({
          user_id: request.user_id,
          type: 'debit',
          amount: request.amount,
          description: `Reimbursement approved for ${request.merchant}`,
        });

      if (transactionError) {
        console.error("Error creating transaction:", transactionError);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Reimbursement approved successfully" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Reject
      if (!rejectionReason || !rejectionReason.trim()) {
        throw new Error("Rejection reason is required");
      }

      const { error: updateError } = await supabase
        .from("reimbursement_requests")
        .update({
          status: 'rejected',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          rejection_reason: rejectionReason.trim(),
        })
        .eq("id", requestId);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Reimbursement rejected successfully" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    console.error("Error in approve-reimbursement:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
