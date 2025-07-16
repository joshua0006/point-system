import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Heart, Shield, Zap, Clock } from "lucide-react";

interface ExpressTemplate {
  id: string;
  name: string;
  description: string;
  targetAudience: string;
  budget: number;
  duration: string;
  expectedLeads: number;
  costPerLead: number;
  icon: any;
  color: string;
  bgColor: string;
}

const EXPRESS_TEMPLATES: ExpressTemplate[] = [
  {
    id: 'quick-nsf',
    name: 'NSF Quick Start',
    description: 'Ready-to-launch campaign targeting NSF personnel with financial planning',
    targetAudience: 'NSF Personnel',
    budget: 500,
    duration: '7 days',
    expectedLeads: 25,
    costPerLead: 20,
    icon: Shield,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200'
  },
  {
    id: 'quick-mothers',
    name: 'Family Protection Express',
    description: 'High-converting campaign for mothers seeking family protection',
    targetAudience: 'Working Mothers',
    budget: 750,
    duration: '10 days',
    expectedLeads: 35,
    costPerLead: 21.5,
    icon: Heart,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 border-pink-200'
  },
  {
    id: 'quick-general',
    name: 'Retirement Planning Booster',
    description: 'Proven campaign template for general retirement planning services',
    targetAudience: 'General Public',
    budget: 600,
    duration: '14 days',
    expectedLeads: 40,
    costPerLead: 15,
    icon: TrendingUp,
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200'
  },
  {
    id: 'quick-seniors',
    name: 'Legacy Planning Express',
    description: 'Estate planning campaign optimized for seniors and pre-retirees',
    targetAudience: 'Seniors 55+',
    budget: 800,
    duration: '14 days',
    expectedLeads: 30,
    costPerLead: 26.7,
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200'
  }
];

interface ExpressCampaignTemplatesProps {
  onSelectTemplate: (template: ExpressTemplate) => void;
  userBalance: number;
}

export const ExpressCampaignTemplates = ({ onSelectTemplate, userBalance }: ExpressCampaignTemplatesProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleQuickLaunch = (template: ExpressTemplate) => {
    setSelectedTemplate(template.id);
    onSelectTemplate(template);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          <CardTitle className="text-lg">Quick Start Templates</CardTitle>
          <Badge variant="secondary" className="ml-auto">
            <Clock className="h-3 w-3 mr-1" />
            Launch in 30 seconds
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Pre-optimized campaigns ready to launch instantly. Based on our highest-performing ads.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {EXPRESS_TEMPLATES.map((template) => {
            const Icon = template.icon;
            const canAfford = userBalance >= template.budget;
            
            return (
              <Card 
                key={template.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${template.bgColor} ${
                  selectedTemplate === template.id ? 'ring-2 ring-primary' : ''
                } ${!canAfford ? 'opacity-60' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${template.color}`} />
                      <h3 className="font-semibold text-sm">{template.name}</h3>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {template.duration}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {template.description}
                  </p>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs mb-4">
                    <div className="text-center">
                      <div className="font-semibold">{template.expectedLeads}</div>
                      <div className="text-muted-foreground">Leads</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">${template.costPerLead}</div>
                      <div className="text-muted-foreground">Per Lead</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{template.budget}p</div>
                      <div className="text-muted-foreground">Budget</div>
                    </div>
                  </div>
                  
                  <Button 
                    size="sm" 
                    className="w-full"
                    disabled={!canAfford}
                    onClick={() => handleQuickLaunch(template)}
                  >
                    {canAfford ? (
                      <>
                        <Zap className="h-3 w-3 mr-1" />
                        Quick Launch
                      </>
                    ) : (
                      'Insufficient Balance'
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Templates are based on our top-performing campaigns with 3.5x higher conversion rates
        </div>
      </CardContent>
    </Card>
  );
};