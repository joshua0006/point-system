import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Gift } from '@/lib/icons';
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
  
  // Award Credits state
  const [awardAmount, setAwardAmount] = useState("");
  const [awardReason, setAwardReason] = useState("");
  const [expiryDays, setExpiryDays] = useState("365");
  const [awardLoading, setAwardLoading] = useState(false);
  
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

  const handleAwardCredits = async () => {
    logger.log('Award Credits initiated for user:', user.user_id, 'Amount:', awardAmount);
    
    const creditsAmount = parseFloat(awardAmount);
    const daysUntilExpiry = parseInt(expiryDays);
    
    if (isNaN(creditsAmount) || creditsAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid number of flexi credits to award.",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(daysUntilExpiry) || daysUntilExpiry <= 0) {
      toast({
        title: "Invalid Expiry",
        description: "Please enter a valid number of days until expiry.",
        variant: "destructive",
      });
      return;
    }

    if (!awardReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for awarding flexi credits.",
        variant: "destructive",
      });
      return;
    }

    setAwardLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('award-flexi-credits', {
        body: {
          userId: user.user_id,
          amount: creditsAmount,
          expiryDays: daysUntilExpiry,
          reason: awardReason.trim()
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Awarded ${creditsAmount} locked flexi credits to ${user.full_name || user.email}. They will expire in ${daysUntilExpiry} days.`,
      });

      setAwardAmount("");
      setAwardReason("");
      setExpiryDays("90");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      logger.error('Award Credits error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to award flexi credits. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAwardLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Flexi Credits</DialogTitle>
          <DialogDescription>
            Add or award flexi credits to {user.full_name || user.email}'s account
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="topup" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="topup">
              <Plus className="w-4 h-4 mr-2" />
              Top Up (Immediate)
            </TabsTrigger>
            <TabsTrigger value="award">
              <Gift className="w-4 h-4 mr-2" />
              Award Credits (Locked)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="topup" className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Balance</label>
              <div className="text-2xl font-bold text-accent">{(user.flexi_credits_balance || 0)} FXC</div>
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
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-200 text-sm">
                <Plus className="w-4 h-4" />
                <span className="font-medium">Adding Credits (Immediate)</span>
              </div>
              <p className="text-green-700 dark:text-green-300 text-sm mt-1">
                Credits will be immediately available in the user's balance.
              </p>
            </div>
            <Button 
              onClick={handleTopUp} 
              disabled={loading || !flexiCredits || flexiCredits.trim() === '' || parseFloat(flexiCredits) <= 0 || !reason.trim()}
              className="w-full"
            >
              {loading ? "Adding..." : `Add ${flexiCredits || 0} Flexi Credits`}
            </Button>
          </TabsContent>

          <TabsContent value="award" className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Balance</label>
              <div className="text-2xl font-bold text-accent">{(user.flexi_credits_balance || 0)} FXC</div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Awarded Credits Amount</label>
              <Input
                type="number"
                placeholder="Enter amount to award"
                value={awardAmount}
                onChange={(e) => setAwardAmount(e.target.value)}
                min="0.1"
                step="0.1"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Expiry (Days)</label>
              <Input
                type="number"
                placeholder="Days until expiry"
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                min="1"
              />
              <p className="text-xs text-muted-foreground">
                Default: 365 days. Credits will expire after this period if not unlocked.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for Award *</label>
              <Textarea
                placeholder="Explain why flexi credits are being awarded..."
                value={awardReason}
                onChange={(e) => setAwardReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 text-sm">
                <Gift className="w-4 h-4" />
                <span className="font-medium">Awarding Locked Credits</span>
              </div>
              <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
                Credits will be locked initially. Users can unlock up to 50% when they top up their account.
              </p>
            </div>
            <Button 
              onClick={handleAwardCredits} 
              disabled={awardLoading || !awardAmount || parseFloat(awardAmount) <= 0 || !awardReason.trim()}
              className="w-full"
            >
              {awardLoading ? "Awarding..." : `Award ${awardAmount || 0} Locked Flexi Credits`}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}