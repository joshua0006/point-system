import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Sparkles, TrendingUp } from "lucide-react";
import TaskSelector, { TaskCategory } from "@/components/ai/TaskSelector";
import ChatInterface from "@/components/ai/ChatInterface";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { BreadcrumbsBar } from "@/components/BreadcrumbsBar";

export default function AIAssistant() {
  const [selectedTask, setSelectedTask] = useState<TaskCategory | null>(null);
  const { user, profile } = useAuth();

  // Redirect users without proper role access
  if (!user || !['consultant', 'admin', 'user'].includes(profile?.role || '')) {
    return <Navigate to="/marketplace" />;
  }

  if (selectedTask) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ChatInterface 
          selectedTask={selectedTask} 
          onBack={() => setSelectedTask(null)} 
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <BreadcrumbsBar />
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 rounded-full bg-primary text-primary-foreground mr-3">
            <Bot className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            AI Assistant
          </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Your intelligent companion for financial consulting tasks. Get professional assistance with client communication, content creation, compliance, and business strategy.
        </p>
      </div>

      {/* Benefits Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="text-center">
          <CardHeader>
            <div className="p-3 rounded-full bg-primary/10 text-primary w-fit mx-auto mb-2">
              <Sparkles className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg">Professional Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Generate high-quality, compliant content that meets Singapore's financial regulatory standards.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <div className="p-3 rounded-full bg-primary/10 text-primary w-fit mx-auto mb-2">
              <TrendingUp className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg">Save Time</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Reduce time spent on routine tasks like proposal writing, content creation, and client communications.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <div className="p-3 rounded-full bg-primary/10 text-primary w-fit mx-auto mb-2">
              <Bot className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg">Personalized</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Get assistance tailored to your specific services, client segments, and business needs.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Task Selection */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Choose Your Task</h2>
          <Badge variant="secondary" className="text-sm">
            8 Categories Available
          </Badge>
        </div>
        <p className="text-muted-foreground mb-6">
          Select a task category to get started with AI assistance tailored for financial consultants.
        </p>
      </div>

      <TaskSelector onSelectTask={setSelectedTask} />

      {/* Footer */}
      <div className="mt-12 text-center">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center mb-2">
              <Bot className="h-5 w-5 text-primary mr-2" />
              <span className="font-medium text-primary">Powered by Advanced AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              All generated content is for guidance purposes. Please review and ensure compliance with current regulations before use.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}