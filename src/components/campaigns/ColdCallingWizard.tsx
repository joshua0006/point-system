
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Phone, Zap } from "lucide-react";

interface ColdCallingWizardProps {
  onComplete: (campaignData: any) => void;
  onBack: () => void;
  userBalance: number;
}

export const ColdCallingWizard = ({ onComplete, onBack, userBalance }: ColdCallingWizardProps) => {
  const [selectedHours, setSelectedHours] = useState<number | null>(null);
  const [consultantName, setConsultantName] = useState('');

  const handleLaunch = () => {
    if (selectedHours && consultantName.trim()) {
      onComplete({
        method: 'cold-calling',
        hours: selectedHours,
        consultantName,
        budget: selectedHours * 6
      });
    }
  };

  const canProceed = () => {
    return selectedHours && consultantName.trim() !== '' && userBalance >= (selectedHours * 6);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-green-600" />
            Cold Calling Campaign Setup
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure your professional cold calling campaign with trained telemarketers.
          </p>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="consultant-name">Your Name</Label>
            <Input
              id="consultant-name"
              placeholder="Enter your full name"
              value={consultantName}
              onChange={(e) => setConsultantName(e.target.value)}
              required
            />
          </div>

          <div>
            <Label className="text-base font-medium mb-4 block">Select Monthly Hours</Label>
            <div className="grid grid-cols-2 gap-4">
              {[20, 40, 60, 80].map((hours) => {
                const monthlyCost = hours * 6;
                const isSelected = selectedHours === hours;
                return (
                  <Card 
                    key={hours}
                    className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                      isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedHours(hours)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary mb-1">{hours}h</div>
                      <div className="text-sm text-muted-foreground mb-2">per month</div>
                      <div className="text-lg font-semibold text-foreground">{monthlyCost} points</div>
                      <div className="text-xs text-muted-foreground">~{Math.round(hours * 2.5)} leads expected</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {selectedHours && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold mb-2 text-green-800 dark:text-green-300">Campaign Summary</h4>
              <div className="space-y-1 text-sm text-green-700 dark:text-green-400">
                <p><strong>Hours per month:</strong> {selectedHours}</p>
                <p><strong>Monthly cost:</strong> {selectedHours * 6} points</p>
                <p><strong>Expected leads:</strong> ~{Math.round(selectedHours * 2.5)} per month</p>
                <p><strong>Cost per lead:</strong> ~{Math.round((selectedHours * 6) / (selectedHours * 2.5))} points</p>
                <p><strong>Current balance:</strong> {userBalance} points</p>
              </div>
            </div>
          )}

          {selectedHours && userBalance < (selectedHours * 6) && (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-red-700 dark:text-red-400 text-sm">
                <strong>Insufficient balance:</strong> You need {selectedHours * 6} points but only have {userBalance} points. 
                Please top up your wallet first.
              </p>
            </div>
          )}
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
            
            <Button
              onClick={handleLaunch}
              disabled={!canProceed()}
              className="min-w-32"
            >
              <Zap className="h-4 w-4 mr-2" />
              Launch Campaign
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
