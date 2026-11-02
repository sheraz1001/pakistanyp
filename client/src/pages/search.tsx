import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Search } from 'lucide-react';
import BusinessListing from "@/components/business-listing";
import { BusinessViewToggle } from "@/components/business-card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { Business, Category, Province } from '@shared/schema';
import { SEO } from '@/components/seo';
import MobileHeader from '@/components/mobile-header';
import { MobileSearch } from '@/components/mobile-search';
import { useMobile } from '@/hooks/use-mobile';
import { useSearchLoading } from '@/hooks/use-loading';
import { country, localize } from '@shared/country';
import { t as tx } from "@shared/i18n";
import { tj } from "@/i18n-jsx/tj";

export default function SearchPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const isMobile = useMobile();
  const { isSearching, startSearch, completeSearch } = useSearchLoading();

  // Parse URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q') || '';
    const category = urlParams.get('category') || '';
    const province = urlParams.get('province') || '';
    
    setSearchQuery(query);
    setSelectedCategory(category);
    setSelectedProvince(province);
  }, [location]);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { data: provinces } = useQuery<Province[]>({
    queryKey: ['/api/provinces'],
  });

  const { data: searchResults, isLoading, error, refetch } = useQuery<{ businesses: Business[]; total: number }>({
    queryKey: ['/api/businesses', { 
      query: searchQuery,
      categoryId: selectedCategory, 
      provinceId: selectedProvince 
    }],
    enabled: !!(searchQuery || selectedCategory || selectedProvince),
  });

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('q', searchQuery);
    if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
    if (selectedProvince && selectedProvince !== 'all') params.append('province', selectedProvince);
    
    startSearch();
    navigate(`/search?${params.toString()}`);
  };

  // Complete search when results are loaded
  useEffect(() => {
    if (!isLoading && isSearching) {
      completeSearch();
    }
  }, [isLoading, isSearching, completeSearch]);

  const searchTitle = searchQuery ? `Search Results for "${searchQuery}" in Pakistan` : 'Search Pakistani Businesses';
  const searchDescription = searchQuery 
    ? `Find businesses matching "${searchQuery}" across Pakistan. Browse verified listings with reviews, ratings, and contact information.`
    : 'Search thousands of businesses across Pakistan. Find restaurants, hotels, services, and companies in all provinces and territories with detailed information.';

  return (
    <>
      <SEO
        title={tx("{0} | PakistanYP Directory", searchTitle)}
        description={searchDescription}
        keywords={tx("Pakistani business search, find businesses Pakistan, {0}, {1}", searchQuery || 'business directory', selectedProvince || 'all provinces')}
        canonical={tx("https://pakistanyp.com/search{0}", location.includes('?') ? location.substring(location.indexOf('?')) : '')}
        ogTitle={searchTitle}
        schemaType="SearchResultsPage"
      />
      
      {isMobile && <MobileHeader />}
      
      <div className={`min-h-screen bg-[#FAF8F3] ${isMobile ? 'pb-20' : ''}`}>
      <div className="yp-wrap-wide pb-20 pt-8">
        {isMobile ? (
          <MobileSearch />
        ) : (
          <div className="mb-8">
            <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-sm text-[#5B6475]">
              <a href="/" className="text-[#0B6B2E] hover:text-[#05501F]">Home</a>
              <span aria-hidden="true">/</span>
              <span>Search</span>
            </nav>
            <h1 className="mb-6 mt-4 text-[clamp(30px,3.6vw,44px)] font-bold leading-[1.1] tracking-[-0.04em] text-[#0A0A0A] break-words">
              {searchQuery ? tx("Results for “{0}”", searchQuery) : localize('Search Pakistani businesses')}
            </h1>
            <form
              role="search"
              onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
              className="flex max-w-[860px] flex-wrap gap-1.5 rounded-[14px] border border-[#DDE1E8] bg-[#F7F8FA] p-1.5"
            >
              <label className="relative flex min-w-[200px] flex-[2_1_200px] items-center gap-2 px-2.5">
                <Search className="h-[18px] w-[18px] shrink-0 text-[#5B6475]" aria-hidden="true" />
                <span className="sr-only">Search</span>
                <Input
                  placeholder="Search businesses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </label>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-10 flex-[1_1_160px] border-0 border-s border-[#DDE1E8] bg-transparent shadow-none rounded-none" aria-label="Category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                <SelectTrigger className="h-10 flex-[1_1_140px] border-0 border-s border-[#DDE1E8] bg-transparent shadow-none rounded-none" aria-label={country.regionTerm.singular}>
                  <SelectValue placeholder={country.regionTerm.singular} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{localize("All Provinces")}</SelectItem>
                  {provinces?.map((province) => (
                    <SelectItem key={province.id} value={province.id.toString()}>
                      {province.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button type="submit" className="min-h-[40px] rounded-[10px]">
                <Search className="h-4 w-4 me-2" />
                Search
              </Button>
            </form>
          </div>
        )}

        {isLoading || isSearching ? (
          <BusinessListing loading layout={viewMode} />
        ) : error ? (
          <div role="alert" className="yp-card p-8 text-center">
            <h2 className="mb-2 text-lg font-semibold text-[#0A0A0A]">Unable to load businesses</h2>
            <p className="mb-4 text-[#5B6475]">Please try again in a moment.</p>
            <Button onClick={() => refetch()}>Try again</Button>
          </div>
        ) : searchResults?.businesses.length ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[15px] font-medium text-[#5B6475]">{tj("{0} businesses found", searchResults.total)}</h2>
              <BusinessViewToggle value={viewMode} onChange={setViewMode} />
            </div>
            
            <BusinessListing businesses={searchResults.businesses} layout={viewMode} />
          </div>
        ) : (
          <div className="yp-card px-6 py-16 text-center">
            <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-[14px] bg-[#E8F4EC] text-[#0B6B2E]">
              <Search className="h-6 w-6" aria-hidden="true" />
            </span>
            <h3 className="mb-2 text-xl font-semibold text-[#0A0A0A]">No businesses found</h3>
            <p className="text-[#5B6475]">
              Try adjusting your search criteria or browse our categories.
            </p>
          </div>
        )}
      </div>
      </div>
    </>
  );
}