import { useState, useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { DynamicSEO } from "@/components/dynamic-seo";
import { SEOContentDisplay } from "@/components/seo-content";
import Breadcrumb from "@/components/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Search, MapPin, Phone, Globe, Star, ChevronRight, ArrowLeft, Filter, Grid, List, Layers, TrendingUp } from "lucide-react";
import { getCategoryIcon, getCategoryIconColor } from "@/lib/category-icons-clean";
import BusinessCard from "@/components/business-card";
import { country, localize } from "@shared/country";

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  level: number;
  parentId?: number;
  businessCount: number;
  subcategories?: Category[];
}

export default function CategoryEnhancedSEO() {
  // Support hierarchical routing: /categories/:category/:subcategory?/:subsubcategory?
  const [, params] = useRoute("/categories/:category/:subcategory?/:subsubcategory?");
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<string>("all");
  const [selectedLocality, setSelectedLocality] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Determine current category level and IDs
  const categorySlug = params?.category;
  const subcategorySlug = params?.subcategory;
  const subsubcategorySlug = params?.subsubcategory;
  
  const currentLevel = subsubcategorySlug ? 3 : subcategorySlug ? 2 : 1;
  const currentSlug = subsubcategorySlug || subcategorySlug || categorySlug;

  // Get current category data
  const { data: currentCategory, isLoading: categoryLoading, error: categoryError } = useQuery({
    queryKey: ['/api/categories/by-slug', currentSlug],
    queryFn: async () => {
      const response = await fetch(`/api/categories/by-slug/${currentSlug}`);
      if (!response.ok) {
        throw new Error('Category not found');
      }
      return response.json();
    },
    enabled: !!currentSlug
  });

  // Get category hierarchy (parent categories)
  const { data: categoryHierarchy = [] } = useQuery({
    queryKey: ['/api/categories/hierarchy', currentCategory?.id],
    queryFn: async () => {
      const response = await fetch(`/api/categories/hierarchy/${currentCategory.id}`);
      return response.ok ? response.json() : [];
    },
    enabled: !!currentCategory?.id
  });

  // Get subcategories if not at deepest level
  const { data: subcategories = [], isLoading: subcategoriesLoading } = useQuery({
    queryKey: ['/api/categories/with-stats', { parentId: currentCategory?.id }],
    queryFn: async () => {
      const response = await fetch(`/api/categories/with-stats?parentId=${currentCategory.id}`);
      return response.ok ? response.json() : [];
    },
    enabled: !!currentCategory?.id && currentLevel < 3
  });

  // Get businesses in current category
  const { data: businessData, isLoading: businessesLoading } = useQuery({
    queryKey: ['/api/businesses', {
      categoryId: currentCategory?.id,
      query: searchQuery,
      provinceId: selectedProvince !== 'all' ? parseInt(selectedProvince) : undefined,
      localityId: selectedLocality !== 'all' ? parseInt(selectedLocality) : undefined,
    }],
    enabled: !!currentCategory?.id
  });

  // Get provinces and localities for filters
  const { data: provinces = [] } = useQuery({
    queryKey: ['/api/provinces'],
  });

  const { data: localities = [] } = useQuery({
    queryKey: ['/api/localities'],
  });

  // Get related categories at the same level
  const { data: relatedCategories = [] } = useQuery({
    queryKey: ['/api/categories/related', currentCategory?.id],
    queryFn: async () => {
      if (!currentCategory?.parentId) return [];
      const response = await fetch(`/api/categories/with-stats?parentId=${currentCategory.parentId}&exclude=${currentCategory.id}`);
      return response.ok ? response.json() : [];
    },
    enabled: !!currentCategory?.id && !!currentCategory?.parentId
  });

  const businesses = (businessData as any)?.businesses || [];
  const totalBusinesses = (businessData as any)?.total || 0;

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Categories", href: "/categories" }
  ];

  // Add hierarchy to breadcrumbs
  if (categoryHierarchy.length > 0) {
    categoryHierarchy.forEach((cat: Category, index: number) => {
      if (index === 0 && categorySlug) {
        breadcrumbItems.push({ label: cat.name, href: `/categories/${categorySlug}` });
      } else if (index === 1 && subcategorySlug) {
        breadcrumbItems.push({ label: cat.name, href: `/categories/${categorySlug}/${subcategorySlug}` });
      } else if (index === 2 && subsubcategorySlug) {
        breadcrumbItems.push({ label: cat.name, href: `/categories/${categorySlug}/${subcategorySlug}/${subsubcategorySlug}` });
      }
    });
  }

  if (currentCategory) {
    breadcrumbItems.push({ label: currentCategory.name });
  }

  // Generate category level indicator
  const getLevelIndicator = (level: number) => {
    switch (level) {
      case 1: return { icon: Building2, color: "text-blue-600", bg: "bg-blue-100" };
      case 2: return { icon: Layers, color: "text-green-600", bg: "bg-green-100" };
      case 3: return { icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-100" };
      default: return { icon: Building2, color: "text-gray-600", bg: "bg-gray-100" };
    }
  };

  const levelIndicator = getLevelIndicator(currentLevel);
  const LevelIcon = levelIndicator.icon;

  const handleSearch = () => {
    const newParams = new URLSearchParams();
    if (searchQuery) newParams.set('q', searchQuery);
    if (selectedProvince !== 'all') newParams.set('province', selectedProvince);
    if (selectedLocality !== 'all') newParams.set('locality', selectedLocality);
    
    let newUrl = `/categories/${categorySlug}`;
    if (subcategorySlug) newUrl += `/${subcategorySlug}`;
    if (subsubcategorySlug) newUrl += `/${subsubcategorySlug}`;
    if (newParams.toString()) newUrl += `?${newParams.toString()}`;
    
    setLocation(newUrl);
  };

  if (categoryLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F3]">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-12 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (categoryError || !currentCategory) {
    return (
      <div className="min-h-screen bg-[#FAF8F3]">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="max-w-md mx-auto">
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Category Not Found</h1>
            <p className="text-gray-600 mb-6">
              The category you're looking for doesn't exist or may have been moved.
            </p>
            <Link href="/categories">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Browse All Categories
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      {/* Dynamic SEO */}
      <DynamicSEO 
        type="category" 
        id={currentCategory.id}
        fallback={{
          title: `${currentCategory.name} in Pakistan | Business Directory | pakistanyp.com`,
          description: `Find the best ${currentCategory.name.toLowerCase()} businesses across all provinces and territories in Pakistan. Browse verified listings with reviews and contact information.`,
          keywords: `${currentCategory.name}, Pakistan, business directory, ${provinces.map((e: any) => e.name).join(', ')}`
        }}
      />
      
      <main className="relative">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-[#F2F9F4] border-b border-[#CFE8D8]">
          <div className="absolute inset-0"></div>
          <div className="absolute inset-0 opacity-20">
            <div className="w-full h-full"></div>
          </div>
          
          <div className="relative z-50">
            <Header />
          </div>
          
          <div className="relative container mx-auto px-4 pt-8 pb-14">
            <Breadcrumb 
              items={breadcrumbItems}
              className="text-[#4B5565] mb-8"
            />
            
            <div className="max-w-4xl">
              {/* Category Level Badge */}
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 ${levelIndicator.bg} ${levelIndicator.color} rounded-lg`}>
                  <LevelIcon className="w-6 h-6" />
                </div>
                <div>
                  <Badge variant="secondary" className="text-xs">
                    Level {currentLevel} Category
                  </Badge>
                  <div className="text-[#5B6475] text-sm mt-1">
                    {currentLevel === 1 && "Main Category"}
                    {currentLevel === 2 && "Sub Category"}
                    {currentLevel === 3 && "Specialized Category"}
                  </div>
                </div>
              </div>

              <h1 className="yp-h1 text-[#0A0A0A] mb-4">
                {currentCategory.name}
              </h1>
              
              {currentCategory.description && (
                <p className="text-xl text-[#3A4354] mb-6 leading-relaxed">
                  {currentCategory.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-[#4B5565]">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  <span>{totalBusinesses} Businesses</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span>{`All ${country.regions.length} ${country.regionTerm.plural}`}</span>
                </div>
                {subcategories.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    <span>{subcategories.length} Subcategories</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          {/* SEO Content Display */}
          <SEOContentDisplay
            type="category"
            id={currentCategory.id}
            fallbackContent={{
              heading: localize(`Explore ${currentCategory.name} in Pakistan`),
              description: localize(`Discover comprehensive ${currentCategory.name.toLowerCase()} options across Pakistan with our extensive business directory.`)
            }}
          />

          {/* Subcategories Grid */}
          {subcategories.length > 0 && currentLevel < 3 && (
            <div className="mt-16">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Browse {currentLevel === 1 ? 'Subcategories' : 'Specialized Categories'}
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Find exactly what you're looking for with our detailed category breakdown
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {subcategories.map((subcategory: Category) => {
                  let href = `/categories/${categorySlug}`;
                  if (currentLevel === 1) {
                    href += `/${subcategory.slug}`;
                  } else {
                    href += `/${subcategorySlug}/${subcategory.slug}`;
                  }

                  return (
                    <Link key={subcategory.id} href={href}>
                      <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer bg-white border-gray-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className={`p-2 ${getCategoryIconColor(subcategory.name)} rounded-lg`}>
                              {getCategoryIcon(subcategory.name, "w-6 h-6 text-white")}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {subcategory.businessCount || 0}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                            {subcategory.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {subcategory.description && (
                            <CardDescription className="text-sm text-gray-600 line-clamp-2 mb-3">
                              {subcategory.description}
                            </CardDescription>
                          )}
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>{subcategory.businessCount || 0} businesses</span>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search and Filters */}
          {totalBusinesses > 0 && (
            <div className="mt-16">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        placeholder={`Search ${currentCategory.name.toLowerCase()}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:w-auto">
                    <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                      <SelectTrigger>
                        <SelectValue placeholder={`All ${country.regionTerm.plural}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{`All ${country.regionTerm.plural}`}</SelectItem>
                        {provinces.map((province: any) => (
                          <SelectItem key={province.id} value={province.id.toString()}>
                            {province.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={selectedLocality} onValueChange={setSelectedLocality}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Areas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Areas</SelectItem>
                        {localities.filter((loc: any) => 
                          selectedProvince === 'all' || loc.provinceId.toString() === selectedProvince
                        ).map((locality: any) => (
                          <SelectItem key={locality.id} value={locality.id.toString()}>
                            {locality.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex gap-2">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className="flex-1"
                      >
                        <Grid className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className="flex-1"
                      >
                        <List className="w-4 h-4" />
                      </Button>
                    </div>

                    <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </Button>
                  </div>
                </div>
              </div>

              {/* Business Results */}
              {businessesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 rounded-lg h-48"></div>
                    </div>
                  ))}
                </div>
              ) : businesses.length > 0 ? (
                <>
                  <div className="mb-6">
                    <p className="text-gray-600">
                      Showing {businesses.length} of {totalBusinesses} businesses
                    </p>
                  </div>
                  
                  <div className={`grid gap-6 ${
                    viewMode === 'grid' 
                      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                      : 'grid-cols-1'
                  }`}>
                    {businesses.map((business: any) => (
                      <BusinessCard
                        key={business.id}
                        business={business}
                        showCategory={currentLevel < 3}
                        layout={viewMode}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No businesses found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your search criteria or explore other categories
                  </p>
                  <Link href="/categories">
                    <Button variant="outline">
                      Browse Other Categories
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Related Categories */}
          {relatedCategories.length > 0 && (
            <div className="mt-16">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Related Categories
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {relatedCategories.slice(0, 8).map((related: Category) => {
                  let href = `/categories/${categorySlug}`;
                  if (currentLevel === 2) {
                    href += `/${related.slug}`;
                  } else if (currentLevel === 3) {
                    href += `/${subcategorySlug}/${related.slug}`;
                  }

                  return (
                    <Link key={related.id} href={href}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 ${getCategoryIconColor(related.name)} rounded-lg`}>
                              {getCategoryIcon(related.name, "w-5 h-5 text-white")}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{related.name}</div>
                              <div className="text-xs text-gray-500">
                                {related.businessCount || 0} businesses
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}