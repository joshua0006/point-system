import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, Loader2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ReceiptUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  giftingBalance: number;
}

interface ReceiptWithAmount {
  file: File;
  extractedAmount: number | null;
  isProcessing: boolean;
}

export function ReceiptUploadModal({ open, onOpenChange, giftingBalance }: ReceiptUploadModalProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [description, setDescription] = useState('');
  const [receipts, setReceipts] = useState<ReceiptWithAmount[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  const extractAmountFromReceipt = async (file: File): Promise<number | null> => {
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke('extract-receipt-amount', {
        body: { image: base64 },
      });

      if (error) throw error;
      return data?.amount || null;
    } catch (error) {
      console.error('Error extracting amount:', error);
      return null;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    for (const file of files) {
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} must be less than 20MB`,
          variant: "destructive",
        });
        continue;
      }

      const newReceipt: ReceiptWithAmount = {
        file,
        extractedAmount: null,
        isProcessing: true,
      };

      setReceipts(prev => [...prev, newReceipt]);

      // Extract amount using AI
      setIsProcessingAI(true);
      const extractedAmount = await extractAmountFromReceipt(file);
      
      setReceipts(prev => 
        prev.map(r => 
          r.file === file 
            ? { ...r, extractedAmount, isProcessing: false }
            : r
        )
      );

      // Update total amount
      setReceipts(prev => {
        const total = prev.reduce((sum, r) => sum + (r.extractedAmount || 0), 0);
        setAmount(total > 0 ? total.toFixed(2) : '');
        setIsProcessingAI(prev.some(r => r.isProcessing));
        return prev;
      });
    }

    // Clear the input
    e.target.value = '';
  };

  const removeReceipt = (fileToRemove: File) => {
    setReceipts(prev => {
      const updated = prev.filter(r => r.file !== fileToRemove);
      const total = updated.reduce((sum, r) => sum + (r.extractedAmount || 0), 0);
      setAmount(total > 0 ? total.toFixed(2) : '');
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const reimbursementAmount = parseFloat(amount);
    
    if (receipts.length === 0) {
      toast({
        title: "Receipt required",
        description: "Please upload at least one receipt image",
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
      setReceipts([]);
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
            <Label htmlFor="receipt">Receipt Images/PDFs *</Label>
            
            {receipts.length > 0 && (
              <div className="space-y-2 mb-3">
                {receipts.map((receipt, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{receipt.file.name}</p>
                      {receipt.isProcessing ? (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Extracting amount...
                        </p>
                      ) : receipt.extractedAmount !== null ? (
                        <p className="text-xs text-green-600">
                          Amount detected: ${receipt.extractedAmount.toFixed(2)}
                        </p>
                      ) : (
                        <p className="text-xs text-amber-600">
                          Could not detect amount
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeReceipt(receipt.file)}
                      disabled={receipt.isProcessing}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer">
              <input
                id="receipt"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
                multiple
              />
              <label htmlFor="receipt" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload receipt{receipts.length > 0 ? 's' : ''}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, or PDF (max 20MB each)
                </p>
                {isProcessingAI && (
                  <p className="text-xs text-primary mt-2 flex items-center justify-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    AI is reading your receipts...
                  </p>
                )}
              </label>
            </div>
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
            <Label htmlFor="amount">Total Reimbursement Amount *</Label>
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
              {receipts.length > 0 && receipts.some(r => r.extractedAmount !== null) && (
                <span className="text-primary ml-1">
                  • Auto-calculated from {receipts.filter(r => r.extractedAmount !== null).length} receipt(s)
                </span>
              )}
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
              disabled={isSubmitting || isProcessingAI}
              className="flex-1"
            >
              {isSubmitting ? "Submitting..." : isProcessingAI ? "Processing..." : "Submit Receipts"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
