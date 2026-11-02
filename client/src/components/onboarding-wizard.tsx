import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PakistanypLogo, FlagStripe } from '@/components/brand/pakistanyp-logo';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  MapPin, 
  Building2, 
  Heart, 
  Bell, 
  Shield, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Star,
  Briefcase,
  Search,
  Users,
  Target,
  Sparkles
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { country, localize } from '@shared/country';
import { useToast } from '@/hooks/use-toast';
import { tj } from "@/i18n-jsx/tj";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ComponentType<OnboardingStepProps>;
}

interface OnboardingStepProps {
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
  userData: any;
  setUserData: (data: any) => void;
}

interface UserPreferences {
  preferredProvinces: string[];
  interestedCategories: string[];
  businessRole: string;
  notifications: {
    email: boolean;
    sms: boolean;
    recommendations: boolean;
  };
  goals: string[];
}

// Welcome Step Component
function WelcomeStep({ onNext }: OnboardingStepProps) {
  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto rounded-[18px] bg-[#E8F4EC] text-[#0B6B2E] grid place-items-center">
        <Sparkles className="w-8 h-8" aria-hidden="true" />
      </div>
      
      <div className="space-y-3">
        <h2 className="text-[32px] tracking-[-0.04em] font-bold text-[#0A0A0A]">
          {localize("Welcome to PakistanYP!")}
        </h2>
        <p className="text-lg text-[#4B5565] max-w-2xl mx-auto">
          {localize("Let's personalize your experience and help you discover the best businesses across Pakistan. This quick setup will take just 2 minutes.")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {[
          { icon: <User className="w-6 h-6" />, title: "Personal Profile", desc: "Set up your preferences" },
          { icon: <MapPin className="w-6 h-6" />, title: "Location & Interests", desc: "Choose your areas" },
          { icon: <Bell className="w-6 h-6" />, title: "Notifications", desc: "Stay updated" }
        ].map((feature, index) => (
          <div key={index} className="yp-panel p-5 text-start">
            <div className="w-12 h-12 rounded-[14px] bg-[#E8F4EC] text-[#0B6B2E] grid place-items-center mb-3">{feature.icon}</div>
            <h3 className="font-semibold text-[#0A0A0A]">{feature.title}</h3>
            <p className="text-sm text-[#4B5565]">{feature.desc}</p>
          </div>
        ))}
      </div>

      <Button onClick={onNext} size="lg" className="h-12 rounded-xl px-6 text-[15px]">
        Get Started
        <ArrowRight className="w-4 h-4 ms-2" />
      </Button>
    </div>
  );
}

// Profile Setup Step
function ProfileStep({ onNext, onPrevious, userData, setUserData }: OnboardingStepProps) {
  const [role, setRole] = useState(userData.businessRole || '');

  const roles = [
    { id: 'consumer', title: 'Consumer', desc: 'Looking for businesses and services', icon: <Search className="w-6 h-6" /> },
    { id: 'business_owner', title: 'Business Owner', desc: 'I own or manage a business', icon: <Building2 className="w-6 h-6" /> },
    { id: 'employee', title: 'Employee', desc: `Working for a company ${country.inName}`, icon: <Briefcase className="w-6 h-6" /> },
    { id: 'investor', title: 'Investor', desc: 'Looking for investment opportunities', icon: <Target className="w-6 h-6" /> }
  ];

  const handleNext = () => {
    if (role) {
      setUserData({ ...userData, businessRole: role });
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-[26px] tracking-[-0.035em] font-bold text-[#0A0A0A] mb-2">
          {localize("What brings you to PakistanYP?")}
        </h2>
        <p className="text-[#4B5565]">
          This helps us personalize your experience
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((roleOption, index) => (
          <Card 
            key={roleOption.id}
            className={`cursor-pointer transition-colors border-[1.5px] rounded-2xl ${
              role === roleOption.id 
                ? 'border-[#0B6B2E] bg-[#F2F9F4]' 
                : 'border-[#DDE1E8] hover:border-[#0B6B2E]'
            }`}
            onClick={() => setRole(roleOption.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-start space-x-4 rtl:space-x-reverse">
                <div className={`w-12 h-12 grid place-items-center shrink-0 rounded-[14px] ${
                  role === roleOption.id ? 'bg-[#0B6B2E] text-white' : 'bg-[#F1F2F6] text-[#334155]'
                }`}>
                  {roleOption.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#0A0A0A] mb-1">
                    {roleOption.title}
                  </h3>
                  <p className="text-sm text-[#4B5565]">
                    {roleOption.desc}
                  </p>
                </div>
                {role === roleOption.id && (
                  <CheckCircle className="w-5 h-5 text-[#0B6B2E]" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 me-2" />
          Previous
        </Button>
        <Button onClick={handleNext} disabled={!role}>
          Next
          <ArrowRight className="w-4 h-4 ms-2" />
        </Button>
      </div>
    </div>
  );
}

// Location & Interests Step
function LocationStep({ onNext, onPrevious, userData, setUserData }: OnboardingStepProps) {
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>(userData.preferredProvinces || []);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(userData.interestedCategories || []);

  const { data: provinces } = useQuery({
    queryKey: ['/api/provinces'],
    queryFn: () => fetch('/api/provinces').then(res => res.json())
  });

  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => fetch('/api/categories').then(res => res.json())
  });

  const toggleProvince = (provinceId: string) => {
    setSelectedProvinces(prev => 
      prev.includes(provinceId) 
        ? prev.filter(id => id !== provinceId)
        : [...prev, provinceId]
    );
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleNext = () => {
    setUserData({ 
      ...userData, 
      preferredProvinces: selectedProvinces,
      interestedCategories: selectedCategories 
    });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-[26px] tracking-[-0.035em] font-bold text-[#0A0A0A] mb-2">
          Where are you interested in?
        </h2>
        <p className="text-[#4B5565]">
          {localize("Select provinces and business categories that interest you")}
        </p>
      </div>

      {/* Provinces Selection */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-[#0A0A0A] flex items-center">
          <MapPin className="w-5 h-5 me-2 text-blue-500" />
          {localize("Preferred Provinces")}
        </h3>
        <div className="flex flex-wrap gap-2">
          {provinces?.map((province: any) => (
            <Badge
              key={province.id}
              variant={selectedProvinces.includes(province.id.toString()) ? "default" : "secondary"}
              className={`cursor-pointer transition-all duration-200 ${
                selectedProvinces.includes(province.id.toString()) 
                  ? 'bg-blue-500 hover:bg-blue-600' 
                  : 'hover:bg-gray-200'
              }`}
              onClick={() => toggleProvince(province.id.toString())}
            >
              {province.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Categories Selection */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-[#0A0A0A] flex items-center">
          <Heart className="w-5 h-5 me-2 text-red-500" />
          Interested Categories
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
          {categories?.slice(0, 15).map((category: any) => (
            <Badge
              key={category.id}
              variant={selectedCategories.includes(category.id.toString()) ? "default" : "secondary"}
              className={`cursor-pointer transition-all duration-200 text-xs ${
                selectedCategories.includes(category.id.toString()) 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'hover:bg-gray-200'
              }`}
              onClick={() => toggleCategory(category.id.toString())}
            >
              {category.name}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 me-2" />
          Previous
        </Button>
        <Button onClick={handleNext} disabled={selectedProvinces.length === 0}>
          Next
          <ArrowRight className="w-4 h-4 ms-2" />
        </Button>
      </div>
    </div>
  );
}

// Notifications & Goals Step
function NotificationsStep({ onNext, onPrevious, userData, setUserData }: OnboardingStepProps) {
  const [notifications, setNotifications] = useState(userData.notifications || {
    email: true,
    sms: false,
    recommendations: true
  });
  const [goals, setGoals] = useState<string[]>(userData.goals || []);

  const goalOptions = [
    { id: 'find_services', title: 'Find Local Services', icon: <Search className="w-4 h-4" /> },
    { id: 'discover_restaurants', title: 'Discover Restaurants', icon: <Heart className="w-4 h-4" /> },
    { id: 'business_networking', title: 'Business Networking', icon: <Users className="w-4 h-4" /> },
    { id: 'promote_business', title: 'Promote My Business', icon: <Building2 className="w-4 h-4" /> },
    { id: 'investment_opportunities', title: 'Find Investments', icon: <Target className="w-4 h-4" /> },
    { id: 'market_research', title: 'Market Research', icon: <Star className="w-4 h-4" /> }
  ];

  const toggleGoal = (goalId: string) => {
    setGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleNext = () => {
    setUserData({ 
      ...userData, 
      notifications,
      goals 
    });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-[26px] tracking-[-0.035em] font-bold text-[#0A0A0A] mb-2">
          Stay Connected & Set Goals
        </h2>
        <p className="text-[#4B5565]">
          Configure notifications and tell us your goals
        </p>
      </div>

      {/* Notification Preferences */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[#0A0A0A] flex items-center">
          <Bell className="w-5 h-5 me-2 text-green-500" />
          Notification Preferences
        </h3>
        <div className="space-y-3">
          {[
            { key: 'email', title: 'Email Notifications', desc: 'Updates about businesses and reviews' },
            { key: 'sms', title: 'SMS Alerts', desc: 'Important updates via text message' },
            { key: 'recommendations', title: 'Personalized Recommendations', desc: 'AI-powered business suggestions' }
          ].map((option) => (
            <Card key={option.key} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-[#0A0A0A]">{option.title}</h4>
                  <p className="text-sm text-[#4B5565]">{option.desc}</p>
                </div>
                <Button
                  variant={notifications[option.key as keyof typeof notifications] ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNotifications(prev => ({ ...prev, [option.key]: !prev[option.key as keyof typeof prev] }))}
                >
                  {notifications[option.key as keyof typeof notifications] ? 'On' : 'Off'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Goals Selection */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-[#0A0A0A] flex items-center">
          <Target className="w-5 h-5 me-2 text-purple-500" />
          Your Goals
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {goalOptions.map((goal) => (
            <Card
              key={goal.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                goals.includes(goal.id) 
                  ? 'border-[#0B6B2E] bg-[#F2F9F4]' 
                  : 'hover:border-purple-300'
              }`}
              onClick={() => toggleGoal(goal.id)}
            >
              <CardContent className="p-4 text-center">
                <div className={`mx-auto mb-2 w-8 h-8 rounded-full flex items-center justify-center ${
                  goals.includes(goal.id) ? 'bg-purple-500 text-white' : 'bg-[#F1F2F6] text-[#334155]'
                }`}>
                  {goal.icon}
                </div>
                <h4 className="text-sm font-medium text-[#0A0A0A]">
                  {goal.title}
                </h4>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 me-2" />
          Previous
        </Button>
        <Button onClick={handleNext}>
          Next
          <ArrowRight className="w-4 h-4 ms-2" />
        </Button>
      </div>
    </div>
  );
}

// Completion Step
function CompletionStep({ onComplete, userData }: OnboardingStepProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (preferences: UserPreferences) => 
      apiRequest('POST', '/api/user/onboarding', preferences),
    onSuccess: () => {
      toast({
        title: "Welcome aboard!",
        description: "Your preferences have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      onComplete();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleComplete = () => {
    saveMutation.mutate(userData);
  };

  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto rounded-[18px] bg-[#E8F4EC] text-[#0B6B2E] grid place-items-center">
        <CheckCircle className="w-8 h-8" aria-hidden="true" />
      </div>

      <div className="space-y-3">
        <h2 className="text-[32px] tracking-[-0.04em] font-bold text-[#0A0A0A]">
          You're All Set!
        </h2>
        <p className="text-lg text-[#4B5565] max-w-2xl mx-auto">
          {localize("Welcome to PakistanYP! Your personalized experience is ready.")}
        </p>
      </div>

      {/* Summary of selections */}
      <div className="yp-panel p-6 space-y-4 text-start">
        <h3 className="font-semibold text-[#0A0A0A]">Your Profile Summary:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-[#3A4354]">Role:</span>
            <span className="ms-2 text-[#4B5565] capitalize">
              {userData.businessRole?.replace('_', ' ')}
            </span>
          </div>
          <div>
            <span className="font-medium text-[#3A4354]">{localize("Provinces:")}</span>
            <span className="ms-2 text-[#4B5565]">{tj("{0} selected", userData.preferredProvinces?.length || 0)}</span>
          </div>
          <div>
            <span className="font-medium text-[#3A4354]">Interests:</span>
            <span className="ms-2 text-[#4B5565]">{tj("{0} categories", userData.interestedCategories?.length || 0)}</span>
          </div>
          <div>
            <span className="font-medium text-[#3A4354]">Goals:</span>
            <span className="ms-2 text-[#4B5565]">{tj("{0} selected", userData.goals?.length || 0)}</span>
          </div>
        </div>
      </div>

      <Button 
        onClick={handleComplete} 
        size="lg" 
        className="h-12 rounded-xl px-6 text-[15px]"
        disabled={saveMutation.isPending}
      >
        {saveMutation.isPending ? 'Saving...' : 'Complete Setup'}
        <CheckCircle className="w-4 h-4 ms-2" />
      </Button>
    </div>
  );
}

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState<UserPreferences>({
    preferredProvinces: [],
    interestedCategories: [],
    businessRole: '',
    notifications: {
      email: true,
      sms: false,
      recommendations: true
    },
    goals: []
  });
  const [, setLocation] = useLocation();

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome',
      description: localize('Get started with PakistanYP'),
      icon: <Sparkles className="w-5 h-5" />,
      component: WelcomeStep
    },
    {
      id: 'profile',
      title: 'Profile',
      description: 'Tell us about yourself',
      icon: <User className="w-5 h-5" />,
      component: ProfileStep
    },
    {
      id: 'location',
      title: 'Location & Interests',
      description: 'Choose your preferences',
      icon: <MapPin className="w-5 h-5" />,
      component: LocationStep
    },
    {
      id: 'notifications',
      title: 'Notifications & Goals',
      description: 'Stay connected',
      icon: <Bell className="w-5 h-5" />,
      component: NotificationsStep
    },
    {
      id: 'completion',
      title: 'Complete',
      description: 'You\'re all set!',
      icon: <CheckCircle className="w-5 h-5" />,
      component: CompletionStep
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setLocation('/dashboard');
  };

  const CurrentStepComponent = steps[currentStep].component;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#0A0A0A]">
      <FlagStripe />
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-[clamp(24px,4vw,48px)] py-6">
        <PakistanypLogo href="/" />
        <span className="yp-label">{tj("Step {0} of {1}", currentStep + 1, steps.length)}</span>
      </header>
      <div className="px-4 sm:px-6 pt-2 pb-16">
        {/* Progress Header */}
        <div className="max-w-4xl mx-auto mb-6">
          <h1 className="text-[28px] sm:text-[32px] leading-[1.1] tracking-[-0.04em] font-bold mb-5">
            Set up your profile
          </h1>

          {/* Progress Bar */}
          <ol className="list-none m-0 p-0 flex gap-2" aria-label="Steps">
            {steps.map((step, index) => (
              <li
                key={step.id}
                className="flex-1 min-w-0 flex flex-col gap-2"
                aria-current={index === currentStep ? "step" : undefined}
              >
                <span className={`h-1 rounded-full ${index <= currentStep ? 'bg-[#0B6B2E]' : 'bg-[#DDE1E8]'}`} />
                <span
                  className={`hidden sm:flex items-center gap-1.5 text-[13px] truncate ${
                    index === currentStep ? 'font-semibold text-[#0A0A0A]' : index < currentStep ? 'text-[#0B6B2E]' : 'text-[#5B6475]'
                  }`}
                >
                  {step.icon}
                  {step.title}
                </span>
              </li>
            ))}
          </ol>
          <span className="sr-only">{tj("{0}% complete", Math.round(progress))}</span>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto bg-white border border-[#E7E9EE] rounded-[24px] shadow-[0_24px_60px_-36px_rgba(10,10,10,.3)] p-6 sm:p-10">
          <CurrentStepComponent
            onNext={handleNext}
            onPrevious={handlePrevious}
            onComplete={handleComplete}
            userData={userData}
            setUserData={setUserData}
          />
        </div>
      </div>
    </div>
  );
}
