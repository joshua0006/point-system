import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  loading?: boolean;
  className?: string;
  variant?: 'default' | 'primary' | 'success' | 'accent';
}

const variantClasses = {
  default: "",
  primary: "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground",
  success: "bg-gradient-to-br from-success to-success/80 text-success-foreground", 
  accent: "bg-gradient-to-br from-accent to-accent/80 text-accent-foreground",
};

const skeletonClasses = {
  default: "",
  primary: "bg-primary-foreground/20",
  success: "bg-success-foreground/20",
  accent: "bg-accent-foreground/20",
};

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  loading, 
  className,
  variant = 'default' 
}: StatsCardProps) {
  return (
    <Card className={cn(variantClasses[variant], className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          {title}
          {Icon && <Icon className="w-4 h-4" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className={cn("h-8 w-20 mb-2", skeletonClasses[variant])} />
        ) : (
          <div className="text-2xl font-bold">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
        )}
        {subtitle && (
          <p className={cn(
            "text-xs",
            variant === 'default' ? "text-muted-foreground" : "opacity-90"
          )}>
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}