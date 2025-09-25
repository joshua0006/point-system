import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SUBSCRIPTION-EMAIL] ${step}${detailsStr}`);
};

interface SubscriptionEmailRequest {
  emailType: 'upgrade' | 'downgrade' | 'new_subscription';
  subscriptionData: {
    credits: number;
    planName?: string;
    upgradeCreditsAdded?: number;
    oldCredits?: number;
    savingsAmount?: number;
    amount?: number;
  };
  userEmail?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user info - either from auth or from request for webhook calls
    let user;
    let userId;
    let userEmail;
    
    const { emailType, subscriptionData, userEmail: providedEmail }: SubscriptionEmailRequest = await req.json();
    
    if (providedEmail) {
      // For webhook calls, use provided email
      userEmail = providedEmail;
      userId = 'webhook-call';
      
      // Try to get user info from email
      const { data: profileByEmail } = await supabaseClient
        .from('profiles')
        .select('full_name, user_id')
        .eq('email', userEmail)
        .maybeSingle();
        
      if (profileByEmail) {
        userId = profileByEmail.user_id;
      }
      
      logStep("Using provided email", { userEmail, userId });
    } else {
      // Get user from auth header
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        throw new Error("No authorization header");
      }

      const token = authHeader.replace("Bearer ", "");
      const { data: { user: authUser }, error: userError } = await supabaseClient.auth.getUser(token);
      
      if (userError || !authUser) {
        throw new Error("User not authenticated");
      }
      
      user = authUser;
      userId = user.id;
      userEmail = user.email;
      
      logStep("User authenticated", { userId, email: userEmail });
    }

    // Get user profile for full name
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('full_name')
      .eq('user_id', userId)
      .maybeSingle();
    
    logStep("Processing email", { emailType, subscriptionData });

    const userFullName = profile?.full_name || userEmail?.split('@')[0] || 'Customer';
    const planName = subscriptionData.planName || `Pro ${Math.ceil(subscriptionData.credits / 100)} Plan`;

    let userSubject = "";
    let userHtml = "";
    let adminSubject = "";
    let adminHtml = "";

    switch (emailType) {
      case 'upgrade':
        userSubject = `🎉 Subscription Upgraded - Welcome to ${planName}!`;
        userHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">🎉 Subscription Upgraded!</h1>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-bottom: 20px;">Hi ${userFullName},</h2>
              
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                Great news! Your subscription has been successfully upgraded to <strong>${planName}</strong>.
              </p>
              
              <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 25px 0;">
                <h3 style="margin: 0 0 15px 0; color: #333;">✨ What's New:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #555;">
                  <li><strong>${subscriptionData.credits}</strong> flexi-credits per month</li>
                  <li><strong>${subscriptionData.upgradeCreditsAdded || 0}</strong> additional credits added immediately</li>
                  <li>Access to all premium features</li>
                  <li>Priority customer support</li>
                </ul>
              </div>
              
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                The upgrade difference has been charged immediately, and from your next billing cycle, 
                you'll be charged the full ${planName} amount monthly.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${Deno.env.get("SITE_URL") || "https://rrnaquethuzvbsxcssss.supabase.co"}/dashboard" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 25px; 
                          font-weight: bold;
                          display: inline-block;">
                  🏠 My Dashboard
                </a>
              </div>
              
              <p style="font-size: 14px; color: #777; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                Questions? Reply to this email or contact our support team.
              </p>
            </div>
          </div>
        `;

        adminSubject = `📈 User Subscription Upgraded - ${userFullName}`;
        adminHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Subscription Upgrade Notification</h2>
            <p><strong>User:</strong> ${userFullName} (${userEmail})</p>
            <p><strong>New Plan:</strong> ${planName}</p>
            <p><strong>Credits per Month:</strong> ${subscriptionData.credits}</p>
            <p><strong>Immediate Credits Added:</strong> ${subscriptionData.upgradeCreditsAdded || 0}</p>
            <p><strong>Upgrade Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
        `;
        break;

      case 'downgrade':
        userSubject = `Subscription Updated - ${planName}`;
        userHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">Subscription Updated</h1>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-bottom: 20px;">Hi ${userFullName},</h2>
              
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                Your subscription has been updated to <strong>${planName}</strong>, effective from your next billing cycle.
              </p>
              
              <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 25px 0;">
                <h3 style="margin: 0 0 15px 0; color: #333;">📋 Changes Summary:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #555;">
                  <li><strong>${subscriptionData.credits}</strong> flexi-credits per month (down from ${subscriptionData.oldCredits || 0})</li>
                  <li><strong>S$${subscriptionData.savingsAmount || 0}</strong> monthly savings</li>
                  <li>Your existing credits don't expire and remain available</li>
                  <li>Changes take effect on your next billing date (1st of next month)</li>
                </ul>
              </div>
              
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                You'll be charged <strong>S$${subscriptionData.credits}</strong> monthly starting next month, saving you S$${subscriptionData.savingsAmount || 0} per month.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${Deno.env.get("SITE_URL") || "https://rrnaquethuzvbsxcssss.supabase.co"}/dashboard" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 25px; 
                          font-weight: bold;
                          display: inline-block;">
                  🏠 My Dashboard
                </a>
              </div>
              
              <p style="font-size: 14px; color: #777; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                Questions? Reply to this email or contact our support team.
              </p>
            </div>
          </div>
        `;

        adminSubject = `📉 User Subscription Downgraded - ${userFullName}`;
        adminHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Subscription Downgrade Notification</h2>
            <p><strong>User:</strong> ${userFullName} (${userEmail})</p>
            <p><strong>New Plan:</strong> ${planName}</p>
            <p><strong>Previous Credits:</strong> ${subscriptionData.oldCredits || 0} per month</p>
            <p><strong>New Credits:</strong> ${subscriptionData.credits} per month</p>
            <p><strong>Monthly Savings:</strong> S$${subscriptionData.savingsAmount || 0}</p>
            <p><strong>Effective Date:</strong> Next billing cycle (1st of next month)</p>
            <p><strong>Downgrade Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
        `;
        break;

      case 'new_subscription':
        userSubject = `🎉 Welcome to ${planName}!`;
        userHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">🎉 Welcome to ${planName}!</h1>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-bottom: 20px;">Hi ${userFullName},</h2>
              
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                Welcome! Your subscription to <strong>${planName}</strong> is now active.
              </p>
              
              <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 25px 0;">
                <h3 style="margin: 0 0 15px 0; color: #333;">🎁 Your Benefits:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #555;">
                  <li><strong>${subscriptionData.credits}</strong> flexi-credits per month</li>
                  <li>Access to all premium features</li>
                  <li>Priority customer support</li>
                  <li>Advanced campaign tools</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${Deno.env.get("SITE_URL") || "https://rrnaquethuzvbsxcssss.supabase.co"}/dashboard" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 25px; 
                          font-weight: bold;
                          display: inline-block;">
                  🚀 Go to Dashboard
                </a>
              </div>
            </div>
          </div>
        `;

        adminSubject = `🆕 New Subscription - ${userFullName}`;
        adminHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">New Subscription Notification</h2>
            <p><strong>User:</strong> ${userFullName} (${userEmail})</p>
            <p><strong>Plan:</strong> ${planName}</p>
            <p><strong>Credits per Month:</strong> ${subscriptionData.credits}</p>
            <p><strong>Subscription Time:</strong> ${new Date().toLocaleString()}</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get("SITE_URL") || "https://rrnaquethuzvbsxcssss.supabase.co"}/admin-dashboard" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        font-weight: bold; 
                        margin-right: 15px;
                        display: inline-block;">
                🏠 Admin Dashboard
              </a>
              <a href="${Deno.env.get("SITE_URL") || "https://rrnaquethuzvbsxcssss.supabase.co"}/admin-dashboard?tab=billing" 
                 style="background: #f8f9ff; 
                        color: #667eea; 
                        border: 2px solid #667eea;
                        padding: 13px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        font-weight: bold;
                        display: inline-block;">
                💰 View Revenue & Stats
              </a>
            </div>
          </div>
        `;
        break;

      default:
        throw new Error(`Unsupported email type: ${emailType}`);
    }

    // Send user email
    const userEmailResponse = await resend.emails.send({
      from: "AgentHub <noreply@mail.themoneybees.co>",
      to: [userEmail!],
      subject: userSubject,
      html: userHtml,
    });

    logStep("User email sent", { response: userEmailResponse });

    // Send admin email
    const adminEmailResponse = await resend.emails.send({
      from: "AgentHub System <noreply@mail.themoneybees.co>",
      to: ["leotanjs95@gmail.com"], // Replace with actual admin email
      subject: adminSubject,
      html: adminHtml,
    });

    logStep("Admin email sent", { response: adminEmailResponse });

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
    logStep("Error sending subscription emails", { error: error.message });
    
    return new Response(JSON.stringify({ 
      error: error.message || "Failed to send subscription emails" 
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json", 
        ...corsHeaders 
      },
    });
  }
};

serve(handler);