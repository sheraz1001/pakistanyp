import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SocialMediaPreviewGenerator } from "@/components/social-media-preview-generator";
import { Badge } from "@/components/ui/badge";
import { Search, FileImage, Calendar, User, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { AdminShell } from "@/components/admin/admin-shell";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  author?: {
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  category?: string;
  publishedAt: string;
  featuredImage?: string;
  readingTime?: number;
}

export default function AdminSocialMediaGenerator() {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Fetch blog posts
  const { data: blogPosts = [], isLoading } = useQuery({
    queryKey: ["/api/blog"],
  });

  // Fetch blog categories
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/blog/categories"],
  });

  // Filter posts based on search and category
  const filteredPosts = blogPosts.filter((post: BlogPost) => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (selectedPost) {
    return (
      <AdminShell>
        <div>
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                onClick={() => setSelectedPost(null)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Posts
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <FileImage className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Social Media Preview Generator</h1>
                  <p className="text-gray-600">Generate social media cards for blog posts</p>
                </div>
              </div>
            </div>
            
            {/* Selected Post Info */}
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {selectedPost.featuredImage && (
                    <img
                      src={selectedPost.featuredImage}
                      alt={selectedPost.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">{selectedPost.title}</h3>
                    {selectedPost.excerpt && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{selectedPost.excerpt}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {selectedPost.author && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {selectedPost.author.firstName} {selectedPost.author.lastName}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(selectedPost.publishedAt).toLocaleDateString()}
                      </div>
                      {selectedPost.category && (
                        <Badge variant="outline" className="text-xs">
                          {selectedPost.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Social Media Preview Generator */}
          <SocialMediaPreviewGenerator post={selectedPost} />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#E8F4EC] rounded-[14px] flex items-center justify-center">
              <FileImage className="w-6 h-6 text-[#0B6B2E]" />
            </div>
            <div>
              <h1 className="text-[28px] sm:text-[32px] font-bold tracking-[-0.04em] text-[#0A0A0A]">Social Media Preview Generator</h1>
              <p className="text-gray-600">Create professional social media cards for blog posts</p>
            </div>
          </div>

          {/* Navigation Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
            <Link href="/admin/dashboard" className="hover:text-blue-600">Admin Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900">Social Media Generator</span>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search blog posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category: any) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardContent className="p-0">
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredPosts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No blog posts found</h3>
              <p className="text-gray-600">
                {searchTerm || selectedCategory !== "all" 
                  ? "Try adjusting your search criteria"
                  : "Create your first blog post to get started"
                }
              </p>
            </div>
          ) : (
            filteredPosts.map((post: BlogPost) => (
              <Card key={post.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-0">
                  {post.featuredImage && (
                    <div className="h-48 overflow-hidden rounded-t-lg">
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-3">{post.excerpt}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {post.author && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {post.author.firstName} {post.author.lastName}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(post.publishedAt).toLocaleDateString()}
                        </div>
                      </div>
                      {post.category && (
                        <Badge variant="outline" className="text-xs">
                          {post.category}
                        </Badge>
                      )}
                    </div>
                    <Button
                      onClick={() => setSelectedPost(post)}
                      className="w-full mt-4 bg-blue-600 "
                    >
                      Generate Social Media Cards
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminShell>
  );
}