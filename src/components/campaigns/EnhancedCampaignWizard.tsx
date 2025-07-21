import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, CheckCircle, Target, Zap } from "lucide-react";
import { CampaignAngleSelector } from "./CampaignAngleSelector";
import { SmartBudgetCalculator } from "./SmartBudgetCalculator";

interface EnhancedCampaignWizardProps {
  onComplete: (campaignData: any) => void;
  userBalance: number;
}

interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  target_audience: string;
  campaign_angle: string;
  template_config: {
    budget: number;
    duration_days: number;
    expected_leads: number;
    cost_per_lead: number;
  };
}

const STEPS = [
  { id: 1, name: 'Target Audience', description: 'Choose your target market' },
  { id: 2, name: 'Campaign Types', description: 'Select your campaign approach' },
  { id: 3, name: 'Campaign Angle', description: 'Select strategy approach' },
  { id: 4, name: 'Budget & Review', description: 'Finalize campaign settings' }
];

const AUDIENCE_OPTIONS = [
  {
    id: 'nsf',
    name: 'NSF Personnel',
    description: 'National Service personnel seeking financial guidance',
    icon: '🛡️',
    stats: { avgCTR: '3.4%', avgConversions: 26 }
  },
  {
    id: 'general',
    name: 'General Public',
    description: 'Working professionals optimizing their finances',
    icon: '👥',
    stats: { avgCTR: '3.8%', avgConversions: 35 }
  },
  {
    id: 'seniors',
    name: 'Seniors 55+',
    description: 'Pre-retirees and retirees planning their legacy',
    icon: '💜',
    stats: { avgCTR: '4.2%', avgConversions: 28 }
  }
];

export const EnhancedCampaignWizard = ({ onComplete, userBalance }: EnhancedCampaignWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [campaignData, setCampaignData] = useState({
    targetAudience: null as string | null,
    campaignType: null as string | null,
    template: null as CampaignTemplate | null,
    selectedVariants: [] as any[],
    budget: 0,
    customizations: {}
  });

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAudienceSelect = (audienceId: string) => {
    setCampaignData(prev => ({
      ...prev,
      targetAudience: audienceId,
      campaignType: null,
      template: null,
      selectedVariants: []
    }));
  };

  const handleCampaignTypeSelect = (campaignType: string) => {
    setCampaignData(prev => ({
      ...prev,
      campaignType,
      template: null,
      selectedVariants: []
    }));
  };

  const handleTemplateSelect = (template: CampaignTemplate) => {
    setCampaignData(prev => ({
      ...prev,
      template,
      budget: template.template_config.budget,
      selectedVariants: []
    }));
  };

  const handleVariantsSelect = (variants: any[]) => {
    setCampaignData(prev => ({
      ...prev,
      selectedVariants: variants
    }));
  };

  const handleBudgetChange = (budget: number) => {
    setCampaignData(prev => ({
      ...prev,
      budget
    }));
  };

  const handleLaunch = () => {
    setIsComplete(true);
    onComplete(campaignData);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return !!campaignData.targetAudience;
      case 2: return !!campaignData.campaignType;
      case 3: return !!campaignData.template;
      case 4: return campaignData.budget > 0 && userBalance >= campaignData.budget;
      default: return false;
    }
  };

  if (isComplete) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Campaign Launched Successfully!</h2>
          <p className="text-muted-foreground mb-6">
            Your enhanced campaign is now live targeting {AUDIENCE_OPTIONS.find(a => a.id === campaignData.targetAudience)?.name}.
          </p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-lg">{campaignData.budget}p</div>
              <div className="text-muted-foreground">Budget Allocated</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg">{campaignData.template?.template_config.duration_days}</div>
              <div className="text-muted-foreground">Days Duration</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg">{campaignData.template?.template_config.expected_leads}</div>
              <div className="text-muted-foreground">Expected Leads</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = (currentStep / STEPS.length) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Enhanced Campaign Builder
            </CardTitle>
            <Badge variant="outline">
              Step {currentStep} of {STEPS.length}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{STEPS[currentStep - 1].name}</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
          
          <p className="text-sm text-muted-foreground mt-2">
            {STEPS[currentStep - 1].description}
          </p>
        </CardHeader>
      </Card>

      {/* Step Content */}
      <div className="min-h-[600px]">
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Target Audience</CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose the primary audience for your campaign. Each audience has optimized templates and proven performance metrics.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {AUDIENCE_OPTIONS.map((audience) => (
                <Card 
                  key={audience.id}
                  className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                    campaignData.targetAudience === audience.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted hover:border-primary/50'
                  }`}
                  onClick={() => handleAudienceSelect(audience.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{audience.icon}</div>
                        <div>
                          <h3 className="font-semibold text-lg">{audience.name}</h3>
                          <p className="text-muted-foreground">{audience.description}</p>
                        </div>
                      </div>
                      {campaignData.targetAudience === audience.id && (
                        <CheckCircle className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-green-600">{audience.stats.avgCTR}</div>
                        <div className="text-muted-foreground">Avg CTR</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{audience.stats.avgConversions}</div>
                        <div className="text-muted-foreground">Avg Conversions</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && campaignData.targetAudience && (
          <Card>
            <CardHeader>
              <CardTitle>Select Campaign Type</CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose the type of campaign that best fits your marketing goals.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {['Facebook Ads', 'Google Ads', 'LinkedIn Ads', 'Email Marketing', 'Content Marketing'].map((type) => (
                <Card 
                  key={type}
                  className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                    campaignData.campaignType === type 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted hover:border-primary/50'
                  }`}
                  onClick={() => handleCampaignTypeSelect(type)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{type}</h3>
                        <p className="text-muted-foreground">
                          {type === 'Facebook Ads' && 'Reach your audience on Facebook and Instagram'}
                          {type === 'Google Ads' && 'Target users searching for financial services'}
                          {type === 'LinkedIn Ads' && 'Connect with professionals and decision makers'}
                          {type === 'Email Marketing' && 'Direct communication with potential clients'}
                          {type === 'Content Marketing' && 'Build trust through valuable content'}
                        </p>
                      </div>
                      {campaignData.campaignType === type && (
                        <CheckCircle className="h-6 w-6 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && campaignData.targetAudience && campaignData.campaignType && (
          <CampaignAngleSelector
            targetAudience={campaignData.targetAudience as any}
            onSelectAngle={handleTemplateSelect}
            userBalance={userBalance}
          />
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <SmartBudgetCalculator
              onBudgetChange={handleBudgetChange}
              userBalance={userBalance}
            />
            
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Campaign Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Target Audience:</span>
                    <div className="font-semibold">
                      {AUDIENCE_OPTIONS.find(a => a.id === campaignData.targetAudience)?.name}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Campaign Type:</span>
                    <div className="font-semibold">{campaignData.campaignType}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Strategy:</span>
                    <div className="font-semibold">{campaignData.template?.name}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Expected Leads:</span>
                    <div className="font-semibold">{campaignData.template?.template_config.expected_leads} leads</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <div className="font-semibold">{campaignData.template?.template_config.duration_days} days</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            {currentStep === STEPS.length ? (
              <Button
                onClick={handleLaunch}
                disabled={!canProceed()}
                className="min-w-32"
              >
                <Zap className="h-4 w-4 mr-2" />
                Launch Campaign
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="min-w-32"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};