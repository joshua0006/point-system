import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";
import { format, addMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useServiceAssignments } from "@/hooks/useServiceAssignments";
import type { UserProfile } from "@/config/types";

interface ServiceAssignmentModalProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const VA_SUPPORT_LEVELS = [
  { value: "basic", label: "Basic VA Support", cost: 500 },
  { value: "standard", label: "Standard VA Support", cost: 1000 },
  { value: "comprehensive", label: "Comprehensive VA Support", cost: 2000 }
];

const COLD_CALLING_LEVELS = [
  { value: "20_hours", label: "20 Hours", cost: 800 },
  { value: "40_hours", label: "40 Hours", cost: 1500 },
  { value: "60_hours", label: "60 Hours", cost: 2200 },
  { value: "80_hours", label: "80 Hours", cost: 2800 }
];

export function ServiceAssignmentModal({ 
  user, 
  open, 
  onOpenChange, 
  onSuccess 
}: ServiceAssignmentModalProps) {
  const [serviceType, setServiceType] = useState<string>("");
  const [serviceLevel, setServiceLevel] = useState<string>("");
  const [nextBillingDate, setNextBillingDate] = useState<Date>();
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { assignService } = useServiceAssignments();

  const handleSubmit = async () => {
    if (!user || !serviceType || !serviceLevel || !nextBillingDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const levels = serviceType === "va_support" ? VA_SUPPORT_LEVELS : COLD_CALLING_LEVELS;
      const selectedLevel = levels.find(level => level.value === serviceLevel);
      
      if (!selectedLevel) {
        toast.error("Invalid service level selected");
        return;
      }

      await assignService({
        userId: user.user_id,
        serviceType,
        serviceLevel,
        monthlyCost: selectedLevel.cost,
        nextBillingDate,
        notes
      });

      toast.success(`${selectedLevel.label} assigned successfully`);
      onSuccess?.();
      onOpenChange(false);
      
      // Reset form
      setServiceType("");
      setServiceLevel("");
      setNextBillingDate(undefined);
      setNotes("");
    } catch (error) {
      console.error('Service assignment error:', error);
      toast.error("Failed to assign service");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getServiceLevels = () => {
    return serviceType === "va_support" ? VA_SUPPORT_LEVELS : COLD_CALLING_LEVELS;
  };

  const selectedServiceLevel = serviceType ? getServiceLevels().find(level => level.value === serviceLevel) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Assign Service to {user?.full_name || user?.email}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="service-type">Service Type *</Label>
            <Select value={serviceType} onValueChange={(value) => {
              setServiceType(value);
              setServiceLevel(""); // Reset service level when type changes
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="va_support">VA Support</SelectItem>
                <SelectItem value="cold_calling">Cold Calling</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {serviceType && (
            <div className="space-y-2">
              <Label htmlFor="service-level">Service Level *</Label>
              <Select value={serviceLevel} onValueChange={setServiceLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service level" />
                </SelectTrigger>
                <SelectContent>
                  {getServiceLevels().map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label} - {level.cost} credits/month
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Next Billing Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !nextBillingDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {nextBillingDate ? format(nextBillingDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={nextBillingDate}
                  onSelect={setNextBillingDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {selectedServiceLevel && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Monthly Cost</div>
              <div className="text-lg font-semibold text-primary">
                {selectedServiceLevel.cost.toLocaleString()} flexi credits
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about this assignment..."
              className="w-full min-h-[80px] px-3 py-2 border border-input bg-background rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !serviceType || !serviceLevel || !nextBillingDate}
          >
            {isSubmitting ? "Assigning..." : "Assign Service"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}