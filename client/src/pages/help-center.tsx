import { dateLocale } from "@shared/i18n";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Book, MessageCircle, Phone, Mail, ArrowRight, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import SEO, { SEOConfigs } from "@/components/seo";
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Link } from 'wouter';
import { localize } from '@shared/country';
import { tj } from "@/i18n-jsx/tj";

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: helpCategories = [] } = useQuery({
    queryKey: ['/api/help/categories'],
  });

  const { data: helpArticles = [] } = useQuery({
    queryKey: ['/api/help/articles'],
  });

  const { data: supportStats } = useQuery({
    queryKey: ['/api/admin/support/stats'],
  });

  const filteredArticles = helpArticles.filter((article: any) =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.summary?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": helpArticles.slice(0, 5).map((article: any) => ({
      "@type": "Question",
      "name": article.title,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": article.summary
      }
    }))
  };

  const statTiles = [
    { icon: Book, tile: 'bg-[#E8F4EC] text-[#0B6B2E]', value: `${helpArticles.length}+`, label: 'Help Articles' },
    { icon: MessageCircle, tile: 'bg-[#E6F6F1] text-[#047857]', value: `${supportStats?.resolved || 0}`, label: 'Tickets Resolved' },
    { icon: Phone, tile: 'bg-[#F1F2F6] text-[#334155]', value: `${supportStats?.avgResolutionTime ? Math.round(supportStats.avgResolutionTime) : 2}h`, label: 'Avg Response' },
  ];

  return (
    <>
      <Header />
      <SEO
        title="Help Center - PakistanYP Business Directory | Support & Knowledge Base"
        description="Find answers to your questions about PakistanYP. Browse our comprehensive knowledge base, contact support, and get help with business listings and directory features."
        keywords="PakistanYP help, business directory support, FAQ, knowledge base, customer support, listing help, Pakistan business assistance"
        canonical="https://pakistanyp.com/help-center"
        schemaType="WebPage"
        structuredData={[schemaMarkup]}
      />
      <div className="min-h-screen bg-[#FAF8F3] text-[#0A0A0A]">

      {/* Hero Section */}
      <section className="bg-[#F2F9F4] border-b border-[#CFE8D8]">
        <div className="yp-wrap py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-5">
            <span className="yp-label !text-[#0B6B2E]">Help center</span>
            <h1 className="yp-h1">How can we help you?</h1>
            <p className="yp-lead max-w-2xl">
              Find answers to your questions, learn about our services, or get in touch with our support team.
            </p>
            
            <div className="w-full max-w-2xl pt-2">
              <div className="relative">
                <Search className="absolute start-4 top-1/2 -translate-y-1/2 text-[#5B6475] w-5 h-5" aria-hidden="true" />
                <Input
                  type="text"
                  placeholder="Search for help articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-14 ps-12 pe-4 text-base rounded-2xl bg-white border-[#DDE1E8]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="yp-wrap py-16">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {statTiles.map((stat) => (
            <div key={stat.label} className="yp-card p-6">
              <span className={`w-12 h-12 rounded-[14px] grid place-items-center mb-5 ${stat.tile}`}>
                <stat.icon className="w-6 h-6" aria-hidden="true" />
              </span>
              <div className="text-3xl font-bold tracking-[-0.04em]">{stat.value}</div>
              <p className="text-sm text-[#5B6475] mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Help Categories */}
          <div className="lg:col-span-2 min-w-0">
            <span className="yp-label">Topics</span>
            <h2 className="yp-h2 mt-2 mb-8">Browse Help Topics</h2>
            
            <div className="grid md:grid-cols-2 gap-4 mb-14">
              {helpCategories.map((category: any) => (
                <div key={category.id} className="yp-card yp-card-link p-6 cursor-pointer flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold tracking-[-0.02em]">{category.name}</h3>
                    <ArrowRight className="w-5 h-5 text-[#5B6475] shrink-0" aria-hidden="true" />
                  </div>
                  <p className="text-[15px] leading-relaxed text-[#4B5565]">
                    {category.description}
                  </p>
                  <span className="yp-tag yp-tag-green self-start">{tj("{0} articles", helpArticles.filter((article: any) => article.categoryId === category.id).length)}</span>
                </div>
              ))}
            </div>

            {/* Popular Articles */}
            <h3 className="text-2xl font-bold tracking-[-0.03em] mb-6">Popular Articles</h3>
            <div className="space-y-3">
              {filteredArticles.slice(0, 6).map((article: any) => (
                <div key={article.id} className="yp-card yp-card-link p-6">
                  <Link href={`/help/articles/${article.slug}`}>
                    <h4 className="text-lg font-semibold tracking-[-0.02em] text-[#0A0A0A] mb-2 hover:text-[#0B6B2E]">
                      {article.title}
                    </h4>
                  </Link>
                  <p className="text-[15px] leading-relaxed text-[#4B5565] mb-3">
                    {article.summary}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[#5B6475]">
                    <span>{tj("{0} views", article.views)}</span>
                    <span>{tj("Updated {0}", new Date(article.updatedAt).toLocaleDateString(dateLocale()))}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Contact Support */}
            <div className="yp-tint rounded-[24px] p-6 flex flex-col gap-4">
              <span className="yp-label !text-[#0B6B2E]">Support</span>
              <h3 className="yp-h3">Need More Help?</h3>
              <Link href="/support/new-ticket" className="yp-btn yp-btn-primary w-full">
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                Submit Support Ticket
              </Link>
              
              <div className="border-t border-[#CFE8D8] pt-4">
                <h4 className="font-semibold mb-3">Contact Information</h4>
                <div className="space-y-2 text-sm text-[#3A4354]">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#0B6B2E]" aria-hidden="true" />
                    <span>{localize("support@pakistanyp.com")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#0B6B2E]" aria-hidden="true" />
                    <span>Available 24/7</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="yp-card p-6">
              <span className="yp-label">Quick links</span>
              <nav className="mt-3 flex flex-col">
                {[
                  ['/pages/terms-of-service', 'Terms of Service'],
                  ['/pages/privacy-policy', 'Privacy Policy'],
                  ['/pages/business-guidelines', 'Business Guidelines'],
                  ['/pages/advertise-with-us', 'Advertise With Us'],
                ].map(([href, label]) => (
                  <Link key={href} href={href} className="flex items-center justify-between min-h-[44px] px-3 -mx-3 rounded-xl text-[15px] font-medium text-[#3A4354] hover:bg-[#F1F2F6] hover:text-[#0A0A0A]">
                    {label}
                    <ArrowRight className="w-4 h-4 text-[#5B6475]" aria-hidden="true" />
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </>
  );
}
