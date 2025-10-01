import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Minus, AlertTriangle, Calendar } from "lucide-react";
import { logger } from "@/utils/logger";
import type { UserProfile } from "@/config/types";
import { getNextBillingDateISO } from "@/utils/dateUtils";

interface DeductModalProps {
  user: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeductModal({ user, open, onOpenChange, onSuccess }: DeductModalProps) {
  const [flexiCredits, setFlexiCredits] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [deductToday, setDeductToday] = useState(false);
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const { toast } = useToast();

  const handleDeduct = async () => {
    const creditsAmount = parseFloat(flexiCredits);
    if (!creditsAmount || creditsAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid number of flexi credits to deduct.",
        variant: "destructive",
      });
      return;
    }

    const balanceAfter = (user.flexi_credits_balance || 0) - creditsAmount;
    if (balanceAfter < -500) {
      toast({
        title: "Balance Limit Exceeded",
        description: `This would bring user's balance to ${balanceAfter} flexi credits. Minimum allowed balance is -500.`,
        variant: "destructive",
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for deducting flexi credits.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (isRecurring) {
        // Setup recurring deduction
        const { data, error } = await supabase.functions.invoke('admin-user-management', {
          body: {
            action: 'setup_recurring_deduction',
            userId: user.user_id,
            amount: creditsAmount,
            reason: reason.trim(),
            dayOfMonth: parseInt(dayOfMonth),
            deductToday: deductToday
          }
        });

        if (error) throw error;

        const todayMessage = deductToday ? ` Immediate deduction of ${creditsAmount} flexi credits processed today.` : '';
        toast({
          title: "Success",
          description: `Set up recurring deduction of ${creditsAmount} flexi credits on day ${dayOfMonth} of each month for ${user.full_name || user.email}.${todayMessage}`,
        });
      } else {
        // One-time deduction
        const { data, error } = await supabase.functions.invoke('admin-user-management', {
          body: {
            action: 'deduct_points',
            userId: user.user_id,
            points: creditsAmount,
            reason: reason.trim()
          }
        });

        if (error) throw error;

        toast({
          title: "Success",
          description: `Deducted ${creditsAmount} flexi credits from ${user.full_name || user.email}'s account.`,
        });
      }

      setFlexiCredits("");
      setReason("");
      setIsRecurring(false);
      setDeductToday(false);
      setDayOfMonth("1");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      logger.error('Deduct error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to deduct flexi credits. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Minus className="w-5 h-5" />
            Deduct Flexi Credits
          </DialogTitle>
          <DialogDescription>
            Remove flexi credits from {user.full_name || user.email}'s account
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Balance</label>
            <div className="text-2xl font-bold text-accent">{(user.flexi_credits_balance || 0)} flexi credits</div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Flexi Credits to Deduct</label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={flexiCredits}
              onChange={(e) => setFlexiCredits(e.target.value)}
              min="0.1"
              max={(user.flexi_credits_balance || 0)}
              step="0.1"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason for Deduction *</label>
            <Textarea
              placeholder="Explain why flexi credits are being deducted..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="recurring" className="cursor-pointer">
                Make this a recurring deduction
              </Label>
            </div>
            <Switch
              id="recurring"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
          </div>

          {isRecurring && (
            <>
              <div className="space-y-2 p-3 border rounded-lg bg-muted/50">
                <Label htmlFor="day-of-month">Deduct on day of month *</Label>
                <Select value={dayOfMonth} onValueChange={setDayOfMonth}>
                  <SelectTrigger id="day-of-month">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of each month
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {deductToday 
                    ? `Deduction will occur today and then on the ${dayOfMonth}${dayOfMonth === "1" ? 'st' : dayOfMonth === "2" ? 'nd' : dayOfMonth === "3" ? 'rd' : 'th'} of each month`
                    : `First deduction will occur on the ${dayOfMonth}${dayOfMonth === "1" ? 'st' : dayOfMonth === "2" ? 'nd' : dayOfMonth === "3" ? 'rd' : 'th'} of next month`
                  }
                </p>
              </div>

              <div className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Minus className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="deduct-today" className="cursor-pointer">
                    Also deduct today immediately
                  </Label>
                </div>
                <Switch
                  id="deduct-today"
                  checked={deductToday}
                  onCheckedChange={setDeductToday}
                />
              </div>
            </>
          )}

          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-3">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-500 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Warning</span>
            </div>
            <p className="text-yellow-700 dark:text-yellow-400 text-sm mt-1">
              {isRecurring 
                ? deductToday
                  ? "This will deduct flexi credits today and set up automatic monthly deductions. You can cancel the recurring deduction anytime."
                  : "This will set up automatic monthly deductions. You can cancel this anytime from the user's profile."
                : "This action cannot be undone. Flexi credits will be permanently removed from the user's account."
              }
            </p>
          </div>
          <Button 
            onClick={handleDeduct} 
            disabled={loading || !flexiCredits || !reason.trim()}
            variant="destructive"
            className="w-full"
          >
            {loading 
              ? "Processing..." 
              : isRecurring 
                ? `Setup Recurring Deduction` 
                : `Deduct ${flexiCredits || 0} Flexi Credits`
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}