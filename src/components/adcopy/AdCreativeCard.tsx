import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Copy, Image as ImageIcon } from '@/lib/icons';
import { useToast } from "@/hooks/use-toast";

interface AdCreativeCardProps {
  adCopy: string;
  imageUrl?: string;
  index: number;
  onGenerateImage: (adCopy: string) => void;
  isGenerating?: boolean;
}

export const AdCreativeCard: React.FC<AdCreativeCardProps> = ({
  adCopy,
  imageUrl,
  index,
  onGenerateImage,
  isGenerating = false
}) => {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Ad copy copied to clipboard"
    });
  };

  const downloadCreative = () => {
    // Create a downloadable HTML file with the ad creative
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Ad Creative ${index + 1}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .creative { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
        .image { width: 100%; height: 300px; object-fit: cover; }
        .content { padding: 20px; }
        .copy { line-height: 1.6; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="creative">
        ${imageUrl ? `<img src="${imageUrl}" alt="Ad Creative" class="image" />` : ''}
        <div class="content">
            <h2>Ad Creative ${index + 1}</h2>
            <div class="copy">${adCopy.replace(/\n/g, '<br>')}</div>
        </div>
    </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ad-creative-${index + 1}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Ad creative downloaded as HTML file"
    });
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Ad Creative {index + 1}</span>
          <Badge variant={imageUrl ? "default" : "secondary"}>
            {imageUrl ? "Complete" : "Copy Only"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Image Section */}
        {imageUrl ? (
          <div className="aspect-video bg-muted rounded-lg overflow-hidden">
            <img
              src={imageUrl}
              alt={`Ad Creative ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No image generated yet</p>
            </div>
          </div>
        )}

        {/* Ad Copy */}
        <div className="space-y-2">
          <h4 className="font-medium">Ad Copy:</h4>
          <div className="p-3 bg-muted rounded-md max-h-32 overflow-y-auto">
            <p className="text-sm whitespace-pre-wrap">{adCopy}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(adCopy)}
              className="flex-1"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Text
            </Button>
            {imageUrl && (
              <Button
                size="sm"
                onClick={downloadCreative}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </div>
          {!imageUrl && (
            <Button
              size="sm"
              onClick={() => onGenerateImage(adCopy)}
              disabled={isGenerating}
              variant="secondary"
              className="w-full"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Generate Image for This Creative
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};