import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PasswordResetRequest {
  email: string;
  resetUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, resetUrl }: PasswordResetRequest = await req.json();

    console.log("Sending password reset email to:", email);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Password Reset Request</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 28px; font-weight: bold; background: linear-gradient(135deg, #6366f1, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            .container { background: #f8fafc; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; }
            .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #64748b; }
            .warning { background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">ConsultHub</div>
          </div>
          
          <div class="container">
            <h2 style="color: #1e293b; margin-bottom: 20px;">Password Reset Request</h2>
            
            <p>Hello,</p>
            
            <p>We received a request to reset your password for your ConsultHub account. If you made this request, click the button below to reset your password:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Your Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 6px; font-size: 14px;">${resetUrl}</p>
            
            <div class="warning">
              <p><strong>Security Notice:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>This reset link will expire in 1 hour for security reasons</li>
                <li>If you didn't request this reset, you can safely ignore this email</li>
                <li>Your password will remain unchanged until you use this link</li>
              </ul>
            </div>
            
            <p>If you're having trouble with the button above, you can also reset your password by visiting the ConsultHub login page and clicking "Forgot Password" again.</p>
            
            <p>Best regards,<br><strong>The ConsultHub Team</strong></p>
          </div>
          
          <div class="footer">
            <p>This is an automated message from ConsultHub. Please do not reply to this email.</p>
            <p>If you need help, contact our support team.</p>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "ConsultHub <noreply@mail.themoneybees.co>",
      to: [email],
      subject: "Reset Your ConsultHub Password",
      html: emailHtml,
    });

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Password reset email sent successfully",
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to send password reset email" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);