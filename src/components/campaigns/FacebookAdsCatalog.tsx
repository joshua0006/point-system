import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Target, Zap, Phone, MessageSquare, Clock, Users } from "lucide-react";
import { FacebookAdMockup } from "./FacebookAdMockup";
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
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Facebook Ad Campaigns
            </CardTitle>
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Methods
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Choose from our proven campaign templates with ready-to-use ad creatives and scripts.
          </p>
        </CardHeader>
      </Card>

      {/* Campaign Templates by Audience */}
      <div className="space-y-8">
        {Object.entries(templatesByAudience).map(([audienceName, templates]) => (
          <div key={audienceName} className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">{audienceName}</h2>
               <Badge variant="outline">
                {(templates as any[]).length} campaign{(templates as any[]).length !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {(templates as any[]).map((template) => {
                const adVariant = getAdVariantForTemplate(template.id);
                const audienceInfo = getTargetAudienceInfo(template);
                const scripts = getScriptsForTemplate(template);
                
                return (
                  <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      {/* Ad Mockup */}
                      <div className="p-4 bg-gray-50">
                        {adVariant ? (
                          <FacebookAdMockup 
                            adContent={adVariant.ad_content} 
                            className="mx-auto scale-90"
                          />
                        ) : (
                          <div className="bg-gradient-to-br from-primary/10 to-primary/20 h-48 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                              <Target className="h-8 w-8 text-primary mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">Ad Preview Coming Soon</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Campaign Details */}
                      <div className="p-6 space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                        </div>

                        {/* Budget Range */}
                        <div className="bg-primary/5 p-3 rounded-lg">
                          <div className="text-sm font-medium mb-1">Recommended Budget</div>
                          <div className="text-lg font-bold text-primary">
                            ${audienceInfo.budgetRange.recommended}/month
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Range: ${audienceInfo.budgetRange.min} - ${audienceInfo.budgetRange.max}
                          </div>
                        </div>

                        {/* Scripts Preview */}
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
                              Follow-up
                            </TabsTrigger>
                          </TabsList>
                          <TabsContent value="calling" className="mt-2">
                            <div className="bg-gray-50 p-3 rounded text-xs text-gray-600 line-clamp-3">
                              {scripts.calling}
                            </div>
                          </TabsContent>
                          <TabsContent value="texting" className="mt-2">
                            <div className="bg-gray-50 p-3 rounded text-xs text-gray-600 line-clamp-3">
                              {scripts.texting}
                            </div>
                          </TabsContent>
                          <TabsContent value="reminder" className="mt-2">
                            <div className="bg-gray-50 p-3 rounded text-xs text-gray-600 line-clamp-3">
                              {scripts.reminder}
                            </div>
                          </TabsContent>
                        </Tabs>

                        {/* Launch Button */}
                        <Button 
                          onClick={() => handleLaunchCampaign(template)}
                          className="w-full"
                          size="lg"
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Launch Campaign
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
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