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
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body
    const { topupAmount, topupTransactionId } = await req.json();

    if (!topupAmount || topupAmount <= 0) {
      throw new Error('Invalid top-up amount');
    }

    // Calculate max unlock amount (topup amount / 2)
    const maxUnlockFromTopup = Math.floor(topupAmount / 2);

    // If transaction ID provided, check how much has already been unlocked
    let alreadyUnlocked = 0;
    if (topupTransactionId) {
      const { data: existingUnlocks, error: existingError } = await supabase
        .from('awarded_credits_unlocks')
        .select('amount_unlocked')
        .eq('topup_transaction_id', topupTransactionId);

      if (!existingError && existingUnlocks) {
        alreadyUnlocked = existingUnlocks.reduce((sum, u) => sum + Number(u.amount_unlocked), 0);
      }
    }

    const remainingUnlockCapacity = maxUnlockFromTopup - alreadyUnlocked;

    // Get user's active awarded credits
    const { data: awardedCredits, error: creditsError } = await supabase
      .from('awarded_flexi_credits')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('locked_amount', 0)
      .order('awarded_date', { ascending: true });

    if (creditsError) {
      throw new Error('Failed to fetch awarded credits');
    }

    // Calculate total locked balance
    const totalLocked = awardedCredits.reduce((sum, ac) => sum + Number(ac.locked_amount), 0);

    // Find expiring credits (within 30 days)
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const expiringCredits = awardedCredits
      .filter(ac => new Date(ac.expires_at) <= thirtyDaysFromNow)
      .map(ac => ({
        id: ac.id,
        amount: Number(ac.locked_amount),
        expires_at: ac.expires_at,
        days_until_expiry: Math.floor((new Date(ac.expires_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      }));

    // Determine actual unlock amount (min of capacity and available locked)
    const actualUnlockAmount = Math.min(remainingUnlockCapacity, totalLocked);
    const canUnlock = actualUnlockAmount > 0;

    return new Response(
      JSON.stringify({
        canUnlock,
        maxUnlock: actualUnlockAmount,
        lockedBalance: totalLocked,
        topupAmount,
        maxUnlockFromTopup,
        alreadyUnlocked,
        expiringCredits,
        message: canUnlock 
          ? `You can unlock up to ${actualUnlockAmount} flexi credits with this top-up` 
          : totalLocked === 0 
            ? 'You have no locked awarded credits to unlock'
            : 'This top-up has already been fully used to unlock credits'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-awarded-credits-eligibility:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});