import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import AIRecommendations from "@/components/ai-recommendations";
import { CategoryTrends } from "@/components/smart-search-suggestions";
import { SEO, SEOConfigs } from "@/components/seo";
import Header from "@/components/header";
import Footer from "@/components/footer";
import BreakingNewsTicker from "@/components/breaking-news-ticker";
import Breadcrumb from "@/components/breadcrumb";
import CoreWebVitals from "@/components/core-web-vitals";
import MobileHeader from "@/components/mobile-header";
import { useMobile } from "@/hooks/use-mobile";
import { country, localize } from "@shared/country";

// First city of the first regions, for example queries outside Pakistan
const [exampleCity1, exampleCity2, exampleCity3] = country.regions.slice(0, 3).map((r) => r.cities?.[0]?.name ?? r.name);
import { 
  Brain, 
  Sparkles, 
  TrendingUp, 
  Search, 
  MapPin,
  Filter,
  Zap,
  Target,
  Globe,
  Users
} from "lucide-react";
import { t as tx } from "@shared/i18n";

export default function AIRecommendationsPage() {
  const [, setLocation] = useLocation();
  const isMobile = useMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [selectedProvince, setSelectedProvince] = useState<number | undefined>();
  const [userLocation, setUserLocation] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  const { data: provinces = [] } = useQuery({
    queryKey: ['/api/provinces'],
  });

  const handleQuickSearch = (query: string) => {
    setSearchQuery(query);
  };

  const quickSearchTerms = [
    `Best restaurants in ${exampleCity1}`,
    `IT companies in ${exampleCity2}`,
    "Medical clinics near me",
    `Car dealerships in ${exampleCity3}`,
    "Real estate agencies",
    `Wedding venues ${country.inName}`,
    "Fitness centers",
    "Educational institutes"
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <SEO {...SEOConfigs.aiRecommendations} />
      <CoreWebVitals />
      
      <main className="relative">
        {/* Hero Section with Pakistani Theme - Full Height with Header Overlay */}
        <div className="relative overflow-hidden bg-[#F2F9F4] border-b border-[#CFE8D8]">
          <div className="absolute inset-0"></div>
          <div className="absolute inset-0 opacity-30">
            <div className="w-full h-full"></div>
          </div>
          
          {/* Header Overlay */}
          <div className="relative z-10">
            <Header />
            <BreakingNewsTicker />
          </div>
          
          {/* Hero Content */}
          <div className="relative z-10 py-14">
            <div className="container mx-auto px-4 text-center">
              <Breadcrumb 
                items={[
                  { label: "Home", href: "/" },
                  { label: "AI Recommendations", href: "/ai-recommendations" }
                ]} 
                className="mb-8 justify-center"
                theme="dark"
              />
              
              <div className="max-w-4xl mx-auto">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#E8F4EC] rounded-[18px] mb-6">
                  <Brain className="w-8 h-8 text-[#0B6B2E]" />
                </div>
                <h1 className="yp-h1 text-[#0A0A0A] mb-6">
                  AI Business <span className="text-[#0B6B2E]">Recommendations</span>
                </h1>
                <p className="yp-lead mb-8 max-w-3xl mx-auto">
                  {tx("Discover the perfect businesses for your needs with our intelligent AI-powered recommendation engine. Smart matching technology for the {0} market.", country.adjective)}
                </p>
                
                <div className="flex flex-wrap justify-center gap-4 mb-8">
                  <Badge variant="secondary" className="bg-white text-[#05501F] border border-[#CFE8D8] px-4 py-2">
                    <Sparkles className="w-4 h-4 me-2" />
                    AI-Powered
                  </Badge>
                  <Badge variant="secondary" className="bg-white text-[#05501F] border border-[#CFE8D8] px-4 py-2">
                    <Target className="w-4 h-4 me-2" />
                    Smart Matching
                  </Badge>
                  <Badge variant="secondary" className="bg-white text-[#05501F] border border-[#CFE8D8] px-4 py-2">
                    <Zap className="w-4 h-4 me-2" />
                    Instant Results
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendations Content */}
        <div className="container mx-auto px-4 py-8 relative z-10 -mt-16">
          <Card className="bg-white border border-[#E7E9EE] rounded-[20px] mb-8">
            <CardContent className="p-8">
              <div className="grid lg:grid-cols-3 gap-8">
            {/* Main AI Recommendations */}
            <div className="lg:col-span-2">
              {/* Search Filters */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Customize Your Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Search Query</label>
                      <Input
                        placeholder="What are you looking for?"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Your Location</label>
                      <Input
                        placeholder="Enter your area or city"
                        value={userLocation}
                        onChange={(e) => setUserLocation(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Category</label>
                      <Select value={selectedCategory?.toString()} onValueChange={(value) => setSelectedCategory(value && value !== "all" ? parseInt(value) : undefined)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map((category: any) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">{country.regionTerm.singular}</label>
                      <Select value={selectedProvince?.toString()} onValueChange={(value) => setSelectedProvince(value && value !== "all" ? parseInt(value) : undefined)}>
                        <SelectTrigger>
                          <SelectValue placeholder={localize("Select province")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{localize("All Provinces")}</SelectItem>
                          {provinces.map((province: any) => (
                            <SelectItem key={province.id} value={province.id.toString()}>
                              {province.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Search Terms */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Quick Search Ideas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {quickSearchTerms.map((term, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickSearch(term)}
                        className="text-xs hover:bg-blue-50 hover:border-blue-300"
                      >
                        <Search className="h-3 w-3 me-1" />
                        {term}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* AI Recommendations Component */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    Your Personalized Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Recommendations Temporarily Unavailable</h3>
                    <p className="text-gray-600 mb-4">
                      Our AI recommendation service is currently being upgraded. Meanwhile, you can still explore businesses using our advanced search features.
                    </p>
                    <Button onClick={() => setLocation('/search')} className="bg-blue-600 hover:bg-blue-700">
                      <Search className="h-4 w-4 me-2" />
                      Browse All Businesses
                    </Button>
                  </div>
                </CardContent>
              </Card>
              

            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* How AI Works */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    How AI Recommendations Work
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">1</div>
                      <div>
                        <p className="font-medium text-sm">Data Analysis</p>
                        <p className="text-xs text-gray-600">AI analyzes business profiles, ratings, and reviews</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">2</div>
                      <div>
                        <p className="font-medium text-sm">Pattern Recognition</p>
                        <p className="text-xs text-gray-600">Identifies patterns in your search behavior</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">3</div>
                      <div>
                        <p className="font-medium text-sm">Smart Matching</p>
                        <p className="text-xs text-gray-600">Matches businesses to your preferences with reasoning</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-[#E7E9EE]">
                    <p className="text-sm text-blue-800 leading-relaxed">
                      <Sparkles className="h-4 w-4 inline me-1" />
                      Our AI considers over 20 factors including location, ratings, services, and user preferences to provide personalized recommendations.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Category Trends */}
              <CategoryTrends />

              {/* Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    AI Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 text-center">
                    Our AI continuously learns from user interactions to improve recommendations
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}