import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminNotificationRequest {
  notificationType: 'points_added' | 'points_deducted' | 'earnings_received' | 'system_alert' | 'user_activity';
  recipientEmail: string;
  recipientName?: string;
  recipientRole: 'admin' | 'consultant' | 'master_admin' | 'sales';
  data: {
    amount?: number;
    reason?: string;
    userName?: string;
    userEmail?: string;
    transactionId?: string;
    currentBalance?: number;
    description?: string;
    alertMessage?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
  };
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user (for security)
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
      notificationType,
      recipientEmail,
      recipientName,
      recipientRole,
      data
    }: AdminNotificationRequest = await req.json();

    console.log('Processing admin notification:', {
      type: notificationType,
      recipient: recipientEmail,
      role: recipientRole
    });

    // Generate dashboard URLs based on role
    const dashboardUrl = getDashboardUrl(recipientRole);
    const transactionUrl = getTransactionUrl(recipientRole);
    const settingsUrl = getSettingsUrl(recipientRole);

    // Generate email content based on notification type
    const { subject, html } = generateEmailContent(
      notificationType,
      recipientName || recipientEmail.split('@')[0],
      recipientRole,
      data,
      dashboardUrl,
      transactionUrl,
      settingsUrl
    );

    // Send notification email
    const emailResponse = await resend.emails.send({
      from: "FlexiLeads System <notifications@mail.themoneybees.co>",
      to: [recipientEmail],
      subject: subject,
      html: html,
    });

    console.log("Admin notification sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.data?.id,
        notificationType,
        recipient: recipientEmail
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
    console.error("Error in send-admin-notifications function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function getDashboardUrl(role: string): string {
  const baseUrl = "https://rrnaquethuzvbsxcssss.supabase.co";
  switch (role) {
    case 'admin':
    case 'master_admin':
      return `${baseUrl}/admin-dashboard`;
    case 'consultant':
      return `${baseUrl}/consultant-dashboard`;
    case 'sales':
      return `${baseUrl}/seller-dashboard`;
    default:
      return `${baseUrl}/user-dashboard`;
  }
}

function getTransactionUrl(role: string): string {
  const baseUrl = "https://rrnaquethuzvbsxcssss.supabase.co";
  switch (role) {
    case 'admin':
    case 'master_admin':
      return `${baseUrl}/admin-dashboard?tab=billing`;
    case 'consultant':
      return `${baseUrl}/consultant-dashboard`;
    case 'sales':
      return `${baseUrl}/seller-dashboard`;
    default:
      return `${baseUrl}/dashboard`;
  }
}

function getSettingsUrl(role: string): string {
  return "https://rrnaquethuzvbsxcssss.supabase.co/dashboard";
}

function generateEmailContent(
  type: string,
  recipientName: string,
  recipientRole: string,
  data: any,
  dashboardUrl: string,
  transactionUrl: string,
  settingsUrl: string
): { subject: string; html: string } {
  
  const roleDisplayName = getRoleDisplayName(recipientRole);
  
  switch (type) {
    case 'points_added':
      return {
        subject: `💰 ${data.amount} FlexiCredits Added to Your Account`,
        html: generatePointsAddedEmail(recipientName, roleDisplayName, data, dashboardUrl, transactionUrl)
      };
      
    case 'points_deducted':
      return {
        subject: `⚠️ ${Math.abs(data.amount)} FlexiCredits Deducted from Your Account`,
        html: generatePointsDeductedEmail(recipientName, roleDisplayName, data, dashboardUrl, transactionUrl)
      };
      
    case 'earnings_received':
      return {
        subject: `🎉 You've Earned ${data.amount} FlexiCredits!`,
        html: generateEarningsEmail(recipientName, roleDisplayName, data, dashboardUrl, transactionUrl)
      };
      
    case 'system_alert':
      return {
        subject: `🚨 System Alert: ${data.alertMessage}`,
        html: generateSystemAlertEmail(recipientName, roleDisplayName, data, dashboardUrl)
      };
      
    case 'user_activity':
      return {
        subject: `👤 User Activity Notification`,
        html: generateUserActivityEmail(recipientName, roleDisplayName, data, dashboardUrl, transactionUrl)
      };
      
    default:
      return {
        subject: `FlexiLeads Notification`,
        html: generateGenericEmail(recipientName, roleDisplayName, data, dashboardUrl)
      };
  }
}

function getRoleDisplayName(role: string): string {
  switch (role) {
    case 'admin': return 'Admin';
    case 'master_admin': return 'Master Admin';
    case 'consultant': return 'Consultant';
    case 'sales': return 'Sales Team';
    default: return 'User';
  }
}

function generatePointsAddedEmail(name: string, role: string, data: any, dashboardUrl: string, transactionUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">💰 Credits Added!</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-bottom: 20px;">Hi ${name} (${role}),</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #555;">
          Great news! <strong>${data.amount} FlexiCredits</strong> have been added to your account.
        </p>
        
        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 25px 0;">
          <h3 style="margin: 0 0 15px 0; color: #065f46;">✨ Transaction Details:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #047857;">
            <li><strong>Amount Added:</strong> ${data.amount} FlexiCredits</li>
            <li><strong>New Balance:</strong> ${data.currentBalance || 'Check dashboard'} FlexiCredits</li>
            <li><strong>Reason:</strong> ${data.reason || 'Credit adjustment'}</li>
            <li><strong>Transaction ID:</strong> ${data.transactionId || 'N/A'}</li>
            <li><strong>Date:</strong> ${new Date().toLocaleString()}</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}" 
             style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 25px; 
                    font-weight: bold; 
                    margin-right: 15px;
                    display: inline-block;">
            🏠 View Dashboard
          </a>
          <a href="${transactionUrl}" 
             style="background: #ecfdf5; 
                    color: #10b981; 
                    border: 2px solid #10b981;
                    padding: 13px 30px; 
                    text-decoration: none; 
                    border-radius: 25px; 
                    font-weight: bold;
                    display: inline-block;">
            📊 View All Transactions
          </a>
        </div>
        
        <p style="font-size: 14px; color: #777; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          Need help? Contact our support team or visit your dashboard for more details.
        </p>
      </div>
    </div>
  `;
}

function generatePointsDeductedEmail(name: string, role: string, data: any, dashboardUrl: string, transactionUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">⚠️ Credits Deducted</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-bottom: 20px;">Hi ${name} (${role}),</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #555;">
          This is to inform you that <strong>${Math.abs(data.amount)} FlexiCredits</strong> have been deducted from your account.
        </p>
        
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 25px 0;">
          <h3 style="margin: 0 0 15px 0; color: #92400e;">📋 Deduction Details:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #b45309;">
            <li><strong>Amount Deducted:</strong> ${Math.abs(data.amount)} FlexiCredits</li>
            <li><strong>Remaining Balance:</strong> ${data.currentBalance || 'Check dashboard'} FlexiCredits</li>
            <li><strong>Reason:</strong> ${data.reason || 'Account adjustment'}</li>
            <li><strong>Transaction ID:</strong> ${data.transactionId || 'N/A'}</li>
            <li><strong>Date:</strong> ${new Date().toLocaleString()}</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}" 
             style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 25px; 
                    font-weight: bold; 
                    margin-right: 15px;
                    display: inline-block;">
            🏠 View Dashboard
          </a>
          <a href="${transactionUrl}" 
             style="background: #fef3c7; 
                    color: #f59e0b; 
                    border: 2px solid #f59e0b;
                    padding: 13px 30px; 
                    text-decoration: none; 
                    border-radius: 25px; 
                    font-weight: bold;
                    display: inline-block;">
            📊 Review Transactions
          </a>
        </div>
        
        <p style="font-size: 14px; color: #777; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          Questions about this deduction? Contact our support team for assistance.
        </p>
      </div>
    </div>
  `;
}

function generateEarningsEmail(name: string, role: string, data: any, dashboardUrl: string, transactionUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-bottom: 20px;">Hi ${name} (${role}),</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #555;">
          Excellent work! You've earned <strong>${data.amount} FlexiCredits</strong> from your recent activities.
        </p>
        
        <div style="background: #f3e8ff; padding: 20px; border-radius: 8px; border-left: 4px solid #8b5cf6; margin: 25px 0;">
          <h3 style="margin: 0 0 15px 0; color: #6b21a8;">💎 Earnings Details:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #7c2d92;">
            <li><strong>Amount Earned:</strong> ${data.amount} FlexiCredits</li>
            <li><strong>New Balance:</strong> ${data.currentBalance || 'Check dashboard'} FlexiCredits</li>
            <li><strong>Source:</strong> ${data.description || 'Service completion'}</li>
            <li><strong>Transaction ID:</strong> ${data.transactionId || 'N/A'}</li>
            <li><strong>Date:</strong> ${new Date().toLocaleString()}</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}" 
             style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 25px; 
                    font-weight: bold; 
                    margin-right: 15px;
                    display: inline-block;">
            🏠 View Dashboard
          </a>
          <a href="${transactionUrl}" 
             style="background: #f3e8ff; 
                    color: #8b5cf6; 
                    border: 2px solid #8b5cf6;
                    padding: 13px 30px; 
                    text-decoration: none; 
                    border-radius: 25px; 
                    font-weight: bold;
                    display: inline-block;">
            💰 View Earnings History
          </a>
        </div>
        
        <p style="font-size: 14px; color: #777; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          Keep up the great work! Your efforts are making a difference.
        </p>
      </div>
    </div>
  `;
}

function generateSystemAlertEmail(name: string, role: string, data: any, dashboardUrl: string): string {
  const priorityColors = {
    low: { bg: '#f0f9ff', border: '#0ea5e9', text: '#0c4a6e' },
    medium: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    high: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
    critical: { bg: '#fecaca', border: '#dc2626', text: '#7f1d1d' }
  };
  
  const colors = priorityColors[data.priority as keyof typeof priorityColors] || priorityColors.medium;
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, ${colors.border} 0%, ${colors.text} 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">🚨 System Alert</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-bottom: 20px;">Hi ${name} (${role}),</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #555;">
          We have an important system notification for you:
        </p>
        
        <div style="background: ${colors.bg}; padding: 20px; border-radius: 8px; border-left: 4px solid ${colors.border}; margin: 25px 0;">
          <h3 style="margin: 0 0 15px 0; color: ${colors.text};">⚡ Alert Details:</h3>
          <p style="margin: 0; color: ${colors.text}; font-weight: 500; font-size: 16px;">
            ${data.alertMessage}
          </p>
          <p style="margin: 10px 0 0 0; color: ${colors.text}; font-size: 14px;">
            <strong>Priority:</strong> ${data.priority?.toUpperCase() || 'MEDIUM'} | 
            <strong>Time:</strong> ${new Date().toLocaleString()}
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}" 
             style="background: linear-gradient(135deg, ${colors.border} 0%, ${colors.text} 100%); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 25px; 
                    font-weight: bold;
                    display: inline-block;">
            🏠 Go to Dashboard
          </a>
        </div>
        
        <p style="font-size: 14px; color: #777; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          This is an automated system alert. Please review and take appropriate action if necessary.
        </p>
      </div>
    </div>
  `;
}

function generateUserActivityEmail(name: string, role: string, data: any, dashboardUrl: string, transactionUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">👤 User Activity</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-bottom: 20px;">Hi ${name} (${role}),</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #555;">
          Here's a user activity notification that may require your attention:
        </p>
        
        <div style="background: #ecfeff; padding: 20px; border-radius: 8px; border-left: 4px solid #06b6d4; margin: 25px 0;">
          <h3 style="margin: 0 0 15px 0; color: #0c4a6e;">📋 Activity Details:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #155e75;">
            <li><strong>User:</strong> ${data.userName || 'Unknown'} (${data.userEmail || 'N/A'})</li>
            <li><strong>Activity:</strong> ${data.description || 'User activity detected'}</li>
            <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
            ${data.amount ? `<li><strong>Amount:</strong> ${data.amount} FlexiCredits</li>` : ''}
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}" 
             style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 25px; 
                    font-weight: bold; 
                    margin-right: 15px;
                    display: inline-block;">
            🏠 View Dashboard
          </a>
          <a href="${transactionUrl}" 
             style="background: #ecfeff; 
                    color: #06b6d4; 
                    border: 2px solid #06b6d4;
                    padding: 13px 30px; 
                    text-decoration: none; 
                    border-radius: 25px; 
                    font-weight: bold;
                    display: inline-block;">
            📊 Monitor Activities
          </a>
        </div>
        
        <p style="font-size: 14px; color: #777; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          This notification was generated automatically based on user activity monitoring.
        </p>
      </div>
    </div>
  `;
}

function generateGenericEmail(name: string, role: string, data: any, dashboardUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">🔔 FlexiLeads Notification</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-bottom: 20px;">Hi ${name} (${role}),</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #555;">
          ${data.description || 'You have a new notification from FlexiLeads.'}
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}" 
             style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 25px; 
                    font-weight: bold;
                    display: inline-block;">
            🏠 View Dashboard
          </a>
        </div>
        
        <p style="font-size: 14px; color: #777; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          Need assistance? Contact our support team anytime.
        </p>
      </div>
    </div>
  `;
}

serve(handler);