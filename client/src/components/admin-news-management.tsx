import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Star, 
  Pin, 
  AlertTriangle,
  Calendar,
  Filter,
  Search,
  MoreHorizontal,
  Upload,
  Image as ImageIcon
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NewsArticle {
  id: number;
  title: string;
  slug: string;
  summary?: string;
  content?: string;
  author?: string;
  source?: string;
  imageUrl?: string;
  categoryId?: number;
  category?: string;
  tags?: string[];
  publishedAt: string;
  viewCount: number;
  shareCount: number;
  likeCount: number;
  isFeatured: boolean;
  isPinned: boolean;
  priority: string;
  status: string;
}

interface NewsCategory {
  id: number;
  name: string;
  slug: string;
  color: string;
  description?: string;
}

// Blog Image Uploader Component
const BlogImageUploader = ({ onImageUploaded }: { onImageUploaded: (url: string) => void }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload/blog-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      if (result.success) {
        onImageUploaded(result.url);
        toast({
          title: "Image uploaded",
          description: `${result.originalName} uploaded successfully`,
        });
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Blog image upload error:', error);
      toast({
        title: "Upload failed",  
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="flex items-center gap-2"
      >
        {isUploading ? (
          <>
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Upload Image
          </>
        )}
      </Button>
    </div>
  );
};

export default function AdminNewsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);

  // Form state for editing articles  
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    content: "",
    author: "",
    source: "",
    imageUrl: "",
    categoryId: "",
    tags: "",
    isFeatured: false,
    isPinned: false,
    priority: "normal",
    status: "published"
  });

  // Fetch news articles
  const { data: articles = [], isLoading: articlesLoading, refetch: refetchArticles } = useQuery({
    queryKey: ['/api/news'],
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/news/categories'],
  });



  // Update article mutation
  const updateArticle = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest("PUT", `/api/news/${id}`, {
        ...data,
        categoryId: data.categoryId ? parseInt(data.categoryId) : undefined,
        tags: data.tags ? data.tags.split(',').map((tag: string) => tag.trim()) : []
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "News article updated successfully",
      });
      setEditingArticle(null);
      resetForm();
      refetchArticles();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update article",
        variant: "destructive",
      });
    },
  });

  // Delete article mutation
  const deleteArticle = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/news/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "News article deleted successfully",
      });
      refetchArticles();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete article",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      summary: "",
      content: "",
      author: "",
      source: "",
      imageUrl: "",
      categoryId: "",
      tags: "",
      isFeatured: false,
      isPinned: false,
      priority: "normal",
      status: "published"
    });
  };

  const handleEdit = (article: NewsArticle) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      summary: article.summary || "",
      content: article.content || "",
      author: article.author || "",
      source: article.source || "",
      imageUrl: article.imageUrl || "",
      categoryId: article.categoryId?.toString() || "",
      tags: Array.isArray(article.tags) ? article.tags.join(', ') : "",
      isFeatured: article.isFeatured,
      isPinned: article.isPinned,
      priority: article.priority,
      status: article.status
    });
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast({
        title: "Error", 
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    if (editingArticle) {
      updateArticle.mutate({ id: editingArticle.id, data: formData });
    }
  };

  // Filter articles based on search and filters
  const filteredArticles = (articles as NewsArticle[]).filter((article: NewsArticle) => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || article.categoryId?.toString() === selectedCategory;
    const matchesStatus = selectedStatus === "all" || article.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getCategoryColor = (categoryId: number) => {
    const category = (categories as NewsCategory[]).find((c: NewsCategory) => c.id === categoryId);
    return category?.color || '#1f2937';
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
      case 'breaking':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-[#B45309]" />;
      default:
        return null;
    }
  };

  const ArticleForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter article title"
          />
        </div>
        <div>
          <Label htmlFor="author">Author</Label>
          <Input
            id="author"
            value={formData.author}
            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            placeholder="Enter author name"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="summary">Summary</Label>
        <Textarea
          id="summary"
          value={formData.summary}
          onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
          placeholder="Enter article summary"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Enter article content (HTML supported)"
          rows={6}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="categoryId">Category</Label>
          <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {(categories as NewsCategory[]).map((category: NewsCategory) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="breaking">Breaking</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="imageUrl">Image URL</Label>
          <Input
            id="imageUrl"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            placeholder="Enter image URL"
          />
          <BlogImageUploader onImageUploaded={(url) => setFormData({ ...formData, imageUrl: url })} />
        </div>
        <div>
          <Label htmlFor="source">Source</Label>
          <Input
            id="source"
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            placeholder="Enter news source"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          placeholder="Enter tags separated by commas"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="isFeatured"
            checked={formData.isFeatured}
            onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
          />
          <Label htmlFor="isFeatured">Featured</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="isPinned"
            checked={formData.isPinned}
            onCheckedChange={(checked) => setFormData({ ...formData, isPinned: checked })}
          />
          <Label htmlFor="isPinned">Pinned</Label>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            News Management
          </CardTitle>
          <Button onClick={() => setLocation("/create-news-article")}>
            <Plus className="w-4 h-4 mr-2" />
            Create Article
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {(categories as NewsCategory[]).map((category: NewsCategory) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-sm text-gray-500 flex items-center">
            {filteredArticles.length} of {(articles as NewsArticle[]).length} articles
          </div>
        </div>

        {/* Articles List */}
        {articlesLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded mb-4"></div>
              </div>
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Articles Found</h3>
            <p className="text-gray-500">
              {searchQuery ? `No articles match "${searchQuery}"` : 'No articles available'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredArticles.map((article: NewsArticle) => (
              <Card key={article.id} className="border-l-4" style={{ borderLeftColor: getCategoryColor(article.categoryId || 0) }}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getPriorityIcon(article.priority)}
                        <Badge variant="outline" style={{ backgroundColor: getCategoryColor(article.categoryId || 0), color: 'white' }}>
                          {article.category || 'General'}
                        </Badge>
                        <Badge variant="outline">
                          {article.status}
                        </Badge>
                        {article.isFeatured && <Star className="w-4 h-4 text-[#F59E0B]" />}
                        {article.isPinned && <Pin className="w-4 h-4 text-blue-500" />}
                      </div>
                      
                      <h3 className="font-bold text-lg mb-2">{article.title}</h3>
                      
                      {article.summary && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {article.summary}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {article.author && (
                          <span>by {article.author}</span>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {article.viewCount} views
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(article)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this article?')) {
                            deleteArticle.mutate(article.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingArticle} onOpenChange={(open) => !open && setEditingArticle(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit News Article</DialogTitle>
            </DialogHeader>
            <ArticleForm />
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditingArticle(null)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={updateArticle.isPending}>
                {updateArticle.isPending ? "Updating..." : "Update Article"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}