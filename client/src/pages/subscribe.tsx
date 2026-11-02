import { useEffect, useState, useCallback } from 'react';
import { useLocation, useRoute } from 'wouter';
// Stripe imports temporarily disabled to prevent error overlay
// import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
// import { loadStripe } from '@stripe/stripe-js';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Check, Crown, Star, Building, AlertCircle, CreditCard } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SEO from '@/components/seo';
import { country } from "@shared/country";

// Stripe configuration - using hosted checkout as primary method due to CDN issues
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

// Stripe.js loading temporarily disabled to prevent error overlay
const loadStripeQuick = async (): Promise<any> => {
  return null; // Always return null to prevent Stripe loading errors
};

let stripePromise: Promise<any> | null = null;

// Stripe loading disabled - will use hosted checkout fallback

interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  yearlyPrice: number;
  currency: string;
  interval: string;
  features: string[];
  businessLimit: number;
  categoryLimit: number;
  subcategoryLimit: number;
  description: string;
  isPopular?: boolean;
}

const CheckoutForm = ({ plan, isYearly, clientSecret }: { plan: SubscriptionPlan; isYearly: boolean; clientSecret: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast({
        title: "Payment Error",
        description: "Payment system not ready. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/add-business-enhanced?subscription=success`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "Your subscription is now active!",
        });
        setLocation("/add-business-enhanced?subscription=success");
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing}
        size="lg"
      >
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing...
          </div>
        ) : (
          `Pay ${isYearly ? plan.yearlyPrice : plan.price} ${plan.currency}${isYearly ? '/month (billed yearly)' : '/month'}`
        )}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const [, params] = useRoute('/subscribe/:planId');
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const planId = params?.planId;
  const isYearly = searchParams.get('billing') === 'yearly';

  // Define plans first before using them in callbacks
  const plans: SubscriptionPlan[] = [
    {
      id: "premium",
      name: "premium",
      displayName: "Premium",
      price: 199,
      yearlyPrice: 159,
      currency: country.currency,
      interval: "month",
      businessLimit: 5,
      categoryLimit: 999,
      subcategoryLimit: 999,
      isPopular: true,
      description: "Most popular for growing businesses",
      features: [
        "5 Business listings",
        "Unlimited categories",
        "Premium badge",
        "Enhanced business profile",
        "Priority search ranking",
        "Advanced analytics",
        "Email & phone support",
        "Social media integration",
        "Logo upload",
        "Photo gallery (20 images)"
      ]
    },
    {
      id: "professional",
      name: "professional",
      displayName: "Professional",
      price: 599,
      yearlyPrice: 479,
      currency: country.currency,
      interval: "month",
      businessLimit: 25,
      categoryLimit: 999,
      subcategoryLimit: 999,
      description: "For established businesses",
      features: [
        "25 Business listings",
        "Unlimited categories",
        "Professional badge",
        "Enhanced business profile",
        "Top search placement",
        "Advanced analytics",
        "Priority email & phone support",
        "Social media integration",
        "Logo upload",
        "Photo gallery (50 images)",
        "Video uploads",
        "Document attachments",
        "QR code generation",
        "Review management tools"
      ]
    },
    {
      id: "enterprise",
      name: "enterprise",
      displayName: "Enterprise",
      price: 1299,
      yearlyPrice: 1039,
      currency: country.currency,
      interval: "month",
      businessLimit: 999,
      categoryLimit: 999,
      subcategoryLimit: 999,
      description: "For large organizations",
      features: [
        "Unlimited business listings",
        "Unlimited categories",
        "Enterprise badge",
        "Top search placement",
        "White-label solutions",
        "Dedicated account manager",
        "24/7 phone support",
        "Custom integrations",
        "Bulk upload tools",
        "Unlimited photo gallery",
        "Video & document uploads",
        "Advanced reporting",
        "Custom analytics",
        "Multi-user access"
      ]
    }
  ];

  const plan = plans.find(p => p.id === planId);

  // State management - simplified approach
  const [paymentState, setPaymentState] = useState<'idle' | 'loading' | 'processing' | 'error'>('idle');
  const [useHostedCheckout, setUseHostedCheckout] = useState(false);

  // Create Stripe checkout session - primary payment method
  const createStripeCheckoutSession = useCallback(async () => {
    if (!plan) return;
    
    setPaymentState('processing');
    
    try {
      console.log("Creating hosted checkout session for plan:", plan.id);
      
      toast({
        title: "Redirecting to Secure Payment",
        description: "Taking you to our secure payment page...",
      });

      const response = await apiRequest("POST", "/api/create-checkout-session", {
        planId: plan.id,
        interval: isYearly ? 'year' : 'month',
        amount: isYearly ? plan.yearlyPrice : plan.price,
        planName: plan.displayName,
        successUrl: `${window.location.origin}/add-business-enhanced?subscription=success&plan=${plan.id}`,
        cancelUrl: window.location.href
      });

      if (response.url) {
        window.location.href = response.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error: any) {
      console.error("Checkout session error:", error);
      setPaymentState('error');
      toast({
        title: "Payment Error",
        description: error.message || "Failed to create payment session",
        variant: "destructive",
      });
    }
  }, [plan, isYearly, toast]);

  // Auto-detect payment method and handle subscription
  useEffect(() => {
    const handlePayment = async () => {
      if (!plan || paymentState !== 'idle') return;

      setPaymentState('loading');

      // Stripe.js disabled - skip embedded form check

      // Fallback to hosted checkout
      console.log("Using hosted checkout");
      setUseHostedCheckout(true);
      
      // Show loading message briefly, then redirect
      toast({
        title: "Redirecting to Payment",
        description: "Taking you to secure payment page...",
      });

      setTimeout(() => {
        createStripeCheckoutSession();
      }, 1500);
    };

    if (plan) {
      handlePayment();
    } else {
      toast({
        title: "Invalid Plan",
        description: "Please select a valid subscription plan.",
        variant: "destructive",
      });
      setLocation("/add-business-enhanced");
    }
  }, [plan, paymentState, isYearly, createStripeCheckoutSession, toast, setLocation]);

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case "premium": return <span className="w-12 h-12 rounded-[14px] grid place-items-center bg-[#E8F4EC] text-[#0B6B2E] shrink-0"><Crown className="w-6 h-6" /></span>;
      case "professional": return <span className="w-12 h-12 rounded-[14px] grid place-items-center bg-[#E6F6F1] text-[#047857] shrink-0"><Star className="w-6 h-6" /></span>;
      case "enterprise": return <span className="w-12 h-12 rounded-[14px] grid place-items-center bg-[#FDECEC] text-[#B91C1C] shrink-0"><Building className="w-6 h-6" /></span>;
      default: return null;
    }
  };

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F3] px-6">
        <div className="yp-card p-8 md:p-10 text-center max-w-md w-full">
          <h1 className="text-3xl font-bold tracking-[-0.04em] mb-3">Invalid Plan</h1>
          <p className="text-[#4B5565] mb-6">Please select a valid subscription plan.</p>
          <Button onClick={() => setLocation("/add-business-enhanced")}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (paymentState === 'loading' || paymentState === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F3] px-6">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#0B6B2E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-medium text-[#0A0A0A]">
            {paymentState === 'processing' ? 'Redirecting to secure payment...' : 'Setting up payment...'}
          </p>
          <p className="text-sm text-[#5B6475] mt-2">Please wait a moment</p>
        </div>
      </div>
    );
  }

  if (paymentState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F3] px-6">
        <div className="yp-card p-8 md:p-10 text-center max-w-md w-full">
          <span className="w-12 h-12 rounded-[14px] grid place-items-center bg-[#FDECEC] text-[#B91C1C] mx-auto mb-5">
            <AlertCircle className="w-6 h-6" />
          </span>
          <h1 className="text-3xl font-bold tracking-[-0.04em] mb-3">Payment Setup Error</h1>
          <p className="text-[#4B5565] mb-6">We encountered an issue setting up your payment. Please try again.</p>
          <div className="flex flex-wrap justify-center gap-2.5">
            <Button onClick={() => createStripeCheckoutSession()}>
              Try Payment Again
            </Button>
            <Button onClick={() => setLocation("/add-business-enhanced")} variant="outline">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#0A0A0A] py-10 md:py-16">
      <SEO 
        title={`Subscribe to ${plan.displayName} Plan - PakistanYP`}
        description={`Subscribe to ${plan.displayName} plan for ${isYearly ? plan.yearlyPrice : plan.price} PKR per ${isYearly ? 'month (billed yearly)' : 'month'}`}
      />
      
      <div className="yp-wrap max-w-[1000px]">
        {/* Header */}
        <div className="flex flex-col items-start gap-5 mb-10">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setLocation("/add-business-enhanced")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <span className="yp-label !text-[#0B6B2E]">Checkout</span>
            <h1 className="text-[clamp(30px,4vw,44px)] font-bold tracking-[-0.045em] leading-[1.08] mt-2">Complete Your Subscription</h1>
          </div>
        </div>



        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Plan Summary */}
          <Card className={`rounded-[24px] ${plan.isPopular ? 'border-2 border-[#0B6B2E]' : ''}`}>
            <CardHeader>
              <div className="flex items-center gap-3">
                {getPlanIcon(plan.name)}
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {plan.displayName}
                    {plan.isPopular && <span className="yp-pill bg-[#E3A82B] text-[#141414]">Most Popular</span>}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-[-0.04em]">
                    {isYearly ? plan.yearlyPrice : plan.price} {plan.currency}
                  </span>
                  <span className="text-[#5B6475]">
                    /month{isYearly ? ' (billed yearly)' : ''}
                  </span>
                </div>
                
                {isYearly && (
                  <div className="yp-tag yp-tag-green font-medium">
                    Save {Math.round(((plan.price * 12 - plan.yearlyPrice * 12) / (plan.price * 12)) * 100)}% annually!
                  </div>
                )}

                <div className="space-y-3 border-t border-[#EEF0F4] pt-5">
                  <p className="yp-label">Features included</p>
                  <ul className="space-y-2 text-sm text-[#3A4354]">
                    {plan.features.slice(0, 5).map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#0B6B2E] shrink-0" />
                        {feature}
                      </li>
                    ))}
                    {plan.features.length > 5 && (
                      <li className="text-[#5B6475] pl-6">+ {plan.features.length - 5} more features</li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card className="rounded-[24px]">
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
              <CardDescription>
                Enter your payment details to activate your subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              {useHostedCheckout ? (
                <div className="text-center py-8 space-y-4">
                  <span className="w-12 h-12 rounded-[14px] grid place-items-center bg-[#E8F4EC] text-[#0B6B2E] mx-auto">
                    <CreditCard className="w-6 h-6" />
                  </span>
                  <div>
                    <p className="font-semibold mb-2">Secure Payment Processing</p>
                    <p className="text-sm text-[#4B5565]">
                      You'll be redirected to our secure payment page to complete your subscription.
                    </p>
                  </div>
                  {paymentState !== 'processing' && (
                    <Button 
                      onClick={createStripeCheckoutSession}
                      size="lg"
                      className="w-full"
                    >
                      Continue to Payment
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-[#0B6B2E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-sm text-[#4B5565]">Preparing payment form...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}