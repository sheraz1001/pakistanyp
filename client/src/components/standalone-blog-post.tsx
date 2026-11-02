import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { useEffect, useState } from "react";
import { ArrowLeft, Clock, Calendar, Eye, Share2, Bookmark, Tag, ChevronUp, Copy, Facebook, Twitter, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  category?: string;
  tags?: string[];
  author?: {
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
  publishedAt: string;
  updatedAt: string;
  readTime?: number;
  views?: number;
  isFeatured?: boolean;
  customCSS?: string;
  customJS?: string;
  metaTitle?: string;
  metaDescription?: string;
}

interface StandaloneBlogPostProps {
  post: BlogPost;
  onBack: () => void;
}

// Table of Contents Component
const TableOfContents = ({ content }: { content: string }) => {
  const [headings, setHeadings] = useState<Array<{id: string, text: string, level: number}>>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (!content) return;

    // Extract only H2 headings from content
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headingElements = doc.querySelectorAll('h2');
    
    const extractedHeadings = Array.from(headingElements).map((heading, index) => ({
      id: `heading-${index}`,
      text: heading.textContent || '',
      level: 2
    }));

    setHeadings(extractedHeadings);
  }, [content]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-50px 0px -50px 0px' }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  if (headings.length === 0) return null;

  return (
    <Card className="p-4 sticky top-8">
      <h3 className="text-base font-semibold mb-3 text-[#0A0A0A]">In This Article</h3>
      <nav className="space-y-1">
        {headings.map((heading) => (
          <button
            key={heading.id}
            onClick={() => scrollToHeading(heading.id)}
            className={`block w-full text-left text-xs py-1.5 px-2 rounded transition-colors ${
              activeId === heading.id 
                ? 'bg-[#E8F4EC] text-[#05501F]' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {heading.text}
          </button>
        ))}
      </nav>
    </Card>
  );
};

// Article Stats Component
const ArticleStats = ({ post }: { post: BlogPost }) => {
  return (
    <Card className="p-4 sticky top-48">
      <h3 className="text-base font-semibold mb-3 text-[#0A0A0A]">Article Stats</h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Reading Time</span>
          <span className="font-medium">{post.readTime || 5} min</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Views</span>
          <span className="font-medium">{post.views || 0}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Published</span>
          <span className="font-medium">{new Date(post.publishedAt).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Updated</span>
          <span className="font-medium">{new Date(post.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </Card>
  );
};

export default function StandaloneBlogPost({ post, onBack }: StandaloneBlogPostProps) {
  const { toast } = useToast();
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Custom CSS injection with proper sanitization
  useEffect(() => {
    if (!post.customCSS) return;
    
    try {
      // Clean the CSS by removing any script tags and extracting only style content
      let cleanCSS = post.customCSS;
      
      // Remove script tags from CSS
      cleanCSS = cleanCSS.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
      
      // Extract content between <style> tags if present, otherwise use as-is
      const styleMatch = cleanCSS.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
      if (styleMatch) {
        cleanCSS = styleMatch[1];
      }
      
      const style = document.createElement('style');
      style.type = 'text/css';
      style.textContent = cleanCSS.trim();
      document.head.appendChild(style);
      
      return () => {
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      };
    } catch (error) {
      console.warn('Failed to apply custom CSS:', error);
    }
  }, [post.customCSS]);

  // Custom JS injection with proper sanitization
  useEffect(() => {
    if (!post.customJS) return;
    
    try {
      // Clean the JS by fixing escaped quotes and extracting script content
      let cleanJS = post.customJS;
      
      // Fix escaped quotes
      cleanJS = cleanJS.replace(/""/g, '"');
      
      // Extract content between <script> tags if present, otherwise use as-is
      const scriptMatch = cleanJS.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
      if (scriptMatch) {
        cleanJS = scriptMatch[1];
      }
      
      // Create and execute script safely
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.textContent = cleanJS.trim();
      document.body.appendChild(script);
      
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    } catch (error) {
      console.warn('Failed to apply custom JS:', error);
    }
  }, [post.customJS]);

  // Scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Add IDs to headings in content
  const processContent = (content: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headings = doc.querySelectorAll('h1, h2, h3, h4');
    
    headings.forEach((heading, index) => {
      heading.id = `heading-${index}`;
    });
    
    return doc.body.innerHTML;
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleShare = (platform: string) => {
    const title = encodeURIComponent(post.title);
    const url = encodeURIComponent(shareUrl);
    
    let shareLink = '';
    switch (platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${title}&url=${url}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copied!",
          description: "The blog post link has been copied to your clipboard.",
        });
        return;
    }
    
    if (shareLink) {
      window.open(shareLink, '_blank', 'width=600,height=400');
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header Bar */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button 
              onClick={onBack}
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleShare('copy')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Link
              </Button>
              <Button
                onClick={() => handleShare('facebook')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Facebook className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Article - 75% width */}
          <div className="lg:col-span-3">
            <article>
              {/* Featured Image */}
              {post.featuredImage && (
                <div className="mb-8 -mx-4 lg:mx-0">
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full aspect-[16/10] sm:aspect-[21/9] rounded-[20px] sm:rounded-[28px] object-cover"
                  />
                </div>
              )}

              {/* Article Header */}
              <header className="mb-8">
                {post.category && (
                  <Badge className="mb-4 bg-[#E8F4EC] text-[#05501F]">
                    {post.category}
                  </Badge>
                )}
                
                <h1 className="text-[clamp(32px,4.5vw,52px)] font-bold tracking-[-0.045em] text-[#0A0A0A] mb-4 leading-tight">
                  {post.title}
                </h1>
                
                {post.excerpt && (
                  <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                    {post.excerpt}
                  </p>
                )}

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 border-b pb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#F1F2F6] rounded-full flex items-center justify-center text-[#0A0A0A] text-sm font-medium">
                      {post.author?.firstName?.charAt(0) || 'A'}
                    </div>
                    <span>{post.author?.firstName} {post.author?.lastName}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(post.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {post.readTime || 5} min read
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {post.views || 0} views
                  </div>
                </div>
              </header>

              {/* Article Content */}
              <div 
                className="yp-prose max-w-[700px]"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(processContent(post.content)) }}
              />

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="mt-8 pt-6 border-t">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 mr-2">Tags:</span>
                    {post.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </article>
          </div>

          {/* Sidebar - 25% width */}
          <div className="lg:col-span-1 space-y-6">
            <TableOfContents content={post.content} />
            <ArticleStats post={post} />
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 rounded-full w-12 h-12 p-0 bg-[#0B6B2E] hover:bg-[#05501F] shadow-lg"
        >
          <ChevronUp className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
}