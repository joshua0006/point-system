
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useMode } from '@/contexts/ModeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp, User } from 'lucide-react';

export function ModeToggle() {
  const { isSellerMode, toggleMode, canAccessSellerMode } = useMode();
  const { profile } = useAuth();

  if (!profile) return null;

  if (!canAccessSellerMode) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm">
        <User className={`w-4 h-4 ${!isSellerMode ? 'text-primary' : 'text-muted-foreground'}`} />
        <span className={!isSellerMode ? 'text-foreground font-medium' : 'text-muted-foreground'}>
          Buyer
        </span>
      </div>
      
      <Switch
        checked={isSellerMode}
        onCheckedChange={toggleMode}
        className="data-[state=checked]:bg-success"
      />
      
      <div className="flex items-center gap-2 text-sm">
        <TrendingUp className={`w-4 h-4 ${isSellerMode ? 'text-success' : 'text-muted-foreground'}`} />
        <span className={isSellerMode ? 'text-foreground font-medium' : 'text-muted-foreground'}>
          Seller
        </span>
      </div>
    </div>
  );
}
