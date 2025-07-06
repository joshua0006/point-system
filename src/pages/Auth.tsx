import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkUser();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Demo mode - create actual demo accounts
      const demoEmail = `demo-${Date.now()}@demo.com`;
      const demoPassword = 'demo123456';
      
      const { data, error } = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPassword,
        options: {
          data: {
            full_name: fullName || 'Demo User',
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      toast({
        title: "Demo Account Created!",
        description: "Welcome to the demo marketplace.",
      });
      
      // Navigate after successful signup
      if (data.user) {
        navigate('/');
      }
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
      // For demo mode, we'll use predefined demo accounts or create new ones
      let demoEmail = email;
      let demoPassword = password;
      let isConsultantAccount = false;
      
      // If user enters demo credentials, use predefined accounts
      if (email.includes('demo') || email === '' || password === '') {
        demoEmail = `demo-buyer@demo.com`;
        demoPassword = 'demo123456';
      }

      // Check if it's a consultant demo account
      if (demoEmail.includes('consultant')) {
        isConsultantAccount = true;
      }

      // First try to sign in with existing account
      let { data, error } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      // If account doesn't exist, create it
      if (error && error.message.includes('Invalid login credentials')) {
        const signUpResult = await supabase.auth.signUp({
          email: demoEmail,
          password: demoPassword,
          options: {
            data: {
              full_name: isConsultantAccount ? 'Demo Consultant' : 'Demo Buyer',
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        
        if (signUpResult.error) throw signUpResult.error;
        data = signUpResult.data;

        // Set up demo data for new accounts
        if (data.user) {
          try {
            await supabase.functions.invoke('setup-demo-data', {
              body: {
                userId: data.user.id,
                userEmail: demoEmail,
                isConsultant: isConsultantAccount
              }
            });
          } catch (setupError) {
            console.warn('Demo data setup failed:', setupError);
            // Don't block login if demo data setup fails
          }
        }
      } else if (error) {
        throw error;
      }

      toast({
        title: "Demo Login Successful!",
        description: `Welcome to the demo marketplace${isConsultantAccount ? ' as a consultant' : ''}.`,
      });
      
      // Navigate after successful login
      if (data.user) {
        navigate('/');
      }
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Consultant Marketplace
          </CardTitle>
          <CardDescription>
            🚀 Demo Mode - Enter any email/password or use quick demo accounts below
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
                  onClick={async () => {
                    setEmail('demo-buyer@demo.com');
                    setPassword('demo123456');
                    // Trigger sign in directly
                    setIsLoading(true);
                    try {
                      const demoEmail = 'demo-buyer@demo.com';
                      const demoPassword = 'demo123456';

                      let { data, error } = await supabase.auth.signInWithPassword({
                        email: demoEmail,
                        password: demoPassword,
                      });

                      if (error && error.message.includes('Invalid login credentials')) {
                        const signUpResult = await supabase.auth.signUp({
                          email: demoEmail,
                          password: demoPassword,
                          options: {
                            data: { full_name: 'Demo Buyer' },
                            emailRedirectTo: `${window.location.origin}/`,
                          },
                        });
                        
                        if (signUpResult.error) throw signUpResult.error;
                        data = signUpResult.data;
                      } else if (error) {
                        throw error;
                      }

                      toast({ title: "Demo Login Successful!", description: "Welcome as a demo buyer." });
                      if (data.user) navigate('/');
                    } catch (err: any) {
                      toast({ title: "Error", description: err.message, variant: "destructive" });
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                >
                  🛍️ Demo Buyer Account
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    setEmail('demo-consultant@demo.com');
                    setPassword('demo123456');
                    // Trigger sign in directly
                    setIsLoading(true);
                    try {
                      const demoEmail = 'demo-consultant@demo.com';
                      const demoPassword = 'demo123456';

                      let { data, error } = await supabase.auth.signInWithPassword({
                        email: demoEmail,
                        password: demoPassword,
                      });

                      if (error && error.message.includes('Invalid login credentials')) {
                        const signUpResult = await supabase.auth.signUp({
                          email: demoEmail,
                          password: demoPassword,
                          options: {
                            data: { full_name: 'Demo Consultant' },
                            emailRedirectTo: `${window.location.origin}/`,
                          },
                        });
                        
                        if (signUpResult.error) throw signUpResult.error;
                        data = signUpResult.data;

                        // Set up demo consultant data
                        if (data.user) {
                          try {
                            await supabase.functions.invoke('setup-demo-data', {
                              body: {
                                userId: data.user.id,
                                userEmail: demoEmail,
                                isConsultant: true
                              }
                            });
                          } catch (setupError) {
                            console.warn('Demo data setup failed:', setupError);
                          }
                        }
                      } else if (error) {
                        throw error;
                      }

                      toast({ title: "Demo Login Successful!", description: "Welcome as a demo consultant." });
                      if (data.user) navigate('/');
                    } catch (err: any) {
                      toast({ title: "Error", description: err.message, variant: "destructive" });
                    } finally {
                      setIsLoading(false);
                    }
                  }}
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