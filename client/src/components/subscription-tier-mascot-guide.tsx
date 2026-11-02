import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles, 
  Crown, 
  Zap, 
  Rocket, 
  Star, 
  Gift,
  ArrowRight,
  CheckCircle,
  Heart,
  Lightbulb
} from "lucide-react";
import { FadeIn } from "@/components/ui/fade-in";
import { AnimatedCard } from "@/components/ui/animated-card";
import { t as tx } from "@shared/i18n";
import { tj } from "@/i18n-jsx/tj";

interface MascotCharacter {
  id: string;
  name: string;
  personality: string;
  emoji: string;
  color: string;
  gradient: string;
  icon: React.ReactNode;
  catchphrase: string;
  description: string;
  features: string[];
  tips: string[];
}

interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  description: string;
  features: string[];
  limits: {
    listings: number | string;
    images: number | string;
    featured_listings: number | string;
  };
  mascot: MascotCharacter;
}

const mascotCharacters: Record<string, MascotCharacter> = {
  free: {
    id: "free",
    name: "Buddy",
    personality: "Friendly & Encouraging",
    emoji: "🌱",
    color: "text-green-600",
    gradient: "bg-green-400",
    icon: <Sparkles className="w-6 h-6" />,
    catchphrase: "Everyone starts somewhere!",
    description: "Buddy is here to help you take your first steps in Pakistan business world. He's patient, supportive, and believes every great business started with a single listing.",
    features: [
      "1 business listing to get started",
      "Community support from fellow entrepreneurs", 
      "Basic categories to showcase your business",
      "Mobile-friendly business profile"
    ],
    tips: [
      "Make your first listing count with detailed descriptions",
      "Use high-quality images to attract customers",
      "Engage with the community for networking opportunities",
      "Consider upgrading when you're ready to grow"
    ]
  },
  premium: {
    id: "premium",
    name: "Phoenix",
    personality: "Ambitious & Growth-Focused",
    emoji: "🔥",
    color: "text-[#B45309]",
    gradient: "bg-[#B45309]",
    icon: <Zap className="w-6 h-6" />,
    catchphrase: "Rise above the competition!",
    description: "Phoenix represents transformation and growth. She's passionate about helping businesses evolve from startups to established brands with powerful tools and insights.",
    features: [
      "10 business listings for expansion",
      "Email support for quick assistance",
      "Analytics dashboard to track performance",
      "Premium badge for credibility",
      "Enhanced search visibility"
    ],
    tips: [
      "Use analytics to understand your audience better",
      "Leverage multiple listings for different services",
      "Premium badge builds customer trust",
      "Monitor competitors through market insights"
    ]
  },
  professional: {
    id: "professional",
    name: "Atlas",
    personality: "Strategic & Professional",
    emoji: "💼",
    color: "text-blue-600", 
    gradient: "bg-blue-400",
    icon: <Crown className="w-6 h-6" />,
    catchphrase: "Master your market domain!",
    description: "Atlas carries the weight of business success on his shoulders. He's methodical, strategic, and equipped with advanced tools for serious entrepreneurs ready to dominate their market.",
    features: [
      "50 business listings for market presence",
      "Priority support for immediate assistance",
      "Full analytics suite with competitor insights",
      "API access for custom integrations",
      "Premium features and advanced tools"
    ],
    tips: [
      "Use API access to integrate with your existing systems",
      "Leverage competitor insights for strategic planning",
      "Priority support means faster problem resolution",
      "Scale across multiple market segments"
    ]
  },
  enterprise: {
    id: "enterprise",
    name: "Titan",
    personality: "Powerful & Unlimited",
    emoji: "⚡",
    color: "text-purple-600",
    gradient: "bg-purple-400", 
    icon: <Rocket className="w-6 h-6" />,
    catchphrase: "Unleash unlimited potential!",
    description: "Titan represents ultimate business power. He's the guardian of enterprise-level capabilities, offering unlimited resources and premium support for market leaders.",
    features: [
      "Unlimited business listings",
      "Phone support with dedicated account manager",
      "Advanced analytics with AI insights",
      "Full API access and custom integrations",
      "Premium features and white-label options",
      "Custom branding and enterprise tools"
    ],
    tips: [
      "Leverage unlimited listings for comprehensive market coverage",
      "Use dedicated support for strategic business planning",
      "AI insights help predict market trends",
      "Custom integrations streamline operations"
    ]
  }
};

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "free",
    name: "free",
    displayName: "Free",
    price: 0,
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: "PKR",
    description: "Perfect for getting started with basic business listings",
    features: ["Basic business listings", "Community support", "Limited categories"],
    limits: { listings: 1, images: 3, featured_listings: 0 },
    mascot: mascotCharacters.free
  },
  {
    id: "premium", 
    name: "premium",
    displayName: "Premium",
    price: 199,
    monthlyPrice: 199,
    yearlyPrice: 1992,
    currency: "PKR",
    description: "Grow your business with enhanced features and analytics",
    features: ["Enhanced business listings", "Email support", "Analytics dashboard", "Premium badge"],
    limits: { listings: 10, images: 15, featured_listings: 2 },
    mascot: mascotCharacters.premium
  },
  {
    id: "professional",
    name: "professional", 
    displayName: "Professional",
    price: 599,
    monthlyPrice: 599,
    yearlyPrice: 5990,
    currency: "PKR",
    description: "Advanced business solution with premium support",
    features: ["Advanced listings", "Priority support", "Full analytics", "API access", "Premium badge"],
    limits: { listings: 50, images: 50, featured_listings: 10 },
    mascot: mascotCharacters.professional
  },
  {
    id: "enterprise",
    name: "enterprise",
    displayName: "Enterprise", 
    price: 499,
    monthlyPrice: 499,
    yearlyPrice: 4990,
    currency: "PKR",
    description: "Complete business solution with unlimited access",
    features: ["Unlimited listings", "Phone support", "Advanced analytics", "API access", "Premium features", "Custom integrations"],
    limits: { listings: "unlimited", images: "unlimited", featured_listings: "unlimited" },
    mascot: mascotCharacters.enterprise
  }
];

interface MascotGuideDialogProps {
  plan: SubscriptionPlan;
  trigger: React.ReactNode;
}

function MascotGuideDialog({ plan, trigger }: MascotGuideDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const mascot = plan.mascot;
  
  const steps = [
    {
      title: tx("Meet {0}!", mascot.name),
      content: (
        <div className="text-center space-y-4">
          <div className={`text-6xl`}>{mascot.emoji}</div>
          <div className={`text-2xl font-bold ${mascot.color}`}>{mascot.name}</div>
          <div className="text-sm text-muted-foreground italic">"{mascot.catchphrase}"</div>
          <p className="text-sm leading-relaxed">{mascot.description}</p>
          <Badge variant="secondary" className="text-xs">{mascot.personality}</Badge>
        </div>
      )
    },
    {
      title: tx("{0} Features", plan.displayName),
      content: (
        <div className="space-y-4">
          <div className={`text-3xl text-center`}>{mascot.emoji}</div>
          <div className="space-y-3">
            {mascot.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className={`w-5 h-5 mt-0.5 ${mascot.color} flex-shrink-0`} />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: tx("{0}'s Pro Tips", mascot.name),
      content: (
        <div className="space-y-4">
          <div className={`text-3xl text-center`}>{mascot.emoji}</div>
          <div className="space-y-3">
            {mascot.tips.map((tip, index) => (
              <div key={index} className="flex items-start gap-3">
                <Lightbulb className={`w-5 h-5 mt-0.5 text-[#B45309] flex-shrink-0`} />
                <span className="text-sm">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">{steps[currentStep].title}</DialogTitle>
        </DialogHeader>
        
        <div className="py-6">
          {steps[currentStep].content}
        </div>

        <div className="space-y-4">
          <Progress value={((currentStep + 1) / steps.length) * 100} className="h-2" />
          
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={prevStep}
              disabled={currentStep === 0}
              size="sm"
            >
              Previous
            </Button>
            
            <span className="text-xs text-muted-foreground self-center">{tj("{0} of {1}", currentStep + 1, steps.length)}</span>
            
            <Button 
              onClick={nextStep}
              disabled={currentStep === steps.length - 1}
              size="sm"
              className={`${mascot.gradient} text-white`}
            >
              Next <ArrowRight className="w-4 h-4 ms-1" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MascotPlanCard({ plan }: { plan: SubscriptionPlan }) {
  const mascot = plan.mascot;
  
  return (
    <AnimatedCard className={`relative overflow-hidden border-2 hover:border-opacity-60 transition-all duration-300`}>
      <div className={`absolute top-0 start-0 end-0 h-1 ${mascot.gradient}`} />
      
      <CardHeader className="text-center space-y-2">
        <div className="text-4xl animate-pulse">{mascot.emoji}</div>
        <CardTitle className={`text-xl ${mascot.color}`}>{plan.displayName}</CardTitle>
        <div className="text-2xl font-bold">
          {plan.price === 0 ? "Free" : tx("{0} {1}/mo", plan.currency, plan.monthlyPrice)}
        </div>
        <CardDescription className="text-xs italic">{tj("\"Meet {0} - {1}\"", mascot.name, mascot.personality)}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {plan.description}
        </p>
        
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Key Features:</div>
          <div className="grid gap-1">
            {plan.features.slice(0, 3).map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div className={`w-1.5 h-1.5 rounded-full ${mascot.color.replace('text-', 'bg-')}`} />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
        
        <MascotGuideDialog 
          plan={plan}
          trigger={
            <Button 
              variant="outline" 
              size="sm" 
              className={`w-full hover:${mascot.gradient} hover:text-white transition-all duration-300`}
            >
              <Heart className="w-4 h-4 me-2" />{tj("Meet {0}", mascot.name)}</Button>
          }
        />
      </CardContent>
    </AnimatedCard>
  );
}

export default function SubscriptionTierMascotGuide() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <FadeIn>
        <div className="text-center space-y-4">
          <div className="flex justify-center items-center gap-2">
            <Star className="w-8 h-8 text-[#F59E0B]" />
            <h2 className="text-3xl font-bold">Meet Your Business Guides</h2>
            <Star className="w-8 h-8 text-[#F59E0B]" />
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Each subscription tier comes with a unique mascot guide who understands your business needs and will help you succeed at every level.
          </p>
          <div className="flex justify-center gap-1">
            {["🌱", "🔥", "💼", "⚡"].map((emoji, index) => (
              <span key={index} className="text-2xl" style={{animationDelay: `${index * 0.2}s`}}>
                {emoji}
              </span>
            ))}
          </div>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {subscriptionPlans.map((plan, index) => (
          <FadeIn key={plan.id} delay={index * 0.1}>
            <MascotPlanCard plan={plan} />
          </FadeIn>
        ))}
      </div>

      <FadeIn delay={0.5}>
        <Card className="bg-blue-50 border-dashed">
          <CardContent className="p-6 text-center space-y-4">
            <Gift className="w-12 h-12 mx-auto text-purple-600" />
            <h3 className="text-xl font-semibold">Special Mascot Benefits</h3>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Your mascot guide provides personalized tips, exclusive content, and ongoing support tailored to your subscription level. 
              They'll help you maximize your plan's potential and achieve your business goals!
            </p>
            <div className="flex justify-center gap-4 text-xs text-muted-foreground">
              <span>Personalized Tips</span>
              <span>Exclusive Content</span>
              <span>Goal Tracking</span>
              <span>Ongoing Support</span>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}

export { SubscriptionTierMascotGuide, MascotGuideDialog, type MascotCharacter, type SubscriptionPlan };