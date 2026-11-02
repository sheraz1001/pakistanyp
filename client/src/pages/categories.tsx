import { useState, useEffect } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { SEO, SEOConfigs } from "@/components/seo";
import Breadcrumb from "@/components/breadcrumb";
import { country, localize } from "@shared/country";
import CoreWebVitals from "@/components/core-web-vitals";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Phone, Globe, Clock, Eye, Grid3x3, Building2 } from "lucide-react";

export default function Categories() {
  const [, params] = useRoute("/categories/:slug?");
  const [location, navigate] = useLocation();
  
  // Safely parse search parameters
  const getSearchParams = () => {
    try {
      const queryString = location.includes('?') ? location.split('?')[1] : '';
      return new URLSearchParams(queryString);
    } catch (error) {
      console.error('Error parsing search params:', error);
      return new URLSearchParams();
    }
  };
  
  const searchParams = getSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedProvince, setSelectedProvince] = useState(searchParams.get('province') || 'all');
  const [selectedLocality, setSelectedLocality] = useState(searchParams.get('locality') || 'all');

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['/api/categories/with-stats'],
  });

  // Flat list of ALL categories sorted alphabetically - show all for SEO discoverability
  const allCategories = (categories || [])
    .sort((a: any, b: any) => a.name.localeCompare(b.name));

  const totalBusinesses = categories.reduce((sum: number, cat: any) => sum + (cat.businessCount || 0), 0);

  // Filter categories based on search query
  const filteredCategories = searchQuery
    ? allCategories.filter((cat: any) =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allCategories;



  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <SEO {...SEOConfigs.categories} />
      <CoreWebVitals />
      
      <main className="relative">
          {/* Hero Section with Pakistani Theme - Full Height with Header Overlay */}
          <div className="relative overflow-hidden bg-[#F2F9F4] border-b border-[#CFE8D8]">
            <div className="absolute inset-0"></div>
            <div className="absolute inset-0 opacity-30">
              <div className="w-full h-full"></div>
            </div>
            
            {/* Header positioned absolutely over hero */}
            <div className="relative z-50">
              <Header />
            </div>
            
            {/* Hero Content */}
            <div className="relative container mx-auto px-4 pt-8 pb-14">
              <Breadcrumb 
                items={[
                  { label: "Home", href: "/" },
                  { label: "Categories", href: "/categories" }
                ]} 
                className="text-[#4B5565] mb-8"
              />
              
              <div className="max-w-4xl mx-auto text-center">
                <div className="flex justify-center items-center space-x-4 mb-6">
                  <div className="w-12 h-12 bg-[#E8F4EC] text-[#0B6B2E] rounded-[14px] flex items-center justify-center">
                    <Grid3x3 className="w-6 h-6" />
                  </div>
                  <div className="w-12 h-12 bg-[#E6F6F1] text-[#047857] rounded-[14px] flex items-center justify-center">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="w-12 h-12 bg-[#F1F2F6] text-[#334155] rounded-[14px] flex items-center justify-center">
                    <Globe className="w-6 h-6" />
                  </div>
                </div>
                
                <h1 className="yp-h1 text-[#0A0A0A] mb-6">
                  {localize("Pakistani Business Categories")}
                  <span className="block text-2xl md:text-3xl font-medium text-[#0B6B2E] mt-2">
                    Industry Directory
                  </span>
                </h1>
                
                <p className="text-xl text-[#4B5565] mb-8 max-w-2xl mx-auto leading-relaxed">
                  {(
                    <>
                  Explore {categories.length} business categories across all {country.regions.length} {country.regionTerm.plural.toLowerCase()} of {country.name}. 
                  Discover companies by industry and find the perfect business match.
                    </>
                  )}
                </p>
                
                {/* Hero Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                  <div className="bg-white rounded-[20px] p-6 border border-[#E7E9EE]">
                    <div className="text-3xl font-bold text-[#0A0A0A]">{categories.length}</div>
                    <div className="text-[#4B5565] text-sm">Total Categories</div>
                  </div>
                  <div className="bg-white rounded-[20px] p-6 border border-[#E7E9EE]">
                    <div className="text-3xl font-bold text-[#0A0A0A]">{totalBusinesses.toLocaleString()}</div>
                    <div className="text-[#4B5565] text-sm">Active Businesses</div>
                  </div>
                  <div className="bg-white rounded-[20px] p-6 border border-[#E7E9EE]">
                    <div className="text-3xl font-bold text-[#0A0A0A]">{country.regions.length}</div>
                    <div className="text-[#4B5565] text-sm">{`${country.adjective} ${country.regionTerm.plural}`}</div>
                  </div>
                  <div className="bg-white rounded-[20px] p-6 border border-[#E7E9EE]">
                    <div className="text-3xl font-bold text-[#0A0A0A]">{categories.length > 0 ? (totalBusinesses / categories.length).toFixed(0) : 0}</div>
                    <div className="text-[#4B5565] text-sm">Avg per Category</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Content Section */}
        <div className="container mx-auto px-4 py-8 relative z-10">
          <Card className="bg-white border border-[#E7E9EE] rounded-[20px] mb-8">
            <CardContent className="p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <Grid3x3 className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Browse All Categories</h2>
              </div>
              
              {/* Search Bar */}
              <div className="relative mb-6">
                <Grid3x3 className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                <span>Showing {filteredCategories.length} of {allCategories.length} categories</span>
              </div>
            </CardContent>
          </Card>

          {/* All Categories Grid */}
          <Card className="bg-white border border-[#E7E9EE] rounded-[20px] overflow-hidden">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredCategories.map((category: any) => (
                  <Link
                    key={category.id}
                    href={`/categories/${category.slug}`}
                    className="group cursor-pointer p-4 rounded-xl bg-white hover:bg-emerald-50 border border-[#E7E9EE] hover:border-emerald-300 transition-all duration-300 hover:shadow-lg block"
                    data-testid={`link-category-${category.slug}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-2">
                        {category.name}
                      </h4>
                      <Building2 className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors flex-shrink-0 ml-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Businesses</span>
                        <Badge variant="outline" className="text-xs">
                          {category.businessCount || 0}
                        </Badge>
                      </div>
                      {category.description && (
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Footer />
      </main>
    </div>
  );
}
