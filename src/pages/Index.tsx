
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Users, Clock, ArrowRight, Wallet, Shield, Search, TrendingUp, MessageSquare, Award, Target, Zap, CheckCircle, Gift, Heart, Coins } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import heroImage from "@/assets/hero-consulting.jpg";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is authenticated and page has loaded, redirect to marketplace
    if (!loading && user) {
      console.log('Authenticated user detected on index page, redirecting to marketplace...');
      navigate('/marketplace', { replace: true });
    }
  }, [user, loading, navigate]);

  // Show loading while auth is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, don't render the marketing page (redirect will happen via useEffect)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl text-foreground">ConsultHub</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link to="/auth">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth">Start Free Trial</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-foreground mb-6">
                Connect with Singapore's
                <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> 
                  Top Financial Consultants
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Access expert financial advisory services from licensed professionals across Singapore. 
                Get personalized guidance for investments, insurance, wealth planning, and business finance.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Button size="lg" className="px-8" asChild>
                  <Link to="/marketplace">
                    Browse Marketplace <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="px-8" asChild>
                  <Link to="/auth">Join as Consultant</Link>
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mx-auto mb-2">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">100+</div>
                  <div className="text-sm text-muted-foreground">Licensed Advisors</div>
                </div>
                <div>
                  <div className="flex items-center justify-center w-12 h-12 bg-accent/10 rounded-lg mx-auto mb-2">
                    <Star className="w-6 h-6 text-accent" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">4.8</div>
                  <div className="text-sm text-muted-foreground">Average Rating</div>
                </div>
                <div>
                  <div className="flex items-center justify-center w-12 h-12 bg-success/10 rounded-lg mx-auto mb-2">
                    <Clock className="w-6 h-6 text-success" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">SGD</div>
                  <div className="text-sm text-muted-foreground">Local Currency</div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl blur-2xl"></div>
              <img 
                src={heroImage} 
                alt="Professional consultants collaborating"
                className="relative rounded-2xl shadow-2xl w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Key Features Section */}
      <div className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-6">
              Complete Financial Advisory Ecosystem
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to connect with Singapore's finest financial advisors, 
              from wealth management to business financing solutions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center p-6">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl mb-2">Smart Advisor Matching</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Find licensed financial advisors by specialization - wealth management, insurance, 
                  investment planning, or business finance. All MAS-regulated professionals.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardHeader>
                <div className="w-16 h-16 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-accent" />
                </div>
                <CardTitle className="text-xl mb-2">Secure Consultations</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Book secure video consultations or in-person meetings. All communications 
                  are encrypted and compliant with Singapore's financial regulations.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardHeader>
                <div className="w-16 h-16 bg-success/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-success" />
                </div>
                <CardTitle className="text-xl mb-2">Portfolio Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Monitor your financial journey with comprehensive portfolio tracking. 
                  View all your investments, policies, and financial goals in one place.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardHeader>
                <div className="w-16 h-16 bg-warning/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-warning" />
                </div>
                <CardTitle className="text-xl mb-2">Instant Advisory Booking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Book financial consultations instantly. From investment reviews to 
                  insurance planning - get expert advice when you need it most.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl mb-2">Financial Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Track your financial progress with detailed analytics. Monitor investment 
                  performance, insurance coverage, and overall wealth growth.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardHeader>
                <div className="w-16 h-16 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-accent" />
                </div>
                <CardTitle className="text-xl mb-2">MAS Regulated</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  All advisors are MAS-licensed and verified. Enjoy complete data protection, 
                  secure transactions, and regulatory compliance you can trust.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Journey Section */}
      <div className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-6">
              Your Financial Journey Starts Here
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
              Begin your path to financial success with Singapore's most trusted advisory platform. 
              Connect with licensed professionals and build your wealth systematically.
            </p>
            <div className="flex items-center justify-center gap-2 text-success font-semibold">
              <Gift className="w-5 h-5" />
              <span>100% Free to Start • No Credit Card Required</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                01
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Discover Advisors</h3>
              <p className="text-muted-foreground mb-4">
                Browse Singapore's top financial advisors. Review their expertise, certifications, 
                and client testimonials to find the perfect match for your financial goals.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-success">
                <CheckCircle className="w-4 h-4" />
                <span>Free starter points included</span>
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                02
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Get Expert Advice</h3>
              <p className="text-muted-foreground mb-4">
                Book consultations with MAS-licensed advisors. Get personalized financial strategies, 
                investment recommendations, and comprehensive wealth planning tailored to you.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-primary">
                <Target className="w-4 h-4" />
                <span>Expert guidance on demand</span>
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                03
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Build Your Wealth</h3>
              <p className="text-muted-foreground mb-4">
                Implement your personalized financial plan with ongoing support. Track your progress, 
                adjust strategies, and watch your wealth grow with expert guidance.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-accent">
                <Heart className="w-4 h-4" />
                <span>Help others while earning rewards</span>
              </div>
            </div>
          </div>

          {/* Community Impact Section */}
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-8 max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Join Singapore's Premier Financial Network
              </h3>
              <p className="text-muted-foreground mb-6">
                Connect with like-minded individuals building wealth in Singapore. Share insights, 
                learn from others, and grow your financial knowledge within our trusted community.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div className="flex items-center gap-2 justify-center">
                  <Coins className="w-5 h-5 text-warning" />
                  <span>Earn points for every consultation</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <Users className="w-5 h-5 text-primary" />
                  <span>Build your professional network</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <TrendingUp className="w-5 h-5 text-success" />
                  <span>Grow your reputation and skills</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-6">
              Trusted by Singapore's Financial Community
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See how individuals and businesses across Singapore are achieving their financial goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 fill-accent text-accent" />
                  ))}
                </div>
                <blockquote className="text-foreground mb-4 italic">
                  "My advisor helped me diversify my portfolio and plan for my retirement. 
                  I've achieved a 15% annual return and feel confident about my financial future."
                </blockquote>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold mr-3">
                    LT
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Li Wei Tan</div>
                    <div className="text-sm text-muted-foreground">Senior Engineer, Marina Bay</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 fill-accent text-accent" />
                  ))}
                </div>
                <blockquote className="text-foreground mb-4 italic">
                  "The business finance advisor helped me secure funding for my restaurant expansion. 
                  Professional, knowledgeable, and truly understands the Singapore market."
                </blockquote>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center text-white font-bold mr-3">
                    PR
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Priya Raj</div>
                    <div className="text-sm text-muted-foreground">Team Manager at Growth Marketing Inc</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 fill-accent text-accent" />
                  ))}
                </div>
                <blockquote className="text-foreground mb-4 italic">
                  "Finally, a platform that makes finding expert consultants simple and 
                  effective. The insights we gained were invaluable."
                </blockquote>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-white font-bold mr-3">
                    ER
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Emily Rodriguez</div>
                    <div className="text-sm text-muted-foreground">Operations Manager at ServicePro LLC</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of businesses who have found their perfect consultant match. 
            Start your free trial today and discover expert guidance tailored to your needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" className="px-8 text-lg" asChild>
              <Link to="/auth">
                Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="px-8 text-lg" asChild>
              <Link to="/marketplace">
                Explore Marketplace
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            No credit card required • Cancel anytime • 14-day free trial
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl text-foreground">ConsultHub</span>
              </div>
              <p className="text-muted-foreground mb-4">
                Transform your business with expert consulting and real-time performance insights.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/marketplace" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link to="/auth" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link to="/marketplace" className="hover:text-foreground transition-colors">Integrations</Link></li>
                <li><Link to="/marketplace" className="hover:text-foreground transition-colors">Security</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Company</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link to="/" className="hover:text-foreground transition-colors">Careers</Link></li>
                <li><Link to="/" className="hover:text-foreground transition-colors">Contact</Link></li>
                <li><Link to="/" className="hover:text-foreground transition-colors">Blog</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Get Started Today</h3>
              <p className="text-muted-foreground mb-4">
                Join thousands of teams already boosting their performance.
              </p>
              <Button className="w-full" asChild>
                <Link to="/auth">Start Free Trial</Link>
              </Button>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-muted-foreground mb-4 md:mb-0">
              © 2024 ConsultHub. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link to="/" className="hover:text-foreground transition-colors">Terms of Service</Link>
              <Link to="/" className="hover:text-foreground transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
