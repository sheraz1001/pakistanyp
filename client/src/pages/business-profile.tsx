import { dateLocale } from "@shared/i18n";
import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/header";
import Footer from "@/components/footer";
import QuickShareQRCode from "@/components/quick-share-qr-code";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Star, 
  MapPin, 
  Phone, 
  Globe, 
  Mail, 
  Clock, 
  Eye, 
  Building,
  MessageCircle,
  Share2,
  Heart,
  Flag,
  Calendar
} from "lucide-react";
import { country } from "@shared/country";
import { t as tx } from "@shared/i18n";
import { tj } from "@/i18n-jsx/tj";

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(10, "Review must be at least 10 characters"),
});

const enquirySchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export default function BusinessProfile() {
  const [, params] = useRoute("/business/:slug");
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: business, isLoading } = useQuery({
    queryKey: ['/api/businesses', params?.slug],
    enabled: !!params?.slug,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['/api/businesses', business?.id, 'reviews'],
    enabled: !!business?.id,
  });

  const reviewForm = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      title: "",
      content: "",
    },
  });

  const enquiryForm = useForm({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async (data: z.infer<typeof reviewSchema>) => {
      await apiRequest('POST', `/api/businesses/${business.id}/reviews`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/businesses', business.id, 'reviews'] });
      reviewForm.reset();
      toast({
        title: "Review submitted",
        description: "Your review has been submitted successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    },
  });

  const enquiryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof enquirySchema>) => {
      await apiRequest('POST', `/api/businesses/${business.id}/enquiries`, data);
    },
    onSuccess: () => {
      enquiryForm.reset();
      toast({
        title: "Enquiry sent",
        description: "Your enquiry has been sent to the business owner.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send enquiry. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F3]">
        <Header />
        <div className="yp-wrap py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-6"></div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="h-48 bg-gray-200 rounded"></div>
              </div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-[#FAF8F3]">
        <Header />
        <div className="yp-wrap py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Business not found</h1>
          <Button onClick={() => navigate('/categories')} className="btn-primary">
            Browse Businesses
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const workingHours = business.workingHours || {};
  const currentDay = new Date().toLocaleLowerCase().slice(0, 3);

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <Header />
      
      {/* Breadcrumb */}
      <div className="bg-white">
        <div className="yp-wrap pt-6">
          <nav className="text-sm">
            <ol className="flex items-center space-x-2 rtl:space-x-reverse">
              <li><a href="/" className="text-[#0B6B2E] hover:text-[#05501F]">Home</a></li>
              <li className="text-gray-500">/</li>
              <li><a href="/categories" className="text-[#0B6B2E] hover:text-[#05501F]">Categories</a></li>
              <li className="text-gray-500">/</li>
              <li className="text-gray-900 font-medium">{business.name}</li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Business Header */}
      <div className="bg-white">
        <div className="yp-wrap py-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 bg-[#E8F4EC] rounded-[24px] flex items-center justify-center flex-shrink-0">
                  <Building className="w-12 h-12 text-[#0B6B2E]" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-[clamp(28px,3.4vw,40px)] font-bold leading-[1.1] tracking-[-0.04em] text-[#0A0A0A] mb-2 break-words">{business.name}</h1>
                      <p className="text-lg text-gray-600 mb-3">{business.shortDescription}</p>
                      
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center">
                          <div className="flex text-[#F59E0B] me-2">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-5 h-5 ${i < Math.floor(business.ratingAverage) ? 'fill-current' : ''}`}
                              />
                            ))}
                          </div>
                          <span className="font-medium">{business.ratingAverage}</span>
                          <span className="text-gray-500 ms-1">{tj("({0} reviews)", business.ratingCount)}</span>
                        </div>
                        
                        <div className="flex items-center text-gray-500">
                          <Eye className="w-4 h-4 me-1" />
                          <span>{tj("{0} views", business.viewCount)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {business.isVerified && (
                        <span className="yp-verified">Verified</span>
                      )}
                      {business.isFeatured && (
                        <span className="yp-pill bg-[#FDECEC] text-[#B3141B]">Featured</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="w-5 h-5 me-2" />
                    <span>{business.address}, {business.locality}</span>
                  </div>
                  
                  {workingHours[currentDay] && (
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-5 h-5 me-2" />
                      <span>{tj("Open today: {0} - {1}", workingHours[currentDay].open, workingHours[currentDay].close)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Contact Card */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {business.phone && (
                    <div className="flex items-center">
                      <Phone className="w-5 h-5 me-3 text-[#5B6475]" />
                      <div>
                        <div className="font-medium">Phone</div>
                        <div className="text-gray-600">{business.phone}</div>
                      </div>
                    </div>
                  )}
                  
                  {business.email && (
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 me-3 text-[#5B6475]" />
                      <div>
                        <div className="font-medium">Email</div>
                        <div className="text-gray-600">{business.email}</div>
                      </div>
                    </div>
                  )}
                  
                  {business.website && (
                    <div className="flex items-center">
                      <Globe className="w-5 h-5 me-3 text-[#5B6475]" />
                      <div>
                        <div className="font-medium">Website</div>
                        <a 
                          href={business.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[#0B6B2E] hover:text-[#05501F]"
                        >
                          Visit Website
                        </a>
                      </div>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Button className="w-full">
                      <MessageCircle className="w-4 h-4 me-2" />
                      Send Message
                    </Button>
                    <QuickShareQRCode business={business} size="sm" showShareButtons={false} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-[#E7E9EE]">
        <div className="yp-wrap">
          <nav className="flex gap-6 overflow-x-auto" aria-label="Sections">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'reviews', label: tx("Reviews ({0})", reviews.length) },
              { id: 'contact', label: 'Contact' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[48px] py-3 px-1 border-b-2 font-medium text-[15px] shrink-0 ${
                  activeTab === tab.id
                    ? 'border-[#0B6B2E] text-[#0A0A0A]'
                    : 'border-transparent text-[#5B6475] hover:text-[#0A0A0A]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="yp-wrap py-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">
                      {business.description || "No description available."}
                    </p>
                  </CardContent>
                </Card>

                {business.services && business.services.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Services</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {business.services.map((service: string, index: number) => (
                          <Badge key={index} variant="secondary">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Business Hours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(workingHours).length > 0 ? (
                      <div className="space-y-2">
                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                          <div key={day} className="flex justify-between">
                            <span className="capitalize font-medium">{day}</span>
                            <span className="text-gray-600">
                              {workingHours[day] ? 
                                `${workingHours[day].open} - ${workingHours[day].close}` : 
                                'Closed'
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">Hours not available</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {isAuthenticated && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Write a Review</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Form {...reviewForm}>
                        <form onSubmit={reviewForm.handleSubmit((data) => reviewMutation.mutate(data))} className="space-y-4">
                          <FormField
                            control={reviewForm.control}
                            name="rating"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Rating</FormLabel>
                                <FormControl>
                                  <Select value={field.value.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {[5, 4, 3, 2, 1].map((rating) => (
                                        <SelectItem key={rating} value={rating.toString()}>
                                          <div className="flex items-center">
                                            <div className="flex text-[#F59E0B] me-2">
                                              {[...Array(rating)].map((_, i) => (
                                                <Star key={i} className="w-4 h-4 fill-current" />
                                              ))}
                                            </div>{tj("{0} star{1}", rating, rating !== 1 ? 's' : '')}</div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={reviewForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Review Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="Summarize your experience" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={reviewForm.control}
                            name="content"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Your Review</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Share your experience with this business..."
                                    rows={4}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button 
                            type="submit" 
                            className="btn-primary"
                            disabled={reviewMutation.isPending}
                          >
                            {reviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-4">
                  {reviews.length > 0 ? (
                    reviews.map((review: any) => (
                      <Card key={review.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center mb-2">
                                <div className="flex text-[#F59E0B] me-2">
                                  {[...Array(5)].map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`w-4 h-4 ${i < review.rating ? 'fill-current' : ''}`}
                                    />
                                  ))}
                                </div>
                                <span className="font-medium">{review.title}</span>
                              </div>
                              <p className="text-gray-700">{review.content}</p>
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString(dateLocale())}
                            </div>
                          </div>
                          
                          {review.response && (
                            <div className="mt-4 p-4 bg-[#F7F8FA] rounded-xl">
                              <div className="font-medium text-sm text-gray-700 mb-2">
                                Response from business:
                              </div>
                              <p className="text-sm text-gray-600">{review.response}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">No reviews yet</h3>
                      <p className="text-gray-500">Be the first to review this business</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <Card>
                <CardHeader>
                  <CardTitle>Send Enquiry</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...enquiryForm}>
                    <form onSubmit={enquiryForm.handleSubmit((data) => enquiryMutation.mutate(data))} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={enquiryForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={enquiryForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="Your email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={enquiryForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Your phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={enquiryForm.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject</FormLabel>
                            <FormControl>
                              <Input placeholder="What is your enquiry about?" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={enquiryForm.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Your message to the business..."
                                rows={5}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="btn-primary"
                        disabled={enquiryMutation.isPending}
                      >
                        {enquiryMutation.isPending ? 'Sending...' : 'Send Enquiry'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {business.establishedYear && (
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 me-3 text-[#5B6475]" />
                    <div>
                      <div className="font-medium">Established</div>
                      <div className="text-gray-600">{business.establishedYear}</div>
                    </div>
                  </div>
                )}
                
                {business.employeeCount && (
                  <div className="flex items-center">
                    <Building className="w-5 h-5 me-3 text-[#5B6475]" />
                    <div>
                      <div className="font-medium">Company Size</div>
                      <div className="text-gray-600">{tj("{0} employees", business.employeeCount)}</div>
                    </div>
                  </div>
                )}
                
                {business.tradeLicense && (
                  <div className="flex items-center">
                    <Flag className="w-5 h-5 me-3 text-[#5B6475]" />
                    <div>
                      <div className="font-medium">{country.licenceAuthority.charAt(0).toUpperCase() + country.licenceAuthority.slice(1)}</div>
                      <div className="text-gray-600">{business.tradeLicense}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {business.specialties && business.specialties.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Specialties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {business.specialties.map((specialty: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
