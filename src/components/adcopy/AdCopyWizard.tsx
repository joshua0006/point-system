import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Send, RotateCcw, Copy, Check, MessageSquare, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ImageGenerator } from './ImageGenerator';
import { ExpressForm } from './ExpressForm';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date | string;
  step?: string;
}

interface AdCopyContext {
  product?: string;
  valueProp?: string;
  painPoints?: string;
  objections?: string;
  differentiators?: string;
  styles?: string;
  selectedAngles?: string;
  adCopy?: string;
  imagePrompts?: string[];
}

const stepTitles = {
  'initial': 'Product Description',
  'value-proposition': 'Value Proposition',
  'pain-points': 'Pain Points',
  'objections': 'Handle Objections',
  'differentiators': 'Unique Differentiators',
  'style-selection': 'Ad Style Selection',
  'generate-angles': 'Generate Ad Angles',
  'create-copy': 'Create Ad Copy',
  'generate-image-prompts': 'Generate Image Prompts',
  'generate-facebook-creatives': 'Facebook Ad Creatives'
};

export const AdCopyWizard = () => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('adcopy-guided-messages');
    if (saved) {
      try {
        const parsedMessages = JSON.parse(saved);
        return parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      } catch {
        return [];
      }
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem('adcopy-guided-step');
    return saved || 'initial';
  });
  const [context, setContext] = useState<AdCopyContext>(() => {
    const saved = localStorage.getItem('adcopy-guided-context');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    return {};
  });
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});
  const [imagePrompts, setImagePrompts] = useState<string[]>(() => {
    const saved = localStorage.getItem('adcopy-guided-prompts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });
  const [facebookCreatives, setFacebookCreatives] = useState<string[]>(() => {
    const saved = localStorage.getItem('adCopy-facebook-creatives');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });
  const [activeTab, setActiveTab] = useState('express');
  const { toast } = useToast();

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('adcopy-guided-messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('adcopy-guided-step', currentStep);
  }, [currentStep]);

  useEffect(() => {
    localStorage.setItem('adcopy-guided-context', JSON.stringify(context));
  }, [context]);

  useEffect(() => {
    localStorage.setItem('adcopy-guided-prompts', JSON.stringify(imagePrompts));
  }, [imagePrompts]);

  useEffect(() => {
    localStorage.setItem('adCopy-facebook-creatives', JSON.stringify(facebookCreatives));
  }, [facebookCreatives]);

  const steps = Object.keys(stepTitles);
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const startConversation = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ad-copy-generator', {
        body: {
          message: 'Start the ad copy generation process',
          step: 'initial',
          context
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        step: 'initial'
      };

      setMessages([assistantMessage]);
      setCurrentStep('value-proposition');
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start ad copy generation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userInput = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
      timestamp: new Date()
    };

    // Update context based on current step
    const newContext = { ...context };
    switch (currentStep) {
      case 'value-proposition':
        newContext.product = userInput;
        break;
      case 'pain-points':
        newContext.valueProp = userInput;
        break;
      case 'objections':
        newContext.painPoints = userInput;
        break;
      case 'differentiators':
        newContext.objections = userInput;
        break;
      case 'style-selection':
        newContext.differentiators = userInput;
        break;
      case 'generate-angles':
        newContext.styles = userInput;
        break;
      case 'create-copy':
        newContext.selectedAngles = userInput;
        break;
      case 'generate-image-prompts':
        // Store the current ad copy for image prompt generation
        if (messages.length > 0) {
          const lastAssistantMessage = messages[messages.length - 1];
          if (lastAssistantMessage.role === 'assistant') {
            newContext.adCopy = lastAssistantMessage.content;
          }
        }
        break;
    }
    setContext(newContext);

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ad-copy-generator', {
        body: {
          message: userInput,
          step: currentStep,
          context: newContext
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        step: currentStep
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Handle image prompts generation with improved parsing
      if (currentStep === 'generate-image-prompts') {
        const lines = data.message.split('\n');
        
        // Extract lines that start with IMAGE_PROMPT:
        const prompts = lines
          .filter((line: string) => line.trim().startsWith('IMAGE_PROMPT:'))
          .map((line: string) => {
            // Remove the IMAGE_PROMPT: prefix and clean up
            let prompt = line.replace(/^IMAGE_PROMPT:\s*/, '').trim();
            // Remove any leading brackets or formatting
            prompt = prompt.replace(/^\[/, '').replace(/\]$/, '').trim();
            return prompt;
          })
          .filter((prompt: string) => {
            // Validate that it's actually a descriptive prompt
            return prompt.length > 20 && // Must be substantial
                   !prompt.toLowerCase().includes('aspect ratio') &&
                   !prompt.toLowerCase().includes('style specification') &&
                   !prompt.toLowerCase().includes('technical detail') &&
                   !prompt.toLowerCase().includes('recommended') &&
                   !prompt.toLowerCase().includes('camera angle') &&
                   !prompt.toLowerCase().includes('color palette');
          });
        
        // Fallback: if no IMAGE_PROMPT: markers found, try the old method but with better filtering
        if (prompts.length === 0) {
          const fallbackPrompts = lines
            .filter((line: string) => {
              const trimmed = line.trim();
              return trimmed.match(/^\d+\./) || 
                     trimmed.startsWith('•') || 
                     trimmed.startsWith('-') || 
                     trimmed.startsWith('*');
            })
            .map((line: string) => {
              let prompt = line.replace(/^\d+\.\s*/, '').replace(/^[•\-*]\s*/, '').trim();
              return prompt;
            })
            .filter((prompt: string) => {
              // Enhanced filtering to exclude technical specifications
              const lowerPrompt = prompt.toLowerCase();
              return prompt.length > 20 && // Must be substantial
                     !lowerPrompt.includes('aspect ratio') &&
                     !lowerPrompt.includes('style specification') &&
                     !lowerPrompt.includes('technical detail') &&
                     !lowerPrompt.includes('recommended') &&
                     !lowerPrompt.includes('camera angle') &&
                     !lowerPrompt.includes('color palette') &&
                     !lowerPrompt.includes('16:9') &&
                     !lowerPrompt.includes('1:1') &&
                     !lowerPrompt.includes('9:16') &&
                     !lowerPrompt.startsWith('for each prompt') &&
                     !lowerPrompt.startsWith('format each');
            });
          
          if (fallbackPrompts.length > 0) {
            setImagePrompts(fallbackPrompts);
            setContext(prev => ({ ...prev, imagePrompts: fallbackPrompts }));
          }
        } else {
          setImagePrompts(prompts);
          setContext(prev => ({ ...prev, imagePrompts: prompts }));
        }
      }

      // Move to next step
      const nextStepIndex = currentStepIndex + 1;
      if (nextStepIndex < steps.length) {
        setCurrentStep(steps[nextStepIndex]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to generate response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetConversation = () => {
    setMessages([]);
    setCurrentStep('initial');
    setContext({});
    setInput('');
    setImagePrompts([]);
    setFacebookCreatives([]);
    // Clear localStorage
    localStorage.removeItem('adcopy-guided-messages');
    localStorage.removeItem('adcopy-guided-step');
    localStorage.removeItem('adcopy-guided-context');
    localStorage.removeItem('adcopy-guided-prompts');
    localStorage.removeItem('adCopy-facebook-creatives');
    toast({
      title: "Conversation reset",
      description: "All conversation data has been cleared.",
    });
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
        description: "Ad copy has been copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive"
      });
    }
  };

  const generateFacebookCreatives = async () => {
    // Check if we have completed ad copy generation
    if (currentStep !== 'generate-image-prompts' && !messages.some(m => m.step === 'create-copy')) {
      toast({
        title: "Error",
        description: "Please complete ad copy generation first",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Get the latest ad copy from messages
      const adCopyMessage = messages.find(m => m.step === 'create-copy' && m.role === 'assistant');
      const contextWithAdCopy = {
        ...context,
        adCopy: adCopyMessage?.content || context.adCopy
      };

      const { data, error } = await supabase.functions.invoke('ad-copy-generator', {
        body: {
          message: "Generate Facebook ad creatives for the provided ad copy",
          step: 'generate-facebook-creatives',
          context: contextWithAdCopy
        }
      });

      if (error) throw error;
      
      const newMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        step: 'generate-facebook-creatives'
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      // Extract and store Facebook creatives
      const creatives = extractFacebookCreatives(data.message);
      if (creatives.length > 0) {
        setFacebookCreatives(creatives);
        toast({
          title: "Success",
          description: `Generated ${creatives.length} Facebook ad creatives`,
        });
      } else {
        toast({
          title: "Warning",
          description: "No Facebook creatives found in response",
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('Error generating Facebook creatives:', error);
      toast({
        title: "Error",
        description: "Failed to generate Facebook creatives. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const extractFacebookCreatives = (text: string): string[] => {
    try {
      // Look for lines that start with "FACEBOOK_CREATIVE:" marker
      const creativeLines = text.split('\n').filter(line => 
        line.trim().startsWith('FACEBOOK_CREATIVE:')
      );
      
      return creativeLines.map(line => 
        line.replace('FACEBOOK_CREATIVE:', '').trim()
      ).filter(creative => 
        // Filter out empty creatives and ensure substantial content
        creative.length > 20
      );
    } catch (error) {
      console.error('Error extracting Facebook creatives:', error);
      return [];
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="express" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Express Mode
          </TabsTrigger>
          <TabsTrigger value="guided" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Guided Mode
          </TabsTrigger>
        </TabsList>

        <TabsContent value="express">
          <ExpressForm onModeSwitch={() => setActiveTab('guided')} />
        </TabsContent>

        <TabsContent value="guided">
          <Card className="border-primary/20 bg-background/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Guided Ad Copy Generation</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('express')}>
                    Switch to Express
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetConversation}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                </div>
              </div>
              {messages.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Step {currentStepIndex + 1} of {steps.length}: {stepTitles[currentStep as keyof typeof stepTitles]}
                    </span>
                    <span className="text-muted-foreground">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    I'll guide you step-by-step through creating high-converting ad copy. Let's start by understanding what you're promoting.
                  </p>
                  <Button onClick={startConversation} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Start Guided Process
                  </Button>
                </div>
              ) : (
                <>
                  {/* Messages */}
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {message.role === 'assistant' && message.step && (
                            <Badge variant="secondary" className="mb-2 text-xs">
                              {stepTitles[message.step as keyof typeof stepTitles]}
                            </Badge>
                          )}
                          <div className="whitespace-pre-wrap text-sm">
                            {message.content}
                          </div>
                          {message.role === 'assistant' && (message.content.includes('**') || message.content.includes('PROMPT:')) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2 h-8 px-2"
                              onClick={() => copyToClipboard(message.content, message.id)}
                            >
                              {copiedStates[message.id] ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                              <span className="ml-1 text-xs">
                                {message.step === 'generate-image-prompts' ? 'Copy Prompts' : 'Copy Ad'}
                              </span>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted text-muted-foreground rounded-lg p-3">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>

                   {/* Facebook Creative Generator Button */}
                   {(currentStep === 'generate-image-prompts' || messages.some(m => m.step === 'create-copy')) && (
                     <div className="flex gap-2 mt-4">
                       <Button
                         onClick={generateFacebookCreatives}
                         disabled={isLoading}
                         variant="premium"
                         className="flex-1"
                       >
                         {isLoading ? (
                           <>
                             <Loader2 className="h-4 w-4 animate-spin mr-2" />
                             Generating...
                           </>
                         ) : (
                           "Generate Facebook Ad Creatives"
                         )}
                       </Button>
                     </div>
                   )}

                  {/* Facebook Creatives Display */}
                  {facebookCreatives.length > 0 && (
                    <div className="mt-6 space-y-4">
                      <h3 className="text-lg font-semibold">Facebook Ad Creatives</h3>
                      <div className="space-y-3">
                        {facebookCreatives.map((creative, index) => (
                          <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                            <span className="text-sm font-medium text-muted-foreground min-w-[60px]">
                              Creative {index + 1}:
                            </span>
                            <p className="text-sm flex-1">{creative}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(creative, `creative-${index}`)}
                              className="shrink-0"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Image Generator */}
                  {imagePrompts.length > 0 && (
                    <div className="mt-6">
                      <ImageGenerator imagePrompts={imagePrompts} />
                    </div>
                  )}

                  {/* Input */}
                  <div className="flex gap-2">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={
                        currentStep === 'create-copy' 
                          ? "Tell me which ad angles you'd like me to create copy for..."
                          : currentStep === 'generate-image-prompts'
                          ? "Type 'yes' to generate image prompts, or tell me what specific image styles you prefer..."
                          : "Type your response..."
                      }
                      className="min-h-[60px] resize-none"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!input.trim() || isLoading}
                      size="icon"
                      className="h-[60px] w-[60px]"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};