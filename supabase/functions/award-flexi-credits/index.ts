import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get JWT token from header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    // Verify admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile || !['admin', 'master_admin'].includes(profile.role)) {
      throw new Error('Admin access required');
    }

    // Parse request body
    const { userId, amount, reason } = await req.json();

    // Validate inputs
    if (!userId || !amount || !reason) {
      throw new Error('Missing required fields: userId, amount, reason');
    }

    if (amount <= 0 || amount > 10000) {
      throw new Error('Amount must be between 1 and 10000');
    }

    // Check if target user exists
    const { data: targetUser, error: userError } = await supabase
      .from('profiles')
      .select('user_id, email, full_name')
      .eq('user_id', userId)
      .single();

    if (userError || !targetUser) {
      throw new Error('User not found');
    }

    // Calculate expiration (1 year from now)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Insert awarded credit record
    const { data: awardedCredit, error: insertError } = await supabase
      .from('awarded_flexi_credits')
      .insert({
        user_id: userId,
        amount: amount,
        locked_amount: amount,
        unlocked_amount: 0,
        awarded_by: user.id,
        expires_at: expiresAt.toISOString(),
        status: 'active',
        reason: reason
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error(`Failed to award credits: ${insertError.message}`);
    }

    // Log admin activity
    await supabase
      .from('admin_activity_log')
      .insert({
        admin_id: user.id,
        action: 'award_flexi_credits',
        target_id: userId,
        details: { amount, reason, awarded_credit_id: awardedCredit.id }
      });

    // TODO: Send notification email to user (integrate with existing email system)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully awarded ${amount} flexi credits to ${targetUser.full_name || targetUser.email}`,
        data: {
          id: awardedCredit.id,
          amount: amount,
          expires_at: expiresAt.toISOString(),
          user: {
            email: targetUser.email,
            full_name: targetUser.full_name
          }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in award-flexi-credits:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});