import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
// Stripe imports disabled to prevent error overlay
// import { loadStripe } from "@stripe/stripe-js";
// import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Crown, Star, TrendingUp } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/header";
import Footer from "@/components/footer";
import SEO from "@/components/seo";
import { country } from "@shared/country";
import { tj } from "@/i18n-jsx/tj";
import { t as tx } from "@shared/i18n";

// Stripe loading disabled to prevent error overlay
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
let stripePromise: Promise<any> | null = null;

// Stripe loading disabled
stripePromise = null;

interface PremiumPlan {
  id: string;
  name: string;
  price: number;
  duration: string;
  savings?: string;
  features: string[];
  recommended?: boolean;
}

const premiumPlans: PremiumPlan[] = [
  {
    id: "monthly",
    name: "Monthly Premium",
    price: 299,
    duration: "per month",
    features: [
      "Priority placement in search results",
      "Enhanced business profile with unlimited images",
      "Featured badge on your listing",
      "Advanced analytics and insights",
      "Priority customer support",
      "Social media integration",
      "Custom business hours and special offers",
      "Contact form and inquiry management"
    ]
  },
  {
    id: "yearly",
    name: "Yearly Premium",
    price: 2999,
    duration: "per year",
    savings: `Save 600 ${country.currency}`,
    recommended: true,
    features: [
      "All Monthly Premium features",
      `2 months free (save 600 ${country.currency})`,
      "Priority placement in search results",
      "Enhanced business profile with unlimited images",
      "Featured badge on your listing",
      "Advanced analytics and insights",
      "Priority customer support",
      "Social media integration",
      "Custom business hours and special offers",
      "Contact form and inquiry management",
      "Quarterly performance reports"
    ]
  }
];

const CheckoutForm = ({ businessId, planType }: { businessId: number; planType: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!stripe || !elements) {
      setIsLoading(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard?upgraded=true`,
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
        description: "Your business has been upgraded to premium!",
      });
      navigate("/dashboard");
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border border-[#E7E9EE] rounded-2xl bg-[#F7F8FA]">
        <PaymentElement />
      </div>
      <Button 
        type="submit" 
        disabled={!stripe || isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? "Processing..." : "Complete Payment"}
      </Button>
    </form>
  );
};

export default function UpgradePremium() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string>("yearly");
  const [businessId, setBusinessId] = useState<number | null>(null);
  const [clientSecret, setClientSecret] = useState<string>("");
  const [, navigate] = useLocation();

  // Check if Stripe is available
  if (!stripePromise) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center px-6 py-16">
        <Card className="max-w-md w-full rounded-[24px]">
          <CardHeader>
            <span className="w-12 h-12 rounded-[14px] grid place-items-center bg-[#E8F4EC] text-[#0B6B2E] mb-3">
              <Crown className="w-6 h-6" />
            </span>
            <CardTitle className="text-2xl tracking-[-0.03em]">Payment Not Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[#4B5565]">Payment processing is currently unavailable. Please contact support for assistance.</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get business ID from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("businessId");
    if (id) {
      setBusinessId(parseInt(id));
    }
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upgrade your business listing.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/auth/google";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  // Get user's businesses
  const { data: dashboardData } = useQuery({
    queryKey: ["/api/dashboard"],
    enabled: isAuthenticated,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Create payment intent mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (data: { businessId: number; planType: string }) => {
      return await apiRequest("POST", "/api/create-payment-intent", data);
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/auth/google";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to create payment intent",
        variant: "destructive",
      });
    },
  });

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    setClientSecret(""); // Reset client secret when plan changes
  };

  const handleStartPayment = () => {
    if (!businessId) {
      toast({
        title: "Error",
        description: "Please select a business to upgrade.",
        variant: "destructive",
      });
      return;
    }

    createPaymentMutation.mutate({
      businessId,
      planType: selectedPlan,
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#0B6B2E] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const selectedPlanData = premiumPlans.find(p => p.id === selectedPlan);

  return (
    <>
      <SEO
        title="Upgrade to Premium - Pakistan Yellow Pages"
        description="Boost your business visibility and attract more customers with our premium listing features"
        canonicalUrl="https://pakistanyp.com/upgrade-premium"
        keywords="premium business listing, Pakistan business upgrade, enhanced visibility"
      />
      <Header />
      <div className="min-h-screen bg-[#FAF8F3] text-[#0A0A0A] py-16 md:py-20">
        <div className="yp-wrap">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 flex flex-col items-center gap-4">
            <span className="yp-label !text-[#0B6B2E] inline-flex items-center gap-2">
              <Crown className="h-4 w-4" aria-hidden="true" />
              Premium listing
            </span>
            <h1 className="yp-h1">Upgrade to Premium</h1>
            <p className="yp-lead max-w-2xl">
              Boost your business visibility and attract more customers with our premium listing features
            </p>
          </div>

          {/* Business Selection */}
          {!businessId && dashboardData?.businesses && dashboardData.businesses.length > 0 && (
            <Card className="mb-8 rounded-[24px]">
              <CardHeader>
                <CardTitle>Select Business to Upgrade</CardTitle>
                <CardDescription>Choose which business you'd like to upgrade to premium</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {dashboardData.businesses.map((business: any) => (
                    <div
                      key={business.id}
                      onClick={() => setBusinessId(business.id)}
                      className={`p-4 border rounded-2xl cursor-pointer transition-colors ${
                        businessId === business.id 
                          ? 'border-[#0B6B2E] bg-[#F2F9F4]' 
                          : 'border-[#E7E9EE] hover:border-[#C9CED8]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{business.name}</h3>
                          <p className="text-sm text-[#5B6475]">{business.address}</p>
                        </div>
                        {business.isPremium && (
                          <Badge variant="secondary" className="bg-[#E8F4EC] text-[#05501F]">
                            <Crown className="h-3 w-3 me-1" />
                            Premium
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Premium Plans */}
          <div className="grid md:grid-cols-2 gap-5 mb-8 pt-3">
            {premiumPlans.map((plan) => (
              <Card 
                key={plan.id}
                className={`relative cursor-pointer transition-colors rounded-[24px] ${
                  selectedPlan === plan.id 
                    ? 'border-2 border-[#0B6B2E] bg-white' 
                    : 'border border-[#E7E9EE] hover:border-[#CFE8D8]'
                }`}
                onClick={() => handlePlanSelect(plan.id)}
              >
                {plan.recommended && (
                  <span className="yp-pill bg-[#E3A82B] text-[#141414] gap-1 absolute -top-3 start-6">
                    <Star className="h-3 w-3" aria-hidden="true" />
                    Recommended
                  </span>
                )}
                
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl tracking-[-0.02em]">
                    <span className="w-10 h-10 rounded-xl grid place-items-center bg-[#E8F4EC] text-[#0B6B2E]">
                      <TrendingUp className="h-5 w-5" aria-hidden="true" />
                    </span>
                    {plan.name}
                  </CardTitle>
                  <div className="flex items-baseline gap-2 pt-3">
                    <span className="text-4xl font-bold tracking-[-0.04em]">
                      {plan.price}{" " + country.currency}
                    </span>
                    <span className="text-[#5B6475]">{plan.duration}</span>
                  </div>
                  {plan.savings && (
                    <Badge variant="secondary" className="w-fit bg-[#E8F4EC] text-[#05501F]">
                      {plan.savings}
                    </Badge>
                  )}
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 border-t border-[#EEF0F4] pt-5">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-[#0B6B2E] mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-[#3A4354]">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Payment Section */}
          {businessId && selectedPlanData && (
            <Card className="rounded-[24px]">
              <CardHeader>
                <CardTitle>Complete Your Upgrade</CardTitle>
                <CardDescription>{tj("Upgrade your business to {0} for {1}{2}", selectedPlanData.name, selectedPlanData.price, " " + country.currency)}</CardDescription>
              </CardHeader>
              <CardContent>
                {!clientSecret ? (
                  <div className="text-center py-8">
                    <Button 
                      onClick={handleStartPayment}
                      disabled={createPaymentMutation.isPending}
                      size="lg"
                      className="w-full max-w-md"
                    >
                      {createPaymentMutation.isPending ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full me-2" />
                          Creating Payment...
                        </>
                      ) : (
                        tx("Start Payment - {0} {1}", selectedPlanData.price, country.currency)
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="yp-panel p-5">
                      <h3 className="yp-label mb-3">Order Summary</h3>
                      <div className="flex justify-between items-center">
                        <span>{selectedPlanData.name}</span>
                        <span className="font-semibold">{selectedPlanData.price}{" " + country.currency}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between items-center font-semibold">
                        <span>Total</span>
                        <span>{selectedPlanData.price}{" " + country.currency}</span>
                      </div>
                    </div>
                    
                    {stripePromise ? (
                      <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <CheckoutForm businessId={businessId} planType={selectedPlan} />
                      </Elements>
                    ) : (
                      <div className="p-4 border border-[#F5C6C8] bg-[#FDECEC] rounded-2xl">
                        <p className="text-[#7F1D1D] text-sm">
                          Payment processing is currently unavailable. Please contact support for assistance.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* No Business Message */}
          {!businessId && dashboardData?.businesses && dashboardData.businesses.length === 0 && (
            <Card className="rounded-[24px]">
              <CardContent className="text-center py-12">
                <span className="w-12 h-12 rounded-[14px] grid place-items-center bg-[#F1F2F6] text-[#334155] mx-auto mb-4">
                  <Crown className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="text-lg font-semibold mb-2">No Businesses Found</h3>
                <p className="text-[#4B5565] mb-6">
                  You need to add a business listing before you can upgrade to premium.
                </p>
                <Button onClick={() => navigate("/add-business-enhanced")}>
                  Add Your First Business
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
      <Footer />
    </>
  );
}