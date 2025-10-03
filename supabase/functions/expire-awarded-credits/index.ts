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

    const now = new Date().toISOString();

    // Find expired awarded credits
    const { data: expiredCredits, error: fetchError } = await supabase
      .from('awarded_flexi_credits')
      .select('*, profiles!awarded_flexi_credits_user_id_fkey(email, full_name)')
      .eq('status', 'active')
      .lt('expires_at', now);

    if (fetchError) {
      throw new Error(`Failed to fetch expired credits: ${fetchError.message}`);
    }

    if (!expiredCredits || expiredCredits.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No expired credits found',
          expired_count: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update status to expired
    const expiredIds = expiredCredits.map(ec => ec.id);
    const { error: updateError } = await supabase
      .from('awarded_flexi_credits')
      .update({ status: 'expired', updated_at: now })
      .in('id', expiredIds);

    if (updateError) {
      throw new Error(`Failed to update expired credits: ${updateError.message}`);
    }

    // Send notifications for credits that had locked amounts
    const creditsWithLockedAmount = expiredCredits.filter(ec => Number(ec.locked_amount) > 0);
    
    for (const credit of creditsWithLockedAmount) {
      // TODO: Send email notification using existing email system
      console.log(`Notifying user ${credit.user_id} about ${credit.locked_amount} expired credits`);
      
      // For now, just log it. In production, integrate with send-subscription-emails or similar
    }

    // Also check for soon-to-expire credits (7, 3, 1 days before expiration)
    const daysToCheck = [7, 3, 1];
    
    for (const days of daysToCheck) {
      const checkDate = new Date();
      checkDate.setDate(checkDate.getDate() + days);
      const startOfDay = new Date(checkDate.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(checkDate.setHours(23, 59, 59, 999)).toISOString();

      const { data: expiringCredits, error: expiringError } = await supabase
        .from('awarded_flexi_credits')
        .select('*, profiles!awarded_flexi_credits_user_id_fkey(email, full_name)')
        .eq('status', 'active')
        .gt('locked_amount', 0)
        .gte('expires_at', startOfDay)
        .lte('expires_at', endOfDay);

      if (!expiringError && expiringCredits && expiringCredits.length > 0) {
        for (const credit of expiringCredits) {
          // TODO: Send warning email
          console.log(`Warning user ${credit.user_id}: ${credit.locked_amount} credits expire in ${days} days`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${expiredCredits.length} expired credits`,
        expired_count: expiredCredits.length,
        credits_with_locked_amount: creditsWithLockedAmount.length,
        details: creditsWithLockedAmount.map(c => ({
          user_id: c.user_id,
          amount_locked: c.locked_amount,
          expired_at: c.expires_at
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in expire-awarded-credits:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});