import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ReceiptUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  giftingBalance: number;
}

export function ReceiptUploadModal({ open, onOpenChange, giftingBalance }: ReceiptUploadModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [description, setDescription] = useState('');
  const [receipts, setReceipts] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      setReceipts(prev => [...prev, file]);
    }

    e.target.value = '';
  };

  const removeReceipt = (fileToRemove: File) => {
    setReceipts(prev => prev.filter(f => f !== fileToRemove));
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
        description: `Your flexi credits balance (${giftingBalance}) is less than the requested amount`,
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to submit a reimbursement request",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload receipts to storage
      const receiptUrls: string[] = [];
      for (const file of receipts) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('receipts')
          .getPublicUrl(fileName);

        receiptUrls.push(publicUrl);
      }

      // Create reimbursement request
      const { error: insertError } = await supabase
        .from('reimbursement_requests')
        .insert({
          user_id: user.id,
          merchant: merchant.trim(),
          amount: reimbursementAmount,
          description: description.trim() || null,
          receipt_urls: receiptUrls,
          status: 'pending'
        });

      if (insertError) throw insertError;
      
      toast({
        title: "Request submitted",
        description: "Your reimbursement request has been submitted for admin approval.",
      });
      
      onOpenChange(false);
      setAmount('');
      setMerchant('');
      setDescription('');
      setReceipts([]);
    } catch (error: any) {
      console.error('Reimbursement submission error:', error);
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit reimbursement request",
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
                {receipts.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm flex-1 truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeReceipt(file)}
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
              placeholder="e.g., Amazon, Starbucks"
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
              Your flexi credits will be reduced by this amount upon approval
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
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
