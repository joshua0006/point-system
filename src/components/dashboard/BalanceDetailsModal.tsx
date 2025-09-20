
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, ArrowUp, ArrowDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { UserStats } from "@/hooks/useDashboardData";
import { memo } from "react";

interface BalanceDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTopUp: () => void;
  onViewUpcomingCharges?: () => void;
  userStats: UserStats;
}

export const BalanceDetailsModal = memo(({ 
  open, 
  onOpenChange, 
  onTopUp, 
  onViewUpcomingCharges,
  userStats 
}: BalanceDetailsModalProps) => {
  const isMobile = useIsMobile();


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isMobile ? "max-w-[95vw] h-[90vh] overflow-y-auto" : "max-w-2xl max-h-[80vh] overflow-y-auto"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Flexi-Credits Balance Details
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className={`text-3xl font-bold mb-2 ${userStats.totalPoints < 0 ? 'text-destructive' : 'text-primary'}`}>
                  {userStats.totalPoints < 0 ? 'Owes ' : ''}{Math.abs(userStats.totalPoints).toLocaleString()}{userStats.totalPoints < 0 ? ' pts' : ''}
                </div>
                <p className="text-muted-foreground">
                  {userStats.totalPoints < 0 ? 'Total Flexi-Credits Owed' : 'Total Flexi-Credits Available'}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>Credits Earned</span>
                  <ArrowUp className="w-4 h-4 text-success" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  +{userStats.pointsEarned.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>Credits Spent</span>
                  <ArrowDown className="w-4 h-4 text-destructive" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  -{userStats.pointsSpent.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="pt-4 border-t space-y-2">
            <Button onClick={onTopUp} className="w-full">
              Top Up Credits
            </Button>
            
            {onViewUpcomingCharges && (
              <Button 
                variant="outline"
                onClick={onViewUpcomingCharges}
                className="w-full"
              >
                View Upcoming Charges
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
