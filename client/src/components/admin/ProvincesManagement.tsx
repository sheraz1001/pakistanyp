import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Upload, 
  Eye, 
  Users, 
  MapPin, 
  Image as ImageIcon,
  Globe,
  Settings,
  Save,
  X
} from "lucide-react";

interface Province {
  id: number;
  name: string;
  description: string;
  detailedDescription?: string;
  homepageImage?: string;
  headerImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  isActive: boolean;
  isPublished: boolean;
  sortOrder: number;
  viewCount: number;
  businessCount?: number;
  localityCount?: number;
  createdAt: string;
  updatedAt: string;
}

export default function ProvincesManagement() {
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch provinces with statistics
  const { data: provinces = [], isLoading } = useQuery({
    queryKey: ['/api/provinces', { with_stats: 'true' }],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Create province mutation
  const createMutation = useMutation({
    mutationFn: async (provinceData: any) => {
      return apiRequest('POST', '/api/admin/provinces', provinceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/provinces'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Province created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create province",
        variant: "destructive",
      });
    },
  });

  // Update province mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest('PUT', `/api/admin/provinces/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/provinces'] });
      setIsEditDialogOpen(false);
      setSelectedProvince(null);
      toast({
        title: "Success",
        description: "Province updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update province",
        variant: "destructive",
      });
    },
  });

  // Delete province mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/admin/provinces/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/provinces'] });
      toast({
        title: "Success",
        description: "Province deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete province",
        variant: "destructive",
      });
    },
  });

  // Update image mutation
  const updateImageMutation = useMutation({
    mutationFn: async ({ id, imageType, imageUrl }: { id: number; imageType: string; imageUrl: string }) => {
      return apiRequest('PUT', `/api/admin/provinces/${id}/image`, { imageType, imageUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/provinces'] });
      toast({
        title: "Success",
        description: "Province image updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update province image",
        variant: "destructive",
      });
    },
  });

  const handleCreateProvince = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const provinceData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      detailedDescription: formData.get('detailedDescription') as string,
      metaTitle: formData.get('metaTitle') as string,
      metaDescription: formData.get('metaDescription') as string,
      sortOrder: parseInt(formData.get('sortOrder') as string) || 0,
      isActive: formData.get('isActive') === 'on',
      isPublished: formData.get('isPublished') === 'on',
    };

    createMutation.mutate(provinceData);
  };

  const handleUpdateProvince = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProvince) return;

    const formData = new FormData(event.currentTarget);
    
    const updateData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      detailedDescription: formData.get('detailedDescription') as string,
      metaTitle: formData.get('metaTitle') as string,
      metaDescription: formData.get('metaDescription') as string,
      sortOrder: parseInt(formData.get('sortOrder') as string) || 0,
      isActive: formData.get('isActive') === 'on',
      isPublished: formData.get('isPublished') === 'on',
    };

    updateMutation.mutate({ id: selectedProvince.id, data: updateData });
  };

  const handleDeleteProvince = (province: Province) => {
    if (confirm(`Are you sure you want to delete ${province.name}? This action cannot be undone.`)) {
      deleteMutation.mutate(province.id);
    }
  };

  const handleImageUpload = (provinceId: number, imageType: 'homepage' | 'header') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Convert to base64 for demo - in production, upload to cloud storage
        const reader = new FileReader();
        reader.onload = () => {
          const imageUrl = reader.result as string;
          updateImageMutation.mutate({ id: provinceId, imageType, imageUrl });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading provinces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Provinces Management</h2>
          <p className="text-muted-foreground">
            Manage all Pakistani provinces with complete control over content and images
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Province
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Province</DialogTitle>
              <DialogDescription>
                Add a new province to Pakistan business directory
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateProvince} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Province Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Karachi"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input
                    id="sortOrder"
                    name="sortOrder"
                    type="number"
                    placeholder="0"
                    defaultValue="0"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Brief Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Brief description for cards and listings"
                  rows={3}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="detailedDescription">Detailed Description</Label>
                <Textarea
                  id="detailedDescription"
                  name="detailedDescription"
                  placeholder="Comprehensive description for individual province pages"
                  rows={5}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    name="metaTitle"
                    placeholder="SEO title for search engines"
                  />
                </div>
                <div>
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Input
                    id="metaDescription"
                    name="metaDescription"
                    placeholder="SEO description for search engines"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    defaultChecked
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPublished"
                    name="isPublished"
                    defaultChecked
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isPublished">Published</Label>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Province"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Provinces Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {provinces.map((province: Province) => (
          <Card key={province.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{province.name}</CardTitle>
                <div className="flex items-center gap-1">
                  <Badge variant={province.isActive ? "default" : "secondary"}>
                    {province.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {province.isPublished && (
                    <Badge variant="outline">Published</Badge>
                  )}
                </div>
              </div>
              <CardDescription className="line-clamp-2">
                {province.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {province.businessCount || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Businesses</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {province.localityCount || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Localities</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {province.viewCount || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Views</div>
                </div>
              </div>
              
              {/* Images */}
              <div className="grid grid-cols-2 gap-2">
                <div className="aspect-video bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center relative group">
                  {province.homepageImage ? (
                    <img 
                      src={province.homepageImage} 
                      alt="Homepage" 
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="h-6 w-6 text-gray-400 mx-auto" />
                      <span className="text-xs text-gray-500">Homepage</span>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleImageUpload(province.id, 'homepage')}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="aspect-video bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center relative group">
                  {province.headerImage ? (
                    <img 
                      src={province.headerImage} 
                      alt="Header" 
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="h-6 w-6 text-gray-400 mx-auto" />
                      <span className="text-xs text-gray-500">Header</span>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleImageUpload(province.id, 'header')}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedProvince(province);
                    setIsEditDialogOpen(true);
                  }}
                  className="flex items-center gap-1"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteProvince(province)}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      {selectedProvince && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit {selectedProvince.name}</DialogTitle>
              <DialogDescription>
                Update province information and settings
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleUpdateProvince} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Province Name</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={selectedProvince.name}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-sortOrder">Sort Order</Label>
                  <Input
                    id="edit-sortOrder"
                    name="sortOrder"
                    type="number"
                    defaultValue={selectedProvince.sortOrder}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-description">Brief Description</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  defaultValue={selectedProvince.description}
                  rows={3}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="edit-detailedDescription">Detailed Description</Label>
                <Textarea
                  id="edit-detailedDescription"
                  name="detailedDescription"
                  defaultValue={selectedProvince.detailedDescription || ''}
                  rows={5}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-metaTitle">Meta Title</Label>
                  <Input
                    id="edit-metaTitle"
                    name="metaTitle"
                    defaultValue={selectedProvince.metaTitle || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-metaDescription">Meta Description</Label>
                  <Input
                    id="edit-metaDescription"
                    name="metaDescription"
                    defaultValue={selectedProvince.metaDescription || ''}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-isActive"
                    name="isActive"
                    defaultChecked={selectedProvince.isActive}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="edit-isActive">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-isPublished"
                    name="isPublished"
                    defaultChecked={selectedProvince.isPublished}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="edit-isPublished">Published</Label>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedProvince(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Updating..." : "Update Province"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}