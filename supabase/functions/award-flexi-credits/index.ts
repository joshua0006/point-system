import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
    const { userId, amount, reason, expiryDays } = await req.json();

    // Validate inputs
    if (!userId || !amount || !reason) {
      throw new Error('Missing required fields: userId, amount, reason');
    }
    
    if (!expiryDays || expiryDays <= 0) {
      throw new Error('Expiry days must be greater than 0');
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

    // Calculate expiration based on provided days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

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

    // Get admin details for email
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('user_id', user.id)
      .maybeSingle();

    const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Send email notification to user
    try {
      await resend.emails.send({
        from: 'Flexi Credits <credits@mail.themoneybees.co>',
        to: [targetUser.email],
        subject: `🎁 You've Been Awarded ${amount} Locked Flexi Credits!`,
        html: `
          <h1>Congratulations ${targetUser.full_name || 'there'}!</h1>
          <p>You have been awarded <strong>${amount} locked flexi credits</strong>.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Award Details</h2>
            <p><strong>Amount:</strong> ${amount} FXC</p>
            <p><strong>Status:</strong> Locked (50% can be unlocked when you top up)</p>
            <p><strong>Expires:</strong> ${expiryDate}</p>
            <p><strong>Reason:</strong> ${reason}</p>
          </div>
          
          <h3>How to Unlock Your Credits:</h3>
          <ol>
            <li>Top up your account with any amount (minimum $10)</li>
            <li>During checkout, you can unlock up to 50% of your locked credits</li>
            <li>The unlocked credits will be immediately added to your balance</li>
          </ol>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Remember, these credits will expire on ${expiryDate} if not unlocked.
          </p>
          
          <p>Best regards,<br>The Flexi Credits Team</p>
        `,
      });

      console.log('User notification email sent successfully');
    } catch (emailError) {
      console.error('Failed to send user email:', emailError);
    }

    // Send email notification to admin
    if (adminProfile?.email) {
      try {
        await resend.emails.send({
          from: 'Flexi Credits Admin <admin@mail.themoneybees.co>',
          to: [adminProfile.email],
          subject: `✅ Awarded ${amount} Flexi Credits to ${targetUser.full_name || targetUser.email}`,
          html: `
            <h1>Credits Awarded Successfully</h1>
            <p>You have successfully awarded locked flexi credits to a user.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0;">Award Summary</h2>
              <p><strong>Recipient:</strong> ${targetUser.full_name || targetUser.email} (${targetUser.email})</p>
              <p><strong>Amount:</strong> ${amount} FXC</p>
              <p><strong>Expires:</strong> ${expiryDate}</p>
              <p><strong>Reason:</strong> ${reason}</p>
              <p><strong>Awarded By:</strong> ${adminProfile.full_name || adminProfile.email}</p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              The user can unlock up to 50% of these credits when they make their next top-up.
            </p>
            
            <p>Best regards,<br>The Flexi Credits System</p>
          `,
        });

        console.log('Admin notification email sent successfully');
      } catch (emailError) {
        console.error('Failed to send admin email:', emailError);
      }
    }

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