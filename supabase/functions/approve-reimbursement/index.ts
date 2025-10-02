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
      console.log(`[APPROVE] Starting approval process for request ${requestId}`);
      
      // Update request status
      const { error: updateError } = await supabase
        .from("reimbursement_requests")
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateError) {
        console.error("[APPROVE] Error updating request status:", updateError);
        throw new Error(`Failed to update request status: ${updateError.message}`);
      }
      console.log(`[APPROVE] Request status updated to approved`);

      // Reduce user's flexi credits balance
      console.log(`[APPROVE] Reducing flexi credits by ${request.amount} for user ${request.user_id}`);
      const { error: creditsError } = await supabase.rpc('increment_flexi_credits_balance', {
        user_id: request.user_id,
        credits_to_add: -request.amount
      });

      if (creditsError) {
        console.error("[APPROVE] Error reducing flexi credits:", creditsError);
        // Rollback the approval
        await supabase
          .from("reimbursement_requests")
          .update({ status: 'pending', approved_by: null, approved_at: null })
          .eq("id", requestId);
        throw new Error(`Failed to reduce flexi credits: ${creditsError.message}`);
      }
      console.log(`[APPROVE] Flexi credits reduced successfully`);

      // Create transaction record
      const { error: transactionError } = await supabase
        .from("flexi_credits_transactions")
        .insert({
          user_id: request.user_id,
          type: 'admin_deduction',
          amount: request.amount,
          description: `Reimbursement approved for ${request.merchant}`,
        });

      if (transactionError) {
        console.error("[APPROVE] Error creating transaction:", transactionError);
      } else {
        console.log(`[APPROVE] Transaction record created`);
      }

      // Send approval email via dedicated function
      try {
        // Fetch profile for email
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('user_id', request.user_id)
          .single();

        if (profileError) {
          console.error('[APPROVE] Error fetching profile for email:', profileError);
        } else if (profile?.email) {
          const { data: emailResult, error: emailInvokeError } = await supabase.functions.invoke('send-reimbursement-notification', {
            body: {
              userEmail: profile.email,
              userName: profile.full_name || '',
              merchant: request.merchant,
              amount: request.amount,
              requestId: request.id,
              status: 'approved'
            }
          });
          if (emailInvokeError) {
            console.error('[APPROVE] Error invoking email function:', emailInvokeError);
          } else {
            console.log('[APPROVE] Approval email sent via function:', emailResult);
          }
        } else {
          console.log(`[APPROVE] No email found for user ${request.user_id}`);
        }
      } catch (emailError: any) {
        console.error('[APPROVE] Error sending approval email via function:', emailError);
        // Don't fail the approval if email fails
      }

      console.log(`[APPROVE] Approval process completed successfully`);
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
