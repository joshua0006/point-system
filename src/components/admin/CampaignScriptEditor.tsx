import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Phone, MessageSquare, Clock, Edit2, Save, X, Users, ExternalLink } from '@/lib/icons';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CampaignScriptEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CampaignScriptEditor = ({ isOpen, onClose }: CampaignScriptEditorProps) => {
  const { toast } = useToast();
  const [campaignTemplates, setCampaignTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [editingScripts, setEditingScripts] = useState<any>(null);
  const [editingQuickLinks, setEditingQuickLinks] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCampaignTemplates();
    }
  }, [isOpen]);

  const loadCampaignTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('campaign_templates')
        .select('*')
        .eq('is_active', true)
        .order('target_audience');

      if (error) throw error;
      setCampaignTemplates(data || []);
    } catch (error) {
      console.error('Error loading campaign templates:', error);
      toast({
        title: "Error",
        description: "Failed to load campaign templates.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTargetAudienceName = (template: any) => {
    const config = template.template_config as any;
    return template.target_audience === 'custom' && config?.customAudienceName 
      ? config.customAudienceName 
      : template.target_audience;
  };

  const getScriptsFromTemplate = (template: any) => {
    const config = template.template_config as any;
    return config?.scripts || {
      calling: "Hi [LEAD_NAME], I'm calling from [CONSULTANT_NAME] regarding your interest in financial planning. We have a limited-time offer for a free consultation to help you secure your financial future. Would you be available for a 15-minute call this week?",
      texting: "Hi [LEAD_NAME]! Thanks for your interest in financial planning. I'm [CONSULTANT_NAME] and I'd love to help you achieve your financial goals. When would be a good time for a quick 15-min call? Text me back!",
      reminder: "Hi [LEAD_NAME], this is [CONSULTANT_NAME] following up on our previous conversation about financial planning. I wanted to remind you about our free consultation offer. Are you still interested in securing your financial future?"
    };
  };

  const getQuickLinksFromTemplate = (template: any) => {
    const config = template.template_config as any;
    return config?.quick_links || { call: "", sms: "", reminder: "" };
  };

  const handleEditScripts = (template: any) => {
    setSelectedTemplate(template);
    setEditingScripts(getScriptsFromTemplate(template));
    setEditingQuickLinks(getQuickLinksFromTemplate(template));
  };

  const handleSaveScripts = async () => {
    if (!selectedTemplate || !editingScripts) return;

    try {
      setSaving(true);
      const currentConfig = selectedTemplate.template_config as any;
      const updatedConfig = {
        ...currentConfig,
        scripts: editingScripts,
        quick_links: editingQuickLinks || currentConfig?.quick_links || { call: "", sms: "", reminder: "" }
      };

      const { error } = await supabase
        .from('campaign_templates')
        .update({
          template_config: updatedConfig,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTemplate.id);

      if (error) throw error;

      toast({
        title: "Scripts Updated",
        description: `Scripts for ${selectedTemplate.name} have been updated successfully.`
      });

      // Update local state
      setCampaignTemplates(prev => 
        prev.map(template => 
          template.id === selectedTemplate.id 
            ? { ...template, template_config: updatedConfig }
            : template
        )
      );

      setSelectedTemplate(null);
      setEditingScripts(null);
      setEditingQuickLinks(null);
    } catch (error) {
      console.error('Error updating scripts:', error);
      toast({
        title: "Error",
        description: "Failed to update scripts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setSelectedTemplate(null);
    setEditingScripts(null);
    setEditingQuickLinks(null);
  };

  // Group templates by target audience
  const templatesByAudience = campaignTemplates.reduce((groups, template) => {
    const audienceName = getTargetAudienceName(template);
    if (!groups[audienceName]) {
      groups[audienceName] = [];
    }
    groups[audienceName].push(template);
    return groups;
  }, {} as Record<string, any[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Campaign Script Editor</DialogTitle>
          <DialogDescription>
            Manage calling, texting, and reminder scripts for all campaign templates.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(templatesByAudience).map(([audienceName, templates]) => (
              <div key={audienceName} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{audienceName}</h3>
                  <Badge variant="outline">
                    {(templates as any[]).length} campaign{(templates as any[]).length !== 1 ? 's' : ''}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {(templates as any[]).map((template) => {
                    const scripts = getScriptsFromTemplate(template);
                    const quickLinks = (template.template_config as any)?.quick_links || {};
                    
                    return (
                      <Card key={template.id} className="border-l-4 border-l-primary">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditScripts(template)}
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Edit Scripts
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                        </CardHeader>
                        <CardContent>
                          <Tabs defaultValue="calling" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                              <TabsTrigger value="calling" className="text-xs">
                                <Phone className="h-3 w-3 mr-1" />
                                Call
                              </TabsTrigger>
                              <TabsTrigger value="texting" className="text-xs">
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Text
                              </TabsTrigger>
                              <TabsTrigger value="reminder" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                Reminder
                              </TabsTrigger>
                            </TabsList>
                            <TabsContent value="calling" className="mt-3">
                              <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 max-h-20 overflow-y-auto">
                                {scripts.calling}
                              </div>
                            </TabsContent>
                            <TabsContent value="texting" className="mt-3">
                              <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 max-h-20 overflow-y-auto">
                                {scripts.texting}
                              </div>
                            </TabsContent>
                            <TabsContent value="reminder" className="mt-3">
                              <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 max-h-20 overflow-y-auto">
                                {scripts.reminder}
                              </div>
                            </TabsContent>
                          </Tabs>

                          {(quickLinks.call || quickLinks.sms || quickLinks.reminder) && (
                            <div className="mt-4">
                              <div className="text-xs font-medium mb-2">Quick Links</div>
                              <div className="flex flex-wrap gap-2">
                                {quickLinks.call && (
                                  <Button asChild size="sm" variant="secondary">
                                    <a href={quickLinks.call} target="_blank" rel="noopener noreferrer">
                                      <Phone className="h-3 w-3 mr-1" />
                                      Call Link
                                      <ExternalLink className="h-3 w-3 ml-1" />
                                    </a>
                                  </Button>
                                )}
                                {quickLinks.sms && (
                                  <Button asChild size="sm" variant="secondary">
                                    <a href={quickLinks.sms} target="_blank" rel="noopener noreferrer">
                                      <MessageSquare className="h-3 w-3 mr-1" />
                                      SMS Link
                                      <ExternalLink className="h-3 w-3 ml-1" />
                                    </a>
                                  </Button>
                                )}
                                {quickLinks.reminder && (
                                  <Button asChild size="sm" variant="secondary">
                                    <a href={quickLinks.reminder} target="_blank" rel="noopener noreferrer">
                                      <Clock className="h-3 w-3 mr-1" />
                                      Reminder Link
                                      <ExternalLink className="h-3 w-3 ml-1" />
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Script Edit Modal */}
      <Dialog open={!!selectedTemplate} onOpenChange={handleCancelEdit}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Scripts - {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              Edit the calling, texting, and reminder scripts for this campaign template.
              Use [LEAD_NAME] and [CONSULTANT_NAME] as placeholders.
            </DialogDescription>
          </DialogHeader>

          {editingScripts && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="calling-script" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Calling Script
                </Label>
                <Textarea
                  id="calling-script"
                  value={editingScripts.calling}
                  onChange={(e) => setEditingScripts(prev => ({ ...prev, calling: e.target.value }))}
                  placeholder="Enter the calling script..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="texting-script" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Texting Script
                </Label>
                <Textarea
                  id="texting-script"
                  value={editingScripts.texting}
                  onChange={(e) => setEditingScripts(prev => ({ ...prev, texting: e.target.value }))}
                  placeholder="Enter the texting script..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminder-script" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Reminder Script
                </Label>
                <Textarea
                  id="reminder-script"
                  value={editingScripts.reminder}
                  onChange={(e) => setEditingScripts(prev => ({ ...prev, reminder: e.target.value }))}
                  placeholder="Enter the reminder script..."
                  rows={4}
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-medium">Quick Links (optional)</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="call-link" className="text-xs flex items-center gap-1"><Phone className="h-3 w-3" /> Call link</Label>
                      <Input
                        id="call-link"
                        type="url"
                        placeholder="https://..."
                        value={editingQuickLinks?.call || ''}
                        onChange={(e) => setEditingQuickLinks((prev: any) => ({ ...(prev || {}), call: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="sms-link" className="text-xs flex items-center gap-1"><MessageSquare className="h-3 w-3" /> SMS link</Label>
                      <Input
                        id="sms-link"
                        type="url"
                        placeholder="https://..."
                        value={editingQuickLinks?.sms || ''}
                        onChange={(e) => setEditingQuickLinks((prev: any) => ({ ...(prev || {}), sms: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="reminder-link" className="text-xs flex items-center gap-1"><Clock className="h-3 w-3" /> Reminder link</Label>
                      <Input
                        id="reminder-link"
                        type="url"
                        placeholder="https://..."
                        value={editingQuickLinks?.reminder || ''}
                        onChange={(e) => setEditingQuickLinks((prev: any) => ({ ...(prev || {}), reminder: e.target.value }))}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">These external URLs will open in a new tab.</p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Available Placeholders:</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div><code>[LEAD_NAME]</code> - Will be replaced with the lead's name</div>
                    <div><code>[CONSULTANT_NAME]</code> - Will be replaced with the consultant's name</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveScripts} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Scripts'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};