import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Gift, Download, Camera } from 'lucide-react';
import { useRef } from 'react';
import html2canvas from 'html2canvas';

interface ConversionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversionData: {
    amount: number;
    new_gifting_balance: number;
    transaction_id: string;
    conversion_reference: string;
  } | null;
}

export function ConversionSuccessModal({ isOpen, onClose, conversionData }: ConversionSuccessModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handleScreenshot = async () => {
    if (receiptRef.current) {
      try {
        const canvas = await html2canvas(receiptRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
        });
        
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `gifting-credits-conversion-${conversionData?.transaction_id?.slice(0, 8)}.png`;
        link.href = url;
        link.click();
      } catch (error) {
        console.error('Error taking screenshot:', error);
      }
    }
  };

  if (!conversionData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            Conversion Successful!
          </DialogTitle>
        </DialogHeader>

        <div ref={receiptRef} className="space-y-4 py-4 bg-white">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 text-center space-y-2">
            <Gift className="h-12 w-12 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">You now have</p>
            <p className="text-3xl font-bold text-green-600">
              {conversionData.new_gifting_balance.toFixed(1)}
            </p>
            <p className="text-sm text-muted-foreground">Gifting Credits</p>
          </div>

          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Converted Amount</span>
              <span className="font-medium">{conversionData.amount.toFixed(1)} credits</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Transaction ID</span>
              <span className="font-mono text-xs">
                {conversionData.transaction_id.slice(0, 8)}...
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Reference</span>
              <span className="font-mono text-xs">
                {conversionData.conversion_reference?.slice(0, 8)}...
              </span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 mb-2 font-medium flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Next Steps
            </p>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Take a screenshot of this confirmation</li>
              <li>Send it to your account manager</li>
              <li>Your gifting credits will be ready to use for client gifts</li>
            </ol>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleScreenshot}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Save Receipt
          </Button>
          <Button onClick={onClose} className="flex-1">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}