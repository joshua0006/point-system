import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();

  useEffect(() => {
    // If user is already logged in and not loading, redirect immediately
    if (!loading && user) {
      console.log('User already logged in, redirecting to home...');
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleQuickDemo = async (accountType: 'buyer' | 'consultant') => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const demoEmail = `demo-${accountType}@demo.com`;
      const demoPassword = 'demo123456';
      
      console.log(`Starting demo login for: ${demoEmail}`);
      
      // First try to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      if (signInError) {
        console.log('Demo account does not exist, creating it...', signInError.message);
        
        // Create the account
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: demoEmail,
          password: demoPassword,
          options: {
            data: {
              full_name: accountType === 'consultant' ? 'Demo Consultant' : 'Demo Buyer',
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (signUpError) {
          throw signUpError;
        }

        console.log('Demo account created, attempting sign in...');
        
        // Now sign in
        const { error: finalSignInError } = await supabase.auth.signInWithPassword({
          email: demoEmail,
          password: demoPassword,
        });

        if (finalSignInError) {
          throw finalSignInError;
        }
      }

      console.log('Demo login successful, user should be redirected by useEffect');
      
      toast({
        title: "Demo Login Successful!",
        description: `Welcome as a demo ${accountType}.`,
      });
      
    } catch (err: any) {
      console.error('Demo login error:', err);
      toast({
        title: "Demo Login Error",
        description: err.message || "Failed to access demo account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      toast({
        title: "Account Created!",
        description: "Please check your email to confirm your account.",
      });
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log(`Attempting sign in for: ${email}`);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }

      console.log('Sign in successful');
      
      toast({
        title: "Login Successful!",
        description: "Welcome back!",
      });
      
      navigate('/');
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while auth context is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-2 inline-flex items-center gap-2 bg-accent/10 text-accent-foreground px-3 py-1 rounded-full text-sm font-medium">
            🚀 Demo Mode Active
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            ConsultHub
          </CardTitle>
          <CardDescription>
            No registration required - Use quick demo accounts below or enter any credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            {/* Quick Demo Access */}
            <div className="my-6 p-4 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/25">
              <p className="text-sm text-muted-foreground mb-3 text-center">
                Quick Demo Access - Click to try instantly:
              </p>
              <div className="grid grid-cols-1 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleQuickDemo('buyer')}
                  disabled={isLoading}
                >
                  🛍️ Demo Buyer Account
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleQuickDemo('consultant')}
                  disabled={isLoading}
                >
                  💼 Demo Consultant Account
                </Button>
              </div>
            </div>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
