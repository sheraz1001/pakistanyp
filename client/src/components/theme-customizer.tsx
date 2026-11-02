import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Palette, Eye, Save, RefreshCw, Download, Upload, Settings,
  Paintbrush2, Layers, Grid, Type, Sparkles, Monitor, Moon, Sun,
  Droplets, Mountain, Waves, TreePine, Building2, Flag
} from "lucide-react";
import {
  regionalThemes,
  defaultTheme,
  getAllThemes,
  getThemeById,
  applyTheme,
  type RegionalTheme
} from "@/lib/regional-themes";
import { tj } from "@/i18n-jsx/tj";

interface ThemeCustomizerProps {
  onThemeChange?: (theme: RegionalTheme) => void;
  isAdminMode?: boolean;
}

export default function ThemeCustomizer({ onThemeChange, isAdminMode = false }: ThemeCustomizerProps) {
  const [selectedThemeId, setSelectedThemeId] = useState('default');
  const [customTheme, setCustomTheme] = useState<RegionalTheme>(defaultTheme);
  const [previewMode, setPreviewMode] = useState(false);
  const [isLivePreview, setIsLivePreview] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current theme settings
  const { data: themeSettings } = useQuery({
    queryKey: ['/api/theme-settings'],
    enabled: isAdminMode,
  });

  // Save theme settings mutation
  const saveThemeSettings = useMutation({
    mutationFn: (theme: RegionalTheme) => 
      apiRequest("POST", "/api/admin/theme-settings", theme),
    onSuccess: () => {
      toast({ title: "Theme settings saved successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/theme-settings'] });
    },
    onError: () => {
      toast({ title: "Failed to save theme settings", variant: "destructive" });
    }
  });

  const allThemes = getAllThemes();

  // Theme icons mapping
  const getThemeIcon = (themeId: string) => {
    const iconMap = {
      'lahore': Building2,
      'karachi': Sparkles,
      'islamabad': TreePine,
      'rawalpindi': Waves,
      'faisalabad': Mountain,
      'peshawar': Droplets,
      'multan': Waves,
      'pk-national': Flag,
      'default': Monitor
    };
    return iconMap[themeId] || Monitor;
  };

  // Apply theme preview
  const handleThemePreview = (theme: RegionalTheme) => {
    if (isLivePreview) {
      applyTheme(theme);
      onThemeChange?.(theme);
    }
    setCustomTheme(theme);
  };

  // Handle theme selection
  const handleThemeSelect = (themeId: string) => {
    setSelectedThemeId(themeId);
    const theme = getThemeById(themeId);
    handleThemePreview(theme);
  };

  // Save current theme
  const handleSaveTheme = () => {
    if (isAdminMode) {
      saveThemeSettings.mutate(customTheme);
    } else {
      // Save to localStorage for user preference
      localStorage.setItem('user-theme-preference', customTheme.id);
      applyTheme(customTheme);
      toast({ title: "Theme preference saved" });
    }
  };

  // Reset to default theme
  const handleResetTheme = () => {
    handleThemeSelect('default');
    toast({ title: "Theme reset to default" });
  };

  // Color picker component
  const ColorPicker = ({ label, value, onChange, description }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    description?: string;
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center space-x-2 rtl:space-x-reverse">
        <div 
          className="w-8 h-8 rounded border cursor-pointer"
          style={{ backgroundColor: `rgb(${value})` }}
          onClick={() => {
            // Color picker would open here
          }}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="RGB values (e.g., 59 130 246)"
          className="flex-1"
        />
      </div>
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="w-6 h-6" />
            Regional Theme Customizer
          </h2>
          <p className="text-gray-600">
            Customize colors and themes for Pakistan provinces and regions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={isLivePreview}
            onCheckedChange={setIsLivePreview}
          />
          <Label>Live Preview</Label>
        </div>
      </div>

      <Tabs defaultValue="regional" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="regional">Regional Themes</TabsTrigger>
          <TabsTrigger value="custom">Custom Colors</TabsTrigger>
          <TabsTrigger value="gradients">Gradients</TabsTrigger>
          <TabsTrigger value="cultural">Cultural Elements</TabsTrigger>
        </TabsList>

        {/* Regional Themes Tab */}
        <TabsContent value="regional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pakistani Regional Themes</CardTitle>
              <CardDescription>
                Each province has its unique color palette reflecting its culture and identity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allThemes.map((theme) => {
                  const IconComponent = getThemeIcon(theme.id);
                  return (
                    <Card 
                      key={theme.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                        selectedThemeId === theme.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => handleThemeSelect(theme.id)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <IconComponent className="w-5 h-5" />
                          {selectedThemeId === theme.id && (
                            <Badge variant="default">Active</Badge>
                          )}
                        </div>
                        <CardTitle className="text-sm">{theme.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {theme.province}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-gray-600 mb-3">
                          {theme.description}
                        </p>
                        {/* Color Preview */}
                        <div className="flex gap-1 mb-2">
                          <div 
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: `rgb(${theme.colors.primary})` }}
                          />
                          <div 
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: `rgb(${theme.colors.secondary})` }}
                          />
                          <div 
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: `rgb(${theme.colors.accent})` }}
                          />
                        </div>
                        {/* Gradient Preview */}
                        <div 
                          className="w-full h-6 rounded"
                          style={{ background: theme.gradients.hero }}
                        />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Colors Tab */}
        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Color Configuration</CardTitle>
              <CardDescription>
                Fine-tune individual colors for the selected theme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Primary Colors */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Primary Colors</h4>
                  <ColorPicker
                    label="Primary"
                    value={customTheme.colors.primary}
                    onChange={(value) => setCustomTheme({
                      ...customTheme,
                      colors: { ...customTheme.colors, primary: value }
                    })}
                    description="Main brand color"
                  />
                  <ColorPicker
                    label="Secondary"
                    value={customTheme.colors.secondary}
                    onChange={(value) => setCustomTheme({
                      ...customTheme,
                      colors: { ...customTheme.colors, secondary: value }
                    })}
                    description="Secondary brand color"
                  />
                  <ColorPicker
                    label="Accent"
                    value={customTheme.colors.accent}
                    onChange={(value) => setCustomTheme({
                      ...customTheme,
                      colors: { ...customTheme.colors, accent: value }
                    })}
                    description="Accent and highlight color"
                  />
                </div>

                {/* UI Colors */}
                <div className="space-y-4">
                  <h4 className="font-semibold">UI Colors</h4>
                  <ColorPicker
                    label="Background"
                    value={customTheme.colors.background}
                    onChange={(value) => setCustomTheme({
                      ...customTheme,
                      colors: { ...customTheme.colors, background: value }
                    })}
                    description="Main background color"
                  />
                  <ColorPicker
                    label="Foreground"
                    value={customTheme.colors.foreground}
                    onChange={(value) => setCustomTheme({
                      ...customTheme,
                      colors: { ...customTheme.colors, foreground: value }
                    })}
                    description="Main text color"
                  />
                  <ColorPicker
                    label="Muted"
                    value={customTheme.colors.muted}
                    onChange={(value) => setCustomTheme({
                      ...customTheme,
                      colors: { ...customTheme.colors, muted: value }
                    })}
                    description="Muted background color"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gradients Tab */}
        <TabsContent value="gradients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gradient Customization</CardTitle>
              <CardDescription>
                Configure gradient backgrounds for different components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(customTheme.gradients).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label className="capitalize">{tj("{0} Gradient", key)}</Label>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <div 
                        className="w-16 h-8 rounded border"
                        style={{ background: value }}
                      />
                      <Input
                        value={value}
                        onChange={(e) => setCustomTheme({
                          ...customTheme,
                          gradients: { ...customTheme.gradients, [key]: e.target.value }
                        })}
                        placeholder="CSS gradient"
                        className="flex-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cultural Elements Tab */}
        <TabsContent value="cultural" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cultural Elements</CardTitle>
              <CardDescription>
                Configure cultural patterns, symbols, and typography
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Pattern Style</Label>
                  <Select
                    value={customTheme.culturalElements.pattern}
                    onValueChange={(value) => setCustomTheme({
                      ...customTheme,
                      culturalElements: { ...customTheme.culturalElements, pattern: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="geometric-islamic">Geometric Islamic</SelectItem>
                      <SelectItem value="modern-geometric">Modern Geometric</SelectItem>
                      <SelectItem value="arabic-calligraphy">Arabic Calligraphy</SelectItem>
                      <SelectItem value="wave-patterns">Wave Patterns</SelectItem>
                      <SelectItem value="mountain-peaks">Mountain Peaks</SelectItem>
                      <SelectItem value="ocean-waves">Ocean Waves</SelectItem>
                      <SelectItem value="lagoon-ripples">Lagoon Ripples</SelectItem>
                      <SelectItem value="national-pride">National Pride</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Typography Style</Label>
                  <Select
                    value={customTheme.culturalElements.typography}
                    onValueChange={(value) => setCustomTheme({
                      ...customTheme,
                      culturalElements: { ...customTheme.culturalElements, typography: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="elegant-serif">Elegant Serif</SelectItem>
                      <SelectItem value="modern-sans">Modern Sans</SelectItem>
                      <SelectItem value="cultural-serif">Cultural Serif</SelectItem>
                      <SelectItem value="coastal-sans">Coastal Sans</SelectItem>
                      <SelectItem value="adventure-bold">Adventure Bold</SelectItem>
                      <SelectItem value="coastal-rounded">Coastal Rounded</SelectItem>
                      <SelectItem value="lagoon-script">Lagoon Script</SelectItem>
                      <SelectItem value="national-bold">National Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Cultural Symbols</Label>
                  <div className="flex flex-wrap gap-2">
                    {customTheme.culturalElements.symbols.map((symbol, index) => (
                      <Badge key={index} variant="outline">{symbol}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleResetTheme}>
            <RefreshCw className="w-4 h-4 me-2" />
            Reset
          </Button>
          <Button 
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="w-4 h-4 me-2" />
            {previewMode ? 'Exit Preview' : 'Preview'}
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleSaveTheme}
            disabled={saveThemeSettings.isPending}
          >
            <Save className="w-4 h-4 me-2" />
            {isAdminMode ? 'Save System Theme' : 'Save Preference'}
          </Button>
        </div>
      </div>

      {/* Theme Preview Banner */}
      {previewMode && (
        <Card className="border-blue-500 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Theme Preview Mode</h4>
                <p className="text-sm text-gray-600">{tj("Currently previewing: {0}", customTheme.name)}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setPreviewMode(false)}
              >
                Exit Preview
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}