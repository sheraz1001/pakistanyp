import { country } from "@shared/country";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star, Zap, Building } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
  color: string;
  buttonColor: string;
}

const plans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      '1 Main Category',
      '3 Second Level Categories',
      'Unlimited Third Level Categories',
      'Basic Business Listing',
      'Contact Information Display'
    ],
    icon: <Star className="w-5 h-5" />,
    color: 'bg-[#F1F2F6] text-[#334155]',
    buttonColor: 'outline'
  },
  {
    id: 'premium',
    name: 'Premium',
    monthlyPrice: 199,
    yearlyPrice: 1990,
    features: [
      'Unlimited Categories',
      'Premium Badge',
      'Priority Support',
      'Advanced Analytics',
      'Social Media Integration',
      'Custom Business Hours'
    ],
    popular: true,
    icon: <Crown className="w-5 h-5" />,
    color: 'bg-[#E8F4EC] text-[#0B6B2E]',
    buttonColor: 'default'
  },
  {
    id: 'professional',
    name: 'Professional',
    monthlyPrice: 599,
    yearlyPrice: 5990,
    features: [
      'Everything in Premium',
      'Multiple Business Locations',
      'Advanced SEO Tools',
      'Custom Branding',
      'API Access',
      'Dedicated Account Manager'
    ],
    icon: <Zap className="w-5 h-5" />,
    color: 'bg-[#E6F6F1] text-[#047857]',
    buttonColor: 'outline'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 1299,
    yearlyPrice: 12990,
    features: [
      'Everything in Professional',
      'Unlimited Business Listings',
      'White Label Solution',
      'Custom Integrations',
      'Priority Phone Support',
      'Custom SLA'
    ],
    icon: <Building className="w-5 h-5" />,
    color: 'bg-[#FDECEC] text-[#B91C1C]',
    buttonColor: 'outline'
  }
];

interface SubscriptionPlanSelectorProps {
  onPlanSelect: (planId: string) => void;
  currentPlan?: string;
}

export default function SubscriptionPlanSelector({ onPlanSelect, currentPlan = 'free' }: SubscriptionPlanSelectorProps) {
  const [isYearly, setIsYearly] = useState(false);

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return `${country.currency} ${price.toLocaleString()}`;
  };

  const getSavings = (monthlyPrice: number, yearlyPrice: number) => {
    if (monthlyPrice === 0 || yearlyPrice === 0) return 0;
    return Math.round(((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-[-0.035em] mb-2">Choose Your Plan</h2>
        <p className="text-[#4B5565] mb-4">Upgrade to unlock more categories and features</p>
        
        {/* Billing Toggle */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
          <span className={`text-sm ${!isYearly ? 'text-[#0A0A0A] font-medium' : 'text-[#5B6475]'}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isYearly ? 'bg-[#0B6B2E]' : 'bg-[#E3E6EC]'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isYearly ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm ${isYearly ? 'text-[#0A0A0A] font-medium' : 'text-[#5B6475]'}`}>
            Yearly
          </span>
          {isYearly && (
            <Badge variant="secondary" className="text-[#05501F] bg-[#E8F4EC]">
              Save up to 17%
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
          const savings = getSavings(plan.monthlyPrice, plan.yearlyPrice);
          const isCurrentPlan = currentPlan === plan.id;
          
          return (
            <Card key={plan.id} className={`relative rounded-[24px] flex flex-col ${plan.popular ? 'border-2 border-[#0B6B2E]' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="yp-pill bg-[#E3A82B] text-[#141414] whitespace-nowrap">Most Popular</span>
                </div>
              )}
              
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-10 h-10 rounded-xl grid place-items-center ${plan.color}`}>{plan.icon}</span>
                    <CardTitle className="text-lg tracking-[-0.02em]">{plan.name}</CardTitle>
                  </div>
                  {isCurrentPlan && (
                    <Badge variant="outline" className="text-[#0B6B2E] border-[#0B6B2E]">
                      Current
                    </Badge>
                  )}
                </div>
                
                <div className="pt-4">
                  <div className="text-3xl font-bold tracking-[-0.04em]">
                    {formatPrice(price)}
                  </div>
                  {price > 0 && (
                    <div className="text-sm text-[#5B6475]">
                      per {isYearly ? 'year' : 'month'}
                      {isYearly && savings > 0 && (
                        <span className="ml-1 text-[#0B6B2E] font-medium">
                          (Save {savings}%)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-2 mb-6 flex-1 border-t border-[#EEF0F4] pt-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[#0B6B2E] mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-[#3A4354]">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  onClick={() => onPlanSelect(plan.id)}
                  variant={plan.buttonColor as 'default' | 'outline'}
                  className="w-full"
                  disabled={isCurrentPlan}
                >
                  {isCurrentPlan ? 'Current Plan' : plan.id === 'free' ? 'Select Free' : 'Upgrade Now'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}