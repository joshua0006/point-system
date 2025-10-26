import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, Phone, Zap } from "lucide-react";
import { checkExistingCampaign, isTierChange, type ExistingCampaignCheck } from "@/utils/campaignValidation";

interface ColdCallingWizardProps {
  onComplete: (campaignData: any) => void;
  onBack: () => void;
  userBalance: number;
  userId?: string;
  existingCampaign?: ExistingCampaignCheck['campaignDetails'] | null;
}

export const ColdCallingWizard = React.memo(({
  onComplete,
  onBack,
  userBalance,
  userId,
  existingCampaign
}: ColdCallingWizardProps) => {
  const [selectedHours, setSelectedHours] = useState<number | null>(null);
  const [hasActiveCampaign, setHasActiveCampaign] = useState(!!existingCampaign);
  const [isCheckingCampaign, setIsCheckingCampaign] = useState(!existingCampaign);

  const handleLaunch = () => {
    if (selectedHours) {
      onComplete({
        method: 'cold-calling',
        hours: selectedHours,
        budget: selectedHours * 6,
        consultantName: 'Cold Calling Team'
      });
    }
  };

  const canProceed = () => {
    if (!selectedHours) return false;

    // Check if this is a tier change
    if (existingCampaign) {
      const tierInfo = isTierChange(existingCampaign.currentBudget, selectedHours * 6);

      // For upgrades, check if user can afford the difference
      if (tierInfo.isUpgrade) {
        const difference = (selectedHours * 6) - existingCampaign.currentBudget;
        return (userBalance - difference) >= -2000;
      }

      // Downgrades are always allowed (no immediate charge)
      if (tierInfo.isDowngrade) return true;

      // Same tier - not allowed
      return false;
    }

    // New campaign - check full amount
    const balanceAfterDeduction = userBalance - (selectedHours * 6);
    return balanceAfterDeduction >= -2000;
  };

  const checkForActiveCampaign = async () => {
    if (!userId || existingCampaign) {
      setIsCheckingCampaign(false);
      return;
    }

    setIsCheckingCampaign(true);
    try {
      const existingCampaignCheck = await checkExistingCampaign(userId, 'cold-calling');
      setHasActiveCampaign(existingCampaignCheck.hasActive);
    } catch (error) {
      console.error('Error checking for active campaign:', error);
      setHasActiveCampaign(false);
    } finally {
      setIsCheckingCampaign(false);
    }
  };

  // Check for active campaign on mount
  useEffect(() => {
    checkForActiveCampaign();
  }, [userId]);

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
            <Label className="text-base font-medium mb-4 block">Select Monthly Hours</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {[20, 40, 60, 80].map((hours) => {
                const monthlyCost = hours * 6;
                const isSelected = selectedHours === hours;

                // Check tier change status
                const isCurrentTier = existingCampaign && existingCampaign.currentBudget === monthlyCost;
                const tierInfo = existingCampaign
                  ? isTierChange(existingCampaign.currentBudget, monthlyCost)
                  : { isTierChange: false, isUpgrade: false, isDowngrade: false };

                return (
                  <Card
                    key={hours}
                    className={`cursor-pointer transition-all duration-200 relative ${
                      isCurrentTier
                        ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20'
                        : isSelected
                          ? 'ring-2 ring-primary bg-primary/5'
                          : 'hover:shadow-md hover:scale-105'
                    }`}
                    onClick={() => setSelectedHours(hours)}
                  >
                    {isCurrentTier && (
                      <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-green-600" variant="default">
                        Current
                      </Badge>
                    )}
                    <CardContent className="p-3 sm:p-4 text-center">
                      <div className="text-xl sm:text-2xl font-bold text-primary mb-1">{hours}h</div>
                      <div className="text-xs sm:text-sm text-muted-foreground mb-2">per month</div>
                      <div className="text-base sm:text-lg font-semibold text-foreground">{monthlyCost} points</div>
                      <div className="text-xs text-muted-foreground">~{Math.round(hours * 2.5)} leads expected</div>
                      {existingCampaign && !isCurrentTier && (
                        <div className="mt-2">
                          <Badge variant={tierInfo.isUpgrade ? "default" : "secondary"} className="text-xs">
                            {tierInfo.isUpgrade
                              ? `Upgrade (+${monthlyCost - existingCampaign.currentBudget} pts)`
                              : `Downgrade (${monthlyCost} pts/mo)`
                            }
                          </Badge>
                        </div>
                      )}
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

          {selectedHours && (userBalance - (selectedHours * 6)) < -2000 && (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-red-700 dark:text-red-400 text-sm">
                <strong>Balance limit exceeded:</strong> This would bring your balance to {userBalance - (selectedHours * 6)} points. 
                The minimum allowed balance is -2000 points.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
            <Button
              variant="outline"
              onClick={onBack}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Methods
            </Button>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-full sm:w-auto">
                    <Button
                      onClick={handleLaunch}
                      disabled={!canProceed() || (hasActiveCampaign && !existingCampaign) || isCheckingCampaign}
                      className="w-full sm:w-auto sm:min-w-32"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      {isCheckingCampaign ? 'Checking...' : (() => {
                        if (!selectedHours) return 'Launch Campaign';

                        if (existingCampaign) {
                          const tierInfo = isTierChange(existingCampaign.currentBudget, selectedHours * 6);
                          if (tierInfo.isUpgrade) {
                            const diff = (selectedHours * 6) - existingCampaign.currentBudget;
                            return `Upgrade (+${diff} pts)`;
                          }
                          if (tierInfo.isDowngrade) {
                            return 'Downgrade Plan';
                          }
                          return 'Current Plan';
                        }

                        return hasActiveCampaign ? 'Already Subscribed' : 'Launch Campaign';
                      })()}
                    </Button>
                  </div>
                </TooltipTrigger>
                {(!canProceed() || (hasActiveCampaign && !existingCampaign) || isCheckingCampaign) && (
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      {isCheckingCampaign
                        ? 'Checking your campaign status...'
                        : hasActiveCampaign && !existingCampaign
                          ? 'You already have an active Cold Calling campaign. Please pause or cancel it before launching a new one.'
                          : selectedHours && existingCampaign
                            ? (() => {
                                const tierInfo = isTierChange(existingCampaign.currentBudget, selectedHours * 6);
                                if (tierInfo.isUpgrade) {
                                  const diff = (selectedHours * 6) - existingCampaign.currentBudget;
                                  return `Upgrade requires ${diff} points immediately. This would bring your balance to ${userBalance - diff} points. Minimum allowed: -2000 points.`;
                                }
                                if (!tierInfo.isTierChange) {
                                  return 'This is your current plan.';
                                }
                                return '';
                              })()
                            : selectedHours
                              ? `This would bring your balance to ${userBalance - (selectedHours * 6)} points. Minimum allowed: -2000 points.`
                              : 'Please select monthly hours to continue.'
                      }
                    </p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

ColdCallingWizard.displayName = 'ColdCallingWizard';

export default ColdCallingWizard;