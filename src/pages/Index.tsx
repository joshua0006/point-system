import { useEffect } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FocusIndicator } from '@/components/a11y/FocusIndicator';
import { Link } from 'react-router-dom';
import { Megaphone, Gift, BarChart3, Target, Phone, Headphones, Sparkles, Heart, TrendingUp, ChevronRight } from '@/lib/icons';
import { useChunkPrefetch } from '@/hooks/useChunkPrefetch';

const Index = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Prefetch high-traffic pages for instant navigation
  useChunkPrefetch({
    imports: [
      () => import('@/pages/Campaigns'),
      () => import('@/pages/Gifting'),
      () => import('@/pages/Marketplace'),
      () => import('@/pages/UserDashboard'),
    ],
    priority: 'high',
    delay: 1500,
  });

  return (
    <SidebarLayout title="Dashboard" description="Welcome to your AgentHub dashboard">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* Skip to content link for accessibility - WCAG 2.1 SC 2.4.1 */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all"
        >
          Skip to main content
        </a>

        {/* Hero Section - WCAG 2.1 SC 1.3.1, 2.4.6 */}
        <section
          className="relative overflow-hidden rounded-lg bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20"
          aria-labelledby="hero-heading"
          role="region"
          aria-label="Welcome banner"
        >
          <div className="p-4 sm:p-6 lg:p-8 xl:p-10">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
              <div className="space-y-3 min-w-0 sm:flex-1">
                <h1
                  id="hero-heading"
                  className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground leading-tight"
                  tabIndex={-1}
                >
                  Welcome to AgentHub
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-full sm:max-w-2xl">
                  A modern platform combining marketing campaign management with client relationship gifting to help your business manage outreach and strengthen connections.
                </p>
              </div>
              <div className="flex gap-1.5 sm:gap-2 flex-wrap items-center justify-start sm:justify-end" role="list" aria-label="Platform features">
                <Badge variant="secondary" className="text-xs sm:text-sm px-2 py-0.5 sm:px-3 sm:py-1" role="listitem">
                  <div className="bg-primary text-white rounded-md p-1 sm:p-1.5 shadow-sm mr-1 sm:mr-1.5">
                    <Megaphone className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
                  </div>
                  <span>Campaigns</span>
                </Badge>
                <Badge variant="secondary" className="text-xs sm:text-sm px-2 py-0.5 sm:px-3 sm:py-1" role="listitem">
                  <div className="bg-success text-white rounded-md p-1 sm:p-1.5 shadow-sm mr-1 sm:mr-1.5">
                    <Gift className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
                  </div>
                  <span>Gifting</span>
                </Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content - WCAG 2.1 SC 1.3.1, 2.4.1 */}
        <main id="main-content" className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8" role="main" aria-label="Dashboard features">
          {/* Campaigns Feature Card - WCAG 2.1 SC 2.4.2, 2.5.5 */}
          <article
            className="group"
            aria-labelledby="campaigns-heading"
            aria-describedby="campaigns-description"
          >
            <Card className="h-full hover:shadow-lg transition-all duration-300 border-primary/20 hover:border-primary/40 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
              <CardHeader className="space-y-4 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 sm:w-14 sm:h-14 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:bg-primary/90 group-hover:shadow-lg transition-all"
                      aria-hidden="true"
                    >
                      <Megaphone className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle id="campaigns-heading" className="text-xl sm:text-2xl">
                          Campaigns
                        </CardTitle>
                        <Badge variant="outline" className="text-xs" aria-label="Campaign status: Active">
                          <TrendingUp className="w-3 h-3 mr-1" aria-hidden="true" />
                          <span>Active</span>
                        </Badge>
                      </div>
                      <CardDescription id="campaigns-description" className="text-sm sm:text-base mt-1.5">
                        Manage and track your marketing campaigns across multiple channels
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <Separator className="mb-4" />

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide" id="campaign-types-heading">
                    Campaign Types
                  </h3>

                  {/* Campaign Types Navigation - WCAG 2.1 SC 2.4.4, 2.5.5 */}
                  <nav aria-labelledby="campaign-types-heading">
                    <ul className="space-y-3" role="list">
                      {/* Facebook Ads Campaign */}
                      <li>
                        <TooltipProvider>
                          <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                              <Button
                                variant="secondary"
                                size="lg"
                                className="w-full justify-start text-sm sm:text-base h-auto py-3 shadow-sm hover:shadow-md hover:bg-primary/10 active:scale-[0.98] transition-all group/button focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                asChild
                              >
                                <Link
                                  to="/campaigns/facebook-ads"
                                  aria-label="Navigate to Facebook Ads campaigns - Targeted advertising campaigns"
                                >
                                  <div className="flex items-center gap-3 w-full min-h-[44px]">
                                    <Target className="w-5 h-5 flex-shrink-0 text-primary group-hover/button:scale-110 transition-transform" aria-hidden="true" />
                                    <div className="flex-1 text-left">
                                      <div className="font-medium">Facebook Ads</div>
                                      <div className="text-xs text-muted-foreground">Targeted advertising campaigns</div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 flex-shrink-0 text-muted-foreground group-hover/button:translate-x-1 transition-transform" aria-hidden="true" />
                                  </div>
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right" role="tooltip">
                              <p>Create and manage Facebook advertising campaigns</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </li>

                      {/* Cold Calling Campaign */}
                      <li>
                        <TooltipProvider>
                          <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                              <Button
                                variant="secondary"
                                size="lg"
                                className="w-full justify-start text-sm sm:text-base h-auto py-3 shadow-sm hover:shadow-md hover:bg-primary/10 active:scale-[0.98] transition-all group/button focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                asChild
                              >
                                <Link
                                  to="/campaigns/cold-calling"
                                  aria-label="Navigate to Cold Calling campaigns - Outreach and lead generation"
                                >
                                  <div className="flex items-center gap-3 w-full min-h-[44px]">
                                    <Phone className="w-5 h-5 flex-shrink-0 text-primary group-hover/button:scale-110 transition-transform" aria-hidden="true" />
                                    <div className="flex-1 text-left">
                                      <div className="font-medium">Cold Calling</div>
                                      <div className="text-xs text-muted-foreground">Outreach and lead generation</div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 flex-shrink-0 text-muted-foreground group-hover/button:translate-x-1 transition-transform" aria-hidden="true" />
                                  </div>
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right" role="tooltip">
                              <p>Manage cold calling outreach campaigns</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </li>

                      {/* VA Support Campaign */}
                      <li>
                        <TooltipProvider>
                          <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                              <Button
                                variant="secondary"
                                size="lg"
                                className="w-full justify-start text-sm sm:text-base h-auto py-3 shadow-sm hover:shadow-md hover:bg-primary/10 active:scale-[0.98] transition-all group/button focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                asChild
                              >
                                <Link
                                  to="/campaigns/va-support"
                                  aria-label="Navigate to Virtual Assistant Support campaigns - Virtual assistant services"
                                >
                                  <div className="flex items-center gap-3 w-full min-h-[44px]">
                                    <Headphones className="w-5 h-5 flex-shrink-0 text-primary group-hover/button:scale-110 transition-transform" aria-hidden="true" />
                                    <div className="flex-1 text-left">
                                      <div className="font-medium">VA Support</div>
                                      <div className="text-xs text-muted-foreground">Virtual assistant services</div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 flex-shrink-0 text-muted-foreground group-hover/button:translate-x-1 transition-transform" aria-hidden="true" />
                                  </div>
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right" role="tooltip">
                              <p>Access virtual assistant support campaigns</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </li>
                    </ul>
                  </nav>
                </div>

                <Separator />

                <Button
                  className="w-full text-sm sm:text-base h-11 sm:h-12 bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  asChild
                >
                  <Link
                    to="/campaigns"
                    aria-label="View all campaigns and analytics dashboard"
                  >
                    <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" aria-hidden="true" />
                    <span>View All Campaigns</span>
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </article>

          {/* Gifting Feature Card - WCAG 2.1 SC 2.4.2, 2.5.5 */}
          <article
            className="group"
            aria-labelledby="gifting-heading"
            aria-describedby="gifting-description"
          >
            <Card className="h-full hover:shadow-lg transition-all duration-300 border-success/20 hover:border-success/40 focus-within:ring-2 focus-within:ring-success focus-within:ring-offset-2">
              <CardHeader className="space-y-4 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 sm:w-14 sm:h-14 bg-success rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:bg-success/90 group-hover:shadow-lg transition-all"
                      aria-hidden="true"
                    >
                      <Gift className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle id="gifting-heading" className="text-xl sm:text-2xl">
                          Gifting
                        </CardTitle>
                        <Badge variant="outline" className="text-xs border-success/40 text-success" aria-label="Premium feature">
                          <Sparkles className="w-3 h-3 mr-1" aria-hidden="true" />
                          <span>Premium</span>
                        </Badge>
                      </div>
                      <CardDescription id="gifting-description" className="text-sm sm:text-base mt-1.5">
                        Send personalized gifts to strengthen client relationships
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <Separator className="mb-4" />

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide" id="gift-benefits-heading">
                    Gift Benefits
                  </h3>

                  <ul className="space-y-3 bg-success/5 rounded-lg p-4 border border-success/10" role="list" aria-labelledby="gift-benefits-heading">
                    <li className="flex items-start gap-3">
                      <Heart className="w-5 h-5 text-success flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <p className="font-medium text-sm sm:text-base">Build Stronger Relationships</p>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          Show appreciation with thoughtful, personalized gifts
                        </p>
                      </div>
                    </li>

                    <li role="presentation">
                      <Separator className="bg-success/10" />
                    </li>

                    <li className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-success flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <p className="font-medium text-sm sm:text-base">Curated Gift Selection</p>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          Choose from a wide range of premium gift options
                        </p>
                      </div>
                    </li>

                    <li role="presentation">
                      <Separator className="bg-success/10" />
                    </li>

                    <li className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-success flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <p className="font-medium text-sm sm:text-base">Track Impact</p>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          Monitor gift delivery and client engagement
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>

                <Separator />

                <TooltipProvider>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Button
                        className="w-full text-sm sm:text-base h-11 sm:h-12 bg-success hover:bg-success/90 shadow-md hover:shadow-lg transition-all focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2"
                        asChild
                      >
                        <Link
                          to="/gifting"
                          aria-label="Navigate to gifting page to explore and send personalized gifts to clients"
                        >
                          <Gift className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" aria-hidden="true" />
                          <span>Explore Gifts</span>
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent role="tooltip">
                      <p>Browse and send gifts to your clients</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardContent>
            </Card>
          </article>
        </main>
      </div>
    </SidebarLayout>
  );
};

export default Index;
