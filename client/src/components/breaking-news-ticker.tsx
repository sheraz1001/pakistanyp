import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, TrendingUp, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  isBreaking: boolean;
  publishedAt: string;
}

export default function BreakingNewsTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: breakingNews = [] } = useQuery<NewsItem[]>({
    queryKey: ['/api/news/breaking'],
  });

  useEffect(() => {
    if (breakingNews.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % breakingNews.length);
      }, 5000); // Change every 5 seconds

      return () => clearInterval(interval);
    }
  }, [breakingNews.length]);

  if (!breakingNews.length) return null;

  const currentNews = breakingNews[currentIndex];

  return (
    <div className="bg-white text-[#0A0A0A] border-b border-[#E7E9EE] relative overflow-hidden">
      {/* Animated background pattern */}
      
      <div className="container mx-auto px-4 py-3 relative">
        <div className="flex items-center space-x-4">
          {/* Breaking News Badge */}
          <div className="flex items-center space-x-2 flex-shrink-0 bg-[#E3A82B] text-[#141414] px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span className="text-xs font-semibold uppercase tracking-[.06em]">Breaking</span>
            <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
          </div>

          {/* News Content */}
          <div className="flex-1 min-w-0">
            <div className="overflow-hidden relative">
              <div className="animate-marquee whitespace-nowrap">
                <a 
                  href={`/news/${currentNews.slug}`}
                  className="text-[15px] font-semibold text-[#0A0A0A] hover:text-[#0B6B2E] transition-colors duration-200 inline-flex items-center space-x-2"
                >
                  <span>{currentNews.title}</span>
                  <ChevronRight className="w-4 h-4 opacity-70" />
                </a>
              </div>
            </div>
          </div>

          {/* News Counter */}
          {breakingNews.length > 1 && (
            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className="flex space-x-1">
                {breakingNews.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentIndex 
                        ? 'bg-[#0B6B2E] w-5' 
                        : 'bg-[#DDE1E8] hover:bg-[#CFE8D8]'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-[#5B6475]">
                {currentIndex + 1}/{breakingNews.length}
              </span>
            </div>
          )}

          {/* Trending Icon */}
          <div className="flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-[#0B6B2E]" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Bottom border animation */}
    </div>
  );
}