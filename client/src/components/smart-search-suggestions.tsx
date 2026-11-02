import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Sparkles, TrendingUp } from "lucide-react";

interface SmartSearchSuggestionsProps {
  query: string;
  onSuggestionClick: (suggestion: string) => void;
  className?: string;
}

export function SmartSearchSuggestions({ 
  query, 
  onSuggestionClick, 
  className = "" 
}: SmartSearchSuggestionsProps) {
  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["/api/ai/search-suggestions", query],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/ai/search-suggestions?query=${encodeURIComponent(query)}&limit=5`);
      return response;
    },
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (!query || query.length < 2) return null;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium">AI Suggestions</span>
          </div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!suggestions?.suggestions?.length) return null;

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium text-gray-700">AI-Powered Suggestions</span>
        </div>
        <div className="space-y-2">
          {suggestions.suggestions.map((suggestion: string, index: number) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-start text-start h-auto p-2 hover:bg-purple-50"
              onClick={() => onSuggestionClick(suggestion)}
            >
              <Search className="h-3 w-3 me-2 text-gray-400" />
              <span className="text-sm">{suggestion}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface CategoryTrendsProps {
  className?: string;
}

export function CategoryTrends({ className = "" }: CategoryTrendsProps) {
  const { data: trends, isLoading } = useQuery({
    queryKey: ["/api/ai/category-trends"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/ai/category-trends");
      return response;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold">Market Trends</h3>
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trends) return null;

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold">Market Trends</h3>
          <Sparkles className="h-4 w-4 text-[#0B6B2E]" />
        </div>

        {trends.trendingCategories?.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Trending Categories</h4>
            <div className="flex flex-wrap gap-2">
              {trends.trendingCategories.map((category: string, index: number) => (
                <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {trends.insights && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Market Insights</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{trends.insights}</p>
          </div>
        )}

        {trends.recommendations?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">AI Recommendations</h4>
            <ul className="space-y-1">
              {trends.recommendations.map((rec: string, index: number) => (
                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SmartSearchSuggestions;