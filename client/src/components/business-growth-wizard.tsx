import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, ChevronRight, Target, TrendingUp, BarChart3, Eye, Calendar as CalendarIcon, Plus, Trash2, AlertCircle, CheckCircle, Activity, LineChart as LineChartIcon, PieChart as PieChartIcon, LayoutDashboard } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { BusinessGrowthMetric, BusinessGrowthGoal, BusinessGrowthVisualization, Business } from '@shared/schema';

// Wizard step schemas
const metricSchema = z.object({
  businessId: z.number(),
  metricType: z.enum(['revenue', 'customers', 'orders', 'views', 'ratings']),
  metricValue: z.string().min(1, 'Value is required'),
  targetValue: z.string().optional(),
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  date: z.date(),
  currency: z.string().default('PKR'),
  metadata: z.object({
    source: z.string().optional(),
    category: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
});

const goalSchema = z.object({
  businessId: z.number(),
  goalName: z.string().min(1, 'Goal name is required'),
  goalType: z.enum(['revenue', 'customers', 'market_share', 'expansion']),
  targetValue: z.string().min(1, 'Target value is required'),
  currentValue: z.string().default('0'),
  targetDate: z.date(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string().optional(),
  milestones: z.array(z.object({
    name: z.string(),
    targetValue: z.string(),
    targetDate: z.date(),
    completed: z.boolean().default(false),
  })).optional(),
});

const visualizationSchema = z.object({
  businessId: z.number(),
  visualizationType: z.enum(['line_chart', 'bar_chart', 'pie_chart', 'dashboard']),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  configuration: z.object({
    metrics: z.array(z.string()),
    timeRange: z.string(),
    showTrends: z.boolean(),
    showTargets: z.boolean(),
    colors: z.array(z.string()),
  }),
  dataFilter: z.object({
    dateRange: z.object({
      start: z.date(),
      end: z.date(),
    }),
    metricTypes: z.array(z.string()),
  }).optional(),
  isPublic: z.boolean().default(false),
});

type MetricFormData = z.infer<typeof metricSchema>;
type GoalFormData = z.infer<typeof goalSchema>;
type VisualizationFormData = z.infer<typeof visualizationSchema>;

interface BusinessGrowthWizardProps {
  businessId: number;
  onComplete?: () => void;
}

export default function BusinessGrowthWizard({ businessId, onComplete }: BusinessGrowthWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const queryClient = useQueryClient();

  // Get business data
  const { data: business } = useQuery<Business>({
    queryKey: ['/api/businesses', businessId],
    enabled: !!businessId,
  });

  // Get existing metrics
  const { data: existingMetrics = [] } = useQuery<BusinessGrowthMetric[]>({
    queryKey: ['/api/business-growth/metrics', businessId],
    enabled: !!businessId,
  });

  // Get existing goals
  const { data: existingGoals = [] } = useQuery<BusinessGrowthGoal[]>({
    queryKey: ['/api/business-growth/goals', businessId],
    enabled: !!businessId,
  });

  const steps = [
    {
      id: 'setup',
      title: 'Setup & Introduction',
      description: 'Configure your business growth tracking',
      icon: Activity,
    },
    {
      id: 'metrics',
      title: 'Business Metrics',
      description: 'Track key performance indicators',
      icon: TrendingUp,
    },
    {
      id: 'goals',
      title: 'Growth Goals',
      description: 'Set targets and milestones',
      icon: Target,
    },
    {
      id: 'visualizations',
      title: 'Data Visualizations',
      description: 'Create charts and dashboards',
      icon: BarChart3,
    },
    {
      id: 'review',
      title: 'Review & Launch',
      description: 'Review and activate your dashboard',
      icon: CheckCircle,
    },
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps([...completedSteps, currentStep]);
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepCompleted = (stepIndex: number) => completedSteps.includes(stepIndex);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Business Growth Visualization Wizard
          </CardTitle>
          <p className="text-gray-600">
            Create interactive dashboards to track and visualize your business growth metrics
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Progress</h3>
              <span className="text-sm text-gray-600">{currentStep + 1} of {steps.length}</span>
            </div>
            <Progress value={progress} className="mb-4" />
            
            {/* Step Navigator */}
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div 
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                      index === currentStep 
                        ? "bg-blue-600 border-blue-600 text-white" 
                        : isStepCompleted(index)
                        ? "bg-green-600 border-green-600 text-white"
                        : "border-gray-300 text-gray-500"
                    )}
                  >
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <div className="text-sm font-medium">{step.title}</div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden sm:block w-12 h-px bg-gray-300 mx-4" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="mt-8">
            {currentStep === 0 && (
              <SetupStep 
                business={business} 
                existingMetrics={existingMetrics}
                existingGoals={existingGoals}
                onNext={nextStep}
              />
            )}
            {currentStep === 1 && (
              <MetricsStep 
                businessId={businessId}
                existingMetrics={existingMetrics}
                onNext={nextStep}
                onPrev={prevStep}
              />
            )}
            {currentStep === 2 && (
              <GoalsStep 
                businessId={businessId}
                existingGoals={existingGoals}
                onNext={nextStep}
                onPrev={prevStep}
              />
            )}
            {currentStep === 3 && (
              <VisualizationsStep 
                businessId={businessId}
                onNext={nextStep}
                onPrev={prevStep}
              />
            )}
            {currentStep === 4 && (
              <ReviewStep 
                businessId={businessId}
                onComplete={onComplete}
                onPrev={prevStep}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Setup Step Component
interface SetupStepProps {
  business?: Business;
  existingMetrics: BusinessGrowthMetric[];
  existingGoals: BusinessGrowthGoal[];
  onNext: () => void;
}

function SetupStep({ business, existingMetrics, existingGoals, onNext }: SetupStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Welcome to Business Growth Visualization</h2>
        <p className="text-gray-600 mb-6">
          Let's set up your personalized dashboard to track and visualize your business growth
        </p>
      </div>

      {business && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Business Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Business Name</p>
                <p className="font-medium">{business.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Industry</p>
                <p className="font-medium">{business.categoryId || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-medium">{business.address || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Established</p>
                <p className="font-medium">{business.establishedYear || 'Not specified'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Current Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {existingMetrics.length > 0 ? (
              <div className="space-y-2">
                {existingMetrics.slice(0, 3).map((metric, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm capitalize">{metric.metricType}</span>
                    <Badge variant="secondary">{metric.metricValue}</Badge>
                  </div>
                ))}
                {existingMetrics.length > 3 && (
                  <p className="text-xs text-gray-500">+{existingMetrics.length - 3} more metrics</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No metrics configured yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Active Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {existingGoals.length > 0 ? (
              <div className="space-y-2">
                {existingGoals.slice(0, 3).map((goal, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{goal.goalName}</span>
                    <Badge variant="outline">{goal.status}</Badge>
                  </div>
                ))}
                {existingGoals.length > 3 && (
                  <p className="text-xs text-gray-500">+{existingGoals.length - 3} more goals</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No goals set yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This wizard will help you set up comprehensive business growth tracking with interactive visualizations. 
          You can add metrics, set goals, and create custom dashboards to monitor your progress.
        </AlertDescription>
      </Alert>

      <div className="flex justify-end">
        <Button onClick={onNext} className="bg-blue-600 hover:bg-blue-700">
          Get Started
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Metrics Step Component
interface MetricsStepProps {
  businessId: number;
  existingMetrics: BusinessGrowthMetric[];
  onNext: () => void;
  onPrev: () => void;
}

function MetricsStep({ businessId, existingMetrics, onNext, onPrev }: MetricsStepProps) {
  const [selectedMetric, setSelectedMetric] = useState<BusinessGrowthMetric | null>(null);
  const queryClient = useQueryClient();

  const metricForm = useForm<MetricFormData>({
    resolver: zodResolver(metricSchema),
    defaultValues: {
      businessId,
      metricType: 'revenue',
      metricValue: '',
      targetValue: '',
      period: 'monthly',
      date: new Date(),
      currency: 'PKR',
      metadata: {},
    },
  });

  const addMetricMutation = useMutation({
    mutationFn: async (data: MetricFormData) => {
      const response = await apiRequest('POST', '/api/business-growth/metrics', {
        ...data,
        metricValue: parseFloat(data.metricValue),
        targetValue: data.targetValue ? parseFloat(data.targetValue) : undefined,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-growth/metrics', businessId] });
      metricForm.reset();
    },
  });

  const onSubmitMetric = (data: MetricFormData) => {
    addMetricMutation.mutate(data);
  };

  const metricTypes = [
    { value: 'revenue', label: 'Revenue', description: 'Track total revenue and income' },
    { value: 'customers', label: 'Customers', description: 'Monitor customer acquisition and retention' },
    { value: 'orders', label: 'Orders', description: 'Track order volume and frequency' },
    { value: 'views', label: 'Views', description: 'Monitor profile and listing views' },
    { value: 'ratings', label: 'Ratings', description: 'Track review ratings and feedback' },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Business Metrics</h2>
        <p className="text-gray-600 mb-6">
          Add key performance indicators to track your business growth
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add New Metric Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Metric
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...metricForm}>
              <form onSubmit={metricForm.handleSubmit(onSubmitMetric)} className="space-y-4">
                <FormField
                  control={metricForm.control}
                  name="metricType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Metric Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select metric type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {metricTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-xs text-gray-500">{type.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={metricForm.control}
                    name="metricValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Value</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={metricForm.control}
                    name="targetValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Value (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={metricForm.control}
                    name="period"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Period</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={metricForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={addMetricMutation.isPending}
                >
                  {addMetricMutation.isPending ? 'Adding...' : 'Add Metric'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Existing Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Current Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {existingMetrics.length > 0 ? (
              <div className="space-y-3">
                {existingMetrics.map((metric, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedMetric(metric)}
                  >
                    <div>
                      <div className="font-medium capitalize">{metric.metricType}</div>
                      <div className="text-sm text-gray-500">
                        {metric.metricValue} {metric.currency}
                        {metric.targetValue && ` / ${metric.targetValue}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="capitalize">{metric.period}</Badge>
                      <div className="text-xs text-gray-500 mt-1">
                        {format(new Date(metric.date), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No metrics added yet</p>
                <p className="text-sm">Add your first metric to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button onClick={onNext} disabled={existingMetrics.length === 0}>
          Next Step
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Goals Step Component
interface GoalsStepProps {
  businessId: number;
  existingGoals: BusinessGrowthGoal[];
  onNext: () => void;
  onPrev: () => void;
}

function GoalsStep({ businessId, existingGoals, onNext, onPrev }: GoalsStepProps) {
  const [selectedGoal, setSelectedGoal] = useState<BusinessGrowthGoal | null>(null);
  const [milestones, setMilestones] = useState<Array<{
    name: string;
    targetValue: string;
    targetDate: Date;
    completed: boolean;
  }>>([]);
  const queryClient = useQueryClient();

  const goalForm = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      businessId,
      goalName: '',
      goalType: 'revenue',
      targetValue: '',
      currentValue: '0',
      targetDate: new Date(),
      priority: 'medium',
      description: '',
      milestones: [],
    },
  });

  const addGoalMutation = useMutation({
    mutationFn: async (data: GoalFormData) => {
      const response = await apiRequest('POST', '/api/business-growth/goals', {
        ...data,
        targetValue: parseFloat(data.targetValue),
        currentValue: parseFloat(data.currentValue),
        milestones,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-growth/goals', businessId] });
      goalForm.reset();
      setMilestones([]);
    },
  });

  const onSubmitGoal = (data: GoalFormData) => {
    addGoalMutation.mutate(data);
  };

  const addMilestone = () => {
    setMilestones([...milestones, {
      name: '',
      targetValue: '',
      targetDate: new Date(),
      completed: false,
    }]);
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, field: string, value: any) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const goalTypes = [
    { value: 'revenue', label: 'Revenue Growth', description: 'Increase total revenue' },
    { value: 'customers', label: 'Customer Growth', description: 'Expand customer base' },
    { value: 'market_share', label: 'Market Share', description: 'Capture more market share' },
    { value: 'expansion', label: 'Business Expansion', description: 'Expand operations or locations' },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Growth Goals</h2>
        <p className="text-gray-600 mb-6">
          Set specific, measurable goals to drive your business growth
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add New Goal Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...goalForm}>
              <form onSubmit={goalForm.handleSubmit(onSubmitGoal)} className="space-y-4">
                <FormField
                  control={goalForm.control}
                  name="goalName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goal Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Increase monthly revenue by 25%" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={goalForm.control}
                  name="goalType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goal Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select goal type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {goalTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-xs text-gray-500">{type.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={goalForm.control}
                    name="currentValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Value</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={goalForm.control}
                    name="targetValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Value</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={goalForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={goalForm.control}
                    name="targetDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={goalForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your goal and strategy..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Milestones */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Milestones</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addMilestone}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Milestone
                    </Button>
                  </div>
                  
                  {milestones.map((milestone, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                      <Input
                        placeholder="Milestone name"
                        value={milestone.name}
                        onChange={(e) => updateMilestone(index, 'name', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="Target"
                        value={milestone.targetValue}
                        onChange={(e) => updateMilestone(index, 'targetValue', e.target.value)}
                        className="w-24"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMilestone(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={addGoalMutation.isPending}
                >
                  {addGoalMutation.isPending ? 'Adding...' : 'Add Goal'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Existing Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Current Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {existingGoals.length > 0 ? (
              <div className="space-y-3">
                {existingGoals.map((goal, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedGoal(goal)}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{goal.goalName}</div>
                      <div className="text-sm text-gray-500 capitalize">
                        {goal.goalType} • {goal.priority} priority
                      </div>
                      <div className="text-sm text-gray-500">
                        {goal.currentValue} / {goal.targetValue}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={goal.status === 'completed' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {goal.status}
                      </Badge>
                      <div className="text-xs text-gray-500 mt-1">
                        {format(new Date(goal.targetDate), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No goals set yet</p>
                <p className="text-sm">Add your first goal to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button onClick={onNext}>
          Next Step
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Visualizations Step Component
interface VisualizationsStepProps {
  businessId: number;
  onNext: () => void;
  onPrev: () => void;
}

function VisualizationsStep({ businessId, onNext, onPrev }: VisualizationsStepProps) {
  const [selectedVisualization, setSelectedVisualization] = useState<string>('line_chart');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const visualizationForm = useForm<VisualizationFormData>({
    resolver: zodResolver(visualizationSchema),
    defaultValues: {
      businessId,
      visualizationType: 'line_chart',
      title: '',
      description: '',
      configuration: {
        metrics: [],
        timeRange: '3months',
        showTrends: true,
        showTargets: true,
        colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'],
      },
      dataFilter: {
        dateRange: {
          start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          end: new Date(),
        },
        metricTypes: [],
      },
      isPublic: false,
    },
  });

  const createVisualizationMutation = useMutation({
    mutationFn: async (data: VisualizationFormData) => {
      const response = await apiRequest('POST', '/api/business-growth/visualizations', {
        ...data,
        configuration: {
          ...data.configuration,
          metrics: selectedMetrics,
        },
        dataFilter: {
          ...data.dataFilter,
          metricTypes: selectedMetrics,
        },
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-growth/visualizations', businessId] });
      visualizationForm.reset();
      setSelectedMetrics([]);
    },
  });

  const onSubmitVisualization = (data: VisualizationFormData) => {
    createVisualizationMutation.mutate(data);
  };

  const visualizationTypes = [
    {
      value: 'line_chart',
      label: 'Line Chart',
      description: 'Track trends over time',
      icon: LineChartIcon,
    },
    {
      value: 'bar_chart',
      label: 'Bar Chart',
      description: 'Compare different metrics',
      icon: BarChart3,
    },
    {
      value: 'pie_chart',
      label: 'Pie Chart',
      description: 'Show proportions and percentages',
      icon: PieChartIcon,
    },
    {
      value: 'dashboard',
      label: 'Dashboard',
      description: 'Comprehensive overview',
      icon: LayoutDashboard,
    },
  ];

  const availableMetrics = [
    'revenue',
    'customers',
    'orders',
    'views',
    'ratings',
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Data Visualizations</h2>
        <p className="text-gray-600 mb-6">
          Create interactive charts and dashboards to visualize your business growth
        </p>
      </div>

      <Form {...visualizationForm}>
        <form onSubmit={visualizationForm.handleSubmit(onSubmitVisualization)} className="space-y-6">
          {/* Visualization Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Choose Visualization Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {visualizationTypes.map((type) => (
                  <div
                    key={type.value}
                    className={cn(
                      "p-4 border rounded-lg cursor-pointer transition-colors",
                      selectedVisualization === type.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => {
                      setSelectedVisualization(type.value);
                      visualizationForm.setValue('visualizationType', type.value as any);
                    }}
                  >
                    <span className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-[14px] bg-[#E8F4EC] text-[#0B6B2E]"><type.icon className="h-6 w-6" /></span>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-sm text-gray-500">{type.description}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={visualizationForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chart Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Monthly Revenue Growth" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={visualizationForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what this visualization shows..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <label className="text-sm font-medium mb-3 block">Select Metrics</label>
                  <div className="space-y-2">
                    {availableMetrics.map((metric) => (
                      <div key={metric} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={metric}
                          checked={selectedMetrics.includes(metric)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMetrics([...selectedMetrics, metric]);
                            } else {
                              setSelectedMetrics(selectedMetrics.filter(m => m !== metric));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor={metric} className="text-sm capitalize">
                          {metric}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-3 block">Time Range</label>
                  <Select 
                    defaultValue="3months"
                    onValueChange={(value) => {
                      visualizationForm.setValue('configuration.timeRange', value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1month">Last Month</SelectItem>
                      <SelectItem value="3months">Last 3 Months</SelectItem>
                      <SelectItem value="6months">Last 6 Months</SelectItem>
                      <SelectItem value="1year">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="mb-2 flex justify-center text-[#0B6B2E]">
                      {(() => { const I = visualizationTypes.find(t => t.value === selectedVisualization)?.icon; return I ? <I className="h-10 w-10" /> : null; })()}
                    </div>
                    <div className="font-medium">
                      {visualizationTypes.find(t => t.value === selectedVisualization)?.label}
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      {selectedMetrics.length > 0 
                        ? `${selectedMetrics.length} metrics selected`
                        : 'Select metrics to preview'
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={onPrev}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button 
              type="submit" 
              disabled={createVisualizationMutation.isPending || selectedMetrics.length === 0}
            >
              {createVisualizationMutation.isPending ? 'Creating...' : 'Create Visualization'}
            </Button>
          </div>
        </form>
      </Form>

      <div className="flex justify-center">
        <Button onClick={onNext} variant="outline">
          Skip and Continue
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Review Step Component
interface ReviewStepProps {
  businessId: number;
  onComplete?: () => void;
  onPrev: () => void;
}

function ReviewStep({ businessId, onComplete, onPrev }: ReviewStepProps) {
  const { data: metrics = [] } = useQuery<BusinessGrowthMetric[]>({
    queryKey: ['/api/business-growth/metrics', businessId],
  });

  const { data: goals = [] } = useQuery<BusinessGrowthGoal[]>({
    queryKey: ['/api/business-growth/goals', businessId],
  });

  const { data: visualizations = [] } = useQuery<BusinessGrowthVisualization[]>({
    queryKey: ['/api/business-growth/visualizations', businessId],
  });

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Review & Launch</h2>
        <p className="text-gray-600 mb-6">
          Review your business growth dashboard configuration and launch your tracking system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metrics Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {metrics.length}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Active metrics configured
            </p>
            {metrics.length > 0 && (
              <div className="space-y-2">
                {metrics.slice(0, 3).map((metric, index) => (
                  <div key={index} className="text-sm">
                    <span className="capitalize">{metric.metricType}</span>: {metric.metricValue}
                  </div>
                ))}
                {metrics.length > 3 && (
                  <div className="text-xs text-gray-500">+{metrics.length - 3} more</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goals Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 mb-2">
              {goals.length}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Growth goals set
            </p>
            {goals.length > 0 && (
              <div className="space-y-2">
                {goals.slice(0, 3).map((goal, index) => (
                  <div key={index} className="text-sm">
                    <div className="font-medium">{goal.goalName}</div>
                    <div className="text-xs text-gray-500 capitalize">
                      {goal.priority} priority
                    </div>
                  </div>
                ))}
                {goals.length > 3 && (
                  <div className="text-xs text-gray-500">+{goals.length - 3} more</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Visualizations Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Visualizations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 mb-2">
              {visualizations.length}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Charts and dashboards created
            </p>
            {visualizations.length > 0 && (
              <div className="space-y-2">
                {visualizations.slice(0, 3).map((viz, index) => (
                  <div key={index} className="text-sm">
                    <div className="font-medium">{viz.title}</div>
                    <div className="text-xs text-gray-500 capitalize">
                      {viz.visualizationType.replace('_', ' ')}
                    </div>
                  </div>
                ))}
                {visualizations.length > 3 && (
                  <div className="text-xs text-gray-500">+{visualizations.length - 3} more</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          Your business growth dashboard is ready to launch! You can always add more metrics, 
          goals, and visualizations later from your dashboard.
        </AlertDescription>
      </Alert>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
          <CheckCircle className="mr-2 h-4 w-4" />
          Launch Dashboard
        </Button>
      </div>
    </div>
  );
}