import React, { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Copy, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import Footer from "@/components/footer";

// Type definition for blog post
interface BlogPost {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  category?: string;
  isFeatured?: boolean;
  featuredImage?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
  readTime?: number;
  viewCount?: number;
  tags?: string[];
  customCSS?: string;
  customJS?: string;
  author?: {
    firstName?: string;
    lastName?: string;
  };
}

// Reading Progress Bar Component
const ReadingProgressBar = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const totalHeight = document.body.scrollHeight - window.innerHeight;
      const currentProgress = (window.scrollY / totalHeight) * 100;
      setProgress(Math.min(currentProgress, 100));
    };

    window.addEventListener('scroll', updateProgress);
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  return (
    <div className="progress-container fixed top-0 left-0 w-full h-1 bg-[#EEF0F4] z-50">
      <div 
        className="progress-bar h-full bg-[#0B6B2E] transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

// Table of Contents Component
const TableOfContents = ({ blogPost }: { blogPost: BlogPost }) => {
  const [activeHeading, setActiveHeading] = useState("");
  const [headings, setHeadings] = useState<any[]>([]);

  useEffect(() => {
    // Extract headings from blog content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = blogPost?.content || '';
    const extractedHeadings = Array.from(tempDiv.querySelectorAll('h2, h3, h4')).map((heading, index) => {
      const id = heading.id || heading.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '') || `heading-${index}`;
      return {
        id,
        text: heading.textContent || '',
        level: parseInt(heading.tagName.charAt(1))
      };
    });
    setHeadings(extractedHeadings);

    // Add IDs to actual headings in the content
    const contentHeadings = document.querySelectorAll('.blog-content h2, .blog-content h3, .blog-content h4');
    contentHeadings.forEach((heading, index) => {
      if (!heading.id) {
        heading.id = extractedHeadings[index]?.id || `heading-${index}`;
      }
    });

    // Scroll tracking for active heading
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      let currentActive = "";

      contentHeadings.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        const absoluteTop = rect.top + window.scrollY;
        
        if (scrollPosition >= absoluteTop && scrollPosition < absoluteTop + heading.clientHeight + 200) {
          currentActive = heading.id;
        }
      });

      setActiveHeading(currentActive);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [blogPost]);

  const scrollToHeading = (headingId: string) => {
    document.getElementById(headingId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  if (headings.length === 0) return null;

  return (
    <nav aria-label="On this page" className="toc-container sticky top-24 w-60 flex-none self-start hidden lg:block">
      <h4 className="yp-label px-3 pb-2.5">On this page</h4>
      <ul className="space-y-0.5">
        {headings.map((heading) => (
          <li key={heading.id}>
            <button
              onClick={() => scrollToHeading(heading.id)}
              className={`
                block w-full text-left px-3 py-2 rounded-[10px] text-sm leading-snug transition-colors 
                ${heading.level === 3 ? 'pl-6' : ''}
                ${heading.level === 4 ? 'pl-9' : ''}
                ${activeHeading === heading.id 
                  ? 'font-medium text-[#05501F] bg-[#E8F4EC]' 
                  : 'text-[#3A4354] hover:text-[#0A0A0A] hover:bg-[#F1F2F6]'
                }
              `}
            >
              {heading.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

// Copy Button Component
const CopyButton = ({ text, className = "" }: { text: string; className?: string }) => {
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard!" });
    } catch (err) {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`copy-btn absolute top-2 right-2 bg-[#0B6B2E] text-white px-2 py-1 rounded-md text-xs hover:bg-[#05501F] transition-opacity opacity-0 group-hover:opacity-100 ${className}`}
    >
      <Copy className="w-3 h-3" />
    </button>
  );
};

// Scroll to Top Button
const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`
        fixed bottom-8 right-8 z-50 grid h-11 w-11 place-items-center rounded-full border border-[#E3E6EC] bg-white text-[#0A0A0A] shadow-[0_12px_32px_-16px_rgba(10,10,10,.35)]
        transition-opacity duration-300 hover:border-[#0B6B2E] hover:text-[#0B6B2E]
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
      `}
    >
      <ChevronUp className="w-5 h-5" />
    </button>
  );
};

export default function AdminBlogPost() {
  const params = useParams<{ slug: string }>();
  const [location] = useLocation();

  const { data: blogPost, isLoading: postLoading, error: postError } = useQuery<BlogPost>({
    queryKey: ["/api/blog", params?.slug],
    enabled: !!params?.slug,
  });

  // Custom CSS styles
  useEffect(() => {
    // Add Google Fonts
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Add custom styles
    const style = document.createElement('style');
    style.textContent = `
      body {
        font-family: 'Inter', sans-serif;
        background-color: #f8f8f8;
        color: #333;
      }
      
      .admin-blog-content {
        font-family: 'Inter', sans-serif;
      }
      
      .admin-blog-content h1, 
      .admin-blog-content h2, 
      .admin-blog-content h3, 
      .admin-blog-content h4, 
      .admin-blog-content h5, 
      .admin-blog-content h6 {
        font-weight: 600;
        color: #004080;
        margin-top: 2rem;
        margin-bottom: 1rem;
      }
      
      .admin-blog-content h1 { font-size: 2.5rem; }
      .admin-blog-content h2 { font-size: 2rem; }
      .admin-blog-content h3 { font-size: 1.5rem; }
      .admin-blog-content h4 { font-size: 1.25rem; }
      
      .admin-blog-content .highlight {
        background-color: #e0f2fe;
        padding: 1rem;
        border-left: 4px solid #007bff;
        border-radius: 0.5rem;
        margin: 1.5rem 0;
        font-style: italic;
        position: relative;
      }
      
      .admin-blog-content .quote {
        border-left: 4px solid #f97316;
        padding-left: 1rem;
        margin: 1.5rem 0 1.5rem 1rem;
        font-style: italic;
        color: #555;
        position: relative;
        font-size: 1.125rem;
      }
      
      .admin-blog-content table {
        width: 100%;
        border-collapse: collapse;
        margin: 1.5rem 0;
        border-radius: 0.5rem;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      
      .admin-blog-content th,
      .admin-blog-content td {
        padding: 0.875rem;
        text-align: left;
        border-bottom: 1px solid #e2e8f0;
      }
      
      .admin-blog-content th {
        background-color: #f1f5f9;
        font-weight: 600;
        color: #334155;
      }
      
      .admin-blog-content tr:last-child td {
        border-bottom: none;
      }
      
      .admin-blog-content ul,
      .admin-blog-content ol {
        margin: 1rem 0;
        padding-left: 1.5rem;
      }
      
      .admin-blog-content li {
        margin: 0.5rem 0;
        line-height: 1.6;
      }
      
      .admin-blog-content p {
        margin: 1rem 0;
        line-height: 1.7;
      }
      
      .admin-blog-content strong {
        color: #f97316;
      }
      
      .admin-blog-content .text-blue-700 {
        color: #1d4ed8;
        font-weight: 600;
      }
      
      .admin-blog-content .text-orange-600,
      .admin-blog-content .text-orange-500 {
        color: #ea580c;
        font-weight: 600;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, []);

  if (postLoading) {
    return (
      <div className="min-h-screen bg-white">
        <ReadingProgressBar />
        <Header />
        <div className="yp-wrap py-16">
          <div className="animate-pulse flex justify-center">
            <div className="max-w-[860px] w-full flex flex-col items-center gap-5">
              <div className="h-3 w-40 rounded bg-[#EEF0F4]"></div>
              <div className="h-12 w-full rounded-xl bg-[#EEF0F4]"></div>
              <div className="h-5 w-3/4 rounded bg-[#F1F2F6]"></div>
              <div className="mt-6 aspect-[21/9] w-full rounded-[28px] bg-[#F1F2F6]"></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (postError || !blogPost) {
    return (
      <div className="min-h-screen bg-[#FAF8F3]">
        <ReadingProgressBar />
        <Header />
        <div className="yp-wrap py-24 text-center">
          <div className="yp-label">PakistanYP Insights</div>
          <h1 className="yp-h2 mt-3 mb-3 text-[#0A0A0A]">Blog Post Not Found</h1>
          <p className="text-[#5B6475] mb-8">The blog post you're looking for doesn't exist or has been moved.</p>
          <Link href="/blogs" className="yp-btn yp-btn-primary">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to Blog
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <ReadingProgressBar />
      <Header />

      {/* Header */}
      <div className="yp-wrap max-w-[860px] pt-10 sm:pt-14">
        <div className="mb-8 flex justify-center">
          <Link href="/blogs" className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-[#3A4354] hover:text-[#0B6B2E]">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to Blog
          </Link>
        </div>
        <header className="flex flex-col items-center gap-5 text-center">
          <span className="flex flex-wrap items-center justify-center gap-2.5">
            {blogPost?.isFeatured && (
              <span className="yp-pill bg-[#D71920] text-white">Featured</span>
            )}
            <span className="yp-label !text-[#0B6B2E]">
              {[blogPost?.category, blogPost?.readTime ? `${blogPost.readTime} min read` : ""].filter(Boolean).join(" · ")}
            </span>
          </span>

          <h1 className="m-0 text-[clamp(36px,5vw,58px)] font-bold leading-[1.05] tracking-[-0.045em] text-[#0A0A0A]">
            {blogPost?.title || 'Blog Post'}
          </h1>

          {blogPost?.excerpt && (
            <p className="m-0 text-lg sm:text-xl leading-[1.55] text-[#4B5565]">
              {blogPost.excerpt}
            </p>
          )}

          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-sm text-[#5B6475]">
            <span>Published {blogPost?.publishedAt || blogPost?.createdAt ? 
              new Date(blogPost.publishedAt || blogPost.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'Unknown'
            }</span>
            {blogPost?.viewCount && <span>{blogPost.viewCount} views</span>}
            <span>Article #{blogPost?.id || 'N/A'}</span>
          </div>
        </header>
      </div>

      {/* Featured Image */}
      {blogPost?.featuredImage && (
        <div className="yp-wrap pt-10 sm:pt-12">
          <div className="aspect-[16/10] overflow-hidden rounded-[20px] bg-[#F1F2F6] sm:aspect-[21/9] sm:rounded-[28px]">
            <img 
              src={blogPost.featuredImage} 
              alt={blogPost?.title || 'Blog post image'}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="yp-wrap flex justify-center items-start gap-14 pt-12 pb-20 lg:pt-14">
        {/* Table of Contents - Left Side */}
        <TableOfContents blogPost={blogPost} />

        {/* Blog Content */}
        <article className="min-w-0 w-full max-w-[700px] lg:flex-1">
          <div className="blog-content admin-blog-content">
            <div 
              dangerouslySetInnerHTML={{ __html: blogPost?.content || '' }}
              className="yp-prose"
            />
            
            {/* Custom Code Execution */}
            {blogPost?.customCSS && (
              <style dangerouslySetInnerHTML={{ __html: blogPost.customCSS }} />
            )}
            {blogPost?.customJS && (
              <script dangerouslySetInnerHTML={{ __html: blogPost.customJS }} />
            )}
          </div>

          {/* Article Footer */}
          {blogPost?.tags && blogPost.tags.length > 0 && (
            <footer className="mt-8 flex flex-wrap gap-2">
              {blogPost.tags.map((tag: string) => (
                <span key={tag} className="rounded-full bg-[#F1F2F6] px-3 py-2 text-sm text-[#3A4354]">
                  #{tag}
                </span>
              ))}
            </footer>
          )}
        </article>
      </div>
      
      <ScrollToTopButton />
      <Footer />
    </div>
  );
}