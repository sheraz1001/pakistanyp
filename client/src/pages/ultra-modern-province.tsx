import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Helmet } from "@/lib/helmet-compat";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import BusinessListing from "@/components/business-listing";
import { 
  MapPin, 
  Building2, 
  Star, 
  Verified, 
  Grid,
  List
} from "lucide-react";
import { breadcrumbLd, provinceSlug } from "@/lib/structured-data";
import { provinceDirectory } from "@shared/province-directory";
import { localLang, localDir, country, localize, regionSlug } from "@shared/country";

interface Province {
  id: number;
  code: string;
  name: string;
  arabicName: string;
  description: string;
  detailedDescription?: string;
  homepageImage?: string;
  headerImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  isActive: boolean;
  isPublished: boolean;
  sortOrder: number;
  viewCount: number;
}

const provinceImages = {
  'lahore': '/assets/provinces/lahore.jpg',
  'karachi': '/assets/provinces/karachi.jpg',
  'islamabad': '/assets/provinces/islamabad.jpg',
  'rawalpindi': '/assets/provinces/rawalpindi.jpg',
  'faisalabad': '/assets/provinces/faisalabad.jpg',
  'peshawar': '/assets/provinces/peshawar.jpg',
  'multan': '/assets/provinces/multan.jpg',
};

export default function UltraModernProvincePage() {
  const [location] = useLocation();
  const [, navigate] = useLocation();
  const [viewMode, setViewMode] = useState<'compact' | 'expanded'>('compact');
  const [filter, setFilter] = useState<'all' | 'featured' | 'verified'>('all');
  const [localitySearch, setLocalitySearch] = useState("");

  // Extract province from current path
  const segments = location.split('/').filter(Boolean);
  const province = (segments[0] === country.regionsPath.replace(/^\//, '') ? segments[1] : segments[0]) || '';
  const requestedSlug = (() => { try { return regionSlug(decodeURIComponent(province)); } catch { return regionSlug(province); } })();
  const region = country.regions.find(item => item.slug === requestedSlug);
  const identity = region ? { code: undefined as string | undefined, name: region.name, slug: region.slug } : undefined;
  
  // Convert URL slug to province name for API lookup
  const provinceName = province
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Get provinces data
  const { data: provinces = [], isLoading: provincesLoading, error: provincesError, refetch } = useQuery({
    queryKey: ['/api/provinces'],
  });

  // Find current province
  const savedProvince = (provinces as Province[]).find((e: Province) =>
        !!e.name && (regionSlug(e.name) === (region?.slug ?? requestedSlug))
      );
  const regionFallbackDescription = (name: string) =>
    localize(`Explore local businesses and services in ${name}, Pakistan.`);
  const currentProvince = (savedProvince
      ? {
          ...savedProvince,
          name: identity?.name ?? savedProvince.name,
          arabicName: savedProvince.arabicName || region?.nameAr || "",
          description: savedProvince.description || regionFallbackDescription(identity?.name ?? savedProvince.name),
        }
      : identity ? { ...identity, id: 0, arabicName: region?.nameAr || "", description: regionFallbackDescription(identity.name), metaTitle: "", metaDescription: "" } : undefined);

  // Get business counts by province
  const { data: localities = [], isLoading: localitiesLoading, error: localitiesError, refetch: retryLocalities } = useQuery<Array<{ id: number; name: string; slug: string }>>({
    queryKey: [`/api/localities?provinceId=${currentProvince?.id}`],
    enabled: !!currentProvince?.id,
  });
  const visibleLocalities = localities
    .filter(item => item.name.toLowerCase().includes(localitySearch.toLowerCase().trim()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const { data: businessCounts = [] } = useQuery({
    queryKey: ['/api/businesses/count-by-province'],
  });

  // Get locality counts by province
  const { data: localityCounts = [] } = useQuery({
    queryKey: ['/api/localities/count-by-province'],
  });

  // Get businesses for this province
  const { data: businessData, isLoading: businessesLoading, error: businessesError, refetch: retryBusinesses } = useQuery({
    queryKey: [`/api/businesses/by-province/${currentProvince?.id}`, filter],
    enabled: !!currentProvince?.id,
    queryFn: () => {
      const params = new URLSearchParams();
      if (filter === 'featured') params.append('featured', 'true');
      if (filter === 'verified') params.append('verified', 'true');
      
      return fetch(`/api/businesses/by-province/${currentProvince?.id}?${params.toString()}`)
        .then(res => {
          if (!res.ok) throw new Error("Unable to load businesses");
          return res.json();
        });
    },
  });

  const businesses = (businessData as any)?.businesses || [];
  const totalBusinesses = (businessData as any)?.total || 0;
  const featuredCount = (businessData as any)?.featuredCount || 0;
  const verifiedCount = (businessData as any)?.verifiedCount || 0;

  // Find stats for current province
  const businessStats = (businessCounts as any[]).find((bc: any) => 
    bc.provinceId === currentProvince?.id
  );
  
  const localityStats = (localityCounts as any[]).find((lc: any) => 
    lc.provinceId === currentProvince?.id
  );

  const heroImage = savedProvince?.headerImage || savedProvince?.homepageImage || '';
  const shareImage = heroImage || country.ogImage;

  if (provincesLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F3]">
        <Header />
        <div className="animate-pulse">
          <div className="h-72 border-b border-[#CFE8D8] bg-[#F2F9F4]"></div>
          <div className="yp-wrap-wide py-8">
            <div className="space-y-4">
              <div className="h-8 bg-[#EEF0F4] rounded w-1/3"></div>
              <div className="h-4 bg-[#EEF0F4] rounded w-2/3"></div>
              <div className="h-4 bg-[#EEF0F4] rounded w-1/2"></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (provincesError || !currentProvince) {
    return (
      <div className="min-h-screen bg-[#FAF8F3]">
        <Header />
        <div className="yp-wrap pt-16 pb-24">
          <div className="yp-card mx-auto max-w-xl p-10 text-center">
            <h1 className="text-2xl font-bold tracking-[-0.03em] text-[#0A0A0A] mb-4">{provincesError ? localize("Unable to load this Province") : localize("Province Not Found")}</h1>
            {provincesError && <Button className="mr-3" onClick={() => refetch()}>Try again</Button>}
            <Button onClick={() => navigate(country.regionsPath)}>
              {localize("Back to Provinces")}
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#0A0A0A]">
      <Helmet>
        <title>{currentProvince.metaTitle || `${currentProvince.name} - Pakistani Business Directory`}</title>
        <meta 
          name="description" 
          content={currentProvince.metaDescription || `Discover businesses in ${currentProvince.name}. Find verified companies, services, and local businesses with contact details and reviews.`} 
        />
        <meta property="og:title" content={`${currentProvince.name} Business Directory`} />
        <meta property="og:description" content={`Explore businesses in ${currentProvince.name}, ${country.name}`} />
        <meta property="og:image" content={shareImage} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${currentProvince.name} Business Directory`} />
        <meta name="twitter:description" content={`Explore businesses in ${currentProvince.name}, ${country.name}`} />
        <meta name="twitter:image" content={shareImage} />
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd([
          { name: "Home", path: "/" },
          { name: country.regionTerm.plural, path: country.regionsPath },
          { name: currentProvince.name, path: `/${provinceSlug(currentProvince.name)}` },
        ]))}</script>
      </Helmet>

      <Header />

      {/* Province header */}
      <section className="border-b border-[#CFE8D8] bg-[#F2F9F4]">
        <div className="yp-wrap-wide grid items-center gap-10 pt-8 pb-12 lg:grid-cols-[1.2fr_1fr]">
          <div className="min-w-0">
            <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap gap-2 text-sm text-[#5B6475]">
              <Link href="/" className="text-[#0B6B2E] hover:text-[#05501F]">Home</Link>
              <span aria-hidden="true">/</span>
              <Link href={country.regionsPath} className="text-[#0B6B2E] hover:text-[#05501F]">{country.regionTerm.plural}</Link>
              <span aria-hidden="true">/</span>
              <span>{currentProvince.name}</span>
            </nav>
            <span className="yp-pill gap-1 border border-[#CFE8D8] bg-white text-[#05501F]">
              <MapPin className="h-3 w-3" />
              {localize("Pakistani Province")}
            </span>
            
            {currentProvince.arabicName && (
              <p dir={localDir} lang={localLang} className="mt-5 font-arabic text-[22px] text-[#0B6B2E]">
                {currentProvince.arabicName}
              </p>
            )}
            <h1 className="yp-h1 mt-2">
              {currentProvince.name}
            </h1>
            
            <p className="yp-lead mt-5 max-w-2xl">
              {currentProvince.description}
            </p>

            {/* Stats Cards */}
            <dl className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              {[
                { value: businessStats?.businessCount || 0, label: "Businesses" },
                { value: featuredCount, label: "Featured" },
                { value: localityStats?.localityCount || 0, label: "Localities" },
              ].map((stat) => (
                <div key={stat.label} className="yp-card px-4 py-4">
                  <dd className="text-2xl font-bold tracking-[-0.03em]">{stat.value}</dd>
                  <dt className="mt-1 text-[13px] text-[#5B6475]">{stat.label}</dt>
                </div>
              ))}
            </dl>
          </div>
          {heroImage && <div className="relative hidden h-[340px] overflow-hidden rounded-[24px] border border-[#CFE8D8] bg-[#E8F4EC] lg:block">
            <img src={heroImage} alt={`${currentProvince.name}`} className="h-full w-full object-cover" />
          </div>}
        </div>
      </section>

      <div className="yp-wrap-wide flex flex-wrap items-start gap-6 pt-8 pb-20">
        {/* Filters + localities */}
        <aside className="flex w-full flex-col gap-4 lg:w-[320px] lg:flex-none" aria-label="Filters">
          <div className="yp-card flex flex-col gap-5 p-6">
            <span className="text-base font-semibold">Filters</span>
            <fieldset className="flex flex-col gap-2">
              <legend className="yp-label mb-2">Show</legend>
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                className="min-h-[44px] justify-start gap-2"
              >
                <Building2 className="w-4 h-4" />
                All ({totalBusinesses})
              </Button>
              <Button
                variant={filter === 'featured' ? 'default' : 'outline'}
                onClick={() => setFilter('featured')}
                className="min-h-[44px] justify-start gap-2"
              >
                <Star className="w-4 h-4" />
                Featured ({featuredCount})
              </Button>
              <Button
                variant={filter === 'verified' ? 'default' : 'outline'}
                onClick={() => setFilter('verified')}
                className="min-h-[44px] justify-start gap-2"
              >
                <Verified className="w-4 h-4" />
                Verified ({verifiedCount})
              </Button>
            </fieldset>

            <div className="flex flex-col gap-2">
              <span className="yp-label">View</span>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'compact' ? 'default' : 'outline'}
                  className="min-h-[44px] flex-1"
                  onClick={() => setViewMode('compact')}
                  aria-label="Grid view"
                  aria-pressed={viewMode === 'compact'}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'expanded' ? 'default' : 'outline'}
                  className="min-h-[44px] flex-1"
                  onClick={() => setViewMode('expanded')}
                  aria-label="List view"
                  aria-pressed={viewMode === 'expanded'}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <section aria-labelledby="localities-heading" className="yp-card p-6">
            <h2 id="localities-heading" className="text-base font-semibold">Explore localities in {currentProvince.name}</h2>
            <p className="mt-1 text-sm text-[#5B6475]">Choose an area to find local businesses and services.</p>
            <label htmlFor="locality-search" className="yp-label mt-4 mb-2 block">Search localities</label>
            <input id="locality-search" type="search" value={localitySearch} onChange={event => setLocalitySearch(event.target.value)}
              placeholder={`Search areas in ${currentProvince.name}`}
              className="yp-input mb-3 text-[15px]" />
            {localitiesLoading ? <p role="status" className="text-sm text-[#5B6475]">Loading localities…</p> : localitiesError ? (
              <div role="alert" className="text-sm text-[#3A4354]">Localities could not be loaded. <Button variant="outline" className="mt-2" onClick={() => retryLocalities()}>Try again</Button></div>
            ) : (
              <>
                <p className="mb-2 text-[13px] text-[#5B6475]" role="status">{visibleLocalities.length} localities{localitySearch ? " matching your search" : ""}</p>
                <div className="-mx-2 flex max-h-80 flex-col overflow-y-auto" aria-label="Locality links">
                  {visibleLocalities.map(item => (
                    <Link key={item.id} href={`/localities/${item.slug}`} className="flex min-h-[40px] items-center gap-2 rounded-[10px] px-2 text-sm font-medium text-[#3A4354] hover:bg-[#F1F2F6] hover:text-[#0A0A0A] focus-visible:outline focus-visible:outline-2">
                      <MapPin className="h-4 w-4 shrink-0 text-[#0B6B2E]" aria-hidden="true" />{item.name}
                    </Link>
                  ))}
                  {!visibleLocalities.length && <p className="p-2 text-sm text-[#5B6475]">{localitySearch ? "No localities match your search." : localize("No localities are currently available for this Province.")}</p>}
                </div>
              </>
            )}
            <Link href="/localities" className="mt-4 inline-block text-sm font-semibold text-[#0B6B2E] hover:text-[#05501F]">{localize("View all Pakistani localities →")}</Link>
          </section>
        </aside>

        {/* Businesses Section */}
        <section className="flex min-w-0 flex-[999_1_560px] flex-col gap-4" aria-label="Results">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-[22px] font-semibold tracking-[-0.02em]">Businesses in {currentProvince.name}</h2>
              <p className="mt-1 text-sm text-[#5B6475]">{totalBusinesses} businesses{filter !== 'all' ? ` · ${filter}` : ''}</p>
            </div>
          </div>
          {!savedProvince && (<p role="status" className="yp-card p-6 text-[#4B5565]">{`Business listings for ${currentProvince.name} are not currently available. Please explore another ${country.regionTerm.singular}.`}</p>)}
          {businessesError ? (
            <div role="alert" className="yp-card p-8 text-center">
              <h3 className="mb-2 text-lg font-semibold">Unable to load business listings</h3>
              <p className="mb-4 text-[#4B5565]">Please try again in a moment.</p>
              <Button onClick={() => retryBusinesses()}>Try again</Button>
            </div>
          ) : businessesLoading ? (
            <BusinessListing loading layout={viewMode === 'compact' ? 'grid' : 'list'} />
          ) : businesses.length === 0 ? (
            <div className="yp-card px-6 py-12 text-center">
              <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-[14px] bg-[#F1F2F6] text-[#334155]">
                <Building2 className="h-6 w-6" />
              </span>
              <h3 className="mb-2 text-xl font-semibold">
                No businesses found
              </h3>
              <p className="mb-6 text-[#4B5565]">
                {filter === 'all' 
                  ? `No businesses are currently listed in ${currentProvince.name}.`
                  : `No ${filter} businesses found in ${currentProvince.name}.`}
              </p>
              <Button className="bg-[#E3A82B] text-[#141414] hover:bg-[#D19719]" onClick={() => navigate('/add-business')}>
                Add Your Business
              </Button>
            </div>
          ) : (
            <BusinessListing businesses={businesses} layout={viewMode === 'compact' ? 'grid' : 'list'} province={currentProvince} />
          )}
        </section>
      </div>

      <Footer />
    </div>
  );
}
