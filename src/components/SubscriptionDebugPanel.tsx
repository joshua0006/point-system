import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const SubscriptionDebugPanel = () => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const { user, subscription, refreshSubscription } = useAuth();
  const { toast } = useToast();

  const testSubscriptionFunction = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      console.log('🧪 Testing check-subscription function...');
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      const result = {
        success: !error,
        data: data,
        error: error,
        timestamp: new Date().toISOString()
      };
      
      setTestResult(result);
      
      if (error) {
        console.error('❌ Function test failed:', error);
        toast({
          title: "Function Test Failed",
          description: error.message || "Unknown error occurred",
          variant: "destructive"
        });
      } else {
        console.log('✅ Function test successful:', data);
        toast({
          title: "Function Test Successful",
          description: "Subscription function is working correctly"
        });
      }
    } catch (err: any) {
      console.error('❌ Function test error:', err);
      const result = {
        success: false,
        data: null,
        error: { message: err.message || 'Network or function error' },
        timestamp: new Date().toISOString()
      };
      setTestResult(result);
      
      toast({
        title: "Function Test Error",
        description: err.message || "Network or function error",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = () => {
    if (!testResult) return null;
    
    if (testResult.success) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    if (!testResult) return "secondary";
    return testResult.success ? "default" : "destructive";
  };

  return (
    <Card className="w-full border-2 border-dashed border-muted-foreground/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          🔧 Subscription System Debug
          {getStatusIcon()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">User Email:</span>
            <div className="font-mono text-xs break-all">{user?.email || 'Not logged in'}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Current Status:</span>
            <Badge variant={subscription?.subscribed ? "default" : "secondary"} className="ml-2">
              {subscription?.subscribed ? 'Subscribed' : 'Not Subscribed'}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={testSubscriptionFunction}
            disabled={testing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Testing...' : 'Test Function'}
          </Button>
          <Button
            onClick={refreshSubscription}
            variant="outline"
            size="sm"
          >
            Refresh Context
          </Button>
        </div>

        {testResult && (
          <div className="mt-4 p-3 rounded-lg bg-muted/30 border">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold">Test Result:</span>
              <Badge variant={getStatusColor()}>
                {testResult.success ? 'Success' : 'Failed'}
              </Badge>
            </div>
            
            {testResult.success ? (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Subscribed:</span>
                  <span className="ml-2 font-mono">{JSON.stringify(testResult.data?.subscribed)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Plan:</span>
                  <span className="ml-2 font-mono">{testResult.data?.plan_name || 'None'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Credits/Month:</span>
                  <span className="ml-2 font-mono">{testResult.data?.credits_per_month || 0}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">End Date:</span>
                  <span className="ml-2 font-mono text-xs">{testResult.data?.subscription_end || 'N/A'}</span>
                </div>
              </div>
            ) : (
              <div className="text-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-red-700">Error:</div>
                    <div className="font-mono text-xs text-red-600 break-all">
                      {testResult.error?.message || 'Unknown error'}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="text-xs text-muted-foreground mt-2">
              Tested at: {new Date(testResult.timestamp).toLocaleString()}
            </div>
          </div>
        )}

        {subscription && (
          <div className="mt-4 p-3 rounded-lg bg-primary/10 border">
            <div className="font-semibold mb-2">Current Context Data:</div>
            <pre className="text-xs font-mono bg-background p-2 rounded overflow-auto">
              {JSON.stringify(subscription, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};