import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Save, RefreshCw, Search, Globe, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { t as tx } from "@shared/i18n";

interface SEOSettings {
  id?: number;
  defaultTitle: string;
  titleTemplate: string;
  defaultDescription: string;
  defaultKeywords: string[];
  defaultImage: string;
  twitterHandle: string;
  facebookAppId: string;
  googleAnalyticsId: string;
  googleSearchConsoleId: string;
  robotsTxt: string;
  customHeadTags: string;
  sitemapFrequency: string;
  enableBreadcrumbs: boolean;
  enableStructuredData: boolean;
  enableAutoKeywords: boolean;
}

export default function SEOSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [seoScore, setSeoScore] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/admin/seo-settings'],
    queryFn: () => apiRequest('/api/admin/seo-settings')
  });

  const [formData, setFormData] = useState<SEOSettings>({
    defaultTitle: '',
    titleTemplate: '%s | Pakistani Business Directory',
    defaultDescription: '',
    defaultKeywords: [],
    defaultImage: '',
    twitterHandle: '',
    facebookAppId: '',
    googleAnalyticsId: '',
    googleSearchConsoleId: '',
    robotsTxt: '',
    customHeadTags: '',
    sitemapFrequency: 'daily',
    enableBreadcrumbs: true,
    enableStructuredData: true,
    enableAutoKeywords: true,
    ...settings
  });

  const updateMutation = useMutation({
    mutationFn: (data: SEOSettings) =>
      apiRequest('/api/admin/seo-settings', {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/seo-settings'] });
      toast({ title: 'SEO settings updated successfully' });
    }
  });

  const generateSitemapMutation = useMutation({
    mutationFn: () => apiRequest('/api/admin/seo/generate-sitemap', { method: 'POST' }),
    onSuccess: () => {
      toast({ title: 'Sitemap generated successfully' });
    }
  });

  const analyzeSEOMutation = useMutation({
    mutationFn: () => apiRequest('/api/admin/seo/analyze', { method: 'POST' }),
    onSuccess: (data: any) => {
      setSeoScore(data.score);
      toast({ title: tx("SEO Score: {0}/100", data.score), description: data.summary });
    }
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleKeywordAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value) {
      const keyword = e.currentTarget.value.trim();
      if (!formData.defaultKeywords.includes(keyword)) {
        setFormData({
          ...formData,
          defaultKeywords: [...formData.defaultKeywords, keyword]
        });
      }
      e.currentTarget.value = '';
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      defaultKeywords: formData.defaultKeywords.filter(k => k !== keyword)
    });
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading SEO settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">SEO Settings</h2>
          <p className="text-muted-foreground">Optimize your website for search engines</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => analyzeSEOMutation.mutate()}
            disabled={analyzeSEOMutation.isPending}
          >
            <Search className="w-4 h-4 me-2" />
            Analyze SEO
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            <Save className="w-4 h-4 me-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {seoScore > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">SEO Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold">{seoScore}/100</span>
                <Badge variant={seoScore >= 80 ? 'default' : seoScore >= 60 ? 'secondary' : 'destructive'}>
                  {seoScore >= 80 ? 'Excellent' : seoScore >= 60 ? 'Good' : 'Needs Improvement'}
                </Badge>
              </div>
              <Progress value={seoScore} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="robots">Robots & Sitemap</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Default Meta Tags</CardTitle>
              <CardDescription>
                These defaults are used when pages don't have specific meta tags
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default Title</Label>
                <Input
                  value={formData.defaultTitle}
                  onChange={(e) => setFormData({ ...formData, defaultTitle: e.target.value })}
                  placeholder="Pakistani Business Directory - Find Local Businesses"
                />
              </div>
              <div className="space-y-2">
                <Label>Title Template</Label>
                <Input
                  value={formData.titleTemplate}
                  onChange={(e) => setFormData({ ...formData, titleTemplate: e.target.value })}
                  placeholder="%s | Your Site Name"
                />
                <p className="text-xs text-muted-foreground">Use %s where the page title will be inserted</p>
              </div>
              <div className="space-y-2">
                <Label>Default Description</Label>
                <Textarea
                  value={formData.defaultDescription}
                  onChange={(e) => setFormData({ ...formData, defaultDescription: e.target.value })}
                  placeholder="Discover the best businesses in Pakistan..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Default Keywords</Label>
                <Input
                  onKeyDown={handleKeywordAdd}
                  placeholder="Type a keyword and press Enter"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.defaultKeywords.map(keyword => (
                    <Badge key={keyword} variant="secondary">
                      {keyword}
                      <button
                        onClick={() => removeKeyword(keyword)}
                        className="ms-2 text-xs hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Default Open Graph Image</Label>
                <Input
                  value={formData.defaultImage}
                  onChange={(e) => setFormData({ ...formData, defaultImage: e.target.value })}
                  placeholder="https://yoursite.com/og-image.jpg"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Integration</CardTitle>
              <CardDescription>Configure social media meta tags and integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Twitter Handle</Label>
                <Input
                  value={formData.twitterHandle}
                  onChange={(e) => setFormData({ ...formData, twitterHandle: e.target.value })}
                  placeholder="@yourbusiness"
                />
              </div>
              <div className="space-y-2">
                <Label>Facebook App ID</Label>
                <Input
                  value={formData.facebookAppId}
                  onChange={(e) => setFormData({ ...formData, facebookAppId: e.target.value })}
                  placeholder="Your Facebook App ID"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics & Search Console</CardTitle>
              <CardDescription>Connect your analytics and search console accounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Google Analytics ID</Label>
                <Input
                  value={formData.googleAnalyticsId}
                  onChange={(e) => setFormData({ ...formData, googleAnalyticsId: e.target.value })}
                  placeholder="G-XXXXXXXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label>Google Search Console Verification</Label>
                <Input
                  value={formData.googleSearchConsoleId}
                  onChange={(e) => setFormData({ ...formData, googleSearchConsoleId: e.target.value })}
                  placeholder="Verification code"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="robots" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Robots.txt Configuration</CardTitle>
              <CardDescription>Control how search engines crawl your site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Robots.txt Content</Label>
                <Textarea
                  value={formData.robotsTxt}
                  onChange={(e) => setFormData({ ...formData, robotsTxt: e.target.value })}
                  placeholder="User-agent: *&#10;Disallow: /admin/&#10;Sitemap: https://yoursite.com/sitemap.xml"
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Sitemap Update Frequency</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={formData.sitemapFrequency}
                  onChange={(e) => setFormData({ ...formData, sitemapFrequency: e.target.value })}
                >
                  <option value="always">Always</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="never">Never</option>
                </select>
              </div>
              <Button
                variant="outline"
                onClick={() => generateSitemapMutation.mutate()}
                disabled={generateSitemapMutation.isPending}
              >
                <RefreshCw className="w-4 h-4 me-2" />
                Generate Sitemap Now
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced SEO Features</CardTitle>
              <CardDescription>Fine-tune your SEO configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Custom Head Tags</Label>
                <Textarea
                  value={formData.customHeadTags}
                  onChange={(e) => setFormData({ ...formData, customHeadTags: e.target.value })}
                  placeholder="<link rel='preconnect' href='https://fonts.googleapis.com'>"
                  className="min-h-[150px] font-mono text-sm"
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Breadcrumbs</Label>
                    <p className="text-sm text-muted-foreground">Show navigation breadcrumbs</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.enableBreadcrumbs}
                    onChange={(e) => setFormData({ ...formData, enableBreadcrumbs: e.target.checked })}
                    className="h-4 w-4"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Structured Data</Label>
                    <p className="text-sm text-muted-foreground">Add JSON-LD schema markup</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.enableStructuredData}
                    onChange={(e) => setFormData({ ...formData, enableStructuredData: e.target.checked })}
                    className="h-4 w-4"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-generate Keywords</Label>
                    <p className="text-sm text-muted-foreground">Automatically extract keywords from content</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.enableAutoKeywords}
                    onChange={(e) => setFormData({ ...formData, enableAutoKeywords: e.target.checked })}
                    className="h-4 w-4"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}