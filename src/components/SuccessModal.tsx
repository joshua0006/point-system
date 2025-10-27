import { CheckCircle, CreditCard, Coins } from '@/lib/icons';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "payment-method" | "top-up";
  amount?: number;
}

export const SuccessModal = ({ isOpen, onClose, type, amount }: SuccessModalProps) => {
  const isMobile = useIsMobile();
  const getContent = () => {
    if (type === "payment-method") {
      return {
        icon: <CreditCard className="h-16 w-16 text-green-500" />,
        title: "Payment Method Added!",
        description: "Your payment method has been successfully added and is ready to use.",
      };
    }
    
    return {
      icon: <Coins className="h-16 w-16 text-green-500" />,
      title: "Flexi-Credits Added Successfully!",
      description: `${amount} flexi-credits have been added to your account. You can now use them to book services.`,
    };
  };

  const content = getContent();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={isMobile ? "max-w-[90vw] text-center p-4" : "sm:max-w-md text-center"}>
        <div className="flex flex-col items-center space-y-6 py-8">
          <div className="relative">
            {content.icon}
            <CheckCircle className="h-8 w-8 text-green-500 absolute -bottom-1 -right-1 bg-background rounded-full" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">{content.title}</h2>
            <p className="text-muted-foreground">{content.description}</p>
          </div>

          <Button onClick={onClose} className="w-full">
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};