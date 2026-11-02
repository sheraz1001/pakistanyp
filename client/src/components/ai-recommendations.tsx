import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Brain, 
  Star, 
  MapPin, 
  Phone, 
  Globe, 
  TrendingUp,
  Search,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { Link } from "wouter";

interface BusinessRecommendation {
  business: {
    id: number;
    name: string;
    description?: string;
    categoryName?: string;
    provinceName?: string;
    cityName?: string;
    averageRating?: number;
    reviewCount?: number;
    phoneNumber?: string;
    website?: string;
    isVerified?: boolean;
    isFeatured?: boolean;
    slug?: string;
  };
  score: number;
  reasoning: string;
  relevanceFactors: string[];
}

interface RecommendationResponse {
  recommendations: BusinessRecommendation[];
  summary: string;
  searchInsights: string;
}

interface AIRecommendationsProps {
  searchQuery?: string;
  categoryId?: number;
  provinceId?: number;
  userLocation?: string;
  className?: string;
}

export function AIRecommendations({ 
  searchQuery, 
  categoryId, 
  provinceId, 
  userLocation,
  className = ""
}: AIRecommendationsProps) {
  const [localQuery, setLocalQuery] = useState(searchQuery || "");
  const [requestData, setRequestData] = useState({
    searchQuery,
    categoryId,
    provinceId,
    userLocation,
  });

  const { data: recommendations, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/ai/recommendations", requestData],
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/ai/recommendations", requestData);
      return response as RecommendationResponse;
    },
    enabled: !!(requestData.searchQuery || requestData.categoryId),
  });

  const handleGetRecommendations = () => {
    setRequestData({
      searchQuery: localQuery,
      categoryId,
      provinceId,
      userLocation,
    });
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">AI Recommendations</h3>
          <Skeleton className="h-4 w-4 rounded-full animate-spin" />
        </div>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Unable to load AI recommendations</p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Search */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-bold">AI-Powered Recommendations</h3>
          <Sparkles className="h-5 w-5 text-[#B45309]" />
        </div>
      </div>

      {/* Search Input */}
      <div className="flex gap-2">
        <Input
          placeholder="What are you looking for?"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleGetRecommendations}>
          <Search className="h-4 w-4 mr-2" />
          Get AI Recommendations
        </Button>
      </div>

      {/* Recommendations */}
      {recommendations && (
        <>
          {/* Summary */}
          {recommendations.summary && (
            <Card className="bg-white border-[#E7E9EE]">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">AI Insights</h4>
                    <p className="text-blue-800 text-sm leading-relaxed">
                      {recommendations.summary}
                    </p>
                    {recommendations.searchInsights && (
                      <p className="text-blue-700 text-xs mt-2 italic">
                        {recommendations.searchInsights}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendation List */}
          <div className="space-y-4">
            {recommendations.recommendations.map((rec, index) => (
              <Card key={rec.business.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Link href={`/business/${rec.business.slug || rec.business.id}`}>
                          <h4 className="text-lg font-semibold text-blue-900 hover:text-blue-700 cursor-pointer">
                            {rec.business.name}
                          </h4>
                        </Link>
                        {rec.business.isVerified && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Verified
                          </Badge>
                        )}
                        {rec.business.isFeatured && (
                          <Badge variant="secondary" className="bg-[#FFF4E0] text-[#B45309]">
                            Featured
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        {rec.business.categoryName && (
                          <span className="font-medium">{rec.business.categoryName}</span>
                        )}
                        {rec.business.cityName && rec.business.provinceName && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{rec.business.cityName}, {rec.business.provinceName}</span>
                          </div>
                        )}
                        {rec.business.averageRating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-[#F59E0B] text-[#F59E0B]" />
                            <span>{rec.business.averageRating.toFixed(1)}</span>
                            {rec.business.reviewCount && (
                              <span className="text-gray-500">({rec.business.reviewCount} reviews)</span>
                            )}
                          </div>
                        )}
                      </div>

                      {rec.business.description && (
                        <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                          {rec.business.description}
                        </p>
                      )}
                    </div>

                    <div className="text-right ml-4">
                      <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold mb-2">
                        {rec.score}% Match
                      </div>
                      <div className="text-xs text-gray-500">
                        #{index + 1} Recommendation
                      </div>
                    </div>
                  </div>

                  {/* AI Reasoning */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="flex items-start gap-2">
                      <Brain className="h-4 w-4 text-purple-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-700 font-medium mb-1">Why AI recommends this:</p>
                        <p className="text-sm text-gray-600">{rec.reasoning}</p>
                      </div>
                    </div>
                  </div>

                  {/* Relevance Factors */}
                  {rec.relevanceFactors.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {rec.relevanceFactors.map((factor, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Contact Actions */}
                  <div className="flex gap-3">
                    <Link href={`/business/${rec.business.slug || rec.business.id}`}>
                      <Button variant="default" size="sm">
                        View Details
                      </Button>
                    </Link>
                    {rec.business.phoneNumber && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`tel:${rec.business.phoneNumber}`}>
                          <Phone className="h-3 w-3 mr-1" />
                          Call
                        </a>
                      </Button>
                    )}
                    {rec.business.website && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={rec.business.website} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-3 w-3 mr-1" />
                          Website
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {recommendations.recommendations.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No Recommendations Found</h4>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search terms or location preferences for better results.
                </p>
                <Button onClick={handleGetRecommendations} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Different Search
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export default AIRecommendations;