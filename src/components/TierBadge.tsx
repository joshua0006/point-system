import { cn } from "@/lib/utils";

export type TierType = "bronze" | "silver" | "gold" | "platinum";

interface TierBadgeProps {
  tier: TierType;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const tierConfig = {
  bronze: {
    label: "Bronze",
    className: "bg-tier-bronze text-white",
  },
  silver: {
    label: "Silver", 
    className: "bg-tier-silver text-white",
  },
  gold: {
    label: "Gold",
    className: "bg-tier-gold text-foreground font-semibold",
  },
  platinum: {
    label: "Platinum",
    className: "bg-tier-platinum text-white",
  },
};

const sizeClasses = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-1.5 text-sm", 
  lg: "px-4 py-2 text-base",
};

export function TierBadge({ tier, size = "md", className }: TierBadgeProps) {
  const config = tierConfig[tier];
  
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium transition-all",
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {config.label}
    </span>
  );
}