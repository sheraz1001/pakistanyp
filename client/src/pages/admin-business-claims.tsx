import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { 
  Building2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  User, 
  Phone, 
  Mail,
  FileText,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Search,
  Filter,
  Download,
  AlertCircle,
  Users,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { AdminShell, AdminPageHeader } from '@/components/admin/admin-shell';

interface BusinessClaim {
  id: number;
  businessId: number;
  businessName: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  status: 'pending' | 'approved' | 'rejected';
  relationshipToBusiness: string;
  businessEmail?: string;
  businessPhone?: string;
  position?: string;
  verificationMethod: string;
  additionalInfo?: string;
  notes?: string;
  rejectionReason?: string;
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
}

const reviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().optional(),
  adminNotes: z.string().optional()
});

type ReviewFormData = z.infer<typeof reviewSchema>;

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'bg-[#FFF4E0] text-[#7C4A03]',
    bgColor: 'bg-[#FFF8EB]',
    borderColor: 'border-[#FBE3B5]'
  },
  approved: {
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  rejected: {
    icon: XCircle,
    color: 'bg-red-100 text-red-800',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  }
};

export default function AdminBusinessClaims() {
  const [selectedClaim, setSelectedClaim] = useState<BusinessClaim | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: claims = [], isLoading } = useQuery({
    queryKey: ['/api/admin/business-claims']
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/admin/business-claims/stats']
  });

  const reviewForm = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      action: 'approve',
      rejectionReason: '',
      adminNotes: ''
    }
  });

  const reviewMutation = useMutation({
    mutationFn: async (data: ReviewFormData & { claimId: number }) => {
      return apiRequest('PATCH', `/api/admin/business-claims/${data.claimId}/review`, data);
    },
    onSuccess: () => {
      toast({
        title: "Claim Reviewed",
        description: "The business claim has been processed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/business-claims'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/business-claims/stats'] });
      setReviewDialogOpen(false);
      setSelectedClaim(null);
      reviewForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Review Failed",
        description: error.message || "Failed to process business claim review",
        variant: "destructive",
      });
    }
  });

  const onReviewSubmit = (data: ReviewFormData) => {
    if (!selectedClaim) return;
    
    if (data.action === 'reject' && !data.rejectionReason) {
      reviewForm.setError('rejectionReason', {
        message: 'Rejection reason is required when rejecting a claim'
      });
      return;
    }

    reviewMutation.mutate({ ...data, claimId: selectedClaim.id });
  };

  // Filter claims based on search and status
  const filteredClaims = claims.filter((claim: BusinessClaim) => {
    const matchesSearch = !searchQuery || 
      claim.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.userName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const pendingClaims = claims.filter((claim: BusinessClaim) => claim.status === 'pending');
  const approvedClaims = claims.filter((claim: BusinessClaim) => claim.status === 'approved');
  const rejectedClaims = claims.filter((claim: BusinessClaim) => claim.status === 'rejected');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded mt-6"></div>
        </div>
      </div>
    );
  }

  return (
    <AdminShell>
    <div className="space-y-6">
      <AdminPageHeader title="Business claims" subtitle="Review and manage business ownership claims." />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Claims</p>
                <p className="text-2xl font-bold">{claims.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#FFF4E0] rounded-lg">
                <Clock className="h-5 w-5 text-[#B45309]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold">{pendingClaims.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold">{approvedClaims.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold">{rejectedClaims.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Approval Rate</p>
                <p className="text-2xl font-bold">
                  {claims.length > 0 ? Math.round((approvedClaims.length / (approvedClaims.length + rejectedClaims.length)) * 100) || 0 : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by business name, user email, or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Claims Management */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Claims ({filteredClaims.length})</TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({pendingClaims.length})
            {pendingClaims.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">
                {pendingClaims.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedClaims.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedClaims.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <ClaimsTable 
            claims={filteredClaims} 
            onViewDetails={setSelectedClaim}
            onReview={(claim) => {
              setSelectedClaim(claim);
              setReviewDialogOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="pending">
          <ClaimsTable 
            claims={pendingClaims.filter(claim => 
              !searchQuery || 
              claim.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              claim.userEmail?.toLowerCase().includes(searchQuery.toLowerCase())
            )} 
            onViewDetails={setSelectedClaim}
            onReview={(claim) => {
              setSelectedClaim(claim);
              setReviewDialogOpen(true);
            }}
            showQuickActions
          />
        </TabsContent>

        <TabsContent value="approved">
          <ClaimsTable 
            claims={approvedClaims.filter(claim => 
              !searchQuery || 
              claim.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              claim.userEmail?.toLowerCase().includes(searchQuery.toLowerCase())
            )} 
            onViewDetails={setSelectedClaim}
          />
        </TabsContent>

        <TabsContent value="rejected">
          <ClaimsTable 
            claims={rejectedClaims.filter(claim => 
              !searchQuery || 
              claim.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              claim.userEmail?.toLowerCase().includes(searchQuery.toLowerCase())
            )} 
            onViewDetails={setSelectedClaim}
          />
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Business Claim</DialogTitle>
            <DialogDescription>
              Review and approve or reject this business ownership claim.
            </DialogDescription>
          </DialogHeader>

          {selectedClaim && (
            <div className="space-y-4">
              {/* Claim Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Claim Summary</h4>
                <div className="grid gap-2 text-sm">
                  <div><strong>Business:</strong> {selectedClaim.businessName}</div>
                  <div><strong>Claimant:</strong> {selectedClaim.userName || selectedClaim.userEmail}</div>
                  <div><strong>Relationship:</strong> {selectedClaim.relationshipToBusiness.replace('_', ' ')}</div>
                  <div><strong>Verification Method:</strong> {selectedClaim.verificationMethod.replace('_', ' ')}</div>
                  {selectedClaim.position && <div><strong>Position:</strong> {selectedClaim.position}</div>}
                </div>
              </div>

              {/* Review Form */}
              <Form {...reviewForm}>
                <form onSubmit={reviewForm.handleSubmit(onReviewSubmit)} className="space-y-4">
                  <FormField
                    control={reviewForm.control}
                    name="action"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Review Action *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select action" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="approve">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Approve Claim
                              </div>
                            </SelectItem>
                            <SelectItem value="reject">
                              <div className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-red-600" />
                                Reject Claim
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {reviewForm.watch('action') === 'reject' && (
                    <FormField
                      control={reviewForm.control}
                      name="rejectionReason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rejection Reason *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Please provide a detailed reason for rejection..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={reviewForm.control}
                    name="adminNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Internal notes (not visible to user)..."
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      An email notification will be automatically sent to the user after processing this review.
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setReviewDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={reviewMutation.isPending}
                      className={
                        reviewForm.watch('action') === 'approve' 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-red-600 hover:bg-red-700'
                      }
                    >
                      {reviewMutation.isPending ? 'Processing...' : `${reviewForm.watch('action')} Claim`}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Claim Details Modal */}
      {selectedClaim && !reviewDialogOpen && (
        <ClaimDetailsModal 
          claim={selectedClaim} 
          onClose={() => setSelectedClaim(null)}
          onReview={() => setReviewDialogOpen(true)}
        />
      )}
    </div>
    </AdminShell>
  );
}

function ClaimsTable({ 
  claims, 
  onViewDetails,
  onReview,
  showQuickActions = false
}: { 
  claims: BusinessClaim[]; 
  onViewDetails: (claim: BusinessClaim) => void;
  onReview?: (claim: BusinessClaim) => void;
  showQuickActions?: boolean;
}) {
  if (claims.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Claims Found</h3>
          <p className="text-gray-600">No business claims match your current filters.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business</TableHead>
              <TableHead>Claimant</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Relationship</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {claims.map((claim) => {
              const status = statusConfig[claim.status];
              const StatusIcon = status.icon;

              return (
                <TableRow key={claim.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{claim.businessName}</p>
                      <p className="text-sm text-gray-500">ID: {claim.businessId}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{claim.userName || 'N/A'}</p>
                      <p className="text-sm text-gray-500">{claim.userEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={status.color}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {claim.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize text-sm">{claim.relationshipToBusiness.replace('_', ' ')}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(claim.createdAt), 'MMM dd, yyyy')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails(claim)}
                      >
                        <Eye className="mr-1 h-3 w-3" />
                        View
                      </Button>
                      {claim.status === 'pending' && onReview && (
                        <>
                          {showQuickActions ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => onReview(claim)}
                              >
                                <ThumbsUp className="mr-1 h-3 w-3" />
                                Review
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onReview(claim)}
                            >
                              Review
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ClaimDetailsModal({ 
  claim, 
  onClose,
  onReview
}: { 
  claim: BusinessClaim; 
  onClose: () => void;
  onReview?: () => void;
}) {
  const status = statusConfig[claim.status];
  const StatusIcon = status.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Business Claim Details
              </CardTitle>
              <CardDescription>Claim #{claim.id}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Status */}
          <div className={`p-4 rounded-lg border ${status.bgColor} ${status.borderColor}`}>
            <div className="flex items-center gap-3">
              <StatusIcon className="h-6 w-6" />
              <div>
                <p className="font-semibold text-lg capitalize">{claim.status}</p>
                <p className="text-sm opacity-75">
                  {claim.status === 'pending' && "Awaiting admin review"}
                  {claim.status === 'approved' && "Claim has been approved"}
                  {claim.status === 'rejected' && "Claim was rejected"}
                </p>
              </div>
            </div>
          </div>

          {/* Business and User Information */}
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-semibold mb-3">Business Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p><strong>Name:</strong> {claim.businessName}</p>
                <p><strong>Business ID:</strong> {claim.businessId}</p>
                {claim.businessEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{claim.businessEmail}</span>
                  </div>
                )}
                {claim.businessPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{claim.businessPhone}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Claimant Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>{claim.userName || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{claim.userEmail}</span>
                </div>
                <p><strong>User ID:</strong> {claim.userId}</p>
              </div>
            </div>
          </div>

          {/* Claim Details */}
          <div>
            <h3 className="font-semibold mb-3">Claim Details</h3>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-600">Relationship</label>
                  <p className="capitalize">{claim.relationshipToBusiness.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Verification Method</label>
                  <p className="capitalize">{claim.verificationMethod.replace('_', ' ')}</p>
                </div>
              </div>

              {claim.position && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Position/Title</label>
                  <p>{claim.position}</p>
                </div>
              )}

              {claim.additionalInfo && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Additional Information</label>
                  <div className="bg-gray-50 p-3 rounded mt-1">
                    <p className="text-sm">{claim.additionalInfo}</p>
                  </div>
                </div>
              )}

              {claim.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-600">User Notes</label>
                  <div className="bg-gray-50 p-3 rounded mt-1">
                    <p className="text-sm">{claim.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rejection Reason */}
          {claim.status === 'rejected' && claim.rejectionReason && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Rejection Reason:</strong> {claim.rejectionReason}
              </AlertDescription>
            </Alert>
          )}

          {/* Processing Information */}
          {(claim.processedAt || claim.processedBy) && (
            <div>
              <h3 className="font-semibold mb-3">Processing Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                {claim.processedAt && (
                  <p><strong>Processed:</strong> {format(new Date(claim.processedAt), 'MMM dd, yyyy HH:mm')}</p>
                )}
                {claim.processedBy && (
                  <p><strong>Processed By:</strong> {claim.processedBy}</p>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div>
            <h3 className="font-semibold mb-3">Timeline</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Claim submitted on {format(new Date(claim.createdAt), 'MMM dd, yyyy HH:mm')}</span>
              </div>
              {claim.processedAt && (
                <div className="flex items-center gap-3 text-sm">
                  <div className={`w-2 h-2 rounded-full ${claim.status === 'approved' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>
                    Claim {claim.status} on {format(new Date(claim.processedAt), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            {claim.status === 'pending' && onReview && (
              <Button onClick={onReview}>
                Review Claim
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}