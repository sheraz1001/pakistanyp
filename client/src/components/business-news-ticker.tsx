import { dateLocale } from "@shared/i18n";
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';

interface NewsItem {
  id: number;
  title: string;
  summary?: string;
  publishedAt: string;
  slug: string;
  category?: string;
}

const fmt = (d: string) => {
  try { return new Date(d).toLocaleDateString(dateLocale('en-GB'), { day: 'numeric', month: 'short' }); } catch { return ''; }
};

/** Home page news ticker: latest headlines scroll continuously (pauses on hover/focus; static with reduced motion). */
export default function BusinessNewsTicker() {
  const { data: news = [], isLoading } = useQuery<NewsItem[]>({
    queryKey: ['/api/news/ticker'],
    select: (data: NewsItem[]) => (Array.isArray(data) ? data.slice(0, 10) : []),
  });

  const label = (
    <span className="relative flex flex-shrink-0 items-center gap-2 rounded-full bg-[#E3A82B] px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-[#141414]">
      <span className="relative flex h-2 w-2" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#B91C1C] opacity-60 motion-reduce:hidden" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#B91C1C]" />
      </span>
      Latest news
    </span>
  );

  if (isLoading || news.length === 0) {
    return (
      <div className="home-news-ticker border-b border-[#EEECE6] bg-white">
        <div className="yp-wrap flex min-h-[52px] items-center gap-3">
          {label}
          <span className="text-sm text-[#5B6475]">{isLoading ? 'Loading news…' : 'News from PakistanYP will appear here.'}</span>
        </div>
      </div>
    );
  }

  const renderItems = (copy: boolean) => news.map((item) => (
    <a
      key={`${copy ? 'b' : 'a'}-${item.id}`}
      tabIndex={copy ? -1 : undefined}
      href={item.slug ? `/news/${item.slug}` : '/news'}
      className="ticker-item inline-flex shrink-0 items-center gap-2.5 pe-10 text-sm text-[#0A0A0A] hover:text-[#0B6B2E] focus-visible:text-[#0B6B2E] md:text-[15px]"
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#0B6B2E]" aria-hidden="true" />
      {item.category && <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#5B6475]">{item.category}</span>}
      <span className="font-medium">{item.title}</span>
      <span className="text-xs text-[#8A93A3]">{fmt(item.publishedAt)}</span>
    </a>
  ));
  // Speed: ~ 6s per headline, so long lists don't race
  const duration = Math.max(24, news.length * 9);

  return (
    <div className="home-news-ticker border-b border-[#EEECE6] bg-white">
      <div className="yp-wrap flex min-h-[52px] items-center gap-4">
        {label}
        <div className="ticker-viewport relative min-w-0 flex-1 overflow-hidden" role="region" aria-label="Latest news headlines">
          <div className="ticker-track flex w-max" style={{ animationDuration: `${duration}s` }}>
            <div className="flex">{renderItems(false)}</div>
            <div className="flex" aria-hidden="true">{renderItems(true)}</div>
          </div>
          <span className="pointer-events-none absolute inset-y-0 start-0 w-6 bg-gradient-to-r from-white to-transparent" aria-hidden="true" />
          <span className="pointer-events-none absolute inset-y-0 end-0 w-10 bg-gradient-to-l from-white to-transparent" aria-hidden="true" />
        </div>
        <a href="/news" className="inline-flex flex-shrink-0 items-center gap-1 text-sm font-semibold text-[#0B6B2E] hover:text-[#05501F]">
          <span className="hidden sm:inline">All news</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
