import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock, 
  AlertCircle,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar
} from "lucide-react";
import { format, isValid } from "date-fns";
import { tj } from "@/i18n-jsx/tj";

interface PendingBusiness {
  id: number;
  name: string;
  ownerEmail: string;
  phone: string;
  address: string;
  provinces?: { name: string };
  categories?: { name: string };
  description: string;
  ownerId: number;
  createdAt: string;
  adminApproved: boolean | null;
  website?: string;
  email?: string;
}

export default function BusinessApproval() {
  const { toast } = useToast();
  const [selectedBusiness, setSelectedBusiness] = useState<PendingBusiness | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // Fetch pending businesses from real API
  const { data: pendingBusinesses = [], isLoading } = useQuery({
    queryKey: ['/api/admin/businesses/pending'],
  });

  // Approve business mutation
  const approveMutation = useMutation({
    mutationFn: async (businessId: number) => {
      return apiRequest('POST', `/api/admin/businesses/${businessId}/approve`);
    },
    onSuccess: () => {
      toast({
        title: "Business Approved",
        description: "The business has been approved and published.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/businesses/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/businesses'] });
      setSelectedBusiness(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve business.",
        variant: "destructive",
      });
    }
  });

  // Reject business mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ businessId, reason }: { businessId: number; reason: string }) => {
      return apiRequest('POST', `/api/admin/businesses/${businessId}/reject`, { reason });
    },
    onSuccess: () => {
      toast({
        title: "Business Rejected",
        description: "The business has been rejected with reason.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/businesses/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/businesses'] });
      setShowRejectDialog(false);
      setSelectedBusiness(null);
      setRejectionReason("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject business.",
        variant: "destructive",
      });
    }
  });

  const handleApprove = (business: PendingBusiness) => {
    approveMutation.mutate(business.id);
  };

  const handleReject = () => {
    if (selectedBusiness && rejectionReason) {
      rejectMutation.mutate({ 
        businessId: selectedBusiness.id, 
        reason: rejectionReason 
      });
    }
  };

  if (isLoading) {
    return <div>Loading pending businesses...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingBusinesses.filter(b => b.status === 'pending').length}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">+12% from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected Today</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Quality control</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Review Time</CardTitle>
            <AlertCircle className="h-4 w-4 text-[#B45309]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4h</div>
            <p className="text-xs text-muted-foreground">Within target</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Businesses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Business Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Province</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingBusinesses.map((business) => (
                <TableRow key={business.id}>
                  <TableCell className="font-medium">{business.name}</TableCell>
                  <TableCell>{business.categories?.name || 'N/A'}</TableCell>
                  <TableCell>{business.provinces?.name || 'N/A'}</TableCell>
                  <TableCell>{business.ownerEmail}</TableCell>
                  <TableCell>
                    {business.createdAt && isValid(new Date(business.createdAt)) 
                      ? format(new Date(business.createdAt), 'MMM d, yyyy')
                      : 'Invalid date'
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedBusiness(business)}
                      >
                        <Eye className="h-4 w-4 me-1" />
                        Review
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleApprove(business)}
                      >
                        <CheckCircle className="h-4 w-4 me-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedBusiness(business);
                          setShowRejectDialog(true);
                        }}
                      >
                        <XCircle className="h-4 w-4 me-1" />
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Business Details Dialog */}
      {selectedBusiness && !showRejectDialog && (
        <Dialog open={!!selectedBusiness} onOpenChange={() => setSelectedBusiness(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Business Details Review</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Business Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedBusiness.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedBusiness.ownerEmail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedBusiness.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedBusiness.address}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Submission Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {selectedBusiness.createdAt && isValid(new Date(selectedBusiness.createdAt))
                          ? format(new Date(selectedBusiness.createdAt), 'PPP')
                          : 'Invalid date'
                        }
                      </span>
                    </div>
                    <div>
                      <Badge>{selectedBusiness.categories?.name || 'N/A'}</Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Submitted by: </span>
                      <span>{selectedBusiness.ownerEmail}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{selectedBusiness.description}</p>
              </div>
              {selectedBusiness.website && (
                <div>
                  <h4 className="font-semibold mb-2">Website</h4>
                  <a 
                    href={`https://${selectedBusiness.website}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {selectedBusiness.website}
                  </a>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedBusiness(null)}>
                Close
              </Button>
              <Button 
                variant="default" 
                onClick={() => handleApprove(selectedBusiness)}
              >
                <CheckCircle className="h-4 w-4 me-1" />
                Approve Business
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setShowRejectDialog(true);
                }}
              >
                <XCircle className="h-4 w-4 me-1" />
                Reject Business
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Rejection Dialog */}
      {showRejectDialog && selectedBusiness && (
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Business</DialogTitle>
              <DialogDescription>{tj("Please provide a reason for rejecting {0}", selectedBusiness.name)}</DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleReject}
                disabled={!rejectionReason}
              >
                Reject Business
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}