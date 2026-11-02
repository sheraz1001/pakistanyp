import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  FileText, 
  Phone, 
  Mail, 
  User,
  AlertCircle,
  Plus,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { OwnerShell } from '@/components/owner-shell';

interface BusinessClaim {
  id: number;
  businessId: number;
  businessName: string;
  status: 'pending' | 'approved' | 'rejected';
  relationshipToBusiness: string;
  businessEmail?: string;
  businessPhone?: string;
  position?: string;
  verificationMethod: string;
  additionalInfo?: string;
  rejectionReason?: string;
  createdAt: string;
  processedAt?: string;
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'bg-[#FFF4E0] text-[#B45309]',
    bgColor: 'bg-[#FFF4E0] text-[#B45309]',
    borderColor: 'border-[#F5DDB0]'
  },
  approved: {
    icon: CheckCircle,
    color: 'bg-[#E6F6F1] text-[#065F46]',
    bgColor: 'bg-[#F2F9F4] text-[#05501F]',
    borderColor: 'border-[#CFE8D8]'
  },
  rejected: {
    icon: XCircle,
    color: 'bg-[#FDECEC] text-[#B91C1C]',
    bgColor: 'bg-[#FDECEC] text-[#B91C1C]',
    borderColor: 'border-[#F6C9CB]'
  }
};

export default function DashboardBusinessClaims() {
  const [selectedClaim, setSelectedClaim] = useState<BusinessClaim | null>(null);

  const { data: claims = [], isLoading } = useQuery({
    queryKey: ['/api/user/business-claims']
  });

  const { data: userStats } = useQuery({
    queryKey: ['/api/user/stats']
  });

  const pendingClaims = claims.filter((claim: BusinessClaim) => claim.status === 'pending');
  const approvedClaims = claims.filter((claim: BusinessClaim) => claim.status === 'approved');
  const rejectedClaims = claims.filter((claim: BusinessClaim) => claim.status === 'rejected');

  if (isLoading) {
    return (
      <OwnerShell title="Business Claims" subtitle="Manage your business ownership claims and track their status">
        <div className="animate-pulse">
          <div className="h-8 bg-[#EEF0F4] rounded-[20px] w-1/3 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-[#EEF0F4] rounded-[20px]"></div>
            ))}
          </div>
          <div className="h-64 bg-[#EEF0F4] rounded-[20px] mt-6"></div>
        </div>
      </OwnerShell>
    );
  }

  return (
    <OwnerShell
      title="Business Claims"
      subtitle="Manage your business ownership claims and track their status"
      actions={
        <Link href="/businesses" className="yp-btn yp-btn-primary">
          <Plus className="h-4 w-4" />
          Claim New Business
        </Link>
      }
    >
    <div className="space-y-6">

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-[14px] bg-[#E8F4EC]">
                <Building2 className="h-5 w-5 text-[#0B6B2E]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Claims</p>
                <p className="text-[34px] font-bold leading-none tracking-[-0.04em] mt-1">{claims.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-[14px] bg-[#FFF4E0]">
                <Clock className="h-5 w-5 text-[#B45309]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-[34px] font-bold leading-none tracking-[-0.04em] mt-1">{pendingClaims.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-[14px] bg-[#E6F6F1]">
                <CheckCircle className="h-5 w-5 text-[#047857]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-[34px] font-bold leading-none tracking-[-0.04em] mt-1">{approvedClaims.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-[14px] bg-[#FDECEC]">
                <XCircle className="h-5 w-5 text-[#B91C1C]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-[34px] font-bold leading-none tracking-[-0.04em] mt-1">{rejectedClaims.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Claims Management */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Claims ({claims.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingClaims.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedClaims.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedClaims.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <ClaimsTable claims={claims} onViewDetails={setSelectedClaim} />
        </TabsContent>

        <TabsContent value="pending">
          <ClaimsTable claims={pendingClaims} onViewDetails={setSelectedClaim} />
        </TabsContent>

        <TabsContent value="approved">
          <ClaimsTable claims={approvedClaims} onViewDetails={setSelectedClaim} />
        </TabsContent>

        <TabsContent value="rejected">
          <ClaimsTable claims={rejectedClaims} onViewDetails={setSelectedClaim} />
        </TabsContent>
      </Tabs>

      {/* Claim Details Modal */}
      {selectedClaim && (
        <ClaimDetailsModal 
          claim={selectedClaim} 
          onClose={() => setSelectedClaim(null)} 
        />
      )}
    </div>
    </OwnerShell>
  );
}

function ClaimsTable({ 
  claims, 
  onViewDetails 
}: { 
  claims: BusinessClaim[]; 
  onViewDetails: (claim: BusinessClaim) => void;
}) {
  if (claims.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Claims Found</h3>
          <p className="text-gray-600 mb-4">You haven't submitted any business claims yet.</p>
          <Link href="/businesses">
            <Button>Find Businesses to Claim</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow>
              <TableHead>Business</TableHead>
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
                    <Badge className={`${status.color} border-0 rounded-full capitalize`}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {claim.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize">{claim.relationshipToBusiness.replace('_', ' ')}</span>
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
                        Details
                      </Button>
                      <Link href={`/business/${claim.businessId}`}>
                        <Button variant="ghost" size="sm">
                          <Building2 className="mr-1 h-3 w-3" />
                          View Business
                        </Button>
                      </Link>
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
  onClose 
}: { 
  claim: BusinessClaim; 
  onClose: () => void;
}) {
  const status = statusConfig[claim.status];
  const StatusIcon = status.icon;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
                  {claim.status === 'pending' && "Your claim is being reviewed by our team"}
                  {claim.status === 'approved' && "Congratulations! Your claim has been approved"}
                  {claim.status === 'rejected' && "Your claim was not approved. See details below"}
                </p>
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div>
            <h3 className="font-semibold mb-3">Business Information</h3>
            <div className="yp-panel p-4 space-y-2">
              <p><strong>Name:</strong> {claim.businessName}</p>
              <p><strong>Business ID:</strong> {claim.businessId}</p>
              <Link href={`/business/${claim.businessId}`}>
                <Button variant="outline" size="sm" className="mt-2">
                  <Building2 className="mr-1 h-3 w-3" />
                  View Business Profile
                </Button>
              </Link>
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

              <div className="grid gap-4 md:grid-cols-2">
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

              {claim.additionalInfo && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Additional Information</label>
                  <div className="yp-panel p-3 mt-1">
                    <p className="text-sm">{claim.additionalInfo}</p>
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

          {/* Timeline */}
          <div>
            <h3 className="font-semibold mb-3">Timeline</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-[#0B6B2E] rounded-full"></div>
                <span>Claim submitted on {format(new Date(claim.createdAt), 'MMM dd, yyyy HH:mm')}</span>
              </div>
              {claim.processedAt && (
                <div className="flex items-center gap-3 text-sm">
                  <div className={`w-2 h-2 rounded-full ${claim.status === 'approved' ? 'bg-[#0B6B2E]' : 'bg-[#D71920]'}`}></div>
                  <span>
                    Claim {claim.status} on {format(new Date(claim.processedAt), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            {claim.status === 'rejected' && (
              <Link href={`/business/${claim.businessId}/claim`}>
                <Button>Submit New Claim</Button>
              </Link>
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