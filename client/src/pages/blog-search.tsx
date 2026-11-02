import Header from "@/components/header";
import Footer from "@/components/footer";
import { useState, useEffect } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, ArrowLeft } from "lucide-react";
import { BlogPostCard } from "@/components/compact-blog-post";
import SEO from "@/components/seo";
import { localize } from "@shared/country";

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
  readingTime?: number;
  viewCount?: number;
}

export default function BlogSearch() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BlogPost[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Get search query from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const query = urlParams.get('q') || '';
    setSearchQuery(query);
  }, [location]);

  // Fetch all blog posts for searching
  const { data: allPosts = [], isLoading } = useQuery({
    queryKey: ['/api/blog'],
    queryFn: async () => {
      const response = await fetch('/api/blog?limit=100');
      if (!response.ok) throw new Error('Failed to fetch blog posts');
      return response.json();
    }
  });

  // Perform search when query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    // Enhanced search function
    const results = allPosts.filter((post: BlogPost) => {
      const searchTerm = searchQuery.toLowerCase();
      
      // Search in title, excerpt, content, category, and tags
      const matchesTitle = post.title.toLowerCase().includes(searchTerm);
      const matchesExcerpt = post.excerpt?.toLowerCase().includes(searchTerm) || false;
      const matchesContent = post.content?.toLowerCase().includes(searchTerm) || false;
      const matchesCategory = post.category?.toLowerCase().includes(searchTerm) || false;
      const matchesTags = post.tags?.some(tag => tag.toLowerCase().includes(searchTerm)) || false;
      
      return matchesTitle || matchesExcerpt || matchesContent || matchesCategory || matchesTags;
    });

    setSearchResults(results);
    setIsSearching(false);
  }, [searchQuery, allPosts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Update URL with search query
    const newUrl = `/blog/search?q=${encodeURIComponent(searchQuery)}`;
    window.history.pushState(null, '', newUrl);
  };

  // Highlight search terms in text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <mark key={index} className="rounded bg-[#E8F4EC] px-0.5 text-[#05501F]">{part}</mark> : 
        part
    );
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <Header />
      <SEO 
        title={`Search Results: ${searchQuery} | PakistanYP Blog`}
        description={`Search results for "${searchQuery}" in PakistanYP Business Directory blog. Find insights, tips, and news about Pakistani business landscape.`}
        keywords={`${searchQuery}, Pakistan business blog, search results, PakistanYP`}
        canonical={`https://pakistanyp.com/blog/search?q=${encodeURIComponent(searchQuery)}`}
      />

      <main className="yp-wrap pt-10 pb-24 sm:pt-16">
        <Link href="/blog" className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-[#3A4354] hover:text-[#0B6B2E]">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Blog
        </Link>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[640px]">
            <div className="yp-label">{localize("PakistanYP Insights")}</div>
            <h1 className="mt-2.5 mb-0 text-[clamp(36px,5vw,56px)] font-bold leading-[1.04] tracking-[-0.045em] text-[#0A0A0A]">Blog Search</h1>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex w-full flex-wrap gap-2 sm:w-auto">
            <label className="flex min-h-[48px] flex-[1_1_260px] items-center gap-2.5 rounded-[14px] border border-[#DDE1E8] bg-white px-3.5 focus-within:border-[#0B6B2E] focus-within:outline focus-within:outline-[3px] focus-within:outline-[#BFE3CD] sm:w-[340px]">
              <Search className="h-[18px] w-[18px] flex-none text-[#5B6475]" aria-hidden="true" />
              <span className="sr-only">Search blog posts</span>
              <input
                type="text"
                placeholder="Search blog posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border-0 bg-transparent text-[15px] text-[#0A0A0A] outline-none placeholder:text-[#8A92A3]"
              />
            </label>
            <button type="submit" className="yp-btn yp-btn-primary min-h-[48px]">
              Search
            </button>
          </form>
        </div>

        {searchQuery && (
          <div className="mt-10 mb-8">
            <h2 className="m-0 text-xl font-semibold tracking-[-0.02em] text-[#0A0A0A]">
              Search Results for "{searchQuery}"
            </h2>
            <p className="mt-1 text-[#5B6475]">
              {isSearching ? 'Searching...' : `Found ${searchResults.length} ${searchResults.length === 1 ? 'result' : 'results'}`}
            </p>
          </div>
        )}
        {!searchQuery && <div className="h-10" />}

        {isLoading ? (
          <div className="grid gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex animate-pulse flex-col gap-3.5">
                <div className="aspect-[16/10] rounded-[20px] bg-[#F1F2F6]"></div>
                <div className="h-3 w-32 rounded bg-[#EEF0F4]"></div>
                <div className="h-6 w-full rounded bg-[#EEF0F4]"></div>
              </div>
            ))}
          </div>
        ) : searchResults.length === 0 && searchQuery ? (
          <div className="yp-card px-6 py-16 text-center">
            <Search className="w-12 h-12 text-[#C9CED8] mx-auto mb-4" aria-hidden="true" />
            <h3 className="yp-h3 mb-2 text-[#0A0A0A]">No results found</h3>
            <p className="text-[#5B6475] mb-6">
              Try adjusting your search terms or browse our categories
            </p>
            <Link href="/blog" className="yp-btn yp-btn-primary">
              Browse All Posts
            </Link>
          </div>
        ) : (
          <div className="grid gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {searchResults.map((post) => (
              <div key={post.id} className="flex flex-col gap-3">
                <BlogPostCard post={post} categoryName={post.category}>
                  {highlightText(post.title, searchQuery)}
                </BlogPostCard>
                {post.excerpt && (
                  <p className="m-0 line-clamp-3 text-[15px] leading-relaxed text-[#4B5565]">
                    {highlightText(post.excerpt, searchQuery)}
                  </p>
                )}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="yp-tag">
                        #{highlightText(tag, searchQuery)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
