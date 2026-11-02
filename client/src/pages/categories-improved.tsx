import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, ChevronRight, Building2, MapPin, ChevronDown, ChevronUp, Eye, TrendingUp, List } from "lucide-react";
import { getCategoryIcon } from "@/lib/category-icons-clean";
import { useLocation, Link } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";
import SEO from "@/components/seo";
import { Category } from "@shared/schema";
import { country, localize } from "@shared/country";
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

export default function CategoriesImproved() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"expanded" | "compact">("expanded");
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  const { data: categories, isLoading: categoriesLoading } = useQuery<(Category & { businessCount?: number; subcategoryCount?: number })[]>({
    queryKey: ["/api/categories/with-stats"],
  });

  // Organize categories hierarchically
  const categoryHierarchy = useMemo(() => {
    if (!categories) return [];
    
    const mainCategories = categories.filter(cat => cat.level === 1);
    
    return mainCategories.map(mainCat => ({
      ...mainCat,
      subcategories: categories.filter(cat => cat.parentId === mainCat.id && cat.level === 2),
      detailedCategories: categories.filter(cat => cat.level === 3 && 
        categories.some(subCat => subCat.id === cat.parentId && subCat.parentId === mainCat.id)
      )
    }));
  }, [categories]);

  const filteredCategories = categoryHierarchy.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.subcategories.some(sub => 
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const toggleCategoryExpansion = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const totalBusinesses = categories?.reduce((sum, cat) => sum + (cat.businessCount || 0), 0) || 0;
  const totalCategories = categories?.length || 0;

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#0A0A0A]">
      <SEO 
        title="Business Categories in Pakistan | Complete Directory | PakistanYP"
        description="Browse comprehensive business categories across Pakistan. Find companies in Business Services, Finance, Construction, Automotive, Food, Health, Technology, Retail and more across all Pakistani provinces."
        keywords="Pakistani business categories, Karachi companies, Lahore businesses, business directory Pakistan, company categories provinces"
        canonical="https://pakistanyp.com/categories"
      />
      <Header />
      
      <main className="yp-wrap-wide pt-8 pb-20">
        {/* Page header */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-sm text-[#5B6475]">
          <Link href="/" className="text-[#0B6B2E] hover:text-[#05501F]">Home</Link>
          <span aria-hidden="true">/</span>
          <span>Categories</span>
        </nav>
        <div className="mt-4 mb-7 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <div className="yp-label">Browse</div>
            <h1 className="mt-2 text-[clamp(30px,3.6vw,44px)] font-bold leading-[1.1] tracking-[-0.04em]">
              {localize("Pakistani Business Categories")}
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-[#5B6475]">
              {(
                <>{tj("Discover businesses across {0} organized by comprehensive categories. Explore {1} categories covering all business sectors.", country.name, totalCategories)}</>
              )}
            </p>
          </div>
          <dl className="flex flex-wrap gap-3">
            {[
              { value: totalCategories, label: "Total Categories" },
              { value: categoryHierarchy.length, label: "Main Categories" },
              { value: totalBusinesses.toLocaleString(), label: "Listed Businesses" },
            ].map((stat) => (
              <div key={stat.label} className="yp-card min-w-[130px] px-5 py-4">
                <dt className="text-[13px] text-[#5B6475]">{stat.label}</dt>
                <dd className="mt-1 text-2xl font-bold tracking-[-0.03em]">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
          
        <div className="yp-card mb-6 flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute start-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5B6475]" />
            <Input
              placeholder="Search categories and subcategories..."
              className="h-12 ps-11"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant={viewMode === "expanded" ? "default" : "outline"}
              onClick={() => setViewMode("expanded")}
              className="min-h-[44px] px-5"
            >
              <Eye className="h-4 w-4 me-2" />
              Expanded View
            </Button>
            <Button
              variant={viewMode === "compact" ? "default" : "outline"}
              onClick={() => setViewMode("compact")}
              className="min-h-[44px] px-5"
            >
              <List className="h-4 w-4 me-2" />
              Compact View
            </Button>
          </div>
        </div>

        {/* Main Categories with Hierarchical Structure */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="min-w-0 lg:col-span-3">
            {categoriesLoading ? (
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="yp-card animate-pulse p-6">
                    <div className="mb-4 h-6 w-1/2 rounded bg-[#EEF0F4]"></div>
                    <div className="mb-2 h-4 w-3/4 rounded bg-[#EEF0F4]"></div>
                    <div className="h-4 w-full rounded bg-[#EEF0F4]"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCategories.map((category) => (
                  <div key={category.id} className="yp-card overflow-hidden">
                    <Collapsible 
                      open={viewMode === "expanded" || expandedCategories.has(category.id)}
                      onOpenChange={() => toggleCategoryExpansion(category.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <div className="cursor-pointer p-5 transition-colors hover:bg-[#FBFBFC] sm:p-6">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex min-w-0 items-center gap-4">
                              {(() => {
                                const IconComponent = getCategoryIcon(category.name);
                                return (
                                  <span className={`grid h-12 w-12 flex-none place-items-center rounded-[14px] ${tileTint(category.name)}`}>
                                    <IconComponent className="h-6 w-6" strokeWidth={1.8} />
                                  </span>
                                );
                              })()}
                              <div className="min-w-0">
                                <h2 className="text-[19px] font-semibold tracking-[-0.01em] text-[#0A0A0A]">
                                  {category.name}
                                </h2>
                                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                  <span className="yp-tag yp-tag-green">{tj("{0} businesses", category.businessCount || 0)}</span>
                                  <span className="yp-tag">{tj("{0} subcategories", category.subcategories.length)}</span>
                                  {category.metaTitle && (
                                    <span className="yp-tag">SEO Optimized</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="min-h-[40px]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (category.slug) {
                                    setLocation(`/categories/${category.slug}`);
                                  } else {
                                    setLocation(`/search?category=${category.id}`);
                                  }
                                }}
                              >
                                Browse All
                              </Button>
                              {expandedCategories.has(category.id) ? 
                                <ChevronUp className="h-5 w-5 text-[#5B6475]" /> :
                                <ChevronDown className="h-5 w-5 text-[#5B6475]" />
                              }
                            </div>
                          </div>
                          {category.description && (
                            <p className="mt-3 text-[15px] leading-relaxed text-[#4B5565]">
                              {category.description}
                            </p>
                          )}
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="px-5 pb-6 sm:px-6">
                          {category.subcategories.length > 0 ? (
                            <div className="border-t border-[#EEF0F4] pt-5">
                              <h3 className="yp-label mb-3">{tj("Subcategories ({0})", category.subcategories.length)}</h3>
                              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {category.subcategories.map((subcategory) => (
                                  <div 
                                    key={subcategory.id}
                                    className="yp-card yp-card-link cursor-pointer rounded-[14px] p-4"
                                    onClick={() => {
                                      if (subcategory.slug) {
                                        setLocation(`/categories/${subcategory.slug}`);
                                      } else {
                                        setLocation(`/search?category=${subcategory.id}`);
                                      }
                                    }}
                                  >
                                    <div className="mb-1 flex items-center justify-between gap-2">
                                      <h4 className="text-sm font-semibold text-[#0A0A0A]">
                                        {subcategory.name}
                                      </h4>
                                      <ChevronRight className="h-4 w-4 flex-none text-[#0B6B2E]" />
                                    </div>
                                    <div className="flex items-center gap-2 text-[13px] text-[#5B6475]">
                                      <span>{tj("{0} businesses", subcategory.businessCount || 0)}</span>
                                      {subcategory.metaTitle && (
                                        <TrendingUp className="h-3 w-3 text-[#0B6B2E]" />
                                      )}
                                    </div>
                                    {subcategory.description && (
                                      <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[#5B6475]">
                                        {subcategory.description.substring(0, 80)}...
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="border-t border-[#EEF0F4] pt-6 text-center text-[#5B6475]">
                              <Building2 className="mx-auto mb-2 h-8 w-8 opacity-50" />
                              <p>No subcategories available yet</p>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4 lg:col-span-1">
            <div className="yp-card p-6">
              <h2 className="text-base font-semibold">Category Overview</h2>
              <div className="yp-tint mt-4 rounded-[14px] p-4 text-center">
                <div className="text-2xl font-bold tracking-[-0.03em] text-[#0B6B2E]">
                  {categoryHierarchy.length}
                </div>
                <div className="text-sm text-[#3A4354]">Main Categories</div>
              </div>
              
              <div className="mt-5">
                <h3 className="yp-label mb-2">Top Categories</h3>
                <div className="space-y-1">
                  {categoryHierarchy.slice(0, 6).map((category) => (
                    <div 
                      key={category.id}
                      className="flex min-h-[44px] cursor-pointer items-center justify-between gap-2 rounded-xl px-2 hover:bg-[#F1F2F6]"
                      onClick={() => {
                        if (category.slug) {
                          setLocation(`/categories/${category.slug}`);
                        } else {
                          setLocation(`/search?category=${category.id}`);
                        }
                      }}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        {(() => {
                          const IconComponent = getCategoryIcon(category.name);
                          return (
                            <span className={`grid h-8 w-8 flex-none place-items-center rounded-[10px] ${tileTint(category.name)}`}>
                              <IconComponent className="h-4 w-4" />
                            </span>
                          );
                        })()}
                        <span className="truncate text-sm font-medium text-[#283141]">{category.name}</span>
                      </div>
                      <span className="text-[13px] text-[#5B6475]">
                        {category.businessCount || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="yp-card p-6">
              <h2 className="mb-4 text-base font-semibold">Quick Actions</h2>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="min-h-[44px] w-full justify-start"
                  onClick={() => setLocation(country.regionsPath)}
                >
                  <MapPin className="h-4 w-4 me-2" />
                  {tx("Browse by {0}", country.regionTerm.plural)}
                </Button>
                <Button 
                  variant="outline" 
                  className="min-h-[44px] w-full justify-start"
                  onClick={() => setLocation("/search")}
                >
                  <Search className="h-4 w-4 me-2" />
                  Advanced Search
                </Button>
                <Button 
                  className="min-h-[44px] w-full justify-start bg-[#E3A82B] text-[#141414] hover:bg-[#D19719]"
                  onClick={() => setLocation("/add-business-enhanced")}
                >
                  <Building2 className="h-4 w-4 me-2" />
                  Add Your Business
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
