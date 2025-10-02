
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Megaphone, Bot, Gift, BarChart3, Target, Phone, Headphones, Sparkles, PenTool } from 'lucide-react';

const Index = () => {
  return (
    <SidebarLayout title="Dashboard" description="Welcome to your AgentHub dashboard">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Welcome to AgentHub</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your campaigns, access AI tools, and explore gifting options.
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Campaigns Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3 sm:pb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Megaphone className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base sm:text-lg">Campaigns</CardTitle>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Manage your marketing campaigns</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              <Button variant="outline" size="sm" className="w-full justify-start text-xs sm:text-sm h-8 sm:h-9" asChild>
                <Link to="/campaigns/facebook-ads">
                  <Target className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Facebook Ads</span>
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-xs sm:text-sm h-8 sm:h-9" asChild>
                <Link to="/campaigns/cold-calling">
                  <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Cold Calling</span>
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-xs sm:text-sm h-8 sm:h-9" asChild>
                <Link to="/campaigns/va-support">
                  <Headphones className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">VA Support</span>
                </Link>
              </Button>
              <Button className="w-full mt-2 text-xs sm:text-sm h-9 sm:h-10" asChild>
                <Link to="/campaigns">
                  <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">View All Campaigns</span>
                </Link>
              </Button>
            </CardContent>
          </Card>


          {/* Gifting Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3 sm:pb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base sm:text-lg">Gifting</CardTitle>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Send gifts to your clients</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full text-xs sm:text-sm h-9 sm:h-10" asChild>
                <Link to="/gifting">
                  <Gift className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Explore Gifts</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </SidebarLayout>
  );
};

export default Index;
