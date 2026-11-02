import { RankedLinks } from "@/components/phase1/ranked-links";
import { QuoteRequestCard } from "@/components/phase1/quote-request";
import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { PageSEO } from "@/components/page-seo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Search, ChevronRight, ArrowLeft, Filter, Grid, List } from "lucide-react";
import { getCategoryIcon } from "@/lib/category-icons-clean";
import { breadcrumbLd } from "@/lib/structured-data";
import BusinessListing from "@/components/business-listing";
import { country } from "@shared/country";
import { t as tx } from "@shared/i18n";
import { tj } from "@/i18n-jsx/tj";

const TILE_TINTS = [
  "bg-[#E8F4EC] text-[#0B6B2E]",
  "bg-[#FFF4E0] text-[#B45309]",
  "bg-[#E6F6F1] text-[#047857]",
  "bg-[#FDECEC] text-[#B91C1C]",
  "bg-[#F1F2F6] text-[#334155]",
];
function tileTint(name: string = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TILE_TINTS[h % TILE_TINTS.length];
}

export default function CategoryDetail() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<string>("all");
  const [selectedLocality, setSelectedLocality] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Extract category slug from URL - handles both /categories/:slug and /categories/:cat/:subcat/:subsubcat patterns
  const getCategorySlug = (): string | null => {
    const path = location;
    if (!path.startsWith('/categories/')) return null;
    const pathParts = path.replace('/categories/', '').split('/').filter(Boolean);
    // Return the last segment as the category slug (most specific category)
    return pathParts.length > 0 ? pathParts[pathParts.length - 1] : null;
  };

  const categorySlug = getCategorySlug();

  // Get current category
  const { data: category, isLoading: categoryLoading, error: categoryError } = useQuery({
    queryKey: ['/api/categories', categorySlug],
    queryFn: async () => {
      const response = await fetch(`/api/categories/${categorySlug}`);
      if (!response.ok) {
        throw new Error('Category not found');
      }
      return response.json();
    },
    enabled: !!categorySlug
  });

  // Get subcategories with stats
  const { data: subcategories = [], isLoading: subcategoriesLoading } = useQuery({
    queryKey: ['/api/categories/with-stats', { parentId: category?.id }],
    queryFn: async () => {
      const response = await fetch(`/api/categories/with-stats?parentId=${category.id}`);
      return response.json();
    },
    enabled: !!category?.id
  });

  // Main (top-level) categories don't hold businesses: their page lists the sub-categories instead.
  const isMainCategory = !!category && (category.level === 1 || category.parentId === null || category.parentId === undefined);
  const { data: allCategories = [] } = useQuery<any[]>({
    queryKey: ['/api/categories'],
    enabled: isMainCategory,
  });

  // Get businesses in this category
  const { data: businessData, isLoading: businessesLoading, error: businessesError, refetch: retryBusinesses } = useQuery({
    queryKey: ['/api/businesses', {
      categoryId: category?.id,
      query: searchQuery,
      provinceId: selectedProvince !== 'all' ? parseInt(selectedProvince) : undefined,
      localityId: selectedLocality !== 'all' ? parseInt(selectedLocality) : undefined,
    }],
    enabled: !!category?.id && !isMainCategory
  });

  // Get provinces and localities for filters
  const { data: provinces = [] } = useQuery({
    queryKey: ['/api/provinces'],
  });

  const { data: localities = [] } = useQuery({
    queryKey: ['/api/localities'],
  });

  const businesses = (businessData as any)?.businesses || [];
  const subTotal = (subcategories as any[]).reduce((n: number, c: any) => n + (Number(c.businessCount) || 0), 0);
  const totalBusinesses = isMainCategory ? subTotal : (businessData as any)?.total || 0;
  // Main category: each sub-category with its own specialised categories
  const groups = isMainCategory
    ? (subcategories as any[]).map((sub: any) => ({
        ...sub,
        children: (allCategories as any[]).filter((c: any) => c.parentId === sub.id).sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || String(a.name).localeCompare(String(b.name))),
      }))
    : [];

  if (categoryLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] text-[#0A0A0A]">
        <Header />
        <div className="yp-wrap-wide pt-8 pb-20">
          <div className="animate-pulse">
            <div className="h-5 bg-[#EEF0F4] rounded w-1/4 mb-4"></div>
            <div className="h-12 bg-[#EEF0F4] rounded w-1/2 mb-8"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (categoryError) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] text-[#0A0A0A]">
        <Header />
        <div className="yp-wrap pt-16 pb-24">
          <div className="yp-card mx-auto max-w-xl p-10 text-center">
            <h1 className="text-2xl font-bold tracking-[-0.03em] text-[#0A0A0A] mb-4">Category Not Found</h1>
            <p className="text-[#4B5565] mb-4">The category you're looking for doesn't exist or has been moved.</p>
            <p className="text-sm text-[#5B6475]">{tj("Slug: {0}", categorySlug)}</p>
            <p className="text-sm text-[#5B6475]">{tj("Error: {0}", (categoryError as Error)?.message)}</p>
            <Button onClick={() => setLocation('/categories')} className="mt-4">
              Browse All Categories
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] text-[#0A0A0A]">
        <Header />
        <div className="yp-wrap pt-16 pb-24">
          <div className="yp-card mx-auto max-w-xl p-10 text-center">
            <h1 className="text-2xl font-bold tracking-[-0.03em] text-[#0A0A0A] mb-4">Loading Category...</h1>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (categoryLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] text-[#0A0A0A]">
        <Header />
        <div className="yp-wrap-wide pt-8 pb-20">
          <div className="animate-pulse">
            <div className="h-5 bg-[#EEF0F4] rounded w-1/4 mb-4"></div>
            <div className="h-12 bg-[#EEF0F4] rounded w-1/2 mb-8"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] text-[#0A0A0A]">
        <Header />
        <div className="yp-wrap pt-16 pb-24">
          <div className="yp-card mx-auto max-w-xl p-10 text-center py-12">
            <h1 className="text-2xl font-bold tracking-[-0.03em] text-[#0A0A0A] mb-4">Category Not Found</h1>
            <p className="text-[#4B5565] mb-6">The category you're looking for doesn't exist.</p>
            <Button onClick={() => setLocation('/categories')}>
              Browse All Categories
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#0A0A0A]">
      {/* Page SEO using actual category data */}
      <PageSEO 
        title={(category.metaTitle && category.metaTitle.length <= 65) ? category.metaTitle : tx("{0} in Pakistan – Companies & Services | PakistanYP", category.name)}
        description={category.metaDescription || tx("Find the best {0} businesses across all provinces and territories in Pakistan. Browse verified listings with reviews and contact information.", category.name.toLowerCase())}
        keywords={category.keywords || tx("{0}, Pakistan, business directory, {1}", category.name, (provinces as any[]).map((e: any) => e.name).join(', '))}
        canonicalUrl={tx("https://pakistanyp.com/categories/{0}", category.slug)}
        ogTitle={category.metaTitle || tx("{0} in Pakistan | Business Directory", category.name)}
        ogDescription={category.metaDescription || tx("Discover {0} businesses in Pakistan with verified reviews and contact details.", category.name.toLowerCase())}
        noindex={!isMainCategory && category.level !== 2 && !businessesLoading && !!businessData && totalBusinesses === 0 && (subcategories as any[]).every((c: any) => !Number(c.businessCount))}
        schemaMarkup={[
          category.schemaMarkup,
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Categories", path: "/categories" },
            { name: category.name, path: `/categories/${category.slug}` },
          ]),
        ]}
      />
      <Header />
      
      <main className="yp-wrap-wide pt-8 pb-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-sm text-[#5B6475]">
          <Link href="/" className="text-[#0B6B2E] hover:text-[#05501F]">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/categories" className="text-[#0B6B2E] hover:text-[#05501F]">Categories</Link>
          <span aria-hidden="true">/</span>
          <span>{category.name}</span>
        </nav>

        {/* Category Header */}
        <div className="mt-4 mb-7 flex flex-wrap items-end justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            {(() => {
              const IconComponent = getCategoryIcon(category.name);
              return (
                <span className={`mt-1 grid h-12 w-12 flex-none place-items-center rounded-[14px] ${tileTint(category.name)}`}>
                  <IconComponent className="h-6 w-6" strokeWidth={1.8} />
                </span>
              );
            })()}
            <div className="min-w-0">
              <h1 className="text-[clamp(30px,3.6vw,44px)] font-bold leading-[1.1] tracking-[-0.04em]">{category.name}</h1>
              <p className="mt-2 text-[15px] text-[#5B6475]">{isMainCategory ? tx("{0} sub-categories · {1} {2}", subcategories.length, totalBusinesses, totalBusinesses === 1 ? 'business' : 'businesses') : tx("{0} {1} found", totalBusinesses, totalBusinesses === 1 ? 'business' : 'businesses')}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="min-h-[44px]"
            onClick={() => setLocation('/categories')}
          >
            <ArrowLeft className="h-4 w-4 me-2" />
            Back to Categories
          </Button>
        </div>
        {category.description && (
          <p className="-mt-3 mb-8 max-w-4xl text-[17px] leading-relaxed text-[#4B5565]">{category.description}</p>
        )}

        {/* Main category: directory of sub-categories (businesses are listed under sub-categories) */}
        {isMainCategory && (
          <section aria-labelledby="subcategories-heading">
            <div className="mb-5">
              <h2 id="subcategories-heading" className="text-[22px] font-semibold tracking-[-0.02em]">{tj("Sub-categories in {0}", category.name)}</h2>
              <p className="mt-1 text-sm text-[#5B6475]">Choose a sub-category to see its businesses.</p>
            </div>
            {subcategoriesLoading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-hidden="true">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-[16px] bg-[#EEF0F4]" />)}</div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {groups.map((group: any) => (
                  <section key={group.id} className="yp-card flex flex-col gap-3 p-5" aria-labelledby={`sub-${group.id}`}>
                    <Link href={`/categories/${group.slug}`} className="flex items-start justify-between gap-3 text-[#0A0A0A] hover:text-[#0B6B2E]">
                      <h3 id={`sub-${group.id}`} className="text-[17px] font-semibold leading-snug">{group.name}</h3>
                      <span className="flex-none rounded-full bg-[#E8F4EC] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[#05501F]">{Number(group.businessCount) || 0}</span>
                    </Link>
                    {group.children.length > 0 && (
                      <ul className="flex flex-wrap gap-1.5">
                        {group.children.map((child: any) => (
                          <li key={child.id}>
                            <Link href={`/categories/${child.slug}`} className="inline-flex items-center gap-1.5 rounded-full border border-[#E7E9EE] bg-white px-2.5 py-1 text-[13px] text-[#3A4354] hover:border-[#9FD3B3] hover:text-[#0B6B2E]">
                              {child.name}{Number(child.businessCount) > 0 && <span className="font-semibold tabular-nums text-[#05501F]">{child.businessCount}</span>}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Link href={`/categories/${group.slug}`} className="mt-auto text-sm font-semibold text-[#0B6B2E] hover:text-[#05501F]">{tj("View {0} →", group.name)}</Link>
                  </section>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Subcategories Section */}
        {!isMainCategory && subcategories.length > 0 && (
          <section className="mb-10" aria-labelledby="subcategories-heading">
            <div className="mb-4">
              <div className="yp-label">Refine</div>
              <h2 id="subcategories-heading" className="mt-1.5 text-[22px] font-semibold tracking-[-0.02em]">{tj("Subcategories in {0}", category.name)}</h2>
              <p className="mt-1 text-sm text-[#5B6475]">{tj("Explore more specific categories within {0}", category.name)}</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {subcategories.map((subcategory: any) => (
                <Link 
                  key={subcategory.id}
                  href={subcategory.slug ? `/categories/${subcategory.slug}` : `/search?category=${subcategory.id}`}
                  className="yp-card yp-card-link flex items-center justify-between gap-3 rounded-[16px] p-4 text-[#0A0A0A]"
                >
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold">{subcategory.name}</span>
                    <span className="mt-0.5 block text-[13px] text-[#5B6475]">
                      {subcategory.businessCount || 0} {Number(subcategory.businessCount) === 1 ? 'business' : 'businesses'}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 flex-none text-[#0B6B2E]" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {!isMainCategory && <div className="flex flex-wrap items-start gap-6">
          {/* Filters */}
          <aside className="yp-card flex w-full flex-col gap-5 p-6 lg:w-[300px] lg:flex-none" aria-label="Filters">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold">Filters</span>
              {(searchQuery || selectedProvince !== 'all' || selectedLocality !== 'all') && (
                <button
                  type="button"
                  className="text-sm font-medium text-[#0B6B2E] hover:text-[#05501F]"
                  onClick={() => { setSearchQuery(''); setSelectedProvince('all'); setSelectedLocality('all'); }}
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <span className="yp-label">Keyword</span>
              <div className="relative">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6475]" />
                <Input
                  placeholder={tx("Search in {0}...", category.name)}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-10"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="yp-label">{country.regionTerm.singular}</span>
              <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={tx("All {0}", country.regionTerm.plural)} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tx("All {0}", country.regionTerm.plural)}</SelectItem>
                  {(provinces as any[]).map((province: any) => (
                    <SelectItem key={province.id} value={province.id.toString()}>
                      {province.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <span className="yp-label">Locality</span>
              <Select value={selectedLocality} onValueChange={setSelectedLocality}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Areas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  {(localities as any[]).map((locality: any) => (
                    <SelectItem key={locality.id} value={locality.id.toString()}>
                      {locality.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <span className="yp-label">Layout</span>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  className="min-h-[44px] flex-1"
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                  aria-pressed={viewMode === "grid"}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  className="min-h-[44px] flex-1"
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                  aria-pressed={viewMode === "list"}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </aside>

          {/* Businesses Section */}
          <section className="flex min-w-0 flex-[999_1_560px] flex-col gap-4" aria-label="Results">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[22px] font-semibold tracking-[-0.02em]">{tj("Businesses in {0}", category.name)}</h2>
              <span className="yp-tag">{tj("{0} results", totalBusinesses)}</span>
            </div>

            {businessesLoading ? (
              <BusinessListing loading layout={viewMode} />
            ) : businessesError ? (
              <div role="alert" className="yp-card p-8 text-center">
                <h3 className="mb-2 text-lg font-semibold">Unable to load businesses</h3>
                <p className="mb-4 text-[#4B5565]">Please try again in a moment.</p>
                <Button onClick={() => retryBusinesses()}>Try again</Button>
              </div>
            ) : businesses.length > 0 ? (
              <BusinessListing businesses={businesses} layout={viewMode} category={category} />
            ) : (
              <div className="yp-card px-6 py-12 text-center">
                <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-[14px] bg-[#F1F2F6] text-[#334155]">
                  <Building2 className="h-6 w-6" />
                </span>
                <h3 className="mb-2 text-lg font-semibold">{tj("No businesses found in {0}", category.name)}</h3>
                <p className="mb-6 text-[#4B5565]">
                  Be the first to add your business to this category.
                </p>
                <Button className="bg-[#E3A82B] text-[#141414] hover:bg-[#D19719]" onClick={() => setLocation('/pricing')}>
                  Add Your Business
                </Button>
              </div>
            )}
          </section>
        </div>}
      </main>

      <div className="yp-wrap-wide pb-20">
        <RankedLinks categorySlug={category.slug} categoryName={category.name} />
        <QuoteRequestCard categoryId={category.id} categoryName={category.name} />
      </div>

      <Footer />
    </div>
  );
}
