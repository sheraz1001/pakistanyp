import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ColorPicker } from "@/components/ui/color-picker";
import { FontSelector } from "@/components/ui/font-selector";
import { 
  Download, 
  Share2, 
  Copy, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram,
  Eye,
  Calendar,
  User,
  Palette,
  Image as ImageIcon,
  Wand2,
  Settings,
  RotateCw,
  Save,
  Upload,
  Layers,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Square,
  Circle,
  Triangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  publishedAt?: string;
  category?: string;
  author?: {
    firstName: string;
    lastName: string;
  };
}

interface SocialMediaPreviewProps {
  post?: BlogPost;
}

interface PreviewTemplate {
  id: string;
  name: string;
  platform: string;
  dimensions: { width: number; height: number };
  icon: React.ReactNode;
}

const templates: PreviewTemplate[] = [
  {
    id: "facebook",
    name: "Facebook Post",
    platform: "Facebook",
    dimensions: { width: 1200, height: 630 },
    icon: <Facebook className="w-4 h-4" />
  },
  {
    id: "twitter",
    name: "Twitter Card",
    platform: "Twitter",
    dimensions: { width: 1200, height: 675 },
    icon: <Twitter className="w-4 h-4" />
  },
  {
    id: "linkedin",
    name: "LinkedIn Post",
    platform: "LinkedIn",
    dimensions: { width: 1200, height: 627 },
    icon: <Linkedin className="w-4 h-4" />
  },
  {
    id: "instagram",
    name: "Instagram Story",
    platform: "Instagram",
    dimensions: { width: 1080, height: 1920 },
    icon: <Instagram className="w-4 h-4" />
  }
];

const colorThemes = [
  { id: "pk-gold", name: "Pakistani Gold", primary: "#D4AF37", secondary: "#1A4B3D", accent: "#F5F5DC" },
  { id: "emerald", name: "Emerald", primary: "#10B981", secondary: "#065F46", accent: "#D1FAE5" },
  { id: "blue", name: "Ocean Blue", primary: "#3B82F6", secondary: "#1E3A8A", accent: "#DBEAFE" },
  { id: "sunset", name: "Desert Sunset", primary: "#F59E0B", secondary: "#92400E", accent: "#FEF3C7" },
  { id: "royal", name: "Royal Purple", primary: "#8B5CF6", secondary: "#5B21B6", accent: "#EDE9FE" }
];

interface CustomizationSettings {
  backgroundColor: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  titleFont: string;
  bodyFont: string;
  titleSize: number;
  bodySize: number;
  borderRadius: number;
  padding: number;
  logoSize: number;
  showLogo: boolean;
  showBorder: boolean;
  borderColor: string;
  borderWidth: number;
  overlayOpacity: number;
  gradient: boolean;
  gradientDirection: string;
  textAlign: "left" | "center" | "right";
  backgroundPattern: string;
}

export function SocialMediaPreviewGenerator({ post }: SocialMediaPreviewProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("facebook");
  const [selectedTheme, setSelectedTheme] = useState<string>("pk-gold");
  const [customTitle, setCustomTitle] = useState(post?.title || "Pakistani Business Directory");
  const [customDescription, setCustomDescription] = useState(post?.excerpt || "Discover the best businesses across all provinces and territories of Pakistan");
  const [isGenerating, setIsGenerating] = useState(false);
  const [customSettings, setCustomSettings] = useState<CustomizationSettings>({
    backgroundColor: "#D4AF37",
    primaryColor: "#1A4B3D", 
    secondaryColor: "#F5F5DC",
    textColor: "#1F2937",
    titleFont: "'Montserrat', sans-serif",
    bodyFont: "'Open Sans', sans-serif",
    titleSize: 48,
    bodySize: 24,
    borderRadius: 20,
    padding: 80,
    logoSize: 120,
    showLogo: true,
    showBorder: false,
    borderColor: "#000000",
    borderWidth: 4,
    overlayOpacity: 20,
    gradient: true,
    gradientDirection: "diagonal",
    textAlign: "left",
    backgroundPattern: "geometric"
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const currentTemplate = templates.find(t => t.id === selectedTemplate);
  const currentTheme = colorThemes.find(t => t.id === selectedTheme);

  const generatePreview = async () => {
    if (!canvasRef.current || !currentTemplate) return;

    setIsGenerating(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = currentTemplate.dimensions.width;
    canvas.height = currentTemplate.dimensions.height;

    // Add roundRect polyfill if not supported
    if (!ctx.roundRect) {
      (ctx as any).roundRect = function(x: number, y: number, width: number, height: number, radius: number) {
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
      };
    }

    try {
      // Background with custom settings
      if (customSettings.gradient) {
        const gradient = customSettings.gradientDirection === "horizontal" 
          ? ctx.createLinearGradient(0, 0, canvas.width, 0)
          : customSettings.gradientDirection === "vertical"
          ? ctx.createLinearGradient(0, 0, 0, canvas.height)
          : ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        
        gradient.addColorStop(0, customSettings.primaryColor);
        gradient.addColorStop(1, customSettings.secondaryColor);
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = customSettings.backgroundColor;
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Background pattern overlay
      if (customSettings.backgroundPattern === "geometric") {
        ctx.fillStyle = customSettings.secondaryColor + Math.round(customSettings.overlayOpacity).toString(16).padStart(2, '0');
        for (let i = 0; i < canvas.width; i += 100) {
          for (let j = 0; j < canvas.height; j += 100) {
            ctx.fillRect(i, j, 50, 50);
          }
        }
      } else if (customSettings.backgroundPattern === "dots") {
        ctx.fillStyle = customSettings.secondaryColor + Math.round(customSettings.overlayOpacity).toString(16).padStart(2, '0');
        for (let i = 0; i < canvas.width; i += 80) {
          for (let j = 0; j < canvas.height; j += 80) {
            ctx.beginPath();
            ctx.arc(i, j, 15, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Content area background with custom padding and border
      const padding = customSettings.padding;
      const contentWidth = canvas.width - (padding * 2);
      const contentHeight = canvas.height - (padding * 2);
      
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.roundRect(padding, padding, contentWidth, contentHeight, customSettings.borderRadius);
      ctx.fill();
      
      // Optional border
      if (customSettings.showBorder) {
        ctx.strokeStyle = customSettings.borderColor;
        ctx.lineWidth = customSettings.borderWidth;
        ctx.roundRect(padding, padding, contentWidth, contentHeight, customSettings.borderRadius);
        ctx.stroke();
      }

      // Pakistani flag accent (small decorative element)
      if (customSettings.showLogo) {
        const flagWidth = 120;
        const flagHeight = 8;
        const flagX = padding + 40;
        const flagY = padding + 40;
        
        // Pakistani flag colors
        ctx.fillStyle = "#CE1126"; // Red
        ctx.fillRect(flagX, flagY, flagWidth / 4, flagHeight);
        ctx.fillStyle = "#009739"; // Green  
        ctx.fillRect(flagX + flagWidth / 4, flagY, flagWidth / 4, flagHeight);
        ctx.fillStyle = "#FFFFFF"; // White
        ctx.fillRect(flagX + flagWidth / 2, flagY, flagWidth / 4, flagHeight);
        ctx.fillStyle = "#000000"; // Black
        ctx.fillRect(flagX + (3 * flagWidth / 4), flagY, flagWidth / 4, flagHeight);
      }

      // Title with custom styling
      ctx.fillStyle = customSettings.textColor;
      ctx.font = `bold ${customSettings.titleSize}px ${customSettings.titleFont.split(',')[0].replace(/'/g, '')}`;
      ctx.textAlign = customSettings.textAlign;
      
      const titleLines = wrapText(ctx, customTitle, contentWidth - 80);
      let yPosition = padding + 120;
      
      const textX = customSettings.textAlign === "center" 
        ? canvas.width / 2 
        : customSettings.textAlign === "right"
        ? canvas.width - padding - 40
        : padding + 40;
        
      titleLines.forEach((line, index) => {
        ctx.fillText(line, textX, yPosition + (index * (customSettings.titleSize + 20)));
      });

      // Description with custom styling
      if (customDescription) {
        yPosition += titleLines.length * (customSettings.titleSize + 20) + 30;
        ctx.fillStyle = customSettings.textColor + "CC";
        ctx.font = `${customSettings.bodySize}px ${customSettings.bodyFont.split(',')[0].replace(/'/g, '')}`;
        
        const descLines = wrapText(ctx, customDescription, contentWidth - 80);
        descLines.slice(0, 3).forEach((line, index) => {
          ctx.fillText(line, textX, yPosition + (index * (customSettings.bodySize + 10)));
        });
      }

      // Footer info
      const footerY = canvas.height - padding - 60;
      
      // Author and date
      ctx.fillStyle = customSettings.textColor + "80";
      ctx.font = `${selectedTemplate === 'instagram' ? '24px' : '28px'} Arial`;
      ctx.textAlign = "left";
      
      const authorName = post?.author ? `${post.author.firstName} ${post.author.lastName}` : "PakistanYP Blog";
      const publishDate = post?.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }) : new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
      
      ctx.fillText(`By ${authorName} • ${publishDate}`, padding + 40, footerY);

      // Logo and Platform branding
      ctx.fillStyle = customSettings.primaryColor;
      ctx.font = `bold ${selectedTemplate === 'instagram' ? '28px' : '32px'} Arial`;
      ctx.textAlign = "right";
      ctx.fillText("PakistanYP.com", canvas.width - padding - 40, footerY);

      // Category badge (if exists)
      if (post?.category) {
        const badgeText = post.category.toUpperCase();
        const badgeX = canvas.width - padding - 40;
        const badgeY = padding + 40;
        const badgeWidth = ctx.measureText(badgeText).width + 20;
        const badgeHeight = 30;
        
        ctx.fillStyle = customSettings.primaryColor;
        ctx.roundRect(badgeX - badgeWidth, badgeY, badgeWidth, badgeHeight, 15);
        ctx.fill();
        
        ctx.fillStyle = "white";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(badgeText, badgeX - badgeWidth / 2, badgeY + 20);
      }

    } catch (error) {
      console.error("Error generating preview:", error);
      toast({
        title: "Generation Error",
        description: "Failed to generate preview. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Text wrapping function
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  const downloadImage = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `${post?.slug || 'pakistanyp-social'}-${selectedTemplate}-preview.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
    
    toast({
      title: "Download Complete",
      description: "Social media preview saved successfully"
    });
  };

  const copyToClipboard = async () => {
    if (!canvasRef.current) return;

    try {
      canvasRef.current.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          toast({
            title: "Copied to Clipboard",
            description: "Preview image copied to clipboard"
          });
        }
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy image to clipboard",
        variant: "destructive"
      });
    }
  };

  const shareToSocial = (platform: string) => {
    const url = `https://pakistanyp.com/blogs/${post?.slug || 'pakistanyp'}`;
    const text = customTitle;
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    };
    
    const shareUrl = shareUrls[platform as keyof typeof shareUrls];
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  // Auto-generate on settings change
  useEffect(() => {
    if (canvasRef.current) {
      const timer = setTimeout(generatePreview, 300);
      return () => clearTimeout(timer);
    }
  }, [customSettings, selectedTemplate, customTitle, customDescription]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Social Media Preview Generator</h2>
          <p className="text-gray-600">Create stunning social media cards with advanced customization</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={generatePreview} 
            disabled={isGenerating}
            className=""
          >
            {isGenerating ? (
              <>
                <Eye className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Preview
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Basic Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Platform Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Platform</label>
                <Tabs value={selectedTemplate} onValueChange={setSelectedTemplate} className="w-full">
                  <TabsList className="grid grid-cols-2 gap-1">
                    {templates.map((template) => (
                      <TabsTrigger key={template.id} value={template.id} className="flex items-center gap-2">
                        {template.icon}
                        <span className="hidden sm:inline">{template.platform}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              {/* Theme Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Color Theme</label>
                <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorThemes.map((theme) => (
                      <SelectItem key={theme.id} value={theme.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: theme.primary }}
                          />
                          {theme.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Title */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Title</label>
                <Input
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Enter custom title..."
                  className="w-full"
                />
              </div>

              {/* Custom Description */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
                <Textarea
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Enter custom description..."
                  className="w-full min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Advanced Customization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Advanced Customization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="colors" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="colors">Colors</TabsTrigger>
                  <TabsTrigger value="fonts">Fonts</TabsTrigger>
                  <TabsTrigger value="layout">Layout</TabsTrigger>
                  <TabsTrigger value="effects">Effects</TabsTrigger>
                </TabsList>

                <TabsContent value="colors" className="space-y-4 mt-4">
                  <ColorPicker
                    label="Background Color"
                    value={customSettings.backgroundColor}
                    onChange={(color) => setCustomSettings(prev => ({ ...prev, backgroundColor: color }))}
                  />
                  <ColorPicker
                    label="Primary Color"
                    value={customSettings.primaryColor}
                    onChange={(color) => setCustomSettings(prev => ({ ...prev, primaryColor: color }))}
                  />
                  <ColorPicker
                    label="Text Color"
                    value={customSettings.textColor}
                    onChange={(color) => setCustomSettings(prev => ({ ...prev, textColor: color }))}
                  />
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Gradient Background</label>
                      <Switch
                        checked={customSettings.gradient}
                        onCheckedChange={(checked) => setCustomSettings(prev => ({ ...prev, gradient: checked }))}
                      />
                    </div>
                    
                    {customSettings.gradient && (
                      <Select
                        value={customSettings.gradientDirection}
                        onValueChange={(value) => setCustomSettings(prev => ({ ...prev, gradientDirection: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="horizontal">Horizontal</SelectItem>
                          <SelectItem value="vertical">Vertical</SelectItem>
                          <SelectItem value="diagonal">Diagonal</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="fonts" className="space-y-4 mt-4">
                  <FontSelector
                    label="Title Font"
                    value={customSettings.titleFont}
                    onChange={(font) => setCustomSettings(prev => ({ ...prev, titleFont: font }))}
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Title Size: {customSettings.titleSize}px</label>
                    <Slider
                      value={[customSettings.titleSize]}
                      onValueChange={([value]) => setCustomSettings(prev => ({ ...prev, titleSize: value }))}
                      min={24}
                      max={72}
                      step={2}
                    />
                  </div>

                  <FontSelector
                    label="Body Font"
                    value={customSettings.bodyFont}
                    onChange={(font) => setCustomSettings(prev => ({ ...prev, bodyFont: font }))}
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Body Size: {customSettings.bodySize}px</label>
                    <Slider
                      value={[customSettings.bodySize]}
                      onValueChange={([value]) => setCustomSettings(prev => ({ ...prev, bodySize: value }))}
                      min={14}
                      max={36}
                      step={2}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Text Alignment</label>
                    <div className="flex gap-2">
                      {[
                        { value: "left", icon: AlignLeft },
                        { value: "center", icon: AlignCenter },
                        { value: "right", icon: AlignRight }
                      ].map(({ value, icon: Icon }) => (
                        <Button
                          key={value}
                          variant={customSettings.textAlign === value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCustomSettings(prev => ({ ...prev, textAlign: value as any }))}
                        >
                          <Icon className="w-4 h-4" />
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="layout" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Padding: {customSettings.padding}px</label>
                    <Slider
                      value={[customSettings.padding]}
                      onValueChange={([value]) => setCustomSettings(prev => ({ ...prev, padding: value }))}
                      min={40}
                      max={120}
                      step={10}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Border Radius: {customSettings.borderRadius}px</label>
                    <Slider
                      value={[customSettings.borderRadius]}
                      onValueChange={([value]) => setCustomSettings(prev => ({ ...prev, borderRadius: value }))}
                      min={0}
                      max={50}
                      step={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Show Border</label>
                      <Switch
                        checked={customSettings.showBorder}
                        onCheckedChange={(checked) => setCustomSettings(prev => ({ ...prev, showBorder: checked }))}
                      />
                    </div>
                    
                    {customSettings.showBorder && (
                      <div className="space-y-2">
                        <ColorPicker
                          label="Border Color"
                          value={customSettings.borderColor}
                          onChange={(color) => setCustomSettings(prev => ({ ...prev, borderColor: color }))}
                        />
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Border Width: {customSettings.borderWidth}px</label>
                          <Slider
                            value={[customSettings.borderWidth]}
                            onValueChange={([value]) => setCustomSettings(prev => ({ ...prev, borderWidth: value }))}
                            min={1}
                            max={10}
                            step={1}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="effects" className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Background Pattern</label>
                    <Select
                      value={customSettings.backgroundPattern}
                      onValueChange={(value) => setCustomSettings(prev => ({ ...prev, backgroundPattern: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="geometric">Geometric</SelectItem>
                        <SelectItem value="dots">Dots</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Overlay Opacity: {customSettings.overlayOpacity}%</label>
                    <Slider
                      value={[customSettings.overlayOpacity]}
                      onValueChange={([value]) => setCustomSettings(prev => ({ ...prev, overlayOpacity: value }))}
                      min={0}
                      max={100}
                      step={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Show Logo</label>
                      <Switch
                        checked={customSettings.showLogo}
                        onCheckedChange={(checked) => setCustomSettings(prev => ({ ...prev, showLogo: checked }))}
                      />
                    </div>
                    
                    {customSettings.showLogo && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Logo Size: {customSettings.logoSize}px</label>
                        <Slider
                          value={[customSettings.logoSize]}
                          onValueChange={([value]) => setCustomSettings(prev => ({ ...prev, logoSize: value }))}
                          min={60}
                          max={200}
                          step={10}
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => {
                  const theme = colorThemes.find(t => t.id === selectedTheme);
                  if (theme) {
                    setCustomSettings(prev => ({
                      ...prev,
                      backgroundColor: theme.primary,
                      primaryColor: theme.primary,
                      secondaryColor: theme.secondary,
                      textColor: "#1F2937"
                    }));
                  }
                }}
                variant="outline"
                className="w-full"
              >
                <RotateCw className="w-4 h-4 mr-2" />
                Apply Theme Colors
              </Button>
              
              <Button
                onClick={() => setCustomSettings({
                  backgroundColor: "#D4AF37",
                  primaryColor: "#1A4B3D", 
                  secondaryColor: "#F5F5DC",
                  textColor: "#1F2937",
                  titleFont: "'Montserrat', sans-serif",
                  bodyFont: "'Open Sans', sans-serif",
                  titleSize: 48,
                  bodySize: 24,
                  borderRadius: 20,
                  padding: 80,
                  logoSize: 120,
                  showLogo: true,
                  showBorder: false,
                  borderColor: "#000000",
                  borderWidth: 4,
                  overlayOpacity: 20,
                  gradient: true,
                  gradientDirection: "diagonal",
                  textAlign: "left",
                  backgroundPattern: "geometric"
                })}
                variant="outline"
                className="w-full"
              >
                <RotateCw className="w-4 h-4 mr-2" />
                Reset to Default
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <canvas
                  ref={canvasRef}
                  className="w-full border rounded-lg shadow-sm bg-white"
                  style={{
                    maxWidth: '100%',
                    height: 'auto'
                  }}
                />
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                <Button onClick={downloadImage} variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                
                <Button onClick={copyToClipboard} variant="outline" className="flex items-center gap-2">
                  <Copy className="w-4 h-4" />
                  Copy
                </Button>
                
                <div className="flex gap-1">
                  {[
                    { platform: "facebook", icon: Facebook, color: "hover:bg-blue-600" },
                    { platform: "twitter", icon: Twitter, color: "hover:bg-sky-500" },
                    { platform: "linkedin", icon: Linkedin, color: "hover:bg-blue-700" }
                  ].map(({ platform, icon: Icon, color }) => (
                    <Button
                      key={platform}
                      onClick={() => shareToSocial(platform)}
                      variant="outline"
                      size="sm"
                      className={`${color} hover:text-white`}
                    >
                      <Icon className="w-4 h-4" />
                    </Button>
                  ))}
                </div>
              </div>

              {/* Template info */}
              {currentTemplate && (
                <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
                  <strong>{currentTemplate.name}</strong> • {currentTemplate.dimensions.width} × {currentTemplate.dimensions.height}px
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}