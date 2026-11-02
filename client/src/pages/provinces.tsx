import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import BreakingNewsTicker from "@/components/breaking-news-ticker";
import { SEO, SEOConfigs } from "@/components/seo";
import Breadcrumb from "@/components/breadcrumb";
import CoreWebVitals from "@/components/core-web-vitals";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  MapPin, 
  Building, 
  Users, 
  Calendar, 
  Landmark, 
  Globe, 
  Star, 
  TrendingUp,
  Eye,
  ArrowRight,
  Activity,
  DollarSign,
  Search,
  Map,
  Crown,
  Building2,
  Sparkles
} from "lucide-react";
import { localLang, localDir, country, localize, regionSlug } from "@shared/country";

interface Province {
  id: number;
  name: string;
  arabicName: string;
  description: string;
  area: string;
  population: number;
  isCapital: boolean;
}

interface BusinessCount {
  provinceId: number;
  provinceName: string;
  businessCount: number;
}

interface LocalityCount {
  provinceId: number;
  provinceName: string;
  localityCount: number;
}


export default function Provinces() {
  const [, params] = useRoute(`${country.regionsPath}/:province?`);
  const [, navigate] = useLocation();
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);

  const { data: provinces = [] } = useQuery({
    queryKey: ['/api/provinces'],
  });

  // Fetch business counts by province
  const { data: businessCounts = [] } = useQuery<BusinessCount[]>({
    queryKey: ['/api/businesses/count-by-province'],
  });

  // Fetch locality counts by province  
  const { data: localityCounts = [] } = useQuery<LocalityCount[]>({
    queryKey: ['/api/localities/count-by-province'],
  });

  // Redirect to correct province pages using useEffect
  useEffect(() => {
    if (params?.province) {
      const route = country.regions.find(r => r.slug === params.province) ? `/${params.province}` : undefined;
      if (route) {
        navigate(route);
      }
    }
  }, [params?.province, navigate]);


  const [searchQuery, setSearchQuery] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  // Non-Pakistan: regions come from the country config, counts from the API (matched by name)
  const apiRegions = (provinces as Array<{ id: number; name: string }>) || [];
  const regionCards = country.regions.map((r, index) => {
    const record = apiRegions.find(e => regionSlug(e.name) === r.slug);
    const id = record?.id ?? -(index + 1);
    const matches = (row: { provinceId: number; provinceName: string }) =>
      (record && row.provinceId === record.id) || regionSlug(row.provinceName) === r.slug;
    return {
      id,
      slug: r.slug,
      name: r.name,
      arabicName: r.nameAr,
      capital: !!r.capital,
      cities: (r.cities || []).map(c => c.name),
      href: `/${r.slug}`,
      businesses: businessCounts.find(matches)?.businessCount || 0,
      localities: localityCounts.find(matches)?.localityCount || 0,
    };
  });
  const featuredRegion = regionCards.find(r => r.capital) || regionCards[0];
  const tileFeatured = featuredRegion;
  const tileOthers = regionCards.filter(r => r !== featuredRegion);
  const visibleRegions = normalizedQuery
    ? regionCards.filter((r) =>
        [r.name, r.arabicName, ...r.cities].some((v) => v.toLowerCase().includes(normalizedQuery))
      )
    : regionCards;
  const regionCount = country.regions.length;
  const regionsPlural = country.regionTerm.plural.toLowerCase();
  const capitalRegion = country.regions.find(r => r.capital);

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#0A0A0A]">
      <SEO
        title="Pakistani Provinces – Business Directory by Province | PakistanYP"
        description={`Browse businesses in ${country.regions.map(r => r.name).join(", ")}. Pick a region to explore its localities and companies.`}
        canonical={`${country.origin}${country.regionsPath}`}
        schemaType="CollectionPage"
      />
      <CoreWebVitals />
      <Header />
      
      <main>
        {/* Page header */}
        <section className="border-b border-[#E7E9EE] bg-white">
          <div className="yp-wrap pt-8 pb-14">
            <Breadcrumb items={[
              { label: country.regionTerm.plural, href: country.regionsPath }
            ]} className="mb-8" />
            
            <div className={`transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
              <span className="yp-pill bg-[#E8F4EC] text-[#05501F]">
                {`${country.name} - ${regionCount} ${country.regionTerm.plural}`}
              </span>
              
              <h1 className="yp-h1 mt-5 max-w-3xl">
                {localize("Pakistani Provinces Hub")}
              </h1>
              
              {(
              <p className="yp-lead mt-5 max-w-3xl">
                {`Discover the ${regionCount} ${regionsPlural} of ${country.name}${capitalRegion ? ` - from the capital ${capitalRegion.name} and beyond` : ""}. Pick a ${country.regionTerm.singular.toLowerCase()} to explore its localities and local businesses.`}
              </p>
              )}
              
              {/* Live Stats */}
              <dl className="mt-9 grid max-w-4xl grid-cols-2 gap-3 md:grid-cols-4">
                {([
                  { icon: Globe, value: String(regionCount), label: country.regionTerm.plural },
                  { icon: MapPin, value: localityCounts.reduce((total, lc) => total + (lc.localityCount || 0), 0).toLocaleString(), label: "Localities" },
                  { icon: Building2, value: businessCounts.reduce((total, bc) => total + (bc.businessCount || 0), 0).toLocaleString(), label: "Businesses" },
                ]).map(({ icon: Icon, value, label }) => (
                  <div key={label} className="yp-card p-5">
                    <Icon className="mb-3 h-5 w-5 text-[#0B6B2E]" strokeWidth={1.8} />
                    <dd className="text-[28px] font-bold leading-none tracking-[-0.035em]">{value}</dd>
                    <dt className="mt-1.5 text-sm text-[#5B6475]">{label}</dt>
                  </div>
                ))}
              </dl>

              {/* Search Bar */}
              <div className="mt-8 max-w-2xl">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5B6475]" />
                  <Input
                    placeholder={localize("Search provinces, cities, businesses, attractions...")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-14 rounded-[14px] pl-12 pr-14 text-base"
                  />
                  {searchQuery && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear search"
                      className="absolute right-2 top-1/2 h-10 w-10 -translate-y-1/2 p-0 text-[#5B6475] hover:text-[#0A0A0A]"
                    >
                      ×
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Breaking News Ticker */}
        <BreakingNewsTicker />

        {/* Province tiles */}
        <section className="yp-wrap pt-20">
          <div className="mb-8">
            <div className="yp-label">Explore</div>
            <h2 className="yp-h2 mt-2">{`Across all ${regionCount} ${regionsPlural}`}</h2>
          </div>
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(250px,1fr))]">
            {tileFeatured && <a
              href={tileFeatured.href}
              onClick={(e) => { e.preventDefault(); navigate(tileFeatured.href); }}
              className="relative flex min-h-[320px] flex-col justify-between overflow-hidden rounded-[24px] bg-[#E8F4EC] p-7 text-[#0A0A0A] hover:text-[#0A0A0A] sm:row-span-2"
            >
              <svg width="100%" height="180" viewBox="0 0 400 180" preserveAspectRatio="xMidYMax meet" className="pointer-events-none absolute bottom-0 left-0 opacity-[.22]" aria-hidden="true"><path d="M0 180V140h30v-30h20v30h25V90h18v50h22V60l8-30 8 30v80h25v-55h30v55h20v-40h25v40h30V100h20v40h35v-25h25v25h29v40z" fill="#0B6B2E"></path></svg>
              <span dir={localDir} lang={localLang} className="relative font-arabic text-[22px] text-[#0B6B2E]">{tileFeatured.arabicName}</span>
              <span className="relative">
                <span className="block text-[34px] font-bold tracking-[-0.035em]">{tileFeatured.name}</span>
                <span className="mt-1.5 block text-[15px] text-[#3A4354]">
                  {tileFeatured.businesses.toLocaleString()} businesses · {tileFeatured.localities} localities →
                </span>
              </span>
            </a>}
            {tileOthers.map((province) => (
              <a
                key={province.id}
                href={province.href}
                onClick={(e) => { e.preventDefault(); navigate(province.href); }}
                className="yp-card yp-card-link flex min-h-[100px] items-center justify-between gap-3 p-6 text-[#0A0A0A] hover:text-[#0A0A0A]"
              >
                <span>
                  <span className="block text-[19px] font-semibold">{province.name}</span>
                  <span dir={localDir} lang={localLang} className="mt-1 block font-arabic text-[15px] text-[#5B6475]">{province.arabicName}</span>
                </span>
                <span className="text-xl text-[#0B6B2E]" aria-hidden="true">→</span>
              </a>
            ))}
          </div>
        </section>

        {/* Provinces detail cards */}
        <section className="yp-wrap pt-24">
          <div className="mb-10 max-w-2xl">
            <div className="yp-label">In detail</div>
            {(<>
            <h2 className="yp-h2 mt-2">
              {`The ${regionCount} ${country.regionTerm.plural}`}
            </h2>
            <p className="mt-3 text-[17px] leading-relaxed text-[#4B5565]">
              {`Browse local businesses and localities in every ${country.regionTerm.singular.toLowerCase()} of ${country.name}`}
            </p>
            </>)}
          </div>

          {visibleRegions.length === 0 && (
            <div className="yp-card p-10 text-center text-[#4B5565]">
              No {regionsPlural} match “{searchQuery}”.
            </div>
          )}

          {(
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visibleRegions.map((region) => (
              <article key={region.slug} className="yp-card yp-card-link flex flex-col overflow-hidden">
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-3 flex items-baseline justify-between gap-3">
                    <h3 className="text-[22px] font-semibold tracking-[-0.02em]">{region.name}</h3>
                    <span dir={localDir} lang={localLang} className="font-arabic text-[15px] text-[#5B6475]">{region.arabicName}</span>
                  </div>
                  {region.capital && (
                    <span className="yp-pill mb-4 w-fit gap-1 border border-[#E7E9EE] bg-white text-[#05501F]">
                      <Crown className="h-3 w-3" /> Capital {country.regionTerm.singular.toLowerCase()}
                    </span>
                  )}
                  <dl className="mb-5 grid grid-cols-2 gap-2">
                    {[
                      { label: "Businesses", value: region.businesses.toLocaleString() },
                      { label: "Localities", value: region.localities },
                    ].map((stat) => (
                      <div key={stat.label} className="yp-panel px-3 py-2.5">
                        <dt className="text-[12px] text-[#5B6475]">{stat.label}</dt>
                        <dd className="text-[15px] font-semibold">{stat.value}</dd>
                      </div>
                    ))}
                  </dl>
                  {region.cities.length > 0 && (
                    <div className="mb-6">
                      <h4 className="yp-label mb-2">Main cities</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {region.cities.map((city) => (
                          <span key={city} className="yp-tag">{city}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button className="mt-auto min-h-[44px] w-full" onClick={() => navigate(region.href)}>
                    Explore Businesses in {region.name}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
          )}

          

          
        </section>

        {/* Economic Overview Section (Pakistani-only figures) */}
        

        {/* Interactive Map Section (Pakistani coordinates) */}
        

        {/* Call to Action */}
        <section className="yp-wrap py-24">
          <div className="yp-card px-6 py-14 text-center sm:px-10">
            <h2 className="yp-h2 mb-4">
              {localize("Ready to Explore Pakistan?")}
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-[17px] leading-relaxed text-[#4B5565]">
              {`Discover business opportunities, find local services, and connect with the vibrant communities across all ${regionCount} ${regionsPlural}`}
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button 
                size="lg" 
                className="min-h-[52px]"
                onClick={() => navigate('/categories')}
              >
                Browse Business Directory
                <Building className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="min-h-[52px]"
                onClick={() => navigate('/localities')}
              >
                Explore All Localities
                <MapPin className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
