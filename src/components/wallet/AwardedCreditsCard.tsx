import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock, Clock, AlertTriangle } from "lucide-react";
import { useAwardedCredits } from "@/hooks/useAwardedCredits";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format, formatDistanceToNow } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

export function AwardedCreditsCard() {
  const { data, isLoading } = useAwardedCredits();
  const [historyOpen, setHistoryOpen] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.awards.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Awarded Flexi Credits
          </CardTitle>
          <CardDescription>
            No awarded credits yet. Check back later!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const activeAwards = data.awards.filter(a => a.status === 'active' && Number(a.locked_amount) > 0);
  const nextExpiring = activeAwards.length > 0 
    ? activeAwards.reduce((earliest, award) => 
        new Date(award.expires_at) < new Date(earliest.expires_at) ? award : earliest
      )
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-orange-600" />
          Awarded Flexi Credits
        </CardTitle>
        <CardDescription>
          Credits awarded by admins. Top-up to unlock them!
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Section */}
        <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-muted/50">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{data.lockedBalance}</div>
            <div className="text-xs text-muted-foreground">Locked</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{data.unlockedBalance}</div>
            <div className="text-xs text-muted-foreground">Unlocked</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{data.lockedBalance + data.unlockedBalance}</div>
            <div className="text-xs text-muted-foreground">Total Awarded</div>
          </div>
        </div>

        {/* Expiring Warning */}
        {data.hasExpiringCredits && data.expiringCredits[0] && (
          <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              <div className="font-medium">Credits Expiring Soon!</div>
              <div className="text-sm mt-1">
                {data.expiringCredits[0].amount} FXC expires in {data.expiringCredits[0].days_until_expiry} days
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Active Awards List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Active Awards</h4>
          {activeAwards.map((award) => {
            const isExpiringSoon = nextExpiring?.id === award.id;
            
            return (
              <div
                key={award.id}
                className={`p-3 rounded-lg border ${
                  isExpiringSoon ? 'border-orange-500 bg-orange-50 dark:bg-orange-950' : 'border-border'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{award.locked_amount} FXC</span>
                      <Badge variant={isExpiringSoon ? "destructive" : "secondary"} className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDistanceToNow(new Date(award.expires_at), { addSuffix: true })}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {award.reason || 'Awarded by admin'}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between text-xs text-muted-foreground mt-2 pt-2 border-t">
                  <span>Awarded: {format(new Date(award.awarded_date), 'MMM dd, yyyy')}</span>
                  <span>Expires: {format(new Date(award.expires_at), 'MMM dd, yyyy')}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Unlock History (Collapsible) */}
        {data.unlockedBalance > 0 && (
          <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span className="text-sm">Unlock History</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${historyOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {data.awards
                .filter(a => Number(a.unlocked_amount) > 0)
                .map((award) => (
                  <div key={award.id} className="p-3 rounded-lg border bg-green-50 dark:bg-green-950/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Unlock className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-700 dark:text-green-400">
                        {award.unlocked_amount} FXC Unlocked
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {award.status === 'fully_unlocked' ? 'Fully unlocked' : `${award.locked_amount} FXC still locked`}
                    </div>
                  </div>
                ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Info Box */}
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
          <div className="text-xs text-blue-800 dark:text-blue-200">
            <strong>How to unlock:</strong> Top-up your account to unlock awarded credits at a 2:1 ratio. 
            For example, a $200 top-up unlocks 100 FXC.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}