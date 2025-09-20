import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { logger } from "@/utils/logger";
import type { UserProfile } from "@/config/types";

interface TopUpModalProps {
  user: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TopUpModal({ user, open, onOpenChange, onSuccess }: TopUpModalProps) {
  const [flexiCredits, setFlexiCredits] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleTopUp = async () => {
    logger.log('TopUp initiated for user:', user.user_id, 'Amount:', flexiCredits);
    
    const creditsAmount = parseFloat(flexiCredits);
    
    if (isNaN(creditsAmount) || creditsAmount <= 0) {
      logger.warn('Invalid credits amount:', { flexiCredits, creditsAmount });
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid number of flexi credits to add.",
        variant: "destructive",
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for adding flexi credits.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: {
          action: 'topup_points',
          userId: user.user_id,
          points: creditsAmount,
          reason: reason.trim()
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Added ${creditsAmount} flexi credits to ${user.full_name || user.email}'s account.`,
      });

      setFlexiCredits("");
      setReason("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      logger.error('TopUp error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add flexi credits. Please try again.",
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
          <DialogTitle>Top Up Flexi Credits</DialogTitle>
          <DialogDescription>
            Add flexi credits to {user.full_name || user.email}'s account
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Balance</label>
            <div className="text-2xl font-bold text-accent">{(user.flexi_credits_balance || 0)} flexi credits</div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Flexi Credits to Add</label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={flexiCredits}
              onChange={(e) => setFlexiCredits(e.target.value)}
              min="0.1"
              step="0.1"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason for Adding Credits *</label>
            <Textarea
              placeholder="Explain why flexi credits are being added..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-800 text-sm">
              <Plus className="w-4 h-4" />
              <span className="font-medium">Adding Credits</span>
            </div>
            <p className="text-green-700 text-sm mt-1">
              This will permanently add flexi credits to the user's account and send email notifications.
            </p>
          </div>
          <Button 
            onClick={handleTopUp} 
            disabled={loading || !flexiCredits || flexiCredits.trim() === '' || parseFloat(flexiCredits) <= 0 || !reason.trim()}
            className="w-full"
          >
            {loading ? "Adding..." : `Add ${flexiCredits || 0} Flexi Credits`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}