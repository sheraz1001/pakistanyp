import SEO, { SEOConfigs } from "@/components/seo";
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Check } from 'lucide-react';
import { country, localize } from '@shared/country';

export default function PrivacyPolicy() {
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Privacy Policy - PakistanYP",
    "description": "PakistanYP Privacy Policy outlining how we collect, use, and protect user data",
    "publisher": {
      "@type": "Organization",
      "name": "PakistanYP Business Directory"
    }
  };

  return (
    <>
      <SEO
        title="Privacy Policy - PakistanYP Business Directory | Data Protection & User Rights"
        description="PakistanYP Privacy Policy detailing how we collect, use, and protect your personal information on our Pakistani business directory platform. Learn about your data rights and our security measures."
        keywords="privacy policy, data protection, PakistanYP privacy, personal information, Pakistan business directory privacy, GDPR compliance, user rights"
        canonical="https://pakistanyp.com/pages/privacy-policy"
        schemaType="WebPage"
        structuredData={[schemaMarkup]}
      />
      <Header />
      <div className="min-h-screen bg-white text-[#0A0A0A]">
      <main>
        {/* Header */}
        <div className="yp-wrap max-w-[860px] pt-16 md:pt-20 text-center flex flex-col items-center gap-5">
          <span className="yp-label !text-[#0B6B2E]">Legal · Privacy</span>
          <h1 className="text-[clamp(36px,5vw,58px)] font-bold tracking-[-0.045em] leading-[1.05]">Privacy Policy</h1>
          <p className="text-xl leading-[1.55] text-[#4B5565]">
            {localize("At PakistanYP, we are committed to protecting your privacy and ensuring the security of your personal information.")}
          </p>
          <p className="text-sm text-[#5B6475]">Last updated: January 2025</p>
        </div>

        <div className="yp-wrap pt-12 md:pt-14 pb-20 flex flex-wrap gap-10 lg:gap-14 items-start justify-center">
          <aside className="flex-[1_1_220px] w-full lg:max-w-[240px] lg:sticky lg:top-28" aria-label="On this page">
            <div className="yp-label px-3 pb-2.5">On this page</div>
            <nav>
              <a href="#information-collection" className="block px-3 py-2 rounded-[10px] text-sm text-[#3A4354] hover:bg-[#F1F2F6] hover:text-[#0A0A0A]">1. Information We Collect</a>
              <a href="#information-use" className="block px-3 py-2 rounded-[10px] text-sm text-[#3A4354] hover:bg-[#F1F2F6] hover:text-[#0A0A0A]">2. How We Use Information</a>
              <a href="#information-sharing" className="block px-3 py-2 rounded-[10px] text-sm text-[#3A4354] hover:bg-[#F1F2F6] hover:text-[#0A0A0A]">3. Information Sharing</a>
              <a href="#data-security" className="block px-3 py-2 rounded-[10px] text-sm text-[#3A4354] hover:bg-[#F1F2F6] hover:text-[#0A0A0A]">4. Data Security</a>
              <a href="#your-rights" className="block px-3 py-2 rounded-[10px] text-sm text-[#3A4354] hover:bg-[#F1F2F6] hover:text-[#0A0A0A]">5. Your Rights</a>
              <a href="#contact-us" className="block px-3 py-2 rounded-[10px] text-sm text-[#3A4354] hover:bg-[#F1F2F6] hover:text-[#0A0A0A]">6. Contact Us</a>
            </nav>
          </aside>

          <article className="yp-prose flex-[999_1_560px] max-w-[700px] min-w-0 space-y-12 [&_h3]:!mt-8">

            
            {/* Information Collection */}
            <section id="information-collection" className="scroll-mt-28">
                <h2>Information We Collect</h2>
                
                <div>
                  <div>
                    <h3>Personal Information</h3>
                    <p>
                      When you create an account or list a business, we may collect:
                    </p>
                    <ul>
                      <li>Name and contact information (email, phone number)</li>
                      <li>Business information and details</li>
                      <li>Profile pictures and business images</li>
                      <li>Payment information for premium services</li>
                      <li>Communication preferences</li>
                    </ul>
                  </div>

                  <div>
                    <h3>Automatically Collected Information</h3>
                    <ul>
                      <li>IP address and device information</li>
                      <li>Browser type and version</li>
                      <li>Usage patterns and preferences</li>
                      <li>Location data (with your permission)</li>
                      <li>Cookies and similar tracking technologies</li>
                    </ul>
                  </div>

                  <div>
                    <h3>Third-Party Information</h3>
                    <p>
                      We may receive information about you from third-party services such as Google OAuth,
                      social media platforms, and business verification services.
                    </p>
                  </div>
                </div>
            </section>

            {/* Information Use */}
            <section id="information-use" className="scroll-mt-28">
                <h2>How We Use Your Information</h2>

                <div>
                  <div>
                    <h3>Service Provision</h3>
                    <ul>
                      <li>Creating and managing your account</li>
                      <li>Processing business listings and reviews</li>
                      <li>Facilitating connections between businesses and customers</li>
                      <li>Processing payments for premium services</li>
                      <li>Providing customer support</li>
                    </ul>
                  </div>

                  <div>
                    <h3>Communication</h3>
                    <ul>
                      <li>Sending service updates and notifications</li>
                      <li>Responding to your inquiries</li>
                      <li>Marketing communications (with your consent)</li>
                      <li>Important security and policy updates</li>
                    </ul>
                  </div>

                  <div>
                    <h3>Improvement and Analytics</h3>
                    <ul>
                      <li>Analyzing usage patterns to improve our services</li>
                      <li>Conducting research and development</li>
                      <li>Personalizing your experience</li>
                      <li>Preventing fraud and ensuring security</li>
                    </ul>
                  </div>
                </div>
            </section>

            {/* Information Sharing */}
            <section id="information-sharing" className="scroll-mt-28">
                <h2>Information Sharing</h2>

                <div>
                  <div className="rounded-2xl border border-[#CFE8D8] bg-[#F2F9F4] p-5 mb-[22px] text-[16px] leading-relaxed text-[#05501F] [&_p]:mb-2 [&_p:last-child]:mb-0">
                    <p>
                      We do not sell, trade, or rent your personal information to third parties.
                    </p>
                  </div>

                  <div>
                    <h3>When We May Share Information</h3>
                    <ul>
                      <li>With your explicit consent</li>
                      <li>To comply with legal obligations</li>
                      <li>To protect our rights and safety</li>
                      <li>With service providers who assist us (under strict confidentiality)</li>
                      <li>In case of business transfers or mergers</li>
                    </ul>
                  </div>

                  <div>
                    <h3>Public Information</h3>
                    <p>
                      Business listings, reviews, and ratings are public by nature and will be visible to all users.
                      Personal contact information is only shared with your explicit permission.
                    </p>
                  </div>
                </div>
            </section>

            {/* Data Security */}
            <section id="data-security" className="scroll-mt-28">
                <h2>Data Security</h2>

                <div>
                  <p>
                    We implement industry-standard security measures to protect your personal information:
                  </p>

                  <ul>
                    <li>SSL encryption for data transmission</li>
                    <li>Secure data storage with regular backups</li>
                    <li>Regular security audits and updates</li>
                    <li>Access controls and authentication measures</li>
                    <li>Employee training on data protection</li>
                  </ul>

                  <div className="rounded-2xl border border-[#CFE8D8] bg-[#F2F9F4] p-5 mb-[22px] text-[16px] leading-relaxed text-[#05501F] [&_p]:mb-2 [&_p:last-child]:mb-0">
                    <p>
                      While we strive to protect your information, no method of transmission over the internet
                      is 100% secure. We encourage you to take precautions when sharing information online.
                    </p>
                  </div>
                </div>
            </section>

            {/* Your Rights */}
            <section id="your-rights" className="scroll-mt-28">
                <h2>Your Rights</h2>

                <div>
                  <p>
                    You have the following rights regarding your personal information:
                  </p>

                  <div className="grid md:grid-cols-2 gap-x-8">
                    <div>
                      <h3>Access and Portability</h3>
                      <ul>
                        <li>Request copies of your personal data</li>
                        <li>Download your information in a portable format</li>
                      </ul>
                    </div>

                    <div>
                      <h3>Control and Correction</h3>
                      <ul>
                        <li>Update or correct your information</li>
                        <li>Delete your account and data</li>
                      </ul>
                    </div>

                    <div>
                      <h3>Communication Preferences</h3>
                      <ul>
                        <li>Opt out of marketing communications</li>
                        <li>Manage notification settings</li>
                      </ul>
                    </div>

                    <div>
                      <h3>Data Processing</h3>
                      <ul>
                        <li>Object to certain data processing</li>
                        <li>Request data processing restrictions</li>
                      </ul>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#CFE8D8] bg-[#F2F9F4] p-5 mb-[22px] text-[16px] leading-relaxed text-[#05501F] [&_p]:mb-2 [&_p:last-child]:mb-0">
                    <p>
                      To exercise any of these rights, please contact us using the information below.
                      We will respond to your request within 30 days.
                    </p>
                  </div>
                </div>
            </section>

            {/* Contact Information */}
            <section id="contact-us" className="scroll-mt-28">
                <h2>Contact Us</h2>
                
                <div>
                  <p>
                    If you have any questions about this Privacy Policy or how we handle your data, please contact us:
                  </p>

                  <div className="rounded-2xl border border-[#E7E9EE] bg-[#F7F8FA] p-5 mb-[22px] text-[16px] leading-relaxed [&_p]:mb-1 [&_p:last-child]:mb-0">
                    <div>
                      <p><strong>Email:</strong>{localize(" privacy@pakistanyp.com")}</p>
                      <p><strong>Address:</strong>{" " + country.contact.address}</p>
                      <p><strong>Data Protection Officer:</strong>{localize(" dpo@pakistanyp.com")}</p>
                    </div>
                  </div>

                  <p>
                    This Privacy Policy may be updated from time to time. We will notify you of any significant
                    changes by email or through our platform.
                  </p>
                </div>
            </section>
          
          </article>
        </div>

        <section className="bg-[#F7F8FA] border-t border-[#E7E9EE]">
          <div className="yp-wrap py-14 md:py-16 grid md:grid-cols-2 gap-5">
            <div className="yp-card p-6">
              <h3 className="font-semibold mb-4">Key Highlights</h3>
              <div className="space-y-3 text-sm text-[#3A4354]">
                {["We don't sell your data", 'SSL encryption protection', 'You control your data', 'GDPR compliant'].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#E8F4EC] text-[#0B6B2E] grid place-items-center shrink-0">
                      <Check className="w-3 h-3" aria-hidden="true" />
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="yp-card p-6">
              <h3 className="font-semibold mb-4">Related Pages</h3>
              <div className="space-y-2">
                <a href="/pages/terms-of-service" className="block text-[#0B6B2E] hover:text-[#05501F] font-medium text-sm">
                  Terms of Service
                </a>
                <a href="/business-guidelines" className="block text-[#0B6B2E] hover:text-[#05501F] font-medium text-sm">
                  Business Guidelines
                </a>
                <a href="/contact-us" className="block text-[#0B6B2E] hover:text-[#05501F] font-medium text-sm">
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      </div>
      <Footer />
    </>
  );
}
