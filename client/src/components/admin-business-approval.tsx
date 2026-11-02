import React from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Eye, Phone, Mail, MapPin, Globe } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PendingBusiness {
  id: number;
  name: string;
  description: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  category: string;
  logo: string;
  adminApproved: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function AdminBusinessApproval() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingBusinesses = [], isLoading } = useQuery<PendingBusiness[]>({
    queryKey: ["/api/admin/businesses/pending"],
    queryFn: () => apiRequest("/api/admin/businesses/pending"),
  });

  const approveMutation = useMutation({
    mutationFn: async (businessId: number) => {
      return await apiRequest(`/api/admin/businesses/${businessId}/approve`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/businesses/pending"] });
      toast({
        title: "Business Approved",
        description: "The business has been approved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve business.",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (businessId: number) => {
      return await apiRequest(`/api/admin/businesses/${businessId}/reject`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/businesses/pending"] });
      toast({
        title: "Business Rejected",
        description: "The business has been rejected.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject business.",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Business Approval</h1>
        <p className="text-gray-600">Review and approve pending business listings</p>
      </div>

      {pendingBusinesses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
            <p className="text-gray-600">No pending businesses need approval.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {pendingBusinesses.map((business) => (
            <Card key={business.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {/* Business Logo */}
                    <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      {business.logo ? (
                        <img 
                          src={business.logo} 
                          alt={business.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {business.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <CardTitle className="text-xl">{business.name}</CardTitle>
                      <CardDescription className="mt-1">
                        <Badge variant="secondary" className="mr-2">
                          {business.category}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Submitted {formatDate(business.createdAt)}
                        </span>
                      </CardDescription>
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
              </CardHeader>
              
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Business Details */}
                  <div>
                    <h4 className="font-semibold mb-3">Business Information</h4>
                    {business.description && (
                      <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                        {business.description}
                      </p>
                    )}
                    
                    <div className="space-y-2">
                      {business.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{business.phone}</span>
                        </div>
                      )}
                      {business.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span>{business.email}</span>
                        </div>
                      )}
                      {business.address && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{business.address}</span>
                        </div>
                      )}
                      {business.website && (
                        <div className="flex items-center gap-2 text-sm">
                          <Globe className="h-4 w-4 text-gray-400" />
                          <a 
                            href={business.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {business.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Status */}
                  <div>
                    <h4 className="font-semibold mb-3">Status & Actions</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#B45309]" />
                        <span className="text-sm">Pending Approval</span>
                      </div>
                      
                      <div className="p-3 bg-[#FFF8EB] rounded-lg border border-[#FBE3B5]">
                        <p className="text-sm text-[#7C4A03]">
                          <strong>Review Required:</strong> This business is waiting for admin approval before going live.
                        </p>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Business ID: {business.id}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}