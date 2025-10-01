import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Calendar, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RecurringDeduction {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  day_of_month: number;
  next_billing_date: string;
  status: string;
  created_at: string;
  created_by: string;
  user_email?: string;
  user_name?: string;
}

export function RecurringDeductionsTable() {
  const [deductions, setDeductions] = useState<RecurringDeduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const fetchDeductions = async () => {
    try {
      setLoading(true);
      
      // Fetch deductions
      const { data: deductionsData, error: deductionsError } = await supabase
        .from('admin_recurring_deductions')
        .select('*')
        .order('next_billing_date', { ascending: true });

      if (deductionsError) throw deductionsError;

      // Fetch user profiles for all user_ids
      const userIds = [...new Set(deductionsData?.map(d => d.user_id) || [])];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, full_name')
        .in('user_id', userIds);

      if (profilesError) {
        console.warn('Failed to fetch user profiles:', profilesError);
      }

      // Create a map of user_id to profile data
      const profilesMap = new Map(
        profilesData?.map(p => [p.user_id, p]) || []
      );

      // Merge the data
      const formattedData = deductionsData?.map((deduction) => {
        const profile = profilesMap.get(deduction.user_id);
        return {
          ...deduction,
          user_email: profile?.email || 'Unknown',
          user_name: profile?.full_name || 'Unknown User'
        };
      }) || [];

      setDeductions(formattedData);
    } catch (error) {
      console.error('Error fetching recurring deductions:', error);
      toast({
        title: "Error",
        description: "Failed to load recurring deductions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeductions();

    // Subscribe to changes
    const channel = supabase
      .channel('recurring-deductions-changes')
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

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('admin_recurring_deductions')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Recurring deduction removed",
      });

      fetchDeductions();
    } catch (error) {
      console.error('Error deleting recurring deduction:', error);
      toast({
        title: "Error",
        description: "Failed to remove recurring deduction",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recurring Deductions</CardTitle>
          <CardDescription>Loading recurring deductions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (deductions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recurring Deductions</CardTitle>
          <CardDescription>No recurring deductions configured</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No recurring deductions have been set up yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Recurring Deductions</CardTitle>
          <CardDescription>
            Automated monthly deductions that run daily at 00:30 UTC
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Day of Month</TableHead>
                  <TableHead>Next Billing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deductions.map((deduction) => {
                  const isOverdue = new Date(deduction.next_billing_date) < new Date();
                  
                  return (
                    <TableRow key={deduction.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{deduction.user_name}</span>
                          <span className="text-sm text-muted-foreground">{deduction.user_email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        -{deduction.amount} FC
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={deduction.reason}>
                        {deduction.reason}
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
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(deduction.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-start gap-2 p-3 border rounded-lg bg-muted/50">
            <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">How it works:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>The system runs daily at 00:30 UTC</li>
                <li>Deductions are processed when next_billing_date matches current date</li>
                <li>After processing, next_billing_date is automatically updated to next month</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Recurring Deduction?</AlertDialogTitle>
            <AlertDialogDescription>
              This will stop the automated monthly deduction. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
