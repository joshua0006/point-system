import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Edit, AlertTriangle } from '@/lib/icons';
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface RecurringDeduction {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  day_of_month: number;
  next_billing_date: string;
  status: string;
  user_name?: string;
  user_email?: string;
}

interface EditRecurringDeductionModalProps {
  deduction: RecurringDeduction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditRecurringDeductionModal({ 
  deduction, 
  open, 
  onOpenChange, 
  onSuccess 
}: EditRecurringDeductionModalProps) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [nextBillingDate, setNextBillingDate] = useState<Date>(new Date());
  const [status, setStatus] = useState("active");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (deduction) {
      setAmount(deduction.amount.toString());
      setReason(deduction.reason);
      setDayOfMonth(deduction.day_of_month.toString());
      setNextBillingDate(new Date(deduction.next_billing_date));
      setStatus(deduction.status);
    }
  }, [deduction]);

  const handleSave = async () => {
    const amountValue = parseFloat(amount);
    if (!amountValue || amountValue <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount.",
        variant: "destructive",
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for the deduction.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Calculate the billing date from the selected date and day
      const billingDate = new Date(nextBillingDate);
      billingDate.setDate(parseInt(dayOfMonth));

      const { error } = await supabase.functions.invoke('admin-user-management', {
        body: {
          action: 'update_recurring_deduction',
          deductionId: deduction?.id,
          amount: amountValue,
          reason: reason.trim(),
          dayOfMonth: parseInt(dayOfMonth),
          nextBillingDate: billingDate.toISOString(),
          status: status
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Recurring deduction updated successfully.",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Update error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update recurring deduction.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!deduction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Edit Recurring Deduction
          </DialogTitle>
          <DialogDescription>
            Update recurring deduction for {deduction.user_name || deduction.user_email}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Flexi Credits Amount *</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0.1"
              step="0.1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              placeholder="Explain the reason for this deduction..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2 p-3 border rounded-lg bg-muted/50">
            <Label>Next Billing Month</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !nextBillingDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {nextBillingDate ? format(nextBillingDate, "MMMM yyyy") : <span>Pick a month</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={nextBillingDate}
                  onSelect={(date) => date && setNextBillingDate(date)}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2 p-3 border rounded-lg bg-muted/50">
            <Label htmlFor="day-of-month">Day of Month *</Label>
            <Select value={dayOfMonth} onValueChange={setDayOfMonth}>
              <SelectTrigger id="day-of-month">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <SelectItem key={day} value={day.toString()}>
                    {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Next deduction: {format(new Date(nextBillingDate.getFullYear(), nextBillingDate.getMonth(), parseInt(dayOfMonth)), "MMMM d, yyyy")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-3">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-500 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Note</span>
            </div>
            <p className="text-blue-700 dark:text-blue-400 text-sm mt-1">
              Changes will take effect immediately. The next deduction will occur on the specified date.
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSave} 
              disabled={loading || !amount || !reason.trim()}
              className="flex-1"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
