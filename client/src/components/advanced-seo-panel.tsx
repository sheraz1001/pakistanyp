import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { 
  Search, 
  Target, 
  TrendingUp, 
  BarChart3, 
  Globe, 
  Share2, 
  Eye, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  RefreshCw,
  BookOpen,
  Clock,
  Users,
  MessageSquare,
  Heart,
  ExternalLink,
  Copy,
  Zap,
  Award,
  Settings,
  ChevronRight,
  ChevronDown,
  Info,
  Lightbulb,
  Camera,
  Code
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SEOData {
  title: string;
  metaDescription: string;
  focusKeyword: string;
  content: string;
  featuredImage: string;
  tags: string[];
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  robots: string;
  schema: string;
}

interface SEOAnalysis {
  score: number;
  keywordDensity: number;
  readabilityScore: number;
  contentLength: number;
  suggestions: string[];
  warnings: string[];
  passed: string[];
}

interface AdvancedSEOPanelProps {
  seoData: SEOData;
  onSEODataChange: (data: Partial<SEOData>) => void;
}

export default function AdvancedSEOPanel({ seoData, onSEODataChange }: AdvancedSEOPanelProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [analysis, setAnalysis] = useState<SEOAnalysis>({
    score: 0,
    keywordDensity: 0,
    readabilityScore: 0,
    contentLength: 0,
    suggestions: [],
    warnings: [],
    passed: []
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    keywords: true,
    technical: false,
    social: false,
    schema: false
  });

  // Real-time SEO analysis
  useEffect(() => {
    const performAnalysis = () => {
      setIsAnalyzing(true);
      
      const suggestions: string[] = [];
      const warnings: string[] = [];
      const passed: string[] = [];
      let score = 0;

      // Title Analysis
      if (!seoData.title) {
        warnings.push("Missing page title");
      } else if (seoData.title.length < 30) {
        warnings.push("Title too short (< 30 characters)");
      } else if (seoData.title.length > 60) {
        warnings.push("Title too long (> 60 characters)");
      } else {
        passed.push("Title length is optimal");
        score += 15;
      }

      // Meta Description Analysis
      if (!seoData.metaDescription) {
        warnings.push("Missing meta description");
      } else if (seoData.metaDescription.length < 120) {
        suggestions.push("Meta description could be longer (120-160 characters)");
        score += 10;
      } else if (seoData.metaDescription.length > 160) {
        warnings.push("Meta description too long (> 160 characters)");
      } else {
        passed.push("Meta description length is optimal");
        score += 15;
      }

      // Focus Keyword Analysis
      if (!seoData.focusKeyword) {
        warnings.push("No focus keyword set");
      } else {
        const keyword = seoData.focusKeyword.toLowerCase();
        const titleContainsKeyword = seoData.title.toLowerCase().includes(keyword);
        const metaContainsKeyword = seoData.metaDescription.toLowerCase().includes(keyword);
        const contentContainsKeyword = seoData.content.toLowerCase().includes(keyword);

        if (titleContainsKeyword) {
          passed.push("Focus keyword appears in title");
          score += 10;
        } else {
          suggestions.push("Include focus keyword in title");
        }

        if (metaContainsKeyword) {
          passed.push("Focus keyword appears in meta description");
          score += 10;
        } else {
          suggestions.push("Include focus keyword in meta description");
        }

        if (contentContainsKeyword) {
          passed.push("Focus keyword appears in content");
          score += 10;
        } else {
          warnings.push("Focus keyword not found in content");
        }
      }

      // Content Analysis
      const contentLength = seoData.content.replace(/<[^>]*>/g, '').length;
      if (contentLength < 300) {
        warnings.push("Content too short (< 300 words)");
      } else if (contentLength < 600) {
        suggestions.push("Consider adding more content (600+ words recommended)");
        score += 5;
      } else {
        passed.push("Content length is good");
        score += 15;
      }

      // Featured Image
      if (!seoData.featuredImage) {
        suggestions.push("Add a featured image");
      } else {
        passed.push("Featured image added");
        score += 5;
      }

      // Social Media Meta
      if (seoData.ogTitle && seoData.ogDescription) {
        passed.push("Open Graph tags configured");
        score += 5;
      } else {
        suggestions.push("Configure Open Graph tags for social sharing");
      }

      if (seoData.twitterTitle && seoData.twitterDescription) {
        passed.push("Twitter Card tags configured");
        score += 5;
      } else {
        suggestions.push("Configure Twitter Card tags");
      }

      // Keyword Density Calculation
      let keywordDensity = 0;
      if (seoData.focusKeyword && seoData.content) {
        const keywords = seoData.focusKeyword.toLowerCase().split(' ');
        const content = seoData.content.toLowerCase().replace(/<[^>]*>/g, '');
        const wordCount = content.split(/\s+/).length;
        
        let keywordCount = 0;
        keywords.forEach(keyword => {
          const matches = content.split(keyword).length - 1;
          keywordCount += matches;
        });
        
        keywordDensity = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;
        
        if (keywordDensity < 0.5) {
          suggestions.push("Keyword density is low (< 0.5%)");
        } else if (keywordDensity > 3) {
          warnings.push("Keyword density too high (> 3%) - may be considered spam");
        } else {
          passed.push("Keyword density is optimal (0.5-3%)");
          score += 10;
        }
      }

      // Readability Score (simplified Flesch-Kincaid approximation)
      let readabilityScore = 0;
      if (seoData.content) {
        const text = seoData.content.replace(/<[^>]*>/g, '');
        const sentences = text.split(/[.!?]+/).length;
        const words = text.split(/\s+/).length;
        const syllables = text.split(/[aeiouAEIOU]/).length;
        
        if (sentences > 0 && words > 0) {
          readabilityScore = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
          readabilityScore = Math.max(0, Math.min(100, readabilityScore));
          
          if (readabilityScore > 60) {
            passed.push("Content is easy to read");
            score += 5;
          } else {
            suggestions.push("Consider simplifying content for better readability");
          }
        }
      }

      setAnalysis({
        score: Math.min(100, score),
        keywordDensity,
        readabilityScore,
        contentLength,
        suggestions,
        warnings,
        passed
      });

      setIsAnalyzing(false);
    };

    const debounceTimer = setTimeout(performAnalysis, 500);
    return () => clearTimeout(debounceTimer);
  }, [seoData]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-[#B45309]";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-[#FFF4E0]";
    return "bg-red-100";
  };

  return (
    <div className="space-y-6">
      {/* SEO Score Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>SEO Analysis</span>
                {isAnalyzing && <RefreshCw className="h-4 w-4 animate-spin" />}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Real-time SEO optimization analysis and recommendations
              </p>
            </div>
            <div className={`text-right p-4 rounded-lg ${getScoreBg(analysis.score)}`}>
              <div className={`text-3xl font-bold ${getScoreColor(analysis.score)}`}>
                {analysis.score}/100
              </div>
              <div className="text-sm text-gray-600">SEO Score</div>
            </div>
          </div>
          <Progress value={analysis.score} className="mt-4" />
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{analysis.keywordDensity.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Keyword Density</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{analysis.readabilityScore.toFixed(0)}</div>
            <div className="text-sm text-gray-600">Readability</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold">{analysis.contentLength}</div>
            <div className="text-sm text-gray-600">Characters</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-[#B45309]" />
            <div className="text-2xl font-bold">{Math.ceil(analysis.contentLength / 1000)}</div>
            <div className="text-sm text-gray-600">Read Time (min)</div>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Results */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {analysis.passed.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Passed ({analysis.passed.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {analysis.passed.map((item, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {analysis.suggestions.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-[#B45309]">
                <Lightbulb className="h-4 w-4" />
                <span className="text-sm">Suggestions ({analysis.suggestions.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {analysis.suggestions.map((item, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <Lightbulb className="h-3 w-3 text-[#B45309] flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {analysis.warnings.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Issues ({analysis.warnings.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {analysis.warnings.map((item, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detailed SEO Settings */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>Basic SEO</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="seo-title">SEO Title</Label>
                <Input
                  id="seo-title"
                  value={seoData.title}
                  onChange={(e) => onSEODataChange({ title: e.target.value })}
                  placeholder="Enter your page title..."
                  maxLength={60}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{seoData.title.length}/60 characters</span>
                  <span className={seoData.title.length > 60 ? 'text-red-500' : seoData.title.length > 50 ? 'text-[#B45309]' : 'text-green-500'}>
                    {seoData.title.length <= 60 ? 'Good' : 'Too long'}
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="meta-description">Meta Description</Label>
                <Textarea
                  id="meta-description"
                  value={seoData.metaDescription}
                  onChange={(e) => onSEODataChange({ metaDescription: e.target.value })}
                  placeholder="Write a compelling meta description..."
                  rows={3}
                  maxLength={160}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{seoData.metaDescription.length}/160 characters</span>
                  <span className={seoData.metaDescription.length > 160 ? 'text-red-500' : seoData.metaDescription.length > 120 ? 'text-green-500' : 'text-[#B45309]'}>
                    {seoData.metaDescription.length >= 120 && seoData.metaDescription.length <= 160 ? 'Perfect' : seoData.metaDescription.length > 160 ? 'Too long' : 'Too short'}
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="canonical-url">Canonical URL</Label>
                <Input
                  id="canonical-url"
                  value={seoData.canonicalUrl}
                  onChange={(e) => onSEODataChange({ canonicalUrl: e.target.value })}
                  placeholder="https://example.com/page"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keywords" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>Keyword Optimization</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="focus-keyword">Focus Keyword</Label>
                <Input
                  id="focus-keyword"
                  value={seoData.focusKeyword}
                  onChange={(e) => onSEODataChange({ focusKeyword: e.target.value })}
                  placeholder="Enter your primary keyword..."
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Keyword Analysis</span>
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Keyword Density:</span>
                    <Badge variant={analysis.keywordDensity >= 0.5 && analysis.keywordDensity <= 3 ? "default" : "destructive"}>
                      {analysis.keywordDensity.toFixed(2)}%
                    </Badge>
                  </div>
                  <Progress value={Math.min(100, analysis.keywordDensity * 33.33)} />
                  <p className="text-xs text-gray-600">
                    Optimal range: 0.5% - 3.0%. Current: {analysis.keywordDensity.toFixed(2)}%
                  </p>
                </div>
              </div>

              <div>
                <Label>Keyword Suggestions</Label>
                <div className="mt-2 space-y-2">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Use keyword variations and related terms to improve content relevance and avoid over-optimization.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Share2 className="h-4 w-4" />
                <span>Social Media Optimization</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Open Graph */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center space-x-2">
                  <Globe className="h-4 w-4" />
                  <span>Open Graph (Facebook, LinkedIn)</span>
                </h4>
                
                <div>
                  <Label htmlFor="og-title">OG Title</Label>
                  <Input
                    id="og-title"
                    value={seoData.ogTitle}
                    onChange={(e) => onSEODataChange({ ogTitle: e.target.value })}
                    placeholder="Facebook/LinkedIn title..."
                  />
                </div>

                <div>
                  <Label htmlFor="og-description">OG Description</Label>
                  <Textarea
                    id="og-description"
                    value={seoData.ogDescription}
                    onChange={(e) => onSEODataChange({ ogDescription: e.target.value })}
                    placeholder="Facebook/LinkedIn description..."
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="og-image">OG Image URL</Label>
                  <Input
                    id="og-image"
                    value={seoData.ogImage}
                    onChange={(e) => onSEODataChange({ ogImage: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>

              <Separator />

              {/* Twitter Cards */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Twitter Cards</span>
                </h4>
                
                <div>
                  <Label htmlFor="twitter-title">Twitter Title</Label>
                  <Input
                    id="twitter-title"
                    value={seoData.twitterTitle}
                    onChange={(e) => onSEODataChange({ twitterTitle: e.target.value })}
                    placeholder="Twitter title..."
                  />
                </div>

                <div>
                  <Label htmlFor="twitter-description">Twitter Description</Label>
                  <Textarea
                    id="twitter-description"
                    value={seoData.twitterDescription}
                    onChange={(e) => onSEODataChange({ twitterDescription: e.target.value })}
                    placeholder="Twitter description..."
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="twitter-image">Twitter Image URL</Label>
                  <Input
                    id="twitter-image"
                    value={seoData.twitterImage}
                    onChange={(e) => onSEODataChange({ twitterImage: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Media Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-4 w-4" />
                <span>Social Media Preview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Facebook Preview */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h5 className="font-semibold mb-2 text-blue-600">Facebook Preview</h5>
                <div className="bg-white border rounded p-3 space-y-2">
                  {seoData.ogImage && (
                    <img src={seoData.ogImage} alt="Preview" className="w-full h-32 object-cover rounded" />
                  )}
                  <div className="font-semibold text-blue-600">
                    {seoData.ogTitle || seoData.title || "Your Title Here"}
                  </div>
                  <div className="text-sm text-gray-600">
                    {seoData.ogDescription || seoData.metaDescription || "Your description here..."}
                  </div>
                  <div className="text-xs text-gray-500">example.com</div>
                </div>
              </div>

              {/* Twitter Preview */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h5 className="font-semibold mb-2 text-blue-400">Twitter Preview</h5>
                <div className="bg-white border rounded p-3 space-y-2">
                  {seoData.twitterImage && (
                    <img src={seoData.twitterImage} alt="Preview" className="w-full h-32 object-cover rounded" />
                  )}
                  <div className="font-semibold">
                    {seoData.twitterTitle || seoData.title || "Your Title Here"}
                  </div>
                  <div className="text-sm text-gray-600">
                    {seoData.twitterDescription || seoData.metaDescription || "Your description here..."}
                  </div>
                  <div className="text-xs text-gray-500">example.com</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Technical SEO</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="robots">Robots Meta Tag</Label>
                <Select value={seoData.robots} onValueChange={(value) => onSEODataChange({ robots: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select robots directive" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="index, follow">Index, Follow (Default)</SelectItem>
                    <SelectItem value="noindex, follow">No Index, Follow</SelectItem>
                    <SelectItem value="index, nofollow">Index, No Follow</SelectItem>
                    <SelectItem value="noindex, nofollow">No Index, No Follow</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="schema">Schema Type</Label>
                <Select value={seoData.schema} onValueChange={(value) => onSEODataChange({ schema: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select schema type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Article">Article</SelectItem>
                    <SelectItem value="BlogPosting">Blog Posting</SelectItem>
                    <SelectItem value="NewsArticle">News Article</SelectItem>
                    <SelectItem value="WebPage">Web Page</SelectItem>
                    <SelectItem value="Product">Product</SelectItem>
                    <SelectItem value="Organization">Organization</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center space-x-2">
                  <Code className="h-4 w-4" />
                  <span>Generated Schema Markup</span>
                </h4>
                <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
{`{
  "@context": "https://schema.org",
  "@type": "${seoData.schema || 'Article'}",
  "headline": "${seoData.title || 'Your Title'}",
  "description": "${seoData.metaDescription || 'Your description'}",
  "image": "${seoData.featuredImage || ''}",
  "author": {
    "@type": "Person",
    "name": "Author Name"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Pakistan Yellow Pages"
  },
  "datePublished": "${new Date().toISOString()}",
  "dateModified": "${new Date().toISOString()}"
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}