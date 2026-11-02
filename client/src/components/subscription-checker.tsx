import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Crown, Star, Shield, Zap, AlertTriangle, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { tj } from "@/i18n-jsx/tj";

type SubscriptionLimits = {
  listings: number;
  images: number;
  featured_listings: number;
  premium_badge: boolean;
  analytics: boolean;
  api_access: boolean;
  priority_support: boolean;
};

type UserSubscription = {
  id?: number;
  planName: string;
  planDisplayName: string;
  status: string;
  currentPeriodEnd: string;
  limits: SubscriptionLimits;
};

type UsageStats = {
  businessCount: number;
  imageCount: number;
  featuredCount: number;
};

const planIcons = {
  free: Star,
  premium: Crown,
  professional: Shield,
  enterprise: Zap,
};

const planColors = {
  free: "bg-blue-100 text-blue-800",
  premium: "bg-purple-100 text-purple-800",
  professional: "bg-[#FFF4E0] text-[#B45309]",
  enterprise: "bg-green-100 text-green-800",
};

interface SubscriptionCheckerProps {
  checkType: "business" | "image" | "featured" | "analytics" | "api";
  onUpgrade?: () => void;
  showUpgradeDialog?: boolean;
}

export function SubscriptionChecker({ 
  checkType, 
  onUpgrade,
  showUpgradeDialog = false 
}: SubscriptionCheckerProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const { data: subscription, isLoading } = useQuery<UserSubscription>({
    queryKey: ["/api/user/subscription"],
    enabled: !!user,
  });

  const { data: usage, isLoading: usageLoading } = useQuery<UsageStats>({
    queryKey: ["/api/user/usage-stats"],
    enabled: !!user,
  });

  if (isLoading || usageLoading || !subscription || !usage) {
    return null;
  }

  const isLimitReached = (type: string) => {
    switch (type) {
      case "business":
        return usage.businessCount >= subscription.limits.listings;
      case "image":
        return usage.imageCount >= subscription.limits.images;
      case "featured":
        return usage.featuredCount >= subscription.limits.featured_listings;
      case "analytics":
        return !subscription.limits.analytics;
      case "api":
        return !subscription.limits.api_access;
      default:
        return false;
    }
  };

  const getUsagePercentage = (type: string) => {
    switch (type) {
      case "business":
        return (usage.businessCount / subscription.limits.listings) * 100;
      case "image":
        return (usage.imageCount / subscription.limits.images) * 100;
      case "featured":
        return (usage.featuredCount / subscription.limits.featured_listings) * 100;
      default:
        return 0;
    }
  };

  const getFeatureName = (type: string) => {
    switch (type) {
      case "business":
        return "Business Listings";
      case "image":
        return "Business Images";
      case "featured":
        return "Featured Listings";
      case "analytics":
        return "Advanced Analytics";
      case "api":
        return "API Access";
      default:
        return "Feature";
    }
  };

  const limitReached = isLimitReached(checkType);
  const usagePercentage = getUsagePercentage(checkType);
  const featureName = getFeatureName(checkType);

  const PlanIcon = planIcons[subscription.planName as keyof typeof planIcons] || Star;
  const planColorClass = planColors[subscription.planName as keyof typeof planColors] || "bg-gray-100 text-gray-800";

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      setLocation("/pricing");
    }
  };

  if (limitReached) {
    return (
      <Alert className="mb-4 border-[#F5DDB0] bg-[#FFF4E0]">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>{tj("You've reached your {0} limit. Upgrade to add more.", featureName.toLowerCase())}</span>
            <Button
              size="sm"
              onClick={handleUpgrade}
              className="ms-4"
            >
              <Crown className="h-4 w-4 me-2" />
              Upgrade Plan
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (usagePercentage > 80) {
    return (
      <Alert className="mb-4 border-[#F5DDB0] bg-[#FFF4E0]">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>{tj("You're close to your {0} limit.", featureName.toLowerCase())}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleUpgrade}
              >
                <Crown className="h-4 w-4 me-2" />
                Upgrade
              </Button>
            </div>
            <Progress value={usagePercentage} className="h-2" />
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <PlanIcon className="h-5 w-5" />
            <CardTitle className="text-sm">Current Plan</CardTitle>
            <Badge className={planColorClass}>
              {subscription.planDisplayName}
            </Badge>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleUpgrade}
          >
            <Crown className="h-4 w-4 me-2" />
            Upgrade
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Business Listings</span>
            <span>{usage.businessCount} / {subscription.limits.listings}</span>
          </div>
          <Progress value={getUsagePercentage("business")} className="h-2" />
          
          <div className="flex items-center justify-between text-sm">
            <span>Images per Business</span>
            <span>{tj("Up to {0}", subscription.limits.images)}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span>Featured Listings</span>
            <span>{usage.featuredCount} / {subscription.limits.featured_listings}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              {subscription.limits.premium_badge ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm">Premium Badge</span>
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              {subscription.limits.analytics ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm">Analytics</span>
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              {subscription.limits.api_access ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm">API Access</span>
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              {subscription.limits.priority_support ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm">Priority Support</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Usage stats component for dashboard
export function UsageStatsCard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: subscription, isLoading } = useQuery<UserSubscription>({
    queryKey: ["/api/user/subscription"],
    enabled: !!user,
  });

  const { data: usage, isLoading: usageLoading } = useQuery<UsageStats>({
    queryKey: ["/api/user/usage-stats"],
    enabled: !!user,
  });

  if (isLoading || usageLoading || !subscription || !usage) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="h-2 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const PlanIcon = planIcons[subscription.planName as keyof typeof planIcons] || Star;
  const planColorClass = planColors[subscription.planName as keyof typeof planColors] || "bg-gray-100 text-gray-800";

  const businessUsage = (usage.businessCount / subscription.limits.listings) * 100;
  const featuredUsage = (usage.featuredCount / subscription.limits.featured_listings) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <PlanIcon className="h-5 w-5" />
            <CardTitle>Subscription Usage</CardTitle>
          </div>
          <Badge className={planColorClass}>
            {subscription.planDisplayName}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span>Business Listings</span>
              <span>{usage.businessCount} / {subscription.limits.listings}</span>
            </div>
            <Progress value={businessUsage} className="h-2" />
          </div>
          
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span>Featured Listings</span>
              <span>{usage.featuredCount} / {subscription.limits.featured_listings}</span>
            </div>
            <Progress value={featuredUsage} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              {subscription.limits.premium_badge ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm">Premium Badge</span>
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              {subscription.limits.analytics ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm">Analytics</span>
            </div>
          </div>

          <Button 
            className="w-full mt-4" 
            variant="outline"
            onClick={() => setLocation("/pricing")}
          >
            <Crown className="h-4 w-4 me-2" />
            Manage Subscription
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default SubscriptionChecker;