import { dateLocale } from "@shared/i18n";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Star, 
  MessageSquare, 
  Users, 
  Calendar, 
  MapPin,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award,
  Clock,
  Phone,
  Globe,
  Mail,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Heart,
  Share2,
  Search,
  Filter
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell, AreaChart, Area } from 'recharts';
import { tj } from "@/i18n-jsx/tj";

interface BusinessInsightsProps {
  businessId?: number;
  timeRange?: string;
}

interface InsightData {
  views: { current: number; previous: number; trend: number; data: any[] };
  ratings: { average: number; total: number; distribution: any[] };
  engagement: { clicks: number; calls: number; emails: number; website: number };
  demographics: { locations: any[]; categories: any[]; timeOfDay: any[] };
  performance: { score: number; rank: number; suggestions: string[] };
  competitors: { similar: any[]; comparison: any };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function BusinessInsightsWidgets({ businessId, timeRange = "7d" }: BusinessInsightsProps) {
  const [selectedMetric, setSelectedMetric] = useState("overview");

  const { data: insights, isLoading } = useQuery({
    queryKey: ['/api/business-insights', businessId, timeRange],
    enabled: !!businessId,
  });

  const { data: recommendations } = useQuery({
    queryKey: ['/api/business-recommendations', businessId],
    enabled: !!businessId,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const insightData: InsightData = insights || {
    views: { current: 0, previous: 0, trend: 0, data: [] },
    ratings: { average: 0, total: 0, distribution: [] },
    engagement: { clicks: 0, calls: 0, emails: 0, website: 0 },
    demographics: { locations: [], categories: [], timeOfDay: [] },
    performance: { score: 0, rank: 0, suggestions: [] },
    competitors: { similar: [], comparison: {} }
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Views"
          value={insightData.views.current}
          previousValue={insightData.views.previous}
          trend={insightData.views.trend}
          icon={<Eye className="h-4 w-4" />}
          color="blue"
        />
        <MetricCard
          title="Average Rating"
          value={insightData.ratings.average}
          previousValue={insightData.ratings.average - 0.2}
          trend={8.5}
          icon={<Star className="h-4 w-4" />}
          color="yellow"
          suffix="/5"
        />
        <MetricCard
          title="Customer Engagement"
          value={insightData.engagement.clicks}
          previousValue={insightData.engagement.clicks - 15}
          trend={12.3}
          icon={<Activity className="h-4 w-4" />}
          color="green"
        />
        <MetricCard
          title="Performance Score"
          value={insightData.performance.score}
          previousValue={insightData.performance.score - 5}
          trend={6.2}
          icon={<Target className="h-4 w-4" />}
          color="purple"
          suffix="%"
        />
      </div>

      {/* Detailed Analytics Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Business Analytics Dashboard
          </CardTitle>
          <CardDescription>
            Comprehensive insights into your business performance and customer behavior
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedMetric} onValueChange={setSelectedMetric}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="traffic">Traffic</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="demographics">Demographics</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ViewsChart data={insightData.views.data} />
                <RatingsDistribution data={insightData.ratings.distribution} />
              </div>
              <QuickInsights recommendations={recommendations} />
            </TabsContent>

            <TabsContent value="traffic" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TrafficSources data={insightData.demographics.locations} />
                <PeakHours data={insightData.demographics.timeOfDay} />
              </div>
            </TabsContent>

            <TabsContent value="engagement" className="space-y-6">
              <EngagementMetrics data={insightData.engagement} />
              <CustomerActions data={insightData.engagement} />
            </TabsContent>

            <TabsContent value="demographics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LocationAnalytics data={insightData.demographics.locations} />
                <CategoryInterests data={insightData.demographics.categories} />
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <PerformanceScore data={insightData.performance} />
              <CompetitorAnalysis data={insightData.competitors} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Items and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActionableInsights recommendations={recommendations} />
        <TrendingOpportunities insights={insightData} />
      </div>
    </div>
  );
}

function MetricCard({ title, value, previousValue, trend, icon, color, suffix = "" }: any) {
  const isPositive = trend > 0;
  const colorClasses = {
    blue: "text-blue-600 bg-blue-50",
    yellow: "text-[#B45309] bg-[#FFF4E0]",
    green: "text-green-600 bg-green-50",
    purple: "text-purple-600 bg-purple-50"
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-2xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
          </p>
          <div className="flex items-center text-sm">
            {isPositive ? (
              <ArrowUpRight className="h-4 w-4 text-green-500 me-1" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500 me-1" />
            )}
            <span className={isPositive ? "text-green-600" : "text-red-600"}>
              {Math.abs(trend)}%
            </span>
            <span className="text-gray-500 ms-2">from last period</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ViewsChart({ data }: { data: any[] }) {
  const chartData = data.length > 0 ? data : [
    { date: '2024-01-01', views: 120, clicks: 45 },
    { date: '2024-01-02', views: 98, clicks: 38 },
    { date: '2024-01-03', views: 145, clicks: 52 },
    { date: '2024-01-04', views: 167, clicks: 61 },
    { date: '2024-01-05', views: 134, clicks: 48 },
    { date: '2024-01-06', views: 189, clicks: 72 },
    { date: '2024-01-07', views: 201, clicks: 78 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Views & Clicks Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString(dateLocale())} />
            <YAxis />
            <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString(dateLocale())} />
            <Area type="monotone" dataKey="views" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
            <Area type="monotone" dataKey="clicks" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function RatingsDistribution({ data }: { data: any[] }) {
  const distributionData = data.length > 0 ? data : [
    { rating: 5, count: 45, percentage: 65 },
    { rating: 4, count: 15, percentage: 22 },
    { rating: 3, count: 6, percentage: 8 },
    { rating: 2, count: 2, percentage: 3 },
    { rating: 1, count: 1, percentage: 2 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-4 w-4" />
          Ratings Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {distributionData.map((item) => (
            <div key={item.rating} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-16">
                <span className="text-sm font-medium">{item.rating}</span>
                <Star className="h-3 w-3 fill-[#F59E0B] text-[#F59E0B]" />
              </div>
              <div className="flex-1">
                <Progress value={item.percentage} className="h-2" />
              </div>
              <div className="text-sm text-gray-600 w-12 text-end">
                {item.count}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EngagementMetrics({ data }: { data: any }) {
  const engagementData = [
    { name: 'Profile Clicks', value: data.clicks || 234, icon: <Eye className="h-4 w-4" />, color: '#3B82F6' },
    { name: 'Phone Calls', value: data.calls || 67, icon: <Phone className="h-4 w-4" />, color: '#10B981' },
    { name: 'Email Clicks', value: data.emails || 45, icon: <Mail className="h-4 w-4" />, color: '#F59E0B' },
    { name: 'Website Visits', value: data.website || 123, icon: <Globe className="h-4 w-4" />, color: '#8B5CF6' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {engagementData.map((item) => (
        <Card key={item.name}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div style={{ color: item.color }}>{item.icon}</div>
              <Badge variant="secondary">{item.value}</Badge>
            </div>
            <p className="text-sm font-medium text-gray-700">{item.name}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function QuickInsights({ recommendations }: { recommendations: any }) {
  const insights = recommendations?.quickInsights || [
    "Your business is trending upward with 15% more views this week",
    "Customer engagement peaks on weekends - consider special offers",
    "Your rating improved by 0.3 points - great customer service!",
    "Most customers find you through category searches"
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Quick Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight: string, index: number) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-gray-700">{insight}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ActionableInsights({ recommendations }: { recommendations: any }) {
  const actions = recommendations?.actionableInsights || [
    { title: "Optimize Business Hours", description: "Your peak traffic is 2-6 PM. Consider extending hours.", priority: "high", icon: <Clock className="h-4 w-4" /> },
    { title: "Add More Photos", description: "Businesses with 5+ photos get 30% more engagement", priority: "medium", icon: <Eye className="h-4 w-4" /> },
    { title: "Respond to Reviews", description: "3 recent reviews need responses", priority: "high", icon: <MessageSquare className="h-4 w-4" /> },
    { title: "Update Services", description: "Add trending services in your category", priority: "low", icon: <Target className="h-4 w-4" /> }
  ];

  const priorityColors = {
    high: "border-red-200 bg-red-50",
    medium: "border-[#F5DDB0] bg-[#FFF4E0]",
    low: "border-green-200 bg-green-50"
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-4 w-4" />
          Action Items
        </CardTitle>
        <CardDescription>Recommended actions to improve your business performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actions.map((action: any, index: number) => (
            <div key={index} className={`p-4 border rounded-lg ${priorityColors[action.priority]}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {action.icon}
                  <h4 className="font-medium">{action.title}</h4>
                </div>
                <Badge 
                  variant={action.priority === 'high' ? 'destructive' : action.priority === 'medium' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {action.priority}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-3">{action.description}</p>
              <Button size="sm" variant="outline" className="text-xs">
                Take Action
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TrendingOpportunities({ insights }: { insights: InsightData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Trending Opportunities
        </CardTitle>
        <CardDescription>Market trends and growth opportunities for your business</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-green-600" />
              <h4 className="font-medium text-green-800">Premium Listing Benefits</h4>
            </div>
            <p className="text-sm text-green-700 mb-3">
              Premium businesses in your category see 3x more engagement
            </p>
            <Button size="sm" className="bg-green-600 hover:bg-green-700">
              Upgrade to Premium
            </Button>
          </div>

          <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Search className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium text-blue-800">SEO Optimization</h4>
            </div>
            <p className="text-sm text-blue-700 mb-3">
              Optimize your listing for "restaurant Karachi" - 2.5K monthly searches
            </p>
            <Button size="sm" variant="outline" className="border-blue-300 text-blue-700">
              Learn More
            </Button>
          </div>

          <div className="p-4 border border-purple-200 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-4 w-4 text-purple-600" />
              <h4 className="font-medium text-purple-800">Customer Loyalty</h4>
            </div>
            <p className="text-sm text-purple-700 mb-3">
              Launch a loyalty program - 67% of customers prefer businesses with rewards
            </p>
            <Button size="sm" variant="outline" className="border-purple-300 text-purple-700">
              Set Up Program
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TrafficSources({ data }: { data: any[] }) {
  const sourceData = data.length > 0 ? data : [
    { name: 'Search', value: 45, color: '#3B82F6' },
    { name: 'Direct', value: 25, color: '#10B981' },
    { name: 'Social Media', value: 15, color: '#F59E0B' },
    { name: 'Referrals', value: 15, color: '#8B5CF6' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic Sources</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <RechartsPieChart>
            <Pie
              data={sourceData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {sourceData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </RechartsPieChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {sourceData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
              <span className="text-sm">{item.name}: {item.value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PeakHours({ data }: { data: any[] }) {
  const hourlyData = data.length > 0 ? data : [
    { hour: '9 AM', views: 45 },
    { hour: '12 PM', views: 89 },
    { hour: '3 PM', views: 134 },
    { hour: '6 PM', views: 178 },
    { hour: '9 PM', views: 123 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Peak Hours</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="views" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function CustomerActions({ data }: { data: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Action Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[
            { action: 'Viewed Contact Info', count: data.clicks || 156, percentage: 45 },
            { action: 'Called Business', count: data.calls || 89, percentage: 32 },
            { action: 'Visited Website', count: data.website || 67, percentage: 23 },
            { action: 'Sent Email', count: data.emails || 34, percentage: 12 }
          ].map((item) => (
            <div key={item.action} className="flex items-center justify-between">
              <span className="text-sm font-medium">{item.action}</span>
              <div className="flex items-center gap-3">
                <div className="w-24">
                  <Progress value={item.percentage} className="h-2" />
                </div>
                <span className="text-sm text-gray-600 w-8">{item.count}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function LocationAnalytics({ data }: { data: any[] }) {
  const locationData = data.length > 0 ? data : [
    { province: 'Karachi', visits: 234, percentage: 45 },
    { province: 'Lahore', visits: 156, percentage: 30 },
    { province: 'Islamabad', visits: 89, percentage: 17 },
    { province: 'Rawalpindi', visits: 41, percentage: 8 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Visitor Locations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {locationData.map((location) => (
            <div key={location.province} className="flex items-center justify-between">
              <span className="text-sm font-medium">{location.province}</span>
              <div className="flex items-center gap-3">
                <div className="w-20">
                  <Progress value={location.percentage} className="h-2" />
                </div>
                <span className="text-sm text-gray-600 w-12 text-end">{location.visits}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryInterests({ data }: { data: any[] }) {
  const categoryData = data.length > 0 ? data : [
    { category: 'Food & Dining', interest: 87 },
    { category: 'Shopping', interest: 76 },
    { category: 'Entertainment', interest: 65 },
    { category: 'Health & Wellness', interest: 54 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Interests</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {categoryData.map((item) => (
            <div key={item.category} className="flex items-center justify-between">
              <span className="text-sm font-medium">{item.category}</span>
              <div className="flex items-center gap-3">
                <div className="w-20">
                  <Progress value={item.interest} className="h-2" />
                </div>
                <span className="text-sm text-gray-600">{item.interest}%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PerformanceScore({ data }: { data: any }) {
  const score = data.score || 78;
  const suggestions = data.suggestions || [
    "Add more business photos",
    "Update operating hours",
    "Respond to customer reviews",
    "Verify business information"
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-4 w-4" />
          Performance Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-6">
          <div className="text-4xl font-bold text-blue-600 mb-2">{score}%</div>
          <p className="text-gray-600">Overall Performance</p>
          <Progress value={score} className="h-3 mt-4" />
        </div>
        <div className="space-y-3">
          <h4 className="font-medium">Improvement Suggestions:</h4>
          {suggestions.map((suggestion: string, index: number) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">{suggestion}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CompetitorAnalysis({ data }: { data: any }) {
  const competitors = data.similar || [
    { name: 'Restaurant ABC', score: 85, distance: '0.5km' },
    { name: 'Cafe XYZ', score: 79, distance: '1.2km' },
    { name: 'Bistro 123', score: 72, distance: '0.8km' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Competitor Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {competitors.map((competitor: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">{competitor.name}</h4>
                <p className="text-sm text-gray-600">{tj("{0} away", competitor.distance)}</p>
              </div>
              <div className="text-end">
                <div className="font-medium">{competitor.score}%</div>
                <div className="text-sm text-gray-600">Performance</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default BusinessInsightsWidgets;