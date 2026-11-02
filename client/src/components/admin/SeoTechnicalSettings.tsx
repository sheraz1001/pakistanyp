import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Globe, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Eye,
  Loader2,
  Save,
  TestTube
} from "lucide-react";

interface SeoTechnicalSettings {
  robotsTxt: string;
  sitemapConfig: {
    enabled: boolean;
    includeImages?: boolean;
    changefreq?: string;
    priority: {
      homepage: number;
      categories: number;
      businesses: number;
      provinces: number;
      localities: number;
      pages: number;
    };
    excludePaths?: string[];
    customUrls?: Array<{
      url: string;
      changefreq: string;
      priority: number;
    }>;
  };
  baseUrl: string;
  sitemapEnabled: boolean;
}

interface RobotsTestResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  lineCount: number;
  directiveCount: number;
}

interface SitemapPreview {
  stats: {
    businesses: number;
    categories: number;
    provinces: number;
    staticPages: number;
    customUrls: number;
  };
  totalUrls: number;
  estimatedSize: string;
  sitemapFiles: string[];
}

export default function SeoTechnicalSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [robotsTestResult, setRobotsTestResult] = useState<RobotsTestResult | null>(null);
  const [sitemapPreview, setSitemapPreview] = useState<SitemapPreview | null>(null);

  // Fetch current settings
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['/api/admin/seo/technical'],
    queryFn: () => apiRequest('/api/admin/seo/technical')
  });

  const [formData, setFormData] = useState<SeoTechnicalSettings>({
    robotsTxt: '',
    sitemapConfig: {
      enabled: true,
      includeImages: true,
      changefreq: 'weekly',
      priority: {
        homepage: 1.0,
        categories: 0.9,
        businesses: 0.8,
        provinces: 0.9,
        localities: 0.7,
        pages: 0.6
      },
      excludePaths: ['/admin', '/api', '/dashboard'],
      customUrls: []
    },
    baseUrl: 'https://pakistanyp.com',
    sitemapEnabled: true
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: SeoTechnicalSettings) =>
      apiRequest('/api/admin/seo/technical', {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "SEO technical settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/seo/technical'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    }
  });

  // Test robots.txt mutation
  const testRobotsMutation = useMutation({
    mutationFn: (robotsTxt: string) =>
      apiRequest('/api/admin/seo/test-robots', {
        method: 'POST',
        body: JSON.stringify({ robotsTxt })
      }),
    onSuccess: (result: RobotsTestResult) => {
      setRobotsTestResult(result);
    },
    onError: (error: any) => {
      toast({
        title: "Test Failed",
        description: error.message || "Failed to test robots.txt",
        variant: "destructive",
      });
    }
  });

  // Preview sitemap mutation
  const previewSitemapMutation = useMutation({
    mutationFn: (sitemapConfig: any) =>
      apiRequest('/api/admin/seo/preview-sitemap', {
        method: 'POST',
        body: JSON.stringify({ sitemapConfig })
      }),
    onSuccess: (result: SitemapPreview) => {
      setSitemapPreview(result);
    },
    onError: (error: any) => {
      toast({
        title: "Preview Failed",
        description: error.message || "Failed to generate sitemap preview",
        variant: "destructive",
      });
    }
  });

  // Regenerate sitemap mutation
  const regenerateSitemapMutation = useMutation({
    mutationFn: () =>
      apiRequest('/api/admin/seo/regenerate-sitemap', {
        method: 'POST'
      }),
    onSuccess: (result: any) => {
      toast({
        title: "Sitemap Regenerated",
        description: `Sitemap regeneration completed at ${new Date(result.timestamp).toLocaleTimeString()}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Regeneration Failed",
        description: error.message || "Failed to regenerate sitemap",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = () => {
    updateSettingsMutation.mutate(formData);
  };

  const testRobots = () => {
    testRobotsMutation.mutate(formData.robotsTxt);
  };

  const previewSitemap = () => {
    previewSitemapMutation.mutate(formData.sitemapConfig);
  };

  const regenerateSitemap = () => {
    regenerateSitemapMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load SEO technical settings. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">SEO Technical Settings</h2>
          <p className="text-muted-foreground">
            Manage robots.txt and sitemap configuration for search engine optimization
          </p>
        </div>
        <Button 
          onClick={handleSubmit}
          disabled={updateSettingsMutation.isPending}
          className="flex items-center gap-2"
        >
          {updateSettingsMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Settings
        </Button>
      </div>

      <Tabs defaultValue="robots" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="robots" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Robots.txt
          </TabsTrigger>
          <TabsTrigger value="sitemap" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Sitemap
          </TabsTrigger>
        </TabsList>

        <TabsContent value="robots" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Robots.txt Configuration</CardTitle>
              <CardDescription>
                Control how search engine crawlers interact with your website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="robotsTxt">Robots.txt Content</Label>
                <Textarea
                  id="robotsTxt"
                  value={formData.robotsTxt}
                  onChange={(e) => setFormData({ ...formData, robotsTxt: e.target.value })}
                  rows={15}
                  className="font-mono text-sm"
                  placeholder="User-agent: *&#10;Allow: /&#10;&#10;Disallow: /admin/"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={testRobots}
                  disabled={testRobotsMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {testRobotsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4" />
                  )}
                  Test Robots.txt
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.open('/robots.txt', '_blank')}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Current
                </Button>
              </div>

              {robotsTestResult && (
                <Alert className={robotsTestResult.valid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  {robotsTestResult.valid ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription>
                    <div className="space-y-2">
                      <p>
                        <strong>Status:</strong> {robotsTestResult.valid ? 'Valid' : 'Invalid'} 
                        • <strong>Lines:</strong> {robotsTestResult.lineCount}
                        • <strong>Directives:</strong> {robotsTestResult.directiveCount}
                      </p>
                      {robotsTestResult.errors.length > 0 && (
                        <div>
                          <p className="font-medium text-red-700">Errors:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {robotsTestResult.errors.map((error, i) => (
                              <li key={i} className="text-sm">{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {robotsTestResult.warnings.length > 0 && (
                        <div>
                          <p className="font-medium text-[#7C4A03]">Warnings:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {robotsTestResult.warnings.map((warning, i) => (
                              <li key={i} className="text-sm">{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sitemap" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sitemap Configuration</CardTitle>
              <CardDescription>
                Configure XML sitemap generation for search engines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Enable Sitemap Generation</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically generate XML sitemaps for search engines
                  </p>
                </div>
                <Switch
                  checked={formData.sitemapEnabled}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, sitemapEnabled: checked })
                  }
                />
              </div>

              {formData.sitemapEnabled && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="baseUrl">Base URL</Label>
                      <Input
                        id="baseUrl"
                        value={formData.baseUrl}
                        onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                        placeholder="https://pakistanyp.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="changefreq">Default Change Frequency</Label>
                      <select 
                        className="w-full p-2 border rounded-md"
                        value={formData.sitemapConfig.changefreq}
                        onChange={(e) => setFormData({
                          ...formData,
                          sitemapConfig: { ...formData.sitemapConfig, changefreq: e.target.value }
                        })}
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
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">URL Priorities</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(formData.sitemapConfig.priority).map(([key, value]) => (
                        <div key={key} className="space-y-2">
                          <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                          <Input
                            type="number"
                            min="0"
                            max="1"
                            step="0.1"
                            value={value}
                            onChange={(e) => setFormData({
                              ...formData,
                              sitemapConfig: {
                                ...formData.sitemapConfig,
                                priority: {
                                  ...formData.sitemapConfig.priority,
                                  [key]: parseFloat(e.target.value)
                                }
                              }
                            })}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={previewSitemap}
                      disabled={previewSitemapMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      {previewSitemapMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      Preview Sitemap
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={regenerateSitemap}
                      disabled={regenerateSitemapMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      {regenerateSitemapMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Regenerate Now
                    </Button>
                  </div>

                  {sitemapPreview && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Sitemap Preview</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold">{sitemapPreview.totalUrls}</p>
                            <p className="text-sm text-muted-foreground">Total URLs</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold">{sitemapPreview.estimatedSize}</p>
                            <p className="text-sm text-muted-foreground">Estimated Size</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold">{sitemapPreview.sitemapFiles.length}</p>
                            <p className="text-sm text-muted-foreground">Sitemap Files</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold">{sitemapPreview.stats.businesses}</p>
                            <p className="text-sm text-muted-foreground">Business URLs</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h5 className="font-medium">Generated Files</h5>
                          <div className="flex flex-wrap gap-2">
                            {sitemapPreview.sitemapFiles.map((file, index) => (
                              <Badge key={index} variant="secondary">{file}</Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}