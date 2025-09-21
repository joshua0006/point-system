import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function FixUpgradeButton({ userId }: { userId: string }) {
  const [fixing, setFixing] = useState(false);
  const { toast } = useToast();

  const handleFix = async () => {
    setFixing(true);
    try {
      const { data, error } = await supabase.functions.invoke('fix-upgrade-credits', {
        body: {
          userId,
          missingCredits: 400,
          description: "Correction: Missing credits from Pro 5 to Pro 10 upgrade (should be +500 not +100)"
        }
      });

      if (error) throw error;

      toast({
        title: "Credits Fixed!",
        description: `Added missing 400 credits. You now have the correct Pro 10 credits.`,
      });

      // Refresh the page to show updated balance
      setTimeout(() => window.location.reload(), 1000);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fix credits",
        variant: "destructive"
      });
    } finally {
      setFixing(false);
    }
  };

  return (
    <Button onClick={handleFix} disabled={fixing} variant="outline" className="bg-yellow-50 border-yellow-200 hover:bg-yellow-100">
      {fixing ? "Fixing..." : "Fix Missing Pro 10 Credits (+400)"}
    </Button>
  );
}