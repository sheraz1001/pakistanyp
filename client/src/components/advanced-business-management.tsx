import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Eye, Edit, Trash2, Star, Users, TrendingUp, Search, Filter, Download, Plus, Building, MoreVertical, Settings, Shield, ShieldCheck, PowerOff, Power, AlertTriangle, Sparkles, RefreshCw, Loader2, CheckCheck } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Business {
  id: number;
  name: string;
  arabicName?: string | null;
  slug?: string;
  description?: string | null;
  shortDescription?: string | null;
  tagline?: string | null;
  socialPreview?: string | null;
  categoryId?: number;
  provinceId?: number;
  localityId?: number;
  
  // Contact Information
  email: string;
  phone: string;
  whatsapp?: string | null;
  website: string;
  logoUrl?: string | null;
  logo: string;
  
  // Address
  address: string;
  locality?: string | null;
  poBox?: string | null;
  googleMapsUrl?: string | null;
  coordinates?: any;
  
  // Business Details
  tradeLicense?: string | null;
  establishedYear?: number | null;
  employeeCount?: string | null;
  workingHours?: any;
  services?: string[] | null;
  products?: string[] | null;
  specialties?: string[] | null;
  certifications?: string[] | null;
  awards?: string[] | null;
  languages?: string[] | null;
  paymentMethods?: string[] | null;
  deliveryAreas?: string[] | null;
  priceRange?: string | null;
  businessType?: string | null;
  
  // Legal & Financial
  companySize?: string | null;
  yearlyRevenue?: string | null;
  legalForm?: string | null;
  vatNumber?: string | null;
  
  // Social Media
  socialMediaUrls?: any;
  
  // SEO
  metaTitle?: string | null;
  metaDescription?: string | null;
  keywords?: string[] | null;
  
  // Status
  isVerified: boolean;
  isClaimed?: boolean | null;
  isPremium?: boolean | null;
  isFeatured: boolean;
  isActive: boolean;
  adminApproved: boolean;
  status?: string | null;
  
  // Stats
  viewCount: number;
  rating: number;
  ratingAverage?: string | null;
  ratingCount?: number | null;
  
  // Metadata
  category: string;
  province: string;
  createdAt: string;
  ownerEmail: string;
  ownerId?: string | null;
  contentGenerationStatus?: string | null;
}

export default function AdvancedBusinessManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [provinceFilter, setProvinceFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBusinesses, setSelectedBusinesses] = useState<number[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState<number | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [businessToEdit, setBusinessToEdit] = useState<Business | null>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [businessToChangeCategory, setBusinessToChangeCategory] = useState<Business | null>(null);
  
  // AI Content Regeneration State
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [showRegenerationDialog, setShowRegenerationDialog] = useState(false);

  // Fetch businesses with real data
  const { data: businessData, isLoading } = useQuery({
    queryKey: ["/api/admin/businesses", searchTerm, statusFilter, provinceFilter, categoryFilter, cityFilter, sortBy, sortOrder, currentPage],
    queryFn: () => apiRequest("GET", `/api/admin/businesses?search=${searchTerm}&status=${statusFilter}&province=${provinceFilter}&category=${categoryFilter}&city=${cityFilter}&sortBy=${sortBy}&sortOrder=${sortOrder}&page=${currentPage}&limit=25`),
  });

  // Fetch categories for filtering and editing
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("GET", "/api/categories"),
  });

  // Fetch provinces and cities for filtering
  const { data: provinces = [] } = useQuery({
    queryKey: ["/api/provinces"],
    queryFn: () => apiRequest("GET", "/api/provinces"),
  });

  const { data: cities = [] } = useQuery({
    queryKey: ["/api/cities"],
    queryFn: () => apiRequest("GET", "/api/cities"),
  });

  // Fetch pending businesses specifically  
  const { data: pendingBusinesses = [] } = useQuery<Business[]>({
    queryKey: ["/api/admin/businesses/pending"],
    queryFn: () => apiRequest("GET", "/api/admin/businesses/pending"),
  });

  // Real statistics
  const { data: stats } = useQuery({
    queryKey: ["/api/admin/business-stats"],
    queryFn: () => apiRequest("GET", "/api/admin/business-stats"),
  });

  // Approve business mutation
  const approveMutation = useMutation({
    mutationFn: async (businessId: number) => {
      return await apiRequest("POST", `/api/admin/businesses/${businessId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/businesses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/businesses/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/business-stats"] });
      toast({
        title: "Business Approved",
        description: "The business has been approved and is now live.",
      });
    },
  });

  // Reject business mutation
  const rejectMutation = useMutation({
    mutationFn: async (businessId: number) => {
      return await apiRequest("POST", `/api/admin/businesses/${businessId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/businesses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/businesses/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/business-stats"] });
      toast({
        title: "Business Rejected",
        description: "The business has been rejected.",
      });
    },
  });

  // Toggle status mutation (Active/Inactive)
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ businessId, isActive }: { businessId: number; isActive: boolean }) => {
      return await apiRequest("POST", `/api/admin/businesses/${businessId}/toggle-status`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/businesses"] });
      toast({
        title: "Status Updated",
        description: "Business status updated successfully.",
      });
    },
  });

  // Toggle verification mutation (Verified/Unverified)
  const toggleVerificationMutation = useMutation({
    mutationFn: async ({ businessId, isVerified }: { businessId: number; isVerified: boolean }) => {
      return await apiRequest("POST", `/api/admin/businesses/${businessId}/toggle-verification`, { isVerified });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/businesses"] });
      toast({
        title: "Verification Updated",
        description: "Business verification status updated successfully.",
      });
    },
  });

  // Feature business mutation (Featured/Unfeatured)
  const featureMutation = useMutation({
    mutationFn: async ({ businessId, featured }: { businessId: number; featured: boolean }) => {
      return await apiRequest("POST", `/api/admin/businesses/${businessId}/toggle-featured`, { featured });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/businesses"] });
      toast({
        title: "Featured Status Updated",
        description: "Business featured status updated successfully.",
      });
    },
  });

  // Delete business mutation
  const deleteMutation = useMutation({
    mutationFn: async (businessId: number) => {
      return await apiRequest("DELETE", `/api/admin/businesses/${businessId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/businesses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/business-stats"] });
      setShowDeleteDialog(false);
      setBusinessToDelete(null);
      toast({
        title: "Business Deleted",
        description: "The business has been permanently deleted.",
        variant: "destructive",
      });
    },
  });

  // Edit business mutation
  const editMutation = useMutation({
    mutationFn: async ({ businessId, updates }: { businessId: number; updates: Partial<Business> }) => {
      return await apiRequest("PUT", `/api/admin/businesses/${businessId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/businesses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/business-stats"] });
      setShowEditDialog(false);
      setBusinessToEdit(null);
      toast({
        title: "Business Updated",
        description: "The business information has been updated successfully.",
      });
    },
  });

  // Change category mutation
  const changeCategoryMutation = useMutation({
    mutationFn: async ({ businessId, categoryId }: { businessId: number; categoryId: number }) => {
      return await apiRequest("PUT", `/api/admin/businesses/${businessId}/category`, { categoryId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/businesses"] });
      setShowCategoryDialog(false);
      setBusinessToChangeCategory(null);
      toast({
        title: "Category Updated",
        description: "The business category has been changed successfully.",
      });
    },
  });

  // Bulk operations mutation
  const bulkOperationMutation = useMutation({
    mutationFn: async ({ operation, businessIds }: { operation: string; businessIds: number[] }) => {
      return await apiRequest("POST", "/api/admin/businesses/bulk-operation", { operation, businessIds });
    },
    onSuccess: (_, { operation }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/businesses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/business-stats"] });
      toast({
        title: "Bulk Operation Complete",
        description: `Successfully applied ${operation} to selected businesses.`,
      });
    },
  });

  // AI Content Regeneration Mutation
  const startRegenerationMutation = useMutation({
    mutationFn: async (businessIds?: number[]) => {
      return await apiRequest("POST", "/api/admin/businesses/regenerate-content", 
        businessIds ? { businessIds } : {}
      );
    },
    onSuccess: (data: any) => {
      setActiveJobId(data.jobId);
      setShowRegenerationDialog(false);
      toast({
        title: "Content Regeneration Started",
        description: `Job started for ${data.job.totalBusinesses} businesses. Progress will be tracked automatically.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Start Regeneration",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Poll for job status when there's an active job
  const { data: jobStatus, isError } = useQuery({
    queryKey: ["/api/admin/businesses/regenerate-content", activeJobId],
    queryFn: async () => {
      if (!activeJobId) return { job: null };
      return await apiRequest("GET", `/api/admin/businesses/regenerate-content/${activeJobId}`);
    },
    enabled: !!activeJobId,
    refetchInterval: (query: any) => {
      // Don't poll if no active job
      if (!activeJobId) return false;
      
      // Access the actual data and status from query state
      const data = query.state.data as { job: any } | undefined;
      const status = query.state.status;
      
      // Keep polling while query is pending/loading
      if (status === 'pending' || status === 'loading') return 1000;
      
      // If query succeeded but job is null, stop polling (job cleared server-side)
      if (!data || !data.job) return false;
      
      // Stop polling if job is completed or failed
      if (data.job.status === 'completed' || data.job.status === 'failed') {
        return false;
      }
      
      // Poll every second while job is running
      return 1000;
    },
    onError: (error) => {
      // Only handle actual query errors
      if (activeJobId) {
        toast({
          title: "Polling Error",
          description: "Failed to fetch job status. Please try again.",
          variant: "destructive",
        });
        setActiveJobId(null);
      }
    },
  });

  // When job completes, show success toast and clear activeJobId
  React.useEffect(() => {
    // Skip while query is still loading
    if (jobStatus === undefined) return;
    
    // Skip if no active job ID (already handled)
    if (!activeJobId) return;
    
    // If we have no job data, it might be completed and cleared server-side
    // Don't treat this as an error - just stop tracking
    if (!jobStatus?.job) {
      setActiveJobId(null);
      return;
    }
    
    const job = jobStatus.job;
    
    // Only show toasts if we still have an active job ID
    if (activeJobId && job.status === 'completed') {
      toast({
        title: "Content Regeneration Complete!",
        description: `Successfully generated content for ${job.successfulGenerations} of ${job.totalBusinesses} businesses. ${job.failedGenerations} used fallback templates.`,
      });
      
      // Invalidate businesses to show updated content
      queryClient.invalidateQueries({ queryKey: ["/api/admin/businesses"] });
      
      // Clear active job synchronously to allow immediate subsequent runs
      setActiveJobId(null);
    } else if (activeJobId && job.status === 'failed') {
      toast({
        title: "Regeneration Failed",
        description: job.error || "The job encountered an error.",
        variant: "destructive",
      });
      
      // Clear active job immediately on failure
      setActiveJobId(null);
    }
  }, [jobStatus, activeJobId, toast, queryClient]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (business: Business) => {
    if (!business.adminApproved) {
      return <Badge variant="destructive">Pending Approval</Badge>;
    }
    if (!business.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (business.isVerified) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Verified</Badge>;
    }
    return <Badge variant="outline">Active</Badge>;
  };

  const businesses = businessData?.businesses || [];
  const totalBusinesses = businessData?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Management</h1>
          <p className="text-gray-600">Manage all business listings, approvals, and verification</p>
        </div>
        <div className="flex gap-2">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Business
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          {selectedBusinesses.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  Bulk Actions ({selectedBusinesses.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => bulkOperationMutation.mutate({ operation: 'activate', businessIds: selectedBusinesses })}>
                  <Power className="h-4 w-4 mr-2" />
                  Activate Selected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => bulkOperationMutation.mutate({ operation: 'deactivate', businessIds: selectedBusinesses })}>
                  <PowerOff className="h-4 w-4 mr-2" />
                  Deactivate Selected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => bulkOperationMutation.mutate({ operation: 'verify', businessIds: selectedBusinesses })}>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Verify Selected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => bulkOperationMutation.mutate({ operation: 'unverify', businessIds: selectedBusinesses })}>
                  <Shield className="h-4 w-4 mr-2" />
                  Unverify Selected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => bulkOperationMutation.mutate({ operation: 'feature', businessIds: selectedBusinesses })}>
                  <Star className="h-4 w-4 mr-2" />
                  Feature Selected
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => bulkOperationMutation.mutate({ operation: 'delete', businessIds: selectedBusinesses })}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Real Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Businesses</p>
                <p className="text-2xl font-bold">{stats?.totalBusinesses || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold">{stats?.approvedBusinesses || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-[#B45309]" />
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{pendingBusinesses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-[#F59E0B]" />
              <div>
                <p className="text-sm font-medium text-gray-600">Featured</p>
                <p className="text-2xl font-bold">{stats?.featuredBusinesses || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pending">Pending Approval ({pendingBusinesses.length})</TabsTrigger>
          <TabsTrigger value="all">All Businesses</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Businesses Pending Approval</CardTitle>
              <CardDescription>Review and approve new business submissions</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingBusinesses.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                  <p className="text-gray-600">No businesses pending approval.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingBusinesses.map((business) => (
                    <div key={business.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                            {business.logo ? (
                              <img src={business.logo} alt={business.name} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <span className="text-blue-600 font-semibold">
                                {business.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold">{business.name}</h4>
                            <p className="text-sm text-gray-600">{business.category}</p>
                            <p className="text-sm text-gray-500">{business.ownerEmail}</p>
                            <p className="text-sm text-gray-500">Submitted {formatDate(business.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`/business/${business.slug || business.id}`, '_blank')}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => rejectMutation.mutate(business.id)}
                            disabled={rejectMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => approveMutation.mutate(business.id)}
                            disabled={approveMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <div className="xl:col-span-2">
                  <Input
                    placeholder="Search businesses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="featured">Featured</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Array.isArray(categories) && categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={provinceFilter} onValueChange={setProvinceFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Provinces" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Provinces</SelectItem>
                    {Array.isArray(provinces) && provinces.map((province: any) => (
                      <SelectItem key={province.id} value={province.id.toString()}>
                        {province.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {Array.isArray(cities) && cities.map((city: any) => (
                      <SelectItem key={city.id} value={city.id.toString()}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Business Table */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {businesses.map((business: Business) => (
                      <TableRow key={business.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                              {business.logo ? (
                                <img src={business.logo} alt={business.name} className="w-full h-full object-cover rounded-lg" />
                              ) : (
                                <span className="text-blue-600 text-sm font-semibold">
                                  {business.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{business.name}</p>
                              <p className="text-sm text-gray-500">{business.category}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{business.ownerEmail}</p>
                        </TableCell>
                        <TableCell>{getStatusBadge(business)}</TableCell>
                        <TableCell>{business.viewCount || 0}</TableCell>
                        <TableCell>{formatDate(business.createdAt)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => window.open(`/business/${business.slug || business.id}`, '_blank')}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Business
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setBusinessToEdit(business);
                                setShowEditDialog(true);
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Business
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setBusinessToChangeCategory(business);
                                setShowCategoryDialog(true);
                              }}>
                                <Settings className="h-4 w-4 mr-2" />
                                Change Category
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => toggleStatusMutation.mutate({ businessId: business.id, isActive: !business.isActive })}
                              >
                                {business.isActive ? (
                                  <>
                                    <PowerOff className="h-4 w-4 mr-2" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <Power className="h-4 w-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => toggleVerificationMutation.mutate({ businessId: business.id, isVerified: !business.isVerified })}
                              >
                                {business.isVerified ? (
                                  <>
                                    <Shield className="h-4 w-4 mr-2" />
                                    Remove Verification
                                  </>
                                ) : (
                                  <>
                                    <ShieldCheck className="h-4 w-4 mr-2" />
                                    Verify Business
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => featureMutation.mutate({ businessId: business.id, featured: !business.isFeatured })}
                              >
                                {business.isFeatured ? (
                                  <>
                                    <Star className="h-4 w-4 mr-2 text-[#F59E0B]" />
                                    Remove Feature
                                  </>
                                ) : (
                                  <>
                                    <Star className="h-4 w-4 mr-2" />
                                    Feature Business
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => {
                                  setBusinessToDelete(business.id);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Business
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.isArray(businesses) && businesses.slice(0, 5).map((business) => (
                    <div key={business.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 text-xs font-semibold">
                          {business.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{business.name}</p>
                        <p className="text-xs text-gray-500">Added {formatDate(business.createdAt)}</p>
                      </div>
                      {getStatusBadge(business)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '#pending'}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Review Pending Approvals ({Array.isArray(pendingBusinesses) ? pendingBusinesses.length : 0})
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Export Business Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Content Regeneration Card */}
          <Card className="border-2 border-purple-200 bg-purple-50 ">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">AI Content Regeneration</CardTitle>
                    <CardDescription>
                      Generate professional descriptions, meta tags, and taglines for all businesses
                    </CardDescription>
                  </div>
                </div>
                {!activeJobId && (
                  <Button 
                    onClick={() => setShowRegenerationDialog(true)}
                    className="gap-2 bg-purple-600 hover:bg-purple-700"
                    data-testid="button-start-regeneration"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Regenerate All Content
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {activeJobId && jobStatus?.job ? (
                // Show progress when job is running
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {jobStatus.job.status === 'running' ? (
                      <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                    ) : (
                      <CheckCheck className="h-5 w-5 text-green-600" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {jobStatus.job.status === 'running' 
                            ? `Processing: ${jobStatus.job.currentBusinessName || 'Loading...'}` 
                            : 'Completed'}
                        </span>
                        <span className="text-sm text-gray-600">
                          {jobStatus.job.processedBusinesses} / {jobStatus.job.totalBusinesses}
                        </span>
                      </div>
                      <Progress 
                        value={(jobStatus.job.processedBusinesses / jobStatus.job.totalBusinesses) * 100} 
                        className="h-2"
                        data-testid="progress-regeneration"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 p-4 bg-white rounded-lg border">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {jobStatus.job.totalBusinesses}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Total Businesses</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {jobStatus.job.successfulGenerations}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">AI Generated</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#B45309]">
                        {jobStatus.job.failedGenerations}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Fallback Used</div>
                    </div>
                  </div>

                  {jobStatus.job.status === 'running' && (
                    <div className="text-sm text-gray-600 text-center">
                      <p>⏱️ Estimated time remaining: ~{Math.ceil((jobStatus.job.totalBusinesses - jobStatus.job.processedBusinesses) * 2)} seconds</p>
                    </div>
                  )}
                </div>
              ) : (
                // Show info when no job is running
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-gray-700">What gets generated:</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Professional Description</strong> (650-800 characters)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Meta Description</strong> for SEO (150-160 characters)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Social Media Preview</strong> (200-250 characters)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Catchy Tagline</strong> (50-100 characters)</span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-gray-700">How it works:</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <span>Uses OpenAI GPT-4o for high-quality, unique content</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <span>Processes all businesses automatically with progress tracking</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <span>Falls back to professional templates if AI is unavailable</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <span>Estimated time: ~{Math.ceil((totalBusinesses || 89) * 2 / 60)} minutes for all businesses</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Content Regeneration Confirmation Dialog */}
      <Dialog open={showRegenerationDialog} onOpenChange={setShowRegenerationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Start AI Content Regeneration
            </DialogTitle>
            <DialogDescription>
              This will generate professional content for all active businesses in your directory. The process will:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
              <RefreshCw className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Generate AI-powered content for {totalBusinesses || 89} businesses</p>
                <p className="text-xs text-gray-600">Includes descriptions, meta tags, social previews, and taglines</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <Loader2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Estimated duration: ~{Math.ceil((totalBusinesses || 89) * 2 / 60)} minutes</p>
                <p className="text-xs text-gray-600">You can close this page - progress will continue in the background</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Automatic fallback protection</p>
                <p className="text-xs text-gray-600">If AI is unavailable, professional templates will be used instead</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowRegenerationDialog(false)}
              data-testid="button-cancel-regeneration"
            >
              Cancel
            </Button>
            <Button
              onClick={() => startRegenerationMutation.mutate(undefined)}
              disabled={startRegenerationMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
              data-testid="button-confirm-regeneration"
            >
              {startRegenerationMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Start Regeneration
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirm Business Deletion
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. The business and all associated data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (businessToDelete) {
                  deleteMutation.mutate(businessToDelete);
                  setShowDeleteDialog(false);
                  setBusinessToDelete(null);
                }
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Business'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Business Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Business Information</DialogTitle>
            <DialogDescription>
              Update the business information below. All fields are optional unless marked as required.
            </DialogDescription>
          </DialogHeader>
          {businessToEdit && (
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
                <TabsTrigger value="status">Status</TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Business Name *</label>
                    <Input
                      value={businessToEdit.name || ''}
                      onChange={(e) => setBusinessToEdit({ ...businessToEdit, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Arabic Name</label>
                    <Input
                      value={businessToEdit.arabicName || ''}
                      onChange={(e) => setBusinessToEdit({ ...businessToEdit, arabicName: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={businessToEdit.description || ''}
                    onChange={(e) => setBusinessToEdit({ ...businessToEdit, description: e.target.value })}
                    rows={4}
                    placeholder="Full business description"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Short Description</label>
                  <Textarea
                    value={businessToEdit.shortDescription || ''}
                    onChange={(e) => setBusinessToEdit({ ...businessToEdit, shortDescription: e.target.value })}
                    rows={2}
                    placeholder="Brief summary for listings"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tagline</label>
                  <Input
                    value={businessToEdit.tagline || ''}
                    onChange={(e) => setBusinessToEdit({ ...businessToEdit, tagline: e.target.value })}
                    placeholder="Catchy tagline or slogan"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Logo URL</label>
                    <Input
                      value={businessToEdit.logoUrl || businessToEdit.logo || ''}
                      onChange={(e) => setBusinessToEdit({ ...businessToEdit, logoUrl: e.target.value, logo: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Established Year</label>
                    <Input
                      type="number"
                      value={businessToEdit.establishedYear || ''}
                      onChange={(e) => setBusinessToEdit({ ...businessToEdit, establishedYear: parseInt(e.target.value) || null })}
                      placeholder="e.g., 2020"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Contact Information Tab */}
              <TabsContent value="contact" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      value={businessToEdit.email || ''}
                      onChange={(e) => setBusinessToEdit({ ...businessToEdit, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone</label>
                    <Input
                      value={businessToEdit.phone || ''}
                      onChange={(e) => setBusinessToEdit({ ...businessToEdit, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">WhatsApp</label>
                    <Input
                      value={businessToEdit.whatsapp || ''}
                      onChange={(e) => setBusinessToEdit({ ...businessToEdit, whatsapp: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Website</label>
                    <Input
                      value={businessToEdit.website || ''}
                      onChange={(e) => setBusinessToEdit({ ...businessToEdit, website: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Address *</label>
                  <Textarea
                    value={businessToEdit.address || ''}
                    onChange={(e) => setBusinessToEdit({ ...businessToEdit, address: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Locality/Area</label>
                    <Input
                      value={businessToEdit.locality || ''}
                      onChange={(e) => setBusinessToEdit({ ...businessToEdit, locality: e.target.value })}
                      placeholder="Specific neighborhood"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">P.O. Box</label>
                    <Input
                      value={businessToEdit.poBox || ''}
                      onChange={(e) => setBusinessToEdit({ ...businessToEdit, poBox: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Google Maps URL</label>
                  <Input
                    value={businessToEdit.googleMapsUrl || ''}
                    onChange={(e) => setBusinessToEdit({ ...businessToEdit, googleMapsUrl: e.target.value })}
                    placeholder="https://maps.google.com/..."
                  />
                </div>
              </TabsContent>

              {/* Business Details Tab */}
              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Trade License</label>
                    <Input
                      value={businessToEdit.tradeLicense || ''}
                      onChange={(e) => setBusinessToEdit({ ...businessToEdit, tradeLicense: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">VAT Number</label>
                    <Input
                      value={businessToEdit.vatNumber || ''}
                      onChange={(e) => setBusinessToEdit({ ...businessToEdit, vatNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Employee Count</label>
                    <Input
                      value={businessToEdit.employeeCount || ''}
                      onChange={(e) => setBusinessToEdit({ ...businessToEdit, employeeCount: e.target.value })}
                      placeholder="e.g., 1-10, 11-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company Size</label>
                    <Input
                      value={businessToEdit.companySize || ''}
                      onChange={(e) => setBusinessToEdit({ ...businessToEdit, companySize: e.target.value })}
                      placeholder="Small, Medium, Large"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Legal Form</label>
                    <Input
                      value={businessToEdit.legalForm || ''}
                      onChange={(e) => setBusinessToEdit({ ...businessToEdit, legalForm: e.target.value })}
                      placeholder="LLC, FZ-LLC, etc."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Business Type</label>
                    <Input
                      value={businessToEdit.businessType || ''}
                      onChange={(e) => setBusinessToEdit({ ...businessToEdit, businessType: e.target.value })}
                      placeholder="B2B, B2C, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price Range</label>
                    <Input
                      value={businessToEdit.priceRange || ''}
                      onChange={(e) => setBusinessToEdit({ ...businessToEdit, priceRange: e.target.value })}
                      placeholder="$, $$, $$$"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Services (comma-separated)</label>
                  <Textarea
                    value={businessToEdit.services?.join(', ') || ''}
                    onChange={(e) => setBusinessToEdit({ 
                      ...businessToEdit, 
                      services: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    rows={2}
                    placeholder="Service 1, Service 2, Service 3"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Products (comma-separated)</label>
                  <Textarea
                    value={businessToEdit.products?.join(', ') || ''}
                    onChange={(e) => setBusinessToEdit({ 
                      ...businessToEdit, 
                      products: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    rows={2}
                    placeholder="Product 1, Product 2, Product 3"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Specialties (comma-separated)</label>
                  <Textarea
                    value={businessToEdit.specialties?.join(', ') || ''}
                    onChange={(e) => setBusinessToEdit({ 
                      ...businessToEdit, 
                      specialties: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    rows={2}
                    placeholder="Specialty 1, Specialty 2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Languages (comma-separated)</label>
                    <Input
                      value={businessToEdit.languages?.join(', ') || ''}
                      onChange={(e) => setBusinessToEdit({ 
                        ...businessToEdit, 
                        languages: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      })}
                      placeholder="English, Arabic, Urdu"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Payment Methods (comma-separated)</label>
                    <Input
                      value={businessToEdit.paymentMethods?.join(', ') || ''}
                      onChange={(e) => setBusinessToEdit({ 
                        ...businessToEdit, 
                        paymentMethods: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      })}
                      placeholder="Cash, Card, Online"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* SEO Tab */}
              <TabsContent value="seo" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Meta Title</label>
                  <Input
                    value={businessToEdit.metaTitle || ''}
                    onChange={(e) => setBusinessToEdit({ ...businessToEdit, metaTitle: e.target.value })}
                    placeholder="SEO title for search engines"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Meta Description</label>
                  <Textarea
                    value={businessToEdit.metaDescription || ''}
                    onChange={(e) => setBusinessToEdit({ ...businessToEdit, metaDescription: e.target.value })}
                    rows={3}
                    placeholder="SEO description (150-160 characters)"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Social Preview</label>
                  <Textarea
                    value={businessToEdit.socialPreview || ''}
                    onChange={(e) => setBusinessToEdit({ ...businessToEdit, socialPreview: e.target.value })}
                    rows={3}
                    placeholder="Text for social media sharing"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Keywords (comma-separated)</label>
                  <Textarea
                    value={businessToEdit.keywords?.join(', ') || ''}
                    onChange={(e) => setBusinessToEdit({ 
                      ...businessToEdit, 
                      keywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    rows={2}
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">AI Content Status</label>
                  <Badge variant="secondary">
                    {businessToEdit.contentGenerationStatus || 'pending'}
                  </Badge>
                </div>
              </TabsContent>

              {/* Status Tab */}
              <TabsContent value="status" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isActive"
                      checked={businessToEdit.isActive}
                      onCheckedChange={(checked) => setBusinessToEdit({ ...businessToEdit, isActive: !!checked })}
                    />
                    <label htmlFor="isActive" className="text-sm font-medium">Active</label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="adminApproved"
                      checked={businessToEdit.adminApproved}
                      onCheckedChange={(checked) => setBusinessToEdit({ ...businessToEdit, adminApproved: !!checked })}
                    />
                    <label htmlFor="adminApproved" className="text-sm font-medium">Admin Approved</label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isVerified"
                      checked={businessToEdit.isVerified}
                      onCheckedChange={(checked) => setBusinessToEdit({ ...businessToEdit, isVerified: !!checked })}
                    />
                    <label htmlFor="isVerified" className="text-sm font-medium">Verified</label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isFeatured"
                      checked={businessToEdit.isFeatured}
                      onCheckedChange={(checked) => setBusinessToEdit({ ...businessToEdit, isFeatured: !!checked })}
                    />
                    <label htmlFor="isFeatured" className="text-sm font-medium">Featured</label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isPremium"
                      checked={businessToEdit.isPremium || false}
                      onCheckedChange={(checked) => setBusinessToEdit({ ...businessToEdit, isPremium: !!checked })}
                    />
                    <label htmlFor="isPremium" className="text-sm font-medium">Premium</label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isClaimed"
                      checked={businessToEdit.isClaimed || false}
                      onCheckedChange={(checked) => setBusinessToEdit({ ...businessToEdit, isClaimed: !!checked })}
                    />
                    <label htmlFor="isClaimed" className="text-sm font-medium">Claimed</label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={businessToEdit.status || 'active'}
                    onValueChange={(value) => setBusinessToEdit({ ...businessToEdit, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-1">
                    <label className="text-sm text-gray-500">View Count</label>
                    <p className="text-lg font-semibold">{businessToEdit.viewCount || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-gray-500">Rating</label>
                    <p className="text-lg font-semibold">{businessToEdit.rating || 0} ({businessToEdit.ratingCount || 0} reviews)</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => businessToEdit && editMutation.mutate({
                businessId: businessToEdit.id,
                updates: businessToEdit
              })}
              disabled={editMutation.isPending}
            >
              {editMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Business Category</DialogTitle>
            <DialogDescription>
              Select a new category for "{businessToChangeCategory?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Category</label>
              <Select 
                onValueChange={(categoryId) => 
                  businessToChangeCategory && changeCategoryMutation.mutate({
                    businessId: businessToChangeCategory.id,
                    categoryId: parseInt(categoryId)
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(categories) && categories.map((category: any) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}