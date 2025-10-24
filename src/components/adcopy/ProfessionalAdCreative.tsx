import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Copy, Palette, Layout, Sparkles, Wand2, RefreshCw, Edit3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdCreativeTemplate } from './AdCreativeTemplate';
import { AdvancedDesignTemplate } from './AdvancedDesignTemplates';

interface ProfessionalAdCreativeProps {
  adCopy: string;
  imageUrl?: string;
  index: number;
  onGenerateImage: (adCopy: string) => void;
  isGenerating?: boolean;
}

type Template = 'magazine' | 'social' | 'luxury' | 'tech' | 'playful' | 'minimal';
type ColorScheme = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'pink';

const colorSchemes = {
  blue: { primary: '#2563eb', secondary: '#3b82f6' },
  purple: { primary: '#7c3aed', secondary: '#8b5cf6' },
  green: { primary: '#059669', secondary: '#10b981' },
  orange: { primary: '#ea580c', secondary: '#f97316' },
  red: { primary: '#dc2626', secondary: '#ef4444' },
  pink: { primary: '#db2777', secondary: '#ec4899' }
};

export const ProfessionalAdCreative: React.FC<ProfessionalAdCreativeProps> = ({
  adCopy,
  imageUrl,
  index,
  onGenerateImage,
  isGenerating = false
}) => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [template, setTemplate] = useState<Template>('magazine');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('blue');
  const [isExporting, setIsExporting] = useState(false);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Ad copy copied to clipboard"
    });
  };

  const handleRegenerateImage = () => {
    setIsRegenerating(true);
    const promptToUse = customPrompt.trim() || adCopy;
    onGenerateImage(promptToUse);
    
    // Reset states immediately
    setIsRegenerating(false);
    setShowPromptEditor(false);
    setCustomPrompt('');
  };

  const handlePromptEditorToggle = () => {
    setShowPromptEditor(!showPromptEditor);
    if (!showPromptEditor) {
      setCustomPrompt(adCopy); // Pre-fill with current ad copy
    }
  };

  const downloadAsImage = async () => {
    if (!canvasRef.current || !imageUrl) {
      toast({
        title: "Error",
        description: "Cannot download - missing image or template",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    try {
      // Lazy load html2canvas only when export is triggered (saves ~198KB from initial bundle)
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: 600
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `professional-ad-creative-${index + 1}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          toast({
            title: "Downloaded",
            description: "Professional ad creative downloaded successfully!"
          });
        }
      }, 'image/png', 1.0);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "Failed to export ad creative",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const downloadAsHTML = () => {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Professional Ad Creative ${index + 1}</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .creative-container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.15);
            overflow: hidden;
            padding: 40px;
        }
        .creative-title {
            text-align: center;
            font-size: 28px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 30px;
            background: linear-gradient(135deg, ${colorSchemes[colorScheme].primary}, ${colorSchemes[colorScheme].secondary});
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .template-wrapper {
            display: flex;
            justify-content: center;
            margin-bottom: 30px;
        }
        .footer {
            text-align: center;
            color: #64748b;
            font-size: 14px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="creative-container">
        <h1 class="creative-title">Professional Ad Creative ${index + 1}</h1>
        <div class="template-wrapper">
            <div style="transform: scale(0.8); transform-origin: center;">
                ${canvasRef.current?.innerHTML || ''}
            </div>
        </div>
        <div class="footer">
            <p>Generated with AI • ${new Date().toLocaleDateString()}</p>
        </div>
    </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `professional-ad-creative-${index + 1}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Professional ad creative downloaded as HTML"
    });
  };

  const colors = colorSchemes[colorScheme];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <span>Professional Creative {index + 1}</span>
          </div>
          <Badge variant={imageUrl ? "default" : "secondary"}>
            {imageUrl ? "Ready" : "Image Needed"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Customization */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Template Style
            </label>
            <Select value={template} onValueChange={(value: Template) => setTemplate(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="magazine">Magazine Layout</SelectItem>
                <SelectItem value="social">Social Media</SelectItem>
                <SelectItem value="luxury">Luxury Premium</SelectItem>
                <SelectItem value="tech">Tech Modern</SelectItem>
                <SelectItem value="playful">Playful Creative</SelectItem>
                <SelectItem value="minimal">Minimal Clean</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Color Scheme
            </label>
            <Select value={colorScheme} onValueChange={(value: ColorScheme) => setColorScheme(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blue">Professional Blue</SelectItem>
                <SelectItem value="purple">Creative Purple</SelectItem>
                <SelectItem value="green">Fresh Green</SelectItem>
                <SelectItem value="orange">Energetic Orange</SelectItem>
                <SelectItem value="red">Bold Red</SelectItem>
                <SelectItem value="pink">Trendy Pink</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Template Preview */}
        {imageUrl ? (
          <div className="space-y-4">
            <div className="flex justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
              <div ref={canvasRef} className="transform scale-75 origin-center">
                <img
                  src={imageUrl}
                  alt="Generated Marketing Image"
                  className="rounded-lg shadow-lg max-w-full h-auto"
                  style={{
                    maxWidth: '600px',
                    maxHeight: '400px',
                    objectFit: 'contain'
                  }}
                />
              </div>
            </div>
            
            {/* Download Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={downloadAsImage}
                disabled={isExporting}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Download PNG'}
              </Button>
              <Button
                onClick={downloadAsHTML}
                variant="outline"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Download HTML
              </Button>
            </div>
            
            {/* Regenerate Options */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  onClick={handleRegenerateImage}
                  disabled={isRegenerating || isGenerating}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {isRegenerating ? "Regenerating..." : "Regenerate Image"}
                </Button>
                <Button
                  onClick={handlePromptEditorToggle}
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              </div>
              
              {showPromptEditor && (
                <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <label className="text-sm font-medium text-blue-900 block">
                    Customize Image Prompt:
                  </label>
                  <Textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Enter custom prompt for image generation..."
                    rows={3}
                    className="resize-none"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleRegenerateImage}
                      disabled={isRegenerating || isGenerating}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      {isRegenerating ? "Generating..." : "Generate with Custom Prompt"}
                    </Button>
                    <Button
                      onClick={() => setShowPromptEditor(false)}
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-dashed border-blue-200">
            <Wand2 className="w-12 h-12 mx-auto text-blue-500 mb-4" />
            <h3 className="font-medium mb-2 text-gray-900">Generate Canva AI-Level Image</h3>
            <p className="text-sm text-gray-600 mb-4">
              Create professional character illustrations optimized for marketing with strategic text placement
            </p>
            <Button
              onClick={() => onGenerateImage(adCopy)}
              disabled={isGenerating}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isGenerating ? "Creating Professional Image..." : "Generate Professional Image"}
            </Button>
          </div>
        )}

        {/* Ad Copy Display */}
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <Copy className="h-4 w-4" />
            Ad Copy:
          </h4>
          <div className="p-3 bg-muted rounded-md max-h-32 overflow-y-auto">
            <p className="text-sm whitespace-pre-wrap">{adCopy}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => copyToClipboard(adCopy)}
            className="w-full"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Ad Text
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};