import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailNotificationRequest {
  type: 'points_added' | 'points_deducted';
  userEmail: string;
  userName: string;
  adminEmail: string;
  adminName: string;
  amount: number;
  reason?: string;
  userBalance: number;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-ADMIN-NOTIFICATION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { 
      type, 
      userEmail, 
      userName, 
      adminEmail, 
      adminName, 
      amount, 
      reason, 
      userBalance 
    }: EmailNotificationRequest = await req.json();

    const isAddition = type === 'points_added';
    const actionText = isAddition ? 'Added' : 'Deducted';
    const actionColor = isAddition ? '#22c55e' : '#ef4444';
    const actionIcon = isAddition ? '+' : '-';

    // Email to the user
    const userEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account Update - Flexi Credits ${actionText}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="padding: 40px 30px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              <div style="background-color: ${actionColor}; color: white; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; margin-bottom: 20px;">
                ${actionIcon}
              </div>
              <h1 style="color: #1f2937; margin: 0 0 10px 0; font-size: 24px;">Account Update</h1>
              <p style="color: #6b7280; margin: 0; font-size: 16px;">Your flexi credits balance has been updated</p>
            </div>
            
            <div style="padding: 30px;">
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                <h2 style="color: #374151; margin: 0 0 15px 0; font-size: 18px;">Transaction Details</h2>
                <div style="margin-bottom: 10px;">
                  <span style="color: #6b7280; font-weight: 500;">Action:</span>
                  <span style="color: ${actionColor}; font-weight: 600; margin-left: 10px;">${actionText} ${amount} flexi credits</span>
                </div>
                <div style="margin-bottom: 10px;">
                  <span style="color: #6b7280; font-weight: 500;">New Balance:</span>
                  <span style="color: #1f2937; font-weight: 600; margin-left: 10px;">${userBalance} flexi credits</span>
                </div>
                <div style="margin-bottom: 10px;">
                  <span style="color: #6b7280; font-weight: 500;">Performed by:</span>
                  <span style="color: #1f2937; margin-left: 10px;">${adminName} (Admin)</span>
                </div>
                ${reason ? `
                <div>
                  <span style="color: #6b7280; font-weight: 500;">Reason:</span>
                  <p style="color: #1f2937; margin: 5px 0 0 0; padding: 10px; background-color: white; border-radius: 4px; border-left: 4px solid ${actionColor};">${reason}</p>
                </div>
                ` : ''}
              </div>
              
              <div style="text-align: center; margin-bottom: 20px;">
                <a href="${Deno.env.get('SITE_URL') || 'https://your-domain.com'}/user-dashboard" 
                   style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-right: 10px;">
                  🏠 View Dashboard
                </a>
                <a href="${Deno.env.get('SITE_URL') || 'https://your-domain.com'}/settings" 
                   style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  📊 View Transactions
                </a>
              </div>
              
              <p style="color: #6b7280; margin: 0; font-size: 14px; text-align: center;">
                If you have any questions about this transaction, please contact our support team.
              </p>
            </div>
            
            <div style="padding: 20px 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                This is an automated notification. Please do not reply to this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Email to the master admin
    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Admin Action Notification - Flexi Credits ${actionText}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="padding: 40px 30px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              <div style="background-color: #3b82f6; color: white; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; margin-bottom: 20px;">
                🔔
              </div>
              <h1 style="color: #1f2937; margin: 0 0 10px 0; font-size: 24px;">Admin Action Notification</h1>
              <p style="color: #6b7280; margin: 0; font-size: 16px;">A flexi credits transaction was performed</p>
            </div>
            
            <div style="padding: 30px;">
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                <h2 style="color: #374151; margin: 0 0 15px 0; font-size: 18px;">Transaction Summary</h2>
                <div style="margin-bottom: 10px;">
                  <span style="color: #6b7280; font-weight: 500;">User:</span>
                  <span style="color: #1f2937; font-weight: 600; margin-left: 10px;">${userName} (${userEmail})</span>
                </div>
                <div style="margin-bottom: 10px;">
                  <span style="color: #6b7280; font-weight: 500;">Action:</span>
                  <span style="color: ${actionColor}; font-weight: 600; margin-left: 10px;">${actionText} ${amount} flexi credits</span>
                </div>
                <div style="margin-bottom: 10px;">
                  <span style="color: #6b7280; font-weight: 500;">New User Balance:</span>
                  <span style="color: #1f2937; font-weight: 600; margin-left: 10px;">${userBalance} flexi credits</span>
                </div>
                <div style="margin-bottom: 10px;">
                  <span style="color: #6b7280; font-weight: 500;">Admin:</span>
                  <span style="color: #1f2937; margin-left: 10px;">${adminName}</span>
                </div>
                ${reason ? `
                <div>
                  <span style="color: #6b7280; font-weight: 500;">Reason:</span>
                  <p style="color: #1f2937; margin: 5px 0 0 0; padding: 10px; background-color: white; border-radius: 4px; border-left: 4px solid ${actionColor};">${reason}</p>
                </div>
                ` : ''}
              </div>
              
              <div style="text-align: center; margin-bottom: 20px;">
                <a href="${Deno.env.get('SITE_URL') || 'https://your-domain.com'}/admin-dashboard" 
                   style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-right: 10px;">
                  🏠 Admin Dashboard
                </a>
                <a href="${Deno.env.get('SITE_URL') || 'https://your-domain.com'}/admin-dashboard?tab=billing" 
                   style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  📊 View All Transactions
                </a>
              </div>
              
              <p style="color: #6b7280; margin: 0; font-size: 14px; text-align: center;">
                This notification was sent to all master administrators for audit purposes.
              </p>
            </div>
            
            <div style="padding: 20px 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                Admin Dashboard Notification System
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    logStep("Sending user notification email", { userEmail, type, amount });

    // Send email to user
    const userEmailResponse = await resend.emails.send({
      from: "Admin Team <admin@mail.themoneybees.co>",
      to: [userEmail],
      subject: `Account Update: ${amount} flexi credits ${isAddition ? 'added to' : 'deducted from'} your account`,
      html: userEmailHtml,
    });

    logStep("User email sent", { userEmailResponse });

    logStep("Sending admin notification email", { adminEmail, type, amount });

    // Send notification to master admin
    const adminEmailResponse = await resend.emails.send({
      from: "System Notifications <notifications@mail.themoneybees.co>",
      to: [adminEmail],
      subject: `Admin Action: ${amount} flexi credits ${isAddition ? 'added to' : 'deducted from'} ${userName}'s account`,
      html: adminEmailHtml,
    });

    logStep("Admin email sent", { adminEmailResponse });

    return new Response(JSON.stringify({ 
      success: true, 
      userEmailId: userEmailResponse.data?.id,
      adminEmailId: adminEmailResponse.data?.id
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    logStep("ERROR", { message: error.message, stack: error.stack });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});