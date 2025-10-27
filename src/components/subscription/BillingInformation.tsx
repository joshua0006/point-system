import { Shield, CreditCard, Zap } from '@/lib/icons';

export function BillingInformation() {
  return (
    <>
      {/* Billing Information */}
      <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
        <h4 className="font-semibold text-primary mb-2">💡 Billing Details</h4>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>• <strong>Secure Checkout:</strong> All payments processed through Stripe's secure checkout</p>
          <p>• <strong>No Stored Cards:</strong> We don't store your payment information</p>
          <p>• <strong>Credit rollover:</strong> Unused credits never expire, even after cancellation</p>
          <p>• <strong>Cancellation:</strong> Cancel anytime, keep all unused credits forever</p>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="flex items-center justify-center gap-6 py-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4 text-success" />
          SSL Secured
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CreditCard className="h-4 w-4 text-primary" />
          PCI Compliant
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Zap className="h-4 w-4 text-warning" />
          Instant Processing
        </div>
      </div>
    </>
  );
}