import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

interface RecurringDeduction {
  id: string;
  amount: number;
  reason: string;
  day_of_month: number;
  next_billing_date: string;
  status: string;
}

export function UserRecurringDeductions() {
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
        <div className="rounded-md border">
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
                    <TableCell className="max-w-xs truncate" title={deduction.reason}>
                      {deduction.reason}
                    </TableCell>
                    <TableCell className="font-medium">
                      -{deduction.amount} FC
                    </TableCell>
                    <TableCell>
                      Day {deduction.day_of_month}
                    </TableCell>
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
      </CardContent>
    </Card>
  );
}
