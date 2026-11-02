import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronUp, Link2, Facebook, Linkedin, BookOpen } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { country } from "@shared/country";

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
  readingTime?: number;
  categoryId?: number;
  views?: number;
  isFeatured?: boolean;
  customCSS?: string;
  customJS?: string;
  metaTitle?: string;
  metaDescription?: string;
}

interface CompactBlogPostProps {
  post: BlogPost;
  onBack: () => void;
  /** Resolved category name (posts only carry categoryId). */
  categoryName?: string;
  /** Other posts for the "Keep reading" section. */
  related?: any[];
  /** Blog categories, used to label related posts. */
  categories?: any[];
}


/* ---------- Shared helpers (also used by the blog index) ---------- */

const COVER_TINTS = [
  { bg: "#E8F4EC", ink: "#0B6B2E" },
  { bg: "#FFF4E0", ink: "#B45309" },
  { bg: "#E6F6F1", ink: "#047857" },
  { bg: "#F1F2F6", ink: "#334155" },
  { bg: "#FDECEC", ink: "#B91C1C" },
];

export function stripHtml(html: string | null | undefined): string {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function getReadingTime(post: any): number {
  const stored = post?.readingTime || post?.readTime;
  if (stored) return stored;
  const words = stripHtml(post?.content).split(" ").filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function formatPostDate(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: country.timezone });
}

export function getAuthorName(post: any): string {
  const name = [post?.author?.firstName, post?.author?.lastName].filter(Boolean).join(" ").trim();
  return name || `${country.brand} Editorial`;
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

export function getCategoryName(post: any, categories: any[] = []): string {
  if (typeof post?.category === "string" && post.category) return post.category;
  if (post?.category?.name) return post.category.name;
  const match = categories.find((c: any) => c.id === post?.categoryId);
  return match?.name || "";
}

/** Cover image, or a flat tinted tile when the post has no image. */
export function PostCover({
  post,
  className = "",
  eager = false,
}: {
  post: any;
  className?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const tint = COVER_TINTS[Math.abs(Number(post?.id) || 0) % COVER_TINTS.length];
  const src = post?.featuredImage || post?.featured_image;
  if (src && !failed) {
    return (
      <div className={`overflow-hidden bg-[#F1F2F6] ${className}`}>
        <img
          src={src}
          alt={post?.title || ""}
          loading={eager ? "eager" : "lazy"}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }
  return (
    <div
      className={`grid place-items-center ${className}`}
      style={{ background: tint.bg, color: tint.ink }}
      aria-hidden="true"
    >
      <BookOpen className="h-8 w-8" strokeWidth={1.75} />
    </div>
  );
}

/** Post card used in the blog grid and in "Keep reading". */
export function BlogPostCard({
  post,
  categoryName,
  showDate = true,
  titleSize = "text-[22px]",
  children,
}: {
  post: any;
  categoryName?: string;
  showDate?: boolean;
  titleSize?: string;
  children?: React.ReactNode;
}) {
  const date = formatPostDate(post?.publishedAt);
  const meta = [categoryName, `${getReadingTime(post)} min read`].filter(Boolean).join(" · ");
  return (
    <Link href={`/blogs/${post.slug}`} className="group flex flex-col gap-3.5 text-[#0A0A0A] hover:text-[#0A0A0A]">
      <PostCover post={post} className="aspect-[16/10] rounded-[20px]" />
      <span className="yp-label">{meta}</span>
      <h3 className={`m-0 ${titleSize} font-semibold leading-[1.3] tracking-[-0.025em] transition-colors group-hover:text-[#0B6B2E]`}>
        {children ?? post.title}
      </h3>
      {showDate && date && <span className="text-sm text-[#5B6475]">{date}</span>}
    </Link>
  );
}

/* ---------- Article ---------- */

type Heading = { id: string; text: string };

/** Sanitised article HTML with stable ids on every h2 (SSR-safe, no DOM needed). */
function buildArticle(content: string): { html: string; headings: Heading[] } {
  const headings: Heading[] = [];
  let index = 0;
  const base = sanitizeHtml(content).replace(/<h1(\s[^>]*)?>/gi, "<h2$1>").replace(/<\/h1>/gi, "</h2>");
  const html = base.replace(/<h2(\s[^>]*)?>([\s\S]*?)<\/h2>/gi, (_m, attrs = "", inner) => {
    const id = `heading-${index++}`;
    const cleanAttrs = String(attrs).replace(/\sid\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
    const text = stripHtml(inner);
    if (text) headings.push({ id, text });
    return `<h2 id="${id}"${cleanAttrs}>${inner}</h2>`;
  });
  return { html, headings };
}

const TableOfContents = ({ headings }: { headings: Heading[] }) => {
  const [activeId, setActiveId] = useState<string>(headings[0]?.id || "");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -60% 0px" }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  const scrollToHeading = (e: React.MouseEvent, id: string) => {
    const element = document.getElementById(id);
    if (element) {
      e.preventDefault();
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
    }
  };

  if (headings.length === 0) return null;

  return (
    <>
      <div className="yp-label px-3 pb-2.5">On this page</div>
      <nav aria-label="On this page" className="flex flex-col">
        {headings.map((heading) => {
          const active = activeId === heading.id;
          return (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              onClick={(e) => scrollToHeading(e, heading.id)}
              aria-current={active ? "location" : undefined}
              className={`block rounded-[10px] px-3 py-2 text-sm leading-snug transition-colors ${
                active
                  ? "bg-[#E8F4EC] font-medium text-[#05501F] hover:text-[#05501F]"
                  : "text-[#3A4354] hover:bg-[#F1F2F6] hover:text-[#0A0A0A]"
              }`}
            >
              {heading.text}
            </a>
          );
        })}
      </nav>
    </>
  );
};

// Share buttons
const ShareButtons = ({ post }: { post: BlogPost }) => {
  const { toast } = useToast();

  const handleShare = async (platform: string) => {
    const url = window.location.href;
    const title = post.title;

    let shareUrl = "";
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case "copy":
        try {
          await navigator.clipboard.writeText(url);
          toast({
            title: "Link copied!",
            description: "Article link has been copied to clipboard.",
          });
          return;
        } catch (err) {
          toast({
            variant: "destructive",
            title: "Failed to copy link",
            description: "Please copy the link manually from the address bar.",
          });
          return;
        }
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  };

  const btn = "yp-btn yp-btn-ghost !w-11 !px-0";
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" className={btn} onClick={() => handleShare("linkedin")} aria-label="Share on LinkedIn">
        <Linkedin className="h-4 w-4" aria-hidden="true" />
      </button>
      <button type="button" className={btn} onClick={() => handleShare("twitter")} aria-label="Share on X">
        <span aria-hidden="true" className="text-[15px] font-semibold">X</span>
      </button>
      <button type="button" className={btn} onClick={() => handleShare("facebook")} aria-label="Share on Facebook">
        <Facebook className="h-4 w-4" aria-hidden="true" />
      </button>
      <button type="button" className={btn} onClick={() => handleShare("copy")} aria-label="Copy link">
        <Link2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
};

// Scroll to Top Button
const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      className="fixed bottom-8 right-8 z-50 grid h-11 w-11 place-items-center rounded-full border border-[#E3E6EC] bg-white text-[#0A0A0A] shadow-[0_12px_32px_-16px_rgba(10,10,10,.35)] hover:border-[#0B6B2E] hover:text-[#0B6B2E]"
    >
      <ChevronUp className="h-5 w-5" />
    </button>
  );
};

export default function CompactBlogPost({ post, onBack, categoryName, related = [], categories = [] }: CompactBlogPostProps) {
  const { user, isAuthenticated } = useAuth();

  // Check if user is admin
  const isAdmin = isAuthenticated && user && (user.role === "admin" || user.isAdmin);
  void isAdmin;

  // Apply custom CSS and JS with proper sanitization
  useEffect(() => {
    if (post.customCSS) {
      try {
        // Clean the CSS by removing any script tags and extracting only style content
        let cleanCSS = post.customCSS;

        // Remove script tags from CSS
        cleanCSS = cleanCSS.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");

        // Extract content between <style> tags if present, otherwise use as-is
        const styleMatch = cleanCSS.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
        if (styleMatch) {
          cleanCSS = styleMatch[1];
        }

        const style = document.createElement("style");
        style.type = "text/css";
        style.textContent = cleanCSS.trim();
        document.head.appendChild(style);

        return () => {
          if (document.head.contains(style)) {
            document.head.removeChild(style);
          }
        };
      } catch (error) {
        console.warn("Failed to apply custom CSS:", error);
      }
    }
  }, [post.customCSS]);

  useEffect(() => {
    if (post.customJS) {
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
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.textContent = cleanJS.trim();
        document.body.appendChild(script);

        return () => {
          if (document.body.contains(script)) {
            document.body.removeChild(script);
          }
        };
      } catch (error) {
        console.warn("Failed to apply custom JS:", error);
      }
    }
  }, [post.customJS]);

  const { html, headings } = useMemo(() => buildArticle(post.content), [post.content]);

  const category = categoryName || getCategoryName(post, categories);
  const meta = [category, `${getReadingTime(post)} min read`].filter(Boolean).join(" · ");
  const author = getAuthorName(post);
  const published = formatPostDate(post.publishedAt);
  const updated = formatPostDate(post.updatedAt);
  const tags = Array.isArray(post.tags) ? post.tags.filter(Boolean) : [];
  const keepReading = related.filter((p: any) => p && p.slug && p.slug !== post.slug).slice(0, 3);

  return (
    <main className="bg-white">
      {/* Article header */}
      <div className="yp-wrap max-w-[860px] pt-10 sm:pt-16">
        <div className="mb-8 flex justify-center">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-[#3A4354] hover:text-[#0B6B2E]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            All insights
          </button>
        </div>
        <header className="flex flex-col items-center gap-5 text-center">
          <span className="yp-label !text-[#0B6B2E]">
            {post.isFeatured && <span className="mr-2 text-[#D71920]">Featured ·</span>}
            {meta}
          </span>
          <h1 className="m-0 text-[clamp(36px,5vw,58px)] font-bold leading-[1.05] tracking-[-0.045em] text-[#0A0A0A]">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="m-0 text-lg sm:text-xl leading-[1.55] text-[#4B5565]">{post.excerpt}</p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-[#5B6475]">
            {post.author?.profileImageUrl ? (
              <img
                src={post.author.profileImageUrl}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <span
                className="grid h-10 w-10 place-items-center rounded-full bg-[#F1F2F6] font-semibold text-[#0A0A0A]"
                aria-hidden="true"
              >
                {getInitials(author)}
              </span>
            )}
            <span>
              <strong className="font-semibold text-[#0A0A0A]">{author}</strong>
              {published && <> · <time dateTime={post.publishedAt}>{published}</time></>}
              {updated && updated !== published && <> · Updated <time dateTime={post.updatedAt}>{updated}</time></>}
            </span>
          </div>
        </header>
      </div>

      {(post.featuredImage || (post as any).featured_image) && (
        <div className="yp-wrap pt-10 sm:pt-12">
          <PostCover post={post} eager className="aspect-[16/10] sm:aspect-[21/9] rounded-[20px] sm:rounded-[28px]" />
        </div>
      )}

      {/* Body */}
      <div className="yp-wrap flex flex-wrap items-start justify-center gap-10 pb-20 pt-12 lg:gap-14 lg:pt-14">
        <aside className="w-full lg:sticky lg:top-24 lg:w-[240px] lg:flex-none" aria-label="Article navigation">
          <div className="hidden lg:block">
            <TableOfContents headings={headings} />
          </div>
          <div className={`flex items-center gap-3 px-3 ${headings.length ? "lg:mt-5 lg:border-t lg:border-[#EEF0F4] lg:pt-5" : ""}`}>
            <span className="yp-label lg:hidden">Share</span>
            <ShareButtons post={post} />
          </div>
        </aside>

        <article className="min-w-0 w-full max-w-[700px] lg:flex-1">
          <div
            className="blog-content yp-prose"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {tags.map((tag: string, index: number) => (
                <Link
                  key={index}
                  href={`/blogs?q=${encodeURIComponent(tag)}`}
                  className="rounded-full bg-[#F1F2F6] px-3 py-2 text-sm text-[#3A4354] hover:bg-[#E8F4EC] hover:text-[#05501F]"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </article>
      </div>

      {keepReading.length > 0 && (
        <section className="border-t border-[#E7E9EE] bg-[#F7F8FA]" aria-labelledby="keep-reading-heading">
          <div className="yp-wrap pb-20 pt-16">
            <h2 id="keep-reading-heading" className="m-0 mb-7 text-[30px] font-bold tracking-[-0.035em] text-[#0A0A0A]">
              Keep reading
            </h2>
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {keepReading.map((p: any) => (
                <BlogPostCard
                  key={p.id ?? p.slug}
                  post={p}
                  categoryName={getCategoryName(p, categories)}
                  showDate={false}
                  titleSize="text-xl"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </main>
  );
}
