import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";

import { SEO, SEOConfigs } from "@/components/seo";
import Breadcrumb from "@/components/breadcrumb";
import { country, localize } from "@shared/country";
import CoreWebVitals from "@/components/core-web-vitals";
import { Search, ArrowLeft } from "lucide-react";
import CompactBlogPost, {
  BlogPostCard,
  PostCover,
  formatPostDate,
  getAuthorName,
  getCategoryName,
  getInitials,
  getReadingTime,
} from "@/components/compact-blog-post";
import NewsletterSubscription from "@/components/newsletter-subscription";

const PAGE_SIZE = 9;

export default function Blog() {
  const [, params] = useRoute("/blog/:slug?");
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  
  // Always call ALL hooks first, before any conditional logic or returns
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/blog/categories'],
    queryFn: async () => {
      const response = await fetch('/api/blog/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  const { data: blogPosts = [], isLoading } = useQuery({
    queryKey: ['/api/blog'],
    queryFn: async () => {
      const response = await fetch('/api/blog?limit=20');
      if (!response.ok) throw new Error('Failed to fetch blog posts');
      return response.json();
    }
  });

  const { data: blogPost, isLoading: postLoading } = useQuery({
    queryKey: ['/api/blog', params?.slug],
    queryFn: async () => {
      if (!params?.slug) return null;
      const response = await fetch(`/api/blog/${params.slug}`);
      if (!response.ok) throw new Error('Failed to fetch blog post');
      return response.json();
    },
    enabled: !!params?.slug,
  });

  // Filtering logic for blog posts
  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = !searchQuery || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || 
      post.categoryId === parseInt(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  // NOW handle conditional rendering after all hooks are called
  // Individual blog post view - STANDALONE COMPACT DESIGN
  if (params?.slug) {
    if (postLoading) {
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

    if (!blogPost) {
      return (
        <div className="min-h-screen bg-[#FAF8F3]">
          <Header />
          <div className="yp-wrap py-24 text-center">
            <div className="yp-label">{localize("PakistanYP Insights")}</div>
            <h1 className="yp-h2 mt-3 mb-6 text-[#0A0A0A]">Blog post not found</h1>
            <button type="button" onClick={() => navigate('/blog')} className="yp-btn yp-btn-primary">
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Back to Blog
            </button>
          </div>
          <Footer />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-white">
        <SEO 
          title={blogPost.metaTitle || `${blogPost.title} | PakistanYP Blog`}
          description={blogPost.metaDescription || blogPost.excerpt || `Read ${blogPost.title} on PakistanYP Business Directory blog. Insights, tips, and news about Pakistani business landscape.`}
          keywords={`${blogPost.title}, Pakistan business blog, ${blogPost.category || 'business insights'}, PakistanYP`}
          canonical={`https://pakistanyp.com/blog/${params.slug}`}
          ogTitle={blogPost.title}
          ogDescription={blogPost.excerpt}
          ogImage={blogPost.featuredImage || blogPost.featured_image || "/og-homepage.jpg"}
          ogType="article"
          structuredData={[{
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": blogPost.title,
            "description": blogPost.excerpt,
            "image": (() => {
              const img = blogPost.featuredImage || blogPost.featured_image;
              return img ? (/^https?:/.test(img) ? img : `https://pakistanyp.com${img.startsWith("/") ? "" : "/"}${img}`) : "https://pakistanyp.com/og-homepage.jpg";
            })(),
            "author": (() => {
              const name = [blogPost.author?.firstName, blogPost.author?.lastName].filter(Boolean).join(" ").trim();
              return name
                ? { "@type": "Person", "name": name }
                : { "@type": "Organization", "name": "PakistanYP Editorial", "url": "https://pakistanyp.com" };
            })(),
            "publisher": {
              "@type": "Organization",
              "name": "PakistanYP",
              "logo": {
                "@type": "ImageObject",
                "url": `${country.origin}${country.logo.full}`
              }
            },
            "datePublished": blogPost.publishedAt,
            "dateModified": blogPost.updatedAt || blogPost.publishedAt,
            "url": `https://pakistanyp.com/blog/${params.slug}`,
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `https://pakistanyp.com/blog/${params.slug}`
            }
          }]}
        />
        
        <Header />
        
        <CompactBlogPost
          post={blogPost}
          onBack={() => navigate('/blog')}
          categoryName={getCategoryName(blogPost, categories)}
          categories={categories}
          related={[
            ...blogPosts.filter((p: any) => p.slug !== blogPost.slug && blogPost.categoryId && p.categoryId === blogPost.categoryId),
            ...blogPosts.filter((p: any) => p.slug !== blogPost.slug && !(blogPost.categoryId && p.categoryId === blogPost.categoryId)),
          ].slice(0, 3)}
        />
        
        <Footer />
      </div>
    );
  }

  const isFiltering = !!searchQuery || selectedCategory !== "all";
  const featuredPost = !isFiltering && filteredPosts.length > 0
    ? (filteredPosts.find((p: any) => p.isFeatured) || filteredPosts[0])
    : null;
  const gridPosts = featuredPost ? filteredPosts.filter((p: any) => p !== featuredPost) : filteredPosts;
  const visiblePosts = gridPosts.slice(0, visibleCount);
  const activeCategories = (categories as any[]).filter((c: any) => c && c.isActive !== false);

  const selectCategory = (value: string) => {
    setSelectedCategory(value);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <SEO {...SEOConfigs.blog} />
      <CoreWebVitals />
      <Header />

      <main className="yp-wrap pt-10 pb-24 sm:pt-16">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Blog", href: "/blog" }
          ]}
          className="mb-8"
        />

        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[640px]">
            <div className="yp-label">{localize("PakistanYP Insights")}</div>
            <h1 className="mt-2.5 mb-0 text-[clamp(40px,5vw,64px)] font-bold leading-[1.02] tracking-[-0.045em] text-[#0A0A0A]">
              {localize("Pakistani business blog: guides, insights & news")}
            </h1>
          </div>
          <label className="flex min-h-[48px] w-full items-center gap-2.5 rounded-[14px] border border-[#DDE1E8] bg-white px-3.5 focus-within:border-[#0B6B2E] focus-within:outline focus-within:outline-[3px] focus-within:outline-[#BFE3CD] sm:w-[340px]">
            <Search className="h-[18px] w-[18px] flex-none text-[#5B6475]" aria-hidden="true" />
            <span className="sr-only">Search articles</span>
            <input
              type="text"
              placeholder="Search articles"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(PAGE_SIZE); }}
              className="w-full border-0 bg-transparent text-[15px] text-[#0A0A0A] outline-none placeholder:text-[#8A92A3]"
            />
          </label>
        </div>

        {activeCategories.length > 0 && (
          <nav aria-label="Blog categories" className="mt-8 mb-10 flex flex-wrap gap-2">
            <button
              type="button"
              className="yp-chip min-h-[40px] px-4"
              data-active={selectedCategory === "all" ? "true" : undefined}
              aria-pressed={selectedCategory === "all"}
              onClick={() => selectCategory("all")}
            >
              All
            </button>
            {activeCategories.map((cat: any) => {
              const value = String(cat.id);
              const active = selectedCategory === value;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className="yp-chip min-h-[40px] px-4"
                  data-active={active ? "true" : undefined}
                  aria-pressed={active}
                  onClick={() => selectCategory(value)}
                >
                  {cat.name}
                </button>
              );
            })}
          </nav>
        )}
        {activeCategories.length === 0 && <div className="h-10" />}

        {isLoading ? (
          <>
            <div className="grid animate-pulse gap-10 rounded-[28px] border border-[#E7E9EE] bg-white p-4 md:grid-cols-2">
              <div className="aspect-[4/3] rounded-[20px] bg-[#F1F2F6]"></div>
              <div className="flex flex-col justify-center gap-4 py-4">
                <div className="h-3 w-40 rounded bg-[#EEF0F4]"></div>
                <div className="h-9 w-full rounded-lg bg-[#EEF0F4]"></div>
                <div className="h-9 w-2/3 rounded-lg bg-[#EEF0F4]"></div>
                <div className="h-4 w-3/4 rounded bg-[#F1F2F6]"></div>
              </div>
            </div>
            <div className="mt-14 grid gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex animate-pulse flex-col gap-3.5">
                  <div className="aspect-[16/10] rounded-[20px] bg-[#F1F2F6]"></div>
                  <div className="h-3 w-32 rounded bg-[#EEF0F4]"></div>
                  <div className="h-6 w-full rounded bg-[#EEF0F4]"></div>
                  <div className="h-4 w-24 rounded bg-[#F1F2F6]"></div>
                </div>
              ))}
            </div>
          </>
        ) : filteredPosts.length === 0 ? (
          <div className="yp-card px-6 py-16 text-center">
            <h2 className="yp-h3 mb-2 text-[#0A0A0A]">No blog posts found</h2>
            <p className="text-[#5B6475]">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <>
            {featuredPost && (
              <Link
                href={`/blog/${featuredPost.slug}`}
                className="group grid items-center gap-6 rounded-[28px] border border-[#E7E9EE] bg-white p-4 text-[#0A0A0A] transition-colors hover:border-[#CFE8D8] hover:text-[#0A0A0A] md:grid-cols-2 md:gap-10"
              >
                <PostCover post={featuredPost} eager className="aspect-[4/3] rounded-[20px]" />
                <div className="flex flex-col gap-4 px-2 pb-4 md:py-4 md:pl-0 md:pr-6">
                  <span className="flex flex-wrap items-center gap-2.5">
                    <span className="yp-pill bg-[#E3A82B] text-[#141414]">{featuredPost.isFeatured ? "Featured" : "Latest"}</span>
                    <span className="yp-label">
                      {[getCategoryName(featuredPost, categories), `${getReadingTime(featuredPost)} min read`].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <h2 className="m-0 text-[clamp(28px,3vw,38px)] font-bold leading-[1.12] tracking-[-0.035em] transition-colors group-hover:text-[#0B6B2E]">
                    {featuredPost.title}
                  </h2>
                  {featuredPost.excerpt && (
                    <p className="m-0 line-clamp-3 text-[17px] leading-[1.6] text-[#4B5565]">{featuredPost.excerpt}</p>
                  )}
                  <span className="flex items-center gap-2.5 text-sm text-[#5B6475]">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-[#F1F2F6] text-xs font-semibold text-[#0A0A0A]" aria-hidden="true">
                      {getInitials(getAuthorName(featuredPost))}
                    </span>
                    {[getAuthorName(featuredPost), formatPostDate(featuredPost.publishedAt)].filter(Boolean).join(" · ")}
                  </span>
                </div>
              </Link>
            )}

            {visiblePosts.length > 0 && (
              <div className={`grid gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 ${featuredPost ? "mt-14" : ""}`}>
                {visiblePosts.map((post: any) => (
                  <BlogPostCard key={post.id} post={post} categoryName={getCategoryName(post, categories)} />
                ))}
              </div>
            )}

            {gridPosts.length > visibleCount && (
              <div className="mt-12 flex justify-center">
                <button
                  type="button"
                  className="yp-btn yp-btn-ghost min-h-[48px] px-7"
                  onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                >
                  Load more articles
                </button>
              </div>
            )}
          </>
        )}

        <NewsletterSubscription variant="inline" className="mt-24" />
      </main>
      <Footer />
    </div>
  );
}
