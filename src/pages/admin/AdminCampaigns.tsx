import React, { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AdminPageContainer } from "@/components/admin/common/AdminPageContainer";
import { OptimizedCard, OptimizedCardContent, OptimizedCardHeader } from "@/components/ui/optimized-card";
import { Button } from "@/components/ui/button";
import { Settings, Edit3, Monitor, ArrowRight } from "lucide-react";
import { useRoutePrefetch } from "@/hooks/useRoutePrefetch";

const AdminCampaigns = memo(function AdminCampaigns() {
  const navigate = useNavigate();

  // Prefetch routes for instant navigation
  const campaignRoutes = [
    '/admin-dashboard/campaigns/targets',
    '/admin-dashboard/campaigns/scripts',
    '/admin-dashboard/campaigns/monitor'
  ];
  
  useRoutePrefetch({ routes: campaignRoutes, priority: 'high', delay: 100 });

  const campaignSections = [
    {
      id: 'targets',
      title: 'Target Management',
      description: 'Manage target audiences and campaign templates',
      icon: Settings,
      path: '/admin-dashboard/campaigns/targets',
      color: 'bg-primary/10 text-primary'
    },
    {
      id: 'scripts',
      title: 'Campaign Scripts',
      description: 'Manage calling, texting, and reminder scripts',
      icon: Edit3,
      path: '/admin-dashboard/campaigns/scripts', 
      color: 'bg-secondary/10 text-secondary-foreground'
    },
    {
      id: 'monitor',
      title: 'Campaign Monitor',
      description: 'Monitor all user campaigns and performance',
      icon: Monitor,
      path: '/admin-dashboard/campaigns/monitor',
      color: 'bg-accent/10 text-accent-foreground'
    }
  ];

  const handleSectionClick = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  return (
    <AdminPageContainer 
      title="Campaign Management" 
      description="Manage lead generation campaigns and settings"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaignSections.map((section) => {
          const IconComponent = section.icon;
          
          return (
            <OptimizedCard 
              key={section.id} 
              hoverable
              onClick={() => handleSectionClick(section.path)}
            >
              <OptimizedCardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg ${section.color}`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">{section.title}</h3>
              </OptimizedCardHeader>
              <OptimizedCardContent>
                <p className="text-muted-foreground mb-4">
                  {section.description}
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSectionClick(section.path);
                  }}
                >
                  Open Section
                </Button>
              </OptimizedCardContent>
            </OptimizedCard>
          );
        })}
      </div>

      <OptimizedCard className="mt-8">
        <OptimizedCardHeader>
          <h2 className="text-xl font-semibold">Campaign Management Overview</h2>
        </OptimizedCardHeader>
        <OptimizedCardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Target Management</h3>
              <p className="text-sm text-muted-foreground">
                Configure and manage target audiences for different campaign types. 
                Set budget ranges, campaign types, and audience-specific settings.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Script Management</h3>
              <p className="text-sm text-muted-foreground">
                Create and edit calling scripts, SMS templates, and email templates 
                that are used across all campaign types.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Campaign Monitoring</h3>
              <p className="text-sm text-muted-foreground">
                Monitor active campaigns, track user participation, budgets, and 
                performance metrics across the platform.
              </p>
            </div>
          </div>
        </OptimizedCardContent>
      </OptimizedCard>
    </AdminPageContainer>
  );
});

export default AdminCampaigns;