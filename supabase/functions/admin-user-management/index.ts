import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

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

    // Check if user is admin or master admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (profileError || !profile || !['admin', 'master_admin'].includes(profile?.role)) {
      logStep("Access denied", { userId: user.id, role: profile?.role, error: profileError?.message });
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep("Admin access verified", { userId: user.id });

    const { action, userId, points, status, reason, amount, dayOfMonth, deductToday, startDate } = await req.json();

    if (action === 'list_users') {
      // Fetch all users with their profiles
      const { data: profiles, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Error fetching users: ${error.message}`);

      // Fetch awarded credits for all users
      const { data: awardedCredits } = await supabaseClient
        .from('awarded_flexi_credits')
        .select('user_id, locked_amount')
        .eq('status', 'active');

      // Sum up locked amounts per user
      const awardedCreditsMap = new Map<string, number>();
      if (awardedCredits) {
        awardedCredits.forEach((credit: any) => {
          const current = awardedCreditsMap.get(credit.user_id) || 0;
          awardedCreditsMap.set(credit.user_id, current + Number(credit.locked_amount));
        });
      }

      // Add awarded credits to profiles
      const enrichedProfiles = profiles?.map(profile => ({
        ...profile,
        awarded_credits_locked: awardedCreditsMap.get(profile.user_id) || 0
      }));

      logStep("Users fetched", { count: enrichedProfiles?.length });
      
      return new Response(JSON.stringify({ users: enrichedProfiles }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === 'topup_points') {
      if (!userId || !points || points <= 0) {
        throw new Error("Valid userId and positive flexi credits amount required");
      }

      // Get current balance and user details first
      const { data: currentProfile, error: fetchError } = await supabaseClient
        .from('profiles')
        .select('flexi_credits_balance, email, full_name')
        .eq('user_id', userId)
        .single();

      if (fetchError) throw new Error(`Error fetching user profile: ${fetchError.message}`);

      // Get admin details for email notification
      const { data: adminProfile, error: adminError } = await supabaseClient
        .from('profiles')
        .select('email, full_name')
        .eq('user_id', user.id)
        .single();

      if (adminError) throw new Error(`Error fetching admin profile: ${adminError.message}`);

      // Update the user's flexi credits balance
      const newBalance = (currentProfile.flexi_credits_balance || 0) + points;
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({ flexi_credits_balance: newBalance })
        .eq('user_id', userId);

      if (updateError) throw new Error(`Error updating flexi credits: ${updateError.message}`);

      // Create a transaction record
      const { error: transactionError } = await supabaseClient
        .from('flexi_credits_transactions')
        .insert({
          user_id: userId,
          amount: points,
          type: 'admin_credit',
          description: `Admin credit - ${points} flexi credits added by admin: ${reason || 'No reason provided'}`
        });

      if (transactionError) throw new Error(`Error creating transaction: ${transactionError.message}`);

        // Send email notifications
        try {
          await supabaseClient.functions.invoke('send-admin-notification', {
            body: {
              type: 'points_added',
              userEmail: currentProfile.email,
              userName: currentProfile.full_name || currentProfile.email,
              adminEmail: adminProfile.email,
              adminName: adminProfile.full_name || adminProfile.email,
              amount: points,
              reason: reason || 'No reason provided',
              userBalance: newBalance
            }
          });
        logStep("Email notifications sent successfully");
      } catch (emailError: any) {
        logStep("Email notification failed", { error: emailError.message });
        // Don't fail the main operation if email fails
      }

      logStep("Flexi credits topped up", { userId, points });

      return new Response(JSON.stringify({ success: true, message: `${points} flexi credits added successfully` }), {
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
        throw new Error("Valid userId and positive flexi credits amount required");
      }

      // First, get current balance and user details to check if deduction is possible
      const { data: currentProfile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('flexi_credits_balance, email, full_name')
        .eq('user_id', userId)
        .single();

      if (profileError) throw new Error(`Error fetching user profile: ${profileError.message}`);

      // Get admin details for email notification
      const { data: adminProfile, error: adminError } = await supabaseClient
        .from('profiles')
        .select('email, full_name')
        .eq('user_id', user.id)
        .single();

      if (adminError) throw new Error(`Error fetching admin profile: ${adminError.message}`);

      // Deduct points by updating balance directly
      const newBalance = (currentProfile.flexi_credits_balance || 0) - points;
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({ flexi_credits_balance: newBalance })
        .eq('user_id', userId);

      if (updateError) throw new Error(`Error deducting flexi credits: ${updateError.message}`);

      // Create a transaction record
      const { error: transactionError } = await supabaseClient
        .from('flexi_credits_transactions')
        .insert({
          user_id: userId,
          amount: -points,
          type: 'refund',
          description: reason || 'No reason provided'
        });

      if (transactionError) throw new Error(`Error creating transaction: ${transactionError.message}`);

      // Send email notifications
      try {
        await supabaseClient.functions.invoke('send-admin-notification', {
          body: {
            type: 'points_deducted',
            userEmail: currentProfile.email,
            userName: currentProfile.full_name || currentProfile.email,
            adminEmail: adminProfile.email,
            adminName: adminProfile.full_name || adminProfile.email,
            amount: points,
            reason: reason || 'No reason provided',
            userBalance: newBalance
          }
        });
        logStep("Email notifications sent successfully");
      } catch (emailError: any) {
        logStep("Email notification failed", { error: emailError.message });
        // Don't fail the main operation if email fails
      }

      logStep("Flexi credits deducted", { userId, points, reason });

      return new Response(JSON.stringify({ 
        success: true, 
        message: `${points} flexi credits deducted successfully`,
        newBalance: newBalance
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === 'delete_user') {
      if (!userId || !reason) {
        throw new Error("Valid userId and reason required");
      }

      // Check if user exists and get their info
      const { data: userProfile, error: fetchError } = await supabaseClient
        .from('profiles')
        .select('role, email, full_name, user_id')
        .eq('user_id', userId)
        .single();

      if (fetchError) throw new Error(`Error fetching user profile: ${fetchError.message}`);
      
      // Prevent users from deleting themselves
      if (userProfile.user_id === user.id) {
        throw new Error("Cannot delete your own account");
      }

      // Only master_admin can delete admin users, regular admins cannot
      if (userProfile.role === 'admin' && profile.role !== 'master_admin') {
        throw new Error("Only master admin can delete admin users");
      }

      // Master admins cannot delete other master admins (safety measure)
      if (userProfile.role === 'master_admin') {
        throw new Error("Cannot delete master admin users");
      }

      // Delete the user profile first (this will cascade delete related records)
      const { error: deleteError } = await supabaseClient
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw new Error(`Error deleting user profile: ${deleteError.message}`);

      // Delete from auth.users using admin API to prevent orphaned auth accounts
      const { error: authDeleteError } = await supabaseClient.auth.admin.deleteUser(
        userId
      );

      if (authDeleteError) {
        console.error('Error deleting auth user:', authDeleteError);
        // Profile is already deleted, log error but don't fail the operation
      }

      logStep("User deleted completely", { userId, userEmail: userProfile.email, reason, deletedBy: user.id });

      return new Response(JSON.stringify({ 
        success: true, 
        message: `User ${userProfile.full_name || userProfile.email} deleted successfully` 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === 'setup_recurring_deduction') {
      if (!userId || !amount || amount <= 0 || !dayOfMonth || !reason) {
        throw new Error("Valid userId, amount, dayOfMonth, and reason required");
      }

      // Validate day of month
      if (dayOfMonth < 1 || dayOfMonth > 28) {
        throw new Error("Day of month must be between 1 and 28");
      }

      // If deductToday is true, perform immediate deduction
      if (deductToday === true) {
        // Fetch user profile
        const { data: userProfile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('flexi_credits_balance, email, full_name')
          .eq('user_id', userId)
          .single();

        if (profileError) throw new Error(`Error fetching user profile: ${profileError.message}`);

        const currentBalance = userProfile.flexi_credits_balance || 0;
        const newBalance = parseFloat((currentBalance - amount).toFixed(1));

        // Check balance limit
        if (newBalance < -500) {
          throw new Error(`Deduction would result in balance of ${newBalance}, which is below the minimum allowed balance of -500`);
        }

        // Deduct the points
        const { error: deductError } = await supabaseClient.rpc('increment_flexi_credits_balance', {
          user_id: userId,
          credits_to_add: -amount
        });

        if (deductError) throw new Error(`Error deducting points: ${deductError.message}`);

        // Log the transaction
        const { error: transactionError } = await supabaseClient
          .from('flexi_credits_transactions')
          .insert({
            user_id: userId,
            type: 'admin_deduction',
            amount: -amount,
            description: `Admin deduction (immediate): ${reason.trim()}`
          });

        if (transactionError) throw new Error(`Error logging transaction: ${transactionError.message}`);

        logStep("Immediate deduction performed", { userId, amount, newBalance });
      }

      // Calculate next billing date from the provided start date or default to next month
      let nextBillingDate: string;
      if (startDate) {
        const selectedDate = new Date(startDate);
        selectedDate.setDate(dayOfMonth);
        nextBillingDate = selectedDate.toISOString().split('T')[0];
      } else {
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, dayOfMonth);
        nextBillingDate = nextMonth.toISOString().split('T')[0];
      }

      // Create recurring deduction record
      const { error: insertError } = await supabaseClient
        .from('admin_recurring_deductions')
        .insert({
          user_id: userId,
          amount: amount,
          reason: reason.trim(),
          day_of_month: dayOfMonth,
          created_by: user.id,
          next_billing_date: nextBillingDate,
          status: 'active'
        });

      if (insertError) throw new Error(`Error setting up recurring deduction: ${insertError.message}`);

      logStep("Recurring deduction setup", { userId, amount, dayOfMonth, deductToday });

      // Fetch user details for email notification
      const { data: userProfile, error: userProfileError } = await supabaseClient
        .from('profiles')
        .select('email, full_name')
        .eq('user_id', userId)
        .single();

      if (userProfileError) {
        console.error("Error fetching user profile for email notification:", userProfileError);
      }

      // Fetch admin details for email notification
      const { data: adminProfile, error: adminProfileError } = await supabaseClient
        .from('profiles')
        .select('email, full_name')
        .eq('user_id', user.id)
        .single();

      if (adminProfileError) {
        console.error("Error fetching admin profile for email notification:", adminProfileError);
      }

      // Send email notifications
      if (userProfile && adminProfile) {
        try {
          const notificationResponse = await fetch(
            `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-recurring-deduction-notification`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
              },
              body: JSON.stringify({
                userId,
                userEmail: userProfile.email,
                userName: userProfile.full_name || 'User',
                amount,
                reason: reason.trim(),
                dayOfMonth,
                nextBillingDate,
                adminEmail: adminProfile.email,
                adminName: adminProfile.full_name || 'Admin',
                immediateDeduction: deductToday === true
              })
            }
          );

          if (!notificationResponse.ok) {
            console.error('Failed to send email notifications:', await notificationResponse.text());
          } else {
            logStep("Email notifications sent successfully");
          }
        } catch (emailError) {
          console.error('Error sending email notifications:', emailError);
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: `Recurring deduction of ${amount} flexi credits set up successfully${deductToday ? ' with immediate deduction' : ''}`,
        nextBillingDate,
        immediateDeduction: deductToday
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === 'update_recurring_deduction') {
      const { deductionId, amount, reason, dayOfMonth, nextBillingDate, status } = await req.json();
      
      if (!deductionId || !amount || amount <= 0 || !dayOfMonth || !reason || !nextBillingDate || !status) {
        throw new Error("Valid deductionId, amount, dayOfMonth, reason, nextBillingDate, and status required");
      }

      // Validate day of month
      if (dayOfMonth < 1 || dayOfMonth > 28) {
        throw new Error("Day of month must be between 1 and 28");
      }

      // Parse and format the billing date
      const billingDate = new Date(nextBillingDate).toISOString().split('T')[0];

      // Update the recurring deduction
      const { error: updateError } = await supabaseClient
        .from('admin_recurring_deductions')
        .update({
          amount: amount,
          reason: reason.trim(),
          day_of_month: dayOfMonth,
          next_billing_date: billingDate,
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', deductionId);

      if (updateError) throw new Error(`Error updating recurring deduction: ${updateError.message}`);

      logStep("Recurring deduction updated", { deductionId, amount, dayOfMonth, status });

      return new Response(JSON.stringify({ 
        success: true, 
        message: `Recurring deduction updated successfully`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === 'toggle_hide_user') {
      if (!userId) {
        throw new Error("Valid userId required");
      }

      // Get current hidden status
      const { data: currentProfile, error: fetchError } = await supabaseClient
        .from('profiles')
        .select('is_hidden, role, email, full_name')
        .eq('user_id', userId)
        .single();

      if (fetchError) throw new Error(`Error fetching user profile: ${fetchError.message}`);

      // Prevent hiding admins or master admins
      if (currentProfile.role === 'admin' || currentProfile.role === 'master_admin') {
        throw new Error("Cannot hide admin users");
      }

      // Prevent users from hiding themselves
      if (userId === user.id) {
        throw new Error("Cannot hide your own account");
      }

      // Toggle the hidden status
      const newHiddenStatus = !currentProfile.is_hidden;
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({ is_hidden: newHiddenStatus })
        .eq('user_id', userId);

      if (updateError) throw new Error(`Error toggling user hidden status: ${updateError.message}`);

      logStep("User hidden status toggled", { 
        userId, 
        userEmail: currentProfile.email, 
        newStatus: newHiddenStatus ? 'hidden' : 'visible',
        toggledBy: user.id 
      });

      return new Response(JSON.stringify({ 
        success: true, 
        message: `User ${newHiddenStatus ? 'hidden' : 'unhidden'} successfully`,
        isHidden: newHiddenStatus
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