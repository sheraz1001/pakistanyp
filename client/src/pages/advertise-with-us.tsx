import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, Star, Crown, Zap, Users, Eye, Phone, Mail, ArrowRight, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import SEO from '@/components/seo';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { country, localize } from '@shared/country';

const advertiseSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  contactName: z.string().min(2, 'Contact name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(8, 'Please enter a valid phone number'),
  website: z.string().url('Please enter a valid website URL').optional().or(z.literal('')),
  packageType: z.string().min(1, 'Please select a package'),
  advertisingGoals: z.string().min(1, 'Please select your advertising goals'),
  budget: z.string().min(1, 'Please select your budget range'),
  currentMarketing: z.string().optional(),
  additionalServices: z.array(z.string()).optional(),
  message: z.string().min(20, 'Message must be at least 20 characters'),
});

type AdvertiseFormData = z.infer<typeof advertiseSchema>;

export default function AdvertiseWithUs() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<AdvertiseFormData>({
    resolver: zodResolver(advertiseSchema),
    defaultValues: {
      businessName: '',
      contactName: '',
      email: '',
      phone: '',
      website: '',
      packageType: '',
      advertisingGoals: '',
      budget: '',
      currentMarketing: '',
      additionalServices: [],
      message: '',
    },
  });

  const onSubmit = async (data: AdvertiseFormData) => {
    setIsSubmitting(true);
    try {
      // Here you would typically send the data to your API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Advertising Inquiry Sent",
        description: "Our marketing team will contact you within 24 hours to discuss your advertising package.",
      });
      
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send inquiry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const packages = [
    {
      name: "Essential",
      price: `${country.currency} 299`,
      period: "per month",
      color: "bg-[#E8F4EC] text-[#0B6B2E]",
      popular: false,
      features: [
        "Premium business listing",
        "Business logo display",
        "Contact information",
        "5 business images",
        "Basic analytics",
        "Email support"
      ]
    },
    {
      name: "Professional",
      price: `${country.currency} 599`,
      period: "per month", 
      color: "bg-[#E6F6F1] text-[#047857]",
      popular: true,
      features: [
        "Everything in Essential",
        "Featured listing placement",
        "15 business images",
        "Video showcase",
        "Advanced analytics",
        "Social media integration",
        "Priority support",
        "Customer review management"
      ]
    },
    {
      name: "Enterprise",
      price: `${country.currency} 1,199`,
      period: "per month",
      color: "bg-[#FFF4E0] text-[#B45309]",
      popular: false,
      features: [
        "Everything in Professional",
        "Top category placement",
        "Unlimited images",
        "Multiple locations",
        "API access",
        "Custom branding",
        "Dedicated account manager",
        "Monthly reporting calls"
      ]
    }
  ];

  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "PakistanYP Business Advertising Services",
    "description": "Promote your business across Pakistan with our comprehensive advertising packages",
    "provider": {
      "@type": "Organization",
      "name": "PakistanYP Business Directory"
    },
    "offers": packages.map(pkg => ({
      "@type": "Offer",
      "name": pkg.name,
      "price": pkg.price.replace(`${country.currency} `, ''),
      "priceCurrency": "PKR"
    }))
  };

  return (
    <>
      <SEO 
        title="Advertise with PakistanYP - Premium Business Advertising Packages"
        description="Boost your business visibility across Pakistan with PakistanYP's premium advertising packages. Featured listings, enhanced profiles, and targeted marketing solutions."
        keywords="Pakistani business advertising, premium business listings, featured business, Pakistan marketing, business promotion, directory advertising"
        canonical="https://pakistanyp.com/advertise-with-us"
        schemaType="Service"
        structuredData={[schemaMarkup]}
      />
      <Header />
      <div className="min-h-screen bg-[#FAF8F3] text-[#0A0A0A]">

        {/* Header */}
        <section className="bg-[#F2F9F4] border-b border-[#CFE8D8]">
          <div className="yp-wrap py-16 md:py-24 text-center flex flex-col items-center gap-5">
            <span className="yp-label !text-[#0B6B2E]">Advertise with us</span>
            <h1 className="yp-h1 max-w-4xl">{localize("Advertise with PakistanYP")}</h1>
            <p className="yp-lead max-w-3xl">
              {localize("Reach thousands of potential customers across Pakistan. Our premium advertising packages help your business stand out in the competitive Pakistani market.")}
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              
              
              <span className="yp-pill bg-white border border-[#CFE8D8] text-[#05501F] gap-1.5"><Star className="w-3.5 h-3.5" aria-hidden="true" />{localize("#1 Pakistani Business Directory")}</span>
            </div>
          </div>
        </section>

        <div className="yp-wrap py-16 md:py-24">
          {/* Packages */}
          <section className="mb-16 md:mb-24">
            <div className="text-center mb-12">
              <span className="yp-label">Packages</span>
              <h2 className="yp-h2 mt-2">Choose Your Package</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5 items-stretch">
              {packages.map((pkg, index) => (
                <div key={index} className={`relative bg-white rounded-[24px] p-7 md:p-8 flex flex-col ${pkg.popular ? 'border-2 border-[#0B6B2E]' : 'border border-[#E7E9EE]'}`}>
                  {pkg.popular && (
                    <span className="yp-pill bg-[#E3A82B] text-[#141414] absolute -top-3 left-1/2 -translate-x-1/2">
                      Most Popular
                    </span>
                  )}
                  <span className={`w-12 h-12 rounded-[14px] grid place-items-center mb-5 ${pkg.color}`}>
                    {index === 0 && <Star className="w-6 h-6" aria-hidden="true" />}
                    {index === 1 && <Crown className="w-6 h-6" aria-hidden="true" />}
                    {index === 2 && <Zap className="w-6 h-6" aria-hidden="true" />}
                  </span>
                  <h3 className="yp-h3">{pkg.name}</h3>
                  <div className="mt-3 mb-6 text-4xl font-bold tracking-[-0.04em]">
                    {pkg.price}
                    <span className="text-base font-normal tracking-normal text-[#5B6475]">/{pkg.period}</span>
                  </div>
                  <ul className="space-y-3 border-t border-[#EEF0F4] pt-6">
                    {pkg.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-[#0B6B2E] flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <span className="text-[15px] text-[#3A4354]">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Contact Form */}
          <div className="max-w-4xl mx-auto">
            <div className="yp-card rounded-[24px] p-6 md:p-10">
              <div className="text-center mb-8">
                <span className="yp-label">Enquiry</span>
                <h2 className="yp-h2 mt-2 mb-3">Get Started Today</h2>
                <p className="text-[#4B5565]">
                  Fill out the form below and our marketing team will contact you within 24 hours
                </p>
              </div>
              <div>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="businessName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Your business name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="contactName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="your@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number *</FormLabel>
                            <FormControl>
                              <Input placeholder={`${country.phonePrefix} ${country.phonePlaceholder}`} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://yourwebsite.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="packageType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Interested Package *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a package" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="essential">{`Essential - ${country.currency} 299/month`}</SelectItem>
                                <SelectItem value="professional">{`Professional - ${country.currency} 599/month`}</SelectItem>
                                <SelectItem value="enterprise">{`Enterprise - ${country.currency} 1,199/month`}</SelectItem>
                                <SelectItem value="custom">Custom Package</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="budget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monthly Budget Range *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select budget range" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="under-500">{`Under ${country.currency} 500`}</SelectItem>
                                <SelectItem value="500-1000">{`${country.currency} 500 - 1,000`}</SelectItem>
                                <SelectItem value="1000-2500">{`${country.currency} 1,000 - 2,500`}</SelectItem>
                                <SelectItem value="2500-5000">{`${country.currency} 2,500 - 5,000`}</SelectItem>
                                <SelectItem value="above-5000">{`Above ${country.currency} 5,000`}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="advertisingGoals"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Advertising Goals *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your main goal" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="brand-awareness">Increase Brand Awareness</SelectItem>
                              <SelectItem value="lead-generation">Generate More Leads</SelectItem>
                              <SelectItem value="website-traffic">Drive Website Traffic</SelectItem>
                              <SelectItem value="local-presence">Improve Local Presence</SelectItem>
                              <SelectItem value="competitive-advantage">Competitive Advantage</SelectItem>
                              <SelectItem value="customer-engagement">Customer Engagement</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currentMarketing"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Marketing Channels</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Google Ads, Social Media, Print, etc." {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tell us about your business and goals *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your business, target audience, and what you hope to achieve with our advertising packages..."
                              className="min-h-[120px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" size="lg" className="w-full min-h-[52px]" disabled={isSubmitting}>
                      {isSubmitting ? "Sending..." : "Send Advertising Inquiry"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </Form>
              </div>
            </div>
          </div>

          {/* Why Choose PakistanYP */}
          <section className="mt-16 md:mt-24">
            <div className="mb-10">
              <span className="yp-label">{localize("Why PakistanYP")}</span>
              <h2 className="yp-h2 mt-2">{localize("Why Choose PakistanYP?")}</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                { icon: Users, tile: 'bg-[#E8F4EC] text-[#0B6B2E]', title: 'Targeted Audience', text: `Reach customers actively searching for businesses like yours across all ${country.regions.length} ${country.adjective} ${country.regionTerm.plural.toLowerCase()}.` },
                { icon: Eye, tile: 'bg-[#E6F6F1] text-[#047857]', title: 'High Visibility', text: 'Premium placement ensures your business stands out from competitors in search results.' },
                { icon: TrendingUp, tile: 'bg-[#FFF4E0] text-[#B45309]', title: 'Measurable Results', text: 'Track your advertising performance with detailed analytics and monthly reports.' },
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

          {/* Contact Info */}
          <section className="mt-16 md:mt-24 yp-tint rounded-[28px] p-8 md:p-14 text-center flex flex-col items-center gap-5">
            <span className="yp-label !text-[#0B6B2E]">Talk to us</span>
            <h3 className="text-[clamp(28px,3.5vw,40px)] font-bold tracking-[-0.04em] leading-[1.1]">Need More Information?</h3>
            <div className="flex flex-wrap justify-center gap-3">
              
              <span className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl bg-white border border-[#CFE8D8] text-sm font-medium">
                <Mail className="w-4 h-4 text-[#0B6B2E]" aria-hidden="true" />
                {localize("advertise@pakistanyp.com")}
              </span>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}