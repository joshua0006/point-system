import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Clock, Gift, AlertTriangle, Star, Eye, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AdVariant {
  id: string;
  variant_name: string;
  ad_type: string;
  ad_content: {
    title: string;
    description: string;
    offer: string;
    ad_copy: string;
    cta: string;
  };
  performance_metrics: {
    ctr: number;
    cpm: number;
    conversions: number;
  };
}

interface AdVariantSelectorProps {
  templateId: string;
  onSelectVariants: (variants: AdVariant[]) => void;
}

const AD_TYPE_INFO = {
  educational: {
    name: 'Educational',
    icon: BookOpen,
    color: 'blue',
    description: 'Focus on teaching and informing prospects'
  },
  urgency: {
    name: 'Urgency',
    icon: Clock,
    color: 'red',
    description: 'Create urgency with time-sensitive offers'
  },
  benefit: {
    name: 'Benefit-Focused',
    icon: Gift,
    color: 'green',
    description: 'Highlight clear value propositions'
  },
  problem_solution: {
    name: 'Problem-Solution',
    icon: AlertTriangle,
    color: 'orange',
    description: 'Address pain points directly'
  }
};

export const AdVariantSelector = ({ templateId, onSelectVariants }: AdVariantSelectorProps) => {
  const [variants, setVariants] = useState<AdVariant[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<AdVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewVariant, setPreviewVariant] = useState<AdVariant | null>(null);

  useEffect(() => {
    fetchVariants();
  }, [templateId]);

  const fetchVariants = async () => {
    try {
      const { data, error } = await supabase
        .from('ad_variants')
        .select('*')
        .eq('template_id', templateId)
        .eq('is_active', true)
        .order('ad_type');

      if (error) throw error;
      setVariants((data || []) as unknown as AdVariant[]);
    } catch (error) {
      console.error('Error fetching ad variants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVariantToggle = (variant: AdVariant) => {
    const isSelected = selectedVariants.find(v => v.id === variant.id);
    let newSelection;
    
    if (isSelected) {
      newSelection = selectedVariants.filter(v => v.id !== variant.id);
    } else {
      newSelection = [...selectedVariants, variant];
    }
    
    setSelectedVariants(newSelection);
    onSelectVariants(newSelection);
  };

  const groupedVariants = variants.reduce((acc, variant) => {
    if (!acc[variant.ad_type]) {
      acc[variant.ad_type] = [];
    }
    acc[variant.ad_type].push(variant);
    return acc;
  }, {} as Record<string, AdVariant[]>);

  const getPerformanceColor = (metric: string, value: number) => {
    if (metric === 'ctr') {
      return value >= 4 ? 'text-green-600' : value >= 3 ? 'text-yellow-600' : 'text-red-600';
    }
    if (metric === 'conversions') {
      return value >= 30 ? 'text-green-600' : value >= 20 ? 'text-yellow-600' : 'text-red-600';
    }
    return 'text-muted-foreground';
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Select Ad Variants
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose different ad types to test what resonates best with your audience. 
            We recommend selecting 2-3 variants for optimal A/B testing.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={Object.keys(groupedVariants)[0]} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {Object.keys(groupedVariants).map((adType) => {
                const typeInfo = AD_TYPE_INFO[adType as keyof typeof AD_TYPE_INFO];
                const Icon = typeInfo?.icon || BookOpen;
                return (
                  <TabsTrigger key={adType} value={adType} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {typeInfo?.name || adType}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {Object.entries(groupedVariants).map(([adType, typeVariants]) => {
              const typeInfo = AD_TYPE_INFO[adType as keyof typeof AD_TYPE_INFO];
              const Icon = typeInfo?.icon || BookOpen;
              
              return (
                <TabsContent key={adType} value={adType} className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Icon className={`h-5 w-5 text-${typeInfo?.color}-600`} />
                    <div>
                      <h3 className="font-semibold">{typeInfo?.name} Ads</h3>
                      <p className="text-sm text-muted-foreground">{typeInfo?.description}</p>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {typeVariants.map((variant) => {
                      const isSelected = selectedVariants.find(v => v.id === variant.id);
                      
                      return (
                        <Card 
                          key={variant.id}
                          className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                            isSelected ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold mb-1">{variant.variant_name}</h4>
                                <p className="text-sm text-muted-foreground">{variant.ad_content.description}</p>
                              </div>
                              <Button
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleVariantToggle(variant)}
                              >
                                {isSelected ? 'Selected' : 'Select'}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      {selectedVariants.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-primary">
                  {selectedVariants.length} Variant{selectedVariants.length > 1 ? 's' : ''} Selected
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your campaign will run A/B tests across these variants automatically
                </p>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  Optimized for performance
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Modal would go here */}
      {previewVariant && (
        <Card className="fixed inset-4 z-50 bg-background border shadow-lg overflow-auto">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle>Ad Preview: {previewVariant.variant_name}</CardTitle>
              <Button variant="outline" onClick={() => setPreviewVariant(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-md mx-auto border rounded-lg p-4 bg-muted/20">
              <h3 className="text-lg font-bold mb-2">{previewVariant.ad_content.title}</h3>
              <p className="text-muted-foreground mb-4">{previewVariant.ad_content.description}</p>
              
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-3 rounded-lg mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-primary text-sm">Special Offer</span>
                </div>
                <p className="text-sm font-medium">{previewVariant.ad_content.offer}</p>
              </div>
              
              <div className="bg-background p-3 rounded border mb-4">
                <div className="text-sm whitespace-pre-line">{previewVariant.ad_content.ad_copy}</div>
              </div>
              
              <Button size="sm" className="w-full">
                {previewVariant.ad_content.cta}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};