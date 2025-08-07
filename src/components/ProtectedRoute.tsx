import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, AlertCircle, CheckCircle, XCircle, LogOut } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, profile, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
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
            <CardTitle className="text-xl">Profile Missing</CardTitle>
            <CardDescription>
              Your account exists but profile data is missing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Profile Not Found
              </Badge>
              <p className="text-sm text-muted-foreground">
                There was an issue setting up your profile. Please try signing out and signing up again.
              </p>
            </div>
            
            <div className="pt-4 border-t">
              <Button 
                onClick={signOut} 
                variant="outline" 
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out & Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;