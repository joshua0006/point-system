import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CampaignLaunchEmailRequest {
  campaignId: string;
  campaignName: string;
  campaignType: string;
  targetAudience?: string;
  budget: number;
  consultantName: string;
  hours?: number;
  userEmail: string;
  userName: string;
}

interface CampaignPauseEmailRequest {
  campaignId: string;
  campaignName: string;
  campaignType: string;
  budget: number;
  userEmail: string;
  userName: string;
  action: 'pause' | 'resume';
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Authentication failed");
    }

    const requestBody = await req.json();
    const emailType = requestBody.emailType || 'launch';

    if (emailType === 'pause' || emailType === 'resume') {
      return await handlePauseResumeEmail(requestBody as CampaignPauseEmailRequest);
    } else {
      return await handleLaunchEmail(requestBody as CampaignLaunchEmailRequest);
    }

  } catch (error: any) {
    console.error("Error in send-campaign-launch-emails function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function handleLaunchEmail(data: CampaignLaunchEmailRequest): Promise<Response> {
  const {
    campaignId,
    campaignName,
    campaignType,
    targetAudience,
    budget,
    consultantName,
    hours,
    userEmail,
    userName
  } = data;

  const campaignTypeDisplay = campaignType === 'facebook-ads' ? 'Facebook Ads' : 
                             campaignType === 'cold-calling' ? 'Cold Calling' : 'VA Support';

  // Send confirmation email to user
  const userEmailResponse = await resend.emails.send({
    from: "Campaign Team <campaigns@resend.dev>",
    to: [userEmail],
    subject: `🚀 Your ${campaignTypeDisplay} Campaign is Now Live!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">🎉 Campaign Launched Successfully!</h1>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #1e293b; margin: 0 0 15px 0;">Campaign Details</h2>
          <p><strong>Campaign Name:</strong> ${campaignName}</p>
          <p><strong>Campaign ID:</strong> ${campaignId}</p>
          <p><strong>Type:</strong> ${campaignTypeDisplay}</p>
          ${targetAudience ? `<p><strong>Target Audience:</strong> ${targetAudience}</p>` : ''}
          <p><strong>Monthly Budget:</strong> ${budget} points</p>
          <p><strong>Consultant:</strong> ${consultantName}</p>
          ${hours ? `<p><strong>Hours per Month:</strong> ${hours}</p>` : ''}
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
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://rrnaquethuzvbsxcssss.supabase.co/campaigns" 
             style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 25px; 
                    font-weight: bold; 
                    margin-right: 15px;
                    display: inline-block;">
            View My Campaigns
          </a>
          <a href="https://rrnaquethuzvbsxcssss.supabase.co/settings" 
             style="background: #f8fafc; 
                    color: #2563eb; 
                    border: 2px solid #2563eb;
                    padding: 13px 30px; 
                    text-decoration: none; 
                    border-radius: 25px; 
                    font-weight: bold;
                    display: inline-block;">
            View Points & Transactions
          </a>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #6b7280;">Thank you for choosing our campaign management services!</p>
          <p style="color: #6b7280; font-size: 14px;">
            If you have any questions, please don't hesitate to contact our support team.
          </p>
        </div>
      </div>
    `,
  });

  // Send notification email to admin
  const adminEmailResponse = await resend.emails.send({
    from: "Campaign System <system@resend.dev>",
    to: ["admin@yourcompany.com"], // Replace with actual admin email
    subject: `🔔 New Campaign Launch: ${campaignName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #dc2626; margin: 0;">🚨 New Campaign Alert</h1>
        </div>
        
        <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #991b1b; margin: 0 0 15px 0;">Campaign Launch Details</h2>
          <p><strong>Campaign Name:</strong> ${campaignName}</p>
          <p><strong>Campaign ID:</strong> ${campaignId}</p>
          <p><strong>Type:</strong> ${campaignTypeDisplay}</p>
          <p><strong>User:</strong> ${userName} (${userEmail})</p>
          ${targetAudience ? `<p><strong>Target Audience:</strong> ${targetAudience}</p>` : ''}
          <p><strong>Monthly Budget:</strong> ${budget} points</p>
          <p><strong>Consultant:</strong> ${consultantName}</p>
          ${hours ? `<p><strong>Hours per Month:</strong> ${hours}</p>` : ''}
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
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://rrnaquethuzvbsxcssss.supabase.co/admin-dashboard" 
             style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 25px; 
                    font-weight: bold; 
                    margin-right: 15px;
                    display: inline-block;">
            🏠 Admin Dashboard
          </a>
          <a href="https://rrnaquethuzvbsxcssss.supabase.co/admin-dashboard?tab=billing" 
             style="background: #f8fafc; 
                    color: #dc2626; 
                    border: 2px solid #dc2626;
                    padding: 13px 30px; 
                    text-decoration: none; 
                    border-radius: 25px; 
                    font-weight: bold;
                    display: inline-block;">
            💰 View Transactions
          </a>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated notification from the Campaign Management System
          </p>
        </div>
      </div>
    `,
  });

  console.log("User email sent successfully:", userEmailResponse);
  console.log("Admin email sent successfully:", adminEmailResponse);

  return new Response(
    JSON.stringify({ 
      success: true, 
      userEmailId: userEmailResponse.data?.id,
      adminEmailId: adminEmailResponse.data?.id
    }), 
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    }
  );
}

async function handlePauseResumeEmail(data: CampaignPauseEmailRequest): Promise<Response> {
  const {
    campaignId,
    campaignName,
    campaignType,
    budget,
    userEmail,
    userName,
    action
  } = data;

  const campaignTypeDisplay = campaignType === 'facebook-ads' ? 'Facebook Ads' : 
                             campaignType === 'cold-calling' ? 'Cold Calling' : 'VA Support';

  const isPausing = action === 'pause';
  const actionText = isPausing ? 'Paused' : 'Resumed';
  const actionEmoji = isPausing ? '⏸️' : '▶️';
  const statusColor = isPausing ? '#f59e0b' : '#10b981';
  const bgColor = isPausing ? '#fef3c7' : '#ecfdf5';

  // Send confirmation email to user
  const userEmailResponse = await resend.emails.send({
    from: "Campaign Team <campaigns@resend.dev>",
    to: [userEmail],
    subject: `${actionEmoji} Campaign ${actionText}: ${campaignName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: ${statusColor}; margin: 0;">${actionEmoji} Campaign ${actionText}!</h1>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #1e293b; margin: 0 0 15px 0;">Campaign Details</h2>
          <p><strong>Campaign Name:</strong> ${campaignName}</p>
          <p><strong>Campaign ID:</strong> ${campaignId}</p>
          <p><strong>Type:</strong> ${campaignTypeDisplay}</p>
          <p><strong>Monthly Budget:</strong> ${budget} points</p>
          <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${actionText}</span></p>
          <p><strong>${actionText} Date:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <div style="background: ${bgColor}; border-left: 4px solid ${statusColor}; padding: 15px; margin-bottom: 20px;">
          <h3 style="color: ${isPausing ? '#92400e' : '#065f46'}; margin: 0 0 10px 0;">
            ${isPausing ? '⏸️ Campaign Paused' : '▶️ Campaign Resumed'}
          </h3>
          ${isPausing ? `
            <ul style="color: #b45309; margin: 0; padding-left: 20px;">
              <li>Your campaign is now paused and inactive</li>
              <li>No new leads will be generated</li>
              <li>You won't be charged for the next billing cycle</li>
              <li>You can resume the campaign anytime from your dashboard</li>
            </ul>
          ` : `
            <ul style="color: #047857; margin: 0; padding-left: 20px;">
              <li>Your campaign is now active and running</li>
              <li>Lead generation has resumed</li>
              <li>Billing will resume on the next cycle</li>
              <li>Performance monitoring is back online</li>
            </ul>
          `}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://rrnaquethuzvbsxcssss.supabase.co/campaigns" 
             style="background: linear-gradient(135deg, ${statusColor} 0%, ${statusColor}dd 100%); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 25px; 
                    font-weight: bold; 
                    margin-right: 15px;
                    display: inline-block;">
            ${isPausing ? '📊 View Campaign Status' : '🚀 View Active Campaigns'}
          </a>
          <a href="https://rrnaquethuzvbsxcssss.supabase.co/settings" 
             style="background: #f8fafc; 
                    color: ${statusColor}; 
                    border: 2px solid ${statusColor};
                    padding: 13px 30px; 
                    text-decoration: none; 
                    border-radius: 25px; 
                    font-weight: bold;
                    display: inline-block;">
            💳 View Points & Billing
          </a>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #6b7280;">Need help? Contact our support team anytime.</p>
          <p style="color: #6b7280; font-size: 14px;">
            You can manage your campaigns from your dashboard.
          </p>
        </div>
      </div>
    `,
  });

  // Send notification email to admin
  const adminEmailResponse = await resend.emails.send({
    from: "Campaign System <system@resend.dev>",
    to: ["admin@yourcompany.com"], // Replace with actual admin email
    subject: `🔔 Campaign ${actionText}: ${campaignName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: ${statusColor}; margin: 0;">${actionEmoji} Campaign ${actionText}</h1>
        </div>
        
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #1e293b; margin: 0 0 15px 0;">Campaign ${actionText} Details</h2>
          <p><strong>Campaign Name:</strong> ${campaignName}</p>
          <p><strong>Campaign ID:</strong> ${campaignId}</p>
          <p><strong>Type:</strong> ${campaignTypeDisplay}</p>
          <p><strong>User:</strong> ${userName} (${userEmail})</p>
          <p><strong>Monthly Budget:</strong> ${budget} points</p>
          <p><strong>Action:</strong> <span style="color: ${statusColor}; font-weight: bold;">${actionText}</span></p>
          <p><strong>${actionText} Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <div style="background: ${bgColor}; border-left: 4px solid ${statusColor}; padding: 15px; margin-bottom: 20px;">
          <h3 style="color: ${isPausing ? '#92400e' : '#065f46'}; margin: 0 0 10px 0;">
            ${isPausing ? '⏸️ Action Required' : '▶️ Campaign Reactivated'}
          </h3>
          ${isPausing ? `
            <ul style="color: #b45309; margin: 0; padding-left: 20px;">
              <li>Update campaign monitoring systems</li>
              <li>Pause related advertising spend</li>
              <li>Archive current performance data</li>
              <li>Set reminder for potential reactivation</li>
            </ul>
          ` : `
            <ul style="color: #047857; margin: 0; padding-left: 20px;">
              <li>Reactivate monitoring and tracking</li>
              <li>Resume advertising spend authorization</li>
              <li>Update team assignments if needed</li>
              <li>Monitor for performance consistency</li>
            </ul>
          `}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://rrnaquethuzvbsxcssss.supabase.co/admin-dashboard" 
             style="background: linear-gradient(135deg, ${statusColor} 0%, ${statusColor}dd 100%); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 25px; 
                    font-weight: bold; 
                    margin-right: 15px;
                    display: inline-block;">
            🏠 Admin Dashboard
          </a>
          <a href="https://rrnaquethuzvbsxcssss.supabase.co/admin-dashboard?tab=billing" 
             style="background: #f8fafc; 
                    color: ${statusColor}; 
                    border: 2px solid ${statusColor};
                    padding: 13px 30px; 
                    text-decoration: none; 
                    border-radius: 25px; 
                    font-weight: bold;
                    display: inline-block;">
            💰 Monitor Transactions
          </a>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated notification from the Campaign Management System
          </p>
        </div>
      </div>
    `,
  });

  console.log("User pause/resume email sent successfully:", userEmailResponse);
  console.log("Admin pause/resume email sent successfully:", adminEmailResponse);

  return new Response(
    JSON.stringify({ 
      success: true, 
      userEmailId: userEmailResponse.data?.id,
      adminEmailId: adminEmailResponse.data?.id
    }), 
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    }
  );
}

serve(handler);