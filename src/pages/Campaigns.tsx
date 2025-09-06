import React from 'react';
import { Navigation } from '@/components/Navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResponsiveContainer } from '@/components/ui/mobile-responsive';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Target, Phone, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const Campaigns = () => {
  const isMobile = useIsMobile();

  const campaignTypes = [
    {
      type: 'facebook-ads',
      title: 'Facebook Ad Campaigns',
      description: 'Launch targeted Facebook advertising campaigns with proven templates and creatives',
      icon: Target,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
      path: '/campaigns/facebook-ads',
      features: ['Proven ad templates', 'Targeted audiences', 'Creative assets included', 'Performance tracking']
    },
    {
      type: 'cold-calling',
      title: 'Cold Calling Campaigns',
      description: 'Professional cold calling services with trained telemarketers',
      icon: Phone,
      color: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
      path: '/campaigns/cold-calling',
      features: ['Trained professionals', 'Flexible hours', 'Lead qualification', 'CRM integration']
    },
    {
      type: 'va-support',
      title: 'VA Support Campaigns',
      description: 'Virtual assistant support for lead follow-up and appointment setting',
      icon: Users,
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
      path: '/campaigns/va-support',
      features: ['Follow-up automation', 'Appointment setting', 'Lead qualification', 'CRM updates']
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <ResponsiveContainer>
        <div className={isMobile ? "pt-4" : "pt-8"}>
          <div className={isMobile ? "mb-4" : "mb-6 sm:mb-8"}>
            <h1 className={isMobile ? "text-xl font-bold text-foreground mb-2" : "text-2xl sm:text-3xl font-bold text-foreground mb-2"}>
              Lead Generation Campaigns
            </h1>
            <p className={isMobile ? "text-sm text-muted-foreground" : "text-muted-foreground text-sm sm:text-base"}>
              Choose your campaign type to start generating high-quality leads for your business
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
            {campaignTypes.map((campaign) => {
              const Icon = campaign.icon;
              return (
                <Card key={campaign.type} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-3 rounded-lg ${campaign.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg mb-1">{campaign.title}</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          Lead Generation
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {campaign.description}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-foreground">Key Features:</h4>
                      <ul className="space-y-1">
                        {campaign.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <Link to={campaign.path} className="block">
                      <Button className="w-full group-hover:bg-primary/90 transition-colors">
                        Launch {campaign.title.split(' ')[0]} Campaign
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Access Section */}
          <div className="mt-8 p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground mb-1">Need Help Choosing?</h3>
                <p className="text-sm text-muted-foreground">
                  Not sure which campaign type is right for you? Check out our recommendations.
                </p>
              </div>
              <Link to="/lead-gen-campaigns">
                <Button variant="outline" size="sm">
                  View All Campaigns
                  <ArrowRight className="h-3 w-3 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </ResponsiveContainer>
    </div>
  );
};

export default Campaigns;