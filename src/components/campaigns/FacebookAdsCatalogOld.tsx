import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Target, Zap, Users } from "lucide-react";
import { CampaignCard } from "./CampaignCard";
import { ScriptDrawer } from "./ScriptDrawer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface FacebookAdsCatalogProps {
  onComplete: (campaignData: any) => void;
  onBack: () => void;
  userBalance: number;
  campaignTargets: any[];
}

export const FacebookAdsCatalog = React.memo(({ onComplete, onBack, userBalance, campaignTargets }: FacebookAdsCatalogProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [campaignTemplates, setCampaignTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [showScriptDrawer, setShowScriptDrawer] = useState(false);
  const [scriptDrawerData, setScriptDrawerData] = useState<any>(null);
  const [activeAudience, setActiveAudience] = useState<string>("all");
  const [campaignData, setCampaignData] = useState<any>({
    budget: 0,
    consultantName: profile?.full_name || '',
    targetAudience: null,
    campaignType: null
  });
  const [prorateFirstMonth, setProrateFirstMonth] = useState(true);

  const loadCampaignsData = async () => {
    try {
      setLoading(true);
      const { data: templates, error } = await supabase
        .from('campaign_templates')
        .select('*')
        .eq('is_active', true)
        .eq('campaign_type', 'facebook_ads')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaignTemplates(templates || []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to load campaign templates.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaignsData();
  }, []);

  useEffect(() => {
    if (profile?.full_name && !campaignData.consultantName) {
      setCampaignData(prev => ({
        ...prev,
        consultantName: profile.full_name || ''
      }));
    }
  }, [profile?.full_name, campaignData.consultantName]);

  interface AudienceGroup {
    name: string;
    templates: any[];
  }

  const getAudienceGroups = (): Record<string, AudienceGroup> => {
    const groups: Record<string, AudienceGroup> = {
      all: { name: "All Audiences", templates: campaignTemplates }
    };

    campaignTemplates.forEach(template => {
      const audience = template.target_audience || 'general';
      if (!groups[audience]) {
        groups[audience] = {
          name: getAudienceName(audience),
          templates: []
        };
      }
      groups[audience].templates.push(template);
    });

    return groups;
  };

  const getAudienceName = (audienceKey: string): string => {
    const names: Record<string, string> = {
      'general': 'General Public',
      'seniors': 'Seniors 55+',
      'nsf': 'NSF Personnel',
      'mothers': 'Mothers with Children'
    };
    return names[audienceKey] || audienceKey;
  };

  const handleCampaignSelect = (template: any) => {
    setSelectedTemplate(template);
    setCampaignData(prev => ({
      ...prev,
      budget: template.template_config?.budget || 500,
      targetAudience: {
        id: template.target_audience,
        name: getAudienceName(template.target_audience)
      },
      campaignType: template.campaign_angle || template.name,
      template: template
    }));
    setShowLaunchModal(true);
  };

  const handleScriptView = (template: any) => {
    setScriptDrawerData(template);
    setShowScriptDrawer(true);
  };

  const handleLaunch = () => {
    if (!selectedTemplate) return;

    const launchData = {
      method: 'facebook-ads',
      targetAudience: campaignData.targetAudience,
      campaignType: campaignData.campaignType,
      budget: campaignData.budget,
      consultantName: campaignData.consultantName,
      template: selectedTemplate,
      prorateFirstMonth
    };

    onComplete(launchData);
  };

  const canLaunch = () => {
    const balance = userBalance || 0;
    const budget = campaignData.budget;
    
    if (!budget) return false;
    
    const balanceAfterDeduction = balance - budget;
    return balanceAfterDeduction >= -1000;
  };

  const audienceGroups = getAudienceGroups();

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading Facebook Ad templates...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Facebook Ad Campaigns
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose from our proven Facebook ad templates designed specifically for financial advisors in Singapore.
          </p>
        </CardHeader>
      </Card>

      {/* Audience Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeAudience} onValueChange={setActiveAudience} className="w-full">
            <div className="border-b bg-muted/30 px-6 pt-6">
              <TabsList className="grid w-full grid-cols-5">
                {Object.entries(audienceGroups).map(([key, group]) => (
                  <TabsTrigger key={key} value={key} className="text-xs">
                    {group.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {Object.entries(audienceGroups).map(([key, group]: [string, any]) => (
              <TabsContent key={key} value={key} className="p-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {group.templates?.map((template: any, index: number) => (
                    <div key={template.id || index} className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">{template.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                      <div className="flex gap-2">
                        <Button onClick={() => handleCampaignSelect(template)} size="sm">
                          Select
                        </Button>
                        <Button variant="outline" onClick={() => handleScriptView(template)} size="sm">
                          View Script
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {(!group.templates || group.templates.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    No templates available for this audience segment.
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Methods
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Launch Modal */}
      <Dialog open={showLaunchModal} onOpenChange={setShowLaunchModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Launch Facebook Ad Campaign</DialogTitle>
            <DialogDescription>
              Configure your campaign settings before launching.
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-6">
              {/* Campaign Info */}
              <div className="grid gap-4">
                <div>
                  <Label className="text-sm font-medium">Campaign Template</Label>
                  <p className="text-sm text-muted-foreground">{selectedTemplate.name}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Target Audience</Label>
                  <p className="text-sm text-muted-foreground">
                    {getAudienceName(selectedTemplate.target_audience)}
                  </p>
                </div>
              </div>

              {/* Budget Settings */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="budget" className="text-sm font-medium">Monthly Budget (Points)</Label>
                  <Input
                    id="budget"
                    type="number"
                    min="100"
                    max="5000"
                    value={campaignData.budget}
                    onChange={(e) => setCampaignData(prev => ({
                      ...prev,
                      budget: parseInt(e.target.value) || 0
                    }))}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Recommended: {selectedTemplate.template_config?.budget || 500} points
                  </p>
                </div>

                <div>
                  <Label htmlFor="consultant" className="text-sm font-medium">Consultant Name</Label>
                  <Input
                    id="consultant"
                    value={campaignData.consultantName}
                    onChange={(e) => setCampaignData(prev => ({
                      ...prev,
                      consultantName: e.target.value
                    }))}
                    className="mt-1"
                    placeholder="Your name for the campaign"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="prorate"
                    checked={prorateFirstMonth}
                    onCheckedChange={setProrateFirstMonth}
                  />
                  <Label htmlFor="prorate" className="text-sm">
                    Prorate first month billing
                  </Label>
                </div>
              </div>

              {/* Balance Warning */}
              {campaignData.budget && (userBalance - campaignData.budget) < -1000 && (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-red-700 dark:text-red-400 text-sm">
                    <strong>Balance limit exceeded:</strong> This would bring your balance to {userBalance - campaignData.budget} points. 
                    The minimum allowed balance is -1000 points.
                  </p>
                </div>
              )}

              {/* Expected Results */}
              {selectedTemplate.template_config && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Expected Campaign Performance</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold">{selectedTemplate.template_config.expected_leads || 'N/A'}</div>
                      <div className="text-muted-foreground">Leads/Month</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{selectedTemplate.template_config.cost_per_lead || 'N/A'}</div>
                      <div className="text-muted-foreground">Cost per Lead</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{selectedTemplate.template_config.duration_days || 30} days</div>
                      <div className="text-muted-foreground">Duration</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLaunchModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleLaunch}
              disabled={!canLaunch()}
            >
              <Zap className="h-4 w-4 mr-2" />
              Launch Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Script Drawer */}
      {scriptDrawerData && (
        <ScriptDrawer
          isOpen={showScriptDrawer}
          onClose={() => setShowScriptDrawer(false)}
          campaignTitle={scriptDrawerData.name || 'Campaign'}
          targetAudience={scriptDrawerData.target_audience || 'general'}
          scripts={scriptDrawerData.scripts || []}
          templateId={scriptDrawerData.id || ''}
          campaignAngle={scriptDrawerData.campaign_angle}
        />
      )}
    </div>
  );
});

FacebookAdsCatalog.displayName = 'FacebookAdsCatalog';

export default FacebookAdsCatalog;