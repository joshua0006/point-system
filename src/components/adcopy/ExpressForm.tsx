import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ImageGenerator } from './ImageGenerator';

interface ExpressFormData {
  product: string;
  valueProp: string;
  painPoints: string;
  objections: string;
  differentiators: string;
  selectedStyles: string[];
}

interface ExpressFormProps {
  onModeSwitch: () => void;
}

const adStyles = [
  { id: 'comparison', label: 'Comparison Ads', description: 'Compare your solution to alternatives' },
  { id: 'pain-point', label: 'Pain Point Ads', description: 'Focus heavily on problems they face' },
  { id: 'transformation', label: 'Transformation Ads', description: 'Emphasize before/after benefits' },
  { id: 'urgency', label: 'Urgency/FOMO Ads', description: 'Create time-sensitive offers' },
  { id: 'humorous', label: 'Humorous Ads', description: 'Light, engaging, memorable content' },
  { id: 'event', label: 'Event/Webinar Ads', description: 'Promote specific events or webinars' },
];

export const ExpressForm: React.FC<ExpressFormProps> = ({ onModeSwitch }) => {
  const [formData, setFormData] = useState<ExpressFormData>({
    product: '',
    valueProp: '',
    painPoints: '',
    objections: '',
    differentiators: '',
    selectedStyles: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCopy, setGeneratedCopy] = useState('');
  const [imagePrompts, setImagePrompts] = useState<string[]>([]);
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();

  const handleInputChange = (field: keyof ExpressFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStyleToggle = (styleId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedStyles: prev.selectedStyles.includes(styleId)
        ? prev.selectedStyles.filter(id => id !== styleId)
        : [...prev.selectedStyles, styleId]
    }));
  };

  const generateAdCopy = async () => {
    if (!formData.product.trim()) {
      toast({
        title: "Missing Information",
        description: "Please describe your product or service.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ad-copy-generator', {
        body: {
          message: 'Generate complete ad copy based on all provided information',
          step: 'express-generation',
          context: {
            ...formData,
            styles: formData.selectedStyles.join(', ')
          }
        }
      });

      if (error) throw error;

      setGeneratedCopy(data.message);

      // Auto-generate image prompts
      const { data: imageData, error: imageError } = await supabase.functions.invoke('ad-copy-generator', {
        body: {
          message: 'Generate image prompts for this ad copy',
          step: 'generate-image-prompts',
          context: {
            ...formData,
            styles: formData.selectedStyles.join(', '),
            adCopy: data.message
          }
        }
      });

      if (!imageError && imageData) {
        const prompts = imageData.message.split('\n').filter((line: string) => 
          line.trim().startsWith('PROMPT:') || 
          line.trim().match(/^\d+\./) ||
          (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*'))
        ).map((line: string) => {
          let prompt = line.replace(/^PROMPT:\s*/, '').replace(/^\d+\.\s*/, '').replace(/^[•\-*]\s*/, '').trim();
          return prompt;
        }).filter(Boolean);
        
        if (prompts.length > 0) {
          setImagePrompts(prompts);
        }
      }

      toast({
        title: "Success!",
        description: "Ad copy generated successfully.",
      });
    } catch (error) {
      console.error('Error generating ad copy:', error);
      toast({
        title: "Error",
        description: "Failed to generate ad copy. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [id]: false }));
      }, 2000);
      toast({
        title: "Copied!",
        description: "Content copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive"
      });
    }
  };

  const isFormValid = formData.product.trim().length > 0;

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-background/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Express Ad Copy Generator
            </CardTitle>
            <Button variant="outline" size="sm" onClick={onModeSwitch}>
              Switch to Guided Mode
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Product Description */}
          <div className="space-y-2">
            <Label htmlFor="product" className="text-sm font-medium">
              Product/Service Description *
            </Label>
            <Textarea
              id="product"
              value={formData.product}
              onChange={(e) => handleInputChange('product', e.target.value)}
              placeholder="Describe what you're promoting. Include key features, benefits, and target audience. Example: 'Online fitness program for busy professionals who want to lose weight without extreme dieting.'"
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              Required: Include what you're promoting, who it's for, and main benefits
            </p>
          </div>

          {/* Value Proposition */}
          <div className="space-y-2">
            <Label htmlFor="valueProp" className="text-sm font-medium">
              Main Value Proposition
            </Label>
            <Textarea
              id="valueProp"
              value={formData.valueProp}
              onChange={(e) => handleInputChange('valueProp', e.target.value)}
              placeholder="What's the main transformation or key benefit? Example: 'Lose weight without extreme dieting and feel confident in your body again.'"
              className="min-h-[80px]"
            />
          </div>

          {/* Pain Points */}
          <div className="space-y-2">
            <Label htmlFor="painPoints" className="text-sm font-medium">
              Target Audience Pain Points
            </Label>
            <Textarea
              id="painPoints"
              value={formData.painPoints}
              onChange={(e) => handleInputChange('painPoints', e.target.value)}
              placeholder="What struggles or frustrations does your audience face? Example: 'No time for workouts, overwhelmed by conflicting health advice, failed with previous diets.'"
              className="min-h-[80px]"
            />
          </div>

          {/* Objections */}
          <div className="space-y-2">
            <Label htmlFor="objections" className="text-sm font-medium">
              Common Objections
            </Label>
            <Textarea
              id="objections"
              value={formData.objections}
              onChange={(e) => handleInputChange('objections', e.target.value)}
              placeholder="What concerns might prevent people from buying? Example: 'Too expensive, won't fit busy schedule, just another fad diet.'"
              className="min-h-[80px]"
            />
          </div>

          {/* Differentiators */}
          <div className="space-y-2">
            <Label htmlFor="differentiators" className="text-sm font-medium">
              Unique Differentiators
            </Label>
            <Textarea
              id="differentiators"
              value={formData.differentiators}
              onChange={(e) => handleInputChange('differentiators', e.target.value)}
              placeholder="What makes you different from competitors? Example: 'Only 30 minutes a day, no gym equipment needed, personalized meal plans included.'"
              className="min-h-[80px]"
            />
          </div>

          {/* Ad Styles */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Select Ad Styles (choose one or more)
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {adStyles.map((style) => (
                <div
                  key={style.id}
                  className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    formData.selectedStyles.includes(style.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleStyleToggle(style.id)}
                >
                  <Checkbox
                    checked={formData.selectedStyles.includes(style.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{style.label}</h4>
                    <p className="text-xs text-muted-foreground">{style.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateAdCopy}
            disabled={!isFormValid || isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Generating Ad Copy...' : 'Generate Ad Copy'}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Copy */}
      {generatedCopy && (
        <Card className="border-primary/20 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Generated Ad Copy</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(generatedCopy, 'generated-copy')}
              >
                {copiedStates['generated-copy'] ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="ml-2">Copy All</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm bg-muted/30 p-4 rounded-lg">
              {generatedCopy}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image Generator */}
      {imagePrompts.length > 0 && (
        <div className="mt-6">
          <ImageGenerator imagePrompts={imagePrompts} />
        </div>
      )}
    </div>
  );
};