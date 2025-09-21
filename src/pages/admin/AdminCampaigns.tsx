import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminPageContainer } from "@/components/admin/common/AdminPageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Edit3, Monitor, ArrowRight } from "lucide-react";

const AdminCampaigns = React.memo(function AdminCampaigns() {
  const navigate = useNavigate();

  const campaignSections = [
    {
      id: 'targets',
      title: 'Target Management',
      description: 'Manage target audiences and campaign templates',
      icon: Settings,
      path: '/admin-dashboard/campaigns/targets',
      color: 'bg-blue-500/10 text-blue-600'
    },
    {
      id: 'scripts',
      title: 'Campaign Scripts',
      description: 'Manage calling, texting, and reminder scripts',
      icon: Edit3,
      path: '/admin-dashboard/campaigns/scripts', 
      color: 'bg-green-500/10 text-green-600'
    },
    {
      id: 'monitor',
      title: 'Campaign Monitor',
      description: 'Monitor all user campaigns and performance',
      icon: Monitor,
      path: '/admin-dashboard/campaigns/monitor',
      color: 'bg-purple-500/10 text-purple-600'
    }
  ];

  const handleSectionClick = (path: string) => {
    navigate(path);
  };

  return (
    <AdminPageContainer 
      title="Campaign Management" 
      description="Manage lead generation campaigns and settings"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaignSections.map((section) => {
          const IconComponent = section.icon;
          
          return (
            <Card 
              key={section.id} 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => handleSectionClick(section.path)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg ${section.color}`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardTitle className="text-lg">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Campaign Management Overview</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </AdminPageContainer>
  );
});

export default AdminCampaigns;