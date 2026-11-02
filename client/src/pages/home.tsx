import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, MapPinned, Clock } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useMobile } from "@/hooks/use-mobile";
import Header from "@/components/header";
import HeroSearch from "@/components/hero-search";
import FeaturedCategories from "@/components/featured-categories";

import FeaturedBusinesses from "@/components/featured-businesses";
import ClaimBusiness from "@/components/claim-business";
import BlogSection from "@/components/blog-section";
import NewBusinessesRegistered from "@/components/new-businesses-registered";
import Footer from "@/components/footer";
import { PageSEO } from "@/components/page-seo";
import { useToast } from "@/hooks/use-toast";
import BusinessMentorChatbot from "@/components/business-mentor-chatbot";
import ContextualUIHints from "@/components/contextual-ui-hints";
import VoiceSearch from "@/components/voice-search";
import CoreWebVitals from "@/components/core-web-vitals";
import BusinessNewsTicker from "@/components/business-news-ticker";
import { localLang, localDir, country, localize, regionUrl } from "@shared/country";

interface ProvinceSummary {
  id: number;
  name: string;
  arabicName?: string | null;
}

// Official Arabic names (from the country config), used when a region record has no arabicName set.
const regionArabic = (name: string) => country.regions.find((r) => r.name === name)?.nameAr;
// Pakistan: Karachi leads the grid. Other countries: the capital region leads, then config order.
const PROVINCE_ORDER = [...country.regions.filter((r) => r.capital), ...country.regions.filter((r) => !r.capital)].map((r) => r.name);
const provinceSlug = (name: string) => name.toLowerCase().replace(/\s+/g, "-");
const provinceHref = (name: string) => (regionUrl(name));

function ProvincesGrid() {
  const { data: provinces = [] } = useQuery<ProvinceSummary[]>({
    queryKey: ['/api/provinces'],
  });

  const items: ProvinceSummary[] = (provinces.length
    ? [...provinces]
    : PROVINCE_ORDER.map((name, i) => ({ id: -1 - i, name }))
  ).sort((a, b) => {
    const ia = PROVINCE_ORDER.indexOf(a.name);
    const ib = PROVINCE_ORDER.indexOf(b.name);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
  const [lead, ...rest] = items;
  const arabic = (e: ProvinceSummary) => e.arabicName || regionArabic(e.name) || "";

  return (
    <section className="yp-wrap pt-16 md:pt-24" aria-labelledby="home-provinces-heading">
      <div className="mb-8">
        <div className="yp-label">Explore</div>
        <h2 id="home-provinces-heading" className="yp-h2 mt-2 text-[#0A0A0A]">{`Across all ${country.regions.length} ${country.regionTerm.plural.toLowerCase()}`}</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {lead && (
          <Link
            href={provinceHref(lead.name)}
            className="relative flex min-h-[240px] flex-col justify-between overflow-hidden rounded-[24px] bg-[#E8F4EC] p-7 text-[#0A0A0A] hover:text-[#0A0A0A] sm:col-span-2 lg:col-span-1 lg:row-span-2 lg:min-h-[320px]"
            data-testid={`link-home-province-${provinceSlug(lead.name)}`}
          >
            <svg width="100%" height="180" viewBox="0 0 400 180" preserveAspectRatio="xMidYMax meet" className="pointer-events-none absolute bottom-0 left-0 opacity-[.22]" aria-hidden="true">
              <path d="M0 180V140h30v-30h20v30h25V90h18v50h22V60l8-30 8 30v80h25v-55h30v55h20v-40h25v40h30V100h20v40h35v-25h25v25h29v40z" fill="#0B6B2E" />
            </svg>
            {arabic(lead) && <span dir={localDir} lang={localLang} className="relative font-arabic text-[22px] text-[#0B6B2E]">{arabic(lead)}</span>}
            <span className="relative">
              <span className="block text-[34px] font-bold tracking-[-0.035em]">{lead.name}</span>
              <span className="mt-1.5 block text-[15px] text-[#3A4354]">Explore businesses in {lead.name} →</span>
            </span>
          </Link>
        )}
        {rest.map((province) => (
          <Link
            key={province.id}
            href={provinceHref(province.name)}
            className="yp-card yp-card-link flex min-h-[100px] items-center justify-between p-6 text-[#0A0A0A] hover:text-[#0A0A0A]"
            data-testid={`link-home-province-${provinceSlug(province.name)}`}
          >
            <span>
              <span className="block text-[19px] font-semibold">{province.name}</span>
              {arabic(province) && <span dir={localDir} lang={localLang} className="mt-1 block font-arabic text-[15px] text-[#5B6475]">{arabic(province)}</span>}
            </span>
            <span className="text-xl text-[#0B6B2E]" aria-hidden="true">→</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useMobile();

  // Handle post-login redirect for business claims
  useEffect(() => {
    if (user) {
      const claimRedirect = localStorage.getItem('claimBusinessAfterLogin');
      if (claimRedirect) {
        localStorage.removeItem('claimBusinessAfterLogin');
        toast({
          title: "Welcome back!",
          description: "You can now complete your business claim.",
        });
        navigate(claimRedirect);
      }
    }
  }, [user, navigate, toast]);

  const handleSearch = (searchData: { query: string; province: string }) => {
    const params = new URLSearchParams();
    if (searchData.query) params.set('q', searchData.query);
    if (searchData.province && searchData.province !== 'all') params.set('province', searchData.province);
    
    navigate(`/search-results?${params.toString()}`);
  };

  const handleVoiceSearch = (query: string) => {
    const params = new URLSearchParams();
    params.set('q', query);
    navigate(`/search-results?${params.toString()}`);
  };

  const handleCategoryClick = (categorySlug: string) => {
    navigate(`/categories/${categorySlug}`);
  };

  const handleClaimBusiness = () => {
    navigate('/dashboard');
  };

  return (
    <div className="pakistanyp-home yp-page min-h-[100dvh] bg-[#FAF8F3]">
      <PageSEO 
        title="Pakistan Yellow Pages – Business Directory | PakistanYP"
        description="Find verified companies across Karachi, Lahore, Islamabad and all provinces and territories. Search by category and area, compare details and contact businesses directly."
        keywords="Pakistani yellow pages, Pakistan business directory, Karachi businesses, Lahore companies, Pakistan companies, find businesses Pakistan, business listings Pakistan, verified Pakistani directory, province businesses"
        canonicalUrl="https://pakistanyp.com/"
        ogTitle="PakistanYP – Pakistan Business Directory for Every Province"
        ogDescription="Search businesses by category and area across Karachi, Lahore, Islamabad and every province. Compare details and contact companies directly."
        ogImage="https://pakistanyp.com/og-homepage.jpg"
        schemaMarkup={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "PakistanYP - Pakistan Yellow Pages",
          "alternateName": "Pakistani Business Directory",
          "url": "https://pakistanyp.com",
          "description": "The most comprehensive business directory for Pakistan, featuring verified listings across all provinces and territories.",
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://pakistanyp.com/search?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          }
        }}
      />
      <CoreWebVitals />
      
      {/* Use appropriate header based on device */}
      <Header />
      
      <HeroSearch onSearch={handleSearch} />
      
      {/* News Ticker - positioned below hero header */}
      <BusinessNewsTicker />
      
      <FeaturedCategories onCategoryClick={handleCategoryClick} />

      <ProvincesGrid />

      <FeaturedBusinesses />
      <NewBusinessesRegistered />

      <ClaimBusiness onClaimClick={handleClaimBusiness} />

      {/* E-E-A-T Content Section - Why Choose PakistanYP */}
      <section className="home-about yp-wrap pt-16 md:pt-24">
        <div className="mb-8 max-w-3xl">
          <div className="yp-label">{localize("Why PakistanYP")}</div>
          <h2 className="yp-h2 mt-2 text-[#0A0A0A]">Local businesses. A clearer choice.</h2>
          <p className="yp-lead mt-4">
            {localize("Compare business details, read customer experiences, and contact companies directly. PakistanYP brings local information together across all provinces and territories.")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="yp-card flex flex-col gap-[18px] p-6">
            <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-[#E8F4EC] text-[#0B6B2E]" aria-hidden="true"><ShieldCheck className="h-6 w-6" strokeWidth={1.8} /></span>
            <span>
              <h3 className="text-[17px] font-semibold text-[#0A0A0A]">Verified businesses</h3>
              <p className="mt-1.5 text-sm leading-[1.6] text-[#4B5565]">Look for the verified badge, compare company information, and choose the right business for your needs.</p>
            </span>
          </div>
          <div className="yp-card flex flex-col gap-[18px] p-6">
            <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-[#FFF4E0] text-[#B45309]" aria-hidden="true"><MapPinned className="h-6 w-6" strokeWidth={1.8} /></span>
            <span>
              <h3 className="text-[17px] font-semibold text-[#0A0A0A]">{`All ${country.regions.length} ${country.regionTerm.plural.toLowerCase()} covered`}</h3>
              <p className="mt-1.5 text-sm leading-[1.6] text-[#4B5565]">{`Complete coverage across ${country.regions.slice(0, -1).map((r) => r.name).join(", ")}, and ${country.regions[country.regions.length - 1].name}.`}</p>
            </span>
          </div>
          <div className="yp-card flex flex-col gap-[18px] p-6">
            <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-[#E6F6F1] text-[#047857]" aria-hidden="true"><Clock className="h-6 w-6" strokeWidth={1.8} /></span>
            <span>
              <h3 className="text-[17px] font-semibold text-[#0A0A0A]">Always available</h3>
              <p className="mt-1.5 text-sm leading-[1.6] text-[#4B5565]">Access business information anytime with our reliable platform and comprehensive search capabilities.</p>
            </span>
          </div>
        </div>

        {/* About Us / Mission Statement */}
        <div className="mt-4 flex flex-wrap items-start gap-6 rounded-[24px] bg-[#F7F8FA] p-6 md:gap-10 md:p-10">
          <div className="min-w-0 flex-[1_1_420px]">
            <h3 className="yp-h3 text-[#0A0A0A]">{localize("About PakistanYP")}</h3>
            <p className="mt-3 text-[16px] leading-[1.7] text-[#3A4354]">
              {`${country.brand} is ${country.name}'s most comprehensive business directory, founded with the mission to connect businesses and consumers across all ${country.regions.length} ${country.regionTerm.plural.toLowerCase()}. Our platform features verified business listings, authentic customer reviews, and detailed company information to help you make informed decisions. With expertise in the ${country.adjective} market and commitment to data accuracy, we serve as the trusted bridge between businesses and their customers.`}
            </p>
          </div>
          <div className="flex flex-none gap-8">
            <div>
              <div className="text-[28px] font-bold tracking-[-0.04em] text-[#0A0A0A]">2024</div>
              <div className="text-sm text-[#5B6475]">Established</div>
            </div>
            <div>
              <div className="text-[28px] font-bold tracking-[-0.04em] text-[#0A0A0A]">{String(country.regions.length)}</div>
              <div className="text-sm text-[#5B6475]">{country.regionTerm.plural}</div>
            </div>
          </div>
        </div>
      </section>

      <BlogSection />
      <Footer />
      
      {/* Business Mentor Chatbot */}
      <BusinessMentorChatbot />
    </div>
  );
}
