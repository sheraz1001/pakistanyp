import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  ComposedChart,
  RadialBarChart,
  RadialBar,
  ScatterChart,
  Scatter
} from "recharts";
import { 
  TrendingUp, 
  Target, 
  DollarSign, 
  Users, 
  Eye, 
  MousePointer, 
  Plus, 
  Calendar,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Zap,
  Lightbulb,
  Award,
  Flag,
  Download,
  Share2,
  Settings,
  Maximize2,
  Filter,
  RefreshCw,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Layers,
  Map,
  Gauge,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";

interface BusinessGrowthWizardProps {
  businessId: number;
  businessName: string;
}

interface ChartConfig {
  type: 'line' | 'bar' | 'area' | 'pie' | 'composed' | 'radial' | 'scatter';
  dataKey: string[];
  colors: string[];
  title: string;
}

export default function BusinessGrowthVisualizationWizard({ businessId, businessName }: BusinessGrowthWizardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const [selectedDateRange, setSelectedDateRange] = useState({ start: "", end: "" });
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isAddingMetric, setIsAddingMetric] = useState(false);
  const [selectedChart, setSelectedChart] = useState<ChartConfig | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['revenue', 'customers']);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch business metrics with enhanced query parameters
  const { data: metrics = [], isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ['/api/business-analytics/metrics', businessId, selectedPeriod, selectedDateRange],
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Fetch business goals
  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ['/api/business-analytics/goals', businessId],
  });

  // Fetch competitor analysis
  const { data: competitors = [], isLoading: competitorsLoading } = useQuery({
    queryKey: ['/api/business-analytics/competitors', businessId],
  });

  // Fetch growth recommendations
  const { data: recommendations = [], isLoading: recommendationsLoading } = useQuery({
    queryKey: ['/api/business-analytics/recommendations', businessId],
  });

  // Fetch business summary
  const { data: summary = {}, isLoading: summaryLoading } = useQuery({
    queryKey: ['/api/business-analytics/summary', businessId],
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Add new goal mutation
  const addGoalMutation = useMutation({
    mutationFn: async (goalData: any) => {
      return apiRequest('/api/business-analytics/goals', {
        method: 'POST',
        body: { ...goalData, businessId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-analytics/goals', businessId] });
      toast({ title: "Goal added successfully!", description: "Your business goal has been created." });
      setIsAddingGoal(false);
    },
  });

  // Add metric mutation
  const addMetricMutation = useMutation({
    mutationFn: async (metricData: any) => {
      return apiRequest('/api/business-analytics/metrics', {
        method: 'POST',
        body: { ...metricData, businessId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-analytics/metrics', businessId] });
      toast({ title: "Metric added successfully!", description: "Your business metric has been recorded." });
      setIsAddingMetric(false);
    },
  });

  // Update goal mutation
  const updateGoalMutation = useMutation({
    mutationFn: async ({ goalId, ...updateData }: any) => {
      return apiRequest(`/api/business-analytics/goals/${goalId}`, {
        method: 'PUT',
        body: updateData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-analytics/goals', businessId] });
      toast({ title: "Goal updated successfully!", description: "Your business goal has been updated." });
    },
  });

  // Enhanced auto-refresh effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        refetchMetrics();
      }, refreshInterval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval, refetchMetrics]);

  // Chart colors and configurations
  const chartColors = ['#1f4e79', '#e67e22', '#27ae60', '#8e44ad', '#f39c12', '#c0392b', '#16a085', '#e74c3c'];
  
  const chartConfigs = [
    { type: 'line', dataKey: ['revenue'], colors: ['#1f4e79'], title: 'Revenue Trend' },
    { type: 'bar', dataKey: ['customers'], colors: ['#27ae60'], title: 'Customer Growth' },
    { type: 'area', dataKey: ['views', 'leads'], colors: ['#e67e22', '#8e44ad'], title: 'Traffic & Leads' },
    { type: 'composed', dataKey: ['revenue', 'customers'], colors: ['#1f4e79', '#27ae60'], title: 'Revenue vs Customers' },
  ];

  // Enhanced mock data with more comprehensive metrics
  const mockMetrics = [
    { name: 'Jan', views: 1200, leads: 45, revenue: 15000, customers: 25, conversionRate: 3.8, satisfaction: 4.2 },
    { name: 'Feb', views: 1400, leads: 52, revenue: 18000, customers: 30, conversionRate: 3.7, satisfaction: 4.3 },
    { name: 'Mar', views: 1600, leads: 60, revenue: 22000, customers: 35, conversionRate: 3.9, satisfaction: 4.1 },
    { name: 'Apr', views: 1350, leads: 48, revenue: 19500, customers: 28, conversionRate: 3.6, satisfaction: 4.4 },
    { name: 'May', views: 1800, leads: 65, revenue: 25000, customers: 40, conversionRate: 4.1, satisfaction: 4.5 },
    { name: 'Jun', views: 2000, leads: 75, revenue: 28000, customers: 45, conversionRate: 4.2, satisfaction: 4.6 },
  ];

  const mockGoalProgress = [
    { name: 'Revenue Target', current: 185000, target: 300000, unit: 'PKR', progress: 62 },
    { name: 'New Customers', current: 203, target: 500, unit: 'customers', progress: 41 },
    { name: 'Website Views', current: 12500, target: 20000, unit: 'views', progress: 63 },
    { name: 'Lead Generation', current: 345, target: 600, unit: 'leads', progress: 58 },
  ];

  const mockCompetitorData = [
    { name: 'Competitor A', marketShare: 25, rating: 4.2, priceRange: 'High' },
    { name: 'Competitor B', marketShare: 18, rating: 3.8, priceRange: 'Medium' },
    { name: 'Competitor C', marketShare: 15, rating: 4.0, priceRange: 'Low' },
    { name: 'Your Business', marketShare: 12, rating: 4.5, priceRange: 'Medium' },
  ];

  // Enhanced toolbar component
  const renderToolbar = () => (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg mb-6">
      <div className="flex items-center gap-3">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={selectedDateRange.start}
            onChange={(e) => setSelectedDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="w-40"
          />
          <span className="text-gray-500">to</span>
          <Input
            type="date"
            value={selectedDateRange.end}
            onChange={(e) => setSelectedDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="w-40"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setComparisonMode(!comparisonMode)}
          className={comparisonMode ? "bg-blue-100" : ""}
        >
          <Layers className="w-4 h-4 mr-2" />
          Compare
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={autoRefresh ? "bg-green-100" : ""}
        >
          {autoRefresh ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
          Auto Refresh
        </Button>

        <Button variant="outline" size="sm" onClick={() => refetchMetrics()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>

        <Button variant="outline" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
          <Maximize2 className="w-4 h-4 mr-2" />
          {isFullscreen ? 'Exit' : 'Fullscreen'}
        </Button>

        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>

        <Button variant="outline" size="sm">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </div>
    </div>
  );

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {renderToolbar()}
      
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">PKR {summary.totalRevenue?.toLocaleString() || '185K'}</p>
                <p className="text-xs text-gray-500 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12% from last month
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-[#0B6B2E]"></div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-blue-600">{summary.totalCustomers?.toLocaleString() || '203'}</p>
                <p className="text-xs text-gray-500 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +8% from last month
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-[#0B6B2E]"></div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Website Views</p>
                <p className="text-2xl font-bold text-purple-600">{summary.totalViews?.toLocaleString() || '12.5K'}</p>
                <p className="text-xs text-gray-500 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +15% from last month
                </p>
              </div>
              <Eye className="w-8 h-8 text-purple-600" />
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-[#0B6B2E]"></div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-[#B45309]">{summary.conversionRate || '2.8'}%</p>
                <p className="text-xs text-gray-500 flex items-center">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  -0.3% from last month
                </p>
              </div>
              <MousePointer className="w-8 h-8 text-[#B45309]" />
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-[#0B6B2E]"></div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Chart Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        {chartConfigs.map((config, index) => (
          <Card 
            key={index}
            className={`cursor-pointer transition-all ${selectedChart?.title === config.title ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'}`}
            onClick={() => setSelectedChart(config)}
          >
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-[#0B6B2E] flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <h4 className="text-sm font-medium">{config.title}</h4>
              <p className="text-xs text-gray-500 capitalize">{config.type} chart</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dynamic Performance Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {selectedChart?.title || 'Performance Trends'}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsAddingMetric(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Metric
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Configure
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {selectedChart?.type === 'line' ? (
                <LineChart data={mockMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  {selectedChart.dataKey.map((key, index) => (
                    <Line 
                      key={key}
                      type="monotone" 
                      dataKey={key} 
                      stroke={selectedChart.colors[index] || chartColors[index]} 
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              ) : selectedChart?.type === 'bar' ? (
                <BarChart data={mockMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  {selectedChart.dataKey.map((key, index) => (
                    <Bar 
                      key={key}
                      dataKey={key} 
                      fill={selectedChart.colors[index] || chartColors[index]} 
                    />
                  ))}
                </BarChart>
              ) : selectedChart?.type === 'composed' ? (
                <ComposedChart data={mockMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey={selectedChart.dataKey[0]} fill={selectedChart.colors[0]} />
                  <Line type="monotone" dataKey={selectedChart.dataKey[1]} stroke={selectedChart.colors[1]} strokeWidth={2} />
                </ComposedChart>
              ) : (
                <AreaChart data={mockMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  {selectedChart?.dataKey?.map((key, index) => (
                    <Area 
                      key={key}
                      type="monotone" 
                      dataKey={key} 
                      stackId={index + 1}
                      stroke={selectedChart.colors[index] || chartColors[index]} 
                      fill={selectedChart.colors[index] || chartColors[index]} 
                      fillOpacity={0.6} 
                    />
                  )) || (
                    <>
                      <Area type="monotone" dataKey="revenue" stackId="1" stroke="#1f4e79" fill="#1f4e79" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="views" stackId="2" stroke="#e67e22" fill="#e67e22" fillOpacity={0.6} />
                    </>
                  )}
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderGoalsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Business Goals & Progress</h3>
          <p className="text-sm text-gray-600">Track and manage your business objectives</p>
        </div>
        <Button onClick={() => setIsAddingGoal(true)} className="bg-pk-gold hover:bg-pk-navy">
          <Plus className="w-4 h-4 mr-2" />
          Add Goal
        </Button>
      </div>

      {/* Goals Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="text-center">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">{summary.activeGoals || 4}</div>
            <div className="text-sm text-gray-600">Active Goals</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">{summary.goalsCompleted || 2}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-[#B45309]">67%</div>
            <div className="text-sm text-gray-600">Avg Progress</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {mockGoalProgress.map((goal, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    goal.progress >= 70 ? 'bg-green-100' : goal.progress >= 40 ? 'bg-[#FFF4E0]' : 'bg-red-100'
                  }`}>
                    <Target className={`w-5 h-5 ${
                      goal.progress >= 70 ? 'text-green-600' : goal.progress >= 40 ? 'text-[#B45309]' : 'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <h4 className="font-semibold">{goal.name}</h4>
                    <p className="text-sm text-gray-500">Target date: Dec 31, 2024</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={goal.progress >= 70 ? "default" : goal.progress >= 40 ? "secondary" : "destructive"}>
                    {goal.progress}% Complete
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Current: <span className="font-semibold">{goal.current.toLocaleString()} {goal.unit}</span></span>
                  <span>Target: <span className="font-semibold">{goal.target.toLocaleString()} {goal.unit}</span></span>
                </div>
                <Progress value={goal.progress} className="h-3" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Started: Jan 1, 2024</span>
                  <span>{goal.progress >= 70 ? 'On track' : goal.progress >= 40 ? 'Behind schedule' : 'Needs attention'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isAddingGoal} onOpenChange={setIsAddingGoal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Business Goal</DialogTitle>
          </DialogHeader>
          <AddGoalForm onSubmit={(data) => addGoalMutation.mutate(data)} />
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#1f4e79" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Customer Growth */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="customers" fill="#27ae60" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Competitive Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Market Position</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockCompetitorData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="marketShare"
                  label={({ name, marketShare }) => `${name}: ${marketShare}%`}
                >
                  {mockCompetitorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderRecommendationsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-[#F59E0B]" />
            AI-Powered Growth Recommendations
          </h3>
          <p className="text-sm text-gray-600">Personalized insights to accelerate your business growth</p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Generate New
        </Button>
      </div>

      {/* Recommendation Categories */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {['Marketing', 'Operations', 'Finance', 'Customer Service'].map((category, index) => (
          <Card key={category} className="text-center cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center ${
                index === 0 ? 'bg-blue-100 text-blue-600' : 
                index === 1 ? 'bg-green-100 text-green-600' :
                index === 2 ? 'bg-purple-100 text-purple-600' : 'bg-[#FFF4E0] text-[#B45309]'
              }`}>
                {index === 0 ? <TrendingUp className="w-4 h-4" /> :
                 index === 1 ? <Settings className="w-4 h-4" /> :
                 index === 2 ? <DollarSign className="w-4 h-4" /> : <Users className="w-4 h-4" />}
              </div>
              <div className="text-sm font-medium">{category}</div>
              <div className="text-xs text-gray-500">{index + 1} recommendations</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6">
        {[
          {
            category: "Marketing",
            title: "Optimize Social Media Presence",
            description: "Increase posting frequency and engagement on Instagram and LinkedIn to boost brand visibility by 25-40%.",
            priority: "High",
            impact: "High",
            effort: "Medium",
            estimatedROI: "300%",
            timeframe: "2-3 months",
            steps: ["Conduct social media audit", "Create content calendar", "Increase posting frequency", "Track engagement metrics"]
          },
          {
            category: "Operations",
            title: "Implement Customer Feedback System",
            description: "Set up automated review collection to improve service quality and online reputation, potentially increasing retention by 15-20%.",
            priority: "Medium",
            impact: "High", 
            effort: "Low",
            estimatedROI: "250%",
            timeframe: "4-6 weeks",
            steps: ["Choose feedback platform", "Set up automation", "Train staff", "Monitor trends"]
          },
          {
            category: "Finance",
            title: "Diversify Revenue Streams",
            description: "Explore subscription-based services or complementary products to create recurring revenue opportunities.",
            priority: "High",
            impact: "High",
            effort: "High",
            estimatedROI: "400%",
            timeframe: "3-6 months",
            steps: ["Market research", "Develop packages", "Test with pilot customers", "Launch and scale"]
          }
        ].map((rec, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-xs">{rec.category}</Badge>
                    <Badge 
                      variant={rec.priority === 'High' ? 'destructive' : rec.priority === 'Medium' ? 'secondary' : 'default'}
                      className="text-xs"
                    >
                      {rec.priority} Priority
                    </Badge>
                    <Badge variant="outline" className="text-xs">{rec.timeframe}</Badge>
                  </div>
                  
                  <h4 className="font-semibold text-lg mb-2">{rec.title}</h4>
                  <p className="text-gray-600 mb-4">{rec.description}</p>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span>Impact: <span className="font-medium">{rec.impact}</span></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="w-4 h-4" />
                      <span>Effort: <span className="font-medium">{rec.effort}</span></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      <span>Est. ROI: <span className="font-medium">{rec.estimatedROI}</span></span>
                    </div>
                  </div>
                </div>
                
                <Button variant="outline" size="sm">
                  <Flag className="w-4 h-4 mr-1" />
                  Implement
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Growth Dashboard</h1>
          <p className="text-gray-600 mt-1">{businessName} - Analytics & Insights</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Goals
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <PieChartIcon className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            AI Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">{renderOverviewTab()}</TabsContent>
        <TabsContent value="goals">{renderGoalsTab()}</TabsContent>
        <TabsContent value="analytics">{renderAnalyticsTab()}</TabsContent>
        <TabsContent value="recommendations">{renderRecommendationsTab()}</TabsContent>
      </Tabs>
    </div>
  );
}

// Add Goal Form Component
function AddGoalForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    goalType: '',
    title: '',
    description: '',
    targetValue: '',
    unit: '',
    deadline: '',
    priority: 'medium'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="goalType">Goal Type</Label>
        <Select value={formData.goalType} onValueChange={(value) => setFormData({ ...formData, goalType: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select goal type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="revenue">Revenue</SelectItem>
            <SelectItem value="customers">Customers</SelectItem>
            <SelectItem value="views">Website Views</SelectItem>
            <SelectItem value="leads">Lead Generation</SelectItem>
            <SelectItem value="expansion">Business Expansion</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="title">Goal Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter goal title"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe your goal"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="targetValue">Target Value</Label>
          <Input
            id="targetValue"
            type="number"
            value={formData.targetValue}
            onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
            placeholder="Enter target value"
            required
          />
        </div>
        <div>
          <Label htmlFor="unit">Unit</Label>
          <Input
            id="unit"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            placeholder="PKR, customers, views, etc."
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="deadline">Deadline</Label>
        <Input
          id="deadline"
          type="date"
          value={formData.deadline}
          onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="priority">Priority</Label>
        <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full bg-pk-gold hover:bg-pk-navy">
        Create Goal
      </Button>
    </form>
  );
}