import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, Copy, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ImageGeneratorProps {
  imagePrompts: string[];
}

interface GeneratedImage {
  prompt: string;
  imageUrl: string;
  timestamp: Date;
}

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({ imagePrompts }) => {
  const [selectedPrompt, setSelectedPrompt] = useState(imagePrompts[0] || '');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const { toast } = useToast();

  const generateImage = async (prompt: string) => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt for image generation",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-images', {
        body: { prompt: prompt.trim() }
      });

      if (error) throw error;

      const newImage: GeneratedImage = {
        prompt: prompt.trim(),
        imageUrl: data.image,
        timestamp: new Date()
      };

      setGeneratedImages(prev => [newImage, ...prev]);
      
      toast({
        title: "Success",
        description: "Image generated successfully!"
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = async (imageUrl: string, prompt: string) => {
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `ad-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Success",
        description: "Image downloaded successfully!"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download image",
        variant: "destructive"
      });
    }
  };

  const copyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    toast({
      title: "Copied",
      description: "Prompt copied to clipboard"
    });
  };

  return (
    <div className="space-y-6">
      {/* Image Generation Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Image Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Generated Prompts */}
          {imagePrompts.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Use Generated Prompts:
              </label>
              <div className="flex flex-wrap gap-2 mb-4">
                {imagePrompts.map((prompt, index) => (
                  <Badge
                    key={index}
                    variant={selectedPrompt === prompt ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedPrompt(prompt)}
                  >
                    Prompt {index + 1}
                  </Badge>
                ))}
              </div>
              {selectedPrompt && (
                <div className="p-3 bg-muted rounded-md mb-4">
                  <p className="text-sm">{selectedPrompt}</p>
                </div>
              )}
            </div>
          )}

          {/* Custom Prompt Input */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Or enter custom prompt:
            </label>
            <Input
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              className="mb-4"
            />
          </div>

          {/* Generation Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => generateImage(selectedPrompt)}
              disabled={isGenerating || !selectedPrompt}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate from Selected Prompt'
              )}
            </Button>
            <Button
              onClick={() => generateImage(customPrompt)}
              disabled={isGenerating || !customPrompt.trim()}
              variant="outline"
              className="flex-1"
            >
              Generate from Custom Prompt
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Images */}
      {generatedImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {generatedImages.map((image, index) => (
                <div key={index} className="space-y-3">
                  <img
                    src={image.imageUrl}
                    alt={`Generated image ${index + 1}`}
                    className="w-full h-64 object-cover rounded-lg border"
                  />
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {image.prompt}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => downloadImage(image.imageUrl, image.prompt)}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyPrompt(image.prompt)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Prompt
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};