import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Save, Eye, Send, Maximize2, Bold, Italic, Heading1, Heading2, Heading3, Link, Image, List, Code, Quote, Square, Type, FileText, Settings, Palette, ExternalLink, Cpu, RefreshCw, CheckCircle, TrendingUp, Trash2, Upload, Camera, Calendar, Clock, AlertCircle, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { insertBlogPostSchema } from "@shared/schema";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { z } from "zod";
import EnhancedSEOPanel from "@/components/enhanced-seo-panel";
import FAQHTMLEditor from "@/components/faq-html-editor";

// Featured Image Upload Component
interface FeaturedImageUploadProps {
  image?: string;
  onImageChange: (image: string) => void;
  onImageRemove: () => void;
}

const FeaturedImageUpload = ({ image, onImageChange, onImageRemove }: FeaturedImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    
    try {
      // Upload file to server
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      if (result.success) {
        onImageChange(result.url); // Use server URL instead of base64
        console.log('Image uploaded successfully:', result.url);
        console.log('Setting featured image in blog post state:', result.url);
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Label>Featured Image</Label>
      
      {image ? (
        <div className="relative">
          <img
            src={image}
            alt="Featured image"
            className="w-full h-48 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onImageRemove}
            className="absolute top-2 right-2"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Camera className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">Upload a featured image for your blog post</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Choose Image'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <p className="text-xs text-gray-500 mt-2">Supports JPG, PNG, GIF up to 5MB</p>
        </div>
      )}
    </div>
  );
};

// Schema markup generation function
const generateSchemaMarkup = (blogPost: any) => {
  return {
    "@context": "https://schema.org",
    "@type": blogPost.schemaType || "BlogPosting",
    "headline": (blogPost.title || '').substring(0, 110), // Truncate long titles
    "description": (blogPost.excerpt || blogPost.metaDescription || '').substring(0, 200),
    "author": {
      "@type": "Organization",
      "name": "PakistanYP"
    },
    "publisher": {
      "@type": "Organization",
      "name": "PakistanYP"
    },
    "datePublished": new Date().toISOString(),
    "dateModified": new Date().toISOString()
  };
};

// AdvancedHTMLEditor Component
function AdvancedHTMLEditor({ value, onChange }: { value: string; onChange: (content: string) => void }) {
  const [mode, setMode] = useState('visual');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [htmlContent, setHtmlContent] = useState(value || '');
  const [stats, setStats] = useState({ chars: 0, words: 0, lines: 0 });

  const handleContentChange = (newContent: string) => {
    setHtmlContent(newContent);
    onChange(newContent);
    
    // Update statistics
    const chars = newContent.length;
    const words = newContent.trim() ? newContent.trim().split(/\s+/).length : 0;
    const lines = newContent.split('\n').length;
    setStats({ chars, words, lines });
  };

  const insertHTML = (htmlTag: string) => {
    const textarea = document.getElementById('html-editor');
    if (!textarea) {
      const cursorPos = htmlContent.length;
      insertAtPosition(htmlTag, cursorPos, cursorPos, '');
      return;
    }
    
    const start = (textarea as HTMLTextAreaElement).selectionStart || 0;
    const end = (textarea as HTMLTextAreaElement).selectionEnd || 0;
    const selectedText = htmlContent.substring(start, end);
    insertAtPosition(htmlTag, start, end, selectedText);
  };

  const insertAtPosition = (htmlTag: string, start: number, end: number, selectedText: string) => {
    let newContent;
    switch (htmlTag) {
      case 'bold':
        newContent = htmlContent.substring(0, start) + `<strong>${selectedText}</strong>` + htmlContent.substring(end);
        break;
      case 'italic':
        newContent = htmlContent.substring(0, start) + `<em>${selectedText}</em>` + htmlContent.substring(end);
        break;
      case 'h1':
        newContent = htmlContent.substring(0, start) + `<h1>${selectedText || 'Heading 1'}</h1>` + htmlContent.substring(end);
        break;
      case 'h2':
        newContent = htmlContent.substring(0, start) + `<h2>${selectedText || 'Heading 2'}</h2>` + htmlContent.substring(end);
        break;
      case 'h3':
        newContent = htmlContent.substring(0, start) + `<h3>${selectedText || 'Heading 3'}</h3>` + htmlContent.substring(end);
        break;
      case 'paragraph':
        newContent = htmlContent.substring(0, start) + `<p>${selectedText || 'Your paragraph text here'}</p>` + htmlContent.substring(end);
        break;
      case 'link':
        const url = prompt('Enter URL:');
        if (url) {
          newContent = htmlContent.substring(0, start) + `<a href="${url}">${selectedText || 'Link text'}</a>` + htmlContent.substring(end);
        } else return;
        break;
      case 'image':
        const imgUrl = prompt('Enter image URL:');
        const altText = prompt('Enter alt text:');
        if (imgUrl) {
          newContent = htmlContent.substring(0, start) + `<img src="${imgUrl}" alt="${altText || 'Image'}" />` + htmlContent.substring(end);
        } else return;
        break;
      case 'list':
        newContent = htmlContent.substring(0, start) + `<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n  <li>Item 3</li>\n</ul>` + htmlContent.substring(end);
        break;
      case 'code':
        newContent = htmlContent.substring(0, start) + `<code>${selectedText || 'your code here'}</code>` + htmlContent.substring(end);
        break;
      case 'blockquote':
        newContent = htmlContent.substring(0, start) + `<blockquote>${selectedText || 'Quote text here'}</blockquote>` + htmlContent.substring(end);
        break;
      case 'div':
        const className = prompt('Enter CSS class (optional):');
        newContent = htmlContent.substring(0, start) + `<div${className ? ` class="${className}"` : ''}>${selectedText || 'Content here'}</div>` + htmlContent.substring(end);
        break;
      default:
        return;
    }
    
    handleContentChange(newContent);
  };

  const insertTemplate = (template) => {
    const templates = {
      article: `<article class="blog-post">
  <header>
    <h1>Article Title</h1>
    <p class="subtitle">Brief description</p>
  </header>
  <main>
    <p>Your content here...</p>
  </main>
</article>`,
      section: `<section class="content-section">
  <h2>Section Title</h2>
  <p>Section content...</p>
</section>`,
      card: `<div class="card">
  <div class="card-header">
    <h3>Card Title</h3>
  </div>
  <div class="card-content">
    <p>Card content...</p>
  </div>
</div>`,
      grid: `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div class="grid-item">Item 1</div>
  <div class="grid-item">Item 2</div>
  <div class="grid-item">Item 3</div>
</div>`,
      button: `<button class="btn btn-primary">Click me</button>`,
      form: `<form class="contact-form">
  <div class="form-group">
    <label for="name">Name:</label>
    <input type="text" id="name" name="name" required>
  </div>
  <div class="form-group">
    <label for="email">Email:</label>
    <input type="email" id="email" name="email" required>
  </div>
  <button type="submit">Submit</button>
</form>`
    };
    
    if (templates[template]) {
      handleContentChange(htmlContent + '\n\n' + templates[template]);
    }
  };

  const formatHTML = () => {
    try {
      const formatted = htmlContent
        .replace(/></g, '>\n<')
        .replace(/^\s+|\s+$/gm, '')
        .split('\n')
        .map((line, index, array) => {
          const trimmed = line.trim();
          if (!trimmed) return '';
          
          const openTags = (trimmed.match(/</g) || []).length;
          const closeTags = (trimmed.match(/>/g) || []).length;
          const depth = Math.max(0, openTags - closeTags);
          
          return '  '.repeat(depth) + trimmed;
        })
        .join('\n');
      
      handleContentChange(formatted);
    } catch (error) {
      console.error('Error formatting HTML:', error);
    }
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white ' : ''}`}>
      <div className="border rounded-lg bg-white ">
        <div className="flex items-center justify-between p-3 border-b bg-gray-50 ">
          <div className="flex items-center space-x-2">
            <Button
              variant={mode === 'visual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('visual')}
            >
              <Eye className="h-4 w-4 mr-1" />
              Visual
            </Button>
            <Button
              variant={mode === 'html' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('html')}
            >
              <Code className="h-4 w-4 mr-1" />
              HTML
            </Button>
            <Button
              variant={mode === 'split' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('split')}
            >
              <div className="flex h-4 w-4 mr-1">
                <div className="w-2 h-4 bg-current"></div>
                <div className="w-2 h-4 bg-current opacity-50"></div>
              </div>
              Split
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        {(mode === 'visual' || mode === 'split') && (
          <div className="border-b p-2 bg-gray-50 ">
            <div className="flex flex-wrap gap-1">
              <Button variant="ghost" size="sm" onClick={() => insertHTML('bold')}>
                <Bold className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => insertHTML('italic')}>
                <Italic className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <Button variant="ghost" size="sm" onClick={() => insertHTML('h1')}>
                <Heading1 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => insertHTML('h2')}>
                <Heading2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => insertHTML('h3')}>
                <Heading3 className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <Button variant="ghost" size="sm" onClick={() => insertHTML('link')}>
                <Link className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => insertHTML('image')}>
                <Image className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => insertHTML('list')}>
                <List className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => insertHTML('code')}>
                <Code className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => insertHTML('blockquote')}>
                <Quote className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => insertHTML('div')}>
                <Square className="h-4 w-4" />
              </Button>
              
              <Separator orientation="vertical" className="h-6 mx-1" />
              
              <Select onValueChange={insertTemplate}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue placeholder="Templates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="section">Section</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="button">Button</SelectItem>
                  <SelectItem value="form">Form</SelectItem>
                </SelectContent>
              </Select>
              
              {mode === 'html' && (
                <Button variant="ghost" size="sm" onClick={formatHTML}>
                  <FileText className="h-4 w-4 mr-1" />
                  Format
                </Button>
              )}
            </div>
          </div>
        )}

        <div className={`${mode === 'split' ? 'grid grid-cols-2 gap-2' : ''} min-h-[400px]`}>
          {(mode === 'visual' || mode === 'split') && (
            <div className="p-4">
              <div 
                contentEditable
                suppressContentEditableWarning={true}
                className="prose max-w-none min-h-[350px] p-4 border rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                onInput={(e) => {
                  const content = e.currentTarget.innerHTML;
                  handleContentChange(content);
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  const text = e.clipboardData.getData('text/plain');
                  document.execCommand('insertText', false, text);
                }}
                dangerouslySetInnerHTML={{ __html: htmlContent || '<p>Start writing your content...</p>' }}
              />
            </div>
          )}
          
          {(mode === 'html' || mode === 'split') && (
            <div className="p-4">
              <Textarea
                id="html-editor"
                value={htmlContent}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="<p>Enter your HTML content here...</p>"
                className={`min-h-[350px] font-mono text-sm resize-none ${mode === 'split' ? 'h-[350px]' : 'h-[400px]'}`}
              />
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t bg-gray-50 text-sm text-gray-600 ">
          <div className="flex justify-between items-center">
            <div className="space-x-4">
              <span>Characters: {stats.chars}</span>
              <span>Words: {stats.words}</span>
              <span>Lines: {stats.lines}</span>
            </div>
            <div className="text-xs">
              Reading time: ~{Math.ceil(stats.words / 200)} min
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateBlogPost() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("content");
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [availableAuthors, setAvailableAuthors] = useState<Array<{id: string, firstName: string, lastName: string, email: string, role: string}>>([]);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  // Check for editing mode on component mount
  useEffect(() => {
    const editingData = localStorage.getItem('editingBlogPost');
    if (editingData) {
      try {
        const postData = JSON.parse(editingData);
        if (postData.isEditing) {
          setIsEditingMode(true);
          setEditingPostId(postData.id);
          setBlogPost({
            title: postData.title || '',
            slug: postData.slug || '',
            customSlug: !!postData.slug, // Only set true if slug already exists
            excerpt: postData.excerpt || '',
            content: postData.content || '',
            metaTitle: postData.seoTitle || postData.metaTitle || '',
            metaDescription: postData.metaDescription || '',
            tags: Array.isArray(postData.tags) ? postData.tags : [],
            categoryId: typeof postData.categoryId === 'string' ? parseInt(postData.categoryId) : postData.categoryId || 1,
            authorId: postData.authorId || '',
            status: postData.status || 'draft',
            featuredImage: postData.featuredImage || '',
            focusKeyword: postData.focusKeyword || '',
            canonicalUrl: postData.canonicalUrl || '',
            robots: postData.robots || 'index, follow',
            ogTitle: postData.ogTitle || '',
            ogDescription: postData.ogDescription || '',
            ogImage: postData.openGraphImage || postData.ogImage || '',
            twitterTitle: postData.twitterTitle || '',
            twitterDescription: postData.twitterDescription || '',
            twitterCard: postData.twitterCard || 'summary_large_image',
            schemaType: postData.schema || 'BlogPosting',
            customCSS: postData.customCSS || '',
            customJS: postData.customJS || '',
            externalLibraries: Array.isArray(postData.externalLibraries) ? postData.externalLibraries : [],
            scheduledAt: postData.scheduledAt || '',
            publishedAt: postData.publishedAt || '',
            allowComments: postData.allowComments !== false,
            isFeatured: postData.featured || postData.isFeatured || false,
            seoScore: postData.seoScore || 0,
            readabilityScore: postData.readabilityScore || 0
          });
          // Clear the localStorage after loading
          localStorage.removeItem('editingBlogPost');
        }
      } catch (error) {
        console.error('Error loading editing data:', error);
        localStorage.removeItem('editingBlogPost');
      }
    }
  }, []);

  // Fetch available authors for selection
  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const response = await fetch('/api/admin/users', {
          credentials: 'include'
        });
        if (response.ok) {
          const authors = await response.json();
          setAvailableAuthors(authors);
          // Set default author if available and not editing
          if (authors.length > 0 && !blogPost.authorId && !isEditingMode) {
            setBlogPost(prev => ({ ...prev, authorId: authors[0].id }));
          }
        }
      } catch (error) {
        console.error('Error fetching authors:', error);
      }
    };
    
    fetchAuthors();
  }, [isEditingMode]);

  const [blogPost, setBlogPost] = useState({
    title: '',
    slug: '',
    customSlug: false, // Track if user has manually edited slug
    excerpt: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
    tags: [] as string[],
    categoryId: 1,
    authorId: '', // Add author selection
    status: 'draft',
    featuredImage: '',
    focusKeyword: '',
    canonicalUrl: '',
    robots: 'index, follow',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    twitterTitle: '',
    twitterDescription: '',
    twitterCard: 'summary_large_image',
    schemaType: 'BlogPosting',
    customCSS: '',
    customJS: '',
    externalLibraries: [] as string[],
    scheduledAt: '',
    publishedAt: '', // Add missing publishedAt property
    allowComments: true,
    isFeatured: false,
    seoScore: 0,
    readabilityScore: 0
  });

  // Calculate SEO score dynamically
  useEffect(() => {
    const calculateSEOScore = () => {
      let score = 0;
      
      // Title checks
      if (blogPost.title) score += 15;
      if (blogPost.title.length >= 30 && blogPost.title.length <= 60) score += 10;
      
      // Meta description checks
      if (blogPost.metaDescription) score += 15;
      if (blogPost.metaDescription.length >= 120 && blogPost.metaDescription.length <= 160) score += 10;
      
      // Focus keyword checks
      if (blogPost.focusKeyword) score += 15;
      if (blogPost.title.toLowerCase().includes(blogPost.focusKeyword.toLowerCase())) score += 10;
      
      // Content checks
      if (blogPost.content) score += 10;
      if (blogPost.content.length > 300) score += 10;
      
      // Featured image
      if (blogPost.featuredImage) score += 5;
      
      setBlogPost(prev => ({ ...prev, seoScore: Math.min(100, score) }));
    };
    
    calculateSEOScore();
  }, [blogPost.title, blogPost.metaDescription, blogPost.focusKeyword, blogPost.content, blogPost.featuredImage]);

  // Error display component
  const ErrorMessage = ({ field }: { field: string }) => {
    const error = validationErrors[field];
    if (!error) return null;
    
    return (
      <div className="flex items-center space-x-2 mt-1">
        <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
        <span className="text-sm text-red-500">{error}</span>
      </div>
    );
  };

  // Generate slug automatically from title
  useEffect(() => {
    if (blogPost.title && (!blogPost.customSlug || !blogPost.slug)) {
      const generatedSlug = blogPost.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters except spaces
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/(^-|-$)/g, '') // Remove leading/trailing hyphens
        .substring(0, 200); // Ensure reasonable length
      
      // Ensure slug is not empty and has minimum length
      const finalSlug = generatedSlug.length >= 3 ? generatedSlug : `blog-post-${Date.now()}`;
      setBlogPost(prev => ({ ...prev, slug: finalSlug }));
    }
  }, [blogPost.title, blogPost.customSlug]);

  // Real-time validation function
  const validateBlogPost = (data: typeof blogPost) => {
    const errors: Record<string, string> = {};

    try {
      // Create validation data with proper types
      const validationData = {
        ...data,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        tags: Array.isArray(data.tags) ? data.tags : [],
        categoryId: typeof data.categoryId === 'string' ? parseInt(data.categoryId) : data.categoryId,
        slug: data.slug ? data.slug.substring(0, 255) : undefined
      };

      // Validate against schema
      insertBlogPostSchema.parse(validationData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          const field = err.path.join('.');
          errors[field] = err.message;
        });
      }
    }

    // Custom validation rules
    if (!data.title?.trim()) {
      errors.title = "Title is required";
    }
    if (data.title && data.title.length > 200) {
      errors.title = "Title must be less than 200 characters";
    }
    if (!data.slug?.trim()) {
      errors.slug = "Slug is required";
    } else if (data.slug && data.slug.length > 200) {
      errors.slug = "Slug must be less than 200 characters";
    } else if (data.slug && data.slug.length < 3) {
      errors.slug = "Slug must be at least 3 characters long";
    }
    if (!data.content?.trim()) {
      errors.content = "Content is required";
    }
    if (!data.authorId) {
      errors.authorId = "Author selection is required";
    }
    if (data.content && data.content.length > 50000) {
      errors.content = "Content must be less than 50,000 characters";
    }
    if (data.excerpt && data.excerpt.length > 500) {
      errors.excerpt = "Excerpt must be less than 500 characters";
    }
    if (data.metaDescription && data.metaDescription.length > 160) {
      errors.metaDescription = "Meta description should be less than 160 characters for SEO";
    }
    if (data.status === 'scheduled') {
      if (!data.scheduledAt) {
        errors.scheduledAt = "Schedule date and time is required for scheduled posts";
      } else {
        const scheduledDate = new Date(data.scheduledAt);
        const now = new Date();
        if (scheduledDate <= now) {
          errors.scheduledAt = "Scheduled date must be in the future";
        }
      }
    }

    return errors;
  };

  // Validate on every change
  useEffect(() => {
    const errors = validateBlogPost(blogPost);
    setValidationErrors(errors);
  }, [blogPost]);

  const handleSave = async (status = 'draft') => {
    // Check for validation errors
    const errors = validateBlogPost(blogPost);
    if (Object.keys(errors).length > 0) {
      const firstError = Object.entries(errors)[0];
      toast({
        title: "Validation errors found",
        description: `${firstError[0]}: ${firstError[1]}. Please fix all errors before saving.`,
        variant: "destructive",
      });
      setValidationErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      console.log('DEBUG: About to save blog post. Featured image value:', blogPost.featuredImage);
      
      // Generate automatic schema markup
      const schemaMarkup = generateSchemaMarkup(blogPost);
      
      // Create the blog post data with proper length limits
      const blogData = {
        title: (blogPost.title || '').substring(0, 200),
        slug: blogPost.slug || `blog-post-${Date.now()}`,
        excerpt: (blogPost.excerpt || '').substring(0, 500),
        content: (blogPost.content || '').substring(0, 50000),
        metaTitle: (blogPost.metaTitle || blogPost.title || '').substring(0, 200),
        metaDescription: (blogPost.metaDescription || blogPost.excerpt || '').substring(0, 160),
        tags: Array.isArray(blogPost.tags) ? blogPost.tags.slice(0, 10) : [], // Limit tags
        categoryId: typeof blogPost.categoryId === 'string' ? parseInt(blogPost.categoryId) : blogPost.categoryId || 1,
        authorId: blogPost.authorId, // Include author ID
        status: status,
        featuredImage: (blogPost.featuredImage || '').substring(0, 500),
        canonicalUrl: (blogPost.canonicalUrl || '').substring(0, 500),
        robots: blogPost.robots || 'index, follow',
        ogTitle: (blogPost.ogTitle || blogPost.title || '').substring(0, 200),
        ogDescription: (blogPost.ogDescription || blogPost.excerpt || '').substring(0, 300),
        ogImage: (blogPost.ogImage || blogPost.featuredImage || '').substring(0, 500),
        twitterTitle: (blogPost.twitterTitle || blogPost.title || '').substring(0, 200),
        twitterDescription: (blogPost.twitterDescription || blogPost.excerpt || '').substring(0, 200),
        twitterCard: blogPost.twitterCard || 'summary_large_image',
        schemaType: blogPost.schemaType || 'BlogPosting',
        customCSS: (blogPost.customCSS || '').substring(0, 10000),
        customJS: (blogPost.customJS || '').substring(0, 10000),
        scheduledAt: status === 'scheduled' && blogPost.scheduledAt ? new Date(blogPost.scheduledAt).toISOString() : null,
        publishedAt: status === 'published' ? new Date().toISOString() : null,
        readingTime: Math.ceil((blogPost.content || '').split(' ').length / 200),
        seoScore: blogPost.seoScore || 0
      };

      console.log('DEBUG: Blog data being sent to server:', {
        title: blogData.title,
        featuredImage: blogData.featuredImage,
        hasImage: !!blogData.featuredImage
      });

      const endpoint = isEditingMode ? `/api/admin/blog-posts/${editingPostId}` : '/api/admin/blog-posts';
      const method = isEditingMode ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(blogData),
      });

      if (!response.ok) {
        throw new Error('Failed to save blog post');
      }

      const savedPost = await response.json();
      
      toast({
        title: isEditingMode ? "Blog post updated" : "Blog post saved",
        description: `Post ${isEditingMode ? 'updated' : 'saved'} as ${status} successfully with automatic Google schema markup.`,
      });
      
      if (status === 'published' || status === 'scheduled') {
        setLocation('/super-admin');
      }
    } catch (error: any) {
      console.error('Error saving blog post:', error);
      
      // Parse error response for better user feedback
      if (error.response) {
        const errorData = await error.response.json().catch(() => ({}));
        if (errorData.field) {
          setValidationErrors({ [errorData.field]: errorData.message });
        }
        toast({
          title: "Error",
          description: errorData.message || "Failed to save blog post. Please check your input.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save blog post. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const seoScore = Math.min(100, Math.max(0, 
    (blogPost.metaTitle ? 20 : 0) +
    (blogPost.metaDescription ? 20 : 0) +
    (blogPost.focusKeyword ? 20 : 0) +
    (blogPost.ogTitle ? 20 : 0) +
    (blogPost.content.length > 300 ? 20 : 0)
  ));

  return (
    <div className="min-h-screen bg-[#FAF8F3] ">
      <div className="border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/super-admin')}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold">
                  {isEditingMode ? 'Edit Blog Post' : 'Create New Blog Post'}
                </h1>
                <p className="text-gray-600 ">
                  {isEditingMode ? 'Update and republish your blog content' : 'Write and publish your blog content'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                onClick={() => handleSave('draft')}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button 
                onClick={() => handleSave('published')}
                disabled={isSaving}
              >
                <Send className="h-4 w-4 mr-2" />
                {isEditingMode ? 'Update' : 'Publish'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Validation Error Summary */}
        {Object.keys(validationErrors).length > 0 && (
          <Alert className="mb-6 border-red-500 bg-red-50 ">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription>
              <div className="font-medium text-red-600 mb-2">
                {Object.keys(validationErrors).length} validation error(s) found:
              </div>
              <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                {Object.entries(validationErrors).map(([field, error]) => (
                  <li key={field}>
                    <span className="font-medium capitalize">{field}:</span> {error}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="seo" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              SEO & Meta
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Advanced Editor
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              FAQ Generator
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Custom Code
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Blog Content</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={blogPost.title}
                        onChange={(e) => setBlogPost(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter blog post title..."
                        className={`text-lg font-semibold ${validationErrors.title ? 'border-red-500' : ''}`}
                      />
                      <ErrorMessage field="title" />
                      {blogPost.title && (
                        <div className="text-xs text-gray-500 mt-1">
                          {blogPost.title.length}/200 characters
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="excerpt">Excerpt</Label>
                      <Textarea
                        id="excerpt"
                        value={blogPost.excerpt}
                        onChange={(e) => setBlogPost(prev => ({ ...prev, excerpt: e.target.value }))}
                        placeholder="Brief description of the blog post..."
                        rows={3}
                        className={validationErrors.excerpt ? 'border-red-500' : ''}
                      />
                      <ErrorMessage field="excerpt" />
                      {blogPost.excerpt && (
                        <div className="text-xs text-gray-500 mt-1">
                          {blogPost.excerpt.length}/500 characters
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Content *</Label>
                      <AdvancedHTMLEditor
                        value={blogPost.content}
                        onChange={(content) => setBlogPost(prev => ({ ...prev, content }))}
                      />
                      <ErrorMessage field="content" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Publishing Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Author *</Label>
                      <Select value={blogPost.authorId} onValueChange={(value) => setBlogPost(prev => ({ ...prev, authorId: value }))}>
                        <SelectTrigger className={validationErrors.authorId ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select author" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableAuthors.map((author) => (
                            <SelectItem key={author.id} value={author.id}>
                              {author.firstName} {author.lastName} ({author.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <ErrorMessage field="authorId" />
                    </div>

                    <div>
                      <Label>Category</Label>
                      <Select value={blogPost.categoryId.toString()} onValueChange={(value) => setBlogPost(prev => ({ ...prev, categoryId: parseInt(value) }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Business</SelectItem>
                          <SelectItem value="2">Technology</SelectItem>
                          <SelectItem value="3">Marketing</SelectItem>
                          <SelectItem value="4">News</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="tags">Tags</Label>
                      <Input
                        id="tags"
                        value={Array.isArray(blogPost.tags) ? blogPost.tags.join(', ') : blogPost.tags}
                        onChange={(e) => setBlogPost(prev => ({ 
                          ...prev, 
                          tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                        }))}
                        placeholder="Enter tags separated by commas..."
                      />
                    </div>

                    <div>
                      <FeaturedImageUpload 
                        image={blogPost.featuredImage}
                        onImageChange={(image) => setBlogPost(prev => ({ ...prev, featuredImage: image }))}
                        onImageRemove={() => setBlogPost(prev => ({ ...prev, featuredImage: '' }))}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Content Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Words:</span>
                      <span>{blogPost.content.split(' ').filter(word => word.length > 0).length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Reading time:</span>
                      <span>{Math.ceil(blogPost.content.split(' ').length / 200)} min</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>SEO Score:</span>
                      <span className={`font-bold ${blogPost.seoScore >= 80 ? 'text-green-600' : blogPost.seoScore >= 60 ? 'text-[#B45309]' : 'text-red-600'}`}>
                        {blogPost.seoScore}%
                      </span>
                    </div>
                    <Progress value={blogPost.seoScore} className="h-2" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced HTML Editor</CardTitle>
              </CardHeader>
              <CardContent>
                <AdvancedHTMLEditor
                  value={blogPost.content}
                  onChange={(content) => setBlogPost(prev => ({ ...prev, content }))}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faq" className="space-y-6">
            <FAQHTMLEditor
              onGeneratedHTML={(html) => {
                // Option 1: Append FAQ HTML to existing content
                setBlogPost(prev => ({ 
                  ...prev, 
                  content: prev.content + '\n\n' + html 
                }));
                // Show success message
                toast({
                  title: "FAQ Added!",
                  description: "FAQ accordion has been added to your blog post content.",
                });
              }}
              initialValue=""
            />
          </TabsContent>

          <TabsContent value="seo" className="space-y-6">
            <EnhancedSEOPanel 
              seoData={{
                title: blogPost.title,
                metaDescription: blogPost.metaDescription,
                focusKeyword: blogPost.focusKeyword,
                content: blogPost.content,
                featuredImage: blogPost.featuredImage || '',
                tags: Array.isArray(blogPost.tags) ? blogPost.tags : [],
                canonicalUrl: blogPost.canonicalUrl || '',
                ogTitle: blogPost.ogTitle || '',
                ogDescription: blogPost.ogDescription || '',
                ogImage: blogPost.ogImage || '',
                twitterTitle: blogPost.twitterTitle || '',
                twitterDescription: blogPost.twitterDescription || '',
                twitterImage: blogPost.twitterImage || '',
                robots: blogPost.robots || 'index, follow',
                schema: blogPost.schema || '',
                metaTitle: blogPost.metaTitle || blogPost.title,
                category: blogPost.categoryId === 1 ? 'Business' : 
                         blogPost.categoryId === 2 ? 'Technology' : 
                         blogPost.categoryId === 3 ? 'Marketing' : 
                         blogPost.categoryId === 4 ? 'News' : 'General'
              }}
              onSEODataChange={(data) => {
                setBlogPost(prev => ({ ...prev, ...data }));
              }}
            />
          </TabsContent>

          <TabsContent value="custom" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Custom CSS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={blogPost.customCSS}
                    onChange={(e) => setBlogPost(prev => ({ ...prev, customCSS: e.target.value }))}
                    placeholder="/* Add your custom CSS here */
.my-custom-class {
  color: #333;
  font-size: 16px;
}"
                    className="font-mono text-sm h-64 resize-none"
                  />
                  <div className="text-xs text-gray-500 mt-2">
                    Custom CSS will be injected into the blog post head
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="h-5 w-5" />
                    Custom JavaScript
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={blogPost.customJS}
                    onChange={(e) => setBlogPost(prev => ({ ...prev, customJS: e.target.value }))}
                    placeholder="// Add your custom JavaScript here
console.log('Custom JS loaded');

// Example: Add click tracking
document.addEventListener('click', function(e) {
  console.log('Element clicked:', e.target);
});"
                    className="font-mono text-sm h-64 resize-none"
                  />
                  <div className="text-xs text-gray-500 mt-2">
                    Custom JavaScript will be executed when the blog post loads
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>External Libraries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { name: "Chart.js", url: "https://cdn.jsdelivr.net/npm/chart.js" },
                      { name: "AOS Animation", url: "https://unpkg.com/aos@next/dist/aos.js" },
                      { name: "Prism.js", url: "https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/prism.min.js" },
                      { name: "Lightbox2", url: "https://cdnjs.cloudflare.com/ajax/libs/lightbox2/2.11.3/js/lightbox.min.js" },
                      { name: "Swiper.js", url: "https://unpkg.com/swiper/swiper-bundle.min.js" },
                      { name: "GSAP", url: "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.4/gsap.min.js" }
                    ].map((lib) => (
                      <div key={lib.name} className="flex items-center space-x-2">
                        <Switch
                          checked={blogPost.externalLibraries.includes(lib.url)}
                          onCheckedChange={(checked) => {
                            setBlogPost(prev => ({
                              ...prev,
                              externalLibraries: checked
                                ? [...prev.externalLibraries, lib.url]
                                : prev.externalLibraries.filter(url => url !== lib.url)
                            }));
                          }}
                        />
                        <Label className="text-sm">{lib.name}</Label>
                      </div>
                    ))}
                  </div>
                  
                  {blogPost.externalLibraries.length > 0 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-sm text-blue-700">
                        {blogPost.externalLibraries.length} external libraries will be loaded
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Publication Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="status">Publication Status</Label>
                      <Select value={blogPost.status} onValueChange={(value) => setBlogPost(prev => ({ ...prev, status: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="isFeatured">Featured Post</Label>
                      <div className="flex items-center space-x-2 mt-2">
                        <Switch
                          checked={blogPost.isFeatured}
                          onCheckedChange={(checked) => setBlogPost(prev => ({ ...prev, isFeatured: checked }))}
                        />
                        <Label className="text-sm">Mark as featured</Label>
                      </div>
                    </div>
                  </div>

                  {blogPost.status === 'scheduled' && (
                    <div>
                      <Label htmlFor="scheduledAt">Schedule Date & Time *</Label>
                      <Input
                        type="datetime-local"
                        id="scheduledAt"
                        value={blogPost.scheduledAt}
                        onChange={(e) => setBlogPost(prev => ({ ...prev, scheduledAt: e.target.value }))}
                        min={new Date().toISOString().slice(0, 16)}
                        className={validationErrors.scheduledAt ? 'border-red-500' : ''}
                      />
                      <ErrorMessage field="scheduledAt" />
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={blogPost.allowComments}
                        onCheckedChange={(checked) => setBlogPost(prev => ({ ...prev, allowComments: checked }))}
                      />
                      <Label className="text-sm">Allow comments</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Post Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg bg-white">
                      {blogPost.featuredImage && (
                        <img
                          src={blogPost.featuredImage}
                          alt="Featured image preview"
                          className="w-full h-32 object-cover rounded mb-3"
                        />
                      )}
                      <h3 className="font-bold text-lg">{blogPost.title || "Blog Post Title"}</h3>
                      <p className="text-gray-600 text-sm mt-2">
                        {blogPost.excerpt || "Blog post excerpt will appear here..."}
                      </p>
                      <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                        <span>{Math.ceil(blogPost.content.split(' ').length / 200)} min read</span>
                        <span>{blogPost.status}</span>
                      </div>
                    </div>
                    
                    <div className="text-center space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const previewWindow = window.open('', '_blank', 'width=800,height=600');
                          previewWindow.document.write(`
                            <html>
                              <head>
                                <title>${blogPost.title || 'Blog Preview'}</title>
                                <style>
                                  body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                                  img { max-width: 100%; height: auto; }
                                  ${blogPost.customCSS}
                                </style>
                              </head>
                              <body>
                                <h1>${blogPost.title || 'Blog Post Title'}</h1>
                                ${blogPost.featuredImage ? `<img src="${blogPost.featuredImage}" alt="Featured Image" />` : ''}
                                <p><em>${blogPost.excerpt || 'No excerpt provided'}</em></p>
                                <div>${blogPost.content || 'No content provided'}</div>
                                <script>${blogPost.customJS}</script>
                              </body>
                            </html>
                          `);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview Post
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}