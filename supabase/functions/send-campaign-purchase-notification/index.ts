import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CampaignPurchaseNotification {
  campaignId: string;
  campaignName: string;
  campaignType?: string;
  buyerUserId: string;
  buyerName: string;
  buyerEmail: string;
  budgetContribution: number;
  consultantName: string;
  purchaseDate: string;
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Note: This function is called by database trigger via pg_net
    // Authentication is handled at the database level (SECURITY DEFINER)

    const requestBody: CampaignPurchaseNotification = await req.json();
    const {
      campaignId,
      campaignName,
      campaignType,
      buyerUserId,
      buyerName,
      buyerEmail,
      budgetContribution,
      consultantName,
      purchaseDate
    } = requestBody;

    const campaignTypeDisplay = campaignType || 'Campaign';

    // Send confirmation email to user
    const userEmailResponse = await resend.emails.send({
      from: "AgentHub <noreply@mail.themoneybees.co>",
      to: [buyerEmail],
      subject: `🎉 Campaign Purchase Confirmed - ${campaignName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🎉 Campaign Purchase Confirmed!</h1>
          </div>

          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${buyerName},</h2>

            <p style="font-size: 16px; line-height: 1.6; color: #555;">
              Great news! Your campaign purchase has been confirmed and is now being set up.
            </p>

            <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 25px 0;">
              <h3 style="margin: 0 0 15px 0; color: #333;">📋 Campaign Details:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #555; list-style: none;">
                <li style="margin-bottom: 10px;">📌 <strong>Campaign:</strong> ${campaignName}</li>
                <li style="margin-bottom: 10px;">🎯 <strong>Type:</strong> ${campaignTypeDisplay}</li>
                <li style="margin-bottom: 10px;">💰 <strong>Budget Contribution:</strong> ${budgetContribution} points</li>
                <li style="margin-bottom: 10px;">👤 <strong>Consultant:</strong> ${consultantName}</li>
                <li style="margin-bottom: 10px;">📅 <strong>Purchase Date:</strong> ${new Date(purchaseDate).toLocaleString()}</li>
              </ul>
            </div>

            <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 25px 0;">
              <h3 style="margin: 0 0 15px 0; color: #065f46;">✅ What's Next?</h3>
              <ul style="margin: 0; padding-left: 20px; color: #047857;">
                <li style="margin-bottom: 8px;">Your campaign is being activated</li>
                <li style="margin-bottom: 8px;">Our team will optimize for best results</li>
                <li style="margin-bottom: 8px;">You'll receive regular performance updates</li>
                <li style="margin-bottom: 8px;">Track progress in your dashboard</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get("SITE_URL") || "https://rrnaquethuzvbsxcssss.supabase.co"}/campaigns"
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 15px 30px;
                        text-decoration: none;
                        border-radius: 25px;
                        font-weight: bold;
                        display: inline-block;">
                📊 View My Campaigns
              </a>
            </div>

            <p style="font-size: 14px; color: #777; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              Questions? Reply to this email or contact our support team.
            </p>
          </div>
        </div>
      `,
    });

    console.log("User confirmation email sent successfully:", userEmailResponse);

    // Send notification email to admin (tanjunsing@gmail.com)
    const adminEmailResponse = await resend.emails.send({
      from: "Campaign System <system@resend.dev>",
      to: ["tanjunsing@gmail.com"],
      subject: `🎉 New Campaign Purchase: ${campaignName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #10b981; margin: 0;">🎉 New Campaign Purchased!</h1>
          </div>

          <div style="background: #f0fdf4; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #065f46; margin: 0 0 15px 0;">Campaign Purchase Details</h2>
            <p><strong>Campaign Name:</strong> ${campaignName}</p>
            <p><strong>Campaign ID:</strong> ${campaignId}</p>
            <p><strong>Campaign Type:</strong> ${campaignTypeDisplay}</p>
            <p><strong>Consultant:</strong> ${consultantName}</p>
          </div>

          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #92400e; margin: 0 0 15px 0;">👤 Buyer Information</h2>
            <p><strong>Buyer Name:</strong> ${buyerName}</p>
            <p><strong>Buyer Email:</strong> ${buyerEmail}</p>
            <p><strong>User ID:</strong> ${buyerUserId}</p>
            <p><strong>Budget Contribution:</strong> ${budgetContribution} points</p>
            <p><strong>Purchase Date:</strong> ${new Date(purchaseDate).toLocaleString()}</p>
          </div>

          <div style="background: #e0f2fe; border-left: 4px solid #0284c7; padding: 15px; margin-bottom: 20px;">
            <h3 style="color: #0c4a6e; margin: 0 0 10px 0;">📋 Next Steps</h3>
            <ul style="color: #075985; margin: 0; padding-left: 20px;">
              <li>Review campaign parameters and buyer details</li>
              <li>Set up monitoring and tracking for this purchase</li>
              <li>Verify payment and points deduction</li>
              <li>Update campaign participant records if needed</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://rrnaquethuzvbsxcssss.supabase.co/admin-dashboard"
               style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                      color: white;
                      padding: 15px 30px;
                      text-decoration: none;
                      border-radius: 25px;
                      font-weight: bold;
                      margin-right: 15px;
                      display: inline-block;">
              🏠 Admin Dashboard
            </a>
            <a href="https://rrnaquethuzvbsxcssss.supabase.co/admin-dashboard?tab=campaigns"
               style="background: #f8fafc;
                      color: #10b981;
                      border: 2px solid #10b981;
                      padding: 13px 30px;
                      text-decoration: none;
                      border-radius: 25px;
                      font-weight: bold;
                      display: inline-block;">
              📊 View Campaigns
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

    console.log("Campaign purchase notification emails sent successfully");

    return new Response(
      JSON.stringify({
        success: true,
        userEmailId: userEmailResponse.data?.id,
        adminEmailId: adminEmailResponse.data?.id,
        message: "Campaign purchase confirmation and notification emails sent successfully"
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
    console.error("Error in send-campaign-purchase-notification function:", error);
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
