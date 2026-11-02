import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";
import Breadcrumb from "@/components/breadcrumb";
import { SEO, SEOConfigs } from "@/components/seo";
import CoreWebVitals from "@/components/core-web-vitals";
import { country, localize } from "@shared/country";
import { Button } from "@/components/ui/button";
import { 
  Check, 
  Crown, 
  Star, 
  Building, 
  Zap, 
  Shield, 
  TrendingUp, 
  Users, 
  Award,
  ArrowRight,
  Sparkles,
  Globe,
  BarChart3,
  Headphones,
  Clock,
  X,
  Minus,
  Camera,
  Phone,
  Mail,
  Search,
  FileText,
  Settings,
  Smartphone,
  Eye,
  Lock,
  MapPin
} from "lucide-react";

export default function Pricing() {
  const { data: liveStats } = useQuery<any>({ queryKey: ['/api/stats'] });
  const [, setLocation] = useLocation();
  const [isYearly, setIsYearly] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handlePlanSelect = (planId: string) => {
    if (planId === "free") {
      setLocation("/add-business-enhanced");
    } else {
      const billingParam = isYearly ? '?billing=yearly' : '';
      setLocation(`/subscribe/${planId}${billingParam}`);
    }
  };

  const plans = [
    {
      id: "free",
      name: "Free",
      price: 0,
      yearlyPrice: 0,
      description: "Perfect for getting started",
      icon: <Zap className="w-6 h-6" />,
      color: "bg-[#F1F2F6] text-[#334155]",
      features: [
        "1 Business listing",
        "1 Main category",
        "3 Subcategories", 
        "Basic business profile",
        "Contact information display",
        "Search visibility",
        "Basic analytics"
      ],
      limits: "1 Business • 1 Category"
    },
    {
      id: "premium",
      name: "Premium",
      price: 199,
      yearlyPrice: 159,
      description: "Most popular for growing businesses",
      popular: true,
      icon: <Crown className="w-6 h-6" />,
      color: "bg-[#E8F4EC] text-[#0B6B2E]",
      discount: 20,
      features: [
        "5 Business listings",
        "Unlimited categories",
        "Premium badge",
        "Enhanced business profile",
        "Priority search ranking",
        "Advanced analytics",
        "Social media integration",
        "Logo upload",
        "Photo gallery (20 images)",
        "Email & phone support"
      ],
      limits: "5 Businesses • Unlimited Categories"
    },
    {
      id: "professional", 
      name: "Professional",
      price: 599,
      yearlyPrice: 479,
      description: "For established businesses",
      icon: <Star className="w-6 h-6" />,
      color: "bg-[#E6F6F1] text-[#047857]",
      discount: 20,
      features: [
        "15 Business listings",
        "Unlimited categories",
        "Professional badge",
        "Featured business placement",
        "Custom business URL",
        "Premium analytics dashboard",
        "API access",
        "Custom branding",
        "Photo gallery (50 images)",
        "Video uploads",
        "Review management tools",
        "Priority support"
      ],
      limits: "15 Businesses • All Features"
    },
    {
      id: "enterprise",
      name: "Enterprise", 
      price: 1299,
      yearlyPrice: 1039,
      description: "For large organizations",
      icon: <Building className="w-6 h-6" />,
      color: "bg-[#FDECEC] text-[#B91C1C]",
      discount: 20,
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
        "Advanced reporting",
        "Multi-user access"
      ],
      limits: "Unlimited Everything"
    }
  ];

  return (
    <>
      <SEO 
        title="Pricing Plans - Pakistani Business Directory | PakistanYP.com"
        description="Choose the perfect business directory plan for your Pakistani business. From free listings to enterprise solutions. Transparent pricing with no hidden fees. Start free today!"
        keywords="Pakistani business directory pricing, business listing plans, premium business features, enterprise directory solutions, Karachi business plans, Lahore business listings"
        canonical="https://pakistanyp.com/pricing"
        ogTitle="Business Directory Pricing Plans | PakistanYP"
        ogDescription="Choose the perfect plan for your Pakistani business directory needs. Free to enterprise solutions available."
        ogImage="/og-homepage.jpg"
        ogType="website"
        schemaType="WebPage"
        schemaData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Pricing Plans - Pakistani Business Directory",
          "description": "Choose the perfect business directory plan for your Pakistani business. Transparent pricing with no hidden fees.",
          "url": "https://pakistanyp.com/pricing"
        }}
      />
      <CoreWebVitals />
      
      <Header />

      <div className="bg-[#FAF8F3] text-[#0A0A0A]">
      {/* Hero Section */}
      <section className="bg-white border-b border-[#E7E9EE]">
        <div className="yp-wrap pt-8 pb-16 md:pb-24">
          <Breadcrumb items={[
            { label: "Home", href: "/" },
            { label: "Pricing", href: "/pricing" }
          ]} className="mb-10" />
          
          <div className="text-center flex flex-col items-center gap-5">
            <span className="yp-label !text-[#0B6B2E]">Transparent Pricing - No Hidden Fees</span>
            
            <h1 className="yp-h1 max-w-4xl">
              Choose Your Perfect Plan
            </h1>
            
            <p className="yp-lead max-w-3xl">
              {localize("From free listings to enterprise solutions, find the perfect plan to showcase your Pakistani business. Join thousands of businesses already growing with PakistanYP.")}
            </p>

            {/* Trust Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl pt-4">
              {([
                [liveStats?.totalBusinesses, 'Listed Businesses'],
                [liveStats?.totalCategories, 'Business Categories'],
                [liveStats?.totalLocalities ?? liveStats?.totalCities, localize('Pakistani Localities')],
              ] as [unknown, string][])
                .filter(([value]) => typeof value === 'number' && value > 0)
                .map(([value, label]) => [Number(value).toLocaleString('en-US'), label])
                .map(([value, label]) => (
                <div key={label} className="yp-panel p-5">
                  <div className="text-3xl font-bold tracking-[-0.04em]">{value}</div>
                  <div className="text-sm text-[#5B6475] mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="yp-wrap pt-16 md:pt-24">
        {/* Billing Toggle */}
        <div className="text-center mb-12 flex flex-col items-center gap-4">
          <span className="yp-label">Plans</span>
          <h2 className="yp-h2">Choose Your Perfect Plan</h2>
          <p className="yp-lead max-w-3xl">
            Transparent pricing with no hidden fees. Start free and upgrade as you grow.
          </p>
          
          <div className="inline-flex items-center gap-1 p-1 mt-2 rounded-full bg-white border border-[#E3E6EC]" role="group" aria-label="Billing period">
            <button
              type="button"
              onClick={() => setIsYearly(false)}
              aria-pressed={!isYearly}
              className={`min-h-[40px] px-5 rounded-full text-sm font-semibold transition-colors ${!isYearly ? 'bg-[#0B6B2E] text-white' : 'text-[#3A4354] hover:text-[#0A0A0A]'}`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setIsYearly(true)}
              aria-pressed={isYearly}
              className={`min-h-[40px] px-5 rounded-full text-sm font-semibold transition-colors ${isYearly ? 'bg-[#0B6B2E] text-white' : 'text-[#3A4354] hover:text-[#0A0A0A]'}`}
            >
              Yearly
            </button>
          </div>
          
          {isYearly && (
            <span className="yp-tag yp-tag-green font-medium">
              Save up to 20% with yearly billing
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`relative bg-white rounded-[24px] p-7 flex flex-col transition-shadow hover:shadow-[0_24px_48px_-36px_rgba(0,115,47,.45)] ${
                plan.popular ? 'border-2 border-[#0B6B2E]' : 'border border-[#E7E9EE]'
              }`}
            >
              {plan.popular && (
                <span className="yp-pill bg-[#E3A82B] text-[#141414] absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  Most Popular
                </span>
              )}

              <span className={`w-12 h-12 rounded-[14px] grid place-items-center mb-5 ${plan.color}`}>
                {plan.icon}
              </span>
              <h3 className="yp-h3">{plan.name}</h3>
              <p className="text-sm text-[#5B6475] mt-1">{plan.description}</p>

              <div className="mt-6 mb-6">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-bold tracking-[-0.04em]">
                    {plan.price === 0 ? 'Free' : `${isYearly ? plan.yearlyPrice : plan.price} ${country.currency}`}
                  </span>
                  {plan.price > 0 && <span className="text-[#5B6475]">/month</span>}
                </div>
                {plan.price > 0 && isYearly && plan.discount && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[#5B6475] line-through text-sm">{plan.price}{" " + country.currency}</span>
                    <span className="yp-pill bg-[#E8F4EC] text-[#05501F]">
                      Save {plan.discount}%
                    </span>
                  </div>
                )}
                <div className="yp-label mt-3">{plan.limits}</div>
              </div>

              <ul className="space-y-3 mb-8 border-t border-[#EEF0F4] pt-6 flex-1">
                {plan.features.slice(0, 6).map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#0B6B2E] mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span className="text-[#3A4354] text-sm">{feature}</span>
                  </li>
                ))}
                {plan.features.length > 6 && (
                  <li className="text-sm text-[#5B6475] pl-8">
                    +{plan.features.length - 6} more features
                  </li>
                )}
              </ul>

              <Button 
                variant={plan.popular ? "default" : "outline"}
                className="w-full min-h-[48px] text-[15px]"
                onClick={() => handlePlanSelect(plan.id)}
              >
                {plan.price === 0 ? 'Start Free' : 'Get Started'}
                <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose */}
      <section className="yp-wrap pt-16 md:pt-24">
        <div className="mb-10">
          <span className="yp-label">{localize("Why PakistanYP")}</span>
          <h2 className="yp-h2 mt-2 mb-3">{localize("Why Choose PakistanYP?")}</h2>
          <p className="yp-lead max-w-3xl">
            {`Built specifically for the ${country.adjective} market with features that help your business succeed`}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: Globe, tile: 'bg-[#E8F4EC] text-[#0B6B2E]', title: localize('Pakistani-Focused Platform'), text: `Built specifically for the ${country.adjective} market with local expertise and Urdu and regional language support` },
            { icon: BarChart3, tile: 'bg-[#E6F6F1] text-[#047857]', title: 'Advanced Analytics', text: 'Detailed insights into your business performance with real-time analytics and reporting' },
            { icon: Headphones, tile: 'bg-[#FFF4E0] text-[#B45309]', title: '24/7 Support', text: 'Dedicated support team available around the clock to help your business succeed' },
          ].map((item) => (
            <div key={item.title} className="yp-card p-7 flex flex-col gap-4">
              <span className={`w-12 h-12 rounded-[14px] grid place-items-center ${item.tile}`}>
                <item.icon className="w-6 h-6" aria-hidden="true" />
              </span>
              <h3 className="yp-h3">{item.title}</h3>
              <p className="text-[15px] leading-relaxed text-[#4B5565]">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Detailed Plan Comparison */}
      <section className="yp-wrap pt-16 md:pt-24">
        <div className="mb-10">
          <span className="yp-label">Compare</span>
          <h2 className="yp-h2 mt-2 mb-3">Compare All Plans</h2>
          <p className="yp-lead max-w-3xl">
            See exactly what's included in each plan and choose the perfect fit for your business needs
          </p>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto bg-white rounded-[20px] border border-[#E7E9EE]">
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="grid grid-cols-5 gap-4 px-6 py-5 bg-[#F7F8FA]">
              <div className="font-semibold self-end">Features</div>
              <div className="text-center">
                <div className="text-lg font-bold">Free</div>
                <div className="text-sm text-[#5B6475]">Get Started</div>
              </div>
              <div className="text-center">
                <span className="yp-pill bg-[#E3A82B] text-[#141414] mb-1.5">Best Value</span>
                <div className="text-lg font-bold text-[#0B6B2E]">Premium</div>
                <div className="text-sm text-[#5B6475]">Most Popular</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">Professional</div>
                <div className="text-sm text-[#5B6475]">For Growth</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">Enterprise</div>
                <div className="text-sm text-[#5B6475]">Full Scale</div>
              </div>
            </div>

            {/* Pricing Row */}
            <div className="grid grid-cols-5 gap-4 px-6 py-5 border-t border-[#EEF0F4]">
              <div className="font-semibold flex items-center gap-2">
                <Award className="w-5 h-5 text-[#0B6B2E]" aria-hidden="true" />
                Monthly Price
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold tracking-[-0.03em]">Free</div>
                <div className="text-xs text-[#5B6475]">Forever</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold tracking-[-0.03em] text-[#0B6B2E]">
                  {isYearly ? '159' : '199'}{" " + country.currency}
                </div>
                {isYearly && (
                  <div className="text-xs text-[#0B6B2E] font-medium">Save 20%</div>
                )}
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold tracking-[-0.03em]">
                  {isYearly ? '479' : '599'}{" " + country.currency}
                </div>
                {isYearly && (
                  <div className="text-xs text-[#0B6B2E] font-medium">Save 20%</div>
                )}
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold tracking-[-0.03em]">
                  {isYearly ? '1039' : '1299'}{" " + country.currency}
                </div>
                {isYearly && (
                  <div className="text-xs text-[#0B6B2E] font-medium">Save 20%</div>
                )}
              </div>
            </div>

            {/* Feature Comparison Rows */}
            {[
                {
                  category: "Business Listings",
                  icon: <Building className="w-5 h-5" />,
                  features: [
                    { name: "Number of Listings", values: ["1", "5", "15", "Unlimited"] },
                    { name: "Business Categories", values: ["1", "Unlimited", "Unlimited", "Unlimited"] },
                    { name: "Business Profile", values: ["Basic", "Enhanced", "Professional", "Enterprise"] },
                    { name: "Custom Business URL", values: [false, false, true, true] },
                    { name: "Logo Upload", values: [false, true, true, true] },
                    { name: "Photo Gallery", values: ["1 image", "20 images", "50 images", "Unlimited"] }
                  ]
                },
                {
                  category: "Visibility & Marketing",
                  icon: <Eye className="w-5 h-5" />,
                  features: [
                    { name: "Search Ranking", values: ["Standard", "Priority", "Featured", "Top Placement"] },
                    { name: "Premium Badge", values: [false, true, true, true] },
                    { name: "Featured Placement", values: [false, false, true, true] },
                    { name: "Social Media Integration", values: [false, true, true, true] },
                    { name: "SEO Optimization", values: ["Basic", "Advanced", "Premium", "Enterprise"] }
                  ]
                },
                {
                  category: "Analytics & Insights",
                  icon: <BarChart3 className="w-5 h-5" />,
                  features: [
                    { name: "Basic Analytics", values: [true, true, true, true] },
                    { name: "Advanced Analytics", values: [false, true, true, true] },
                    { name: "Premium Dashboard", values: [false, false, true, true] },
                    { name: "Custom Reports", values: [false, false, false, true] },
                    { name: "API Access", values: [false, false, true, true] }
                  ]
                },
                {
                  category: "Support & Services",
                  icon: <Headphones className="w-5 h-5" />,
                  features: [
                    { name: "Email Support", values: [true, true, true, true] },
                    { name: "Phone Support", values: [false, true, true, true] },
                    { name: "Priority Support", values: [false, false, true, true] },
                    { name: "Dedicated Manager", values: [false, false, false, true] },
                    { name: "24/7 Support", values: [false, false, false, true] }
                  ]
                },
                {
                  category: "Advanced Features",
                  icon: <Settings className="w-5 h-5" />,
                  features: [
                    { name: "Review Management", values: [false, false, true, true] },
                    { name: "Multi-user Access", values: [false, false, false, true] },
                    { name: "White-label Solutions", values: [false, false, false, true] },
                    { name: "Custom Integrations", values: [false, false, false, true] },
                    { name: "Bulk Upload Tools", values: [false, false, false, true] }
                  ]
                }
            ].map((category, categoryIndex) => (
              <div key={categoryIndex}>
                {/* Category Header */}
                <div className="px-6 py-4 bg-[#F7F8FA] border-t border-[#EEF0F4]">
                  <div className="yp-label !text-[#3A4354] flex items-center gap-2">
                    {category.icon}
                    <span>{category.category}</span>
                  </div>
                </div>
                
                {/* Category Features */}
                {category.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="grid grid-cols-5 gap-4 px-6 py-4 border-t border-[#EEF0F4] hover:bg-[#FAFBFC] transition-colors">
                    <div className="text-[#3A4354] font-medium text-[15px]">{feature.name}</div>
                    {feature.values.map((value, valueIndex) => (
                      <div key={valueIndex} className="text-center text-[15px]">
                        {typeof value === 'boolean' ? (
                          value ? (
                            <Check className="w-5 h-5 text-[#0B6B2E] mx-auto" aria-label="Included" />
                          ) : (
                            <X className="w-5 h-5 text-[#C9CED8] mx-auto" aria-label="Not included" />
                          )
                        ) : (
                          <span className="font-medium">{value}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}

            {/* Action Buttons */}
            <div className="grid grid-cols-5 gap-4 px-6 py-5 bg-[#F7F8FA] border-t border-[#EEF0F4]">
              <div className="font-semibold self-center">Get Started</div>
              <div className="text-center">
                <Button variant="outline" onClick={() => handlePlanSelect("free")} className="w-full">
                  Start Free
                </Button>
              </div>
              <div className="text-center">
                <Button onClick={() => handlePlanSelect("premium")} className="w-full">
                  Choose Premium
                </Button>
              </div>
              <div className="text-center">
                <Button variant="outline" onClick={() => handlePlanSelect("professional")} className="w-full">
                  Go Professional
                </Button>
              </div>
              <div className="text-center">
                <Button variant="outline" onClick={() => handlePlanSelect("enterprise")} className="w-full">
                  Contact Sales
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Plan Highlights */}
        <div className="mt-10 yp-tint rounded-[28px] p-8 md:p-12">
          <span className="yp-label !text-[#0B6B2E]">At a glance</span>
          <h3 className="text-2xl font-bold tracking-[-0.03em] mt-2 mb-8">Plan Highlights</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Zap, tile: 'bg-[#F1F2F6] text-[#334155]', title: 'Free Plan', text: 'Perfect for individual businesses testing the platform' },
              { icon: Crown, tile: 'bg-[#E8F4EC] text-[#0B6B2E]', title: 'Premium Plan', text: 'Ideal for growing businesses wanting enhanced visibility' },
              { icon: Star, tile: 'bg-[#E6F6F1] text-[#047857]', title: 'Professional Plan', text: 'Best for established businesses with multiple locations' },
              { icon: Building, tile: 'bg-[#FDECEC] text-[#B91C1C]', title: 'Enterprise Plan', text: 'Complete solution for large organizations and franchises' },
            ].map((item) => (
              <div key={item.title} className="bg-white border border-[#DCEBE1] rounded-[18px] p-5">
                <span className={`w-12 h-12 rounded-[14px] grid place-items-center mb-4 ${item.tile}`}>
                  <item.icon className="w-6 h-6" aria-hidden="true" />
                </span>
                <h4 className="font-semibold mb-1">{item.title}</h4>
                <p className="text-sm text-[#4B5565]">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="yp-wrap py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="yp-label">FAQ</span>
            <h2 className="yp-h2 mt-2 mb-3">Frequently Asked Questions</h2>
            <p className="yp-lead">Everything you need to know about our pricing</p>
          </div>
          
          <div className="grid gap-4">
            {[
              { icon: Clock, q: 'Can I change my plan later?', a: "Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing adjustments. No questions asked, no penalties." },
              { icon: Shield, q: 'What happens to my listings if I downgrade?', a: 'Your listings remain active and visible. However, premium features like enhanced profiles, priority rankings, and advanced analytics will be limited based on your new plan until you upgrade again.' },
              { icon: Award, q: 'Do you offer refunds?', a: "Yes! We offer a 30-day money-back guarantee for all paid plans. If you're not completely satisfied with our service, contact our support team for a full refund, no questions asked." },
              { icon: TrendingUp, q: 'Are there any setup fees or hidden charges?', a: 'No setup fees, no hidden charges, no surprises. The price you see is exactly what you pay. You can cancel anytime without penalties or cancellation fees.' },
            ].map((item) => (
              <div key={item.q} className="yp-card p-6 md:p-8">
                <h3 className="text-lg font-semibold tracking-[-0.02em] mb-3 flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-[#0B6B2E] shrink-0" aria-hidden="true" />
                  {item.q}
                </h3>
                <p className="text-[15px] text-[#4B5565] leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      </div>

      <Footer />
    </>
  );
}