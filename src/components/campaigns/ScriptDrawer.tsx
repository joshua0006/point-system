import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Phone, MessageSquare, Mail, RefreshCw, Copy, Check } from "lucide-react";
import { useScriptRegeneration } from "@/hooks/useScriptRegeneration";
import { useToast } from "@/hooks/use-toast";

interface Script {
  type: 'call' | 'sms' | 'followup';
  content: string;
}

interface ScriptDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  campaignTitle: string;
  targetAudience: string;
  scripts: Script[];
  templateId: string;
  campaignAngle?: string;
}

export const ScriptDrawer = ({ 
  isOpen, 
  onClose, 
  campaignTitle, 
  targetAudience, 
  scripts, 
  templateId, 
  campaignAngle 
}: ScriptDrawerProps) => {
  const [activeTab, setActiveTab] = useState("call");
  const [copiedScript, setCopiedScript] = useState<string | null>(null);
  const [regeneratedScripts, setRegeneratedScripts] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { regenerateScript, isLoading } = useScriptRegeneration();

  const scriptConfig = {
    call: {
      icon: Phone,
      label: "Calling Script",
      description: "Professional phone script for lead generation",
      placeholder: "Your calling script will appear here..."
    },
    sms: {
      icon: MessageSquare,
      label: "SMS Follow-up",
      description: "Text message follow-up sequence",
      placeholder: "Your SMS script will appear here..."
    },
    followup: {
      icon: Mail,
      label: "Email Follow-up",
      description: "Email sequence for nurturing leads",
      placeholder: "Your email script will appear here..."
    }
  };

  const getCurrentScript = (type: string) => {
    const regenerated = regeneratedScripts[type];
    if (regenerated) return regenerated;
    
    const original = scripts.find(s => s.type === type);
    return original?.content || scriptConfig[type as keyof typeof scriptConfig].placeholder;
  };

  const handleCopyScript = async (scriptType: string) => {
    const script = getCurrentScript(scriptType);
    try {
      await navigator.clipboard.writeText(script);
      setCopiedScript(scriptType);
      setTimeout(() => setCopiedScript(null), 2000);
      toast({
        title: "Script copied!",
        description: "The script has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try selecting and copying the text manually.",
        variant: "destructive"
      });
    }
  };

  const handleRegenerateScript = async (scriptType: string) => {
    try {
      const regeneratedContent = await regenerateScript({
        scriptType: scriptType as 'call' | 'sms' | 'followup',
        targetAudience,
        campaignAngle: campaignAngle || ''
      });
      
      setRegeneratedScripts(prev => ({
        ...prev,
        [scriptType]: regeneratedContent
      }));
      
      toast({
        title: "Script regenerated!",
        description: "Your script has been updated with fresh content.",
      });
    } catch (error) {
      toast({
        title: "Failed to regenerate",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:w-[600px] sm:max-w-[90vw] overflow-y-auto">
        <SheetHeader className="space-y-3 pb-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl font-bold text-left">Campaign Scripts</SheetTitle>
              <SheetDescription className="text-left">
                {campaignTitle}
              </SheetDescription>
            </div>
          </div>
          <Badge variant="secondary" className="w-fit">
            Target: {targetAudience}
          </Badge>
        </SheetHeader>

        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              {Object.entries(scriptConfig).map(([type, config]) => {
                const Icon = config.icon;
                return (
                  <TabsTrigger 
                    key={type} 
                    value={type}
                    className="flex items-center gap-2 text-xs sm:text-sm"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{config.label}</span>
                    <span className="sm:hidden">{type.toUpperCase()}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {Object.entries(scriptConfig).map(([type, config]) => {
              const Icon = config.icon;
              const script = getCurrentScript(type);
              const isRegeneratingThis = isLoading;
              const hasCopied = copiedScript === type;

              return (
                <TabsContent key={type} value={type} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-semibold text-foreground">{config.label}</h3>
                        <p className="text-sm text-muted-foreground">{config.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleCopyScript(type)}
                        variant="outline"
                        size="sm"
                        className="h-8"
                      >
                        {hasCopied ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        onClick={() => handleRegenerateScript(type)}
                        variant="outline"
                        size="sm"
                        disabled={isRegeneratingThis}
                        className="h-8"
                      >
                        <RefreshCw className={`h-3 w-3 ${isRegeneratingThis ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>

                  <Textarea
                    value={script}
                    readOnly
                    className="min-h-[300px] resize-none bg-muted/30 border-border text-sm leading-relaxed"
                    placeholder={config.placeholder}
                  />

                  {regeneratedScripts[type] && (
                    <div className="text-xs text-muted-foreground bg-green-50 dark:bg-green-950/20 p-2 rounded border border-green-200 dark:border-green-800">
                      ✓ Script regenerated successfully
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};