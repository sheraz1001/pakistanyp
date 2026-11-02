import { country } from "@shared/country";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Crown, Star, Shield, Zap, Check, CreditCard, AlertTriangle, Loader2, Heart, Sparkles } from "lucide-react";
import SubscriptionTierMascotGuide from "@/components/subscription-tier-mascot-guide";

type SubscriptionPlan = {
  id: number;
  name: string;
  displayName: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  limits: {
    listings: number;
    images: number;
    featured_listings: number;
    premium_badge: boolean;
    analytics: boolean;
    api_access: boolean;
    priority_support: boolean;
  };
  isActive: boolean;
};

type UserSubscription = {
  id?: number;
  planName: string;
  planDisplayName: string;
  status: string;
  currentPeriodEnd: string;
  limits: any;
};

const planIcons = {
  free: Star,
  premium: Crown,
  professional: Shield,
  enterprise: Zap,
};

const planColors = {
  free: "rounded-[24px]",
  premium: "rounded-[24px] border-2 border-[#0B6B2E]",
  professional: "rounded-[24px]",
  enterprise: "rounded-[24px]",
};

const buttonColors = {
  free: "bg-white text-[#0A0A0A] border border-[#E3E6EC] hover:bg-white hover:border-[#C9CED8]",
  premium: "",
  professional: "bg-white text-[#0A0A0A] border border-[#E3E6EC] hover:bg-white hover:border-[#C9CED8]",
  enterprise: "bg-white text-[#0A0A0A] border border-[#E3E6EC] hover:bg-white hover:border-[#C9CED8]",
};

interface SubscriptionUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan?: string;
  reason?: string;
}

export function SubscriptionUpgradeModal({
  open,
  onOpenChange,
  currentPlan = "free",
  reason = "upgrade"
}: SubscriptionUpgradeModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isYearly, setIsYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const { data: plans = [], isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
    enabled: open,
  });

  const { data: currentSubscription } = useQuery<UserSubscription>({
    queryKey: ["/api/user/subscription"],
    enabled: !!user && open,
  });

  const upgradeMutation = useMutation({
    mutationFn: async (data: { planId: number; interval: string }) => {
      const response = await apiRequest("POST", "/api/user/subscribe", data);
      return response;
    },
    onSuccess: (data) => {
      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        toast({
          title: "Subscription Updated",
          description: "Your subscription has been updated successfully.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/user/subscription"] });
        onOpenChange(false);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Subscription Error",
        description: error.message || "Failed to process subscription. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setLoadingPlan(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/user/cancel-subscription", {});
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/subscription"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Error",
        description: error.message || "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upgrade your subscription.",
        variant: "destructive",
      });
      return;
    }

    setLoadingPlan(plan.name);
    
    const interval = isYearly ? "yearly" : "monthly";
    const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
    
    if (!price || price === 0) {
      // Free plan - downgrade
      upgradeMutation.mutate({ planId: plan.id, interval });
    } else {
      // Paid plan - redirect to Stripe
      upgradeMutation.mutate({ planId: plan.id, interval });
    }
  };

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel your subscription?")) {
      cancelMutation.mutate();
    }
  };

  const getPlanIcon = (planName: string) => {
    const Icon = planIcons[planName as keyof typeof planIcons] || Star;
    return <Icon className="w-6 h-6" />;
  };

  const getPlanColor = (planName: string) => {
    return planColors[planName as keyof typeof planColors] || "rounded-[24px]";
  };

  const getButtonColor = (planName: string) => {
    return buttonColors[planName as keyof typeof buttonColors] || "";
  };

  const formatPrice = (price: number | null | undefined) => {
    if (!price || price === 0) return "Free";
    return `${country.currency} ${Number(price).toFixed(0)}`;
  };

  const getSavingsPercentage = (monthly: number | null | undefined, yearly: number | null | undefined) => {
    if (!monthly || !yearly || monthly === 0 || yearly === 0) return 0;
    return Math.round(((monthly * 12 - yearly) / (monthly * 12)) * 100);
  };

  const isCurrentPlan = (planName: string) => {
    return currentSubscription?.planName === planName;
  };

  const canUpgrade = (planName: string) => {
    const planOrder = ["free", "premium", "professional", "enterprise"];
    const currentIndex = planOrder.indexOf(currentPlan);
    const targetIndex = planOrder.indexOf(planName);
    return targetIndex > currentIndex;
  };

  const canDowngrade = (planName: string) => {
    const planOrder = ["free", "premium", "professional", "enterprise"];
    const currentIndex = planOrder.indexOf(currentPlan);
    const targetIndex = planOrder.indexOf(planName);
    return targetIndex < currentIndex;
  };

  const getActionText = (planName: string) => {
    if (isCurrentPlan(planName)) return "Current Plan";
    if (canUpgrade(planName)) return "Upgrade";
    if (canDowngrade(planName)) return "Downgrade";
    return "Select Plan";
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Choose Your Plan</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#0B6B2E]" />
            Choose Your Plan
          </DialogTitle>
          <CardDescription>
            {reason === "limit" && "You've reached your current plan limits. Upgrade to continue."}
            {reason === "upgrade" && "Upgrade your plan to unlock more features and grow your business."}
            {reason === "manage" && "Manage your subscription and billing settings."}
          </CardDescription>
        </DialogHeader>

        <Tabs defaultValue="mascot-guide" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mascot-guide" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Meet Your Guides
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              View Pricing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mascot-guide" className="mt-6">
            <SubscriptionTierMascotGuide />
          </TabsContent>

          <TabsContent value="pricing" className="mt-6">
            {/* Billing Toggle */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
              <span className={`text-sm ${!isYearly ? 'font-semibold' : ''}`}>Monthly</span>
              <Switch
                checked={isYearly}
                onCheckedChange={setIsYearly}
              />
              <span className={`text-sm ${isYearly ? 'font-semibold' : ''}`}>
                Yearly
                <span className="yp-pill bg-[#E8F4EC] text-[#05501F] ml-2">Save up to 25%</span>
              </span>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 pt-3">
          {plans.map((plan) => {
            const Icon = planIcons[plan.name as keyof typeof planIcons] || Star;
            const planColorClass = getPlanColor(plan.name);
            const buttonColorClass = getButtonColor(plan.name);
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
            const savings = getSavingsPercentage(plan.monthlyPrice, plan.yearlyPrice);
            const isLoading = loadingPlan === plan.name;
            const current = isCurrentPlan(plan.name);

            return (
              <Card key={plan.id} className={`relative ${planColorClass} ${current ? 'bg-[#F2F9F4] border-[#CFE8D8]' : ''}`}>
                {plan.name === 'premium' && (
                  <span className="yp-pill bg-[#E3A82B] text-[#141414] absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">Most Popular</span>
                )}
                <CardHeader className="pb-2">
                  <div className="flex mb-3">
                    <span className="w-12 h-12 rounded-[14px] grid place-items-center bg-[#E8F4EC] text-[#0B6B2E]"><Icon className="w-6 h-6" /></span>
                  </div>
                  <CardTitle className="text-lg tracking-[-0.02em]">{plan.displayName}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <div className="text-3xl font-bold tracking-[-0.04em]">
                      {formatPrice(price)}
                    </div>
                    {price && price > 0 && (
                      <div className="text-sm text-[#4B5565]">
                        per {isYearly ? 'year' : 'month'}
                        {isYearly && savings > 0 && (
                          <Badge className="ml-2 bg-[#E8F4EC] text-[#05501F]">
                            {savings}% off
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>Business Listings</span>
                      <span className="font-semibold">{plan.limits?.listings || 'Unlimited'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Images per Business</span>
                      <span className="font-semibold">{plan.limits?.images || 'Unlimited'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Featured Listings</span>
                      <span className="font-semibold">{plan.limits?.featured_listings || 'Unlimited'}</span>
                    </div>
                  </div>

                  <div className="space-y-1 pt-2">
                    {plan.features?.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-[#0B6B2E] shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    )) || (
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-[#0B6B2E] shrink-0" />
                        <span className="text-sm">Basic features included</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4">
                    {current ? (
                      <div className="space-y-2">
                        <Button className="w-full" disabled>
                          <Crown className="w-4 h-4 mr-2" />
                          Current Plan
                        </Button>
                        {plan.name !== "free" && (
                          <Button
                            className="w-full"
                            variant="destructive"
                            size="sm"
                            onClick={handleCancel}
                            disabled={cancelMutation.isPending}
                          >
                            {cancelMutation.isPending ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 mr-2" />
                            )}
                            Cancel Subscription
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Button
                        className={`w-full ${buttonColorClass}`}
                        onClick={() => handleUpgrade(plan)}
                        disabled={isLoading || upgradeMutation.isPending}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CreditCard className="w-4 h-4 mr-2" />
                        )}
                        {getActionText(plan.name)}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

            {/* Current Subscription Info */}
            {currentSubscription && (
              <Card className="yp-tint rounded-[20px]">
                <CardHeader>
                  <CardTitle className="text-sm">Current Subscription</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{currentSubscription.planDisplayName}</p>
                      <p className="text-sm text-[#4B5565]">
                        Status: {currentSubscription.status} • 
                        Next billing: {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className="bg-white text-[#05501F] border border-[#CFE8D8]">
                      {currentSubscription.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default SubscriptionUpgradeModal;