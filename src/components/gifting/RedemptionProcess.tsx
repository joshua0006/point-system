import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ShoppingBag, 
  Receipt, 
  Upload, 
  Clock, 
  CheckCircle2, 
  CreditCard,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ReceiptUploadModal } from './ReceiptUploadModal';

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    icon: <ShoppingBag className="h-6 w-6" />,
    title: "Browse Partner Merchants",
    description: ""
  },
  {
    icon: <CreditCard className="h-6 w-6" />,
    title: "Make Your Purchase",
    description: ""
  },
  {
    icon: <Receipt className="h-6 w-6" />,
    title: "Save Your Receipt",
    description: ""
  },
  {
    icon: <Upload className="h-6 w-6" />,
    title: "Submit for Reimbursement",
    description: ""
  },
  {
    icon: <Clock className="h-6 w-6" />,
    title: "Wait for Approval",
    description: ""
  },
  {
    icon: <CheckCircle2 className="h-6 w-6" />,
    title: "Receive Your Refund",
    description: ""
  }
];

interface RedemptionProcessProps {
  giftingBalance: number;
}

export function RedemptionProcess({ giftingBalance }: RedemptionProcessProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  return (
    <Card className="border-primary/20">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer">
              <CardTitle className="text-xl flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                How to Redeem Your Gifting Credits
              </CardTitle>
              <Button variant="ghost" size="sm">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Steps */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              {steps.map((step, index) => (
                <div 
                  key={index}
                  className="flex flex-col items-center gap-3 p-6 rounded-xl border bg-card/50 hover:bg-accent/30 transition-all hover:scale-105 min-w-[140px]"
                >
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
                    {step.icon}
                  </div>
                  <div className="text-center space-y-1">
                    <span className="text-xs font-bold text-primary">STEP {index + 1}</span>
                    <h4 className="font-semibold text-sm leading-tight">{step.title}</h4>
                  </div>
                </div>
              ))}
            </div>


            {/* Submit Button */}
            <div className="flex justify-center pt-2">
              <Button 
                size="lg" 
                className="w-full md:w-auto"
                onClick={() => setShowUploadModal(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Submit Receipt for Reimbursement
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      <ReceiptUploadModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        giftingBalance={giftingBalance}
      />
    </Card>
  );
}
