import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GraduationCap, TrendingUp, Shield, Users, Heart, Target, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CampaignTemplate {
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

interface CampaignAngleSelectorProps {
  targetAudience: 'nsf' | 'general' | 'seniors';
  onSelectAngle: (template: CampaignTemplate) => void;
  userBalance: number;
}

const AUDIENCE_INFO = {
  nsf: {
    name: 'NSF Personnel',
    icon: Shield,
    color: 'blue',
    description: 'National Service personnel looking for financial guidance'
  },
  general: {
    name: 'General Public',
    icon: Users,
    color: 'green',
    description: 'Working professionals seeking financial optimization'
  },
  seniors: {
    name: 'Seniors 55+',
    icon: Heart,
    color: 'purple',
    description: 'Pre-retirees and retirees planning their legacy'
  }
};

const ANGLE_ICONS = {
  financial_literacy: GraduationCap,
  early_investment: TrendingUp,
  career_transition: Target,
  retirement_planning: Shield,
  investment_management: TrendingUp,
  tax_planning: Star,
  estate_planning: Heart,
  healthcare_planning: Shield,
  will_writing: Users
};

export const CampaignAngleSelector = ({ targetAudience, onSelectAngle, userBalance }: CampaignAngleSelectorProps) => {
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const audienceInfo = AUDIENCE_INFO[targetAudience];
  const AudienceIcon = audienceInfo.icon;

  useEffect(() => {
    fetchTemplates();
  }, [targetAudience]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_templates')
        .select('*')
        .eq('target_audience', targetAudience)
        .eq('is_active', true)
        .order('created_at');

      if (error) throw error;
      setTemplates((data || []) as unknown as CampaignTemplate[]);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template: CampaignTemplate) => {
    setSelectedTemplate(template.id);
    onSelectAngle(template);
  };

  const getAngleDisplayName = (angle: string) => {
    return angle.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <AudienceIcon className={`h-6 w-6 text-${audienceInfo.color}-600`} />
          <div>
            <CardTitle className="text-xl">Choose Campaign Angle</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {audienceInfo.description}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          {templates.map((template) => {
            const IconComponent = ANGLE_ICONS[template.campaign_angle as keyof typeof ANGLE_ICONS] || Target;
            const canAfford = (userBalance - template.template_config.budget) >= -2000;
            const isSelected = selectedTemplate === template.id;
            
            return (
              <Card 
                key={template.id}
                className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                  isSelected 
                    ? 'border-primary bg-primary/5' 
                    : canAfford 
                      ? 'border-muted hover:border-primary/50' 
                      : 'border-muted opacity-60'
                }`}
                onClick={() => canAfford && handleSelectTemplate(template)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-${audienceInfo.color}-50`}>
                        <IconComponent className={`h-5 w-5 text-${audienceInfo.color}-600`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base">{template.name}</h3>
                        <p className="text-sm text-muted-foreground">{getAngleDisplayName(template.campaign_angle)}</p>
                      </div>
                    </div>
                    <Badge variant={canAfford ? "default" : "secondary"}>
                      {template.template_config.duration_days} days
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {template.description}
                  </p>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                    <div className="text-center">
                      <div className="font-semibold text-lg">{template.template_config.expected_leads}</div>
                      <div className="text-muted-foreground">Expected Leads</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-lg">${template.template_config.cost_per_lead}</div>
                      <div className="text-muted-foreground">Cost per Lead</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-lg">{template.template_config.budget}p</div>
                      <div className="text-muted-foreground">Total Budget</div>
                    </div>
                  </div>
                  
                  {canAfford ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Budget vs Your Balance</span>
                        <span>{template.template_config.budget}p / {userBalance}p</span>
                      </div>
                      <Progress 
                        value={(template.template_config.budget / userBalance) * 100} 
                        className="h-2"
                      />
                    </div>
                  ) : (
                     <div className="text-center py-2">
                        <p className="text-sm text-muted-foreground">
                          Balance limit exceeded (would bring balance to {userBalance - template.template_config.budget} points, minimum is -2000)
                        </p>
                     </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="text-xs text-muted-foreground text-center pt-4 border-t">
          All templates include multiple ad variants and performance optimization based on historical data
        </div>
      </CardContent>
    </Card>
  );
};