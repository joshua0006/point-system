import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRightLeft, Gift } from 'lucide-react';
import { useGiftingCredits } from '@/hooks/useGiftingCredits';
import { useAuth } from '@/contexts/AuthContext';

interface ConvertCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
}

export function ConvertCreditsModal({ isOpen, onClose, onSuccess }: ConvertCreditsModalProps) {
  const [amount, setAmount] = useState('');
  const { convertToGiftingCredits, isConverting } = useGiftingCredits();
  const { profile } = useAuth();

  const handleConvert = async () => {
    const numAmount = parseFloat(amount);
    
    if (!numAmount || numAmount <= 0) {
      return;
    }

    if (numAmount > (profile?.flexi_credits_balance || 0)) {
      return;
    }

    try {
      const result = await convertToGiftingCredits(numAmount);
      onSuccess(result);
      onClose();
      setAmount('');
    } catch (error) {
      // Error handled in hook
    }
  };

  const availableCredits = profile?.flexi_credits_balance || 0;
  const numAmount = parseFloat(amount) || 0;
  const isValid = numAmount > 0 && numAmount <= availableCredits;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Convert to Gifting Credits
          </DialogTitle>
          <DialogDescription>
            Convert your Flexi Credits to Gifting Credits (1:1 ratio)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount to Convert</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              max={availableCredits}
              step="0.1"
            />
            <p className="text-sm text-muted-foreground">
              Available: {availableCredits.toFixed(1)} Flexi Credits
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Flexi Credits</span>
              <span className="font-medium">-{numAmount.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-center py-1">
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Gift className="h-3.5 w-3.5" />
                Gifting Credits
              </span>
              <span className="font-medium text-green-600">+{numAmount.toFixed(1)}</span>
            </div>
          </div>

          {numAmount > availableCredits && (
            <p className="text-sm text-destructive">
              Insufficient Flexi Credits
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isConverting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConvert}
            disabled={!isValid || isConverting}
            className="flex-1"
          >
            {isConverting ? "Converting..." : "Convert Credits"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}