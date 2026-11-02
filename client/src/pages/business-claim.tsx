import { country } from "@shared/country";
import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  Shield,
  Clock,
  HelpCircle
} from 'lucide-react';
import { Link } from 'wouter';

const businessClaimSchema = z.object({
  relationshipToBusiness: z.enum(['owner', 'manager', 'employee', 'authorized_representative'], {
    required_error: "Please select your relationship to the business"
  }),
  businessEmail: z.string().email("Please enter a valid business email").optional().or(z.literal('')),
  businessPhone: z.string().min(3, "Phone number must be at least 3 characters").optional().or(z.literal('')),
  position: z.string().optional(),
  verificationMethod: z.enum(['business_email', 'business_phone', 'business_documents', 'official_registration'], {
    required_error: "Please select a verification method"
  }),
  additionalInfo: z.string().optional(),
  notes: z.string().optional()
});

type BusinessClaimFormData = z.infer<typeof businessClaimSchema>;

export default function BusinessClaim() {
  const [, params] = useRoute('/business/:id/claim');
  const businessId = parseInt(params?.id || '0');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BusinessClaimFormData>({
    resolver: zodResolver(businessClaimSchema),
    defaultValues: {
      relationshipToBusiness: undefined,
      businessEmail: '',
      businessPhone: '',
      position: '',
      verificationMethod: undefined,
      additionalInfo: '',
      notes: ''
    }
  });

  // Get business details
  const { data: business, isLoading: businessLoading } = useQuery({
    queryKey: ['/api/businesses', businessId],
    enabled: !!businessId
  }) as { data: any, isLoading: boolean };

  // Check if user already has a claim for this business
  const { data: existingClaim } = useQuery({
    queryKey: ['/api/user/business-claims'],
    enabled: isAuthenticated
  }) as { data: any[] };

  const claimMutation = useMutation({
    mutationFn: async (data: BusinessClaimFormData) => {
      return apiRequest('POST', `/api/businesses/${businessId}/claim`, data);
    },
    onSuccess: (data) => {
      toast({
        title: "Claim Submitted Successfully!",
        description: `Your business claim has been submitted for review. Claim ID: #${data.claimId}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/business-claims'] });
      // Redirect to user dashboard
      setTimeout(() => {
        window.location.href = '/my-business-claims';
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Claim Submission Failed",
        description: error.message || "Failed to submit business claim",
        variant: "destructive",
      });
    }
  });

  const onSubmit = async (data: BusinessClaimFormData) => {
    setIsSubmitting(true);
    try {
      await claimMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check for post-login redirect and handle authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // Store the current business ID for post-login redirect
      localStorage.setItem('claimBusinessAfterLogin', `/business/${businessId}/claim`);
      // Redirect to the auth page instead of direct login
      window.location.href = `/business/${businessId}/claim-auth`;
    }
  }, [isAuthenticated, authLoading, businessId]);

  // Check for intended redirect after login
  useEffect(() => {
    if (isAuthenticated) {
      // Clear the redirect flag since user is now authenticated
      localStorage.removeItem('claimBusinessAfterLogin');
    }
  }, [isAuthenticated]);

  // Check if user already has a pending claim
  const userClaim = existingClaim && Array.isArray(existingClaim) ? existingClaim.find((claim: any) => 
    claim.businessId === businessId && claim.status === 'pending'
  ) : null;

  // Show loading state while checking authentication or fetching business
  if (authLoading || businessLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Redirect immediately if not authenticated (before rendering anything)
  if (!isAuthenticated) {
    return null; // Don't render anything while redirecting
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Business Not Found</h3>
            <p className="text-[#4B5565] mb-4">The business you're trying to claim doesn't exist.</p>
            <Link href="/businesses">
              <Button>Browse Businesses</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (business.isClaimed) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <Shield className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Business Already Claimed</h3>
            <p className="text-[#4B5565] mb-4">This business has already been claimed by its owner.</p>
            <Link href={`/business/${business.slug || businessId}`}>
              <Button>View Business</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userClaim) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <Clock className="mx-auto h-12 w-12 text-[#B45309] mb-4" />
            <h3 className="text-lg font-semibold mb-2">Claim Already Submitted</h3>
            <p className="text-[#4B5565] mb-4">
              You already have a pending claim for this business. 
              Our team is reviewing your submission.
            </p>
            <div className="space-y-2">
              <Link href="/my-business-claims">
                <Button className="w-full">View My Claims</Button>
              </Link>
              <Link href={`/business/${business.slug || businessId}`}>
                <Button variant="outline" className="w-full">View Business</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F3] py-10 sm:py-14">
      <div className="yp-wrap max-w-[1040px]">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/business/${business.slug || businessId}`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Business
            </Button>
          </Link>
          
          <div className="yp-card p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-[14px] grid place-items-center shrink-0 bg-[#E8F4EC]">
                <Building2 className="h-6 w-6 text-[#0B6B2E]" />
              </div>
              <div className="flex-1">
                <h1 className="text-[28px] sm:text-[32px] leading-[1.1] tracking-[-0.04em] font-bold text-[#0A0A0A] mb-2">Claim Business Ownership</h1>
                <p className="text-[#4B5565] mb-4">
                  Submit a claim to manage and verify ownership of this business listing
                </p>
                
                <div className="yp-tint rounded-[14px] p-4">
                  <h3 className="font-semibold text-[#0A0A0A] mb-2">{business.name}</h3>
                  <div className="space-y-1 text-sm text-[#3A4354]">
                    {business.address && <p>{business.address}</p>}
                    {business.categories?.name && (
                      <Badge variant="secondary">{business.categories.name}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Business Claim Form</CardTitle>
                <CardDescription>
                  Please provide accurate information to verify your ownership or authorization to manage this business.
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Relationship to Business */}
                    <FormField
                      control={form.control}
                      name="relationshipToBusiness"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">
                            What is your relationship to this business? *
                          </FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="grid gap-3 mt-2"
                            >
                              <div className="flex items-center space-x-2 p-4 border border-[#DDE1E8] rounded-2xl bg-white hover:border-[#0B6B2E] has-[[data-state=checked]]:border-[#0B6B2E] has-[[data-state=checked]]:bg-[#F2F9F4] transition-colors">
                                <RadioGroupItem value="owner" id="owner" />
                                <label htmlFor="owner" className="flex-1 cursor-pointer">
                                  <div className="font-medium">Business Owner</div>
                                  <div className="text-sm text-[#4B5565]">I own this business</div>
                                </label>
                              </div>
                              <div className="flex items-center space-x-2 p-4 border border-[#DDE1E8] rounded-2xl bg-white hover:border-[#0B6B2E] has-[[data-state=checked]]:border-[#0B6B2E] has-[[data-state=checked]]:bg-[#F2F9F4] transition-colors">
                                <RadioGroupItem value="manager" id="manager" />
                                <label htmlFor="manager" className="flex-1 cursor-pointer">
                                  <div className="font-medium">Manager</div>
                                  <div className="text-sm text-[#4B5565]">I manage this business</div>
                                </label>
                              </div>
                              <div className="flex items-center space-x-2 p-4 border border-[#DDE1E8] rounded-2xl bg-white hover:border-[#0B6B2E] has-[[data-state=checked]]:border-[#0B6B2E] has-[[data-state=checked]]:bg-[#F2F9F4] transition-colors">
                                <RadioGroupItem value="employee" id="employee" />
                                <label htmlFor="employee" className="flex-1 cursor-pointer">
                                  <div className="font-medium">Employee</div>
                                  <div className="text-sm text-[#4B5565]">I work for this business</div>
                                </label>
                              </div>
                              <div className="flex items-center space-x-2 p-4 border border-[#DDE1E8] rounded-2xl bg-white hover:border-[#0B6B2E] has-[[data-state=checked]]:border-[#0B6B2E] has-[[data-state=checked]]:bg-[#F2F9F4] transition-colors">
                                <RadioGroupItem value="authorized_representative" id="authorized_rep" />
                                <label htmlFor="authorized_rep" className="flex-1 cursor-pointer">
                                  <div className="font-medium">Authorized Representative</div>
                                  <div className="text-sm text-[#4B5565]">I am authorized to manage this business</div>
                                </label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    {/* Contact Information */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="businessEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#5B6475]" />
                                <Input placeholder="business@example.com" className="pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Official business email address
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="businessPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Phone</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#5B6475]" />
                                <Input placeholder={`${country.phonePrefix} XX XXX XXXX`} className="pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Official business phone number
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Position/Title */}
                    <FormField
                      control={form.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Position/Title</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#5B6475]" />
                              <Input placeholder="e.g., CEO, Manager, Director" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Your job title or position within the business
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    {/* Verification Method */}
                    <FormField
                      control={form.control}
                      name="verificationMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">
                            How would you like to verify your claim? *
                          </FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="grid gap-3 mt-2"
                            >
                              <div className="flex items-center space-x-2 p-4 border border-[#DDE1E8] rounded-2xl bg-white hover:border-[#0B6B2E] has-[[data-state=checked]]:border-[#0B6B2E] has-[[data-state=checked]]:bg-[#F2F9F4] transition-colors">
                                <RadioGroupItem value="business_email" id="email_verify" />
                                <label htmlFor="email_verify" className="flex-1 cursor-pointer">
                                  <div className="font-medium">Business Email Verification</div>
                                  <div className="text-sm text-[#4B5565]">Verify via official business email</div>
                                </label>
                              </div>
                              <div className="flex items-center space-x-2 p-4 border border-[#DDE1E8] rounded-2xl bg-white hover:border-[#0B6B2E] has-[[data-state=checked]]:border-[#0B6B2E] has-[[data-state=checked]]:bg-[#F2F9F4] transition-colors">
                                <RadioGroupItem value="business_phone" id="phone_verify" />
                                <label htmlFor="phone_verify" className="flex-1 cursor-pointer">
                                  <div className="font-medium">Phone Verification</div>
                                  <div className="text-sm text-[#4B5565]">Verify via business phone number</div>
                                </label>
                              </div>
                              <div className="flex items-center space-x-2 p-4 border border-[#DDE1E8] rounded-2xl bg-white hover:border-[#0B6B2E] has-[[data-state=checked]]:border-[#0B6B2E] has-[[data-state=checked]]:bg-[#F2F9F4] transition-colors">
                                <RadioGroupItem value="business_documents" id="doc_verify" />
                                <label htmlFor="doc_verify" className="flex-1 cursor-pointer">
                                  <div className="font-medium">Business Documents</div>
                                  <div className="text-sm text-[#4B5565]">Provide business registration documents</div>
                                </label>
                              </div>
                              <div className="flex items-center space-x-2 p-4 border border-[#DDE1E8] rounded-2xl bg-white hover:border-[#0B6B2E] has-[[data-state=checked]]:border-[#0B6B2E] has-[[data-state=checked]]:bg-[#F2F9F4] transition-colors">
                                <RadioGroupItem value="official_registration" id="reg_verify" />
                                <label htmlFor="reg_verify" className="flex-1 cursor-pointer">
                                  <div className="font-medium">Official Registration</div>
                                  <div className="text-sm text-[#4B5565]">Verify through official business registration</div>
                                </label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Additional Information */}
                    <FormField
                      control={form.control}
                      name="additionalInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Information</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Please provide any additional information that may help verify your claim..."
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Any additional details that may help verify your ownership or authorization
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Submit Button */}
                    <div className="flex justify-end pt-6">
                      <Button
                        type="submit"
                        disabled={isSubmitting || claimMutation.isPending}
                        className="min-w-32 h-12 rounded-xl px-6 text-[15px]"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Claim'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* What Happens Next */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  What Happens Next?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-[#E8F4EC] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-[#0B6B2E]">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Review Process</p>
                    <p className="text-sm text-[#4B5565]">Our team will review your claim within 2-3 business days</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-[#E8F4EC] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-[#0B6B2E]">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Verification</p>
                    <p className="text-sm text-[#4B5565]">We may contact you for additional verification if needed</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-[#E8F4EC] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-[#0B6B2E]">3</span>
                  </div>
                  <div>
                    <p className="font-medium">Notification</p>
                    <p className="text-sm text-[#4B5565]">You'll receive an email with the decision</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Access Granted</p>
                    <p className="text-sm text-[#4B5565]">Once approved, you can manage the business profile</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card>
              <CardHeader>
                <CardTitle>Benefits of Claiming</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Update business information and photos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Respond to customer reviews</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Access business analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Manage business hours and contact info</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Verify business authenticity</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Need Help */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#4B5565] mb-3">
                  If you have questions about the claiming process, contact our support team.
                </p>
                <Link href="/contact-us">
                  <Button variant="outline" size="sm" className="w-full">
                    Contact Support
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}