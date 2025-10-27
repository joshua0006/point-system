import React, { useContext, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, AuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, AlertCircle, CheckCircle, XCircle, LogOut } from '@/lib/icons';
import { mark, measure, now } from '@/utils/performance';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Check if AuthContext is available first
  const authContext = useContext(AuthContext);
  const { user, profile, loading, signOut } = authContext || {};

  // ✅ ALL HOOKS AT THE TOP (Rules of Hooks compliance)
  // Performance tracking - runs on mount
  useEffect(() => {
    mark('protected-route-start');
    console.log('[PERF] 🔐 ProtectedRoute guard evaluation:', now().toFixed(2), 'ms');
  }, []);

  // Track loading state
  useEffect(() => {
    if (loading) {
      mark('protected-route-loading');
      console.log('[PERF] 🔐 ProtectedRoute showing loading spinner:', now().toFixed(2), 'ms');
    }
  }, [loading]);

  // Track when guard passes (user authenticated and profile loaded)
  useEffect(() => {
    if (!loading && user && profile) {
      mark('protected-route-guard-passed');
      measure('ProtectedRoute Guard', 'protected-route-start', 'protected-route-guard-passed');
      console.log('[PERF] ✅ ProtectedRoute guard passed:', now().toFixed(2), 'ms');
    }
  }, [loading, user, profile]);

  // Track approval status screens
  useEffect(() => {
    if (profile?.approval_status === 'pending') {
      mark('protected-route-pending-approval');
      console.log('[PERF] ⏳ ProtectedRoute showing pending approval:', now().toFixed(2), 'ms');
    }
  }, [profile?.approval_status]);

  // NOW SAFE TO DO CONDITIONAL LOGIC AND RETURNS

  // If no auth context, redirect to auth page
  if (!authContext) {
    mark('protected-route-no-context');
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    mark('protected-route-no-user');
    return <Navigate to="/auth" replace />;
  }

  // Check if user needs approval
  if (profile && profile.approval_status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <CardTitle className="text-xl">Account Pending Approval</CardTitle>
            <CardDescription>
              Your account is currently under review by our administrators
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300">
                <Clock className="h-3 w-3 mr-1" />
                Pending Review
              </Badge>
              <p className="text-sm text-muted-foreground">
                We'll notify you via email once your account has been approved.
              </p>
            </div>
            
            <div className="pt-4 border-t">
              <Button 
                onClick={signOut} 
                variant="outline" 
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user was rejected
  if (profile && profile.approval_status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl">Account Not Approved</CardTitle>
            <CardDescription>
              Unfortunately, your account application was not approved
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Application Rejected
              </Badge>
              <p className="text-sm text-muted-foreground">
                Please contact support if you believe this was an error.
              </p>
            </div>
            
            <div className="pt-4 border-t">
              <Button 
                onClick={signOut} 
                variant="outline" 
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user exists but profile is missing, show profile creation/error state
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl">Profile Setup Issue</CardTitle>
            <CardDescription>
              We're having trouble loading your profile data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Profile Not Found
              </Badge>
              <p className="text-sm text-muted-foreground">
                Your account was created but your profile couldn't be loaded. This usually resolves by signing out and back in. If the issue persists, please contact support.
              </p>
            </div>

            <div className="pt-4 border-t space-y-2">
              <Button
                onClick={signOut}
                variant="outline"
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out & Try Again
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Check your browser console for error details if this persists
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;