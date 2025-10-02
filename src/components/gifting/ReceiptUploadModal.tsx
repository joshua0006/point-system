import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReceiptUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  giftingBalance: number;
}

export function ReceiptUploadModal({ open, onOpenChange, giftingBalance }: ReceiptUploadModalProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [description, setDescription] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Receipt file must be less than 20MB",
          variant: "destructive",
        });
        return;
      }
      setReceiptFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const reimbursementAmount = parseFloat(amount);
    
    if (!receiptFile) {
      toast({
        title: "Receipt required",
        description: "Please upload a receipt image",
        variant: "destructive",
      });
      return;
    }

    if (!merchant.trim()) {
      toast({
        title: "Merchant required",
        description: "Please enter the merchant name",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(reimbursementAmount) || reimbursementAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (reimbursementAmount > giftingBalance) {
      toast({
        title: "Insufficient balance",
        description: `Your gifting credits balance (${giftingBalance}) is less than the requested amount`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Implement receipt upload and reimbursement request
      // This would upload the file to storage and create a reimbursement request
      
      toast({
        title: "Receipt submitted",
        description: "Your reimbursement request has been submitted for review. You'll receive an email within 3-5 business days.",
      });
      
      onOpenChange(false);
      setAmount('');
      setMerchant('');
      setDescription('');
      setReceiptFile(null);
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit receipt",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit Receipt for Reimbursement</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Receipt Upload */}
          <div className="space-y-2">
            <Label htmlFor="receipt">Receipt Image/PDF *</Label>
            {receiptFile ? (
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                <span className="text-sm flex-1 truncate">{receiptFile.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setReceiptFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                <input
                  id="receipt"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="receipt" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload receipt
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, or PDF (max 20MB)
                  </p>
                </label>
              </div>
            )}
          </div>

          {/* Merchant */}
          <div className="space-y-2">
            <Label htmlFor="merchant">Merchant Name *</Label>
            <Input
              id="merchant"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder=""
              required
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Reimbursement Amount *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={giftingBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-7"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Available balance: ${giftingBalance.toFixed(2)}
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any additional details about the purchase..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Submitting..." : "Submit Receipt"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
