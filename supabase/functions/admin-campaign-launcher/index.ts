import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { Resend } from "https://esm.sh/resend@2.0.0"

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

        // Send campaign launch email notifications
        try {
          const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
          const campaignTypeDisplay = template.campaign_type === 'facebook-ads' ? 'Facebook Ads' :
                                       template.campaign_type === 'cold-calling' ? 'Cold Calling' : 'VA Support';

          // Send email to user
          await resend.emails.send({
            from: "Campaign Team <campaigns@resend.dev>",
            to: [userProfile.email],
            subject: `🚀 Your ${campaignTypeDisplay} Campaign is Now Live!`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #2563eb; margin: 0;">🎉 Campaign Launched Successfully!</h1>
                </div>

                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <h2 style="color: #1e293b; margin: 0 0 15px 0;">Campaign Details</h2>
                  <p><strong>Campaign Name:</strong> ${campaignName}</p>
                  <p><strong>Campaign ID:</strong> ${campaign.id}</p>
                  <p><strong>Type:</strong> ${campaignTypeDisplay}</p>
                  <p><strong>Target Audience:</strong> ${template.target_audience}</p>
                  <p><strong>Monthly Budget:</strong> ${budget} points</p>
                  <p><strong>Consultant:</strong> ${userProfile.full_name || userProfile.email}</p>
                </div>

                <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 20px;">
                  <h3 style="color: #065f46; margin: 0 0 10px 0;">✅ What Happens Next?</h3>
                  <ul style="color: #047857; margin: 0; padding-left: 20px;">
                    <li>Your campaign is now active and running</li>
                    <li>Our team will monitor performance and optimize as needed</li>
                    <li>You'll receive regular updates on campaign progress</li>
                    <li>Results and analytics will be available in your dashboard</li>
                  </ul>
                </div>

                <div style="text-align: center; margin-top: 30px;">
                  <p style="color: #6b7280;">Thank you for choosing our campaign management services!</p>
                </div>
              </div>
            `,
          });

          // Send email to admin
          await resend.emails.send({
            from: "Campaign System <system@resend.dev>",
            to: ["tanjunsing@gmail.com"],
            subject: `🔔 New Campaign Launch: ${campaignName}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #dc2626; margin: 0;">🚨 New Campaign Alert</h1>
                </div>

                <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <h2 style="color: #991b1b; margin: 0 0 15px 0;">Campaign Launch Details</h2>
                  <p><strong>Campaign Name:</strong> ${campaignName}</p>
                  <p><strong>Campaign ID:</strong> ${campaign.id}</p>
                  <p><strong>Type:</strong> ${campaignTypeDisplay}</p>
                  <p><strong>User:</strong> ${userProfile.full_name || 'Unknown'} (${userProfile.email})</p>
                  <p><strong>Target Audience:</strong> ${template.target_audience}</p>
                  <p><strong>Monthly Budget:</strong> ${budget} points</p>
                  <p><strong>Launch Time:</strong> ${new Date().toLocaleString()}</p>
                </div>

                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px;">
                  <h3 style="color: #92400e; margin: 0 0 10px 0;">⚡ Action Required</h3>
                  <ul style="color: #b45309; margin: 0; padding-left: 20px;">
                    <li>Review campaign parameters for compliance</li>
                    <li>Set up monitoring and tracking systems</li>
                    <li>Assign to appropriate team members</li>
                    <li>Schedule initial performance review</li>
                  </ul>
                </div>
              </div>
            `,
          });

          console.log('Campaign launch emails sent successfully')
        } catch (emailError) {
          // Log email error but don't fail the campaign creation
          console.error('Failed to send campaign launch emails:', emailError)
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

        // Send campaign launch email notifications
        try {
          const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

          // Send email to user
          await resend.emails.send({
            from: "Campaign Team <campaigns@resend.dev>",
            to: [assignment.profiles.email],
            subject: `🚀 Your Facebook Ads Campaign is Now Live!`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #2563eb; margin: 0;">🎉 Campaign Launched Successfully!</h1>
                </div>

                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <h2 style="color: #1e293b; margin: 0 0 15px 0;">Campaign Details</h2>
                  <p><strong>Campaign Name:</strong> ${campaignName}</p>
                  <p><strong>Campaign ID:</strong> ${newCampaign.id}</p>
                  <p><strong>Type:</strong> Facebook Ads</p>
                  <p><strong>Target Audience:</strong> ${assignment.target_audience}</p>
                  <p><strong>Monthly Budget:</strong> ${assignment.monthly_cost} credits</p>
                  <p><strong>Campaign Duration:</strong> ${assignment.campaign_duration_months} months</p>
                  <p><strong>Consultant:</strong> ${assignment.profiles.full_name || assignment.profiles.email}</p>
                </div>

                <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 20px;">
                  <h3 style="color: #065f46; margin: 0 0 10px 0;">✅ What Happens Next?</h3>
                  <ul style="color: #047857; margin: 0; padding-left: 20px;">
                    <li>Your campaign is now active and running</li>
                    <li>Our team will monitor performance and optimize as needed</li>
                    <li>You'll receive regular updates on campaign progress</li>
                    <li>Results and analytics will be available in your dashboard</li>
                  </ul>
                </div>

                <div style="text-align: center; margin-top: 30px;">
                  <p style="color: #6b7280;">Thank you for choosing our campaign management services!</p>
                </div>
              </div>
            `,
          });

          // Send email to admin
          await resend.emails.send({
            from: "Campaign System <system@resend.dev>",
            to: ["tanjunsing@gmail.com"],
            subject: `🔔 New Facebook Ads Campaign Launch: ${campaignName}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #dc2626; margin: 0;">🚨 New Campaign Alert</h1>
                </div>

                <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <h2 style="color: #991b1b; margin: 0 0 15px 0;">Campaign Launch Details</h2>
                  <p><strong>Campaign Name:</strong> ${campaignName}</p>
                  <p><strong>Campaign ID:</strong> ${newCampaign.id}</p>
                  <p><strong>Type:</strong> Facebook Ads</p>
                  <p><strong>User:</strong> ${assignment.profiles.full_name || 'Unknown'} (${assignment.profiles.email})</p>
                  <p><strong>Target Audience:</strong> ${assignment.target_audience}</p>
                  <p><strong>Monthly Cost:</strong> ${assignment.monthly_cost} credits</p>
                  <p><strong>Campaign Duration:</strong> ${assignment.campaign_duration_months} months</p>
                  <p><strong>Total Budget:</strong> ${assignment.monthly_cost * assignment.campaign_duration_months} credits</p>
                  <p><strong>Assignment ID:</strong> ${assignmentId}</p>
                  <p><strong>Launch Time:</strong> ${new Date().toLocaleString()}</p>
                </div>

                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px;">
                  <h3 style="color: #92400e; margin: 0 0 10px 0;">⚡ Action Required</h3>
                  <ul style="color: #b45309; margin: 0; padding-left: 20px;">
                    <li>Review campaign parameters for compliance</li>
                    <li>Set up monitoring and tracking systems</li>
                    <li>Assign to appropriate team members</li>
                    <li>Schedule initial performance review</li>
                  </ul>
                </div>
              </div>
            `,
          });

          console.log('Facebook Ads campaign launch emails sent successfully')
        } catch (emailError) {
          // Log email error but don't fail the campaign creation
          console.error('Failed to send Facebook Ads campaign launch emails:', emailError)
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