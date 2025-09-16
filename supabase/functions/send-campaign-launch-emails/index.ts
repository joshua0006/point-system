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
    }: CampaignLaunchEmailRequest = await req.json();

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

serve(handler);