import { memo } from 'react';
import { OptimizedCard, OptimizedCardContent } from "@/components/ui/optimized-card";
import { Heart, MessageCircle, Share } from "lucide-react";
import { cn } from "@/lib/utils";

interface FacebookAdMockupProps {
  adContent: {
    title: string;
    description: string;
    ad_copy: string;
    cta: string;
    offer?: string;
  };
  className?: string;
}

export const FacebookAdMockup = memo(function FacebookAdMockup({ adContent, className }: FacebookAdMockupProps) {
  return (
    <OptimizedCard className={cn("w-full max-w-md bg-card", className)}>
      <OptimizedCardContent className="p-0">
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">YB</span>
          </div>
          <div>
            <div className="font-semibold text-sm text-gray-900">Your Business</div>
            <div className="text-xs text-gray-500">Sponsored • 🌎</div>
          </div>
        </div>

        {/* Ad Content */}
        <div className="p-4">
          <p className="text-sm text-gray-800 leading-relaxed mb-3">
            {adContent.ad_copy}
          </p>
        </div>

        {/* Image Placeholder */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/20 h-48 flex items-center justify-center mx-4 rounded-lg mb-4">
          <div className="text-center">
            <div className="text-primary font-semibold text-lg">{adContent.title}</div>
            <div className="text-sm text-muted-foreground mt-1">{adContent.description}</div>
            {adContent.offer && (
              <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded mt-2 inline-block">
                {adContent.offer}
              </div>
            )}
          </div>
        </div>

        {/* CTA Button */}
        <div className="px-4 pb-4">
          <button className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors">
            {adContent.cta}
          </button>
        </div>

        {/* Facebook Engagement Bar */}
        <div className="border-t border-gray-100 px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <button className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
                <Heart className="h-4 w-4" />
                <span className="text-sm">Like</span>
              </button>
              <button className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm">Comment</span>
              </button>
              <button className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
                <Share className="h-4 w-4" />
                <span className="text-sm">Share</span>
              </button>
            </div>
          </div>
        </div>
      </OptimizedCardContent>
    </OptimizedCard>
  );
});