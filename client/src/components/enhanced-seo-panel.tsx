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
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Code,
  Bot,
  Sparkles
} from "lucide-react";
import AIMetaGenerator from "./ai-meta-generator";

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
  metaTitle: string;
  category?: string;
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

interface EnhancedSEOPanelProps {
  seoData: SEOData;
  onSEODataChange: (data: Partial<SEOData>) => void;
  className?: string;
}

export default function EnhancedSEOPanel({ seoData, onSEODataChange, className }: EnhancedSEOPanelProps) {
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
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedSections, setExpandedSections] = useState<string[]>(['overview']);

  // Real-time SEO analysis
  useEffect(() => {
    if (seoData.content && seoData.title) {
      analyzeContent();
    }
  }, [seoData.content, seoData.title, seoData.focusKeyword]);

  const analyzeContent = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ai/analyze-seo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: seoData.content,
          focusKeyword: seoData.focusKeyword,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setAnalysis(result);
      } else {
        // Fallback to client-side analysis
        performClientSideAnalysis();
      }
    } catch (error) {
      console.error('Error analyzing content:', error);
      performClientSideAnalysis();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const performClientSideAnalysis = () => {
    const cleanContent = seoData.content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    const words = cleanContent.split(' ').filter(word => word.length > 0);
    const wordCount = words.length;

    let score = 0;
    const suggestions: string[] = [];
    const warnings: string[] = [];
    const passed: string[] = [];

    // Title analysis
    if (seoData.title.length >= 30 && seoData.title.length <= 60) {
      score += 20;
      passed.push("Title length is optimal");
    } else if (seoData.title.length < 30) {
      suggestions.push("Title is too short - aim for 30-60 characters");
    } else {
      warnings.push("Title is too long - may be truncated in search results");
    }

    // Meta description analysis
    if (seoData.metaDescription.length >= 120 && seoData.metaDescription.length <= 160) {
      score += 20;
      passed.push("Meta description length is optimal");
    } else if (seoData.metaDescription.length < 120) {
      suggestions.push("Meta description is too short - aim for 120-160 characters");
    } else {
      warnings.push("Meta description is too long - may be truncated");
    }

    // Content length
    if (wordCount >= 300) {
      score += 15;
      passed.push("Content length is sufficient");
    } else {
      suggestions.push("Add more content - aim for at least 300 words");
    }

    // Keyword analysis
    if (seoData.focusKeyword) {
      const keywordOccurrences = cleanContent.toLowerCase().split(seoData.focusKeyword.toLowerCase()).length - 1;
      const keywordDensity = (keywordOccurrences / wordCount) * 100;
      
      if (keywordDensity >= 1 && keywordDensity <= 3) {
        score += 15;
        passed.push(`Keyword density is optimal (${keywordDensity.toFixed(1)}%)`);
      } else if (keywordDensity > 3) {
        warnings.push("Keyword density is too high - avoid keyword stuffing");
      } else {
        suggestions.push("Include the focus keyword more in your content");
      }

      // Title keyword
      if (seoData.title.toLowerCase().includes(seoData.focusKeyword.toLowerCase())) {
        score += 10;
        passed.push("Focus keyword found in title");
      } else {
        suggestions.push("Include focus keyword in title");
      }

      // Meta description keyword
      if (seoData.metaDescription.toLowerCase().includes(seoData.focusKeyword.toLowerCase())) {
        score += 10;
        passed.push("Focus keyword found in meta description");
      } else {
        suggestions.push("Include focus keyword in meta description");
      }
    }

    // Images
    const images = (seoData.content.match(/<img[^>]*>/gi) || []).length;
    if (images > 0) {
      score += 5;
      passed.push("Content includes images");
    } else {
      suggestions.push("Add relevant images to improve engagement");
    }

    // Headings
    const headings = (seoData.content.match(/<h[1-6][^>]*>/gi) || []).length;
    if (headings >= 2) {
      score += 5;
      passed.push("Good heading structure");
    } else {
      suggestions.push("Add more headings to structure your content");
    }

    setAnalysis({
      score: Math.min(score, 100),
      keywordDensity: seoData.focusKeyword ? 
        ((cleanContent.toLowerCase().split(seoData.focusKeyword.toLowerCase()).length - 1) / wordCount) * 100 : 0,
      readabilityScore: 75, // Simplified
      contentLength: wordCount,
      suggestions,
      warnings,
      passed
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-[#B45309]";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* SEO Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              SEO Analysis
              {isAnalyzing && <RefreshCw className="w-4 h-4 animate-spin" />}
            </div>
            <Badge variant={getScoreBadge(analysis.score)} className="text-lg px-3 py-1">
              {analysis.score}/100
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={analysis.score} className="h-3 mb-4" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{analysis.contentLength}</div>
              <div className="text-xs text-gray-500">Words</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{analysis.keywordDensity.toFixed(1)}%</div>
              <div className="text-xs text-gray-500">Keyword Density</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{analysis.readabilityScore}</div>
              <div className="text-xs text-gray-500">Readability</div>
            </div>
          </div>

          {/* Quick Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-3 h-3" />
              {analysis.passed.length} Passed
            </div>
            <div className="flex items-center gap-1 text-[#B45309]">
              <AlertTriangle className="w-3 h-3" />
              {analysis.suggestions.length} Suggestions
            </div>
            <div className="flex items-center gap-1 text-red-600">
              <XCircle className="w-3 h-3" />
              {analysis.warnings.length} Warnings
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Meta Generator */}
      <AIMetaGenerator
        data={{
          title: seoData.title,
          content: seoData.content,
          category: seoData.category,
          tags: seoData.tags,
          focusKeyword: seoData.focusKeyword,
        }}
        currentMeta={{
          metaTitle: seoData.metaTitle,
          metaDescription: seoData.metaDescription,
        }}
        onMetaGenerated={(meta) => {
          onSEODataChange(meta);
        }}
      />

      {/* Detailed SEO Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="content" className="text-xs">Content</TabsTrigger>
              <TabsTrigger value="social" className="text-xs">Social</TabsTrigger>
              <TabsTrigger value="technical" className="text-xs">Technical</TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent>
            <TabsContent value="overview" className="space-y-4">
              {/* Focus Keyword */}
              <div className="space-y-2">
                <Label htmlFor="focusKeyword">Focus Keyword</Label>
                <Input
                  id="focusKeyword"
                  value={seoData.focusKeyword}
                  onChange={(e) => onSEODataChange({ focusKeyword: e.target.value })}
                  placeholder="Enter your main keyword"
                />
              </div>

              {/* Meta Title */}
              <div className="space-y-2">
                <Label htmlFor="metaTitle">
                  Meta Title ({seoData.metaTitle.length}/60)
                </Label>
                <Input
                  id="metaTitle"
                  value={seoData.metaTitle}
                  onChange={(e) => onSEODataChange({ metaTitle: e.target.value })}
                  placeholder="Enter SEO title"
                />
                <div className="flex items-center gap-2 text-xs">
                  <Progress 
                    value={(seoData.metaTitle.length / 60) * 100} 
                    className="flex-1 h-1"
                  />
                  <span className={
                    seoData.metaTitle.length >= 50 && seoData.metaTitle.length <= 60 
                      ? "text-green-600" 
                      : "text-gray-500"
                  }>
                    Optimal: 50-60 chars
                  </span>
                </div>
              </div>

              {/* Meta Description */}
              <div className="space-y-2">
                <Label htmlFor="metaDescription">
                  Meta Description ({seoData.metaDescription.length}/160)
                </Label>
                <Textarea
                  id="metaDescription"
                  value={seoData.metaDescription}
                  onChange={(e) => onSEODataChange({ metaDescription: e.target.value })}
                  placeholder="Enter SEO description"
                  rows={3}
                />
                <div className="flex items-center gap-2 text-xs">
                  <Progress 
                    value={(seoData.metaDescription.length / 160) * 100} 
                    className="flex-1 h-1"
                  />
                  <span className={
                    seoData.metaDescription.length >= 120 && seoData.metaDescription.length <= 160 
                      ? "text-green-600" 
                      : "text-gray-500"
                  }>
                    Optimal: 120-160 chars
                  </span>
                </div>
              </div>

              {/* SEO Feedback */}
              <div className="space-y-3">
                {analysis.passed.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      What's Working Well
                    </h4>
                    {analysis.passed.map((item, index) => (
                      <div key={index} className="text-xs p-2 bg-green-50 border border-green-200 rounded">
                        {item}
                      </div>
                    ))}
                  </div>
                )}

                {analysis.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-blue-600 flex items-center gap-1">
                      <Lightbulb className="w-4 h-4" />
                      Suggestions for Improvement
                    </h4>
                    {analysis.suggestions.map((item, index) => (
                      <div key={index} className="text-xs p-2 bg-blue-50 border border-blue-200 rounded">
                        {item}
                      </div>
                    ))}
                  </div>
                )}

                {analysis.warnings.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-red-600 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Issues to Fix
                    </h4>
                    {analysis.warnings.map((item, index) => (
                      <div key={index} className="text-xs p-2 bg-red-50 border border-red-200 rounded">
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <div className="space-y-4">
                <h3 className="font-medium">Content Optimization</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Word Count</Label>
                    <div className="p-3 bg-gray-50 rounded">
                      <div className="text-lg font-bold">{analysis.contentLength}</div>
                      <div className="text-xs text-gray-500">
                        Recommended: 300+ words
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Readability Score</Label>
                    <div className="p-3 bg-gray-50 rounded">
                      <div className="text-lg font-bold">{analysis.readabilityScore}</div>
                      <div className="text-xs text-gray-500">
                        Good: 60+ score
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Keyword Density</Label>
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="text-lg font-bold">{analysis.keywordDensity.toFixed(1)}%</div>
                    <div className="text-xs text-gray-500">
                      Optimal: 1-3%
                    </div>
                    <Progress value={analysis.keywordDensity} max={5} className="mt-2 h-2" />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="social" className="space-y-4">
              <div className="space-y-4">
                <h3 className="font-medium">Social Media Optimization</h3>
                
                {/* Open Graph */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Open Graph (Facebook)</h4>
                  <div className="space-y-2">
                    <Label>OG Title</Label>
                    <Input
                      value={seoData.ogTitle}
                      onChange={(e) => onSEODataChange({ ogTitle: e.target.value })}
                      placeholder="Facebook title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>OG Description</Label>
                    <Textarea
                      value={seoData.ogDescription}
                      onChange={(e) => onSEODataChange({ ogDescription: e.target.value })}
                      placeholder="Facebook description"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Twitter Cards */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Twitter Cards</h4>
                  <div className="space-y-2">
                    <Label>Twitter Title</Label>
                    <Input
                      value={seoData.twitterTitle}
                      onChange={(e) => onSEODataChange({ twitterTitle: e.target.value })}
                      placeholder="Twitter title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Twitter Description</Label>
                    <Textarea
                      value={seoData.twitterDescription}
                      onChange={(e) => onSEODataChange({ twitterDescription: e.target.value })}
                      placeholder="Twitter description"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="technical" className="space-y-4">
              <div className="space-y-4">
                <h3 className="font-medium">Technical SEO</h3>
                
                <div className="space-y-2">
                  <Label>Canonical URL</Label>
                  <Input
                    value={seoData.canonicalUrl}
                    onChange={(e) => onSEODataChange({ canonicalUrl: e.target.value })}
                    placeholder="https://pakistanyp.com/blog/your-post"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Robots</Label>
                  <Select
                    value={seoData.robots}
                    onValueChange={(value) => onSEODataChange({ robots: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select robots directive" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="index, follow">Index, Follow</SelectItem>
                      <SelectItem value="noindex, follow">No Index, Follow</SelectItem>
                      <SelectItem value="index, nofollow">Index, No Follow</SelectItem>
                      <SelectItem value="noindex, nofollow">No Index, No Follow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Schema Markup</Label>
                  <Textarea
                    value={seoData.schema}
                    onChange={(e) => onSEODataChange({ schema: e.target.value })}
                    placeholder="JSON-LD schema markup"
                    rows={4}
                  />
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}