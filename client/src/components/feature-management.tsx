import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { 
  Zap, Eye, Plus, Edit, Trash2, ExternalLink, Settings, 
  Shield, Code, TestTube, Lightbulb, CheckCircle, AlertCircle,
  Clock, Cpu, RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { FeatureFlag, InsertFeatureFlag } from "@shared/schema";
import { t as tx } from "@shared/i18n";
import { tj } from "@/i18n-jsx/tj";

interface FeatureManagementProps {
  userId?: string;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "ai": return <Cpu className="h-4 w-4" />;
    case "admin": return <Shield className="h-4 w-4" />;
    case "demo": return <TestTube className="h-4 w-4" />;
    case "content": return <Edit className="h-4 w-4" />;
    case "experimental": return <Lightbulb className="h-4 w-4" />;
    default: return <Zap className="h-4 w-4" />;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed": return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "in_progress": return <Clock className="h-4 w-4 text-[#B45309]" />;
    case "planned": return <AlertCircle className="h-4 w-4 text-blue-500" />;
    default: return <CheckCircle className="h-4 w-4 text-green-500" />;
  }
};

export default function FeatureManagement({ userId }: FeatureManagementProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [showCreateFeature, setShowCreateFeature] = useState(false);
  const [editingFeature, setEditingFeature] = useState<FeatureFlag | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all feature flags
  const { data: features = [], isLoading: featuresLoading, refetch } = useQuery({
    queryKey: ["/api/admin/feature-flags"],
    queryFn: async () => {
      const response = await fetch("/api/admin/feature-flags", {
        credentials: 'include'
      });
      if (!response.ok) return [];
      return response.json() as Promise<FeatureFlag[]>;
    },
    retry: false
  });

  // Create feature flag mutation
  const createFeatureMutation = useMutation({
    mutationFn: (data: InsertFeatureFlag) => apiRequest("POST", "/api/admin/feature-flags", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feature-flags"] });
      setShowCreateFeature(false);
      toast({ title: "Feature flag created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error creating feature flag", description: error.message, variant: "destructive" });
    }
  });

  // Update feature flag mutation
  const updateFeatureMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertFeatureFlag> }) => 
      apiRequest("PATCH", `/api/admin/feature-flags/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feature-flags"] });
      setEditingFeature(null);
      toast({ title: "Feature flag updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error updating feature flag", description: error.message, variant: "destructive" });
    }
  });

  // Toggle feature flag mutation
  const toggleFeatureMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/admin/feature-flags/${id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feature-flags"] });
      toast({ title: "Feature flag toggled successfully" });
    },
    onError: (error) => {
      toast({ title: "Error toggling feature flag", description: error.message, variant: "destructive" });
    }
  });

  // Delete feature flag mutation
  const deleteFeatureMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/feature-flags/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feature-flags"] });
      toast({ title: "Feature flag deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting feature flag", description: error.message, variant: "destructive" });
    }
  });

  // Initialize default features mutation
  const initializeFeaturesMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/feature-flags/initialize"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feature-flags"] });
      toast({ title: "Default feature flags initialized successfully" });
    },
    onError: (error) => {
      toast({ title: "Error initializing features", description: error.message, variant: "destructive" });
    }
  });

  // Filter features based on category and search
  const filteredFeatures = features.filter(feature => {
    const matchesCategory = filterCategory === "all" || feature.category === filterCategory;
    const matchesSearch = searchQuery === "" || 
      feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.key.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Get category counts
  const categoryCounts = features.reduce((acc, feature) => {
    acc[feature.category || "general"] = (acc[feature.category || "general"] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const FeatureForm = ({ feature, onSubmit, isLoading }: { 
    feature?: FeatureFlag | null; 
    onSubmit: (data: InsertFeatureFlag) => void;
    isLoading: boolean;
  }) => {
    const [formData, setFormData] = useState<InsertFeatureFlag>({
      name: feature?.name || "",
      key: feature?.key || "",
      description: feature?.description || "",
      isEnabled: feature?.isEnabled || false,
      category: feature?.category || "general",
      demoUrl: feature?.demoUrl || "",
      implementationStatus: feature?.implementationStatus || "completed",
      dependencies: feature?.dependencies || [],
      metadata: feature?.metadata || {}
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Feature Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Business Card Scanner"
              required
            />
          </div>
          <div>
            <Label htmlFor="key">Feature Key</Label>
            <Input
              id="key"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              placeholder="business_card_scanner"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description || ""}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="AI-powered business card scanning with OpenAI vision API..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="ai">AI Features</SelectItem>
                <SelectItem value="admin">Admin Tools</SelectItem>
                <SelectItem value="demo">Demos</SelectItem>
                <SelectItem value="content">Content Management</SelectItem>
                <SelectItem value="experimental">Experimental</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Implementation Status</Label>
            <Select value={formData.implementationStatus} onValueChange={(value) => setFormData({ ...formData, implementationStatus: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse pt-6">
            <Switch
              id="enabled"
              checked={formData.isEnabled}
              onCheckedChange={(checked) => setFormData({ ...formData, isEnabled: checked })}
            />
            <Label htmlFor="enabled">Enabled</Label>
          </div>
        </div>

        <div>
          <Label htmlFor="demoUrl">Demo URL (optional)</Label>
          <Input
            id="demoUrl"
            value={formData.demoUrl || ""}
            onChange={(e) => setFormData({ ...formData, demoUrl: e.target.value })}
            placeholder="/business-card-scanner"
          />
        </div>

        <DialogFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin me-2" /> : null}
            {feature ? "Update Feature" : "Create Feature"}
          </Button>
        </DialogFooter>
      </form>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Feature Management</h2>
          <p className="text-muted-foreground">Manage platform features and enable/disable functionality</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => initializeFeaturesMutation.mutate()}
            disabled={initializeFeaturesMutation.isPending}
          >
            {initializeFeaturesMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin me-2" /> : null}
            Initialize Defaults
          </Button>
          <Dialog open={showCreateFeature} onOpenChange={setShowCreateFeature}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 me-2" />
                Add Feature
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Feature Flag</DialogTitle>
                <DialogDescription>
                  Add a new feature that can be enabled or disabled across the platform.
                </DialogDescription>
              </DialogHeader>
              <FeatureForm 
                onSubmit={(data) => createFeatureMutation.mutate(data)}
                isLoading={createFeatureMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Feature Overview</TabsTrigger>
          <TabsTrigger value="management">Feature Management</TabsTrigger>
          <TabsTrigger value="analytics">Usage Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Features</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{features.length}</div>
                <p className="text-xs text-muted-foreground">Platform features</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Enabled Features</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {features.filter(f => f.isEnabled).length}
                </div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Features</CardTitle>
                <Cpu className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {categoryCounts.ai || 0}
                </div>
                <p className="text-xs text-muted-foreground">AI-powered tools</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Demo Features</CardTitle>
                <TestTube className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {categoryCounts.demo || 0}
                </div>
                <p className="text-xs text-muted-foreground">Demonstration tools</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(categoryCounts).map(([category, count]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 capitalize">{tj("{0}{1} Features", getCategoryIcon(category), category)}<Badge variant="secondary">{count}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {features
                      .filter(f => f.category === category)
                      .map(feature => (
                        <div key={feature.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(feature.implementationStatus || "completed")}
                            <span className="font-medium">{feature.name}</span>
                            {feature.isEnabled ? (
                              <Badge className="bg-green-500">Enabled</Badge>
                            ) : (
                              <Badge variant="secondary">Disabled</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {feature.demoUrl && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={feature.demoUrl} target="_blank" rel="noopener noreferrer">
                                  <Eye className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            <Switch
                              checked={feature.isEnabled}
                              onCheckedChange={() => toggleFeatureMutation.mutate(feature.id)}
                              disabled={toggleFeatureMutation.isPending}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="management" className="space-y-6">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="max-w-sm">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="ai">AI Features</SelectItem>
                <SelectItem value="admin">Admin Tools</SelectItem>
                <SelectItem value="demo">Demos</SelectItem>
                <SelectItem value="content">Content Management</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="experimental">Experimental</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feature</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFeatures.map((feature) => (
                    <TableRow key={feature.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{feature.name}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-md">
                            {feature.description}
                          </div>
                          <div className="text-xs text-muted-foreground">{tj("Key: {0}", feature.key)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          {getCategoryIcon(feature.category || "general")}
                          {feature.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(feature.implementationStatus || "completed")}
                          <span className="capitalize">{feature.implementationStatus?.replace("_", " ")}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={feature.isEnabled}
                          onCheckedChange={() => toggleFeatureMutation.mutate(feature.id)}
                          disabled={toggleFeatureMutation.isPending}
                        />
                      </TableCell>
                      <TableCell>
                        {feature.updatedAt ? format(new Date(feature.updatedAt), "MMM d, yyyy") : "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {feature.demoUrl && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={feature.demoUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setEditingFeature(feature)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Edit Feature Flag</DialogTitle>
                                <DialogDescription>
                                  Update the feature configuration and settings.
                                </DialogDescription>
                              </DialogHeader>
                              <FeatureForm 
                                feature={feature}
                                onSubmit={(data) => updateFeatureMutation.mutate({ id: feature.id, data })}
                                isLoading={updateFeatureMutation.isPending}
                              />
                            </DialogContent>
                          </Dialog>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              if (confirm(tx("Are you sure you want to delete \"{0}\"?", feature.name))) {
                                deleteFeatureMutation.mutate(feature.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Feature Usage Analytics</CardTitle>
              <CardDescription>
                Track feature adoption and usage patterns across the platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Analytics Coming Soon</h3>
                <p className="text-muted-foreground">
                  Feature usage tracking and analytics will be available in a future update.
                  This will include feature adoption rates, user engagement metrics, and performance data.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}