import React, { useState, useEffect } from 'react';
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

export default function BusinessNewsTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch latest business news
  const { data: news = [], isLoading } = useQuery({
    queryKey: ['/api/news/ticker'],
    select: (data: NewsItem[]) => data.slice(0, 8), // Show only latest 8 news items
  });

  // Auto-rotate news items every 5 seconds
  useEffect(() => {
    if (news.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % news.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [news.length]);

  const label = (
    <span className="yp-pill flex-shrink-0 bg-[#E3A82B] text-[#141414]">News</span>
  );

  if (isLoading || news.length === 0) {
    return (
      <div className="home-news-ticker border-b border-[#EEECE6] bg-white">
        <div className="yp-wrap flex min-h-[52px] items-center gap-3">
          {label}
          <span className="text-sm text-[#5B6475]">{isLoading ? "Loading business news..." : "Business news updates will appear here."}</span>
        </div>
      </div>
    );
  }

  const currentNews = news[currentIndex % news.length];

  return (
    <div className="home-news-ticker border-b border-[#EEECE6] bg-white">
      <div className="yp-wrap flex min-h-[52px] items-center gap-3 py-2">
        {label}

        <div className="min-w-0 flex-1" aria-live="polite">
          <a
            href={currentNews.slug ? `/news/${currentNews.slug}` : '/news'}
            className="block truncate text-sm font-medium text-[#0A0A0A] hover:text-[#0B6B2E] md:text-[15px]"
          >
            {currentNews.title}
          </a>
        </div>

        <div className="flex flex-shrink-0 items-center gap-4">
          <span className="hidden font-mono text-xs uppercase tracking-[.06em] text-[#5B6475] md:inline">
            {new Date(currentNews.publishedAt).toLocaleDateString()}
            {currentNews.category && <> · {currentNews.category}</>}
          </span>

          <a
            href="/news"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#0B6B2E] hover:text-[#05501F]"
          >
            <span className="hidden sm:inline">View all</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>

          <div className="hidden gap-1 sm:flex">
            {news.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all duration-200 ${
                  index === currentIndex
                    ? 'w-5 bg-[#0B6B2E]'
                    : 'w-2 bg-[#DDE1E8] hover:bg-[#CFE8D8]'
                }`}
                aria-label={`Show news item ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
