import SEO, { SEOConfigs } from "@/components/seo";
import Header from '@/components/header';
import Footer from '@/components/footer';
import { AlertTriangle } from 'lucide-react';
import { country, localize } from '@shared/country';

export default function TermsOfService() {
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Terms of Service - PakistanYP",
    "description": "PakistanYP Terms of Service outlining user agreements and platform usage guidelines",
    "publisher": {
      "@type": "Organization",
      "name": "PakistanYP Business Directory"
    }
  };

  return (
    <>
      <SEO
        title="Terms of Service - PakistanYP Business Directory | User Agreement & Platform Rules"
        description="PakistanYP Terms of Service outlining user agreements, platform usage guidelines, and legal terms for Pakistan business directory users and business owners."
        keywords="terms of service, user agreement, PakistanYP terms, platform rules, Pakistan business directory legal, user responsibilities"
        canonical="https://pakistanyp.com/pages/terms-of-service"
        schemaType="WebPage"
        structuredData={[schemaMarkup]}
      />
      <Header />
      <div className="min-h-screen bg-white text-[#0A0A0A]">
      <main>
        {/* Header */}
        <div className="yp-wrap max-w-[860px] pt-16 md:pt-20 text-center flex flex-col items-center gap-5">
          <span className="yp-label !text-[#0B6B2E]">Legal · Terms</span>
          <h1 className="text-[clamp(36px,5vw,58px)] font-bold tracking-[-0.045em] leading-[1.05]">Terms of Service</h1>
          <p className="text-xl leading-[1.55] text-[#4B5565]">
            {localize("These terms and conditions govern your use of the PakistanYP business directory platform and services.")}
          </p>
          <p className="text-sm text-[#5B6475]">Last updated: January 2025</p>
        </div>
        <div className="yp-wrap max-w-[860px] pt-10">
          <div className="rounded-[20px] border border-[#CFE8D8] bg-[#F2F9F4] p-5 md:p-6 flex items-start gap-4">
            <span className="w-10 h-10 rounded-xl bg-white border border-[#CFE8D8] text-[#0B6B2E] grid place-items-center shrink-0">
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-semibold mb-1">Important Notice</h3>
              <p className="text-[15px] leading-relaxed text-[#3A4354]">
                {localize("By accessing or using PakistanYP's services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.")}
              </p>
            </div>
          </div>
        </div>
        <div className="yp-wrap pt-12 md:pt-14 pb-20 flex flex-wrap gap-10 lg:gap-14 items-start justify-center">
          <aside className="flex-[1_1_220px] w-full lg:max-w-[240px] lg:sticky lg:top-28" aria-label="On this page">
            <div className="yp-label px-3 pb-2.5">On this page</div>
            <nav>
              <a href="#acceptance" className="block px-3 py-2 rounded-[10px] text-sm text-[#3A4354] hover:bg-[#F1F2F6] hover:text-[#0A0A0A]">1. Acceptance of Terms</a>
              <a href="#user-accounts" className="block px-3 py-2 rounded-[10px] text-sm text-[#3A4354] hover:bg-[#F1F2F6] hover:text-[#0A0A0A]">2. User Accounts</a>
              <a href="#business-listings" className="block px-3 py-2 rounded-[10px] text-sm text-[#3A4354] hover:bg-[#F1F2F6] hover:text-[#0A0A0A]">3. Business Listings</a>
              <a href="#user-conduct" className="block px-3 py-2 rounded-[10px] text-sm text-[#3A4354] hover:bg-[#F1F2F6] hover:text-[#0A0A0A]">4. User Conduct</a>
              <a href="#payment-terms" className="block px-3 py-2 rounded-[10px] text-sm text-[#3A4354] hover:bg-[#F1F2F6] hover:text-[#0A0A0A]">5. Payment Terms</a>
              <a href="#intellectual-property" className="block px-3 py-2 rounded-[10px] text-sm text-[#3A4354] hover:bg-[#F1F2F6] hover:text-[#0A0A0A]">6. Intellectual Property</a>
              <a href="#limitation-of-liability" className="block px-3 py-2 rounded-[10px] text-sm text-[#3A4354] hover:bg-[#F1F2F6] hover:text-[#0A0A0A]">7. Limitation of Liability</a>
              <a href="#governing-law" className="block px-3 py-2 rounded-[10px] text-sm text-[#3A4354] hover:bg-[#F1F2F6] hover:text-[#0A0A0A]">8. Governing Law</a>
              <a href="#contact-information" className="block px-3 py-2 rounded-[10px] text-sm text-[#3A4354] hover:bg-[#F1F2F6] hover:text-[#0A0A0A]">9. Contact Information</a>
            </nav>
          </aside>

          <article className="yp-prose flex-[999_1_560px] max-w-[700px] min-w-0 space-y-12 [&_h3]:!mt-8">

            
            {/* Acceptance of Terms */}
            <section id="acceptance" className="scroll-mt-28">
                <h2>1. Acceptance of Terms</h2>
                
                <div>
                  <p>
                    {localize("By accessing, browsing, or using the PakistanYP platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.")}
                  </p>
                  <p>
                    These terms apply to all users of the platform, including business owners, consumers, 
                    and visitors. If you are using our services on behalf of a business or organization, 
                    you represent that you have the authority to bind that entity to these terms.
                  </p>
                  <p>
                    We reserve the right to modify these terms at any time. Changes will be effective 
                    immediately upon posting. Your continued use of the platform constitutes acceptance 
                    of the modified terms.
                  </p>
                </div>
            </section>

            {/* User Accounts */}
            <section id="user-accounts" className="scroll-mt-28">
                <h2>2. User Accounts</h2>

                <div>
                  <div>
                    <h3>Account Creation</h3>
                    <ul>
                      <li>You must provide accurate and complete information when creating an account</li>
                      <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                      <li>You must be at least 18 years old to create an account</li>
                      <li>One person or entity may maintain only one account</li>
                    </ul>
                  </div>

                  <div>
                    <h3>Account Responsibilities</h3>
                    <ul>
                      <li>You are solely responsible for all activities under your account</li>
                      <li>Notify us immediately of any unauthorized use of your account</li>
                      <li>Keep your account information current and accurate</li>
                      <li>Comply with all applicable laws and regulations</li>
                    </ul>
                  </div>

                  <div>
                    <h3>Account Termination</h3>
                    <p>
                      We may suspend or terminate your account at any time for violation of these terms, 
                      illegal activity, or for any other reason at our discretion. You may delete your 
                      account at any time through your account settings.
                    </p>
                  </div>
                </div>
            </section>

            {/* Business Listings */}
            <section id="business-listings" className="scroll-mt-28">
                <h2>3. Business Listings</h2>

                <div>
                  <div>
                    <h3>Listing Requirements</h3>
                    <ul>
                      <li>All business information must be accurate and up-to-date</li>
                      <li>You must have the right to list the business</li>
                      <li>{localize("Businesses must be legally operating in Pakistan")}</li>
                      <li>Only legitimate businesses are allowed - no fake or fraudulent listings</li>
                    </ul>
                  </div>

                  <div>
                    <h3>Content Guidelines</h3>
                    <ul>
                      <li>Content must be appropriate and professional</li>
                      <li>No offensive, discriminatory, or illegal content</li>
                      <li>Images must be relevant and owned by you or used with permission</li>
                      <li>No spam, misleading information, or false claims</li>
                    </ul>
                  </div>

                  <div>
                    <h3>Verification Process</h3>
                    <p>
                      We may verify business listings through various means including document verification, 
                      phone calls, or site visits. Verified businesses receive special badges and enhanced visibility.
                    </p>
                  </div>
                </div>
            </section>

            {/* User Conduct */}
            <section id="user-conduct" className="scroll-mt-28">
                <h2>4. User Conduct</h2>

                <div>
                  <p>Users agree to use the platform responsibly and in accordance with these guidelines:</p>

                  <div>
                    <h3>Prohibited Activities</h3>
                    <ul>
                      <li>Posting false, misleading, or defamatory content</li>
                      <li>Harassing, threatening, or abusing other users</li>
                      <li>Attempting to hack, disrupt, or damage the platform</li>
                      <li>Using automated tools to scrape or download content</li>
                      <li>Violating intellectual property rights</li>
                      <li>Engaging in any illegal activities</li>
                    </ul>
                  </div>

                  <div>
                    <h3>Reviews and Ratings</h3>
                    <ul>
                      <li>Reviews must be based on genuine experiences</li>
                      <li>No fake reviews or manipulation of ratings</li>
                      <li>Keep reviews constructive and professional</li>
                      <li>Respect privacy and confidentiality</li>
                    </ul>
                  </div>
                </div>
            </section>

            {/* Payment Terms */}
            <section id="payment-terms" className="scroll-mt-28">
                <h2>5. Payment Terms</h2>

                <div>
                  <div>
                    <h3>Premium Services</h3>
                    <ul>
                      <li>Premium features are available for monthly or yearly subscriptions</li>
                      <li>Payments are processed securely through Stripe</li>
                      <li>{`All prices are in ${country.currency} and include applicable taxes`}</li>
                      <li>Premium features activate immediately upon successful payment</li>
                    </ul>
                  </div>

                  <div>
                    <h3>Refunds</h3>
                    <p>
                      Refunds are available within 7 days of payment for annual subscriptions and within 
                      24 hours for monthly subscriptions, provided no premium features have been used. 
                      Contact our support team to request a refund.
                    </p>
                  </div>

                  <div>
                    <h3>Cancellation</h3>
                    <p>
                      You may cancel your premium subscription at any time. The cancellation will take 
                      effect at the end of your current billing cycle, and you will retain access to 
                      premium features until that date.
                    </p>
                  </div>
                </div>
            </section>

            {/* Intellectual Property */}
            <section id="intellectual-property" className="scroll-mt-28">
                <h2>6. Intellectual Property</h2>

                <div>
                  <div>
                    <h3>{localize("PakistanYP Content")}</h3>
                    <p>
                      {localize("The platform, including its design, functionality, and content, is owned by PakistanYP and protected by intellectual property laws. You may not copy, modify, or distribute our content without permission.")}
                    </p>
                  </div>

                  <div>
                    <h3>User Content</h3>
                    <p>
                      {localize("You retain ownership of content you post but grant PakistanYP a license to use, display, and distribute your content on the platform. You warrant that you have the right to grant this license and that your content doesn't infringe on others' rights.")}
                    </p>
                  </div>
                </div>
            </section>

            {/* Limitation of Liability */}
            <section id="limitation-of-liability" className="scroll-mt-28">
                <h2>7. Limitation of Liability</h2>

                <div>
                  <div className="rounded-2xl border border-[#F5C6C8] bg-[#FDECEC] p-5 mb-[22px] text-[16px] leading-relaxed text-[#7F1D1D] [&_p]:mb-2 [&_p:last-child]:mb-0">
                    <p><strong className="text-[#7F1D1D]">Important Legal Notice</strong></p>
                    <p>
                      {localize("PakistanYP is provided \"as is\" without warranties of any kind. We are not liable for any damages arising from your use of the platform, including but not limited to direct, indirect, incidental, or consequential damages.")}
                    </p>
                  </div>

                  <ul>
                    <li>We don't guarantee the accuracy of business information</li>
                    <li>We're not responsible for interactions between users</li>
                    <li>We don't warrant uninterrupted or error-free service</li>
                    <li>Users use the platform at their own risk</li>
                  </ul>
                </div>
            </section>

            {/* Governing Law */}
            <section id="governing-law" className="scroll-mt-28">
                <h2>8. Governing Law</h2>

                <div>
                  <p>
                    {`These Terms of Service are governed by the laws of ${country.name}. Any disputes arising from these terms or your use of the platform will be subject to the exclusive jurisdiction of the competent courts of ${country.name}.`}
                  </p>

                  <div>
                    <h3>Dispute Resolution</h3>
                    <p>
                      We encourage resolving disputes amicably through direct communication. 
                      If a dispute cannot be resolved directly, it may be submitted to mediation 
                      before pursuing legal action.
                    </p>
                  </div>
                </div>
            </section>

            {/* Contact Information */}
            <section id="contact-information" className="scroll-mt-28">
                <h2>9. Contact Information</h2>
                
                <div>
                  <p>
                    If you have questions about these Terms of Service, please contact us:
                  </p>

                  <div className="rounded-2xl border border-[#E7E9EE] bg-[#F7F8FA] p-5 mb-[22px] text-[16px] leading-relaxed [&_p]:mb-1 [&_p:last-child]:mb-0">
                    <div>
                      <p><strong>Email:</strong>{localize(" legal@pakistanyp.com")}</p>
                      <p><strong>Address:</strong>{" " + country.contact.address}</p>
                      <p><strong>Support:</strong>{localize(" support@pakistanyp.com")}</p>
                    </div>
                  </div>
                </div>
            </section>
          
          </article>
        </div>

        <section className="bg-[#F7F8FA] border-t border-[#E7E9EE]">
          <div className="yp-wrap py-14 md:py-16 grid md:grid-cols-2 gap-5">
            <div className="yp-card p-6">
              <h3 className="font-semibold mb-4">Quick Summary</h3>
              <div className="space-y-3 text-sm">
                {[
                  ['Use Responsibly', 'Provide accurate information and respect other users'],
                  ['Business Listings', localize('Must be legitimate Pakistani businesses with accurate details')],
                  ['Premium Services', 'Optional paid features with clear pricing'],
                  ['Your Content', 'You own it, but we can display it on our platform'],
                ].map(([title, text]) => (
                  <div key={title}>
                    <strong className="block text-[#0A0A0A]">{title}</strong>
                    <span className="text-[#4B5565]">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="yp-card p-6">
              <h3 className="font-semibold mb-4">Related Documents</h3>
              <div className="space-y-2">
                <a href="/pages/privacy-policy" className="block text-[#0B6B2E] hover:text-[#05501F] font-medium text-sm">
                  Privacy Policy
                </a>
                <a href="/pages/business-guidelines" className="block text-[#0B6B2E] hover:text-[#05501F] font-medium text-sm">
                  Business Guidelines
                </a>
                <a href="/help-center" className="block text-[#0B6B2E] hover:text-[#05501F] font-medium text-sm">
                  Help Center
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