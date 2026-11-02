import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Crown, 
  Star, 
  Shield, 
  Zap,
  Users,
  TrendingUp,
  DollarSign
} from "lucide-react";

type SubscriptionPlan = {
  id: number;
  name: string;
  displayName: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  features: string[];
  limits: {
    listings: number;
    images: number;
    support: string;
    featured_listings: number;
    premium_badge: boolean;
  };
  sortOrder: number;
  isActive: boolean;
  stripeMonthlyPriceId?: string;
  stripeYearlyPriceId?: string;
};

type UserSubscription = {
  id: number;
  userId: string;
  userName: string;
  userEmail: string;
  planId: number;
  planName: string;
  planDisplayName: string;
  status: string;
  billingInterval: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  createdAt: string;
};

const planIcons = {
  free: Star,
  basic: Zap,
  premium: Crown,
  enterprise: Shield,
};

export default function SubscriptionManagement() {
  const [activeTab, setActiveTab] = useState("plans");
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch subscription plans
  const { data: plans = [], isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/admin/subscription-plans"],
  });

  // Fetch user subscriptions
  const { data: subscriptions = [], isLoading: subscriptionsLoading } = useQuery<UserSubscription[]>({
    queryKey: ["/api/admin/user-subscriptions"],
  });

  // Fetch subscription statistics
  const { data: stats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/subscription-stats"],
  });

  // Create plan mutation
  const createPlanMutation = useMutation({
    mutationFn: (planData: Partial<SubscriptionPlan>) => 
      apiRequest("POST", "/api/admin/subscription-plans", planData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      setIsCreateDialogOpen(false);
      toast({ title: "Success", description: "Plan created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create plan", variant: "destructive" });
    },
  });

  // Update plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: ({ id, ...planData }: Partial<SubscriptionPlan> & { id: number }) => 
      apiRequest("PUT", `/api/admin/subscription-plans/${id}`, planData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      setIsEditDialogOpen(false);
      setSelectedPlan(null);
      toast({ title: "Success", description: "Plan updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update plan", variant: "destructive" });
    },
  });

  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/admin/subscription-plans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      toast({ title: "Success", description: "Plan deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete plan", variant: "destructive" });
    },
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: (subscriptionId: number) => 
      apiRequest("POST", `/api/admin/user-subscriptions/${subscriptionId}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user-subscriptions"] });
      toast({ title: "Success", description: "Subscription cancelled successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to cancel subscription", variant: "destructive" });
    },
  });

  const PlanForm = ({ plan, onSubmit }: { plan?: SubscriptionPlan; onSubmit: (data: any) => void }) => {
    const [formData, setFormData] = useState({
      name: plan?.name || "",
      displayName: plan?.displayName || "",
      description: plan?.description || "",
      monthlyPrice: plan?.monthlyPrice || 0,
      yearlyPrice: plan?.yearlyPrice || 0,
      currency: plan?.currency || "PKR",
      features: plan?.features || [],
      limits: plan?.limits || {
        listings: 1,
        images: 3,
        support: "email",
        featured_listings: 0,
        premium_badge: false,
      },
      sortOrder: plan?.sortOrder || 0,
      isActive: plan?.isActive ?? true,
      stripeMonthlyPriceId: plan?.stripeMonthlyPriceId || "",
      stripeYearlyPriceId: plan?.stripeYearlyPriceId || "",
    });

    const [newFeature, setNewFeature] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    const addFeature = () => {
      if (newFeature.trim()) {
        setFormData(prev => ({
          ...prev,
          features: [...prev.features, newFeature.trim()]
        }));
        setNewFeature("");
      }
    };

    const removeFeature = (index: number) => {
      setFormData(prev => ({
        ...prev,
        features: prev.features.filter((_, i) => i !== index)
      }));
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Plan Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="monthlyPrice">Monthly Price</Label>
            <Input
              id="monthlyPrice"
              type="number"
              step="0.01"
              value={formData.monthlyPrice}
              onChange={(e) => setFormData(prev => ({ ...prev, monthlyPrice: parseFloat(e.target.value) }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="yearlyPrice">Yearly Price</Label>
            <Input
              id="yearlyPrice"
              type="number"
              step="0.01"
              value={formData.yearlyPrice}
              onChange={(e) => setFormData(prev => ({ ...prev, yearlyPrice: parseFloat(e.target.value) }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PKR">PKR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Features</Label>
          <div className="space-y-2">
            {formData.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input value={feature} readOnly />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeFeature(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <div className="flex items-center space-x-2">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Add new feature"
              />
              <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="listings">Listings Limit</Label>
            <Input
              id="listings"
              type="number"
              value={formData.limits.listings}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                limits: { ...prev.limits, listings: parseInt(e.target.value) }
              }))}
            />
          </div>
          <div>
            <Label htmlFor="images">Images Limit</Label>
            <Input
              id="images"
              type="number"
              value={formData.limits.images}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                limits: { ...prev.limits, images: parseInt(e.target.value) }
              }))}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>

        <Button type="submit" className="w-full">
          {plan ? "Update Plan" : "Create Plan"}
        </Button>
      </form>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'past_due':
        return 'bg-[#FFF4E0] text-[#B45309]';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Subscribers</p>
                <p className="text-2xl font-bold">{stats.totalSubscribers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold">PKR {stats.monthlyRevenue || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Active Plans</p>
                <p className="text-2xl font-bold">{plans.filter(p => p.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Crown className="w-5 h-5 text-[#B45309]" />
              <div>
                <p className="text-sm text-gray-600">Premium Users</p>
                <p className="text-2xl font-bold">{stats.premiumUsers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          <TabsTrigger value="subscriptions">User Subscriptions</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Subscription Plans</h3>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Plan</DialogTitle>
                </DialogHeader>
                <PlanForm onSubmit={(data) => createPlanMutation.mutate(data)} />
              </DialogContent>
            </Dialog>
          </div>

          {plansLoading ? (
            <div className="text-center py-8">Loading plans...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => {
                const Icon = planIcons[plan.name as keyof typeof planIcons] || Star;
                return (
                  <Card key={plan.id} className={`${plan.isActive ? '' : 'opacity-60'}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Icon className="w-5 h-5 text-blue-500" />
                          <CardTitle className="text-lg">{plan.displayName}</CardTitle>
                        </div>
                        <Badge variant={plan.isActive ? "default" : "secondary"}>
                          {plan.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      <p className="text-sm text-gray-600">{plan.description}</p>
                      
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {plan.monthlyPrice === 0 ? "Free" : `PKR ${plan.monthlyPrice}`}
                        </div>
                        <div className="text-sm text-gray-500">per month</div>
                      </div>

                      <div className="flex space-x-2">
                        <Dialog open={isEditDialogOpen && selectedPlan?.id === plan.id} onOpenChange={setIsEditDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => setSelectedPlan(plan)}
                            >
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Edit Plan</DialogTitle>
                            </DialogHeader>
                            <PlanForm 
                              plan={selectedPlan!} 
                              onSubmit={(data) => updatePlanMutation.mutate({ ...data, id: selectedPlan!.id })} 
                            />
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this plan?")) {
                              deletePlanMutation.mutate(plan.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">User Subscriptions</h3>
          </div>

          {subscriptionsLoading ? (
            <div className="text-center py-8">Loading subscriptions...</div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Billing</TableHead>
                      <TableHead>Current Period</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{subscription.userName}</p>
                            <p className="text-sm text-gray-500">{subscription.userEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{subscription.planDisplayName}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(subscription.status)}>
                            {subscription.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{subscription.billingInterval}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{formatDate(subscription.currentPeriodStart)}</p>
                            <p className="text-gray-500">to {formatDate(subscription.currentPeriodEnd)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {subscription.status === 'active' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm("Are you sure you want to cancel this subscription?")) {
                                  cancelSubscriptionMutation.mutate(subscription.id);
                                }
                              }}
                            >
                              Cancel
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}