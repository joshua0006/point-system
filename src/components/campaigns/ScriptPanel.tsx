import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Copy, Wand2, ChevronUp, ChevronDown } from '@/lib/icons';
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
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="h-full">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-3 text-left h-auto min-h-[44px]">
          <span className="text-sm font-medium">View Scripts</span>
          {isOpen ? <ChevronUp className="h-4 w-4 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 flex-shrink-0" />}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-3">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-2 px-0">
            <CardTitle className="text-sm flex items-center gap-2">
              Campaign Scripts
              <Badge variant="outline" className="text-xs">
                {scripts.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="px-0 pb-0">
            <div className="space-y-3 mb-3">
              <div>
                <label className="text-xs font-medium mb-1.5 block">
                  Custom Requirements
                </label>
                <Textarea
                  placeholder="e.g., More professional tone, include benefits..."
                  value={customRequirements}
                  onChange={(e) => setCustomRequirements(e.target.value)}
                  className="min-h-[50px] text-xs"
                />
              </div>
            </div>

            <Tabs defaultValue="call" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-8">
                <TabsTrigger value="call" className="text-xs px-2">Call</TabsTrigger>
                <TabsTrigger value="sms" className="text-xs px-2">SMS</TabsTrigger>
                <TabsTrigger value="followup" className="text-xs px-2">Follow-up</TabsTrigger>
              </TabsList>
              
              {scripts.map((script) => (
                <TabsContent key={script.type} value={script.type} className="space-y-2 mt-2">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex gap-1 flex-wrap">
                      {(() => {
                        const stats = getScriptStats(script.content);
                        return (
                          <>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                              {stats.words}w
                            </Badge>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                              {stats.readingTime}m
                            </Badge>
                          </>
                        );
                      })()}
                    </div>
                    
                    <div className="flex gap-1 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(script.content)}
                        className="h-7 px-2 text-xs"
                      >
                        <Copy className="h-2.5 w-2.5 mr-1" />
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleRegenerate(script.type)}
                        disabled={isLoading}
                        className="h-7 px-2 text-xs"
                      >
                        <Wand2 className="h-2.5 w-2.5 mr-1" />
                        {isLoading ? 'Gen...' : 'Regen'}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-muted rounded-md p-2.5 max-h-32 overflow-y-auto">
                    <p className="text-xs whitespace-pre-wrap leading-relaxed">{script.content}</p>
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