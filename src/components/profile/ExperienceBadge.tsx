
import { Badge } from "@/components/ui/badge";
import { ExperienceLevelInfo } from "@/utils/profileUtils";
import { cn } from "@/lib/utils";

interface ExperienceBadgeProps {
  experienceLevel: ExperienceLevelInfo;
  className?: string;
}

export function ExperienceBadge({ experienceLevel, className }: ExperienceBadgeProps) {
  return (
    <Badge 
      className={cn(
        "text-white font-medium",
        experienceLevel.color,
        className
      )}
    >
      {experienceLevel.label}
    </Badge>
  );
}
