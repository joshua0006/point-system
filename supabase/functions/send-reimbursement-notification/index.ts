import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReimbursementNotificationRequest {
  userEmail: string;
  userName: string;
  merchant: string;
  amount: number;
  requestId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName, merchant, amount, requestId }: ReimbursementNotificationRequest = await req.json();

    console.log("[REIMBURSEMENT-EMAIL] Sending notifications", { userEmail, userName, merchant, amount, requestId });

    // Send email to user
    const userEmailResponse = await resend.emails.send({
      from: "Reimbursements <onboarding@resend.dev>",
      to: [userEmail],
      subject: "Reimbursement Request Submitted",
      html: `
        <h1>Your Reimbursement Request Has Been Submitted</h1>
        <p>Hi ${userName},</p>
        <p>We've received your reimbursement request and it's now under review.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Request Details:</strong></p>
          <p><strong>Merchant:</strong> ${merchant}</p>
          <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
          <p><strong>Request ID:</strong> ${requestId}</p>
        </div>
        <p>Our team will review your request and process it shortly. You'll receive another email once it's been approved or if we need additional information.</p>
        <p>Thank you!</p>
      `,
    });

    console.log("[REIMBURSEMENT-EMAIL] User email sent", userEmailResponse);

    // Send email to admin
    const adminEmailResponse = await resend.emails.send({
      from: "Reimbursements <onboarding@resend.dev>",
      to: ["tanjunsing@gmail.com"],
      subject: "New Reimbursement Request Pending Review",
      html: `
        <h1>New Reimbursement Request</h1>
        <p>A new reimbursement request has been submitted and requires your review.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Request Details:</strong></p>
          <p><strong>User:</strong> ${userName} (${userEmail})</p>
          <p><strong>Merchant:</strong> ${merchant}</p>
          <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
          <p><strong>Request ID:</strong> ${requestId}</p>
        </div>
        <p><a href="${Deno.env.get('SITE_URL')}/admin-dashboard/reimbursements" style="background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Review Request</a></p>
      `,
    });

    console.log("[REIMBURSEMENT-EMAIL] Admin email sent", adminEmailResponse);

    return new Response(
      JSON.stringify({ 
        success: true,
        userEmail: userEmailResponse,
        adminEmail: adminEmailResponse
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
    console.error("[REIMBURSEMENT-EMAIL] Error:", error);
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
