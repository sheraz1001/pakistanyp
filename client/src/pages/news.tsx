import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";
import BreakingNewsTicker from "@/components/breaking-news-ticker";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Calendar, 
  Eye, 
  Share2, 
  Heart, 
  TrendingUp, 
  Clock,
  Newspaper,
  Filter,
  Star,
  Pin,
  AlertTriangle,
  BookmarkPlus,
  MessageCircle,
  Play,
  Flame,
  Zap,
  Globe,
  Building2,
  DollarSign,
  Smartphone,
  Users,
  ArrowRight,
  ChevronDown,
  Grid3X3,
  List,
  Sparkles,
  Bell,
  RefreshCw,
  Plus,
  ChevronUp,
  ExternalLink,
  Download,
  Copy,
  User
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { SEO, SEOConfigs } from "@/components/seo";
import Breadcrumb from "@/components/breadcrumb";
import CoreWebVitals from "@/components/core-web-vitals";
import { useToast } from "@/hooks/use-toast";
import { localize } from "@shared/country";

interface NewsCategory {
  id: number;
  name: string;
  slug: string;
  color: string;
  description?: string;
}

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
  updatedAt?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  priority?: 'breaking' | 'high' | 'trending' | 'normal';
  isPinned?: boolean;
  isFeatured?: boolean;
  readTime?: number;
  status?: 'published' | 'draft' | 'archived';
}

export default function News() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoaded, setIsLoaded] = useState(false);
  const [bookmarkedArticles, setBookmarkedArticles] = useState<number[]>([]);
  const [likedArticles, setLikedArticles] = useState<number[]>([]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const { data: newsArticles = [] } = useQuery<NewsArticle[]>({
    queryKey: ["/api/news"],
  });

  const { data: categories = [] } = useQuery<NewsCategory[]>({
    queryKey: ["/api/news/categories"],
  });

  const breakingNews = newsArticles.filter(article => article.priority === 'breaking');
  const featuredNews = newsArticles.filter(article => article.isFeatured);
  const pinnedNews = newsArticles.filter(article => article.isPinned);

  // Topics from the real articles' tags (no invented counts)
  const trendingTopics = Object.entries(
    newsArticles.reduce<Record<string, number>>((acc, a) => {
      (Array.isArray(a.tags) ? a.tags : []).forEach((t) => { acc[t] = (acc[t] || 0) + 1; });
      return acc;
    }, {}),
  )
    .sort((x, y) => y[1] - x[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));

  const getFilteredArticles = () => {
    let filtered = newsArticles;
    
    switch (activeTab) {
      case 'featured':
        filtered = featuredNews;
        break;
      case 'pinned':
        filtered = pinnedNews;
        break;
      case 'breaking':
        filtered = breakingNews;
        break;
      case 'trending':
        filtered = newsArticles.filter(article => article.priority === 'trending');
        break;
      default:
        filtered = newsArticles;
    }

    if (searchQuery) {
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => 
        article.categoryId === parseInt(selectedCategory)
      );
    }

    return filtered;
  };

  const filteredArticles = getFilteredArticles();

  const tabs = [
    { value: "all", label: "All news" },
    { value: "featured", label: "Featured" },
    { value: "breaking", label: "Breaking" },
    { value: "trending", label: "Trending" },
    { value: "pinned", label: "Pinned" },
  ];

  const newsDate = (value?: string) => {
    if (!value) return "";
    const d = new Date(value);
    return isNaN(d.getTime()) ? "" : `${formatDistanceToNow(d)} ago`;
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <SEO {...SEOConfigs.news} />
      <CoreWebVitals />
      <Header />

      {/* Breaking News Ticker */}
      <BreakingNewsTicker />

      <main className="yp-wrap pt-10 pb-24 sm:pt-16">
        <Breadcrumb items={[
          { label: "Home", href: "/" },
          { label: "News", href: "/news" }
        ]} className="mb-8" />

        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[680px]">
            <div className="yp-label">{localize("PakistanYP News")}</div>
            <h1 className="mt-2.5 mb-0 text-[clamp(40px,5vw,64px)] font-bold leading-[1.02] tracking-[-0.045em] text-[#0A0A0A]">
              {localize("Pakistani News Hub")}
            </h1>
            <p className="yp-lead mt-4 mb-0">
              {localize("Pakistani business news, market insights and developments across all provinces and territories.")}
            </p>
          </div>
          <label className="flex min-h-[48px] w-full items-center gap-2.5 rounded-[14px] border border-[#DDE1E8] bg-white px-3.5 focus-within:border-[#0B6B2E] focus-within:outline focus-within:outline-[3px] focus-within:outline-[#BFE3CD] sm:w-[360px]">
            <Search className="h-[18px] w-[18px] flex-none text-[#5B6475]" aria-hidden="true" />
            <span className="sr-only">Search news</span>
            <input
              type="text"
              placeholder={localize("Search Pakistani business news, companies, sectors...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-0 bg-transparent text-[15px] text-[#0A0A0A] outline-none placeholder:text-[#8A92A3]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="grid h-8 w-8 flex-none place-items-center rounded-lg text-[#5B6475] hover:bg-[#F1F2F6] hover:text-[#0A0A0A]"
              >
                ×
              </button>
            )}
          </label>
        </div>

        <nav aria-label="News filters" className="mt-8 mb-10 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className="yp-chip min-h-[40px] px-4"
              data-active={activeTab === tab.value ? "true" : undefined}
              aria-pressed={activeTab === tab.value}
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* News Content */}
        {filteredArticles.length === 0 ? (
          <div className="yp-card px-6 py-16 text-center">
            <h2 className="yp-h3 mb-2 text-[#0A0A0A]">No news found</h2>
            <p className="text-[#5B6475]">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="grid gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map((article) => (
              <Link
                key={article.id}
                href={`/news/${article.slug}`}
                className="group flex flex-col gap-3.5 text-[#0A0A0A] hover:text-[#0A0A0A]"
              >
                {article.imageUrl ? (
                  <div className="aspect-[16/10] overflow-hidden rounded-[20px] bg-[#F1F2F6]">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="grid aspect-[16/10] place-items-center rounded-[20px] bg-[#E8F4EC] text-[#0B6B2E]" aria-hidden="true">
                    <Newspaper className="h-8 w-8" strokeWidth={1.75} />
                  </div>
                )}
                <span className="flex flex-wrap items-center gap-2">
                  {article.priority === 'breaking' && (
                    <span className="yp-pill bg-[#E3A82B] text-[#141414]">Breaking</span>
                  )}
                  <span className="yp-label">
                    {[article.category, article.readTime ? `${article.readTime} min read` : ""].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <h3 className="m-0 text-[22px] font-semibold leading-[1.3] tracking-[-0.025em] transition-colors group-hover:text-[#0B6B2E]">
                  {article.title}
                </h3>
                {article.summary && (
                  <p className="m-0 line-clamp-3 text-[15px] leading-relaxed text-[#4B5565]">{article.summary}</p>
                )}
                <span className="text-sm text-[#5B6475]">
                  {[article.author, newsDate(article.publishedAt), `${article.viewCount} views`].filter(Boolean).join(" · ")}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
