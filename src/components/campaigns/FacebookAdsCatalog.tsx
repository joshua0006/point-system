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
    <div className="w-full max-w-7xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Facebook Ad Campaigns</h1>
            <p className="text-sm text-muted-foreground">
              Choose from proven templates with ready-to-use creatives and scripts
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={onBack} size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Methods
        </Button>
      </div>

      {/* Campaign Templates by Audience */}
      <div className="space-y-6">
        {Object.entries(templatesByAudience).map(([audienceName, templates]) => (
          <div key={audienceName} className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-border">
              <div className="p-1 bg-primary/10 rounded">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">{audienceName}</h2>
              <Badge variant="secondary" className="ml-auto text-xs">
                {(templates as any[]).length} campaign{(templates as any[]).length !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            <Carousel 
              className="w-full"
              opts={{
                align: "start",
                loop: false,
              }}
            >
              <CarouselContent className="ml-0 space-x-4">
                {(templates as any[]).map((template) => {
                  const adVariant = getAdVariantForTemplate(template.id);
                  const audienceInfo = getTargetAudienceInfo(template);
                  const scripts = getScriptsForTemplate(template);
                  
                  return (
                    <CarouselItem 
                      key={template.id} 
                      className="basis-full sm:basis-full md:basis-full lg:basis-1/2 xl:basis-1/3 2xl:basis-1/3"
                    >
                      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 bg-card h-full">
                        <CardContent className="p-0">
                          {/* Mobile/Tablet: Vertical Stack */}
                          <div className="block lg:hidden">
                            {/* Campaign Info Section */}
                            <div className="p-4 pb-2 space-y-3">
                              <div className="text-center">
                                <Target className="h-8 w-8 mx-auto mb-3 text-primary" />
                                <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                  {template.description}
                                </p>
                              </div>

                              <div className="space-y-3">
                                <div className="flex items-center justify-between text-base">
                                  <span className="text-muted-foreground">Budget:</span>
                                  <span className="font-medium">
                                    ${audienceInfo.budgetRange.min} - ${audienceInfo.budgetRange.max}
                                  </span>
                                </div>

                                <div className="flex flex-wrap gap-2 justify-center">
                                  <Badge variant="outline" className="text-sm px-3 py-1.5">
                                    <Phone className="h-3 w-3 mr-2" />
                                    Call
                                  </Badge>
                                  <Badge variant="outline" className="text-sm px-3 py-1.5">
                                    <MessageSquare className="h-3 w-3 mr-2" />
                                    SMS
                                  </Badge>
                                  <Badge variant="outline" className="text-sm px-3 py-1.5">
                                    <Mail className="h-3 w-3 mr-2" />
                                    Follow-up
                                  </Badge>
                                </div>

                                <Button 
                                  onClick={() => handleLaunchCampaign(template)}
                                  className="w-full"
                                  variant="default"
                                  size="lg"
                                >
                                  <Rocket className="h-4 w-4 mr-2" />
                                  Launch Campaign
                                </Button>
                              </div>
                            </div>

                            {/* Scripts Panel - Full Width */}
                            <div className="p-4 pt-2 border-t border-border">
                              <ScriptPanel
                                scripts={[
                                  { type: 'call', content: scripts.calling || 'Professional calling script for lead generation targeting ' + audienceInfo.name },
                                  { type: 'sms', content: scripts.texting || 'SMS follow-up script for ' + audienceInfo.name + ' prospects' },
                                  { type: 'followup', content: scripts.reminder || 'Follow-up email sequence for ' + audienceInfo.name }
                                ]}
                                templateId={template.id}
                                targetAudience={template.target_audience}
                                campaignAngle={template.campaign_angle}
                              />
                            </div>
                          </div>

                          {/* Desktop: Two Column Layout */}
                          <div className="hidden lg:block">
                            <div className="grid grid-cols-5 h-full min-h-[400px]">
                              {/* Left Column: Campaign Info (3/5 width) */}
                              <div className="col-span-3 p-6 space-y-4">
                                <div className="text-center">
                                  <Target className="h-8 w-8 mx-auto mb-3 text-primary" />
                                  <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
                                  <p className="text-sm text-muted-foreground line-clamp-3">
                                    {template.description}
                                  </p>
                                </div>

                                <div className="space-y-3">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Budget:</span>
                                    <span className="font-medium">
                                      ${audienceInfo.budgetRange.min} - ${audienceInfo.budgetRange.max}
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap gap-1.5 justify-center">
                                    <Badge variant="outline" className="text-xs px-2 py-1">
                                      <Phone className="h-3 w-3 mr-1" />
                                      Call
                                    </Badge>
                                    <Badge variant="outline" className="text-xs px-2 py-1">
                                      <MessageSquare className="h-3 w-3 mr-1" />
                                      SMS
                                    </Badge>
                                    <Badge variant="outline" className="text-xs px-2 py-1">
                                      <Mail className="h-3 w-3 mr-1" />
                                      Follow-up
                                    </Badge>
                                  </div>

                                  <Button 
                                    onClick={() => handleLaunchCampaign(template)}
                                    className="w-full mt-6"
                                    variant="default"
                                    size="default"
                                  >
                                    <Rocket className="h-4 w-4 mr-2" />
                                    Launch Campaign
                                  </Button>
                                </div>
                              </div>

                              {/* Right Column: Scripts Panel (2/5 width) */}
                              <div className="col-span-2 border-l border-border bg-muted/20">
                                <div className="p-4 h-full">
                                  <ScriptPanel
                                    scripts={[
                                      { type: 'call', content: scripts.calling || 'Professional calling script for lead generation targeting ' + audienceInfo.name },
                                      { type: 'sms', content: scripts.texting || 'SMS follow-up script for ' + audienceInfo.name + ' prospects' },
                                      { type: 'followup', content: scripts.reminder || 'Follow-up email sequence for ' + audienceInfo.name }
                                    ]}
                                    templateId={template.id}
                                    targetAudience={template.target_audience}
                                    campaignAngle={template.campaign_angle}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex -left-12" />
              <CarouselNext className="hidden sm:flex -right-12" />
            </Carousel>
          </div>
        ))}
      </div>

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