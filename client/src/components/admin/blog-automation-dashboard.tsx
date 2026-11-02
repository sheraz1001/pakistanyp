import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  TrendingUp, Zap, BarChart3, Sparkles, Calendar, Target, 
  RefreshCw, Lightbulb, Brain, Eye, Activity, Award
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ContentTrend {
  topic: string;
  relevanceScore: number;
  seasonality: 'high' | 'medium' | 'low';
  suggestedTiming: string;
  relatedKeywords: string[];
}

interface PKBusinessContext {
  currentEvents: string[];
  seasonalOpportunities: string[];
  industryTrends: string[];
  marketInsights: string[];
}

interface SmartTopicSuggestion {
  title: string;
  description: string;
  relevanceScore: number;
  category: string;
  keywords: string[];
  estimatedEngagement: 'high' | 'medium' | 'low';
  seasonalTiming?: string;
}

export function BlogAutomationDashboard() {
  const [activeTab, setActiveTab] = useState("intelligence");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch trending topics
  const { data: trends = [], isLoading: trendsLoading, refetch: refetchTrends } = useQuery<ContentTrend[]>({
    queryKey: ["/api/admin/trending-topics"],
    queryFn: async () => {
      const response = await fetch("/api/admin/trending-topics", {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch trends');
      return response.json();
    },
    staleTime: 60 * 60 * 1000,
    retry: 1
  });

  // Fetch Pakistani business context
  const { data: context, isLoading: contextLoading, refetch: refetchContext } = useQuery<PKBusinessContext>({
    queryKey: ["/api/admin/pk-business-context"],
    queryFn: async () => {
      const response = await fetch("/api/admin/pk-business-context", {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch context');
      return response.json();
    },
    staleTime: 60 * 60 * 1000,
    retry: 1
  });

  // Generate smart topics mutation
  const generateSmartTopicsMutation = useMutation({
    mutationFn: (count: number) => apiRequest("POST", "/api/admin/smart-topics", { count }),
    onSuccess: (data) => {
      setSmartTopics(data);
      toast({ title: "Smart topics generated successfully" });
    },
    onError: () => {
      toast({ 
        title: "Failed to generate smart topics",
        variant: "destructive"
      });
    }
  });

  const [smartTopics, setSmartTopics] = useState<SmartTopicSuggestion[]>([]);

  const getSeasonalityColor = (level: 'high' | 'medium' | 'low') => {
    const colors = {
      high: 'text-red-600 bg-red-50',
      medium: 'text-[#B45309] bg-[#FFF8EB]',
      low: 'text-blue-600 bg-blue-50'
    };
    return colors[level];
  };

  const getEngagementColor = (level: 'high' | 'medium' | 'low') => {
    const colors = {
      high: 'text-green-600 bg-green-50',
      medium: 'text-[#B45309] bg-[#FFF8EB]',
      low: 'text-gray-600 bg-gray-50'
    };
    return colors[level];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            AI Blog Automation Intelligence
          </h2>
          <p className="text-gray-600 mt-1">
            Smart content discovery and Pakistani business insights
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            refetchTrends();
            refetchContext();
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="intelligence">
            <Sparkles className="h-4 w-4 mr-2" />
            Market Intelligence
          </TabsTrigger>
          <TabsTrigger value="trends">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trending Topics
          </TabsTrigger>
          <TabsTrigger value="smart-topics">
            <Target className="h-4 w-4 mr-2" />
            Smart Topics
          </TabsTrigger>
        </TabsList>

        {/* Market Intelligence Tab */}
        <TabsContent value="intelligence" className="space-y-6">
          {contextLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2">Loading Pakistani business context...</span>
                </div>
              </CardContent>
            </Card>
          ) : context ? (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Current Events */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Current Events
                  </CardTitle>
                  <CardDescription>
                    Recent major business events and announcements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {context.currentEvents.map((event, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span className="text-sm">{event}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Seasonal Opportunities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    Seasonal Opportunities
                  </CardTitle>
                  <CardDescription>
                    Time-sensitive content opportunities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {context.seasonalOpportunities.map((opp, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span className="text-sm">{opp}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Industry Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    Industry Trends
                  </CardTitle>
                  <CardDescription>
                    Key trends in Pakistan business market
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {context.industryTrends.map((trend, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-purple-600 mt-1">•</span>
                        <span className="text-sm">{trend}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Market Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-[#B45309]" />
                    Market Insights
                  </CardTitle>
                  <CardDescription>
                    Actionable insights for content creation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {context.marketInsights.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#B45309] mt-1">•</span>
                        <span className="text-sm">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                No context data available
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Trending Topics Tab */}
        <TabsContent value="trends" className="space-y-4">
          {trendsLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2">Discovering trending topics...</span>
                </div>
              </CardContent>
            </Card>
          ) : trends.length > 0 ? (
            <div className="grid gap-4">
              {trends.map((trend, idx) => (
                <Card key={idx}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{trend.topic}</h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge className={getSeasonalityColor(trend.seasonality)}>
                            {trend.seasonality} seasonality
                          </Badge>
                          <Badge variant="outline">
                            Score: {trend.relevanceScore}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          {trend.suggestedTiming}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {trend.relatedKeywords.map((keyword, kidx) => (
                            <span key={kidx} className="text-xs px-2 py-1 bg-gray-100 rounded">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {trend.relevanceScore}
                        </div>
                        <div className="text-xs text-gray-500">Relevance</div>
                        <Progress value={trend.relevanceScore} className="mt-2 w-24" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                No trending topics available
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Smart Topics Tab */}
        <TabsContent value="smart-topics" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>AI-Powered Topic Generator</CardTitle>
                  <CardDescription>
                    Generate intelligent blog topics based on Pakistani market context and trends
                  </CardDescription>
                </div>
                <Button
                  onClick={() => generateSmartTopicsMutation.mutate(10)}
                  disabled={generateSmartTopicsMutation.isPending}
                >
                  {generateSmartTopicsMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Generate Smart Topics
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
          </Card>

          {smartTopics.length > 0 ? (
            <div className="grid gap-4">
              {smartTopics.map((topic, idx) => (
                <Card key={idx} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-2 mb-2">
                          <Award className="h-5 w-5 text-primary mt-1" />
                          <h3 className="font-semibold text-lg">{topic.title}</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{topic.description}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline">{topic.category}</Badge>
                          <Badge className={getEngagementColor(topic.estimatedEngagement)}>
                            {topic.estimatedEngagement} engagement
                          </Badge>
                          {topic.seasonalTiming && (
                            <Badge className="bg-purple-50 text-purple-700">
                              <Calendar className="h-3 w-3 mr-1" />
                              {topic.seasonalTiming}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {topic.keywords.map((keyword, kidx) => (
                            <span key={kidx} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {topic.relevanceScore}
                        </div>
                        <div className="text-xs text-gray-500">Score</div>
                        <Progress value={topic.relevanceScore} className="mt-2 w-24" />
                        <Button variant="outline" size="sm" className="mt-3">
                          <Eye className="h-4 w-4 mr-1" />
                          Use Topic
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  Click "Generate Smart Topics" to get AI-powered content suggestions
                </p>
                <p className="text-sm text-gray-400">
                  Topics are generated based on current Pakistani market trends, seasonal opportunities, and business insights
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
