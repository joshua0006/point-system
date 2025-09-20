import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Create Supabase client with service role key to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      throw new Error("No stripe signature header");
    }

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    }

    // Verify webhook signature for security
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Webhook signature verified", { eventType: event.type });
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err.message });
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }
    
    logStep("Event received", { type: event.type, id: event.id });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      logStep("Processing checkout session", { sessionId: session.id, mode: session.mode });

      // Handle subscription upgrade payment
      if (session.mode === 'payment' && session.metadata?.upgrade_type === 'subscription_change') {
        const userId = session.metadata.user_id;
        const upgradeCredits = parseInt(session.metadata.new_credits) - parseInt(session.metadata.old_credits);
        
        logStep("Processing subscription upgrade payment", {
          userId,
          oldCredits: session.metadata.old_credits,
          newCredits: session.metadata.new_credits,
          upgradeCredits,
          sessionId: session.id
        });

        // The credits were already granted in update-subscription function
        // Here we just need to send a confirmation email
        try {
          await supabaseClient.functions.invoke('send-subscription-emails', {
            body: { 
              emailType: 'upgrade',
              subscriptionData: { 
                credits: parseInt(session.metadata.new_credits),
                upgradeCreditsAdded: upgradeCredits,
                planName: session.metadata.plan_name,
                upgradeAmount: upgradeCredits
              },
              userEmail: session.customer_details?.email
            }
          });
          logStep("Upgrade confirmation email sent");
        } catch (emailError) {
          logStep("Warning: Failed to send upgrade confirmation email", { error: emailError });
        }

        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Handle subscription checkout
      if (session.mode === 'subscription') {
        const userId = session.metadata?.user_id;
        const creditsToAdd = parseInt(session.metadata?.credits || "0");

        if (!userId || !creditsToAdd) {
          logStep("Missing subscription metadata", { userId, creditsToAdd, metadata: session.metadata });
          throw new Error("Missing user_id or credits in session metadata");
        }

        // Check for existing transaction to prevent duplicate credits
        const { data: existingTransaction } = await supabaseClient
          .from('flexi_credits_transactions')
          .select('id')
          .eq('description', `Initial subscription credits - Session ${session.id}`)
          .maybeSingle();

        if (existingTransaction) {
          logStep("Subscription credits already granted", { sessionId: session.id });
          return new Response(JSON.stringify({ received: true, message: "Credits already granted" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        logStep("Adding initial subscription credits to user", { userId, creditsToAdd });

        // Add credits to user's balance using the existing database function
        const { error: creditsError } = await supabaseClient.rpc('increment_flexi_credits_balance', {
          user_id: userId,
          credits_to_add: creditsToAdd
        });

        if (creditsError) {
          logStep("Error adding subscription credits", creditsError);
          throw creditsError;
        }

        // Create a transaction record for audit trail
        const { error: transactionError } = await supabaseClient
          .from('flexi_credits_transactions')
          .insert({
            user_id: userId,
            type: 'purchase',
            amount: creditsToAdd,
            description: `Initial subscription credits - Session ${session.id}`
          });

        if (transactionError) {
          logStep("Error creating subscription transaction record", transactionError);
          // Don't throw here - credits were already added, transaction record is just for audit
        }

        logStep("Successfully processed subscription checkout", { userId, creditsToAdd, sessionId: session.id });
      } else {
        // Handle one-time checkout (points purchase)
        const userId = session.metadata?.user_id;
        const pointsToAdd = parseInt(session.metadata?.points || "0");

        if (!userId || !pointsToAdd) {
          logStep("Missing points metadata", { userId, pointsToAdd });
          throw new Error("Missing user_id or points in session metadata");
        }

        // Check for existing transaction to prevent duplicate credits
        const { data: existingTransaction } = await supabaseClient
          .from('flexi_credits_transactions')
          .select('id')
          .eq('description', `Stripe Checkout payment - Session ${session.id}`)
          .maybeSingle();

        if (existingTransaction) {
          logStep("Points already granted", { sessionId: session.id });
          return new Response(JSON.stringify({ received: true, message: "Points already granted" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        logStep("Adding points to user", { userId, pointsToAdd });

        // Add points to user's balance using the existing database function
        const { error: pointsError } = await supabaseClient.rpc('increment_flexi_credits_balance', {
          user_id: userId,
          credits_to_add: pointsToAdd
        });

        if (pointsError) {
          logStep("Error adding points", pointsError);
          throw pointsError;
        }

        // Create a transaction record for audit trail
        const { error: transactionError } = await supabaseClient
          .from('flexi_credits_transactions')
          .insert({
            user_id: userId,
            type: 'purchase',
            amount: pointsToAdd,
            description: `Stripe Checkout payment - Session ${session.id}`
          });

        if (transactionError) {
          logStep("Error creating transaction record", transactionError);
          // Don't throw here - points were already added, transaction record is just for audit
        }

        logStep("Successfully processed points checkout", { userId, pointsToAdd, sessionId: session.id });
      }
    }

    // Handle subscription payments - only for regular monthly billing, not upgrades/changes
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object;
      logStep("Processing invoice payment", { invoiceId: invoice.id, billing_reason: invoice.billing_reason });

      // For subscription updates (upgrades/downgrades), send confirmation email
      if (invoice.billing_reason === 'subscription_update') {
        logStep("Processing subscription update confirmation email", { invoiceId: invoice.id });
        
        try {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          const customer = await stripe.customers.retrieve(invoice.customer);
          
          if (customer.email) {
            // Find user profile
            const { data: profile } = await supabaseClient
              .from('profiles')
              .select('user_id, full_name')
              .eq('email', customer.email)
              .maybeSingle();
            
            if (profile) {
              const creditsPerMonth = parseInt(subscription.metadata?.credits || "0");
              const previousCredits = parseInt(subscription.metadata?.previous_credits || "0");
              const creditsDifference = creditsPerMonth - previousCredits;
              
              // Determine if this is an upgrade or downgrade
              const isUpgrade = creditsDifference > 0;
              const isDowngrade = creditsDifference < 0;
              
              logStep("Subscription update type determined", { 
                creditsPerMonth, 
                previousCredits, 
                creditsDifference, 
                isUpgrade, 
                isDowngrade 
              });
              
              // Only send email, don't add any credits here for downgrades
              if (isUpgrade) {
                await supabaseClient.functions.invoke('send-subscription-emails', {
                  body: {
                    emailType: 'upgrade',
                    subscriptionData: {
                      credits: creditsPerMonth,
                      planName: subscription.metadata?.plan_name || `Pro ${Math.ceil(creditsPerMonth / 100)} Plan`,
                      upgradeCreditsAdded: creditsDifference
                    },
                    userEmail: customer.email
                  }
                });
                logStep("Subscription upgrade email sent", { userId: profile.user_id, email: customer.email });
              } else if (isDowngrade) {
                await supabaseClient.functions.invoke('send-subscription-emails', {
                  body: {
                    emailType: 'downgrade',
                    subscriptionData: {
                      credits: creditsPerMonth,
                      planName: subscription.metadata?.plan_name || `Pro ${Math.ceil(creditsPerMonth / 100)} Plan`,
                      oldCredits: previousCredits,
                      savingsAmount: Math.abs(creditsDifference)
                    },
                    userEmail: customer.email
                  }
                });
                logStep("Subscription downgrade email sent", { userId: profile.user_id, email: customer.email });
              }
            }
          }
        } catch (emailError) {
          logStep("Failed to send subscription change confirmation email", { error: emailError.message });
        }
        
        logStep("Skipping proration invoice - no credits added for subscription updates", { invoiceId: invoice.id });
        return new Response(JSON.stringify({ received: true, message: "Subscription update processed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Skip subscription creation invoices - credits handled in checkout
      if (invoice.billing_reason === 'subscription_create') {
        logStep("Skipping subscription creation invoice - credits handled in checkout", { invoiceId: invoice.id });
        return new Response(JSON.stringify({ received: true, message: "Subscription creation invoice skipped" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Only process regular subscription cycle or manual billing
      if (!['subscription_cycle', 'manual'].includes(invoice.billing_reason)) {
        logStep("Skipping non-regular billing", { billing_reason: invoice.billing_reason });
        return new Response(JSON.stringify({ received: true, message: "Non-regular billing skipped" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Get subscription details
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
      logStep("Retrieved subscription", { subscriptionId: subscription.id });

      // Check if this is a downgrade transition period - don't add credits if scheduled downgrade
      if (subscription.metadata?.scheduled_downgrade === 'true') {
        logStep("Skipping credit addition - scheduled downgrade in progress", { 
          subscriptionId: subscription.id,
          scheduledDowngrade: true 
        });
        return new Response(JSON.stringify({ received: true, message: "Credits skipped during downgrade transition" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Find user by customer email
      const customer = await stripe.customers.retrieve(invoice.customer);
      const customerEmail = customer.email;
      
      if (!customerEmail) {
        logStep("No customer email found", { customerId: invoice.customer });
        throw new Error("No customer email found");
      }

      // Find user profile by email
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('user_id')
        .eq('email', customerEmail)
        .maybeSingle();

      if (profileError || !profile) {
        logStep("User profile not found", { email: customerEmail, error: profileError });
        throw new Error(`User profile not found for email: ${customerEmail}`);
      }

      // Get credits amount from subscription metadata
      const creditsToAdd = parseInt(subscription.metadata?.credits || "0");

      if (!creditsToAdd) {
        logStep("No credits amount found in subscription metadata", { subscriptionMetadata: subscription.metadata });
        throw new Error("No credits amount found in subscription metadata");
      }

      // Check for existing transaction to prevent duplicate credits
      const { data: existingTransaction } = await supabaseClient
        .from('flexi_credits_transactions')
        .select('id')
        .eq('description', `Monthly subscription renewal - Invoice ${invoice.id}`)
        .maybeSingle();

      if (existingTransaction) {
        logStep("Monthly credits already granted", { invoiceId: invoice.id });
        return new Response(JSON.stringify({ received: true, message: "Monthly credits already granted" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      logStep("Adding monthly subscription credits to user", { userId: profile.user_id, creditsToAdd });

      // Add credits to user's balance
      const { error: creditsError } = await supabaseClient.rpc('increment_flexi_credits_balance', {
        user_id: profile.user_id,
        credits_to_add: creditsToAdd
      });

      if (creditsError) {
        logStep("Error adding subscription credits", creditsError);
        throw creditsError;
      }

      // Create a transaction record
      const { error: transactionError } = await supabaseClient
        .from('flexi_credits_transactions')
        .insert({
          user_id: profile.user_id,
          type: 'purchase',
          amount: creditsToAdd,
          description: `Monthly subscription renewal - Invoice ${invoice.id}`
        });

      if (transactionError) {
        logStep("Error creating subscription transaction record", transactionError);
      }

      logStep("Successfully processed monthly subscription payment", { userId: profile.user_id, creditsToAdd, invoiceId: invoice.id });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Webhook error", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});