import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Send, RotateCcw, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ImageGenerator } from './ImageGenerator';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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
  'generate-image-prompts': 'Generate Image Prompts'
};

export const AdCopyWizard = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('initial');
  const [context, setContext] = useState<AdCopyContext>({});
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});
  const [imagePrompts, setImagePrompts] = useState<string[]>([]);
  const { toast } = useToast();

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

      // Handle image prompts generation
      if (currentStep === 'generate-image-prompts') {
        const prompts = data.message.split('\n').filter((line: string) => 
          line.trim().startsWith('PROMPT:') || 
          line.trim().match(/^\d+\./) ||
          (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*'))
        ).map((line: string) => {
          let prompt = line.replace(/^PROMPT:\s*/, '').replace(/^\d+\.\s*/, '').replace(/^[•\-*]\s*/, '').trim();
          return prompt;
        }).filter(Boolean);
        
        if (prompts.length > 0) {
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="mx-auto max-w-4xl border-primary/20 bg-background/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Ad Copy Generation Wizard</CardTitle>
          <Button variant="outline" size="sm" onClick={resetConversation}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
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
              Ready to create high-converting ad copy? Let's start by understanding what you're promoting.
            </p>
            <Button onClick={startConversation} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Start Creating Ad Copy
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
  );
};