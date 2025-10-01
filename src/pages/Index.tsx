
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Megaphone, Bot, Gift, BarChart3, Target, Phone, Headphones, Sparkles, PenTool } from 'lucide-react';

const Index = () => {
  console.log('Index page rendering');
  
  return (
    <SidebarLayout title="Dashboard" description="Welcome to your AgentHub dashboard">
      <div className="p-6 space-y-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to AgentHub</h1>
          <p className="text-muted-foreground">
            Manage your campaigns, access AI tools, and explore gifting options.
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Campaigns Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Campaigns</CardTitle>
                  <p className="text-sm text-muted-foreground">Manage your marketing campaigns</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link to="/campaigns/facebook-ads">
                  <Target className="w-4 h-4 mr-2" />
                  Facebook Ads
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link to="/campaigns/cold-calling">
                  <Phone className="w-4 h-4 mr-2" />
                  Cold Calling
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link to="/campaigns/va-support">
                  <Headphones className="w-4 h-4 mr-2" />
                  VA Support
                </Link>
              </Button>
              <Button className="w-full mt-2" asChild>
                <Link to="/campaigns">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View All Campaigns
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* AI Tools Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-lg">AI Tools</CardTitle>
                  <p className="text-sm text-muted-foreground">Powered by artificial intelligence</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link to="/ai-assistant">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Assistant
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link to="/ad-copy-generator">
                  <PenTool className="w-4 h-4 mr-2" />
                  Ad Copy Generator
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Gifting Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <Gift className="w-5 h-5 text-success" />
                </div>
                <div>
                  <CardTitle className="text-lg">Gifting</CardTitle>
                  <p className="text-sm text-muted-foreground">Send gifts to your clients</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild>
                <Link to="/gifting">
                  <Gift className="w-4 h-4 mr-2" />
                  Explore Gifts
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
