import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CampaignInvitation {
  id: string;
  admin_id: string;
  target_user_id: string;
  template_id: string;
  campaign_config: any;
  budget_amount: number;
  invitation_token: string;
  status: string;
  expires_at: string;
  created_at: string;
  accepted_at?: string;
  campaign_id?: string;
}

export function useCampaignInvitations() {
  const [invitations, setInvitations] = useState<CampaignInvitation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('campaign_invitations')
        .select(`
          *,
          target_profile:profiles!campaign_invitations_target_user_id_fkey(full_name, email),
          template:campaign_templates(name, description)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error fetching campaign invitations:', error);
      toast.error('Failed to load campaign invitations');
    } finally {
      setLoading(false);
    }
  };

  const sendInvitationNotification = async (invitationId: string, previewLink: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-campaign-invitation', {
        body: {
          invitationId,
          previewLink
        }
      });

      if (error) throw error;
      
      console.log('Invitation notification sent:', data);
      return data;
    } catch (error) {
      console.error('Error sending invitation notification:', error);
      toast.error('Failed to send invitation notification');
      return null;
    }
  };

  const deleteInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('campaign_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;
      
      toast.success('Invitation deleted successfully');
      await fetchInvitations(); // Refresh the list
    } catch (error) {
      console.error('Error deleting invitation:', error);
      toast.error('Failed to delete invitation');
    }
  };

  const resendInvitation = async (invitationId: string) => {
    try {
      // Update the expiration date to extend the invitation
      const newExpirationDate = new Date();
      newExpirationDate.setDate(newExpirationDate.getDate() + 7); // Extend by 7 days

      const { error } = await supabase
        .from('campaign_invitations')
        .update({
          expires_at: newExpirationDate.toISOString(),
          status: 'pending'
        })
        .eq('id', invitationId);

      if (error) throw error;
      
      toast.success('Invitation extended successfully');
      await fetchInvitations(); // Refresh the list
    } catch (error) {
      console.error('Error extending invitation:', error);
      toast.error('Failed to extend invitation');
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  return {
    invitations,
    loading,
    fetchInvitations,
    sendInvitationNotification,
    deleteInvitation,
    resendInvitation
  };
}