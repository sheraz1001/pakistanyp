import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Mail, Clock, Send, MessageCircle, Users, Building } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import SEO from '@/components/seo';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { trackEvent } from '@/lib/analytics';
import { country, localize } from '@shared/country';
import { t as tx } from "@shared/i18n";

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  category: z.string().min(1, 'Please select a category'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactUs() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      subject: '',
      category: '',
      message: '',
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    trackEvent('form_submit', 'contact_form', data.category);
    try {
      // Here you would typically send the data to your API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      trackEvent('form_completion', 'contact_form', data.category);
      toast({
        title: "Message Sent Successfully",
        description: "We'll get back to you within 24 hours.",
      });
      
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "mainEntity": {
      "@type": "Organization",
      "name": "PakistanYP Business Directory",
      "url": "https://pakistanyp.com",
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+92-4-XXX-XXXX",
        "contactType": "customer service",
        "availableLanguage": ["English", "Urdu"],
        "areaServed": "AE"
      },
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "AE",
        "addressRegion": "Karachi",
        "addressLocality": "Business Bay"
      }
    }
  };



  return (
    <>
      <SEO
        title="Contact Us - PakistanYP Business Directory | Support & Inquiries"
        description="Contact PakistanYP for business listing support, partnerships, technical assistance, and general inquiries. Multiple support channels available for Pakistan businesses."
        keywords="contact PakistanYP, business directory support, Pakistan business help, listing assistance, partnership inquiries"
        canonical="https://pakistanyp.com/contact-us"
        schemaType="ContactPage"
        structuredData={[{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "name": "Contact PakistanYP - Pakistani Business Directory",
          "description": "Contact PakistanYP Business Directory for support, business listings, partnerships, and general inquiries",
          "publisher": {
            "@type": "Organization",
            "name": "PakistanYP Business Directory"
          }
        }]}
      />
      <Header />
      <div className="min-h-screen bg-[#FAF8F3] text-[#0A0A0A]">

      {/* Hero Section */}
      <section className="bg-[#F2F9F4] border-b border-[#CFE8D8]">
        <div className="yp-wrap py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-5">
            <span className="yp-label !text-[#0B6B2E]">Contact us</span>
            <h1 className="yp-h1">Get in Touch</h1>
            <p className="yp-lead max-w-2xl">
              {tx("Have questions about listing your business or need support? We're here to help you succeed in the {0} market.", country.adjective)}
            </p>
          </div>
        </div>
      </section>

      <div className="yp-wrap py-16">
        {/* Contact Options */}
        <div className="grid md:grid-cols-3 gap-5 mb-16">
          {[
            { icon: Building, tile: 'bg-[#E8F4EC] text-[#0B6B2E]', title: 'Business Listings', text: 'Questions about listing your business or upgrading to premium features.', cta: 'List Your Business' },
            { icon: Users, tile: 'bg-[#E6F6F1] text-[#047857]', title: 'Partnerships', text: 'Interested in partnering with us or exploring business opportunities.', cta: 'Partner With Us' },
            { icon: MessageCircle, tile: 'bg-[#FFF4E0] text-[#B45309]', title: 'Technical Support', text: 'Need help with your account, listings, or experiencing technical issues.', cta: 'Get Support' },
          ].map((opt) => (
            <div key={opt.title} className="yp-card p-7 flex flex-col gap-4">
              <span className={`w-12 h-12 rounded-[14px] grid place-items-center ${opt.tile}`}>
                <opt.icon className="w-6 h-6" aria-hidden="true" />
              </span>
              <h3 className="yp-h3">{opt.title}</h3>
              <p className="text-[15px] leading-relaxed text-[#4B5565] flex-1">{opt.text}</p>
              <Button variant="outline" className="w-full">
                {opt.cta}
              </Button>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="yp-card p-6 md:p-10 min-w-0">
            <span className="yp-label">Message</span>
            <h2 className="yp-h2 mt-2 mb-8">Send us a Message</h2>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter your email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder={tx("{0} XX XXX XXXX", country.phonePrefix)} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="business-listing">Business Listing</SelectItem>
                            <SelectItem value="technical-support">Technical Support</SelectItem>
                            <SelectItem value="partnership">Partnership</SelectItem>
                            <SelectItem value="advertising">Advertising</SelectItem>
                            <SelectItem value="feedback">Feedback</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject *</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief description of your inquiry" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Please provide detailed information about your inquiry..."
                          rows={6}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" size="lg" className="w-full min-h-[52px]" disabled={isSubmitting}>
                  {isSubmitting ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 me-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <span className="yp-label">Reach us</span>
              <h2 className="yp-h2 mt-2 mb-8">Contact Information</h2>
              
              <div className="space-y-3">
                {[
                  { icon: MapPin, tile: 'bg-[#E8F4EC] text-[#0B6B2E]', title: 'Our Location', lines: [country.contact.address] },
                  { icon: Mail, tile: 'bg-[#E6F6F1] text-[#047857]', title: 'Email Us', lines: [localize('General: info@pakistanyp.com'), localize('Support: support@pakistanyp.com'), localize('Business: business@pakistanyp.com')] },
                  { icon: Clock, tile: 'bg-[#F1F2F6] text-[#334155]', title: 'Business Hours', lines: ['Sunday - Thursday: 9:00 AM - 6:00 PM', 'Friday - Saturday: 10:00 AM - 4:00 PM', '24/7 Online Support Available'] },
                ].map((item) => (
                  <div key={item.title} className="yp-card p-5 flex items-start gap-4">
                    <span className={`w-12 h-12 rounded-[14px] grid place-items-center flex-shrink-0 ${item.tile}`}>
                      <item.icon className="w-6 h-6" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-[15px] leading-relaxed text-[#4B5565] break-words">
                        {item.lines.map((line, i) => (
                          <span key={line}>{line}{i < item.lines.length - 1 && <br />}</span>
                        ))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div className="yp-tint rounded-[24px] p-6 md:p-8">
              <span className="yp-label !text-[#0B6B2E]">FAQ</span>
              <h3 className="yp-h3 mt-2 mb-5">Frequently Asked Questions</h3>
              <div className="space-y-5">
                <div>
                  <h4 className="font-semibold mb-2">How long does it take to list my business?</h4>
                  <p className="text-[15px] leading-relaxed text-[#3A4354]">
                    Most business listings are approved within 24-48 hours after submission.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Is there a cost to list my business?</h4>
                  <p className="text-[15px] leading-relaxed text-[#3A4354]">
                    Basic listings are free. Premium features are available for enhanced visibility.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Can I edit my business information?</h4>
                  <p className="text-[15px] leading-relaxed text-[#3A4354]">
                    Yes, you can update your business information anytime through your dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </>
  );
}