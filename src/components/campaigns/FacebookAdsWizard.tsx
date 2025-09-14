
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, CheckCircle, Target, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface FacebookAdsWizardProps {
  onComplete: (campaignData: any) => void;
  onBack: () => void;
  userBalance: number;
  campaignTargets: any[];
}

const STEPS = [
  { id: 1, name: 'Target Audience', description: 'Choose your target market' },
  { id: 2, name: 'Campaign Type', description: 'Select your campaign approach' },
  { id: 3, name: 'Budget & Review', description: 'Finalize campaign settings' }
];

export const FacebookAdsWizard = ({ onComplete, onBack, userBalance, campaignTargets }: FacebookAdsWizardProps) => {
  const { profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [campaignData, setCampaignData] = useState({
    method: 'facebook-ads',
    targetAudience: null as any,
    campaignType: null as string | null,
    budget: 0
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

  const handleAudienceSelect = (audience: any) => {
    setCampaignData(prev => ({
      ...prev,
      targetAudience: audience,
      campaignType: null
    }));
  };

  const handleCampaignTypeSelect = (campaignType: string) => {
    setCampaignData(prev => ({
      ...prev,
      campaignType
    }));
  };

  const handleBudgetChange = (budget: number) => {
    setCampaignData(prev => ({
      ...prev,
      budget
    }));
  };


  const handleLaunch = () => {
    onComplete(campaignData);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return !!campaignData.targetAudience;
      case 2: return !!campaignData.campaignType;
      case 3: return campaignData.budget > 0 && userBalance >= campaignData.budget;
      default: return false;
    }
  };

  const progressPercentage = (currentStep / STEPS.length) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Facebook Ad Campaign Builder
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
                Choose the primary audience for your Facebook ad campaign.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {campaignTargets.map((target) => {
                const IconComponent = target.icon;
                return (
                  <Card 
                    key={target.id}
                    className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                      campaignData.targetAudience?.id === target.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-muted hover:border-primary/50'
                    }`}
                    onClick={() => handleAudienceSelect(target)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`${target.bgColor} p-3 rounded-lg`}>
                            <IconComponent className={`h-6 w-6 ${target.iconColor}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{target.name}</h3>
                            <p className="text-muted-foreground">{target.description}</p>
                          </div>
                        </div>
                        {campaignData.targetAudience?.id === target.id && (
                          <CheckCircle className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        Budget Range: ${target.budgetRange?.min || 200} - ${target.budgetRange?.max || 2000}/month
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && campaignData.targetAudience && (
          <Card>
            <CardHeader>
              <CardTitle>Select Campaign Type</CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose from the available campaign types for {campaignData.targetAudience.name}.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {(campaignData.targetAudience.campaignTypes || []).map((type: string) => (
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
                          Optimized campaign type for {campaignData.targetAudience.name}
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

        {currentStep === 3 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="budget">Monthly Budget (Points)</Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder={`Recommended: ${campaignData.targetAudience?.budgetRange?.recommended || 500}`}
                    value={campaignData.budget || ''}
                    onChange={(e) => handleBudgetChange(parseInt(e.target.value) || 0)}
                    min={campaignData.targetAudience?.budgetRange?.min || 200}
                    max={campaignData.targetAudience?.budgetRange?.max || 2000}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Range: {campaignData.targetAudience?.budgetRange?.min || 200} - {campaignData.targetAudience?.budgetRange?.max || 2000} points/month
                  </p>
                </div>
              </CardContent>
            </Card>
            
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
                    <div className="font-semibold">{campaignData.targetAudience?.name}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Campaign Type:</span>
                    <div className="font-semibold">{campaignData.campaignType}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Budget:</span>
                    <div className="font-semibold">{campaignData.budget}p</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Current Balance:</span>
                    <div className="font-semibold">{userBalance}p</div>
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
              onClick={currentStep === 1 ? onBack : handlePrevious}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {currentStep === 1 ? 'Back to Methods' : 'Previous'}
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
