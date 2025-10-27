import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Smartphone, CheckCircle } from '@/lib/icons';
import { ExpressCampaignTemplates } from "./ExpressCampaignTemplates";
import { SmartBudgetCalculator } from "./SmartBudgetCalculator";

interface MobileCampaignWizardProps {
  onComplete: (campaignData: any) => void;
  userBalance: number;
}

const WIZARD_STEPS = [
  { id: 'template', title: 'Choose Template', description: 'Pick a quick start template' },
  { id: 'budget', title: 'Set Budget', description: 'Configure your campaign budget' },
  { id: 'review', title: 'Review & Launch', description: 'Confirm and launch your campaign' }
];

export const MobileCampaignWizard = ({ onComplete, userBalance }: MobileCampaignWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [campaignData, setCampaignData] = useState<any>({});
  const [isComplete, setIsComplete] = useState(false);

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTemplateSelect = (template: any) => {
    setCampaignData({ ...campaignData, template });
  };

  const handleBudgetChange = (budget: number) => {
    setCampaignData({ ...campaignData, budget });
  };

  const handleLaunch = () => {
    setIsComplete(true);
    onComplete(campaignData);
  };

  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;
  const canProceed = () => {
    switch (currentStep) {
      case 0: return !!campaignData.template;
      case 1: return !!campaignData.budget && campaignData.budget <= userBalance;
      case 2: return true;
      default: return false;
    }
  };

  if (isComplete) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="text-center py-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Campaign Launched!</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Your {campaignData.template?.name} campaign is now live and generating leads.
          </p>
          <Button onClick={() => window.location.reload()} className="w-full">
            View Campaign Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 mb-2">
          <Smartphone className="h-5 w-5 text-blue-500" />
          <CardTitle className="text-lg">Campaign Wizard</CardTitle>
          <Badge variant="outline" className="ml-auto">
            Step {currentStep + 1} of {WIZARD_STEPS.length}
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="text-sm">
          <div className="font-medium">{WIZARD_STEPS[currentStep].title}</div>
          <div className="text-muted-foreground">{WIZARD_STEPS[currentStep].description}</div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Step Content */}
        {currentStep === 0 && (
          <ExpressCampaignTemplates 
            onSelectTemplate={handleTemplateSelect}
            userBalance={userBalance}
          />
        )}
        
        {currentStep === 1 && (
          <SmartBudgetCalculator
            selectedTarget={campaignData.template?.targetAudience?.toLowerCase()}
            onBudgetChange={handleBudgetChange}
            userBalance={userBalance}
          />
        )}
        
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Campaign Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Template:</span>
                <span className="font-medium">{campaignData.template?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Target:</span>
                <span className="font-medium">{campaignData.template?.targetAudience}</span>
              </div>
              <div className="flex justify-between">
                <span>Budget:</span>
                <span className="font-medium">{campaignData.budget} points</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="font-medium">{campaignData.template?.duration}</span>
              </div>
              <div className="flex justify-between">
                <span>Expected Leads:</span>
                <span className="font-medium">{campaignData.template?.expectedLeads}</span>
              </div>
            </div>
            <div className="pt-2 border-t text-xs text-muted-foreground">
              Campaign will start immediately after confirmation
            </div>
          </div>
        )}
        
        {/* Navigation */}
        <div className="flex gap-2 pt-4">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex-1"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          
          {currentStep === WIZARD_STEPS.length - 1 ? (
            <Button 
              onClick={handleLaunch}
              disabled={!canProceed()}
              className="flex-1"
            >
              Launch Campaign
            </Button>
          ) : (
            <Button 
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};