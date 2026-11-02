import { SEO } from "@/components/seo";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { SubscriptionPlansShowcase } from "@/components/subscription-plans-showcase";
import { country, localize } from "@shared/country";
import { ProfessionalCategorySelector } from "@/components/professional-category-selector";
import { LocationPicker } from "@/components/location-picker";
import { 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Star,
  Crown,
  Users,
  Image
} from "lucide-react";
import { t as tx, SECOND } from "@shared/i18n";
import { tj } from "@/i18n-jsx/tj";

const businessFormSchema = z.object({
  // Basic Information
  name: z.string().min(2, "Business name must be at least 2 characters").max(200, "Business name cannot exceed 200 characters"),
  arabicName: z.string().max(200, "Local-language name cannot exceed 200 characters").optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  shortDescription: z.string().max(500, "Short description cannot exceed 500 characters").optional(),
  descriptionAr: z.string().max(5000, "Description cannot exceed 5000 characters").optional(),
  categories: z.array(z.number()).min(1, "Please select at least one sub-category (a main category on its own is not enough)"),
  provinceId: z.string().min(1, `Please select a ${country.regionTerm.singular.toLowerCase()}`),
  cityId: z.string().min(1, "Please select a city"),
  localityId: z.string().min(1, "Please select a locality"),
  
  // Contact Information
  phone: z.string().min(8, "Phone number must be at least 8 characters").max(50, "Phone number cannot exceed 50 characters"),
  whatsapp: z.string().max(50, "WhatsApp number cannot exceed 50 characters").optional(),
  email: z.string().email("Please enter a valid email address").max(200, "Email cannot exceed 200 characters"),
  website: z.string().url("Please enter a valid website URL").max(500, "Website URL cannot exceed 500 characters").optional().or(z.literal("")),
  
  // Address Information
  address: z.string().min(5, "Address must be at least 5 characters"),
  poBox: z.string().max(100, "P.O. Box cannot exceed 100 characters").optional(),
  
  // Business Details
  workingHours: z.string().min(5, "Working hours must be at least 5 characters"),
  establishedYear: z.string().optional(),
  services: z.string().optional(),
  logo: z.string().optional(),
});

type BusinessFormData = z.infer<typeof businessFormSchema>;

type Step = 'plans' | 'basic' | 'categories' | 'contact' | 'location' | 'details' | 'preview';

const steps: { key: Step; title: string; description: string }[] = [
  { key: 'plans', title: 'Choose Plan', description: 'Select the perfect plan for your business' },
  { key: 'basic', title: 'Basic Info', description: 'Business name and description' },
  { key: 'categories', title: 'Categories', description: 'Select your business categories' },
  { key: 'contact', title: 'Contact', description: 'Phone, email, and website' },
  { key: 'location', title: 'Location', description: 'Address and location details' },
  { key: 'details', title: 'Details', description: 'Working hours and services' },
  { key: 'preview', title: 'Preview', description: 'Review and submit' }
];

export default function AddBusinessProfessional() {
  const [currentStep, setCurrentStep] = useState<Step>('plans');
  const [selectedPlan, setSelectedPlan] = useState<string>('free');
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm<BusinessFormData>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: {
      name: "",
      arabicName: "",
      descriptionAr: "",
      description: "",
      shortDescription: "",
      categories: [],
      provinceId: "",
      cityId: "",
      localityId: "",
      phone: "",
      whatsapp: "",
      email: "",
      website: "",
      address: "",
      poBox: "",
      workingHours: "",
      establishedYear: "",
      services: "",
      logo: ""
    }
  });

  const { data: subscription } = useQuery({
    queryKey: ["/api/user/subscription"],
    queryFn: () => apiRequest("GET", "/api/user/subscription"),
  });

  const { data: provinces = [] } = useQuery({
    queryKey: ["/api/provinces"],
    queryFn: () => apiRequest("GET", "/api/provinces"),
  });

  const { data: localities = [] } = useQuery({
    queryKey: ["/api/localities"],
    queryFn: () => apiRequest("GET", "/api/localities"),
  });

  const createBusinessMutation = useMutation({
    mutationFn: (data: BusinessFormData) => {
      const { cityId: _cityId, ...rest } = data; // the city is derived from the locality on the server
      const formData = {
        ...rest,
        categoryId: data.categories[0]?.toString() || "",
        additionalCategoryIds: data.categories.slice(1).map(id => id.toString()),
        workingHours: JSON.stringify({ general: data.workingHours })
      };
      return apiRequest("POST", "/api/businesses", formData);
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your business has been submitted successfully.",
      });
      navigate("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create business",
        variant: "destructive",
      });
    }
  });

  const isPremium = subscription?.planName !== 'free';
  const currentStepIndex = steps.findIndex(s => s.key === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const nextStep = () => {
    const currentIndex = steps.findIndex(s => s.key === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].key);
    }
  };

  const prevStep = () => {
    const currentIndex = steps.findIndex(s => s.key === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].key);
    }
  };

  const handleSubmit = form.handleSubmit((data) => {
    if (currentStep === 'preview') {
      createBusinessMutation.mutate(data);
    } else {
      nextStep();
    }
  });

  const getStepFields = (step: Step): (keyof BusinessFormData)[] => {
    switch (step) {
      case 'basic': return ['name', 'arabicName', 'description', 'shortDescription'];
      case 'categories': return ['categories'];
      case 'contact': return ['phone', 'whatsapp', 'email', 'website'];
      case 'location': return ['provinceId', 'cityId', 'localityId', 'address', 'poBox'];
      case 'details': return ['workingHours', 'establishedYear', 'services', 'logo'];
      default: return [];
    }
  };

  const isStepValid = (step: Step): boolean => {
    const fields = getStepFields(step);
    return fields.every(field => {
      const value = form.getValues(field);
      const error = form.formState.errors[field];
      if (field === 'categories') {
        return Array.isArray(value) && value.length > 0;
      }
      return !error && value !== undefined && value !== '';
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'plans':
        return (
          <div className="space-y-6">
            <SubscriptionPlansShowcase currentPlan={subscription?.planName || 'free'} />
            <div className="flex justify-center">
              <Button size="lg" onClick={() => setCurrentStep('basic')}>
                Continue to Add Business <ArrowRight className="ms-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        );

      case 'basic':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter business name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="arabicName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Urdu / Local-Language Name (Optional)</FormLabel>
                    <FormControl>
                      <Input dir={country.localLanguage?.dir || "auto"} lang={country.localLanguage?.code} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Description *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your business, services, and what makes you unique..."
                      className="min-h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {SECOND && (
              <FormField
                control={form.control}
                name="descriptionAr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tx("Business Description in {0} (Optional)", SECOND!.englishName)}</FormLabel>
                    <FormControl>
                      <Textarea dir={SECOND!.dir} lang={SECOND!.code} className="min-h-32" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="shortDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief tagline or summary for your business..."
                      className="min-h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 'categories':
        return (
          <div className="space-y-6">
            <ProfessionalCategorySelector
              selectedCategories={form.watch('categories')}
              onCategoryChange={(categories) => form.setValue('categories', categories)}
              isPremium={isPremium}
            />
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input placeholder={tx("{0} XX XXX XXXX", country.phonePrefix)} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder={tx("{0} XX XXX XXXX", country.phonePrefix)} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input placeholder="contact@yourbusiness.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://www.yourbusiness.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 'location':
        return (
          <div className="space-y-6">
            <LocationPicker form={form} provinces={provinces as Array<{ id: number; name: string }>} idPrefix="add-business" />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter your complete business address..."
                      className="min-h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="poBox"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>P.O. Box (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="P.O. Box number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 'details':
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="workingHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Working Hours *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="e.g., Monday-Friday: 9:00 AM - 6:00 PM, Saturday: 9:00 AM - 2:00 PM"
                      className="min-h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="establishedYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Established Year (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 2020" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="logo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://your-logo-url.com/logo.png" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="services"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Services & Products (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="List your main services and products..."
                      className="min-h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 'preview':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Preview</CardTitle>
                <CardDescription>Review your business information before submitting</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Basic Information</h4>
                    <p><strong>Name:</strong> {form.watch('name')}</p>
                    {form.watch('arabicName') && <p><strong>Local-Language Name:</strong> {form.watch('arabicName')}</p>}
                    <p><strong>Description:</strong> {form.watch('description')}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Contact Information</h4>
                    <p><strong>Phone:</strong> {form.watch('phone')}</p>
                    <p><strong>Email:</strong> {form.watch('email')}</p>
                    {form.watch('website') && <p><strong>Website:</strong> {form.watch('website')}</p>}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {form.watch('categories').map((categoryId, index) => (
                      <Badge key={index} variant="secondary">{tj("Category {0}", categoryId)}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <SEO
        title="Add Your Business – Free Listing | PakistanYP"
        description="List your company on Pakistan Yellow Pages. Reach customers across all provinces and territories with a verified business profile, contact details and reviews."
        canonical="https://pakistanyp.com/add-business"
      />
      <Header />
      
      <div className="yp-wrap py-10 sm:py-14">
        {/* Progress Header */}
        <div className="mx-auto mb-8 max-w-4xl">
          <div className="mb-8">
            <span className="yp-label">List your business</span>
            <h1 className="mt-2 text-[32px] font-bold leading-tight tracking-[-0.045em] sm:text-[40px]">Add Your Business</h1>
            <p className="mt-2 text-[16px] text-[#5B6475]">Follow these simple steps to list your business</p>
          </div>

          <div className="mb-3 flex items-center justify-between text-[13px] text-[#5B6475]">
            <span>{tj("Step {0} of {1}", currentStepIndex + 1, steps.length)}</span>
            <span>{tj("{0}% Complete", Math.round(progress))}</span>
          </div>
          {/* Step Navigation */}
          <ol className="m-0 flex list-none gap-2 p-0" aria-label="Steps">
            {steps.map((step, index) => (
              <li key={step.key} className="flex min-w-0 flex-1 flex-col gap-2" aria-current={index === currentStepIndex ? "step" : undefined}>
                <span className={`h-1 rounded-full ${index <= currentStepIndex ? "bg-[#0B6B2E]" : "bg-[#DDE1E8]"}`} />
                <span className={`hidden truncate text-[13px] md:block ${index === currentStepIndex ? "font-semibold text-[#0A0A0A]" : index < currentStepIndex ? "text-[#05501F]" : "text-[#5B6475]"}`}>
                  {index < currentStepIndex && <CheckCircle className="me-1 inline h-3.5 w-3.5 align-[-2px]" />}
                  {index + 1}. {step.title}
                </span>
              </li>
            ))}
          </ol>
          <Progress value={progress} className="sr-only" />
        </div>

        {/* Form Content */}
        <div className="max-w-4xl mx-auto">
          <Card className="rounded-[24px] shadow-[0_24px_60px_-36px_rgba(10,10,10,.3)]">
            <CardHeader className="p-6 sm:p-10 sm:pb-6">
              <CardTitle className="flex items-center gap-3 text-[24px] font-bold tracking-[-0.035em]">
                {currentStep === 'plans' && <Crown className="w-5 h-5" />}
                {currentStep === 'basic' && <Building className="w-5 h-5" />}
                {currentStep === 'categories' && <Star className="w-5 h-5" />}
                {currentStep === 'contact' && <Phone className="w-5 h-5" />}
                {currentStep === 'location' && <MapPin className="w-5 h-5" />}
                {currentStep === 'details' && <Clock className="w-5 h-5" />}
                {currentStep === 'preview' && <CheckCircle className="w-5 h-5" />}
                {steps.find(s => s.key === currentStep)?.title}
              </CardTitle>
              <CardDescription>
                {steps.find(s => s.key === currentStep)?.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 sm:p-10 sm:pt-0">
              <Form {...form}>
                <form onSubmit={handleSubmit}>
                  {renderStepContent()}
                  
                  {currentStep !== 'plans' && (
                    <div className="flex flex-wrap justify-between gap-3 mt-8 pt-6 border-t border-[#EEF0F4]">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={prevStep}
                        disabled={currentStep === 'basic'}
                      >
                        <ArrowLeft className="w-4 h-4 me-2" />
                        Previous
                      </Button>
                      <Button 
                        type={currentStep === 'preview' ? "submit" : "button"}
                        onClick={currentStep === 'preview' ? undefined : nextStep}
                        disabled={createBusinessMutation.isPending}
                      >
                        {createBusinessMutation.isPending ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Creating...
                          </div>
                        ) : currentStep === 'preview' ? (
                          "Create Business"
                        ) : (
                          <>
                            Next
                            <ArrowRight className="w-4 h-4 ms-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}