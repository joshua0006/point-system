import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Calendar, AlertCircle, CheckCircle } from '@/lib/icons';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const AdminServiceBilling = memo(function AdminServiceBilling() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const handleProcessBilling = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-admin-service-billing');
      
      if (error) {
        console.error('Billing process error:', error);
        toast.error('Failed to process service billing');
        return;
      }

      setLastRun(new Date());
      toast.success(`Billing processed successfully! ${data.processed} assignments processed`);
      
      if (data.errors > 0) {
        toast.warning(`${data.errors} errors occurred during processing`);
      }
    } catch (error) {
      console.error('Error processing billing:', error);
      toast.error('Failed to process service billing');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <Calendar className="h-5 w-5 shrink-0" />
          <span>Admin Service Billing</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">
              Process monthly billing for admin-assigned VA Support and Cold Calling services
            </p>
            {lastRun && (
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <CheckCircle className="h-3 w-3" />
                Last run: {lastRun.toLocaleString()}
              </div>
            )}
          </div>
          <Button
            onClick={handleProcessBilling}
            disabled={isProcessing}
            size="sm"
            className="w-full sm:w-auto"
          >
            <Play className="h-4 w-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Run Billing'}
          </Button>
        </div>

        <div className="p-3 sm:p-4 bg-muted rounded-lg">
          <div className="flex items-start gap-2 sm:gap-3">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <div className="text-sm text-muted-foreground min-w-0">
              <p className="font-medium text-foreground mb-1 sm:mb-2">Billing Process:</p>
              <ul className="space-y-1 text-xs sm:text-sm">
                <li>• Checks all active service assignments due for billing</li>
                <li>• Deducts credits from user accounts</li>
                <li>• Records billing transactions</li>
                <li>• Updates next billing dates</li>
                <li>• Handles insufficient balance cases gracefully</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});