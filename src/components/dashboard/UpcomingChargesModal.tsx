import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar, User, DollarSign } from '@/lib/icons';
import { useUpcomingCharges } from "@/hooks/useUpcomingCharges";
import { useIsMobile } from "@/hooks/use-mobile";

interface UpcomingChargesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpcomingChargesModal({ open, onOpenChange }: UpcomingChargesModalProps) {
  const { data: upcomingCharges, isLoading } = useUpcomingCharges();
  const isMobile = useIsMobile();

  const totalUpcoming = upcomingCharges?.reduce((sum, charge) => sum + charge.amount, 0) || 0;
  const overdueCharges = upcomingCharges?.filter(charge => charge.is_overdue) || [];
  const nextCharges = upcomingCharges?.filter(charge => !charge.is_overdue) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isMobile ? "max-w-[95vw] h-[90vh] overflow-y-auto" : "max-w-4xl max-h-[80vh] overflow-y-auto"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Flexi-Credit Charges
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Upcoming</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUpcoming.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">flexi-credits</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{overdueCharges.length}</div>
                <p className="text-xs text-muted-foreground">charges</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Next 30 Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {nextCharges.filter(c => c.days_until_charge <= 30).length}
                </div>
                <p className="text-xs text-muted-foreground">charges</p>
              </CardContent>
            </Card>
          </div>

          {/* Overdue Charges */}
          {overdueCharges.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <h3 className="text-lg font-semibold text-destructive">Overdue Charges</h3>
              </div>
              <div className="space-y-3">
                {overdueCharges.map((charge, index) => (
                  <Card key={index} className="border-destructive">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-4 h-4" />
                            <span className="font-medium">{charge.consultant_name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{charge.campaign_name}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Due: {charge.due_date}
                            </span>
                            <Badge variant="destructive">Overdue</Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-destructive">
                            {charge.amount.toLocaleString()} pts
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Charges */}
          {nextCharges.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Upcoming Charges</h3>
              <div className="space-y-3">
                {nextCharges.map((charge, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-4 h-4" />
                            <span className="font-medium">{charge.consultant_name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{charge.campaign_name}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Due: {charge.due_date}
                            </span>
                            <Badge variant="outline">
                              {charge.days_until_charge === 0 ? 'Today' : `${charge.days_until_charge} days`}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {charge.amount.toLocaleString()} pts
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* No charges */}
          {(!upcomingCharges || upcomingCharges.length === 0) && !isLoading && (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Upcoming Charges</h3>
              <p className="text-muted-foreground">You don't have any scheduled flexi-credit charges.</p>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading upcoming charges...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}