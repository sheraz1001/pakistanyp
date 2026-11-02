import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Users, UserCheck, UserX, UserPlus, Activity, MapPin, 
  Calendar, Clock, TrendingUp, TrendingDown, Eye, 
  Mail, Phone, Globe, Shield, Crown, Zap,
  RefreshCw, Download, Filter, Search
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  verifiedUsers: number;
  premiumUsers: number;
  businessOwners: number;
  userGrowthRate: number;
  averageSessionDuration: number;
  registrationTrends: Array<{
    date: string;
    count: number;
    cumulative: number;
  }>;
  usersByProvince: Array<{
    province: string;
    count: number;
    percentage: number;
  }>;
  userTypes: Array<{
    type: string;
    count: number;
    color: string;
  }>;
  activityMetrics: Array<{
    hour: string;
    logins: number;
    sessions: number;
    activeUsers: number;
  }>;
  engagementStats: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    retentionRate: number;
  };
}

const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#8B5CF6',
  secondary: '#6B7280'
};

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6B7280'];

export const UserAnalytics: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');
  const { toast } = useToast();

  const { 
    data: analytics, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['/api/admin/user-analytics', timeRange],
    queryFn: () => apiRequest('GET', `/api/admin/user-analytics?range=${timeRange}`),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Analytics Refreshed",
        description: "User analytics data has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh user analytics data.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "User analytics report export has been initiated.",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">User Analytics</h2>
          <div className="flex items-center gap-2">
            <div className="w-20 h-8 bg-gray-200 animate-pulse rounded"></div>
            <div className="w-8 h-8 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
        
        {/* Loading skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg border animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded mb-4"></div>
              <div className="w-16 h-6 bg-gray-200 rounded mb-2"></div>
              <div className="w-24 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
        
        <div className="bg-white p-6 rounded-lg border animate-pulse">
          <div className="w-48 h-6 bg-gray-200 rounded mb-4"></div>
          <div className="w-full h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">User Analytics</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <Activity className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-semibold mb-2">Failed to Load Analytics</p>
              <p className="mb-4">Unable to fetch user analytics data.</p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const data = analytics as UserAnalytics;

  // Provide default data structure to prevent crashes
  const safeData = {
    totalUsers: data?.totalUsers || 0,
    activeUsers: data?.activeUsers || 0,
    newUsers: data?.newUsers || 0,
    verifiedUsers: data?.verifiedUsers || 0,
    premiumUsers: data?.premiumUsers || 0,
    businessOwners: data?.businessOwners || 0,
    userGrowthRate: data?.userGrowthRate || 0,
    averageSessionDuration: data?.averageSessionDuration || 0,
    registrationTrends: data?.registrationTrends || [],
    usersByProvince: data?.usersByProvince || [],
    userTypes: data?.userTypes || [],
    activityMetrics: data?.activityMetrics || [],
    engagementStats: data?.engagementStats || {
      dailyActiveUsers: 0,
      weeklyActiveUsers: 0,
      monthlyActiveUsers: 0,
      retentionRate: 0
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Analytics</h2>
          <p className="text-gray-600">Comprehensive user insights and engagement metrics</p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{safeData.totalUsers.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  {safeData.userGrowthRate >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${safeData.userGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {safeData.userGrowthRate >= 0 ? '+' : ''}{safeData.userGrowthRate.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{safeData.activeUsers.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {safeData.totalUsers > 0 ? ((safeData.activeUsers / safeData.totalUsers) * 100).toFixed(1) : 0}% of total
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Users</p>
                <p className="text-2xl font-bold text-gray-900">{safeData.newUsers.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-1">This {timeRange}</p>
              </div>
              <div className="p-3 bg-[#FFF4E0] rounded-full">
                <UserPlus className="h-6 w-6 text-[#B45309]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Premium Users</p>
                <p className="text-2xl font-bold text-gray-900">{safeData.premiumUsers.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {safeData.totalUsers > 0 ? ((safeData.premiumUsers / safeData.totalUsers) * 100).toFixed(1) : 0}% conversion
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Crown className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Verified Users</p>
                <p className="text-2xl font-bold text-gray-900">{safeData.verifiedUsers.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {safeData.totalUsers > 0 ? ((safeData.verifiedUsers / safeData.totalUsers) * 100).toFixed(1) : 0}% verified
                </p>
              </div>
              <div className="p-3 bg-teal-100 rounded-full">
                <Shield className="h-6 w-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Business Owners</p>
                <p className="text-2xl font-bold text-gray-900">{safeData.businessOwners.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {safeData.totalUsers > 0 ? ((safeData.businessOwners / safeData.totalUsers) * 100).toFixed(1) : 0}% of users
                </p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <Globe className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Daily Active</p>
                <p className="text-2xl font-bold text-gray-900">{safeData.engagementStats.dailyActiveUsers.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-1">Last 24 hours</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <Activity className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Retention Rate</p>
                <p className="text-2xl font-bold text-gray-900">{safeData.engagementStats.retentionRate.toFixed(1)}%</p>
                <p className="text-sm text-gray-500 mt-1">7-day retention</p>
              </div>
              <div className="p-3 bg-pink-100 rounded-full">
                <Zap className="h-6 w-6 text-pink-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="growth">Growth Trends</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
          <TabsTrigger value="activity">Activity Patterns</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Types Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Types Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={safeData.userTypes}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ payload, percent }) => `${payload?.type ?? payload?.name ?? ""}: ${Math.round((percent ?? 0) * 100)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {safeData.userTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Engagement Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Engagement Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Daily Active Users</span>
                      <span>{safeData.engagementStats.dailyActiveUsers}/{safeData.totalUsers}</span>
                    </div>
                    <Progress value={safeData.totalUsers > 0 ? (safeData.engagementStats.dailyActiveUsers / safeData.totalUsers) * 100 : 0} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Weekly Active Users</span>
                      <span>{safeData.engagementStats.weeklyActiveUsers}/{safeData.totalUsers}</span>
                    </div>
                    <Progress value={safeData.totalUsers > 0 ? (safeData.engagementStats.weeklyActiveUsers / safeData.totalUsers) * 100 : 0} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Monthly Active Users</span>
                      <span>{safeData.engagementStats.monthlyActiveUsers}/{safeData.totalUsers}</span>
                    </div>
                    <Progress value={safeData.totalUsers > 0 ? (safeData.engagementStats.monthlyActiveUsers / safeData.totalUsers) * 100 : 0} />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">{safeData.engagementStats.retentionRate.toFixed(1)}%</p>
                    <p className="text-sm text-gray-600">Retention Rate</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{safeData.averageSessionDuration.toFixed(1)}min</p>
                    <p className="text-sm text-gray-600">Avg Session</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Growth Trends Tab */}
        <TabsContent value="growth" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                User Registration Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={safeData.registrationTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stackId="1"
                      stroke={COLORS.primary}
                      fill={COLORS.primary}
                      fillOpacity={0.3}
                      name="New Registrations"
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulative"
                      stroke={COLORS.success}
                      strokeWidth={2}
                      name="Cumulative Users"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geographic Tab */}
        <TabsContent value="geographic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Users by Provinces
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={safeData.usersByProvince} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="province" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="count" fill={COLORS.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-6 space-y-2">
                {safeData.usersByProvince.map((province, index) => (
                  <div key={province.province} className="flex items-center justify-between p-2 border rounded">
                    <span className="font-medium">{province.province}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{province.count} users</span>
                      <Badge variant="secondary">{province.percentage.toFixed(1)}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Patterns Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Hourly Activity Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={safeData.activityMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="logins"
                      stroke={COLORS.primary}
                      strokeWidth={2}
                      name="Logins"
                    />
                    <Line
                      type="monotone"
                      dataKey="sessions"
                      stroke={COLORS.success}
                      strokeWidth={2}
                      name="Sessions"
                    />
                    <Line
                      type="monotone"
                      dataKey="activeUsers"
                      stroke={COLORS.warning}
                      strokeWidth={2}
                      name="Active Users"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Engagement Levels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Highly Engaged</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{Math.floor(safeData.totalUsers * 0.15)}</p>
                      <p className="text-sm text-gray-600">15% of users</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-[#B45309] rounded-full"></div>
                      <span className="font-medium">Moderately Engaged</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{Math.floor(safeData.totalUsers * 0.35)}</p>
                      <p className="text-sm text-gray-600">35% of users</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="font-medium">Low Engagement</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{Math.floor(safeData.totalUsers * 0.5)}</p>
                      <p className="text-sm text-gray-600">50% of users</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Mail className="mr-2 h-4 w-4" />
                    Send Re-engagement Campaign
                  </Button>
                  
                  <Button className="w-full justify-start" variant="outline">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Target Inactive Users
                  </Button>
                  
                  <Button className="w-full justify-start" variant="outline">
                    <Crown className="mr-2 h-4 w-4" />
                    Promote Premium Features
                  </Button>
                  
                  <Button className="w-full justify-start" variant="outline">
                    <Eye className="mr-2 h-4 w-4" />
                    View Detailed Reports
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserAnalytics;