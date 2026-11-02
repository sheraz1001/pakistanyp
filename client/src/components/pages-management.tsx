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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Globe,
  Calendar,
  Search,
  Code
} from "lucide-react";
import { format } from "date-fns";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { t as tx } from "@shared/i18n";
import { tj } from "@/i18n-jsx/tj";

interface Page {
  id: number;
  title: string;
  slug: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  status: 'published' | 'draft';
  template: 'default' | 'full-width' | 'landing' | 'custom';
  isPublic: boolean;
  publishedAt?: string;
  updatedAt: string;
  author: string;
  views: number;
}

export default function PagesManagement() {
  const { toast } = useToast();
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    metaTitle: "",
    metaDescription: "",
    template: "default" as Page['template'],
    status: "draft" as Page['status'],
    isPublic: true
  });

  // Fetch pages
  const { data: pages = [], isLoading } = useQuery({
    queryKey: ['/api/admin/pages'],
    queryFn: async () => {
      // Return sample data
      return [
        {
          id: 1,
          title: "About PakistanYP",
          slug: "about-us",
          content: "<h1>About Pakistan Yellow Pages</h1><p>Leading business directory...</p>",
          metaTitle: "About PakistanYP - Pakistan's Premier Business Directory",
          metaDescription: "Learn about PakistanYP, the leading business directory in Pakistan",
          status: 'published' as const,
          template: 'default' as const,
          isPublic: true,
          publishedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
          author: "Admin User",
          views: 1245
        },
        {
          id: 2,
          title: "Partnership Opportunities",
          slug: "partnerships",
          content: "<h1>Partner with PakistanYP</h1><p>Grow your business...</p>",
          status: 'published' as const,
          template: 'landing' as const,
          isPublic: true,
          publishedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          author: "Marketing Team",
          views: 567
        },
        {
          id: 3,
          title: "API Documentation",
          slug: "api-docs",
          content: "<h1>API Documentation</h1><p>Technical documentation...</p>",
          status: 'draft' as const,
          template: 'full-width' as const,
          isPublic: false,
          updatedAt: new Date().toISOString(),
          author: "Dev Team",
          views: 89
        }
      ];
    }
  });

  // Create page mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest('/api/admin/pages', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Page Created",
        description: "The page has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pages'] });
      setShowAddDialog(false);
      resetForm();
    }
  });

  // Update page mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & typeof formData) => {
      return apiRequest(`/api/admin/pages/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Page Updated",
        description: "The page has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pages'] });
      setSelectedPage(null);
      resetForm();
    }
  });

  // Delete page mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/admin/pages/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "Page Deleted",
        description: "The page has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pages'] });
    }
  });

  // Duplicate page mutation
  const duplicateMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/admin/pages/${id}/duplicate`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      toast({
        title: "Page Duplicated",
        description: "The page has been duplicated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pages'] });
    }
  });

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      content: "",
      metaTitle: "",
      metaDescription: "",
      template: "default",
      status: "draft",
      isPublic: true
    });
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSubmit = () => {
    if (selectedPage) {
      updateMutation.mutate({ id: selectedPage.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return <div>Loading pages...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pages.length}</div>
            <p className="text-xs text-muted-foreground">Static pages</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Globe className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pages.filter(p => p.status === 'published').length}
            </div>
            <p className="text-xs text-muted-foreground">Live pages</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Edit className="h-4 w-4 text-[#B45309]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pages.filter(p => p.status === 'draft').length}
            </div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pages.reduce((acc, p) => acc + p.views, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Pages Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Static Pages</CardTitle>
          <Button onClick={() => {
            setSelectedPage(null);
            resetForm();
            setShowAddDialog(true);
          }}>
            <Plus className="h-4 w-4 me-2" />
            Create Page
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{page.title}</div>
                      <div className="text-sm text-muted-foreground">{tj("By {0}", page.author)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <a 
                      href={`/${page.slug}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      /{page.slug}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge variant={page.status === 'published' ? 'default' : 'secondary'}>
                      {page.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{page.template}</TableCell>
                  <TableCell>{page.views.toLocaleString()}</TableCell>
                  <TableCell>
                    {format(new Date(page.updatedAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/${page.slug}`, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedPage(page);
                          setFormData({
                            title: page.title,
                            slug: page.slug,
                            content: page.content,
                            metaTitle: page.metaTitle || "",
                            metaDescription: page.metaDescription || "",
                            template: page.template,
                            status: page.status,
                            isPublic: page.isPublic
                          });
                          setShowAddDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => duplicateMutation.mutate(page.id)}
                      >
                        Duplicate
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm(tx("Delete page \"{0}\"?", page.title))) {
                            deleteMutation.mutate(page.id);
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

      {/* Add/Edit Page Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPage ? 'Edit Page' : 'Create New Page'}
            </DialogTitle>
            <DialogDescription>
              {selectedPage 
                ? 'Update the page content and settings.' 
                : 'Create a new static page for your website.'}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="content" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="seo">SEO Settings</TabsTrigger>
              <TabsTrigger value="settings">Page Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              <div>
                <Label htmlFor="title">Page Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (!selectedPage && !formData.slug) {
                      setFormData(prev => ({ 
                        ...prev, 
                        slug: generateSlug(e.target.value) 
                      }));
                    }
                  }}
                  placeholder="Enter page title"
                />
              </div>
              <div>
                <Label htmlFor="slug">URL Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/</span>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="page-url-slug"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="content">Page Content (HTML)</Label>
                <div className="space-y-2">
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewMode(!previewMode)}
                    >
                      {previewMode ? 'Edit' : 'Preview'}
                    </Button>
                  </div>
                  {previewMode ? (
                    <div 
                      className="prose max-w-none p-4 border rounded-lg min-h-[300px]"
                      dangerouslySetInnerHTML={{ __html: formData.content }}
                    />
                  ) : (
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Enter page content (HTML supported)"
                      rows={12}
                      className="font-mono text-sm"
                    />
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4">
              <div>
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={formData.metaTitle}
                  onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                  placeholder="SEO page title (60 characters max)"
                  maxLength={60}
                />
                <p className="text-sm text-muted-foreground mt-1">{tj("{0}/60 characters", formData.metaTitle.length)}</p>
              </div>
              <div>
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  placeholder="SEO page description (160 characters max)"
                  rows={3}
                  maxLength={160}
                />
                <p className="text-sm text-muted-foreground mt-1">{tj("{0}/160 characters", formData.metaDescription.length)}</p>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div>
                <Label htmlFor="template">Page Template</Label>
                <Select
                  value={formData.template}
                  onValueChange={(value) => 
                    setFormData({ ...formData, template: value as Page['template'] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="full-width">Full Width</SelectItem>
                    <SelectItem value="landing">Landing Page</SelectItem>
                    <SelectItem value="custom">Custom Template</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => 
                    setFormData({ ...formData, status: value as Page['status'] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isPublic">Public Page</Label>
                <Switch
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, isPublic: checked })
                  }
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.title || !formData.slug}>{tj("{0} Page", selectedPage ? 'Update' : 'Create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}