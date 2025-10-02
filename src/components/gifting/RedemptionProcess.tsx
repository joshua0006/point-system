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
  Info,
  ArrowRight
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
            <div className="relative">
              {/* Mobile: Vertical Layout */}
              <div className="flex flex-col gap-4 md:hidden">
                {steps.map((step, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-center gap-4 p-4 rounded-xl border bg-gradient-to-r from-card to-card/50 hover:shadow-md transition-all">
                      <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg shadow-lg">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-base">{step.title}</h4>
                      </div>
                      <div className="flex-shrink-0 text-primary/40">
                        {step.icon}
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="flex justify-center py-2">
                        <ArrowRight className="h-5 w-5 text-primary/30 rotate-90" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop: Horizontal Layout */}
              <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-6 gap-3">
                {steps.map((step, index) => (
                  <div key={index} className="relative">
                    <div className="flex flex-col items-center gap-3 p-4 rounded-xl border bg-gradient-to-b from-card to-card/50 hover:shadow-lg transition-all hover:-translate-y-1 group">
                      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground font-bold text-xl shadow-lg group-hover:scale-110 transition-transform">
                        {index + 1}
                      </div>
                      <div className="text-center space-y-2 flex-1">
                        <div className="text-primary/60 flex justify-center">
                          {step.icon}
                        </div>
                        <h4 className="font-semibold text-sm leading-tight px-1">{step.title}</h4>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <ArrowRight className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 z-10" />
                    )}
                  </div>
                ))}
              </div>
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
