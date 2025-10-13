import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles, ArrowRight, Home } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ResponsiveContainer } from "@/components/ui/mobile-responsive";

const ThankYou = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const [showConfetti, setShowConfetti] = useState(true);

  // Get subscription details from URL params
  const planName = searchParams.get('plan_name') || 'Pro Plan';
  const credits = searchParams.get('credits') || 'subscription';

  useEffect(() => {
    // Hide confetti after 3 seconds
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SidebarLayout
      title="Purchase Successful"
      description="Thank you for your subscription"
    >
      <ResponsiveContainer>
        <div className="min-h-[80vh] flex items-center justify-center py-8 sm:py-12">
          <div className="w-full max-w-2xl mx-auto px-4">
            {/* Success Icon with Animation */}
            <div className="text-center mb-8">
              <div className="relative inline-block">
                <CheckCircle2
                  className={`w-20 h-20 sm:w-24 sm:h-24 text-green-500 mx-auto mb-4 ${
                    showConfetti ? 'animate-bounce' : ''
                  }`}
                />
                {showConfetti && (
                  <Sparkles className="w-6 h-6 text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                Thank You! 🎉
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground">
                Your subscription is now active
              </p>
            </div>

            {/* Subscription Details Card */}
            <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">
                  Subscription Confirmed
                </CardTitle>
                <CardDescription>
                  You now have access to all the benefits of your plan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-border/50">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-semibold text-foreground">{planName}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border/50">
                  <span className="text-muted-foreground">Monthly Credits</span>
                  <span className="font-semibold text-foreground">{credits}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-muted-foreground">Billing Cycle</span>
                  <span className="font-semibold text-foreground">1st of each month</span>
                </div>
              </CardContent>
            </Card>

            {/* What's Next Section */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">What's Next?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Your credits have been added to your account
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Explore the marketplace to use your credits
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Your billing will automatically renew on the 1st of each month
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-4`}>
              <Button
                onClick={() => navigate('/dashboard')}
                className="flex-1 bg-primary hover:bg-primary/90"
                size={isMobile ? "default" : "lg"}
              >
                <Home className="w-4 h-4 mr-2" />
                View Dashboard
              </Button>
              <Button
                onClick={() => navigate('/marketplace')}
                variant="outline"
                className="flex-1 border-primary/20 hover:bg-primary/5"
                size={isMobile ? "default" : "lg"}
              >
                Explore Marketplace
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Support Message */}
            <p className="text-center text-sm text-muted-foreground mt-8">
              Questions about your subscription?{" "}
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
