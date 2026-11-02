import { useRoute, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Clock, 
  Star,
  Shield,
  UserPlus,
  LogIn,
  ArrowLeft,
  Check
} from 'lucide-react';
import { Link } from 'wouter';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { useMobile } from '@/hooks/use-mobile';
import MobileHeader from '@/components/mobile-header';
import { useToast } from '@/hooks/use-toast';
import { tj } from "@/i18n-jsx/tj";

export default function BusinessClaimAuth() {
  const [, params] = useRoute('/business/:id/claim-auth');
  const [, navigate] = useLocation();
  const businessId = parseInt(params?.id || '0');
  const { toast } = useToast();
  const isMobile = useMobile();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Get business details
  const { data: business, isLoading: businessLoading } = useQuery({
    queryKey: ['/api/businesses', businessId],
    enabled: !!businessId
  }) as { data: any, isLoading: boolean };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
        credentials: 'include' // Important for session cookies
      });
      
      if (response.ok) {
        const result = await response.json();
        localStorage.setItem('claimBusinessAfterLogin', `/business/${businessId}/claim`);
        toast({
          title: "Login successful!",
          description: "Redirecting to business claim form...",
        });
        setShowLoginDialog(false);
        // Force page reload to refresh authentication state
        window.location.href = `/business/${businessId}/claim`;
      } else {
        const error = await response.json();
        toast({
          title: "Login failed",
          description: error.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    
    setIsRegistering(true);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          email: registerData.email,
          password: registerData.password
        }),
        credentials: 'include' // Important for session cookies
      });
      
      if (response.ok) {
        const result = await response.json();
        localStorage.setItem('claimBusinessAfterLogin', `/business/${businessId}/claim`);
        toast({
          title: "Registration successful!",
          description: "Redirecting to business claim form...",
        });
        setShowRegisterDialog(false);
        // Force page reload to refresh authentication state
        window.location.href = `/business/${businessId}/claim`;
      } else {
        const error = await response.json();
        toast({
          title: "Registration failed",
          description: error.message || "Failed to create account",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  if (businessLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-[-0.03em] text-[#0A0A0A] mb-2">Business Not Found</h1>
          <p className="text-[#4B5565] mb-4">The business you're trying to claim could not be found.</p>
          <Link href="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      {isMobile ? <MobileHeader /> : <Header />}
      
      <div className="py-10 sm:py-14">
        <div className="yp-wrap max-w-[1040px]">
          {/* Header */}
          <div className="mb-8">
            <Link href={`/business/${business.slug || businessId}`}>
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 me-2" />
                Back to Business
              </Button>
            </Link>
            <div className="yp-label !text-[#0B6B2E] mb-3">Claim a listing</div>
            <h1 className="yp-h2 text-[#0A0A0A] m-0">Claim Your Business</h1>
            <p className="yp-lead mt-3 mb-0">{tj("Authenticate to proceed with claiming {0}", business.name)}</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Authentication Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Sign In Required
                  </CardTitle>
                  <CardDescription>
                    Please log in or create an account to claim this business
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="yp-tint rounded-[14px] p-4">
                    <h3 className="font-semibold text-[#0A0A0A] mb-2">Why do I need to sign in?</h3>
                    <ul className="text-sm text-[#3A4354] space-y-2">
                      <li className="flex items-start gap-2"><Check className="h-4 w-4 mt-0.5 shrink-0 text-[#0B6B2E]" aria-hidden="true" />Verify your identity as the business owner</li>
                      <li className="flex items-start gap-2"><Check className="h-4 w-4 mt-0.5 shrink-0 text-[#0B6B2E]" aria-hidden="true" />Secure your business information</li>
                      <li className="flex items-start gap-2"><Check className="h-4 w-4 mt-0.5 shrink-0 text-[#0B6B2E]" aria-hidden="true" />Manage your listing and respond to reviews</li>
                      <li className="flex items-start gap-2"><Check className="h-4 w-4 mt-0.5 shrink-0 text-[#0B6B2E]" aria-hidden="true" />Track analytics and customer engagement</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <Button 
                      onClick={() => setShowLoginDialog(true)}
                      className="w-full h-12 rounded-xl text-[15px]"
                      size="lg"
                    >
                      <LogIn className="h-4 w-4 me-2" />
                      Log In to Claim Business
                    </Button>

                    <div className="text-center text-sm text-[#5B6475]">
                      Don't have an account?
                    </div>

                    <Button 
                      onClick={() => setShowRegisterDialog(true)}
                      variant="outline" 
                      className="w-full h-12 rounded-xl text-[15px]"
                      size="lg"
                    >
                      <UserPlus className="h-4 w-4 me-2" />
                      Create Account & Claim
                    </Button>
                  </div>

                  <div className="text-xs text-[#5B6475] text-center">
                    After logging in, you'll be redirected back to complete your business claim
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Business Details Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Business You're Claiming
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Business Header */}
                  <div className="text-center border-b pb-4">
                    <h2 className="text-xl font-bold tracking-[-0.02em] text-[#0A0A0A]">{business.name}</h2>
                    {business.categories && business.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-center mt-2">
                        {business.categories.slice(0, 2).map((category: any, index: number) => (
                          <Badge key={index} variant="secondary" className="yp-tag-green text-xs">
                            {category.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Business Details */}
                  <div className="space-y-3">
                    {business.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-[#5B6475] mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-[#3A4354]">{business.address}</span>
                      </div>
                    )}

                    {business.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-[#5B6475] flex-shrink-0" />
                        <span className="text-sm text-[#3A4354]">{business.phone}</span>
                      </div>
                    )}

                    {business.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-[#5B6475] flex-shrink-0" />
                        <span className="text-sm text-[#3A4354]">{business.email}</span>
                      </div>
                    )}

                    {business.website && (
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-[#5B6475] flex-shrink-0" />
                        <a 
                          href={business.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-[#0B6B2E] hover:text-[#05501F]"
                        >
                          Visit Website
                        </a>
                      </div>
                    )}

                    {business.workingHours && (
                      <div className="flex items-start gap-3">
                        <Clock className="h-4 w-4 text-[#5B6475] mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-[#3A4354]">
                          <div className="font-medium">Working Hours</div>
                          <div className="text-[#4B5565]">{business.workingHours}</div>
                        </div>
                      </div>
                    )}

                    {business.averageRating && (
                      <div className="flex items-center gap-3">
                        <Star className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B] flex-shrink-0" />
                        <span className="text-sm text-[#3A4354]">{tj("{0} stars ({1} reviews)", business.averageRating, business.reviewCount || 0)}</span>
                      </div>
                    )}
                  </div>

                  {/* Claim Benefits */}
                  <div className="yp-panel p-4 mt-6">
                    <h3 className="font-semibold text-[#0A0A0A] mb-2">What you'll get:</h3>
                    <ul className="text-sm text-[#3A4354] space-y-2">
                      <li className="flex items-start gap-2"><Check className="h-4 w-4 mt-0.5 shrink-0 text-[#0B6B2E]" aria-hidden="true" />Update business information and photos</li>
                      <li className="flex items-start gap-2"><Check className="h-4 w-4 mt-0.5 shrink-0 text-[#0B6B2E]" aria-hidden="true" />Respond to customer reviews</li>
                      <li className="flex items-start gap-2"><Check className="h-4 w-4 mt-0.5 shrink-0 text-[#0B6B2E]" aria-hidden="true" />Access business analytics</li>
                      <li className="flex items-start gap-2"><Check className="h-4 w-4 mt-0.5 shrink-0 text-[#0B6B2E]" aria-hidden="true" />Promote special offers</li>
                      <li className="flex items-start gap-2"><Check className="h-4 w-4 mt-0.5 shrink-0 text-[#0B6B2E]" aria-hidden="true" />Verified business badge</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
      
      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log In to Claim Business</DialogTitle>
            <DialogDescription>{tj("Sign in to your account to proceed with claiming {0}", business.name)}</DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter your password"
                required
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowLoginDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoggingIn}
                className="flex-1"
              >
                {isLoggingIn ? "Logging in..." : "Log In"}
              </Button>
            </div>
          </form>
          
          <div className="text-center text-sm text-[#5B6475] mt-4">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => {
                setShowLoginDialog(false);
                setShowRegisterDialog(true);
              }}
              className="font-semibold text-[#0B6B2E] hover:text-[#05501F]"
            >
              Create one here
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Register Dialog */}
      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Account & Claim Business</DialogTitle>
            <DialogDescription>{tj("Create your account to claim {0}", business.name)}</DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="register-first-name">First Name</Label>
                <Input
                  id="register-first-name"
                  value={registerData.firstName}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="First name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-last-name">Last Name</Label>
                <Input
                  id="register-last-name"
                  value={registerData.lastName}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Last name"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="register-email">Email</Label>
              <Input
                id="register-email"
                type="email"
                value={registerData.email}
                onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="register-password">Password</Label>
              <Input
                id="register-password"
                type="password"
                value={registerData.password}
                onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Create a password"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="register-confirm-password">Confirm Password</Label>
              <Input
                id="register-confirm-password"
                type="password"
                value={registerData.confirmPassword}
                onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm your password"
                required
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRegisterDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isRegistering}
                className="flex-1"
              >
                {isRegistering ? "Creating..." : "Create Account"}
              </Button>
            </div>
          </form>
          
          <div className="text-center text-sm text-[#5B6475] mt-4">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => {
                setShowRegisterDialog(false);
                setShowLoginDialog(true);
              }}
              className="font-semibold text-[#0B6B2E] hover:text-[#05501F]"
            >
              Sign in here
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}