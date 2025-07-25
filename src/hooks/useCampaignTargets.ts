import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Users, User, Target, Phone, DollarSign } from "lucide-react";

// Icon mapping for custom audiences
const ICON_MAP: Record<string, any> = {
  'Users': Users,
  'User': User, 
  'Shield': Shield,
  'Target': Target,
  'Phone': Phone,
  'DollarSign': DollarSign
};

export const useCampaignTargets = () => {
  const { toast } = useToast();
  const [campaignTargets, setCampaignTargets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCampaignTargets = async () => {
    try {
      setLoading(true);
      // Load all campaign templates regardless of campaign_angle
      const { data, error } = await supabase
        .from('campaign_templates')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      
      // Group templates by target_audience and create target objects
      const audienceGroups = data.reduce((groups, template) => {
        const audience = template.target_audience;
        if (!groups[audience]) {
          groups[audience] = [];
        }
        groups[audience].push(template);
        return groups;
      }, {} as Record<string, any[]>);

      // Create target audience objects from grouped templates
      const targets = Object.entries(audienceGroups).map(([audienceName, templates]) => {
        // Get predefined styles for known audiences
        const getAudienceConfig = (name: string) => {
          const lowerName = name.toLowerCase();
          if (lowerName.includes('nsf')) {
            return {
              icon: Shield,
              bgColor: 'bg-green-500/10',
              iconColor: 'text-green-600',
              budgetRange: { min: 300, max: 2000, recommended: 800 }
            };
          } else if (lowerName.includes('senior')) {
            return {
              icon: Users,
              bgColor: 'bg-purple-500/10',
              iconColor: 'text-purple-600',
              budgetRange: { min: 200, max: 1500, recommended: 600 }
            };
          } else if (lowerName.includes('general')) {
            return {
              icon: User,
              bgColor: 'bg-blue-500/10',
              iconColor: 'text-blue-600',
              budgetRange: { min: 250, max: 1800, recommended: 700 }
            };
          }
          // Default for custom audiences
          return {
            icon: Users,
            bgColor: 'bg-gray-500/10',
            iconColor: 'text-gray-600',
            budgetRange: { min: 200, max: 1500, recommended: 500 }
          };
        };

        // Collect all campaign types from templates in this group
        const allCampaignTypes = new Set<string>();
        templates.forEach(template => {
          const config = template.template_config as any;
          if (config?.campaignTypes) {
            config.campaignTypes.forEach((type: string) => allCampaignTypes.add(type));
          }
        });

        // Use the first template's data as base, but override with audience-specific config
        const firstTemplate = templates[0];
        const config = firstTemplate.template_config as any;
        const audienceConfig = getAudienceConfig(audienceName);
        
        // For custom audiences, prefer saved config; for predefined, use default styling
        const isCustom = firstTemplate.campaign_angle === 'custom';
        
        // Safely resolve icon for custom audiences
        const resolveIcon = (iconName: string | undefined) => {
          if (!iconName) return audienceConfig.icon;
          return ICON_MAP[iconName] || audienceConfig.icon;
        };
        
        return {
          id: firstTemplate.id, // Use first template's ID as representative
          name: audienceName,
          description: firstTemplate.description || `Campaign targeting ${audienceName}`,
          icon: isCustom ? resolveIcon(config?.icon) : audienceConfig.icon,
          bgColor: isCustom ? (config?.bgColor || audienceConfig.bgColor) : audienceConfig.bgColor,
          iconColor: isCustom ? (config?.iconColor || audienceConfig.iconColor) : audienceConfig.iconColor,
          budgetRange: isCustom ? (config?.budgetRange || audienceConfig.budgetRange) : audienceConfig.budgetRange,
          campaignTypes: Array.from(allCampaignTypes),
          isSeeded: !isCustom, // Mark predefined audiences
          templateIds: templates.map(t => t.id) // Store all template IDs for this audience
        };
      });
      
      setCampaignTargets(targets);
    } catch (error) {
      console.error('Error loading campaign templates:', error);
      toast({
        title: "Error loading campaign templates",
        description: "Failed to load campaign data from database.",
        variant: "destructive",
      });
      
      // Fallback to minimal default if database fails
      setCampaignTargets([
        {
          id: 'fallback-general',
          name: 'General Public',
          description: 'General public seeking financial services',
          icon: Users,
          bgColor: 'bg-blue-500/10',
          iconColor: 'text-blue-600',
          budgetRange: { min: 200, max: 1500, recommended: 500 },
          campaignTypes: ['Facebook Lead Ads'],
          isSeeded: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaignTargets();
  }, []);

  return {
    campaignTargets,
    setCampaignTargets,
    loading,
    refreshTargets: loadCampaignTargets
  };
};