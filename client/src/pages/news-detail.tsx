import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { 
  ArrowLeft, 
  Eye, 
  Share2, 
  Heart, 
  Star,
  Pin,
  AlertTriangle,
  TrendingUp,
  Newspaper
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Helmet } from "@/lib/helmet-compat";
import { country, localize } from "@shared/country";

interface NewsArticle {
  id: number;
  title: string;
  slug: string;
  summary?: string;
  content?: string;
  author?: string;
  source?: string;
  imageUrl?: string;
  categoryId?: number;
  category?: string;
  tags?: string[];
  publishedAt: string;
  viewCount: number;
  shareCount: number;
  likeCount: number;
  isFeatured: boolean;
  isPinned: boolean;
  priority: string;
}

interface NewsCategory {
  id: number;
  name: string;
  slug: string;
  color: string;
  description?: string;
}

export default function NewsDetail() {
  const params = useParams();
  const slug = params.slug;

  const { data: article, isLoading: articleLoading } = useQuery({
    queryKey: [`/api/news/slug/${slug}`],
    enabled: !!slug,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/news/categories'],
  });

  const { data: relatedArticles = [] } = useQuery({
    queryKey: ['/api/news'],
    select: (data) => {
      if (!article) return [];
      return data
        .filter((a: NewsArticle) => a.id !== article.id && a.categoryId === article.categoryId)
        .slice(0, 3);
    },
    enabled: !!article,
  });

  if (articleLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="yp-wrap max-w-[860px] py-16">
          <div className="animate-pulse flex flex-col items-center gap-5">
            <div className="h-3 w-40 rounded bg-[#EEF0F4]"></div>
            <div className="h-12 w-full rounded-xl bg-[#EEF0F4]"></div>
            <div className="h-12 w-2/3 rounded-xl bg-[#EEF0F4]"></div>
            <div className="h-5 w-3/4 rounded bg-[#F1F2F6]"></div>
          </div>
        </div>
        <div className="yp-wrap pb-16">
          <div className="aspect-[21/9] w-full animate-pulse rounded-[28px] bg-[#F1F2F6]"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#FAF8F3]">
        <Header />
        <div className="yp-wrap py-24 text-center">
          <div className="yp-label">{localize("PakistanYP News")}</div>
          <h2 className="yp-h2 mt-3 mb-3 text-[#0A0A0A]">Article Not Found</h2>
          <p className="text-[#5B6475] mb-6">The news article you're looking for doesn't exist or has been removed.</p>
          <Link href="/news" className="yp-btn yp-btn-primary">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to News
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const getCategoryColor = (categoryName: string) => {
    const category = categories.find((c: NewsCategory) => c.name === categoryName);
    return category?.color || '#1f2937';
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-[#D71920]" aria-label="Urgent" />;
      case 'high':
        return <TrendingUp className="w-4 h-4 text-[#D71920]" aria-label="High priority" />;
      case 'breaking':
        return <span className="yp-pill bg-[#E3A82B] text-[#141414]">Breaking</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{article.title} - Pakistani Business News | PakistanYP</title>
        <meta name="description" content={article.summary || `Read ${article.title} - Latest Pakistani business news and updates from PakistanYP`} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.summary || ''} />
        {article.imageUrl && <meta property="og:image" content={article.imageUrl} />}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://pakistanyp.com/news/${article.slug}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={article.summary || ''} />
        {article.imageUrl && <meta name="twitter:image" content={article.imageUrl} />}
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "headline": article.title,
            "description": article.summary,
            "author": {
              "@type": "Person",
              "name": article.author || "PakistanYP Editorial Team"
            },
            "publisher": {
              "@type": "Organization",
              "name": "PakistanYP",
              "logo": {
                "@type": "ImageObject",
                "url": `${country.origin}${country.logo.full}`
              }
            },
            "datePublished": article.publishedAt,
            "dateModified": (article as any).updatedAt || article.publishedAt,
            "image": article.imageUrl || "https://pakistanyp.com/og-homepage.jpg",
            "url": `https://pakistanyp.com/news/${article.slug}`,
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `https://pakistanyp.com/news/${article.slug}`
            }
          })}
        </script>
      </Helmet>

      <Header />

      <main>
        <div className="yp-wrap max-w-[860px] pt-10 sm:pt-14">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center justify-center gap-2 text-sm text-[#5B6475]">
            <Link href="/" className="text-[#5B6475] hover:text-[#0B6B2E]">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/news" className="text-[#5B6475] hover:text-[#0B6B2E]">News</Link>
            <span aria-hidden="true">/</span>
            <span className="line-clamp-1 max-w-[320px] text-[#0A0A0A]">{article.title}</span>
          </nav>

          <header className="flex flex-col items-center gap-5 text-center">
            <span className="flex flex-wrap items-center justify-center gap-2.5">
              {getPriorityIcon(article.priority)}
              <span className="yp-label !text-[#0B6B2E]" data-category-color={getCategoryColor(article.category || 'General')}>
                {article.category || 'General'}
              </span>
              {article.isFeatured && <Star className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" aria-label="Featured" />}
              {article.isPinned && <Pin className="w-4 h-4 text-[#0B6B2E]" aria-label="Pinned" />}
            </span>
            <h1 className="m-0 text-[clamp(36px,5vw,58px)] font-bold leading-[1.05] tracking-[-0.045em] text-[#0A0A0A]">
              {article.title}
            </h1>
            {article.summary && (
              <p className="m-0 text-lg sm:text-xl leading-[1.55] text-[#4B5565]">
                {article.summary}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-[#5B6475]">
              {article.author && (
                <span className="flex items-center gap-2.5">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#F1F2F6] font-semibold text-[#0A0A0A]" aria-hidden="true">
                    {article.author.split(/\s+/).slice(0, 2).map((w: string) => w.charAt(0).toUpperCase()).join("")}
                  </span>
                  <strong className="font-semibold text-[#0A0A0A]">{article.author}</strong>
                </span>
              )}
              <span>{formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}</span>
              <span className="flex items-center gap-1"><Eye className="w-4 h-4" aria-hidden="true" />{article.viewCount} views</span>
              <span className="flex items-center gap-1"><Heart className="w-4 h-4" aria-hidden="true" />{article.likeCount}</span>
              <span className="flex items-center gap-1"><Share2 className="w-4 h-4" aria-hidden="true" />{article.shareCount}</span>
            </div>
          </header>
        </div>

        {/* Featured Image */}
        {article.imageUrl && (
          <div className="yp-wrap pt-10 sm:pt-12">
            <div className="aspect-[16/10] overflow-hidden rounded-[20px] bg-[#F1F2F6] sm:aspect-[21/9] sm:rounded-[28px]">
              <img 
                src={article.imageUrl} 
                alt={article.title}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Article Content */}
        <div className="yp-wrap pt-12 pb-20 lg:pt-14">
          <article className="mx-auto max-w-[700px]">
            <div 
              className="yp-prose"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content || article.summary || '') }}
            />

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {article.tags.map((tag: string, index: number) => (
                  <span key={index} className="rounded-full bg-[#F1F2F6] px-3 py-2 text-sm text-[#3A4354]">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-10 border-t border-[#EEF0F4] pt-6">
              <Link href="/news" className="yp-btn yp-btn-ghost">
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                Back to News
              </Link>
            </div>
          </article>
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="border-t border-[#E7E9EE] bg-[#F7F8FA]" aria-labelledby="related-news-heading">
            <div className="yp-wrap pt-16 pb-20">
              <h2 id="related-news-heading" className="m-0 mb-7 text-[30px] font-bold tracking-[-0.035em] text-[#0A0A0A]">
                Related Articles
              </h2>
              <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
                {relatedArticles.map((relatedArticle: NewsArticle) => (
                  <Link
                    key={relatedArticle.id}
                    href={`/news/${relatedArticle.slug}`}
                    className="group flex flex-col gap-3 text-[#0A0A0A] hover:text-[#0A0A0A]"
                  >
                    {relatedArticle.imageUrl ? (
                      <div className="aspect-[16/10] overflow-hidden rounded-[20px] bg-[#F1F2F6]">
                        <img src={relatedArticle.imageUrl} alt={relatedArticle.title} loading="lazy" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="grid aspect-[16/10] place-items-center rounded-[20px] bg-[#E8F4EC] text-[#0B6B2E]" aria-hidden="true">
                        <Newspaper className="h-8 w-8" strokeWidth={1.75} />
                      </div>
                    )}
                    {relatedArticle.category && <span className="yp-label">{relatedArticle.category}</span>}
                    <span className="line-clamp-2 text-xl font-semibold leading-[1.3] tracking-[-0.02em] transition-colors group-hover:text-[#0B6B2E]">
                      {relatedArticle.title}
                    </span>
                    <span className="text-sm text-[#5B6475]">
                      {formatDistanceToNow(new Date(relatedArticle.publishedAt), { addSuffix: true })}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
