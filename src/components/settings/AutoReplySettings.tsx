import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ConsultantAutoReply {
  auto_reply_enabled: boolean;
  auto_reply_message: string | null;
}

export function AutoReplySettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [autoReplyMessage, setAutoReplyMessage] = useState('');

  // Fetch consultant's auto-reply settings
  const { data: consultant } = useQuery({
    queryKey: ['consultant-auto-reply', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('consultants')
        .select('auto_reply_enabled, auto_reply_message')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      // Update local state
      setAutoReplyEnabled(data.auto_reply_enabled || false);
      setAutoReplyMessage(data.auto_reply_message || '');
      
      return data as ConsultantAutoReply;
    },
    enabled: !!user,
  });

  // Update auto-reply settings
  const updateAutoReply = useMutation({
    mutationFn: async ({ enabled, message }: { enabled: boolean; message: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('consultants')
        .update({
          auto_reply_enabled: enabled,
          auto_reply_message: enabled ? message.trim() || null : null,
        })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultant-auto-reply'] });
      toast({
        title: "Success",
        description: "Auto-reply settings updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update auto-reply settings",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (autoReplyEnabled && !autoReplyMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter an auto-reply message when enabling auto-reply",
        variant: "destructive",
      });
      return;
    }

    updateAutoReply.mutate({
      enabled: autoReplyEnabled,
      message: autoReplyMessage,
    });
  };

  const handleToggle = (enabled: boolean) => {
    setAutoReplyEnabled(enabled);
    if (!enabled) {
      setAutoReplyMessage('');
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-lg sm:text-xl">Auto-Reply Settings</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Set up automated responses to send when clients start conversations with you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between gap-4 py-2 sm:py-0">
          <div className="space-y-0.5 flex-1 min-w-0">
            <Label htmlFor="auto-reply-toggle" className="text-sm font-medium">
              Enable Auto-Reply
            </Label>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Automatically send a message when clients start new conversations
            </p>
          </div>
          <Switch
            id="auto-reply-toggle"
            checked={autoReplyEnabled}
            onCheckedChange={handleToggle}
            className="shrink-0"
          />
        </div>

        {autoReplyEnabled && (
          <div className="space-y-2">
            <Label htmlFor="auto-reply-message" className="text-sm font-medium">
              Auto-Reply Message
            </Label>
            <Textarea
              id="auto-reply-message"
              placeholder="Hi! Thanks for reaching out. I'll get back to you as soon as possible. In the meantime, feel free to share more details about what you need help with."
              value={autoReplyMessage}
              onChange={(e) => setAutoReplyMessage(e.target.value)}
              rows={4}
              maxLength={500}
              className="resize-none min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              {autoReplyMessage.length}/500 characters
            </p>
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={updateAutoReply.isPending}
          className="w-full h-11"
        >
          {updateAutoReply.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardContent>
    </Card>
  );
}