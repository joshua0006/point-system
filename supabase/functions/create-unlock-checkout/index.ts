import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const { paymentAmount, creditsToUnlock, lockedBalance } = await req.json();

    if (!paymentAmount || !creditsToUnlock || !lockedBalance) {
      throw new Error('paymentAmount, creditsToUnlock, and lockedBalance are required');
    }

    // Validate the unlock ratio (must be 2:1)
    const expectedCredits = Math.floor(paymentAmount / 2 * 10) / 10;
    if (Math.abs(creditsToUnlock - expectedCredits) > 0.1) {
      throw new Error(`Invalid unlock ratio. Payment of $${paymentAmount} should unlock ${expectedCredits} FXC`);
    }

    // Validate credits don't exceed locked balance
    if (creditsToUnlock > lockedBalance) {
      throw new Error(`Cannot unlock ${creditsToUnlock} FXC - only ${lockedBalance} FXC locked`);
    }

    // Get user from authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173';

    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: authHeader,
        'apikey': supabaseKey!,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get user');
    }

    const user = await userResponse.json();

    // Get or create Stripe customer
    const customerResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?user_id=eq.${user.id}&select=stripe_customer_id,email`, {
      headers: {
        Authorization: authHeader,
        'apikey': supabaseKey!,
        'Accept': 'application/vnd.pgrst.object+json',
      },
    });

    const profile = await customerResponse.json();
    let customerId = profile.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;

      await fetch(`${supabaseUrl}/rest/v1/profiles?user_id=eq.${user.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: authHeader,
          'apikey': supabaseKey!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stripe_customer_id: customerId }),
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'sgd',
            product_data: {
              name: 'Unlock Awarded Credits',
              description: `Unlock ${creditsToUnlock} FXC by paying SGD $${paymentAmount} (${lockedBalance} FXC locked)`,
            },
            unit_amount: Math.round(paymentAmount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${siteUrl}/dashboard?unlock_success=true`,
      cancel_url: `${siteUrl}/dashboard?unlock_cancelled=true`,
      metadata: {
        type: 'unlock_credits',
        user_id: user.id,
        locked_balance: lockedBalance.toString(),
        payment_amount: paymentAmount.toString(),
        credits_to_unlock: creditsToUnlock.toString(),
      },
    });

    console.log('Checkout session created:', session.id);

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating unlock checkout:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
