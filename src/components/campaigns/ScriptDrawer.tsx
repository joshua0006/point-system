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
      <SheetContent className="w-full sm:w-[500px] sm:max-w-[85vw] overflow-y-auto">
        <SheetHeader className="space-y-3 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-lg font-bold text-left">Suggested Scripts</SheetTitle>
              <SheetDescription className="text-left text-sm">
                {campaignTitle}
              </SheetDescription>
            </div>
          </div>
          <Badge variant="secondary" className="w-fit text-xs">
            Target: {targetAudience}
          </Badge>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          {Object.entries(scriptConfig).map(([type, config]) => {
            const Icon = config.icon;
            const script = getCurrentScript(type);
            const isRegeneratingThis = isLoading;
            const scriptPreview = script.length > 100 ? script.substring(0, 100) + "..." : script;

            return (
              <div key={type} className="group">
                <div className="p-4 border border-border rounded-xl hover:border-primary/30 hover:bg-primary/5 transition-all duration-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm text-foreground">{config.label}</h4>
                        <div className="flex gap-1">
                          <Button
                            onClick={() => handleCopyScript(type)}
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {copiedScript === type ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            onClick={() => handleRegenerateScript(type)}
                            variant="ghost"
                            size="sm"
                            disabled={isRegeneratingThis}
                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <RefreshCw className={`h-3 w-3 ${isRegeneratingThis ? 'animate-spin' : ''}`} />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-3">{config.description}</p>
                      
                      <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                        <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">
                          {scriptPreview}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <Badge variant="outline" className="text-xs px-2 py-1">
                          {type === 'call' ? 'Phone Script' : type === 'sms' ? 'Text Message' : 'Email Sequence'}
                        </Badge>
                        
                        <Button
                          onClick={() => {
                            // Expand to show full script
                            setActiveTab(type);
                          }}
                          variant="link"
                          size="sm"
                          className="text-xs h-auto p-0 text-primary hover:text-primary/80"
                        >
                          View Full Script →
                        </Button>
                      </div>

                      {regeneratedScripts[type] && (
                        <div className="mt-2 text-xs text-green-600 bg-green-50 dark:bg-green-950/20 p-2 rounded border border-green-200 dark:border-green-800">
                          ✓ Script updated successfully
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Full Script Modal - Triggered by "View Full Script" */}
        {activeTab && (
          <div className="mt-6 p-4 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm">
                Full {scriptConfig[activeTab as keyof typeof scriptConfig]?.label}
              </h4>
              <Button
                onClick={() => setActiveTab("")}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                ✕
              </Button>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg border border-border max-h-60 overflow-y-auto">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {getCurrentScript(activeTab)}
              </p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};