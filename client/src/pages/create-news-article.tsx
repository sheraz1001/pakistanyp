import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Upload, X, Eye, Save, Send, Image as ImageIcon, Tag, Target, Zap, FileText, Globe, Search, BarChart3 } from "lucide-react";
import { Helmet } from "@/lib/helmet-compat";

interface NewsArticle {
  title: string;
  content: string;
  excerpt: string;
  categoryId: string;
  tags: string[];
  featuredImage: string;
  isFeatured: boolean;
  isPinned: boolean;
  status: "draft" | "published" | "scheduled";
  publishedAt?: Date;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  canonicalUrl: string;
  socialImage: string;
  authorId: string;
}

export default function CreateNewsArticle() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [article, setArticle] = useState<NewsArticle>({
    title: "",
    content: "",
    excerpt: "",
    categoryId: "",
    tags: [],
    featuredImage: "",
    isFeatured: false,
    isPinned: false,
    status: "draft",
    metaTitle: "",
    metaDescription: "",
    keywords: [],
    canonicalUrl: "",
    socialImage: "",
    authorId: "admin"
  });

  // SEO and content analysis
  const [seoScore, setSeoScore] = useState(0);
  const [seoFactors, setSeoFactors] = useState<string[]>([]);
  const [readabilityScore, setReadabilityScore] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("content");

  // Fetch news categories
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/news/categories"],
  });

  // Calculate SEO score based on content
  const calculateSEOScore = () => {
    let score = 0;
    const factors = [];

    // Title optimization (20 points)
    if (article.title.length >= 30 && article.title.length <= 60) {
      score += 20;
      factors.push("Title length optimal (30-60 chars)");
    } else if (article.title.length > 0) {
      score += 10;
      factors.push("Title present but not optimal length");
    }

    // Meta description (15 points)
    if (article.metaDescription.length >= 120 && article.metaDescription.length <= 160) {
      score += 15;
      factors.push("Meta description length optimal");
    } else if (article.metaDescription.length > 0) {
      score += 8;
      factors.push("Meta description present");
    }

    // Content length (15 points)
    if (wordCount >= 300) {
      score += 15;
      factors.push("Content length sufficient (300+ words)");
    } else if (wordCount >= 150) {
      score += 8;
      factors.push("Content length moderate");
    }

    // Keywords (10 points)
    if (article.keywords.length >= 3) {
      score += 10;
      factors.push("Keywords well defined");
    } else if (article.keywords.length > 0) {
      score += 5;
      factors.push("Some keywords defined");
    }

    // Featured image (10 points)
    if (article.featuredImage) {
      score += 10;
      factors.push("Featured image present");
    }

    // Excerpt (10 points)
    if (article.excerpt.length >= 100 && article.excerpt.length <= 200) {
      score += 10;
      factors.push("Excerpt length optimal");
    } else if (article.excerpt.length > 0) {
      score += 5;
      factors.push("Excerpt present");
    }

    // Tags (10 points)
    if (article.tags.length >= 3 && article.tags.length <= 8) {
      score += 10;
      factors.push("Tags well balanced");
    } else if (article.tags.length > 0) {
      score += 5;
      factors.push("Some tags present");
    }

    // Category selection (5 points)
    if (article.categoryId) {
      score += 5;
      factors.push("Category selected");
    }

    // Canonical URL (5 points)
    if (article.canonicalUrl) {
      score += 5;
      factors.push("Canonical URL set");
    }

    setSeoScore(Math.min(score, 100));
    return factors;
  };

  // Calculate readability score
  const calculateReadabilityScore = () => {
    if (!article.content) return 0;
    
    const sentences = article.content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const words = article.content.split(/\s+/).filter(w => w.length > 0).length;
    const syllables = article.content.split(/\s+/).reduce((acc, word) => {
      return acc + Math.max(1, word.toLowerCase().replace(/[^a-z]/g, '').replace(/[aeiouy]+/g, 'a').length);
    }, 0);

    if (sentences === 0 || words === 0) return 0;

    // Flesch Reading Ease approximation
    const score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
    return Math.max(0, Math.min(100, score));
  };

  // Update content analysis
  useEffect(() => {
    const words = article.content.split(/\s+/).filter(w => w.length > 0).length;
    setWordCount(words);
    setReadingTime(Math.ceil(words / 200)); // 200 words per minute
    setReadabilityScore(calculateReadabilityScore());
    setSeoFactors(calculateSEOScore());
  }, [article]);

  // Handle image upload
  const handleImageUpload = async (file: File, type: 'featured' | 'social') => {
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      if (type === 'featured') {
        setArticle(prev => ({ ...prev, featuredImage: data.url }));
      } else {
        setArticle(prev => ({ ...prev, socialImage: data.url }));
      }

      toast({
        title: "Image uploaded successfully",
        description: `${type === 'featured' ? 'Featured' : 'Social'} image has been uploaded.`
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Create article mutation
  const createArticleMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/news", data),
    onSuccess: () => {
      toast({
        title: "Article created successfully",
        description: "Your news article has been saved."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      setLocation("/super-admin-simple");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create article",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (status: "draft" | "published") => {
    const articleData = {
      ...article,
      status,
      categoryId: parseInt(article.categoryId),
      publishedAt: status === "published" ? new Date() : undefined
    };

    createArticleMutation.mutate(articleData);
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !article.tags.includes(tag.trim())) {
      setArticle(prev => ({ ...prev, tags: [...prev.tags, tag.trim()] }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setArticle(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  const addKeyword = (keyword: string) => {
    if (keyword.trim() && !article.keywords.includes(keyword.trim())) {
      setArticle(prev => ({ ...prev, keywords: [...prev.keywords, keyword.trim()] }));
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    setArticle(prev => ({ ...prev, keywords: prev.keywords.filter(keyword => keyword !== keywordToRemove) }));
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <Helmet>
        <title>Create News Article - PakistanYP Admin</title>
        <meta name="description" content="Create and publish news articles with advanced SEO optimization" />
      </Helmet>

      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#0A0A0A]">Create News Article</h1>
                <p className="text-gray-600 mt-2">Create and publish news articles with advanced SEO optimization</p>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="outline" onClick={() => setLocation("/super-admin-simple")}>
                  Cancel
                </Button>
                <Button onClick={() => handleSubmit("draft")} disabled={createArticleMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button onClick={() => handleSubmit("published")} disabled={createArticleMutation.isPending}>
                  <Send className="h-4 w-4 mr-2" />
                  Publish
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="content">
                    <FileText className="h-4 w-4 mr-2" />
                    Content
                  </TabsTrigger>
                  <TabsTrigger value="seo">
                    <Search className="h-4 w-4 mr-2" />
                    SEO & Meta
                  </TabsTrigger>
                  <TabsTrigger value="media">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Media
                  </TabsTrigger>
                  <TabsTrigger value="settings">
                    <Target className="h-4 w-4 mr-2" />
                    Settings
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Article Content</CardTitle>
                      <CardDescription>Write your news article content</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="title">Article Title *</Label>
                        <Input
                          id="title"
                          value={article.title}
                          onChange={(e) => setArticle(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Enter article title"
                          className="mt-1"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          {article.title.length}/60 characters (30-60 recommended)
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="excerpt">Excerpt *</Label>
                        <Textarea
                          id="excerpt"
                          value={article.excerpt}
                          onChange={(e) => setArticle(prev => ({ ...prev, excerpt: e.target.value }))}
                          placeholder="Brief summary of the article"
                          rows={3}
                          className="mt-1"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          {article.excerpt.length}/200 characters (100-200 recommended)
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="content">Article Content *</Label>
                        <Textarea
                          id="content"
                          value={article.content}
                          onChange={(e) => setArticle(prev => ({ ...prev, content: e.target.value }))}
                          placeholder="Write your article content here..."
                          rows={15}
                          className="mt-1"
                        />
                        <div className="flex justify-between text-sm text-gray-500 mt-1">
                          <span>{wordCount} words</span>
                          <span>{readingTime} min read</span>
                        </div>
                      </div>

                      <div>
                        <Label>Tags</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {article.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                              {tag} <X className="h-3 w-3 ml-1" />
                            </Badge>
                          ))}
                        </div>
                        <Input
                          placeholder="Add tags (press Enter)"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addTag(e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="seo" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>SEO Optimization</CardTitle>
                      <CardDescription>Optimize your article for search engines</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="metaTitle">Meta Title</Label>
                        <Input
                          id="metaTitle"
                          value={article.metaTitle}
                          onChange={(e) => setArticle(prev => ({ ...prev, metaTitle: e.target.value }))}
                          placeholder="SEO title (if different from article title)"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="metaDescription">Meta Description</Label>
                        <Textarea
                          id="metaDescription"
                          value={article.metaDescription}
                          onChange={(e) => setArticle(prev => ({ ...prev, metaDescription: e.target.value }))}
                          placeholder="Description for search results"
                          rows={3}
                          className="mt-1"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          {article.metaDescription.length}/160 characters
                        </p>
                      </div>

                      <div>
                        <Label>SEO Keywords</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {article.keywords.map(keyword => (
                            <Badge key={keyword} variant="outline" className="cursor-pointer" onClick={() => removeKeyword(keyword)}>
                              {keyword} <X className="h-3 w-3 ml-1" />
                            </Badge>
                          ))}
                        </div>
                        <Input
                          placeholder="Add SEO keywords (press Enter)"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addKeyword(e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                      </div>

                      <div>
                        <Label htmlFor="canonicalUrl">Canonical URL</Label>
                        <Input
                          id="canonicalUrl"
                          value={article.canonicalUrl}
                          onChange={(e) => setArticle(prev => ({ ...prev, canonicalUrl: e.target.value }))}
                          placeholder="https://pakistanyp.com/news/article-slug"
                          className="mt-1"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="media" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Media Management</CardTitle>
                      <CardDescription>Upload and manage article images</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Featured Image */}
                      <div>
                        <Label>Featured Image</Label>
                        <div className="mt-2">
                          {article.featuredImage ? (
                            <div className="relative">
                              <img
                                src={article.featuredImage}
                                alt="Featured"
                                className="w-full h-48 object-cover rounded-lg border"
                              />
                              <Button
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={() => setArticle(prev => ({ ...prev, featuredImage: "" }))}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                              <p className="text-gray-600 mb-4">Upload featured image</p>
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(file, 'featured');
                                }}
                                disabled={isUploading}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Social Media Image */}
                      <div>
                        <Label>Social Media Image (Optional)</Label>
                        <div className="mt-2">
                          {article.socialImage ? (
                            <div className="relative">
                              <img
                                src={article.socialImage}
                                alt="Social"
                                className="w-full h-32 object-cover rounded-lg border"
                              />
                              <Button
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={() => setArticle(prev => ({ ...prev, socialImage: "" }))}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                              <ImageIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                              <p className="text-sm text-gray-600 mb-2">Upload social media image</p>
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(file, 'social');
                                }}
                                disabled={isUploading}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Article Settings</CardTitle>
                      <CardDescription>Configure publication settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="category">Category *</Label>
                        <Select value={article.categoryId} onValueChange={(value) => setArticle(prev => ({ ...prev, categoryId: value }))}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category: any) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="featured">Featured Article</Label>
                          <p className="text-sm text-gray-500">Display prominently on homepage</p>
                        </div>
                        <Switch
                          id="featured"
                          checked={article.isFeatured}
                          onCheckedChange={(checked) => setArticle(prev => ({ ...prev, isFeatured: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="pinned">Pinned Article</Label>
                          <p className="text-sm text-gray-500">Keep at top of news list</p>
                        </div>
                        <Switch
                          id="pinned"
                          checked={article.isPinned}
                          onCheckedChange={(checked) => setArticle(prev => ({ ...prev, isPinned: checked }))}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* SEO Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    SEO Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-blue-600">{seoScore}%</div>
                    <Progress value={seoScore} className="mt-2" />
                  </div>
                  <div className="space-y-2">
                    {seoFactors.map((factor, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-gray-600">{factor}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Readability Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Eye className="h-5 w-5 mr-2" />
                    Readability
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-green-600">{Math.round(readabilityScore)}%</div>
                    <Progress value={readabilityScore} className="mt-2" />
                  </div>
                  <div className="text-sm text-gray-600">
                    {readabilityScore >= 70 ? "Easy to read" : 
                     readabilityScore >= 50 ? "Fairly easy to read" : 
                     "Difficult to read"}
                  </div>
                </CardContent>
              </Card>

              {/* Content Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Content Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Word Count:</span>
                    <span className="font-medium">{wordCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reading Time:</span>
                    <span className="font-medium">{readingTime} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Character Count:</span>
                    <span className="font-medium">{article.content.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tags:</span>
                    <span className="font-medium">{article.tags.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Keywords:</span>
                    <span className="font-medium">{article.keywords.length}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Article
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Globe className="h-4 w-4 mr-2" />
                    Check SEO
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Zap className="h-4 w-4 mr-2" />
                    AI Suggestions
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}