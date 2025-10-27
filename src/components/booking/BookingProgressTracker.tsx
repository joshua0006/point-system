import { Check, Clock, Loader2 } from '@/lib/icons';
import { cn } from '@/lib/utils';

interface Step {
  label: string;
  status: 'completed' | 'pending' | 'loading';
  time: string;
}

interface BookingProgressTrackerProps {
  steps: Step[];
}

export function BookingProgressTracker({ steps }: BookingProgressTrackerProps) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={index} className="flex items-start gap-3">
          {/* Status Icon */}
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-500",
            step.status === 'completed' 
              ? "bg-success border-success text-success-foreground" 
              : step.status === 'loading'
              ? "bg-primary/10 border-primary text-primary"
              : "bg-muted border-muted-foreground/30 text-muted-foreground"
          )}>
            {step.status === 'completed' ? (
              <Check className="w-4 h-4" />
            ) : step.status === 'loading' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Clock className="w-4 h-4" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className={cn(
                "text-sm font-medium transition-colors duration-300",
                step.status === 'completed' ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.label}
              </p>
              <span className="text-xs text-muted-foreground">{step.time}</span>
            </div>
            
            {/* Progress indicator */}
            {step.status === 'loading' && (
              <div className="mt-1">
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
              </div>
            )}
          </div>

          {/* Connector line */}
          {index < steps.length - 1 && (
            <div className={cn(
              "absolute left-4 top-8 w-0.5 h-6 transition-colors duration-500",
              step.status === 'completed' ? "bg-success" : "bg-muted"
            )} style={{ marginLeft: '-1px' }} />
          )}
        </div>
      ))}
    </div>
  );
}