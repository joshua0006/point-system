import { useState, useEffect } from "react";
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

export const FacebookAdsCatalog = ({ onComplete, onBack, userBalance, campaignTargets }: FacebookAdsCatalogProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [campaignTemplates, setCampaignTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [showScriptDrawer, setShowScriptDrawer] = useState(false);
  const [scriptDrawerData, setScriptDrawerData] = useState<any>(null);
  const [activeAudience, setActiveAudience] = useState<string>("all");
  const [campaignData, setCampaignData] = useState({
    budget: 0,
    consultantName: profile?.full_name || ''
  });
  const [prorateFirstMonth, setProrateFirstMonth] = useState(true);

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

  const loadCampaignsData = async () => {
    try {
      setLoading(true);

      // Load campaign templates
      const { data: templates, error: templatesError } = await supabase
        .from('campaign_templates')
        .select('*')
        .eq('is_active', true)
        .order('target_audience');

      if (templatesError) throw templatesError;

      setCampaignTemplates(templates || []);
    } catch (error) {
      console.error('Error loading campaigns data:', error);
      toast({
        title: "Error",
        description: "Failed to load campaign data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTargetAudienceInfo = (template: any) => {
    const config = template.template_config as any;
    return {
      name: template.target_audience === 'custom' && config?.customAudienceName 
        ? config.customAudienceName 
        : template.target_audience,
      budgetRange: config?.budgetRange || { min: 200, max: 1500, recommended: 500 }
    };
  };

  const getScriptsForTemplate = (template: any) => {
    const config = template.template_config as any;
    return config?.scripts || {
      calling: "Professional calling script will be provided",
      texting: "SMS follow-up script will be provided", 
      reminder: "Reminder sequence will be provided"
    };
  };

  const handleViewScripts = (template: any) => {
    const audienceInfo = getTargetAudienceInfo(template);
    const scripts = getScriptsForTemplate(template);
    
    setScriptDrawerData({
      template,
      audienceInfo,
      scripts: [
        { type: 'call', content: scripts.calling || 'Professional calling script for lead generation targeting ' + audienceInfo.name },
        { type: 'sms', content: scripts.texting || 'SMS follow-up script for ' + audienceInfo.name + ' prospects' },
        { type: 'followup', content: scripts.reminder || 'Follow-up email sequence for ' + audienceInfo.name }
      ]
    });
    setShowScriptDrawer(true);
  };

  const handleLaunchCampaign = (template: any) => {
    const audienceInfo = getTargetAudienceInfo(template);
    setSelectedTemplate(template);
    setCampaignData(prev => ({
      ...prev,
      budget: audienceInfo.budgetRange.recommended
    }));
    setShowLaunchModal(true);
  };

  const handleConfirmLaunch = () => {
    if (!selectedTemplate) return;

    const audienceInfo = getTargetAudienceInfo(selectedTemplate);
    const config = selectedTemplate.template_config as any;
    
    const launchData = {
      method: 'facebook-ads',
      templateId: selectedTemplate.id,
      targetAudience: {
        id: selectedTemplate.id,
        name: audienceInfo.name,
        budgetRange: audienceInfo.budgetRange
      },
      campaignType: config?.campaignTypes?.[0] || 'Facebook Lead Ads',
      budget: campaignData.budget,
      consultantName: campaignData.consultantName,
      prorateFirstMonth,
      scripts: getScriptsForTemplate(selectedTemplate)
    };

    onComplete(launchData);
  };

  const canProceed = () => {
    if (!selectedTemplate) return false;
    const audienceInfo = getTargetAudienceInfo(selectedTemplate);
    const currentBalance = profile?.flexi_credits_balance || 0;
    return campaignData.budget >= audienceInfo.budgetRange.min && 
           campaignData.budget <= audienceInfo.budgetRange.max &&
           campaignData.consultantName.trim() !== '' && 
           currentBalance >= campaignData.budget;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading campaign options...</p>
        </div>
      </div>
    );
  }

  // Group templates by target audience
  const templatesByAudience = campaignTemplates.reduce((groups, template) => {
    const audienceInfo = getTargetAudienceInfo(template);
    if (!groups[audienceInfo.name]) {
      groups[audienceInfo.name] = [];
    }
    groups[audienceInfo.name].push(template);
    return groups;
  }, {} as Record<string, any[]>);

  // Get all audience names for navigation
  const audienceNames = Object.keys(templatesByAudience);
  
  // Filter templates based on active audience
  const filteredTemplates = activeAudience === "all" 
    ? campaignTemplates 
    : templatesByAudience[activeAudience] || [];

  return (
    <main className="mx-auto max-w-[1440px] px-6 py-4 space-y-6" role="main">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl" aria-hidden="true">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Facebook Ad Campaigns</h1>
            <p className="text-sm text-muted-foreground">
              Proven templates with ready-to-use creatives and scripts
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={onBack} size="sm" aria-label="Back to Methods">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Methods
        </Button>
      </div>

      {/* Sticky Audience Navigation */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-3 -mx-6 px-6 border-b border-border">
        <Tabs value={activeAudience} onValueChange={setActiveAudience} className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:flex sm:w-auto h-auto p-1">
            <TabsTrigger value="all" className="text-xs sm:text-sm px-4 py-2">
              All Campaigns ({campaignTemplates.length})
            </TabsTrigger>
            {audienceNames.map((audienceName) => (
              <TabsTrigger 
                key={audienceName} 
                value={audienceName}
                className="text-xs sm:text-sm px-4 py-2"
              >
                {audienceName} ({templatesByAudience[audienceName].length})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Responsive Grid Container */}
      <section className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredTemplates.map((template) => {
          const audienceInfo = getTargetAudienceInfo(template);
          
          return (
            <CampaignCard
              key={template.id}
              title={template.name}
              description={template.description}
              audience={audienceInfo.name}
              budgetRange={audienceInfo.budgetRange}
              onLaunch={() => handleLaunchCampaign(template)}
              onViewScripts={() => handleViewScripts(template)}
              metrics={{
                leads: Math.floor(Math.random() * 100) + 50,
                cpl: Math.floor(Math.random() * 50) + 15,
                conversionRate: Math.floor(Math.random() * 20) + 5
              }}
            />
          );
        })}
      </section>

      {/* Script Drawer */}
      {scriptDrawerData && (
        <ScriptDrawer
          isOpen={showScriptDrawer}
          onClose={() => setShowScriptDrawer(false)}
          campaignTitle={scriptDrawerData.template.name}
          targetAudience={scriptDrawerData.audienceInfo.name}
          scripts={scriptDrawerData.scripts}
          templateId={scriptDrawerData.template.id}
          campaignAngle={scriptDrawerData.template.campaign_angle}
        />
      )}

      {/* Launch Modal */}
      <Dialog open={showLaunchModal} onOpenChange={setShowLaunchModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Launch Campaign</DialogTitle>
            <DialogDescription>
              Configure your campaign settings before launch.
            </DialogDescription>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="consultant-name">Your Name</Label>
                <Input
                  id="consultant-name"
                  value={campaignData.consultantName}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, consultantName: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <Label htmlFor="budget">Monthly Budget (Points)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={campaignData.budget || ''}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, budget: parseInt(e.target.value) || 0 }))}
                  placeholder={`Recommended: ${getTargetAudienceInfo(selectedTemplate).budgetRange.recommended}`}
                  min={getTargetAudienceInfo(selectedTemplate).budgetRange.min}
                  max={getTargetAudienceInfo(selectedTemplate).budgetRange.max}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your balance: {profile?.flexi_credits_balance || 0} points
                </p>
              </div>

              {/* Proration toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="prorate">Prorate first month</Label>
                  <p className="text-xs text-muted-foreground">
                    Charge only for the remaining days of this month.
                  </p>
                </div>
                <Switch id="prorate" checked={prorateFirstMonth} onCheckedChange={setProrateFirstMonth} />
              </div>

              {/* Billing summary */}
              {campaignData.budget > 0 && (
                <div className="rounded-md border p-3 bg-muted/30">
                  {(() => {
                    const today = new Date();
                    const totalDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                    const remainingDays = Math.max(0, totalDays - today.getDate() + 1);
                    const nextMonthFirst = new Date(today.getFullYear(), today.getMonth() + 1, 1);
                    const proratedAmount = Math.max(1, Math.round((campaignData.budget * remainingDays) / totalDays));
                    return (
                      <>
                        <div className="text-sm font-medium">Immediate charge</div>
                        <p className="text-sm text-muted-foreground">
                          {prorateFirstMonth ? `${proratedAmount} pts today (prorated for ${remainingDays} day${remainingDays !== 1 ? 's' : ''})` : `${campaignData.budget} pts today`}
                        </p>
                        <div className="text-sm font-medium mt-2">Next deduction</div>
                        <p className="text-sm text-muted-foreground">
                          {format(nextMonthFirst, 'MMM d, yyyy')} • {campaignData.budget} pts
                        </p>
                      </>
                    );
                  })()}
                </div>
              )}

              <div className="bg-primary/5 p-3 rounded-lg">
                <h4 className="font-medium mb-2">Campaign: {selectedTemplate.name}</h4>
                <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLaunchModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmLaunch} disabled={!canProceed()} aria-label="Review campaign details before launching">
              <Zap className="h-4 w-4 mr-2" />
              Review Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};