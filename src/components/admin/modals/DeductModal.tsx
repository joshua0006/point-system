import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Minus, AlertTriangle } from "lucide-react";
import { logger } from "@/utils/logger";
import type { UserProfile } from "@/config/types";

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

      setFlexiCredits("");
      setReason("");
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
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-yellow-800 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Warning</span>
            </div>
            <p className="text-yellow-700 text-sm mt-1">
              This action cannot be undone. Flexi credits will be permanently removed from the user's account.
            </p>
          </div>
          <Button 
            onClick={handleDeduct} 
            disabled={loading || !flexiCredits || !reason.trim()}
            variant="destructive"
            className="w-full"
          >
            {loading ? "Deducting..." : `Deduct ${flexiCredits || 0} Flexi Credits`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}