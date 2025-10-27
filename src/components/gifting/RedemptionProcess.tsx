import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ShoppingBag,
  Upload,
  CheckCircle2,
  Info,
  ArrowRight
} from '@/lib/icons';
import { ReceiptUploadModal } from './ReceiptUploadModal';

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    icon: <ShoppingBag className="h-6 w-6" aria-hidden="true" />,
    title: "Browse & Purchase",
    description: "Choose from our partner merchants and make your purchase"
  },
  {
    icon: <Upload className="h-6 w-6" aria-hidden="true" />,
    title: "Submit Receipt",
    description: "Upload your receipt for reimbursement review"
  },
  {
    icon: <CheckCircle2 className="h-6 w-6" aria-hidden="true" />,
    title: "Get Reimbursed",
    description: "Receive flexi-credits once approved by our team"
  }
];

interface RedemptionProcessProps {
  giftingBalance: number;
}

export function RedemptionProcess({ giftingBalance }: RedemptionProcessProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);

  return (
    <Card
      className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5"
      role="region"
      aria-labelledby="redemption-heading"
    >
      <CardHeader className="space-y-1.5 sm:space-y-2 p-2.5 xs:p-3 sm:p-4 md:p-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10" aria-hidden="true">
            <Info className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <CardTitle id="redemption-heading" className="text-base sm:text-lg md:text-xl">
            How to Redeem Your Gifting Credits
          </CardTitle>
        </div>
        <CardDescription className="text-xs sm:text-sm">
          Follow these simple steps to get reimbursed for your client gifts
        </CardDescription>
      </CardHeader>

      <Separator className="mb-4 sm:mb-6" />

      <CardContent className="space-y-4 sm:space-y-6 p-2.5 xs:p-3 sm:p-4 md:p-6">
        {/* Steps */}
        <div className="relative" role="list" aria-label="Redemption steps">
          {/* Mobile: Vertical Layout */}
          <div className="flex flex-col gap-1.5 sm:gap-2 md:hidden">
            {steps.map((step, index) => (
              <div key={index} role="listitem">
                <div
                  className="p-2 xs:p-2.5 sm:p-3 md:p-4 rounded-xl border bg-gradient-to-r from-card to-card/50 hover:shadow-md transition-all space-y-1.5 sm:space-y-2 group"
                  aria-label={`Step ${index + 1}: ${step.title}`}
                >
                  {/* Icon at top */}
                  <div className="flex justify-center" aria-hidden="true">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                      <div className="text-white [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5 md:[&>svg]:w-6 md:[&>svg]:h-6">
                        {step.icon}
                      </div>
                    </div>
                  </div>
                  {/* Badge */}
                  <div className="flex justify-center">
                    <Badge className="h-5 sm:h-6 md:h-7 px-2 sm:px-2.5 md:px-3 text-[10px] sm:text-xs md:text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                      Step {index + 1} of {steps.length}
                    </Badge>
                  </div>
                  {/* Title and description */}
                  <div className="text-center">
                    <h4 className="font-semibold text-sm sm:text-base mb-0.5 sm:mb-1">{step.title}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex justify-center py-1 sm:py-1.5 md:py-2" aria-hidden="true">
                    <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-primary/30 rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop: Horizontal Layout */}
          <div className="hidden md:grid md:grid-cols-3 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="flex flex-col items-center gap-4 p-5 rounded-xl border bg-gradient-to-b from-card to-card/50 hover:shadow-lg transition-all hover:-translate-y-1 group h-full">
                  {/* Icon at top */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                    <div className="text-white">
                      {step.icon}
                    </div>
                  </div>
                  {/* Badge */}
                  <Badge className="h-7 px-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white group-hover:scale-105 transition-transform">
                    Step {index + 1}
                  </Badge>
                  {/* Title and description */}
                  <div className="text-center space-y-2 flex-1">
                    <h4 className="font-semibold text-base leading-tight">{step.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute -right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 z-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <Separator />

      <CardFooter className="flex justify-center pt-4 sm:pt-6 px-2.5 xs:px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
        <Button
          size="lg"
          className="w-full md:w-auto shadow-lg hover:shadow-xl transition-shadow h-10 sm:h-11 md:h-12 text-sm sm:text-base px-3 xs:px-4 sm:px-6"
          onClick={() => setShowUploadModal(true)}
          aria-label="Open receipt submission form for reimbursement"
        >
          <Upload className="h-4 w-4 mr-1.5 sm:mr-2" aria-hidden="true" />
          <span className="whitespace-nowrap">Submit Receipt for Reimbursement</span>
        </Button>
      </CardFooter>

      <ReceiptUploadModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        giftingBalance={giftingBalance}
      />
    </Card>
  );
}
