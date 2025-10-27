import { useState, useEffect } from 'react';
import { X, RotateCcw } from '@/lib/icons';
import { Button } from './button';
import { Card } from './card';

interface UndoToastProps {
  open: boolean;
  onClose: () => void;
  onUndo: () => void;
  message: string;
  duration?: number;
}

export function UndoToast({ open, onClose, onUndo, message, duration = 10000 }: UndoToastProps) {
  const [timeLeft, setTimeLeft] = useState(duration / 1000);

  useEffect(() => {
    if (!open) return;
    
    setTimeLeft(duration / 1000);
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, duration, onClose]);

  if (!open) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-2">
      <Card className="bg-destructive text-destructive-foreground p-4 shadow-lg min-w-[300px] max-w-[500px]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="text-sm font-medium">{message}</div>
            <div className="text-xs opacity-75">
              Auto-closes in {timeLeft}s
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onUndo}
              className="bg-destructive-foreground text-destructive hover:bg-destructive-foreground/90 border-destructive-foreground/20"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              UNDO
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 text-destructive-foreground hover:bg-destructive-foreground/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-2 w-full bg-destructive-foreground/20 rounded-full h-1">
          <div 
            className="bg-destructive-foreground h-1 rounded-full transition-all duration-1000 ease-linear"
            style={{ 
              width: `${(timeLeft / (duration / 1000)) * 100}%` 
            }}
          />
        </div>
      </Card>
    </div>
  );
}