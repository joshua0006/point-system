import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-USER-MANAGEMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Initialize Supabase client with service role for admin operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Also create anon client for user authentication
    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    // Verify user is admin
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAnon.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      throw new Error("Insufficient permissions - admin access required");
    }

    logStep("Admin access verified", { userId: user.id });

    const { action, userId, points, status, reason } = await req.json();

    if (action === 'list_users') {
      // Fetch all users with their profiles
      const { data: profiles, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Error fetching users: ${error.message}`);

      logStep("Users fetched", { count: profiles?.length });
      
      return new Response(JSON.stringify({ users: profiles }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === 'topup_points') {
      if (!userId || !points || points <= 0) {
        throw new Error("Valid userId and positive points amount required");
      }

      // Update the user's points balance
      const { error: updateError } = await supabaseClient.rpc('increment_points_balance', {
        user_id: userId,
        points_to_add: points
      });

      if (updateError) throw new Error(`Error updating points: ${updateError.message}`);

      // Create a transaction record
      const { error: transactionError } = await supabaseClient
        .from('points_transactions')
        .insert({
          user_id: userId,
          amount: points,
          type: 'admin_credit',
          description: `Admin credit - ${points} points added by admin`
        });

      if (transactionError) throw new Error(`Error creating transaction: ${transactionError.message}`);

      logStep("Points topped up", { userId, points });

      return new Response(JSON.stringify({ success: true, message: `${points} points added successfully` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === 'approve_user') {
      if (!userId || !status || !['approved', 'rejected'].includes(status)) {
        throw new Error("Valid userId and status (approved/rejected) required");
      }

      // Update user approval status
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({
          approval_status: status,
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) throw new Error(`Error updating approval status: ${updateError.message}`);

      logStep("User approval status updated", { userId, status, approvedBy: user.id });

      return new Response(JSON.stringify({ 
        success: true, 
        message: `User ${status} successfully` 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === 'list_pending_users') {
      // Fetch only pending users
      const { data: profiles, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Error fetching pending users: ${error.message}`);

      logStep("Pending users fetched", { count: profiles?.length });
      
      return new Response(JSON.stringify({ users: profiles }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === 'revoke_access') {
      if (!userId || !reason) {
        throw new Error("Valid userId and reason required");
      }

      // Update user approval status to rejected and set approval reason
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({
          approval_status: 'rejected',
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) throw new Error(`Error revoking access: ${updateError.message}`);

      logStep("User access revoked", { userId, reason, revokedBy: user.id });

      return new Response(JSON.stringify({ 
        success: true, 
        message: `User access revoked successfully` 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === 'deduct_points') {
      if (!userId || !points || points <= 0) {
        throw new Error("Valid userId and positive points amount required");
      }

      // First, get current balance to check if deduction is possible
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('points_balance')
        .eq('user_id', userId)
        .single();

      if (profileError) throw new Error(`Error fetching user profile: ${profileError.message}`);

      if (profile.points_balance < points) {
        throw new Error(`Insufficient balance. User has ${profile.points_balance} points, cannot deduct ${points}`);
      }

      // Deduct points (negative increment)
      const { error: updateError } = await supabaseClient.rpc('increment_points_balance', {
        user_id: userId,
        points_to_add: -points
      });

      if (updateError) throw new Error(`Error deducting points: ${updateError.message}`);

      // Create a transaction record
      const { error: transactionError } = await supabaseClient
        .from('points_transactions')
        .insert({
          user_id: userId,
          amount: -points,
          type: 'admin_debit',
          description: `Admin deduction - ${points} points deducted by admin: ${reason || 'No reason provided'}`
        });

      if (transactionError) throw new Error(`Error creating transaction: ${transactionError.message}`);

      logStep("Points deducted", { userId, points, reason });

      return new Response(JSON.stringify({ 
        success: true, 
        message: `${points} points deducted successfully`,
        newBalance: profile.points_balance - points
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error("Invalid action");

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});