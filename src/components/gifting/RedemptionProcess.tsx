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

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    icon: <ShoppingBag className="h-6 w-6" />,
    title: "Browse Partner Merchants",
    description: "Explore our trusted gifting partners below and choose the merchant that best fits your gifting needs. Click 'Visit Store' to browse their products."
  },
  {
    icon: <CreditCard className="h-6 w-6" />,
    title: "Make Your Purchase",
    description: "Shop directly on the merchant's website and pay using your preferred payment method. Complete your purchase as you normally would."
  },
  {
    icon: <Receipt className="h-6 w-6" />,
    title: "Save Your Receipt",
    description: "Take a screenshot or save the digital receipt. Ensure it shows: merchant name, purchase amount, date, and items bought."
  },
  {
    icon: <Upload className="h-6 w-6" />,
    title: "Submit for Reimbursement",
    description: "Return to this page and click 'Submit Receipt' below. Upload your receipt and fill in the details. Ensure your gifting credits balance covers the amount."
  },
  {
    icon: <Clock className="h-6 w-6" />,
    title: "Wait for Approval",
    description: "Our team will review your submission within 3-5 business days. You'll receive an email notification once approved or if additional information is needed."
  },
  {
    icon: <CheckCircle2 className="h-6 w-6" />,
    title: "Receive Your Refund",
    description: "Approved amounts will be transferred to your registered bank account within 1-2 business days. You'll receive a confirmation email with transaction details."
  }
];

const tips = [
  "Keep receipts organized by creating a dedicated folder",
  "Ensure receipts are clear and readable before uploading",
  "Contact support if you have questions about eligible purchases"
];

export function RedemptionProcess() {
  const [isOpen, setIsOpen] = useState(true);

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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {steps.map((step, index) => (
                <div 
                  key={index}
                  className="flex gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                      {step.icon}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-primary">Step {index + 1}</span>
                    </div>
                    <h4 className="font-semibold text-sm">{step.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tips Section */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Helpful Tips
              </h4>
              <ul className="space-y-1.5 ml-6">
                {tips.map((tip, index) => (
                  <li key={index} className="text-xs text-muted-foreground list-disc">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Important Policies */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-sm text-primary">Important Information</h4>
              <ul className="space-y-1.5 ml-4 text-xs text-muted-foreground">
                <li>• Reimbursements are subject to available gifting credits balance</li>
                <li>• Only purchases from listed partner merchants are eligible</li>
                <li>• Receipts must be submitted within 30 days of purchase</li>
                <li>• Bank account details must be registered in your profile settings</li>
              </ul>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-2">
              <Button size="lg" className="w-full md:w-auto">
                <Upload className="h-4 w-4 mr-2" />
                Submit Receipt for Reimbursement
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
