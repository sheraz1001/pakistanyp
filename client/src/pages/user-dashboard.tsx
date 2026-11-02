import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  Plus, 
  Edit, 
  Eye, 
  Star, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  XCircle,
  BarChart3,
  TrendingUp,
  Users,
  Heart,
  Settings,
  MapPin,
  Calendar
} from "lucide-react";
import type { Business, BusinessClaim, BusinessReview } from "@shared/schema";

export default function UserDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to access the dashboard. Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 2000);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch user's businesses
  const { data: userBusinesses = [], isLoading: businessesLoading } = useQuery<Business[]>({
    queryKey: ["/api/user/businesses"],
    enabled: isAuthenticated,
  });

  // Fetch business claims
  const { data: businessClaims = [], isLoading: claimsLoading } = useQuery<BusinessClaim[]>({
    queryKey: ["/api/user/business-claims"],
    enabled: isAuthenticated,
  });

  // Fetch user stats
  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
    enabled: isAuthenticated,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-[#FFF4E0] text-[#B45309]", label: "Pending" },
      approved: { color: "bg-green-100 text-green-800", label: "Approved" },
      rejected: { color: "bg-red-100 text-red-800", label: "Rejected" },
      active: { color: "bg-green-100 text-green-800", label: "Active" },
      inactive: { color: "bg-gray-100 text-gray-800", label: "Inactive" },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.firstName || 'User'}!
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your business listings and monitor your performance
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Businesses</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userBusinesses.length}</div>
            <p className="text-xs text-muted-foreground">
              Active listings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {businessClaims.filter(claim => claim.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userBusinesses.reduce((total, business) => total + (business.viewCount || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all listings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userBusinesses.length > 0 
                ? (userBusinesses.reduce((total, business) => total + (business.rating || 0), 0) / userBusinesses.length).toFixed(1)
                : '0.0'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Customer satisfaction
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="businesses" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="businesses">My Businesses</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="businesses" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Business Listings</h2>
            <Button onClick={() => window.location.href = '/add-business'}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Business
            </Button>
          </div>

          {businessesLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : userBusinesses.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No businesses yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by adding your first business listing.
                  </p>
                  <div className="mt-6">
                    <Button onClick={() => window.location.href = '/add-business'}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Business
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {userBusinesses.map((business) => (
                <Card key={business.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {business.name}
                          {business.isVerified && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </CardTitle>
                        <CardDescription>{business.description}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(business.isActive ? 'active' : 'inactive')}
                        {business.isFeatured && (
                          <Badge className="bg-blue-100 text-blue-800">Featured</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {business.viewCount || 0} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4" />
                          {business.rating || 0} rating
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {business.reviewCount || 0} reviews
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`/business/${business.slug}`, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="claims" className="space-y-4">
          <h2 className="text-xl font-semibold">Business Claims</h2>
          {claimsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : businessClaims.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No claims submitted</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You haven't submitted any business claims yet.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {businessClaims.map((claim) => (
                <Card key={claim.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Claim Request #{claim.id}</CardTitle>
                        <CardDescription>
                          Submitted on {new Date(claim.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      {getStatusBadge(claim.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm"><strong>Business ID:</strong> {claim.businessId}</p>
                      <p className="text-sm"><strong>Verification Documents:</strong> {claim.verificationDocuments}</p>
                      {claim.notes && (
                        <p className="text-sm"><strong>Notes:</strong> {claim.notes}</p>
                      )}
                      {claim.adminNotes && (
                        <p className="text-sm"><strong>Admin Response:</strong> {claim.adminNotes}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <h2 className="text-xl font-semibold">Performance Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Business Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userBusinesses.map((business) => (
                    <div key={business.id} className="flex justify-between items-center">
                      <span className="font-medium">{business.name}</span>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{business.viewCount || 0} views</span>
                        <span>•</span>
                        <span>{business.rating || 0}★</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Growth Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Views</span>
                    <span className="font-medium">
                      {userBusinesses.reduce((total, business) => total + (business.viewCount || 0), 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Rating</span>
                    <span className="font-medium">
                      {userBusinesses.length > 0 
                        ? (userBusinesses.reduce((total, business) => total + (business.rating || 0), 0) / userBusinesses.length).toFixed(1)
                        : '0.0'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Listings</span>
                    <span className="font-medium">
                      {userBusinesses.filter(b => b.isActive).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <h2 className="text-xl font-semibold">Account Settings</h2>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <p className="text-sm text-gray-600">
                    {user?.firstName} {user?.lastName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Account Created</label>
                  <p className="text-sm text-gray-600">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}