import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SEO, SEOConfigs } from "@/components/seo";
import Header from "@/components/header";
import Footer from "@/components/footer";
import Breadcrumb from "@/components/breadcrumb";
import CoreWebVitals from "@/components/core-web-vitals";
import { useMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
  Users,
  Mic,
  MicOff,
  Star,
  Phone,
  Mail,
  Clock,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Lightbulb,
  BarChart3,
  Settings,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Send,
  Eye,
  Heart,
  Share2,
  Bookmark,
  MessageCircle,
  Navigation,
  Compass,
  Radar,
  Cpu,
  Activity,
  Layers,
  PieChart,
  LineChart,
  TrendingDown
} from "lucide-react";
import { country, localize } from "@shared/country";
import { t as tx } from "@shared/i18n";
import { tj } from "@/i18n-jsx/tj";

// First city of the first regions, for example queries outside Pakistan
const [exampleCity1, exampleCity2, exampleCity3] = country.regions.slice(0, 3).map((r) => r.cities?.[0]?.name ?? r.name);

interface BusinessRecommendation {
  id: number;
  name: string;
  description?: string;
  category?: string;
  province?: string;
  city?: string;
  rating?: number;
  reviewCount?: number;
  phone?: string;
  website?: string;
  isVerified?: boolean;
  isFeatured?: boolean;
  slug?: string;
  address?: string;
  logo?: string;
  aiScore: number;
  aiReasoning: string;
  relevanceFactors: string[];
  distance?: number;
  priceRange?: string;
  openNow?: boolean;
  responseTime?: string;
}

interface AIAnalytics {
  searchInsights: string;
  marketTrends: string[];
  competitorAnalysis: string;
  recommendationConfidence: number;
  searchVolume: number;
  categoryPopularity: number;
  seasonalTrends: string;
}

interface VoiceSearchState {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  isSupported: boolean;
}

export default function AIRecommendationsEnhanced() {
  const [, setLocation] = useLocation();
  const isMobile = useMobile();
  const { toast } = useToast();

  // Core search state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProvince, setSelectedProvince] = useState<string>("all");
  const [userLocation, setUserLocation] = useState("");
  const [priceRange, setPriceRange] = useState<number[]>([0, 100]);
  const [sortBy, setSortBy] = useState("ai_score");
  const [showOnlyVerified, setShowOnlyVerified] = useState(false);
  const [showOnlyOpen, setShowOnlyOpen] = useState(false);
  const [maxDistance, setMaxDistance] = useState<number[]>([25]);

  // Advanced features state
  const [voiceSearch, setVoiceSearch] = useState<VoiceSearchState>({
    isListening: false,
    isProcessing: false,
    transcript: "",
    isSupported: false
  });
  const [favorites, setFavorites] = useState<number[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [aiMode, setAiMode] = useState<"comprehensive" | "fast" | "precise">("comprehensive");
  const [personalizedMode, setPersonalizedMode] = useState(true);

  // Refs
  const recognitionRef = useRef<any>(null);

  // Data fetching
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  const { data: provinces = [] } = useQuery({
    queryKey: ['/api/provinces'],
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
  });

  // AI Recommendations Mutation
  const aiRecommendationsMutation = useMutation({
    mutationFn: async (params: any) => {
      const response = await apiRequest("POST", "/api/ai/recommendations-enhanced", {
        searchQuery,
        categoryId: selectedCategory !== "all" ? parseInt(selectedCategory) : undefined,
        provinceId: selectedProvince !== "all" ? parseInt(selectedProvince) : undefined,
        userLocation,
        priceRange,
        maxDistance: maxDistance[0],
        sortBy,
        onlyVerified: showOnlyVerified,
        onlyOpen: showOnlyOpen,
        aiMode,
        personalized: personalizedMode,
        recentSearches,
        ...params
      });
      return response;
    },
    onSuccess: (data) => {
      if (searchQuery && !recentSearches.includes(searchQuery)) {
        setRecentSearches(prev => [searchQuery, ...prev.slice(0, 9)]);
      }
      toast({
        title: "AI Recommendations Generated",
        description: tx("Found {0} personalized matches", data.recommendations?.length || 0),
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate AI recommendations. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Voice Search Setup
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      setVoiceSearch(prev => ({ ...prev, isSupported: true }));
      
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setVoiceSearch(prev => ({ ...prev, isListening: true }));
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceSearch(prev => ({ ...prev, transcript, isProcessing: true }));
        setSearchQuery(transcript);
        
        // Auto-trigger search after voice input
        setTimeout(() => {
          handleGetRecommendations();
          setVoiceSearch(prev => ({ ...prev, isProcessing: false }));
        }, 500);
      };

      recognitionRef.current.onend = () => {
        setVoiceSearch(prev => ({ ...prev, isListening: false }));
      };

      recognitionRef.current.onerror = (event: any) => {
        setVoiceSearch(prev => ({ ...prev, isListening: false, isProcessing: false }));
        toast({
          title: "Voice Search Error",
          description: "Please check microphone permissions and try again.",
          variant: "destructive"
        });
      };
    }
  }, []);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // You could reverse geocode this to get city name
          setUserLocation(`${position.coords.latitude},${position.coords.longitude}`);
        },
        (error) => {
          console.log("Location access denied");
        }
      );
    }
  }, []);

  const handleVoiceSearch = () => {
    if (!voiceSearch.isSupported) {
      toast({
        title: "Voice Search Not Supported",
        description: "Your browser doesn't support voice search. Please use Chrome.",
        variant: "destructive"
      });
      return;
    }

    if (voiceSearch.isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  const handleGetRecommendations = () => {
    if (!searchQuery && selectedCategory === "all") {
      toast({
        title: "Search Required",
        description: "Please enter a search query or select a category",
        variant: "destructive"
      });
      return;
    }

    aiRecommendationsMutation.mutate({});
  };

  const handleQuickSearch = (query: string) => {
    setSearchQuery(query);
    setTimeout(() => {
      aiRecommendationsMutation.mutate({});
    }, 100);
  };

  const toggleFavorite = (businessId: number) => {
    setFavorites(prev => 
      prev.includes(businessId) 
        ? prev.filter(id => id !== businessId)
        : [...prev, businessId]
    );
  };

  const quickSearchTerms = [
    `Best restaurants in ${exampleCity1}`,
    `IT companies in ${exampleCity2}`,
    "Medical clinics near me",
    `Car dealerships in ${exampleCity3}`,
    "Real estate agencies",
    `Wedding venues ${country.inName}`,
    "Fitness centers",
    "Educational institutes",
    "Beauty salons",
    "Auto repair shops",
    "Legal services",
    "Accounting firms"
  ];

  const aiModes = [
    { value: "fast", label: "Fast Mode", description: "Quick results in 2-3 seconds" },
    { value: "comprehensive", label: "Comprehensive", description: "Detailed analysis with insights" },
    { value: "precise", label: "Precision Mode", description: "Most accurate matching" }
  ];

  const recommendations = aiRecommendationsMutation.data?.recommendations || [];
  const analytics = aiRecommendationsMutation.data?.analytics || {};

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <SEO {...SEOConfigs.aiRecommendations} />
      <CoreWebVitals />
      
      <main className="relative">
        {/* Hero Section - Removed Breaking News */}
        <div className="relative overflow-hidden bg-[#F2F9F4] border-b border-[#CFE8D8]">
          <div className="absolute inset-0"></div>
          <div className="absolute inset-0 opacity-20">
            <div className="w-full h-full"></div>
          </div>
          
          {/* Header Only - No Breaking News */}
          <div className="relative z-10">
            <Header />
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
                  Advanced AI <span className="text-[#0B6B2E]">Business Intelligence</span>
                </h1>
                <p className="yp-lead mb-8 max-w-3xl mx-auto">
                  Discover perfect business matches with our next-generation AI. Voice search, real-time analytics, 
                  and personalized recommendations powered by advanced machine learning.
                </p>
                
                <div className="flex flex-wrap justify-center gap-4 mb-8">
                  <Badge variant="secondary" className="bg-white text-[#05501F] border border-[#CFE8D8] px-4 py-2">
                    <Cpu className="w-4 h-4 me-2" />
                    GPT-4 Powered
                  </Badge>
                  <Badge variant="secondary" className="bg-white text-[#05501F] border border-[#CFE8D8] px-4 py-2">
                    <Mic className="w-4 h-4 me-2" />
                    Voice Search
                  </Badge>
                  <Badge variant="secondary" className="bg-white text-[#05501F] border border-[#CFE8D8] px-4 py-2">
                    <Activity className="w-4 h-4 me-2" />
                    Real-time Analytics
                  </Badge>
                  <Badge variant="secondary" className="bg-white text-[#05501F] border border-[#CFE8D8] px-4 py-2">
                    <Radar className="w-4 h-4 me-2" />
                    Smart Matching
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8 relative z-10 -mt-8">
          <Card className="bg-white border border-[#E7E9EE] rounded-[20px] mb-8">
            <CardContent className="p-8">
              <div className="grid lg:grid-cols-4 gap-8">
                
                {/* Advanced Search Panel */}
                <div className="lg:col-span-1">
                  <Card className="sticky top-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-blue-600" />
                        Smart Search
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      
                      {/* Voice Search */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Voice Search</label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Type or speak your search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            onClick={handleVoiceSearch}
                            variant={voiceSearch.isListening ? "destructive" : "outline"}
                            size="icon"
                            disabled={!voiceSearch.isSupported}
                          >
                            {voiceSearch.isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                          </Button>
                        </div>
                        {voiceSearch.isListening && (
                          <p className="text-xs text-blue-600 mt-1">Listening...</p>
                        )}
                        {voiceSearch.isProcessing && (
                          <p className="text-xs text-green-600 mt-1">Processing...</p>
                        )}
                      </div>

                      {/* AI Mode Selection */}
                      <div>
                        <label className="block text-sm font-medium mb-2">AI Mode</label>
                        <Select value={aiMode} onValueChange={(value: any) => setAiMode(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {aiModes.map((mode) => (
                              <SelectItem key={mode.value} value={mode.value}>
                                <div>
                                  <div className="font-medium">{mode.label}</div>
                                  <div className="text-xs text-gray-500">{mode.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Category & Location */}
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Category</label>
                          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger>
                              <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Categories</SelectItem>
                              {categories.slice(0, 50).map((category: any) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">{country.regionTerm.singular}</label>
                          <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                            <SelectTrigger>
                              <SelectValue placeholder={localize("All Provinces")} />
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

                      {/* Advanced Filters Toggle */}
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Switch
                          id="advanced-filters"
                          checked={showAdvancedFilters}
                          onCheckedChange={setShowAdvancedFilters}
                        />
                        <label htmlFor="advanced-filters" className="text-sm font-medium">
                          Advanced Filters
                        </label>
                      </div>

                      {/* Advanced Filters */}
                      {showAdvancedFilters && (
                        <div className="space-y-4 border-t pt-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">{tj("Max Distance: {0} km", maxDistance[0])}</label>
                            <Slider
                              value={maxDistance}
                              onValueChange={setMaxDistance}
                              max={50}
                              min={1}
                              step={1}
                              className="w-full"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">{tj("Price Range: ${0} - ${1}", priceRange[0], priceRange[1])}</label>
                            <Slider
                              value={priceRange}
                              onValueChange={setPriceRange}
                              max={200}
                              min={0}
                              step={10}
                              className="w-full"
                            />
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                              <Switch
                                id="verified-only"
                                checked={showOnlyVerified}
                                onCheckedChange={setShowOnlyVerified}
                              />
                              <label htmlFor="verified-only" className="text-sm">
                                Verified businesses only
                              </label>
                            </div>

                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                              <Switch
                                id="open-now"
                                checked={showOnlyOpen}
                                onCheckedChange={setShowOnlyOpen}
                              />
                              <label htmlFor="open-now" className="text-sm">
                                Open now
                              </label>
                            </div>

                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                              <Switch
                                id="personalized"
                                checked={personalizedMode}
                                onCheckedChange={setPersonalizedMode}
                              />
                              <label htmlFor="personalized" className="text-sm">
                                Personalized results
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Sort By</label>
                            <Select value={sortBy} onValueChange={setSortBy}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ai_score">AI Relevance</SelectItem>
                                <SelectItem value="rating">Highest Rated</SelectItem>
                                <SelectItem value="distance">Nearest</SelectItem>
                                <SelectItem value="newest">Newest</SelectItem>
                                <SelectItem value="price_low">Price: Low to High</SelectItem>
                                <SelectItem value="price_high">Price: High to Low</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      {/* Search Button */}
                      <Button 
                        onClick={handleGetRecommendations}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={aiRecommendationsMutation.isPending}
                      >
                        {aiRecommendationsMutation.isPending ? (
                          <>
                            <RefreshCw className="h-4 w-4 me-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Brain className="h-4 w-4 me-2" />
                            Get AI Recommendations
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Main Results Area */}
                <div className="lg:col-span-3 space-y-6">
                  
                  {/* Quick Search Terms */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-[#B45309]" />
                        Quick Search
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

                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-gray-600" />
                          Recent Searches
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {recentSearches.map((search, index) => (
                            <Button
                              key={index}
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuickSearch(search)}
                              className="text-xs"
                            >
                              {search}
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* AI Analytics Panel */}
                  {analytics.searchInsights && (
                    <Card className="bg-white border-[#E7E9EE]">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-purple-600" />
                          AI Market Intelligence
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-700">
                              {analytics.recommendationConfidence}%
                            </div>
                            <div className="text-xs text-blue-600">Confidence</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-700">
                              {analytics.searchVolume || "5.2K"}
                            </div>
                            <div className="text-xs text-purple-600">Monthly Searches</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-700">
                              {analytics.categoryPopularity || "High"}
                            </div>
                            <div className="text-xs text-green-600">Demand Level</div>
                          </div>
                        </div>
                        
                        {analytics.searchInsights && (
                          <div className="bg-white p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                              <Lightbulb className="h-4 w-4 text-[#B45309]" />
                              Market Insights
                            </h4>
                            <p className="text-sm text-gray-700">{analytics.searchInsights}</p>
                          </div>
                        )}

                        {analytics.marketTrends && analytics.marketTrends.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {analytics.marketTrends.map((trend, index) => (
                              <Badge key={index} variant="outline" className="bg-white">
                                <TrendingUp className="h-3 w-3 me-1" />
                                {trend}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Recommendations Results */}
                  {recommendations.length > 0 ? (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-900">{tj("AI Recommendations ({0})", recommendations.length)}</h3>
                        <Badge className="bg-blue-500 text-white">
                          <Brain className="h-3 w-3 me-1" />
                          AI Powered
                        </Badge>
                      </div>

                      <div className="grid gap-6">
                        {recommendations.map((business, index) => (
                          <Card key={business.id} className="hover:shadow-sm transition-all duration-300 border-s-4 border-s-blue-500">
                            <CardContent className="p-6">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="text-xl font-bold text-gray-900 hover:text-blue-700 cursor-pointer">
                                      {business.name}
                                    </h4>
                                    {business.isVerified && (
                                      <Badge className="bg-green-100 text-green-800">
                                        Verified
                                      </Badge>
                                    )}
                                    {business.isFeatured && (
                                      <Badge className="bg-[#FFF4E0] text-[#B45309]">
                                        Featured
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                    {business.category && (
                                      <span className="font-medium">{business.category}</span>
                                    )}
                                    {business.city && business.province && (
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        <span>{business.city}, {business.province}</span>
                                      </div>
                                    )}
                                    {business.rating && (
                                      <div className="flex items-center gap-1">
                                        <Star className="h-3 w-3 fill-[#F59E0B] text-[#F59E0B]" />
                                        <span>{business.rating.toFixed(1)}</span>
                                        {business.reviewCount && (
                                          <span className="text-gray-500">({business.reviewCount})</span>
                                        )}
                                      </div>
                                    )}
                                    {business.distance && (
                                      <span className="text-blue-600">{tj("{0}km away", business.distance)}</span>
                                    )}
                                  </div>

                                  {business.description && (
                                    <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                                      {business.description}
                                    </p>
                                  )}
                                </div>

                                <div className="text-end ms-4">
                                  <div className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-bold mb-2">{tj("{0}% AI Match", business.aiScore)}</div>
                                  <div className="text-xs text-gray-500">{tj("Rank #{0}", index + 1)}</div>
                                </div>
                              </div>

                              {/* AI Reasoning */}
                              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                                <div className="flex items-start gap-3">
                                  <Brain className="h-5 w-5 text-purple-600 mt-0.5" />
                                  <div>
                                    <p className="text-sm font-semibold text-purple-800 mb-1">AI Analysis:</p>
                                    <p className="text-sm text-purple-700">{business.aiReasoning}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Relevance Factors */}
                              {business.relevanceFactors.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {business.relevanceFactors.map((factor, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs bg-white border-[#E7E9EE]">
                                      {factor}
                                    </Badge>
                                  ))}
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="flex justify-between items-center">
                                <div className="flex gap-3">
                                  <Button 
                                    onClick={() => setLocation(`/business/${business.slug || business.id}`)}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    <Eye className="h-4 w-4 me-1" />
                                    View Details
                                  </Button>
                                  {business.phone && (
                                    <Button variant="outline" size="sm" asChild>
                                      <a href={`tel:${business.phone}`}>
                                        <Phone className="h-3 w-3 me-1" />
                                        Call
                                      </a>
                                    </Button>
                                  )}
                                  {business.website && (
                                    <Button variant="outline" size="sm" asChild>
                                      <a href={business.website} target="_blank" rel="noopener noreferrer">
                                        <Globe className="h-3 w-3 me-1" />
                                        Website
                                      </a>
                                    </Button>
                                  )}
                                </div>

                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleFavorite(business.id)}
                                  >
                                    <Heart className={`h-4 w-4 ${favorites.includes(business.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Share2 className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Bookmark className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : aiRecommendationsMutation.isError ? (
                    <Card className="border-[#E7E9EE] bg-white">
                      <CardContent className="p-8 text-center">
                        <Brain className="h-16 w-16 text-red-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-red-900 mb-2">
                          AI Service Temporarily Unavailable
                        </h3>
                        <p className="text-red-700 mb-4">
                          We're experiencing high demand. Please try again in a moment.
                        </p>
                        <Button 
                          onClick={() => aiRecommendationsMutation.mutate({})}
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-100"
                        >
                          <RefreshCw className="h-4 w-4 me-2" />
                          Try Again
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <div className="max-w-md mx-auto">
                          <Brain className="h-20 w-20 text-blue-400 mx-auto mb-6" />
                          <h3 className="text-2xl font-bold text-gray-900 mb-4">
                            AI Ready to Help
                          </h3>
                          <p className="text-gray-600 mb-6 leading-relaxed">
                            Enter your search query and let our advanced AI find the perfect business matches 
                            tailored specifically to your needs and preferences.
                          </p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <Mic className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                              <div className="font-medium">Voice Search</div>
                            </div>
                            <div className="bg-purple-50 p-3 rounded-lg">
                              <Target className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                              <div className="font-medium">Smart Matching</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
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