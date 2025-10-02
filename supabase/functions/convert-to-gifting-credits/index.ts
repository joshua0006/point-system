import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    console.log('[CONVERT] Incoming request', { hasAuth: !!authHeader, method: req.method });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError) {
      console.error('[CONVERT] auth.getUser error', userError);
    }

    // Derive userId either from Supabase auth or by decoding the JWT as a fallback
    let userId: string | null = user?.id ?? null;
    if (!userId && authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        userId = payload.sub || null;
        console.log('[CONVERT] Decoded userId from JWT', { hasUserId: !!userId });
      } catch (e) {
        console.error('[CONVERT] Failed to decode JWT', e);
      }
    }
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { amount } = await req.json();
    
    // Validate amount
    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const roundedAmount = Math.round(amount * 10) / 10;

    // Get current user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('flexi_credits_balance, gifting_credits_balance')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has enough flexi credits
    if (profile.flexi_credits_balance < roundedAmount) {
      return new Response(
        JSON.stringify({ error: 'Insufficient flexi credits' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Start transaction: Deduct flexi credits and add gifting credits
    const newFlexiBalance = profile.flexi_credits_balance - roundedAmount;
    const newGiftingBalance = profile.gifting_credits_balance + roundedAmount;

    // Update profile balances
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        flexi_credits_balance: newFlexiBalance,
        gifting_credits_balance: newGiftingBalance,
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating balances:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update balances' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record flexi credits deduction
    const { data: flexiTransaction, error: flexiTransError } = await supabaseClient
      .from('flexi_credits_transactions')
      .insert({
        user_id: userId,
        type: 'refund',
        amount: -roundedAmount,
        description: `Converted to gifting credits: ${roundedAmount} credits`,
      })
      .select()
      .single();

    if (flexiTransError) {
      console.error('Error creating flexi transaction:', flexiTransError);
    }

    // Record gifting credits addition
    const { data: giftingTransaction, error: giftingTransError } = await supabaseClient
      .from('gifting_credits_transactions')
      .insert({
        user_id: userId,
        amount: roundedAmount,
        transaction_type: 'conversion',
        description: `Converted from flexi credits: ${roundedAmount} credits`,
        reference_transaction_id: flexiTransaction?.id,
      })
      .select()
      .single();

    if (giftingTransError) {
      console.error('Error creating gifting transaction:', giftingTransError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        amount: roundedAmount,
        new_flexi_balance: newFlexiBalance,
        new_gifting_balance: newGiftingBalance,
        transaction_id: giftingTransaction?.id,
        conversion_reference: flexiTransaction?.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in convert-to-gifting-credits:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});