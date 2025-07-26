import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailNotificationRequest {
  invitationId: string;
  previewLink: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { invitationId, previewLink }: EmailNotificationRequest = await req.json();

    // Fetch invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from('campaign_invitations')
      .select(`
        *,
        admin_profile:profiles!campaign_invitations_admin_id_fkey(full_name, email),
        target_profile:profiles!campaign_invitations_target_user_id_fkey(full_name, email)
      `)
      .eq('id', invitationId)
      .single();

    if (invitationError) {
      throw new Error(`Failed to fetch invitation: ${invitationError.message}`);
    }

    // Log the invitation details (in production, you'd send an actual email here)
    console.log('Campaign Invitation Created:');
    console.log('- Invitation ID:', invitation.id);
    console.log('- Campaign:', invitation.campaign_config.templateName);
    console.log('- Admin:', invitation.admin_profile?.full_name);
    console.log('- Target User:', invitation.target_profile?.full_name, `(${invitation.target_profile?.email})`);
    console.log('- Budget:', invitation.budget_amount, 'points');
    console.log('- Preview Link:', previewLink);
    console.log('- Expires:', new Date(invitation.expires_at).toLocaleDateString());

    // In a real implementation, you would integrate with an email service like Resend
    // For now, we'll just return the notification details
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Campaign invitation notification processed',
        details: {
          recipientEmail: invitation.target_profile?.email,
          campaignName: invitation.campaign_config.templateName,
          previewLink: previewLink,
          adminName: invitation.admin_profile?.full_name
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error in send-campaign-invitation function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);