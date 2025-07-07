
import { Switch } from '@/components/ui/switch';
import { TrendingUp, ShoppingCart } from 'lucide-react';

interface ChatModeToggleProps {
  isSellingMode: boolean;
  onModeChange: (isSellingMode: boolean) => void;
}

export function ChatModeToggle({ isSellingMode, onModeChange }: ChatModeToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm">
        <ShoppingCart className={`w-4 h-4 ${!isSellingMode ? 'text-primary' : 'text-muted-foreground'}`} />
        <span className={!isSellingMode ? 'text-foreground font-medium' : 'text-muted-foreground'}>
          Buying
        </span>
      </div>
      
      <Switch
        checked={isSellingMode}
        onCheckedChange={onModeChange}
        className="data-[state=checked]:bg-success"
      />
      
      <div className="flex items-center gap-2 text-sm">
        <TrendingUp className={`w-4 h-4 ${isSellingMode ? 'text-success' : 'text-muted-foreground'}`} />
        <span className={isSellingMode ? 'text-foreground font-medium' : 'text-muted-foreground'}>
          Selling
        </span>
      </div>
    </div>
  );
}
