import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ArrowLeft, Target, Zap, Phone, MessageSquare, Clock, Users, Mail, Rocket } from "lucide-react";
import { FacebookAdMockup } from "./FacebookAdMockup";
import { ScriptPanel } from "./ScriptPanel";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const [adVariants, setAdVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [campaignData, setCampaignData] = useState({
    budget: 0,
    consultantName: profile?.full_name || ''
  });

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

      // Load campaign templates with ad variants
      const { data: templates, error: templatesError } = await supabase
        .from('campaign_templates')
        .select('*')
        .eq('is_active', true)
        .order('target_audience');

      if (templatesError) throw templatesError;

      // Load ad variants
      const { data: variants, error: variantsError } = await supabase
        .from('ad_variants')
        .select('*')
        .eq('is_active', true);

      if (variantsError) throw variantsError;

      setCampaignTemplates(templates || []);
      setAdVariants(variants || []);
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

  const getAdVariantForTemplate = (templateId: string) => {
    return adVariants.find(variant => variant.template_id === templateId);
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
      scripts: getScriptsForTemplate(selectedTemplate)
    };

    onComplete(launchData);
  };

  const canProceed = () => {
    if (!selectedTemplate) return false;
    const audienceInfo = getTargetAudienceInfo(selectedTemplate);
    return campaignData.budget >= audienceInfo.budgetRange.min && 
           campaignData.budget <= audienceInfo.budgetRange.max &&
           campaignData.consultantName.trim() !== '' && 
           userBalance >= campaignData.budget;
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

  return (
    <div className="w-full max-w-full mx-auto space-y-4 p-3">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded">
            <Target className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Facebook Ad Campaigns</h1>
            <p className="text-xs text-muted-foreground">
              Proven templates with ready-to-use creatives and scripts
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={onBack} size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      {/* Dense Grid Layout */}
      <div className="space-y-3">
        {Object.entries(templatesByAudience).map(([audienceName, templates]) => (
          <div key={audienceName} className="space-y-2">
            {/* Compact Section Header */}
            <div className="flex items-center gap-2 py-1 border-b border-border/50">
              <div className="p-1 bg-primary/10 rounded">
                <Users className="h-3 w-3 text-primary" />
              </div>
              <h2 className="text-base font-semibold">{audienceName}</h2>
              <Badge variant="secondary" className="ml-auto text-xs px-2 py-0.5">
                {(templates as any[]).length}
              </Badge>
            </div>
            
            {/* Dense Grid of Campaign Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
              {(templates as any[]).map((template) => {
                const audienceInfo = getTargetAudienceInfo(template);
                const scripts = getScriptsForTemplate(template);
                
                return (
                  <Card key={template.id} className="group hover:shadow-md transition-all duration-200 bg-card">
                    <CardContent className="p-4">
                      {/* Compact Campaign Info */}
                      <div className="space-y-3">
                        <div className="text-center">
                          <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
                          <h3 className="font-bold text-base mb-1 leading-tight">{template.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {template.description}
                          </p>
                        </div>

                        {/* Budget & Actions Row */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground font-medium">Budget:</span>
                            <span className="font-bold text-primary">
                              ${audienceInfo.budgetRange.min}-${audienceInfo.budgetRange.max}
                            </span>
                          </div>

                          {/* Method Badges */}
                          <div className="flex flex-wrap gap-1 justify-center">
                            <Badge variant="outline" className="text-xs px-2 py-0.5 h-5">
                              <Phone className="h-2.5 w-2.5 mr-1" />
                              Call
                            </Badge>
                            <Badge variant="outline" className="text-xs px-2 py-0.5 h-5">
                              <MessageSquare className="h-2.5 w-2.5 mr-1" />
                              SMS
                            </Badge>
                            <Badge variant="outline" className="text-xs px-2 py-0.5 h-5">
                              <Mail className="h-2.5 w-2.5 mr-1" />
                              Email
                            </Badge>
                          </div>

                          <Button 
                            onClick={() => handleLaunchCampaign(template)}
                            className="w-full text-xs h-8"
                            variant="default"
                            size="sm"
                          >
                            <Rocket className="h-3 w-3 mr-1" />
                            Launch Campaign
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Global Scripts Panel - Outside of cards */}
      {selectedTemplate && (
        <Card className="mt-4 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Campaign Scripts Preview - {selectedTemplate.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScriptPanel
              scripts={[
                { type: 'call', content: getScriptsForTemplate(selectedTemplate).calling || 'Professional calling script for lead generation targeting ' + getTargetAudienceInfo(selectedTemplate).name },
                { type: 'sms', content: getScriptsForTemplate(selectedTemplate).texting || 'SMS follow-up script for ' + getTargetAudienceInfo(selectedTemplate).name + ' prospects' },
                { type: 'followup', content: getScriptsForTemplate(selectedTemplate).reminder || 'Follow-up email sequence for ' + getTargetAudienceInfo(selectedTemplate).name }
              ]}
              templateId={selectedTemplate.id}
              targetAudience={selectedTemplate.target_audience}
              campaignAngle={selectedTemplate.campaign_angle}
            />
          </CardContent>
        </Card>
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
                  Your balance: {userBalance} points
                </p>
              </div>

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
            <Button onClick={handleConfirmLaunch} disabled={!canProceed()}>
              <Zap className="h-4 w-4 mr-2" />
              Launch Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};