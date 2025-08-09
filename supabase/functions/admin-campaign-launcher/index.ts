import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify user is admin
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      throw new Error('Admin access required')
    }

    const { action, userId, templateId, budget, participantId, prorationEnabled } = await req.json()

    switch (action) {
      case 'launch_campaign': {
        console.log('Launching campaign for user:', userId)
        
        // Validate user exists and has sufficient balance
        const { data: userProfile, error: userError } = await supabaseClient
          .from('profiles')
          .select('points_balance, full_name, email')
          .eq('user_id', userId)
          .single()

        if (userError || !userProfile) {
          throw new Error('User not found')
        }

        if (userProfile.points_balance < budget) {
          throw new Error('Insufficient user balance')
        }

        // Get template details
        const { data: template, error: templateError } = await supabaseClient
          .from('campaign_templates')
          .select('*')
          .eq('id', templateId)
          .single()

        if (templateError || !template) {
          throw new Error('Template not found')
        }

        // Create campaign
        const campaignName = `Admin Campaign - ${template.name} - ${userProfile.full_name || userProfile.email}`
        const startDate = new Date()
        const endDate = new Date(startDate.getTime() + (365 * 24 * 60 * 60 * 1000))

        const { data: campaign, error: campaignError } = await supabaseClient
          .from('lead_gen_campaigns')
          .insert({
            name: campaignName,
            description: `Admin-launched campaign for ${template.target_audience}`,
            total_budget: budget,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            created_by: user.id,
            status: 'active'
          })
          .select()
          .single()

        if (campaignError) {
          console.error('Campaign creation error:', campaignError)
          throw new Error('Failed to create campaign')
        }

        // Add user as participant
        const nextBillingDate = new Date(startDate);
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        nextBillingDate.setDate(1);

        // Compute derived monthly budget if proration is enabled
        let monthlyBudget: number | null = null;
        if (prorationEnabled) {
          const year = startDate.getUTCFullYear();
          const month = startDate.getUTCMonth();
          const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
          const day = startDate.getUTCDate();
          const remainingDays = daysInMonth - day + 1; // include start day
          const fractionRemaining = remainingDays / daysInMonth;
          monthlyBudget = Math.max(1, Math.round(budget / Math.max(fractionRemaining, 0.01)));
        }
        
        const { error: participantError } = await supabaseClient
          .from('campaign_participants')
          .insert({
            campaign_id: campaign.id,
            user_id: userId,
            budget_contribution: budget,
            consultant_name: userProfile.full_name || userProfile.email,
            billing_status: 'active',
            next_billing_date: nextBillingDate.toISOString().split('T')[0],
            billing_cycle_day: 1,
            proration_enabled: !!prorationEnabled,
            monthly_budget: monthlyBudget,
            notes: 'Admin-launched campaign'
          })

        if (participantError) {
          console.error('Participant creation error:', participantError)
          throw new Error('Failed to add participant')
        }

        // Deduct points from user balance
        const { error: balanceError } = await supabaseClient
          .from('profiles')
          .update({ 
            points_balance: userProfile.points_balance - budget,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)

        if (balanceError) {
          console.error('Balance deduction error:', balanceError)
          throw new Error('Failed to deduct points')
        }

        // Create transaction record
        const { error: transactionError } = await supabaseClient
          .from('points_transactions')
          .insert({
            user_id: userId,
            type: 'spending',
            amount: -budget,
            description: `Admin-launched campaign: ${campaignName}`
          })

        if (transactionError) {
          console.error('Transaction record error:', transactionError)
        }

        console.log('Campaign launched successfully')
        return new Response(
          JSON.stringify({ 
            success: true, 
            campaignId: campaign.id,
            message: 'Campaign launched successfully'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'pause_campaign': {
        console.log('Pausing campaign for participant:', participantId)
        
        const { error: pauseError } = await supabaseClient
          .from('campaign_participants')
          .update({ 
            billing_status: 'paused',
            updated_at: new Date().toISOString()
          })
          .eq('id', participantId)

        if (pauseError) {
          console.error('Pause error:', pauseError)
          throw new Error('Failed to pause campaign')
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Campaign paused successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'resume_campaign': {
        console.log('Resuming campaign for participant:', participantId)
        
        const { error: resumeError } = await supabaseClient
          .from('campaign_participants')
          .update({ 
            billing_status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', participantId)

        if (resumeError) {
          console.error('Resume error:', resumeError)
          throw new Error('Failed to resume campaign')
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Campaign resumed successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})