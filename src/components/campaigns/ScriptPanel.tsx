import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Copy, Wand2, ChevronUp, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useScriptRegeneration } from '@/hooks/useScriptRegeneration';
import { toast } from '@/hooks/use-toast';

interface Script {
  type: 'call' | 'sms' | 'followup';
  content: string;
  tone?: string;
  length?: number;
}

interface ScriptPanelProps {
  scripts: Script[];
  templateId: string;
  targetAudience: string;
  campaignAngle: string;
  onScriptsUpdate?: (scripts: Script[]) => void;
}

export const ScriptPanel: React.FC<ScriptPanelProps> = ({
  scripts,
  templateId,
  targetAudience,
  campaignAngle,
  onScriptsUpdate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customRequirements, setCustomRequirements] = useState('');
  const { regenerateScript, isLoading } = useScriptRegeneration();

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied!",
        description: "Script copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy script",
        variant: "destructive",
      });
    }
  };

  const handleRegenerate = async (scriptType: 'call' | 'sms' | 'followup') => {
    try {
      const newScript = await regenerateScript({
        scriptType,
        targetAudience,
        campaignAngle,
        customRequirements: customRequirements.trim() || undefined
      });

      const updatedScripts = scripts.map(script => 
        script.type === scriptType 
          ? { ...script, content: newScript }
          : script
      );

      onScriptsUpdate?.(updatedScripts);
      toast({
        title: "Script Regenerated!",
        description: `${scriptType} script has been updated with AI`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate script",
        variant: "destructive",
      });
    }
  };

  const getScriptStats = (content: string) => ({
    words: content.split(' ').length,
    chars: content.length,
    readingTime: Math.ceil(content.split(' ').length / 200) // avg reading speed
  });

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-2">
          <span className="text-sm font-medium">View Scripts</span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              Campaign Scripts
              <Badge variant="outline" className="text-xs">
                {scripts.length} scripts
              </Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Custom Requirements (Optional)
                </label>
                <Textarea
                  placeholder="e.g., Make it more professional, include specific benefits, change tone to casual..."
                  value={customRequirements}
                  onChange={(e) => setCustomRequirements(e.target.value)}
                  className="min-h-[60px]"
                />
              </div>
            </div>

            <Tabs defaultValue="call" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="call">Call Script</TabsTrigger>
                <TabsTrigger value="sms">SMS Script</TabsTrigger>
                <TabsTrigger value="followup">Follow-up</TabsTrigger>
              </TabsList>
              
              {scripts.map((script) => (
                <TabsContent key={script.type} value={script.type} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {(() => {
                        const stats = getScriptStats(script.content);
                        return (
                          <>
                            <Badge variant="secondary" className="text-xs">
                              {stats.words} words
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {stats.readingTime}min read
                            </Badge>
                          </>
                        );
                      })()}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(script.content)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleRegenerate(script.type)}
                        disabled={isLoading}
                      >
                        <Wand2 className="h-3 w-3 mr-1" />
                        {isLoading ? 'Generating...' : 'Regenerate'}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-muted rounded-md p-3">
                    <p className="text-sm whitespace-pre-wrap">{script.content}</p>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
};