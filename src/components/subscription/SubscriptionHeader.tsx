import { DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SubscriptionHeaderProps {
  balance: number;
}

export function SubscriptionHeader({ balance }: SubscriptionHeaderProps) {
  return (
    <DialogHeader className="text-center pb-8 border-b border-border/30">
      <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
        Subscription Management
      </DialogTitle>
      <div className="flex items-center justify-center gap-3 mt-4 p-3 rounded-lg bg-muted/30 border border-border/20">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          <span className="text-sm font-medium text-muted-foreground">Current Balance:</span>
        </div>
        <span className="font-bold text-lg text-primary">
          {balance?.toLocaleString() || '0'} flexi-credits
        </span>
      </div>
    </DialogHeader>
  );
}