import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

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

    if (profileError || !['admin', 'master_admin'].includes(profile?.role)) {
      throw new Error('Admin access required')
    }

    const { action, userId, templateId, budget, participantId, prorationEnabled, assignmentId } = await req.json()

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

        // Add user as participant with proper UTC billing date calculation
        const nowUtc = new Date();
        const nextBillingDate = new Date(Date.UTC(
          nowUtc.getUTCFullYear(),
          nowUtc.getUTCMonth() + 1,
          1, 0, 0, 0
        ));

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

      case 'launch_facebook_ads_campaign': {
        console.log('Launching Facebook Ads campaign for assignment:', assignmentId)
        
        if (!assignmentId) {
          throw new Error('Assignment ID is required')
        }

        // Get the service assignment details
        const { data: assignment, error: assignmentError } = await supabaseClient
          .from('admin_service_assignments')
          .select(`
            *,
            profiles!inner (
              user_id,
              flexi_credits_balance,
              full_name,
              email
            )
          `)
          .eq('id', assignmentId)
          .eq('status', 'active')
          .single()

        if (assignmentError || !assignment) {
          console.error('Assignment fetch error:', assignmentError)
          throw new Error('Service assignment not found')
        }

        // Check if campaign template exists
        const { data: template, error: templateError } = await supabaseClient
          .from('campaign_templates')
          .select('*')
          .eq('id', assignment.campaign_template_id)
          .single()

        if (templateError || !template) {
          console.error('Template fetch error:', templateError)
          throw new Error('Campaign template not found')
        }

        // Check user balance
        const userBalance = assignment.profiles.flexi_credits_balance
        if (userBalance < assignment.monthly_cost) {
          throw new Error('Insufficient balance')
        }

        // Create lead gen campaign
        const campaignName = `Facebook Ads - ${template.name} (${assignment.profiles.full_name || assignment.profiles.email})`
        const startDate = new Date()
        const endDate = new Date(startDate.getTime() + (assignment.campaign_duration_months * 30 * 24 * 60 * 60 * 1000))

        const { data: newCampaign, error: campaignError } = await supabaseClient
          .from('lead_gen_campaigns')
          .insert({
            name: campaignName,
            description: `Admin-assigned Facebook Ads campaign for ${assignment.target_audience}`,
            total_budget: assignment.monthly_cost * assignment.campaign_duration_months,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            created_by: assignment.assigned_by,
            status: 'active'
          })
          .select()
          .single()

        if (campaignError) {
          console.error('Campaign creation error:', campaignError)
          throw new Error('Failed to create campaign')
        }

        // Create campaign participant
        const nextBillingDate = new Date(Date.UTC(
          startDate.getUTCFullYear(),
          startDate.getUTCMonth() + 1,
          1, 0, 0, 0
        ))

        const { data: newParticipant, error: participantError } = await supabaseClient
          .from('campaign_participants')
          .insert({
            campaign_id: newCampaign.id,
            user_id: assignment.user_id,
            consultant_name: assignment.profiles.full_name || assignment.profiles.email,
            budget_contribution: assignment.monthly_cost,
            billing_status: 'active',
            next_billing_date: nextBillingDate.toISOString().split('T')[0],
            monthly_budget: assignment.monthly_cost
          })
          .select()
          .single()

        if (participantError) {
          console.error('Participant creation error:', participantError)
          throw new Error('Failed to create participant')
        }

        // Update service assignment with campaign details
        const { error: updateError } = await supabaseClient
          .from('admin_service_assignments')
          .update({
            campaign_id: newCampaign.id,
            campaign_status: 'active',
            campaign_launched_at: new Date().toISOString()
          })
          .eq('id', assignmentId)

        if (updateError) {
          console.error('Assignment update error:', updateError)
          throw new Error('Failed to update assignment')
        }

        // Deduct initial cost from user balance
        const { error: balanceError } = await supabaseClient
          .from('profiles')
          .update({
            flexi_credits_balance: userBalance - assignment.monthly_cost
          })
          .eq('user_id', assignment.user_id)

        if (balanceError) {
          console.error('Balance update error:', balanceError)
          throw new Error('Failed to update balance')
        }

        // Record transaction
        const { error: transactionError } = await supabaseClient
          .from('flexi_credits_transactions')
          .insert({
            user_id: assignment.user_id,
            type: 'spent',
            amount: -assignment.monthly_cost,
            description: `Facebook Ads campaign launch - ${template.name}`
          })

        if (transactionError) {
          console.error('Transaction creation error:', transactionError)
        }

        console.log('Facebook Ads campaign launched successfully')
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Facebook Ads campaign launched successfully',
            campaignId: newCampaign.id,
            participantId: newParticipant.id 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})