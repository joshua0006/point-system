import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Target, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface FacebookAdsCatalogProps {
  onComplete: (campaignData: any) => void;
  onBack: () => void;
  userBalance: number;
  campaignTargets: any[];
}

export function FacebookAdsCatalog({ onComplete, onBack, userBalance }: FacebookAdsCatalogProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [campaignTemplates, setCampaignTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [campaignData, setCampaignData] = useState({
    budget: 500,
    consultantName: profile?.full_name || '',
    targetAudience: null,
    campaignType: null
  });
  const [prorateFirstMonth, setProrateFirstMonth] = useState(true);

  // Mock templates - replace with actual Supabase call when TS issues resolved
  const mockTemplates = [
    {
      id: '1',
      name: 'NSF Financial Planning',
      description: 'Targeted campaign for National Service personnel',
      target_audience: 'nsf',
      campaign_angle: 'financial_planning',
      template_config: {
        budget: 500,
        expected_leads: 15,
        cost_per_lead: 33,
        duration_days: 30
      }
    },
    {
      id: '2',
      name: 'Seniors Retirement Planning',
      description: 'Focused on pre-retirees and retirees aged 55+',
      target_audience: 'seniors',
      campaign_angle: 'retirement_planning',
      template_config: {
        budget: 700,
        expected_leads: 20,
        cost_per_lead: 35,
        duration_days: 30
      }
    },
    {
      id: '3',
      name: 'General Investment Advisory',
      description: 'General public investment and wealth management',
      target_audience: 'general',
      campaign_angle: 'investment_advisory',
      template_config: {
        budget: 600,
        expected_leads: 18,
        cost_per_lead: 33,
        duration_days: 30
      }
    }
  ];

  useEffect(() => {
    setCampaignTemplates(mockTemplates as any);
    setLoading(false);
  }, []);

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
    setCampaignData({
      ...campaignData,
      budget: template.template_config?.budget || 500,
      targetAudience: {
        id: template.target_audience,
        name: getAudienceName(template.target_audience)
      },
      campaignType: template.campaign_angle || template.name
    });
    setShowLaunchModal(true);
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
    return balanceAfterDeduction >= -2000;
  };

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

      {/* Templates Grid */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
            {campaignTemplates.map((template: any) => (
              <div key={template.id} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                <h3 className="font-medium mb-2 text-sm sm:text-base">{template.name}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">{template.description}</p>


                <Button
                  onClick={() => handleCampaignSelect(template)}
                  size="sm"
                  className="w-full"
                >
                  Select Template
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-start">
            <Button variant="outline" onClick={onBack} className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Methods
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Launch Modal */}
      <Dialog open={showLaunchModal} onOpenChange={setShowLaunchModal}>
        <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Launch Facebook Ad Campaign</DialogTitle>
            <DialogDescription>
              Configure your campaign settings before launching.
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4 sm:space-y-6">
              {/* Campaign Info */}
              <div className="grid gap-3 sm:gap-4">
                <div>
                  <Label className="text-sm font-medium">Campaign Template</Label>
                  <p className="text-sm text-muted-foreground">{(selectedTemplate as any).name}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Target Audience</Label>
                  <p className="text-sm text-muted-foreground">
                    {getAudienceName((selectedTemplate as any).target_audience)}
                  </p>
                </div>
              </div>

              {/* Budget Settings */}
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <Label htmlFor="budget" className="text-sm font-medium">Monthly Budget (Points)</Label>
                  <Input
                    id="budget"
                    type="number"
                    min="100"
                    max="5000"
                    value={campaignData.budget}
                    onChange={(e) => setCampaignData({
                      ...campaignData,
                      budget: parseInt(e.target.value) || 0
                    })}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Recommended: {(selectedTemplate as any).template_config?.budget || 500} points
                  </p>
                </div>

                <div>
                  <Label htmlFor="consultant" className="text-sm font-medium">Consultant Name</Label>
                  <Input
                    id="consultant"
                    value={campaignData.consultantName}
                    onChange={(e) => setCampaignData({
                      ...campaignData,
                      consultantName: e.target.value
                    })}
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
              {campaignData.budget && (userBalance - campaignData.budget) < -2000 && (
                <div className="bg-red-50 dark:bg-red-900/20 p-3 sm:p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-red-700 dark:text-red-400 text-sm">
                    <strong>Balance limit exceeded:</strong> This would bring your balance to {userBalance - campaignData.budget} points.
                    The minimum allowed balance is -2000 points.
                  </p>
                </div>
              )}

            </div>
          )}

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowLaunchModal(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              onClick={handleLaunch}
              disabled={!canLaunch()}
              className="w-full sm:w-auto"
            >
              <Zap className="h-4 w-4 mr-2" />
              Launch Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}