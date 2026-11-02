import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import BusinessListing from "@/components/business-listing";
import { BusinessViewToggle } from "@/components/business-card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Business, Category, Province } from "@shared/schema";
import { country, localize } from "@shared/country";

export default function SearchResults() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const PAGE_SIZE = 20;
  const [location, setLocation] = useLocation();
  const [filters, setFilters] = useState({
    query: "",
    province: "all",
    category: "all",
    city: "all",
    verified: "all",
    sort: "relevance"
  });

  // Current results page; any filter change starts again from page 1
  const filterSig = [filters.query, filters.province, filters.category, filters.city, filters.verified].join("|");
  const [pageState, setPageState] = useState({ sig: filterSig, page: 1 });
  const page = pageState.sig === filterSig ? pageState.page : 1;
  const setPage = (n: number) => setPageState({ sig: filterSig, page: n });

  // Parse URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setFilters(prev => ({
      ...prev,
      query: urlParams.get('q') || '',
      province: urlParams.get('province') || 'all',
      category: urlParams.get('category') || 'all',
      city: urlParams.get('city') || 'all'
    }));
  }, [location]);

  const { data: businesses, isLoading: businessesLoading, error: businessesError, refetch: retryBusinesses } = useQuery<{
    businesses: Business[];
    total: number;
  }>({
    queryKey: page > 1 ? ["/api/businesses", filters, { page }] : ["/api/businesses", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.query) params.set('query', filters.query);
      if (filters.province && filters.province !== 'all') params.set('provinceId', filters.province);
      if (filters.category && filters.category !== 'all') params.set('categoryId', filters.category);
      if (filters.city && filters.city !== 'all') params.set('localityId', filters.city);
      if (filters.verified && filters.verified !== 'all') params.set('isVerified', filters.verified);
      if (page > 1) params.set('offset', String((page - 1) * PAGE_SIZE));
      
      console.log('Search API call:', `/api/businesses?${params.toString()}`);
      const response = await fetch(`/api/businesses?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch businesses');
      const result = await response.json();
      console.log('Search results:', result);
      return result;
    },
    enabled: true
  });

  const { data: provinces } = useQuery<Province[]>({
    queryKey: ["/api/provinces"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: localities } = useQuery<any[]>({
    queryKey: ["/api/localities"],
  });

  const handleSearch = () => {
    // Update URL with search params (same names the URL parser reads) and refresh the query
    const urlKeys: Record<string, string> = { query: "q" };
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') params.set(urlKeys[key] || key, value);
    });
    setLocation(`/search-results?${params.toString()}`);
  };

  const clearFilters = () => setFilters({query: "", province: "all", category: "all", city: "all", verified: "all", sort: "relevance"});

  const filteredCities = localities?.filter(locality => 
    filters.province === "all" || locality.provinceId === parseInt(filters.province)
  );

  const provinceName = provinces?.find(e => String(e.id) === filters.province)?.name;
  const categoryName = categories?.find(c => String(c.id) === filters.category)?.name;
  const cityName = localities?.find(l => String(l.id) === filters.city)?.name;
  const placeName = cityName ? [cityName, provinceName].filter(Boolean).join(", ") : provinceName;
  const pageTitle = categoryName
    ? `${categoryName}${placeName ? ` in ${placeName}` : ` ${country.inName}`}`
    : filters.query
      ? `Results for “${filters.query}”`
      : placeName ? `Businesses in ${placeName}` : "Search results";
  const sortLabels: Record<string, string> = { relevance: "relevance", rating: "highest rated", name: "name A–Z", newest: "newest first" };
  const total = businesses?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageNumbers = Array.from(new Set([1, page - 1, page, page + 1, totalPages].filter(n => n >= 1 && n <= totalPages))).sort((a, b) => a - b);
  const goToPage = (n: number) => {
    setPage(n);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeFilters = [
    filters.query && { key: "query", label: `“${filters.query}”`, clear: () => setFilters({ ...filters, query: "" }) },
    filters.verified === "true" && { key: "verified", label: "Verified only", clear: () => setFilters({ ...filters, verified: "all" }) },
    provinceName && { key: "province", label: provinceName, clear: () => setFilters({ ...filters, province: "all", city: "all" }) },
    categoryName && { key: "category", label: categoryName, clear: () => setFilters({ ...filters, category: "all" }) },
    cityName && { key: "city", label: cityName, clear: () => setFilters({ ...filters, city: "all" }) },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  const selectClass = "min-h-[44px] w-full rounded-xl border border-[#E3E6EC] bg-white px-3 text-sm text-[#0A0A0A] focus:border-[#0B6B2E] focus:outline-none focus:ring-2 focus:ring-[#BFE3CD]";
  const optClass = "flex min-h-[36px] cursor-pointer items-center gap-2.5 text-sm text-[#3A4354]";

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <Header />
      
      <main className="yp-wrap-wide pb-20 pt-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-sm text-[#5B6475]">
          <a href="/" className="text-[#0B6B2E] hover:text-[#05501F]">Home</a>
          <span aria-hidden="true">/</span>
          <a href="/businesses" className="text-[#0B6B2E] hover:text-[#05501F]">Businesses</a>
          <span aria-hidden="true">/</span>
          <span>{pageTitle}</span>
        </nav>

        <div className="mb-7 mt-4 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[clamp(30px,3.6vw,44px)] font-bold leading-[1.1] tracking-[-0.04em] text-[#0A0A0A] break-words">{pageTitle}</h1>
            <p className="mt-2 text-[15px] text-[#5B6475]">
              {businessesLoading ? "Searching…" : `${total.toLocaleString()} ${total === 1 ? "business" : "businesses"} · sorted by ${sortLabels[filters.sort] || "relevance"}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-[#3A4354]">
              Sort by
              <select
                value={filters.sort}
                onChange={(e) => setFilters({...filters, sort: e.target.value})}
                className="min-h-[44px] rounded-xl border border-[#E3E6EC] bg-white px-3 text-sm text-[#0A0A0A]"
              >
                <option value="relevance">Relevance</option>
                <option value="rating">Highest Rated</option>
                <option value="name">Name A-Z</option>
                <option value="newest">Newest First</option>
              </select>
            </label>
            <BusinessViewToggle value={viewMode} onChange={setViewMode} />
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Filters */}
          <aside aria-label="Filters" className="yp-card flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-[#0A0A0A]">Filters</span>
              <button type="button" onClick={clearFilters} className="text-sm font-medium text-[#0B6B2E] hover:text-[#05501F]">Clear all</button>
            </div>

            <form
              role="search"
              onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
              className="flex flex-col gap-2"
            >
              <label htmlFor="search-results-query" className="yp-label">Keyword</label>
              <div className="flex gap-2">
                <input
                  id="search-results-query"
                  placeholder="Search businesses..."
                  value={filters.query}
                  onChange={(e) => setFilters({...filters, query: e.target.value})}
                  className="min-h-[44px] w-full min-w-0 rounded-xl border border-[#DDE1E8] bg-[#F7F8FA] px-3 text-[15px] text-[#0A0A0A] focus:border-[#0B6B2E] focus:outline-none focus:ring-2 focus:ring-[#BFE3CD]"
                />
                <button type="submit" className="yp-btn yp-btn-primary px-3" aria-label="Search">
                  <Search className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </form>

            <fieldset className="flex flex-col gap-0.5">
              <legend className="yp-label mb-2">Trust</legend>
              <label className={optClass}>
                <input
                  type="checkbox"
                  className="h-[18px] w-[18px] accent-[#0B6B2E]"
                  checked={filters.verified === "true"}
                  onChange={(e) => setFilters({...filters, verified: e.target.checked ? "true" : "all"})}
                />
                Verified businesses only
              </label>
            </fieldset>

            <fieldset className="flex flex-col gap-0.5">
              <legend className="yp-label mb-2">{country.regionTerm.singular}</legend>
              <label className={optClass}>
                <input type="radio" name="sr-province" className="h-[18px] w-[18px] accent-[#0B6B2E]" checked={filters.province === "all"} onChange={() => setFilters({...filters, province: "all", city: "all"})} />
                {localize("All Provinces")}
              </label>
              {provinces?.map((province) => (
                <label key={province.id} className={optClass}>
                  <input type="radio" name="sr-province" className="h-[18px] w-[18px] accent-[#0B6B2E]" checked={filters.province === province.id.toString()} onChange={() => setFilters({...filters, province: province.id.toString(), city: "all"})} />
                  {province.name}
                </label>
              ))}
            </fieldset>

            <fieldset className="flex flex-col gap-2">
              <legend className="yp-label mb-2">Category</legend>
              <select aria-label="Category" className={selectClass} value={filters.category} onChange={(e) => setFilters({...filters, category: e.target.value})}>
                <option value="all">All Categories</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id.toString()}>{category.name}</option>
                ))}
              </select>
            </fieldset>

            <fieldset className="flex flex-col gap-2">
              <legend className="yp-label mb-2">Locality</legend>
              <select aria-label="City" className={selectClass} value={filters.city} onChange={(e) => setFilters({...filters, city: e.target.value})}>
                <option value="all">All Cities</option>
                {filteredCities?.map((city) => (
                  <option key={city.id} value={city.id.toString()}>{city.name}</option>
                ))}
              </select>
            </fieldset>

            <div className="flex flex-col gap-1 border-t border-[#EEF0F4] pt-5">
              <span className="yp-label mb-1">Browse</span>
              <a href="/categories" onClick={(e) => { e.preventDefault(); setLocation("/categories"); }} className="py-1 text-sm font-medium text-[#0B6B2E] hover:text-[#05501F]">Browse Categories</a>
              <a href={country.regionsPath} onClick={(e) => { e.preventDefault(); setLocation(country.regionsPath); }} className="py-1 text-sm font-medium text-[#0B6B2E] hover:text-[#05501F]">{localize("Browse Provinces")}</a>
              <a href="/dashboard" onClick={(e) => { e.preventDefault(); setLocation("/dashboard"); }} className="py-1 text-sm font-medium text-[#0B6B2E] hover:text-[#05501F]">Add Your Business</a>
            </div>
          </aside>

          {/* Results */}
          <section aria-label="Results" className="flex min-w-0 flex-col gap-3.5">
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {activeFilters.map((f) => (
                  <button key={f.key} type="button" onClick={f.clear} className="yp-tag yp-tag-green gap-1.5 hover:bg-[#D6EDDF]" aria-label={`Remove filter ${f.label}`}>
                    {f.label}<X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                ))}
              </div>
            )}

            {businessesLoading ? (
              <BusinessListing loading layout={viewMode} />
            ) : businessesError ? (
              <div role="alert" className="yp-card p-8 text-center">
                <h2 className="mb-2 text-lg font-semibold text-[#0A0A0A]">Unable to load businesses</h2>
                <p className="mb-4 text-[#5B6475]">Please try again in a moment.</p>
                <Button onClick={() => retryBusinesses()}>Try again</Button>
              </div>
            ) : !businessesLoading && businesses?.businesses?.length ? (
              <>
                <p className="text-sm text-[#5B6475]">
                  Showing {businesses.businesses.length} of {businesses.total} results
                </p>
                <BusinessListing businesses={businesses.businesses} layout={viewMode} />

                {totalPages > 1 && (
                  <nav aria-label="Pagination" className="mt-4 flex flex-wrap justify-center gap-1.5">
                    <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => goToPage(page - 1)}
                      className="inline-grid h-11 min-w-[44px] place-items-center rounded-xl border border-[#E3E6EC] bg-white text-[#0A0A0A] disabled:opacity-40">
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    </button>
                    {pageNumbers.map((n, idx) => (
                      <span key={n} className="contents">
                        {idx > 0 && n - pageNumbers[idx - 1] > 1 && <span className="inline-grid h-11 min-w-[28px] place-items-center text-[#5B6475]" aria-hidden="true">…</span>}
                        <button type="button" onClick={() => goToPage(n)} aria-current={n === page ? "page" : undefined}
                          className={`inline-grid h-11 min-w-[44px] place-items-center rounded-xl border px-2 text-sm font-medium ${n === page ? "border-[#0B6B2E] bg-[#0B6B2E] text-white" : "border-[#E3E6EC] bg-white text-[#0A0A0A] hover:border-[#C9CED8]"}`}>
                          {n}
                        </button>
                      </span>
                    ))}
                    <button type="button" aria-label="Next page" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}
                      className="inline-grid h-11 min-w-[44px] place-items-center rounded-xl border border-[#E3E6EC] bg-white text-[#0A0A0A] disabled:opacity-40">
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </nav>
                )}
              </>
            ) : (
              <div className="yp-card p-12 text-center">
                <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-[14px] bg-[#E8F4EC] text-[#0B6B2E]">
                  <Search className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mb-2 text-lg font-semibold text-[#0A0A0A]">
                  No results found
                </h3>
                <p className="text-[#5B6475]">
                  Try adjusting your search criteria or browse our categories
                </p>
                {activeFilters.length > 0 && <button type="button" onClick={clearFilters} className="yp-btn yp-btn-ghost mt-5">Clear filters</button>}
              </div>
            )}
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
