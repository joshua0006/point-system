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
    const { topupTransactionId, amountToUnlock } = await req.json();

    if (!topupTransactionId || !amountToUnlock) {
      throw new Error('Missing required fields: topupTransactionId, amountToUnlock');
    }

    if (amountToUnlock <= 0) {
      throw new Error('Amount to unlock must be greater than 0');
    }

    // Verify user owns the top-up transaction
    const { data: transaction, error: txError } = await supabase
      .from('flexi_credits_transactions')
      .select('*')
      .eq('id', topupTransactionId)
      .eq('user_id', user.id)
      .eq('type', 'credit')
      .single();

    if (txError || !transaction) {
      throw new Error('Top-up transaction not found or does not belong to you');
    }

    // Calculate max unlock amount (topup amount / 2)
    const maxUnlock = Math.floor(transaction.amount / 2);

    if (amountToUnlock > maxUnlock) {
      throw new Error(`You can only unlock up to ${maxUnlock} credits with this top-up`);
    }

    // Get user's active awarded credits (not expired, has locked amount) ordered by oldest first (FIFO)
    const { data: awardedCredits, error: creditsError } = await supabase
      .from('awarded_flexi_credits')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('locked_amount', 0)
      .lt('expires_at', new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString()) // Not expired
      .order('awarded_date', { ascending: true });

    if (creditsError) {
      throw new Error('Failed to fetch awarded credits');
    }

    const totalLocked = awardedCredits.reduce((sum, ac) => sum + Number(ac.locked_amount), 0);

    if (amountToUnlock > totalLocked) {
      throw new Error(`Insufficient locked awarded credits. Available: ${totalLocked}`);
    }

    // Check if this top-up was already used for unlocking
    const { data: existingUnlocks, error: existingError } = await supabase
      .from('awarded_credits_unlocks')
      .select('amount_unlocked')
      .eq('topup_transaction_id', topupTransactionId);

    if (existingError) {
      throw new Error('Failed to check existing unlocks');
    }

    const alreadyUnlocked = existingUnlocks.reduce((sum, u) => sum + Number(u.amount_unlocked), 0);
    const remainingCapacity = maxUnlock - alreadyUnlocked;

    if (amountToUnlock > remainingCapacity) {
      throw new Error(`This top-up can only unlock ${remainingCapacity} more credits`);
    }

    // Unlock credits from oldest to newest (FIFO)
    let remainingToUnlock = amountToUnlock;
    const unlockRecords = [];

    for (const award of awardedCredits) {
      if (remainingToUnlock <= 0) break;

      const unlockFromThis = Math.min(remainingToUnlock, Number(award.locked_amount));
      const newLockedAmount = Number(award.locked_amount) - unlockFromThis;
      const newUnlockedAmount = Number(award.unlocked_amount) + unlockFromThis;
      const newStatus = newLockedAmount === 0 ? 'fully_unlocked' : 'active';

      // Update awarded credit record
      const { error: updateError } = await supabase
        .from('awarded_flexi_credits')
        .update({
          locked_amount: newLockedAmount,
          unlocked_amount: newUnlockedAmount,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', award.id);

      if (updateError) {
        throw new Error(`Failed to update awarded credit: ${updateError.message}`);
      }

      // Insert unlock record
      const { error: insertError } = await supabase
        .from('awarded_credits_unlocks')
        .insert({
          user_id: user.id,
          awarded_credit_id: award.id,
          topup_transaction_id: topupTransactionId,
          amount_unlocked: unlockFromThis,
          topup_amount_used: unlockFromThis * 2 // 2:1 ratio
        });

      if (insertError) {
        throw new Error(`Failed to create unlock record: ${insertError.message}`);
      }

      unlockRecords.push({
        awarded_credit_id: award.id,
        amount: unlockFromThis
      });

      remainingToUnlock -= unlockFromThis;
    }

    // Add unlocked amount to user's main flexi credits balance
    const { error: balanceError } = await supabase.rpc('increment_flexi_credits_balance', {
      user_id: user.id,
      credits_to_add: amountToUnlock
    });

    if (balanceError) {
      throw new Error(`Failed to update balance: ${balanceError.message}`);
    }

    // Record transaction
    await supabase
      .from('flexi_credits_transactions')
      .insert({
        user_id: user.id,
        type: 'credit',
        amount: amountToUnlock,
        description: `Unlocked ${amountToUnlock} awarded flexi credits`
      });

    // Get updated balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('flexi_credits_balance')
      .eq('user_id', user.id)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully unlocked ${amountToUnlock} flexi credits`,
        data: {
          amount_unlocked: amountToUnlock,
          new_balance: profile?.flexi_credits_balance || 0,
          unlock_records: unlockRecords
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in unlock-awarded-credits:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});