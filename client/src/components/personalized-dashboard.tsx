import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BusinessInsightsWidgets } from "./business-insights-widgets";
import { 
  LayoutDashboard,
  TrendingUp,
  Users,
  Star,
  Eye,
  MessageSquare,
  Clock,
  Calendar,
  Award,
  Target,
  Zap,
  BarChart3,
  Settings,
  Plus,
  Filter,
  Download,
  Share2,
  Bookmark,
  Bell,
  Crown,
  Activity
} from "lucide-react";
import { tj } from "@/i18n-jsx/tj";

interface DashboardData {
  user: any;
  businesses: any[];
  overview: {
    totalViews: number;
    totalRating: number;
    totalReviews: number;
    totalEngagement: number;
    growth: {
      views: number;
      rating: number;
      reviews: number;
      engagement: number;
    };
  };
  recentActivity: any[];
  notifications: any[];
  insights: any[];
}

export function PersonalizedDashboard() {
  const { user } = useAuth();
  const [selectedBusiness, setSelectedBusiness] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState("7d");
  const [activeWidget, setActiveWidget] = useState("overview");

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/personalized-dashboard', timeRange],
    retry: false,
  });

  const { data: businessList = [] } = useQuery({
    queryKey: ['/api/dashboard'],
    select: (data) => data?.businesses || [],
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const data: DashboardData = dashboardData || {
    user,
    businesses: businessList,
    overview: {
      totalViews: 0,
      totalRating: 0,
      totalReviews: 0,
      totalEngagement: 0,
      growth: { views: 0, rating: 0, reviews: 0, engagement: 0 }
    },
    recentActivity: [],
    notifications: [],
    insights: []
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-blue-600" />{tj("Welcome back, {0}!", user?.firstName || 'Business Owner')}</h1>
          <p className="text-gray-600 mt-2">
            Here's how your business is performing across PakistanYP
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 me-2" />
            Export
          </Button>
          
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Settings className="h-4 w-4 me-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Business Selector */}
      {businessList.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Business for Detailed Analysis</CardTitle>
            <CardDescription>
              Choose a specific business to view detailed insights and analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                onClick={() => setSelectedBusiness(null)}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedBusiness === null 
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">All Businesses</h3>
                    <p className="text-sm text-gray-600">Combined analytics</p>
                  </div>
                </div>
              </div>
              
              {businessList.map((business: any) => (
                <div
                  key={business.id}
                  onClick={() => setSelectedBusiness(business.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedBusiness === business.id 
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{business.name}</h3>
                    <div className="flex gap-1">
                      {business.isPremium && (
                        <Badge className="bg-[#FFF4E0] text-[#B45309] text-xs">
                          <Crown className="h-3 w-3 me-1" />
                          Premium
                        </Badge>
                      )}
                      {business.isVerified && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{business.locality}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {business.viewCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {business.ratingAverage}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <OverviewCard
          title="Total Views"
          value={data.overview.totalViews}
          growth={data.overview.growth.views}
          icon={<Eye className="h-5 w-5" />}
          color="blue"
        />
        <OverviewCard
          title="Average Rating"
          value={data.overview.totalRating}
          growth={data.overview.growth.rating}
          icon={<Star className="h-5 w-5" />}
          color="yellow"
          suffix="/5"
        />
        <OverviewCard
          title="Total Reviews"
          value={data.overview.totalReviews}
          growth={data.overview.growth.reviews}
          icon={<MessageSquare className="h-5 w-5" />}
          color="green"
        />
        <OverviewCard
          title="Engagement Rate"
          value={data.overview.totalEngagement}
          growth={data.overview.growth.engagement}
          icon={<Activity className="h-5 w-5" />}
          color="purple"
          suffix="%"
        />
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Quick Actions & Notifications */}
        <div className="lg:col-span-1 space-y-6">
          <QuickActionsCard businessCount={businessList.length} />
          <NotificationsCard notifications={data.notifications} />
          <RecentActivityCard activities={data.recentActivity} />
        </div>

        {/* Right Column - Main Analytics */}
        <div className="lg:col-span-2">
          <BusinessInsightsWidgets 
            businessId={selectedBusiness || undefined} 
            timeRange={timeRange}
          />
        </div>
      </div>

      {/* Personalized Insights */}
      <PersonalizedInsights insights={data.insights} user={user} />
    </div>
  );
}

function OverviewCard({ title, value, growth, icon, color, suffix = "" }: any) {
  const isPositive = growth > 0;
  const colorClasses = {
    blue: "text-blue-600 bg-blue-100",
    yellow: "text-[#B45309] bg-[#FFF4E0]",
    green: "text-green-600 bg-green-100",
    purple: "text-purple-600 bg-purple-100"
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
          <div className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{growth}%
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
          </p>
          <p className="text-sm text-gray-600">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionsCard({ businessCount }: { businessCount: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button className="w-full justify-start" variant="outline">
          <Plus className="h-4 w-4 me-2" />
          Add New Business
        </Button>
        <Button className="w-full justify-start" variant="outline">
          <Crown className="h-4 w-4 me-2" />
          Upgrade to Premium
        </Button>
        <Button className="w-full justify-start" variant="outline">
          <Target className="h-4 w-4 me-2" />
          Boost Performance
        </Button>
        <Button className="w-full justify-start" variant="outline">
          <Share2 className="h-4 w-4 me-2" />
          Share Business
        </Button>
      </CardContent>
    </Card>
  );
}

function NotificationsCard({ notifications }: { notifications: any[] }) {
  const sampleNotifications = notifications.length > 0 ? notifications : [
    { id: 1, type: 'review', message: 'New 5-star review received', time: '2 hours ago', unread: true },
    { id: 2, type: 'performance', message: 'Your business views increased by 25%', time: '1 day ago', unread: true },
    { id: 3, type: 'update', message: 'Profile verification completed', time: '3 days ago', unread: false }
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Notifications
        </CardTitle>
        <Badge variant="secondary">{sampleNotifications.filter(n => n.unread).length}</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sampleNotifications.slice(0, 3).map((notification) => (
            <div key={notification.id} className={`p-3 rounded-lg border ${notification.unread ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
              <p className="text-sm font-medium text-gray-900">{notification.message}</p>
              <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
            </div>
          ))}
        </div>
        <Button variant="ghost" className="w-full mt-3 text-sm">
          View All Notifications
        </Button>
      </CardContent>
    </Card>
  );
}

function RecentActivityCard({ activities }: { activities: any[] }) {
  const sampleActivities = activities.length > 0 ? activities : [
    { id: 1, action: 'Business viewed', count: 23, time: 'Today' },
    { id: 2, action: 'Review received', count: 1, time: 'Yesterday' },
    { id: 3, action: 'Profile updated', count: 1, time: '2 days ago' },
    { id: 4, action: 'Photo added', count: 3, time: '1 week ago' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sampleActivities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
              <div>
                <p className="text-sm font-medium">{activity.action}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {activity.count}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PersonalizedInsights({ insights, user }: { insights: any[]; user: any }) {
  const personalizedInsights = insights.length > 0 ? insights : [
    {
      title: "Peak Performance Week",
      description: "Your businesses performed 30% better this week compared to last month average",
      action: "View detailed analytics",
      type: "success"
    },
    {
      title: "Optimization Opportunity",
      description: "Add business hours to increase visibility during peak search times",
      action: "Update hours",
      type: "info"
    },
    {
      title: "Premium Benefits Available",
      description: "Unlock advanced analytics and priority placement with Premium listing",
      action: "Upgrade now",
      type: "premium"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Personalized Insights
        </CardTitle>
        <CardDescription>
          AI-powered recommendations tailored for your business growth
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {personalizedInsights.map((insight, index) => (
            <div key={index} className={`p-4 border rounded-lg ${
              insight.type === 'success' ? 'border-green-200 bg-green-50' :
              insight.type === 'premium' ? 'border-[#F5DDB0] bg-[#FFF4E0]' :
              'border-blue-200 bg-blue-50'
            }`}>
              <h4 className="font-semibold mb-2">{insight.title}</h4>
              <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
              <Button size="sm" variant="outline" className="text-xs">
                {insight.action}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="flex gap-3">
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="lg:col-span-2">
          <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

export default PersonalizedDashboard;