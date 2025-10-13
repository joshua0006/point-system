import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Heart, Shield, Zap, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ExpressTemplate {
  id: string;
  name: string;
  description: string;
  target_audience: string;
  campaign_angle: string;
  template_config: {
    budget: number;
    duration_days: number;
    expected_leads: number;
    cost_per_lead: number;
  };
}

const AUDIENCE_DISPLAY = {
  nsf: { name: 'NSF Personnel', icon: Shield, color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
  general: { name: 'General Public', icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' },
  seniors: { name: 'Seniors 55+', icon: Users, color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200' }
};

interface ExpressCampaignTemplatesProps {
  onSelectTemplate: (template: ExpressTemplate) => void;
  userBalance: number;
}

export const ExpressCampaignTemplates = ({ onSelectTemplate, userBalance }: ExpressCampaignTemplatesProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templates, setTemplates] = useState<ExpressTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_templates')
        .select('*')
        .eq('is_active', true)
        .order('target_audience, campaign_angle');

      if (error) throw error;
      setTemplates((data || []) as unknown as ExpressTemplate[]);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLaunch = (template: ExpressTemplate) => {
    setSelectedTemplate(template.id);
    onSelectTemplate(template);
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-accent" />
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
          {templates.map((template) => {
            const audienceInfo = AUDIENCE_DISPLAY[template.target_audience as keyof typeof AUDIENCE_DISPLAY];
            const Icon = audienceInfo?.icon || Shield;
            const canAfford = (userBalance - template.template_config.budget) >= -1000;
            
            return (
              <Card 
                key={template.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${audienceInfo?.bgColor} ${
                  selectedTemplate === template.id ? 'ring-2 ring-primary' : ''
                } ${!canAfford ? 'opacity-60' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${audienceInfo?.color}`} />
                      <h3 className="font-semibold text-sm">{template.name}</h3>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {template.template_config.duration_days} days
                    </Badge>
                  </div>
                  
                  <div className="mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {audienceInfo?.name}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {template.description}
                  </p>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs mb-4">
                    <div className="text-center">
                      <div className="font-semibold">{template.template_config.expected_leads}</div>
                      <div className="text-muted-foreground">Leads</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">${template.template_config.cost_per_lead}</div>
                      <div className="text-muted-foreground">Per Lead</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{template.template_config.budget}p</div>
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
                      'Balance Limit Exceeded'
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