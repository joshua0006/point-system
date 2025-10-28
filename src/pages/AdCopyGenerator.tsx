import React, { lazy, Suspense } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Target, Zap, PenTool } from '@/lib/icons';
import { CardSkeleton } from '@/components/ui/optimized-skeleton';

// PERFORMANCE: Lazy load AdCopyWizard to reduce initial bundle (48 KB → ~15 KB)
// The wizard contains heavy form logic and AI generation code
const AdCopyWizard = lazy(() => import('@/components/adcopy/AdCopyWizard').then(m => ({ default: m.AdCopyWizard })));

const AdCopyGenerator = () => {
  return (
    <SidebarLayout title="AI Ad Copy Generator" description="Create high-converting ad copy that captures attention and drives action">
      <div className="bg-gradient-to-br from-background to-muted/20 p-4 min-h-full">
        <div className="mx-auto max-w-7xl">
        {/* Header Section - simplified since title is in SidebarLayout */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <PenTool className="h-8 w-8 text-primary" />
          </div>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Our AI follows proven copywriting frameworks to generate compelling ads for any platform.
          </p>
        </div>

        {/* Benefits Section */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card className="border-primary/20 bg-background/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Multi-Style Generation</CardTitle>
              </div>
              <CardDescription>
                Generate pain point, transformation, urgency, and comparison ads tailored to your audience.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-primary/20 bg-background/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="mb-2 flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Psychology-Driven</CardTitle>
              </div>
              <CardDescription>
                Uses proven psychological triggers like FOMO, social proof, and transformation to drive action.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-primary/20 bg-background/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="mb-2 flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Multiple Formats</CardTitle>
              </div>
              <CardDescription>
                Get short, long, storytelling, and direct versions optimized for different platforms.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Process Steps */}
        <Card className="mb-8 border-primary/20 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              How It Works
            </CardTitle>
            <CardDescription>
              Our AI guides you through a proven 6-step copywriting process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                { step: 1, title: "Product Description", desc: "Describe what you're promoting" },
                { step: 2, title: "Value Proposition", desc: "Define the main transformation" },
                { step: 3, title: "Pain Points", desc: "Identify audience struggles" },
                { step: 4, title: "Handle Objections", desc: "Address common concerns" },
                { step: 5, title: "Unique Differentiators", desc: "What sets you apart" },
                { step: 6, title: "Generate Copy", desc: "Create compelling ad variations" }
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1 flex h-6 w-6 items-center justify-center rounded-full p-0 text-xs">
                    {item.step}
                  </Badge>
                  <div>
                    <h4 className="font-semibold text-foreground">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Wizard - Lazy loaded for performance */}
        <Suspense fallback={<CardSkeleton />}>
          <AdCopyWizard />
        </Suspense>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default AdCopyGenerator;