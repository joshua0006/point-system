
import { Badge } from '@/components/ui/badge';
import { TierBadge } from '@/components/TierBadge';
import type { TierType } from '@/components/TierBadge';

interface ConsultantTierBadgeProps {
  tier: TierType;
}

export function ConsultantTierBadge({ tier }: ConsultantTierBadgeProps) {
  return (
    <TierBadge tier={tier} size="md" />
  );
}
