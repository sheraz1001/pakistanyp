import SEO from '@/components/seo';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Badge } from '@/components/ui/badge';
import { country, localize } from '@shared/country';
import { 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Star, 
  Shield, 
  Users, 
  Camera,
  Mail,
  Phone,
  Clock,
  Globe,
  Award,
  TrendingUp
} from 'lucide-react';

export default function BusinessGuidelines() {
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Business Guidelines - PakistanYP",
    "description": "Comprehensive guidelines for businesses listing on PakistanYP platform",
    "publisher": {
      "@type": "Organization",
      "name": "PakistanYP Business Directory"
    }
  };

  const guidelines = [
    {
      category: "Listing Requirements",
      icon: FileText,
      color: "bg-[#E8F4EC] text-[#0B6B2E]",
      items: [
        {
          type: "required",
          title: "Business Registration",
          description: `Valid ${country.licenceAuthority} required`
        },
        {
          type: "required", 
          title: "Accurate Information",
          description: "All business details must be current and truthful"
        },
        {
          type: "required",
          title: "Contact Details",
          description: "Working phone number and email address mandatory"
        },
        {
          type: "recommended",
          title: "Business Description",
          description: "Detailed description of services and products"
        }
      ]
    },
    {
      category: "Content Standards",
      icon: Camera,
      color: "bg-[#E6F6F1] text-[#047857]",
      items: [
        {
          type: "required",
          title: "High-Quality Images",
          description: "Clear, professional photos (minimum 800x600px)"
        },
        {
          type: "prohibited",
          title: "Copyrighted Material",
          description: "No unauthorized use of logos, images, or content"
        },
        {
          type: "prohibited",
          title: "Inappropriate Content",
          description: "No offensive, misleading, or adult content"
        },
        {
          type: "recommended",
          title: "Business Logo",
          description: "High-resolution logo for brand recognition"
        }
      ]
    },
    {
      category: "Professional Conduct",
      icon: Users,
      color: "bg-[#FFF4E0] text-[#B45309]",
      items: [
        {
          type: "required",
          title: "Customer Service",
          description: "Respond to inquiries within 24 hours"
        },
        {
          type: "required",
          title: "Honest Reviews",
          description: "No fake reviews or review manipulation"
        },
        {
          type: "prohibited",
          title: "Spam or Harassment",
          description: "No unsolicited messages or aggressive marketing"
        },
        {
          type: "recommended",
          title: "Regular Updates",
          description: "Keep business information and offers current"
        }
      ]
    },
    {
      category: "Legal Compliance",
      icon: Shield,
      color: "bg-[#FDECEC] text-[#B91C1C]",
      items: [
        {
          type: "required",
          title: localize("Pakistani Laws"),
          description: localize("Full compliance with Pakistani business regulations")
        },
        {
          type: "required",
          title: "Industry Standards",
          description: "Adherence to relevant industry regulations"
        },
        {
          type: "required",
          title: "Data Privacy",
          description: "Respect customer privacy and data protection"
        },
        {
          type: "prohibited",
          title: "Illegal Services",
          description: "No promotion of illegal or prohibited services"
        }
      ]
    }
  ];

  const qualityStandards = [
    {
      title: "Verified Business",
      icon: CheckCircle,
      description: "Complete verification process with valid documentation",
      benefits: ["Verification badge", "Higher search ranking", "Customer trust"]
    },
    {
      title: "Premium Listing",
      icon: Star,
      description: "Enhanced profile with additional features and visibility",
      benefits: ["Featured placement", "Multiple images", "Priority support"]
    },
    {
      title: "Top Rated",
      icon: Award,
      description: "Consistently high ratings and positive customer feedback",
      benefits: ["Top rated badge", "Featured in recommendations", "Increased visibility"]
    }
  ];

  const violations = [
    {
      severity: "Minor",
      color: "bg-[#FFF4E0] text-[#B45309]",
      consequences: "Warning and 7 days to correct",
      examples: ["Outdated contact information", "Poor quality images", "Incomplete profile"]
    },
    {
      severity: "Major", 
      color: "bg-[#FDECEC] text-[#B91C1C]",
      consequences: "Listing suspension for 30 days",
      examples: ["Misleading information", "Unresponsive to inquiries", "Multiple complaints"]
    },
    {
      severity: "Severe",
      color: "bg-[#E3A82B] text-[#141414]",
      consequences: "Permanent removal from platform",
      examples: ["Fraudulent business", "Illegal activities", "Harassment", "Fake reviews"]
    }
  ];

  return (
    <>
      <SEO 
        title="Business Guidelines - PakistanYP Directory Standards"
        description="Comprehensive guidelines for businesses listing on PakistanYP. Learn about listing requirements, content standards, professional conduct, and quality criteria."
        keywords="business guidelines, PakistanYP standards, business listing requirements, Pakistan business directory rules, professional conduct"
        canonical="https://pakistanyp.com/business-guidelines"
        schemaType="WebPage"
        structuredData={[schemaMarkup]}
      />
      <Header />
      <div className="min-h-screen bg-[#FAF8F3] text-[#0A0A0A]">

        {/* Header */}
        <section className="bg-[#F2F9F4] border-b border-[#CFE8D8]">
          <div className="yp-wrap py-16 md:py-24 text-center flex flex-col items-center gap-5">
            <span className="yp-label !text-[#0B6B2E]">For business owners</span>
            <h1 className="yp-h1">Business Guidelines</h1>
            <p className="yp-lead max-w-3xl">
              {localize("Maintain the highest standards on PakistanYP. Our comprehensive guidelines ensure quality, trust, and success for all businesses in Pakistan directory.")}
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              <span className="yp-pill bg-white border border-[#CFE8D8] text-[#05501F] gap-1.5"><Shield className="w-3.5 h-3.5" aria-hidden="true" />Verified Standards</span>
              <span className="yp-pill bg-white border border-[#CFE8D8] text-[#05501F] gap-1.5"><Award className="w-3.5 h-3.5" aria-hidden="true" />Quality Assured</span>
              <span className="yp-pill bg-white border border-[#CFE8D8] text-[#05501F] gap-1.5"><TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />Performance Focused</span>
            </div>
          </div>
        </section>

        <div className="yp-wrap py-16 md:py-24 space-y-16 md:space-y-24">
          {/* Quick Overview */}
          <section className="yp-card p-6 md:p-10">
            <div className="flex items-center gap-3 mb-8">
              <CheckCircle className="w-6 h-6 text-[#0B6B2E]" aria-hidden="true" />
              <h2 className="text-2xl font-bold tracking-[-0.03em]">Quick Compliance Checklist</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: FileText, tile: 'bg-[#E8F4EC] text-[#0B6B2E]', title: 'Valid License', text: localize('Pakistani business registration') },
                { icon: Camera, tile: 'bg-[#FFF4E0] text-[#B45309]', title: 'Quality Content', text: 'Professional images & info' },
                { icon: Users, tile: 'bg-[#E6F6F1] text-[#047857]', title: 'Customer Service', text: 'Responsive communication' },
                { icon: Shield, tile: 'bg-[#FDECEC] text-[#B91C1C]', title: 'Legal Compliance', text: localize('Pakistani law adherence') },
              ].map((item) => (
                <div key={item.title} className="yp-panel p-5">
                  <span className={`w-12 h-12 rounded-[14px] grid place-items-center mb-4 ${item.tile}`}>
                    <item.icon className="w-6 h-6" aria-hidden="true" />
                  </span>
                  <h4 className="font-semibold mb-1">{item.title}</h4>
                  <p className="text-sm text-[#5B6475]">{item.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Detailed Guidelines */}
          <section>
            <span className="yp-label">The rules</span>
            <h2 className="yp-h2 mt-2 mb-10">Detailed Guidelines</h2>
            <div className="grid lg:grid-cols-2 gap-5">
              {guidelines.map((section, index) => (
                <div key={index} className="yp-card p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <span className={`w-12 h-12 rounded-[14px] grid place-items-center shrink-0 ${section.color}`}>
                      <section.icon className="w-6 h-6" aria-hidden="true" />
                    </span>
                    <h3 className="yp-h3">{section.category}</h3>
                  </div>
                  <div className="space-y-5">
                    {section.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {item.type === 'required' && <CheckCircle className="w-5 h-5 text-[#0B6B2E]" aria-hidden="true" />}
                          {item.type === 'recommended' && <Star className="w-5 h-5 text-[#5B6475]" aria-hidden="true" />}
                          {item.type === 'prohibited' && <XCircle className="w-5 h-5 text-[#D71920]" aria-hidden="true" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h4 className="font-semibold">{item.title}</h4>
                            <Badge 
                              variant={item.type === 'required' ? 'default' : item.type === 'recommended' ? 'secondary' : 'destructive'}
                              className="text-xs"
                            >
                              {item.type}
                            </Badge>
                          </div>
                          <p className="text-sm leading-relaxed text-[#4B5565]">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quality Standards */}
          <section>
            <span className="yp-label">Earn recognition</span>
            <h2 className="yp-h2 mt-2 mb-10">Quality Standards</h2>
            <div className="grid md:grid-cols-3 gap-5">
              {qualityStandards.map((standard, index) => (
                <div key={index} className="yp-card p-7 flex flex-col gap-4">
                  <span className="w-12 h-12 rounded-[14px] grid place-items-center bg-[#E8F4EC] text-[#0B6B2E]">
                    <standard.icon className="w-6 h-6" aria-hidden="true" />
                  </span>
                  <h3 className="yp-h3">{standard.title}</h3>
                  <p className="text-[15px] leading-relaxed text-[#4B5565]">{standard.description}</p>
                  <div className="border-t border-[#EEF0F4] pt-4">
                    <h4 className="yp-label mb-3">Benefits</h4>
                    <ul className="space-y-2">
                      {standard.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="flex items-center gap-2 text-sm text-[#3A4354]">
                          <CheckCircle className="w-4 h-4 text-[#0B6B2E] shrink-0" aria-hidden="true" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Violation Consequences */}
          <section>
            <span className="yp-label">Enforcement</span>
            <h2 className="yp-h2 mt-2 mb-10">Violation Consequences</h2>
            <div className="grid md:grid-cols-3 gap-5">
              {violations.map((violation, index) => (
                <div key={index} className="yp-card p-7 flex flex-col gap-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`yp-pill ${violation.color}`}>
                      {violation.severity} Violation
                    </span>
                    {index < 2 ? <AlertTriangle className="w-5 h-5 text-[#5B6475]" aria-hidden="true" /> : <XCircle className="w-5 h-5 text-[#D71920]" aria-hidden="true" />}
                  </div>
                  <h3 className="text-lg font-semibold tracking-[-0.02em]">Consequences</h3>
                  <p className="text-[15px] text-[#3A4354]">{violation.consequences}</p>
                  <div className="border-t border-[#EEF0F4] pt-4 mt-1">
                    <h4 className="yp-label mb-3">Examples</h4>
                    <ul className="space-y-1.5 list-disc pl-5 text-sm text-[#4B5565]">
                      {violation.examples.map((example, exampleIndex) => (
                        <li key={exampleIndex}>{example}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Best Practices */}
          <section className="yp-card p-6 md:p-10">
            <span className="yp-label">Grow faster</span>
            <h2 className="yp-h2 mt-2 mb-8">Best Practices for Success</h2>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="yp-panel p-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#0B6B2E]" aria-hidden="true" />
                  Optimize Your Listing
                </h4>
                <ul className="space-y-2 text-[15px] text-[#3A4354] list-disc pl-5">
                  <li>Complete all profile sections</li>
                  <li>Use relevant keywords in description</li>
                  <li>Upload high-quality images</li>
                  <li>Add current operating hours</li>
                  <li>Include social media links</li>
                </ul>
              </div>
              <div className="yp-panel p-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#0B6B2E]" aria-hidden="true" />
                  Engage with Customers
                </h4>
                <ul className="space-y-2 text-[15px] text-[#3A4354] list-disc pl-5">
                  <li>Respond promptly to inquiries</li>
                  <li>Encourage honest reviews</li>
                  <li>Address complaints professionally</li>
                  <li>Share business updates regularly</li>
                  <li>Participate in platform features</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Contact Support */}
          <section className="yp-tint rounded-[28px] p-8 md:p-14 text-center flex flex-col items-center gap-5">
            <span className="yp-label !text-[#0B6B2E]">Support</span>
            <h3 className="text-[clamp(28px,3.5vw,40px)] font-bold tracking-[-0.04em] leading-[1.1]">Need Help with Guidelines?</h3>
            <p className="text-[17px] leading-relaxed text-[#3A4354] max-w-2xl">
              Our support team is here to help you understand and implement these guidelines successfully.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <span className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl bg-white border border-[#CFE8D8] text-sm font-medium">
                <Mail className="w-4 h-4 text-[#0B6B2E]" aria-hidden="true" />
                {localize("guidelines@pakistanyp.com")}
              </span>
              
              <span className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl bg-white border border-[#CFE8D8] text-sm font-medium">
                <Clock className="w-4 h-4 text-[#0B6B2E]" aria-hidden="true" />
                24/7 Support
              </span>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}