import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  AlertTriangle, 
  Calendar, 
  Clock,
  ExternalLink
} from "lucide-react";
import { UpcomingCharge } from "@/hooks/useUpcomingCharges";

interface UpcomingChargesTableProps {
  charges: UpcomingCharge[];
}

export function UpcomingChargesTable({ charges }: UpcomingChargesTableProps) {
  const totalUpcoming = charges.reduce((sum, charge) => sum + charge.amount, 0);
  const overdueCharges = charges.filter(charge => charge.is_overdue);
  const upcomingCharges = charges.filter(charge => !charge.is_overdue);

  const getStatusBadge = (charge: UpcomingCharge) => {
    if (charge.is_overdue) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    
    if (charge.days_until_charge <= 3) {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">Due Soon</Badge>;
    }
    
    return <Badge variant="outline">Scheduled</Badge>;
  };

  const getUrgencyColor = (charge: UpcomingCharge) => {
    if (charge.is_overdue) return "bg-destructive/5 border-l-destructive";
    if (charge.days_until_charge <= 3) return "bg-orange-50/50 border-l-orange-400";
    return "";
  };

  if (charges.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Upcoming Charges</h3>
            <p className="text-muted-foreground">
              You don't have any scheduled charges at this time.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Upcoming</p>
                <p className="text-2xl font-bold text-foreground">
                  {totalUpcoming.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Credits to be charged</p>
              </div>
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold text-primary">
                  {upcomingCharges.length}
                </p>
                <p className="text-xs text-muted-foreground">Charges pending</p>
              </div>
              <Calendar className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-destructive">
                  {overdueCharges.length}
                </p>
                <p className="text-xs text-muted-foreground">Require attention</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alerts */}
      {overdueCharges.length > 0 && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Action Required: Overdue Charges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive mb-4">
              You have {overdueCharges.length} overdue charge{overdueCharges.length > 1 ? 's' : ''} that need immediate attention.
            </p>
            <div className="space-y-2">
              {overdueCharges.map((charge) => (
                <div key={charge.participant_id} className="flex items-center justify-between p-3 bg-card rounded-lg border border-destructive/20">
                  <div>
                    <p className="font-medium text-sm">{charge.campaign_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {charge.consultant_name} • Due: {charge.due_date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-destructive">
                      {charge.amount.toLocaleString()} credits
                    </p>
                    <Badge variant="destructive" className="text-xs">
                      {Math.abs(charge.days_until_charge)} days overdue
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charges Table */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Charges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Consultant</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {charges.map((charge) => (
                  <TableRow 
                    key={charge.participant_id}
                    className={getUrgencyColor(charge)}
                  >
                    <TableCell className="font-medium">
                      {charge.campaign_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {charge.consultant_name}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{charge.due_date}</p>
                        <p className="text-xs text-muted-foreground">
                          {charge.is_overdue 
                            ? `${Math.abs(charge.days_until_charge)} days overdue`
                            : charge.days_until_charge === 0 
                              ? "Due today"
                              : `In ${charge.days_until_charge} days`
                          }
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {charge.amount.toLocaleString()} credits
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(charge)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}