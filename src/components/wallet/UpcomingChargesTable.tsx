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
import { useIsMobile } from "@/hooks/use-mobile";

interface UpcomingChargesTableProps {
  charges: UpcomingCharge[];
}

export function UpcomingChargesTable({ charges }: UpcomingChargesTableProps) {
  const isMobile = useIsMobile();
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
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
                <div
                  key={charge.participant_id}
                  className={isMobile
                    ? "flex flex-col gap-2 p-3 bg-card rounded-lg border border-destructive/20"
                    : "flex items-center justify-between p-3 bg-card rounded-lg border border-destructive/20"
                  }
                >
                  <div className={isMobile ? "w-full min-w-0" : "min-w-0 flex-1"}>
                    <p className="font-medium text-sm truncate" title={charge.campaign_name}>{charge.campaign_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {charge.consultant_name} • Due: {charge.due_date}
                    </p>
                  </div>
                  <div className={isMobile ? "flex items-center justify-between w-full" : "text-right"}>
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

      {/* Charges Table/Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Charges</CardTitle>
        </CardHeader>
        <CardContent>
          {isMobile ? (
            // Mobile: Card layout
            <div className="space-y-3">
              {charges.map((charge) => (
                <Card
                  key={charge.participant_id}
                  className={`border-l-4 ${
                    charge.is_overdue
                      ? "border-l-destructive bg-destructive/5"
                      : charge.days_until_charge <= 3
                      ? "border-l-orange-400 bg-orange-50/50"
                      : "border-l-border"
                  }`}
                >
                  <CardContent className="pt-4 pb-3 space-y-3">
                    {/* Campaign Name & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm leading-tight flex-1 min-w-0 break-words" title={charge.campaign_name}>
                        {charge.campaign_name}
                      </h4>
                      {getStatusBadge(charge)}
                    </div>

                    {/* Consultant */}
                    <p className="text-sm text-muted-foreground truncate" title={charge.consultant_name}>
                      {charge.consultant_name}
                    </p>

                    {/* Due Date & Amount */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground">Due Date</p>
                        <p className="font-medium text-sm">{charge.due_date}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {charge.is_overdue
                            ? `${Math.abs(charge.days_until_charge)} days overdue`
                            : charge.days_until_charge === 0
                            ? "Due today"
                            : `In ${charge.days_until_charge} days`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Amount</p>
                        <p className="font-bold text-lg">
                          {charge.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">credits</p>
                      </div>
                    </div>

                    {/* View Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Campaign
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // Desktop: Table layout
            <div className="border rounded-lg overflow-x-auto">
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
                      <TableCell className="font-medium max-w-[200px] lg:max-w-xs truncate" title={charge.campaign_name}>
                        {charge.campaign_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[150px] lg:max-w-[180px] truncate" title={charge.consultant_name}>
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
                              : `In ${charge.days_until_charge} days`}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {charge.amount.toLocaleString()} credits
                      </TableCell>
                      <TableCell>{getStatusBadge(charge)}</TableCell>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}