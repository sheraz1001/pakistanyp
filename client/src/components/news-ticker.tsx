import { useQuery } from "@tanstack/react-query";
import { Newspaper, TrendingUp, Building } from "lucide-react";

interface NewsItem {
  id: number;
  title: string;
  category: string;
}

export default function NewsTickerComponent() {
  const { data: news = [] } = useQuery<NewsItem[]>({
    queryKey: ['/api/news', { limit: 5 }],
  });

  // Pakistani-specific placeholder headlines; other countries show only real news.
  const defaultNews: NewsItem[] = [];

  const newsItems = (news && news.length > 0) ? news.slice(0, 5) : defaultNews;

  const getIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'business':
        return <Building className="w-4 h-4 mr-2" />;
      case 'economy':
        return <TrendingUp className="w-4 h-4 mr-2" />;
      default:
        return <Newspaper className="w-4 h-4 mr-2" />;
    }
  };

  return (
    <div className="bg-white text-[#0A0A0A] py-3 overflow-hidden border-y border-[#E7E9EE]">
      <div className="container mx-auto px-4">
        <div className="flex items-center">
          <div className="yp-pill mr-6 flex-shrink-0 bg-[#E3A82B] text-[#141414]">
            🔥 BREAKING NEWS
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="news-ticker whitespace-nowrap">
              <div className="inline-flex items-center space-x-12 animate-scroll">
                {newsItems.map((item, index) => (
                  <span key={`${item.id}-${index}`} className="inline-flex items-center px-6 text-[#0B6B2E] py-1 mx-2">
                    {getIcon(item.category)}
                    <span className="text-sm font-medium text-[#0A0A0A]">{item.title}</span>
                  </span>
                ))}
                {/* Duplicate items for seamless loop */}
                {newsItems.map((item, index) => (
                  <span key={`duplicate-${item.id}-${index}`} className="inline-flex items-center px-6 text-[#0B6B2E] py-1 mx-2">
                    {getIcon(item.category)}
                    <span className="text-sm font-medium text-[#0A0A0A]">{item.title}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
