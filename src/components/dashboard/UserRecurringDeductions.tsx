import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from '@/lib/icons';
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

interface RecurringDeduction {
  id: string;
  amount: number;
  reason: string;
  day_of_month: number;
  next_billing_date: string;
  status: string;
}

export function UserRecurringDeductions() {
  const isMobile = useIsMobile();
  const [deductions, setDeductions] = useState<RecurringDeduction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeductions = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from('admin_recurring_deductions')
        .select('id, amount, reason, day_of_month, next_billing_date, status')
        .eq('user_id', user.id)
        .order('next_billing_date', { ascending: true });

      if (error) throw error;
      setDeductions(data || []);
    } catch (error) {
      console.error('Error fetching recurring deductions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeductions();

    const channel = supabase
      .channel('user-recurring-deductions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_recurring_deductions'
        },
        () => {
          fetchDeductions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recurring Deductions</CardTitle>
          <CardDescription>Your scheduled monthly deductions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (deductions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recurring Deductions</CardTitle>
        <CardDescription>Your scheduled monthly deductions</CardDescription>
      </CardHeader>
      <CardContent>
        {isMobile ? (
          // Mobile: Card layout
          <div className="space-y-3">
            {deductions.map((deduction) => {
              const isOverdue = new Date(deduction.next_billing_date) < new Date();

              return (
                <Card key={deduction.id} className="border-l-4 border-l-primary">
                  <CardContent className="pt-4 pb-3 space-y-3">
                    {/* Reason & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm leading-tight flex-1">
                        {deduction.reason}
                      </h4>
                      <Badge
                        variant={deduction.status === 'active' ? 'default' : 'secondary'}
                      >
                        {deduction.status}
                      </Badge>
                    </div>

                    {/* Amount & Day */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Amount</p>
                        <p className="font-bold text-lg text-destructive">
                          -{deduction.amount} FC
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Billing Day</p>
                        <p className="font-medium text-sm">
                          Day {deduction.day_of_month}
                        </p>
                      </div>
                    </div>

                    {/* Next Billing */}
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Next Billing Date</p>
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">
                          {format(new Date(deduction.next_billing_date), 'MMM dd, yyyy')}
                        </p>
                        {isOverdue && (
                          <Badge variant="destructive" className="text-xs">
                            Overdue
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          // Desktop: Table layout
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reason</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Day of Month</TableHead>
                  <TableHead>Next Billing</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deductions.map((deduction) => {
                  const isOverdue = new Date(deduction.next_billing_date) < new Date();

                  return (
                    <TableRow key={deduction.id}>
                      <TableCell className="max-w-[180px] lg:max-w-xs truncate" title={deduction.reason}>
                        {deduction.reason}
                      </TableCell>
                      <TableCell className="font-medium">
                        -{deduction.amount} FC
                      </TableCell>
                      <TableCell>Day {deduction.day_of_month}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {format(new Date(deduction.next_billing_date), 'MMM dd, yyyy')}
                          {isOverdue && (
                            <Badge variant="destructive" className="text-xs">
                              Overdue
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={deduction.status === 'active' ? 'default' : 'secondary'}
                        >
                          {deduction.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
