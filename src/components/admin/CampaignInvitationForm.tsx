import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Users, Target, Send } from 'lucide-react';

interface CampaignInvitationFormData {
  targetUserId: string;
  templateId: string;
  budgetAmount: number;
  customMessage: string;
  isPublic: boolean;
}

interface User {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  target_audience: string;
  campaign_angle: string;
  template_config: any;
}

interface CampaignInvitationFormProps {
  onInvitationCreated?: () => void;
}

export function CampaignInvitationForm({ onInvitationCreated }: CampaignInvitationFormProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string>('');

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<CampaignInvitationFormData>({
    defaultValues: {
      isPublic: false,
      targetUserId: '',
      templateId: '',
      budgetAmount: 0,
      customMessage: ''
    }
  });
  const watchIsPublic = watch('isPublic');

  React.useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, email')
        .eq('approval_status', 'approved')
        .neq('role', 'admin');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_templates')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    }
  };

  const onSubmit = async (data: CampaignInvitationFormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // For public proposals, use admin as placeholder target user
      const targetUserId = data.isPublic ? user.id : data.targetUserId;

      const campaignConfig = {
        templateName: selectedTemplate?.name,
        description: selectedTemplate?.description,
        targetAudience: selectedTemplate?.target_audience,
        campaignAngle: selectedTemplate?.campaign_angle,
        budgetRange: selectedTemplate?.template_config?.budgetRange,
        customMessage: data.customMessage
      };

      const { data: invitation, error } = await supabase
        .from('campaign_invitations')
        .insert({
          admin_id: user.id,
          target_user_id: targetUserId,
          template_id: data.templateId,
          campaign_config: campaignConfig,
          budget_amount: data.budgetAmount,
          is_public: data.isPublic
        })
        .select('invitation_token')
        .single();

      if (error) throw error;

      // Generate the preview link
      const baseUrl = window.location.origin;
      const previewLink = `${baseUrl}/campaign-preview/${invitation.invitation_token}`;
      setGeneratedLink(previewLink);

      const proposalType = data.isPublic ? "Public campaign proposal" : "Campaign proposal";
      toast.success(`${proposalType} created successfully!`);
      
      // Call the callback if provided
      if (onInvitationCreated) {
        onInvitationCreated();
      }

    } catch (error) {
      console.error('Error creating invitation:', error);
      toast.error('Failed to create campaign invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setValue('templateId', templateId);
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(template || null);
    
    if (template?.template_config?.budgetRange?.recommended) {
      setValue('budgetAmount', template.template_config.budgetRange.recommended);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success('Link copied to clipboard!');
  };

  const handleClose = () => {
    setIsOpen(false);
    setGeneratedLink('');
    reset();
    setSelectedTemplate(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Campaign Proposal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Create Campaign Proposal
          </DialogTitle>
        </DialogHeader>

        {generatedLink ? (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-600 flex items-center gap-2">
                <Send className="h-5 w-5" />
                Campaign Proposal Created Successfully!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {watchIsPublic ? 
                  'Share this public campaign proposal link with consultants:' :
                  'Send this campaign summary link to the user for review and approval:'
                }
              </p>
              <div className="bg-white p-3 rounded-lg border">
                <Label className="text-xs font-medium text-muted-foreground">Campaign Summary Link</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input 
                    value={generatedLink} 
                    readOnly 
                    className="font-mono text-xs"
                  />
                  <Button onClick={copyLink} variant="outline" size="sm">
                    Copy
                  </Button>
                </div>
              </div>
              <Button onClick={handleClose} className="w-full">
                Create Another Proposal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Proposal Type Selection */}
            <div className="space-y-2">
              <Label>Proposal Type</Label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    {...register('isPublic')}
                    value="false"
                    className="form-radio"
                  />
                  <span>Targeted Proposal</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    {...register('isPublic')}
                    value="true"
                    className="form-radio"
                  />
                  <span>Public Proposal</span>
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                {watchIsPublic ? 
                  'Public proposals can be accepted by any authenticated consultant' :
                  'Targeted proposals are sent to a specific user'
                }
              </p>
            </div>

            {/* Target User Selection - only show for targeted proposals */}
            {!watchIsPublic && (
              <div className="space-y-2">
                <Label htmlFor="targetUserId">Select User</Label>
                <Select onValueChange={(value) => setValue('targetUserId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user to invite" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{user.full_name} ({user.email})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.targetUserId && !watchIsPublic && (
                  <p className="text-sm text-red-500">Please select a user</p>
                )}
              </div>
            )}

            {/* Template Selection */}
            <div className="space-y-2">
              <Label htmlFor="templateId">Campaign Template</Label>
              <Select onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a campaign template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        <span>{template.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.templateId && (
                <p className="text-sm text-red-500">Please select a template</p>
              )}
            </div>

            {/* Template Preview */}
            {selectedTemplate && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Template Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm font-medium">{selectedTemplate.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Audience: {selectedTemplate.target_audience}</span>
                    <span>Angle: {selectedTemplate.campaign_angle}</span>
                  </div>
                  {selectedTemplate.template_config?.budgetRange && (
                    <div className="text-xs text-muted-foreground">
                      Budget Range: ${selectedTemplate.template_config.budgetRange.min} - ${selectedTemplate.template_config.budgetRange.max}
                      (Recommended: ${selectedTemplate.template_config.budgetRange.recommended})
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Budget Amount */}
            <div className="space-y-2">
              <Label htmlFor="budgetAmount">Budget Amount (Points)</Label>
              <Input
                type="number"
                {...register('budgetAmount', { 
                  required: 'Budget amount is required',
                  min: { value: 50, message: 'Minimum budget is 50 points' },
                  max: { value: 5000, message: 'Maximum budget is 5000 points' }
                })}
                placeholder="Enter budget in points"
              />
              {errors.budgetAmount && (
                <p className="text-sm text-red-500">{errors.budgetAmount.message}</p>
              )}
            </div>

            {/* Custom Message */}
            <div className="space-y-2">
              <Label htmlFor="customMessage">Custom Message (Optional)</Label>
              <Textarea
                {...register('customMessage')}
                placeholder="Add a personal message for the user..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Creating...' : 'Create Proposal'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}