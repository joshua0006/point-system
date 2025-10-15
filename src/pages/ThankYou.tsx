import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles, ArrowRight, Home, Wallet, Unlock, Headphones } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ResponsiveContainer } from "@/components/ui/mobile-responsive";
import { useAuth } from "@/contexts/AuthContext";

type PaymentType = 'subscription' | 'topup' | 'unlock' | 'va_support';

const ThankYou = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const [showConfetti, setShowConfetti] = useState(true);
  const { user, refreshProfile } = useAuth();

  // Get payment type and details from URL params
  const paymentType = (searchParams.get('type') || 'subscription') as PaymentType;
  const planName = searchParams.get('plan_name') || 'Pro Plan';
  const credits = searchParams.get('credits') || 'subscription';
  const amount = searchParams.get('amount');
  const unlocked = searchParams.get('unlocked');
  const plan = searchParams.get('plan');

  // Memoize payment type configuration for performance
  const paymentConfig = useMemo(() => {
    switch (paymentType) {
      case 'topup':
        return {
          title: 'Credits Added Successfully! 🎉',
          subtitle: 'Your credits are now available',
          icon: Wallet,
          details: [
            { label: 'Amount Purchased', value: `${amount} FXC` },
            { label: 'Payment Method', value: 'Credit Card' },
            { label: 'Status', value: 'Completed' }
          ],
          nextSteps: [
            'Your credits have been added to your account',
            'Use your credits for services in the marketplace',
            'Track your spending in the transaction history'
          ],
          primaryAction: { label: 'View Dashboard', path: '/dashboard' },
          secondaryAction: { label: 'Explore Marketplace', path: '/marketplace' }
        };

      case 'unlock':
        return {
          title: 'Awarded Credits Unlocked! 🔓',
          subtitle: 'Your awarded credits are now usable',
          icon: Unlock,
          details: [
            { label: 'Payment Amount', value: `$${amount}` },
            { label: 'Credits Unlocked', value: `${unlocked} FXC` },
            { label: 'Unlock Ratio', value: '2:1' }
          ],
          nextSteps: [
            'Your awarded credits have been unlocked',
            'Payment credits have also been added to your balance',
            'Start using your credits immediately'
          ],
          primaryAction: { label: 'View Wallet', path: '/dashboard' },
          secondaryAction: { label: 'Browse Services', path: '/marketplace' }
        };

      case 'va_support':
        return {
          title: 'VA Support Activated! 🎯',
          subtitle: 'Your virtual assistant support is now active',
          icon: Headphones,
          details: [
            { label: 'Plan', value: plan || 'VA Support' },
            { label: 'Billing', value: 'Monthly' },
            { label: 'Status', value: 'Active' }
          ],
          nextSteps: [
            'Your VA support subscription is now active',
            'Check your campaigns dashboard for updates',
            'Support team will reach out within 24 hours'
          ],
          primaryAction: { label: 'View Campaigns', path: '/campaigns' },
          secondaryAction: { label: 'Go to Dashboard', path: '/dashboard' }
        };

      default: // subscription
        return {
          title: 'Thank You! 🎉',
          subtitle: 'Your subscription is now active',
          icon: CheckCircle2,
          details: [
            { label: 'Plan', value: planName },
            { label: 'Monthly Credits', value: credits },
            { label: 'Billing Cycle', value: '1st of each month' }
          ],
          nextSteps: [
            'Your credits have been added to your account',
            'Explore the marketplace to use your credits',
            'Your billing will automatically renew on the 1st of each month'
          ],
          primaryAction: { label: 'View Dashboard', path: '/dashboard' },
          secondaryAction: { label: 'Explore Marketplace', path: '/marketplace' }
        };
    }
  }, [paymentType, planName, credits, amount, unlocked, plan]);

  useEffect(() => {
    // Hide confetti after 3 seconds
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Refresh profile on mount to ensure balance is up-to-date after payment
  useEffect(() => {
    if (user) {
      // Refresh profile to get latest balance after payment
      refreshProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // refreshProfile is now memoized in AuthContext, but we only want this to run when user changes

  // Gentle auth check: Give session time to restore after Stripe redirect
  // If user is not authenticated after 5 seconds, redirect to auth with return URL
  useEffect(() => {
    if (!user) {
      const authCheckTimer = setTimeout(() => {
        // Still no user after 5 seconds - likely logged out
        const currentPath = window.location.pathname + window.location.search;
        navigate(`/auth?redirect=${encodeURIComponent(currentPath)}`);
      }, 5000);

      return () => clearTimeout(authCheckTimer);
    }
  }, [user, navigate]);

  const Icon = paymentConfig.icon;

  return (
    <SidebarLayout
      title="Purchase Successful"
      description={paymentConfig.subtitle}
    >
      <ResponsiveContainer>
        <div className="min-h-[80vh] flex items-center justify-center py-8 sm:py-12">
          <div className="w-full max-w-2xl mx-auto px-4">
            {/* Success Icon with Animation */}
            <div className="text-center mb-8">
              <div className="relative inline-block">
                <Icon
                  className={`w-20 h-20 sm:w-24 sm:h-24 text-green-500 mx-auto mb-4 ${
                    showConfetti ? 'animate-bounce' : ''
                  }`}
                />
                {showConfetti && (
                  <Sparkles className="w-6 h-6 text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                {paymentConfig.title}
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground">
                {paymentConfig.subtitle}
              </p>
            </div>

            {/* Payment Details Card */}
            <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">
                  {paymentType === 'subscription' ? 'Subscription Confirmed' : 'Payment Confirmed'}
                </CardTitle>
                <CardDescription>
                  {paymentType === 'subscription'
                    ? 'You now have access to all the benefits of your plan'
                    : 'Your transaction has been processed successfully'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentConfig.details.map((detail, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center py-3 ${
                      index < paymentConfig.details.length - 1 ? 'border-b border-border/50' : ''
                    }`}
                  >
                    <span className="text-muted-foreground">{detail.label}</span>
                    <span className="font-semibold text-foreground">{detail.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* What's Next Section */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">What's Next?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {paymentConfig.nextSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm sm:text-base text-muted-foreground">
                      {step}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-4`}>
              <Button
                onClick={() => navigate(paymentConfig.primaryAction.path)}
                className="flex-1 bg-primary hover:bg-primary/90"
                size={isMobile ? "default" : "lg"}
              >
                <Home className="w-4 h-4 mr-2" />
                {paymentConfig.primaryAction.label}
              </Button>
              <Button
                onClick={() => navigate(paymentConfig.secondaryAction.path)}
                variant="outline"
                className="flex-1 border-primary/20 hover:bg-primary/5"
                size={isMobile ? "default" : "lg"}
              >
                {paymentConfig.secondaryAction.label}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Support Message */}
            <p className="text-center text-sm text-muted-foreground mt-8">
              Questions about your {paymentType === 'subscription' ? 'subscription' : 'payment'}?{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-primary hover:underline"
                onClick={() => navigate('/settings')}
              >
                Visit Settings
              </Button>
            </p>
          </div>
        </div>
      </ResponsiveContainer>
    </SidebarLayout>
  );
};

export default ThankYou;
