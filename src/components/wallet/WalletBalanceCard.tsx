import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Wallet, TrendingUp, Zap, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WalletBalanceCardProps {
  balance: number;
  isMobile?: boolean;
  onTopUpClick: () => void;
  className?: string;
}

export const WalletBalanceCard = React.memo(({
  balance,
  isMobile = false,
  onTopUpClick,
  className
}: WalletBalanceCardProps) => {
  const isNegativeBalance = balance < 0;
  const estimatedCampaigns = balance > 0 ? Math.floor(balance / 100) : 0;

  return (
    <section
      aria-labelledby="wallet-balance-heading"
      className={className}
    >
      <Card
        className={cn(
          "relative overflow-hidden border-2 shadow-lg hover:shadow-xl transition-shadow duration-300",
          isNegativeBalance
            ? "border-destructive/30 bg-destructive/5"
            : "border-primary/20"
        )}
        role="region"
        aria-label="Wallet balance information"
      >
        {/* Background gradient */}
        <div
          className={cn(
            "absolute inset-0 opacity-50",
            isNegativeBalance
              ? "bg-gradient-to-br from-destructive/5 via-destructive/10 to-destructive/5"
              : "bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5"
          )}
          aria-hidden="true"
        />

        <CardHeader className="relative pb-2">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-3 rounded-lg shadow-lg",
                  isNegativeBalance ? "bg-destructive" : "bg-primary"
                )}
                aria-hidden="true"
              >
                {isNegativeBalance ? (
                  <AlertCircle className="h-5 w-5 text-white" />
                ) : (
                  <Wallet className="h-5 w-5 text-white" />
                )}
              </div>
              <h2
                id="wallet-balance-heading"
                className="text-lg font-semibold"
              >
                Wallet Balance
              </h2>
            </div>
            <Button
              onClick={onTopUpClick}
              size={isMobile ? "sm" : "default"}
              className="shadow-md hover:shadow-lg transition-shadow"
              aria-label={`Add points to wallet. Current balance: ${Math.abs(balance).toLocaleString()} ${isNegativeBalance ? 'points owed' : 'points'}`}
            >
              <CreditCard className="mr-2 h-4 w-4" aria-hidden="true" />
              Top Up
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="relative">
          {/* Screen reader announcement for balance */}
          <div
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            {isNegativeBalance
              ? `You owe ${Math.abs(balance).toLocaleString()} points. Please add credits to continue.`
              : `Your wallet balance is ${balance.toLocaleString()} points available for campaigns and services.`}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Main Balance Display */}
            <div>
              <dl className="space-y-2">
                <div>
                  <dt className="sr-only">Current Balance</dt>
                  <dd>
                    <div className={cn(
                      isMobile ? "text-3xl" : "text-4xl",
                      "font-bold mb-2",
                      isNegativeBalance ? "text-destructive" : "text-primary"
                    )}>
                      {isNegativeBalance && (
                        <span className="inline-flex items-center gap-2">
                          <AlertCircle className="h-6 w-6" aria-hidden="true" />
                          -{' '}
                        </span>
                      )}
                      {Math.abs(balance).toLocaleString()}
                      <span className="text-lg ml-2 text-muted-foreground font-normal">
                        points
                      </span>
                    </div>
                  </dd>
                </div>
                <div>
                  <dt className="sr-only">Balance Status</dt>
                  <dd>
                    {isNegativeBalance ? (
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="destructive"
                          className="text-xs"
                          role="status"
                        >
                          Action Required
                        </Badge>
                        <p className="text-sm text-destructive">
                          Add credits to continue
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Available for campaigns and services
                      </p>
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Quick Stats */}
            <div
              className="grid grid-cols-2 gap-4"
              role="complementary"
              aria-label="Quick statistics"
            >
              <div className="p-4 bg-background/50 rounded-lg border border-primary/10">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <TrendingUp className="h-4 w-4" aria-hidden="true" />
                  <span className="text-xs font-medium">Ready to Launch</span>
                </div>
                <dl>
                  <dt className="sr-only">Estimated campaigns available</dt>
                  <dd>
                    <p className="text-lg font-bold" aria-label={`${estimatedCampaigns} estimated campaigns`}>
                      {estimatedCampaigns}
                    </p>
                    <p className="text-xs text-muted-foreground">Est. campaigns</p>
                  </dd>
                </dl>
              </div>

              <div className="p-4 bg-background/50 rounded-lg border border-primary/10">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <Zap className="h-4 w-4" aria-hidden="true" />
                  <span className="text-xs font-medium">Campaign Types</span>
                </div>
                <dl>
                  <dt className="sr-only">Available campaign methods</dt>
                  <dd>
                    <p className="text-lg font-bold" aria-label="3 available campaign types">3</p>
                    <p className="text-xs text-muted-foreground">Available methods</p>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
});

WalletBalanceCard.displayName = 'WalletBalanceCard';
