import { memo, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, MessageSquare, Mail, Rocket, Target } from "lucide-react";

interface CampaignCardProps {
  title: string;
  description: string;
  audience: string;
  budgetRange: {
    min: number;
    max: number;
    recommended: number;
  };
  onLaunch: () => void;
  onViewScripts: () => void;
  metrics?: {
    leads?: number;
    cpl?: number;
    conversionRate?: number;
  };
}

const tierColors = {
  bronze: "bg-amber-100 text-amber-800 border-amber-200",
  silver: "bg-slate-100 text-slate-800 border-slate-200",
  gold: "bg-accent/10 text-accent border-accent/20"
};

export const CampaignCard = memo(function CampaignCard({
  title,
  description,
  audience,
  budgetRange,
  onLaunch,
  onViewScripts,
  metrics
}: CampaignCardProps) {
  const budgetTier = useMemo(() => {
    if (budgetRange.max <= 500) return "bronze";
    if (budgetRange.max <= 1000) return "silver";
    return "gold";
  }, [budgetRange.max]);

  const tierColor = useMemo(() => tierColors[budgetTier], [budgetTier]);

  return (
    <Card className="group rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 bg-card border-border h-[280px] flex flex-col">
      <CardContent className="p-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-xl shrink-0">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold tracking-tight text-foreground line-clamp-2 leading-tight">
              {title}
            </h3>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
              {audience}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
          {description}
        </p>

        {/* Budget Badge */}
        <div className="mb-4">
          <Badge
            variant="outline"
            className={`text-sm font-medium rounded-full px-3 py-1 border ${tierColor}`}
          >
            ${budgetRange.min}-${budgetRange.max}
          </Badge>
        </div>

        {/* Metrics Strip (if provided) */}
        {metrics && (
          <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-muted/30 rounded-xl">
            <div className="text-center">
              <div className="text-xs text-muted-foreground uppercase">Leads</div>
              <div className="text-sm font-medium text-foreground">{metrics.leads || '-'}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground uppercase">CPL</div>
              <div className="text-sm font-medium text-foreground">${metrics.cpl || '-'}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground uppercase">Conv%</div>
              <div className="text-sm font-medium text-foreground">{metrics.conversionRate || '-'}%</div>
            </div>
          </div>
        )}

        {/* Method Badges */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <Badge variant="outline" className="text-xs px-2 py-0.5 h-6">
            <Phone className="h-3 w-3 mr-1" />
            Call
          </Badge>
          <Badge variant="outline" className="text-xs px-2 py-0.5 h-6">
            <MessageSquare className="h-3 w-3 mr-1" />
            SMS
          </Badge>
          <Badge variant="outline" className="text-xs px-2 py-0.5 h-6">
            <Mail className="h-3 w-3 mr-1" />
            Email
          </Badge>
        </div>

        {/* Actions - Auto push to bottom */}
        <div className="mt-auto space-y-2">
          <Button 
            onClick={onViewScripts}
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs"
          >
            View Scripts
          </Button>
          <Button 
            onClick={onLaunch}
            className="w-full h-9 font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Rocket className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Launch Campaign</span>
            <span className="sm:hidden">Launch</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});