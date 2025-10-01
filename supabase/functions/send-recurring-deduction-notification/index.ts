import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  reason: string;
  dayOfMonth: number;
  nextBillingDate: string;
  adminEmail: string;
  adminName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      userId,
      userEmail,
      userName,
      amount,
      reason,
      dayOfMonth,
      nextBillingDate,
      adminEmail,
      adminName,
    }: NotificationRequest = await req.json();

    console.log('Sending recurring deduction notifications to:', { userEmail, adminEmail });

    const formattedDate = new Date(nextBillingDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Email to user
    const userEmailResponse = await resend.emails.send({
      from: "Flexi Credits <noreply@mail.themoneybees.co>",
      to: [userEmail],
      subject: "Recurring Deduction Set Up - Flexi Credits",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Recurring Deduction Notification</h2>
          <p>Hello ${userName},</p>
          <p>A recurring deduction has been set up on your account by our admin team.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #555;">Deduction Details:</h3>
            <p><strong>Amount:</strong> ${amount} Flexi Credits</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p><strong>Billing Day:</strong> Day ${dayOfMonth} of each month</p>
            <p><strong>Next Deduction:</strong> ${formattedDate}</p>
          </div>
          
          <p>This amount will be automatically deducted from your Flexi Credits balance on the ${dayOfMonth}${getDaySuffix(dayOfMonth)} of each month.</p>
          <p>If you have any questions or concerns about this deduction, please contact our support team.</p>
          
          <p style="margin-top: 30px;">Best regards,<br>The Flexi Credits Team</p>
        </div>
      `,
    });

    console.log("User email sent successfully:", userEmailResponse);

    // Email to admin
    const adminEmailResponse = await resend.emails.send({
      from: "Flexi Credits Admin <admin@mail.themoneybees.co>",
      to: [adminEmail],
      subject: "Recurring Deduction Created - Admin Notification",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Recurring Deduction Created</h2>
          <p>Hello ${adminName},</p>
          <p>You have successfully set up a recurring deduction for the following user:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #555;">User Information:</h3>
            <p><strong>Name:</strong> ${userName}</p>
            <p><strong>Email:</strong> ${userEmail}</p>
            <p><strong>User ID:</strong> ${userId}</p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #555;">Deduction Details:</h3>
            <p><strong>Amount:</strong> ${amount} Flexi Credits</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p><strong>Billing Day:</strong> Day ${dayOfMonth} of each month</p>
            <p><strong>Next Deduction:</strong> ${formattedDate}</p>
          </div>
          
          <p>The user has been notified via email about this recurring deduction.</p>
          <p>The system will automatically process this deduction on the scheduled date.</p>
          
          <p style="margin-top: 30px;">Best regards,<br>Flexi Credits System</p>
        </div>
      `,
    });

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
    console.error("Error in send-recurring-deduction-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function getDaySuffix(day: number): string {
  if (day >= 11 && day <= 13) {
    return 'th';
  }
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

serve(handler);
