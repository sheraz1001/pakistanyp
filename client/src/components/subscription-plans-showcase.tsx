import { country } from "@shared/country";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Check, Crown, Star, Building, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  isPopular?: boolean;
  description: string;
}

interface SubscriptionPlansShowcaseProps {
  currentPlan?: string;
  compact?: boolean;
  showUpgradeOnly?: boolean;
  isYearly?: boolean;
  onPlanSelect?: (planId: string) => void;
  showFreeOption?: boolean;
}

export function SubscriptionPlansShowcase({ 
  currentPlan = "free", 
  compact = false, 
  showUpgradeOnly = false,
  isYearly: yearlyFromProps = false,
  onPlanSelect,
  showFreeOption = true
}: SubscriptionPlansShowcaseProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isYearly, setIsYearly] = useState(yearlyFromProps);
  const { toast } = useToast();

  const { data: subscription } = useQuery({
    queryKey: ["/api/user/subscription"],
    queryFn: () => apiRequest("GET", "/api/user/subscription"),
  });

  const upgradeNowMutation = useMutation({
    mutationFn: (planId: string) => apiRequest("POST", "/api/user/subscription/upgrade", { planId }),
    onSuccess: () => {
      toast({
        title: "Upgrade Successful",
        description: "Your subscription has been upgraded successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/subscription"] });
      setIsUpgrading(false);
    },
    onError: (error: any) => {
      toast({
        title: "Upgrade Failed",
        description: error.message || "Failed to upgrade subscription",
        variant: "destructive",
      });
      setIsUpgrading(false);
    },
  });

  const plans: SubscriptionPlan[] = [
    {
      id: "free",
      name: "free",
      displayName: "Free",
      price: 0,
      yearlyPrice: 0,
      currency: country.currency,
      interval: "month",
      businessLimit: 1,
      categoryLimit: 1,
      subcategoryLimit: 3,
      description: "Perfect for getting started",
      features: [
        "1 Business listing",
        "1 Main category",
        "3 Subcategories",
        "Basic business profile",
        "Contact information display",
        "Basic analytics",
        "Email support"
      ]
    },
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
      businessLimit: 15,
      categoryLimit: 999,
      subcategoryLimit: 999,
      description: "For established businesses",
      features: [
        "15 Business listings",
        "Unlimited categories",
        "Professional badge",
        "Featured business placement",
        "Custom business URL",
        "Premium analytics dashboard",
        "Priority support",
        "API access",
        "Custom branding",
        "Photo gallery (50 images)",
        "Video uploads",
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

  const handleUpgrade = (planId: string) => {
    setSelectedPlan(planId);
    
    // If onPlanSelect callback is provided (from pricing page), use it
    if (onPlanSelect) {
      onPlanSelect(planId);
      return;
    }
    
    // Find the selected plan
    const selectedPlan = plans.find(p => p.id === planId);
    
    if (!selectedPlan) {
      toast({
        title: "Error",
        description: "Invalid plan selected",
        variant: "destructive",
      });
      return;
    }
    
    // For free plan, upgrade directly
    if (selectedPlan.price === 0) {
      setIsUpgrading(true);
      upgradeNowMutation.mutate(planId);
    } else {
      // For paid plans, redirect to payment page
      const billingParam = isYearly ? '?billing=yearly' : '?billing=monthly';
      window.location.href = `/subscribe/${planId}${billingParam}`;
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case "premium": return <span className="w-12 h-12 rounded-[14px] grid place-items-center bg-[#E8F4EC] text-[#0B6B2E]"><Crown className="w-6 h-6" /></span>;
      case "professional": return <span className="w-12 h-12 rounded-[14px] grid place-items-center bg-[#E6F6F1] text-[#047857]"><Star className="w-6 h-6" /></span>;
      case "enterprise": return <span className="w-12 h-12 rounded-[14px] grid place-items-center bg-[#FDECEC] text-[#B91C1C]"><Building className="w-6 h-6" /></span>;
      default: return <span className="w-12 h-12 rounded-[14px] grid place-items-center bg-[#F1F2F6] text-[#334155]"><Zap className="w-6 h-6" /></span>;
    }
  };

  const displayPlans = showUpgradeOnly ? plans.filter(p => p.name !== currentPlan) : plans;

  if (compact) {
    return (
      <div className="yp-tint rounded-[20px] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-[#0A0A0A]">
              Current Plan: {plans.find(p => p.name === currentPlan)?.displayName || "Free"}
            </h3>
            <p className="text-sm text-[#4B5565]">
              {currentPlan === "free" ? "Limited features" : "Premium features unlocked"}
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="bg-white">
                View Plans
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Choose Your Plan</DialogTitle>
                <DialogDescription>
                  Select the perfect plan for your business needs
                </DialogDescription>
              </DialogHeader>
              <SubscriptionPlansShowcase currentPlan={currentPlan} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <span className="yp-label">Plans</span>
        <h2 className="yp-h2 mt-2 mb-2">Choose Your Plan</h2>
        <p className="text-[#4B5565]">Select the perfect plan to showcase your business</p>
        
        {/* Monthly/Yearly Toggle */}
        <div className="flex flex-wrap items-center justify-center mt-6 gap-4">
          <span className={`text-sm font-medium ${!isYearly ? 'text-[#0A0A0A]' : 'text-[#5B6475]'}`}>Monthly</span>
          <Switch
            checked={isYearly}
            onCheckedChange={setIsYearly}
          />
          <span className={`text-sm font-medium ${isYearly ? 'text-[#0A0A0A]' : 'text-[#5B6475]'}`}>
            Yearly
            <span className="yp-pill bg-[#E8F4EC] text-[#05501F] ml-2">Save 20%</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pt-3">
        {displayPlans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative rounded-[24px] flex flex-col transition-shadow hover:shadow-[0_24px_48px_-36px_rgba(0,115,47,.45)] ${
              plan.isPopular ? 'border-2 border-[#0B6B2E]' : ''
            } ${currentPlan === plan.name ? 'bg-[#F2F9F4] border-[#CFE8D8]' : ''}`}
          >
            {plan.isPopular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="yp-pill bg-[#E3A82B] text-[#141414]">Most Popular</span>
              </div>
            )}
            
            {currentPlan === plan.name && (
              <div className="absolute -top-3 right-4">
                <span className="yp-pill bg-[#0B6B2E] text-white">Current</span>
              </div>
            )}

            <CardHeader className="pb-4">
              <div className="flex mb-3">
                {getPlanIcon(plan.name)}
              </div>
              <CardTitle className="text-xl font-semibold tracking-[-0.02em]">{plan.displayName}</CardTitle>
              <CardDescription className="text-sm">{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold tracking-[-0.04em]">
                  {plan.price === 0 ? 'Free' : `${isYearly ? plan.yearlyPrice : plan.price} ${plan.currency}`}
                </span>
                {plan.price > 0 && (
                  <span className="text-[#5B6475] text-sm">/{isYearly ? 'month' : plan.interval}</span>
                )}
                {plan.price > 0 && isYearly && (
                  <div className="text-sm text-[#0B6B2E] font-medium mt-1">
                    Save {Math.round((1 - (plan.yearlyPrice / plan.price)) * 100)}% yearly
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col">
              <div className="space-y-3 mb-6 flex-1">
                <div className="text-sm font-medium text-[#3A4354] space-y-1">
                  <div className="flex justify-between">
                    <span>Business Listings:</span>
                    <span>{plan.businessLimit === 999 ? 'Unlimited' : plan.businessLimit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Categories:</span>
                    <span>{plan.categoryLimit === 999 ? 'Unlimited' : `${plan.categoryLimit} main + ${plan.subcategoryLimit} sub`}</span>
                  </div>
                </div>
                
                <div className="border-t border-[#EEF0F4] pt-4">
                  <ul className="space-y-2">
                    {plan.features.slice(0, 5).map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-[#0B6B2E] mt-0.5 flex-shrink-0" />
                        <span className="text-[#3A4354]">{feature}</span>
                      </li>
                    ))}
                    {plan.features.length > 5 && (
                      <li className="text-sm text-[#5B6475] pl-6">
                        +{plan.features.length - 5} more features
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              <Button 
                className="w-full" 
                variant={currentPlan === plan.name ? "secondary" : plan.isPopular ? "default" : "outline"}
                disabled={currentPlan === plan.name || isUpgrading}
                onClick={() => handleUpgrade(plan.id)}
              >
                {isUpgrading && selectedPlan === plan.id ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Upgrading...
                  </div>
                ) : currentPlan === plan.name ? (
                  "Current Plan"
                ) : plan.price === 0 ? (
                  "Get Started"
                ) : (
                  "Upgrade Now"
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default SubscriptionPlansShowcase;