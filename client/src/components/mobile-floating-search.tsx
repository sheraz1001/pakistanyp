import React, { useState } from 'react';
import { Search, X, Mic, Camera } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { localize } from "@shared/country";

interface MobileFloatingSearchProps {
  onSearch?: (query: string) => void;
  className?: string;
}

export function MobileFloatingSearch({ onSearch, className }: MobileFloatingSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [, navigate] = useLocation();

  const handleSearch = () => {
    if (query.trim()) {
      if (onSearch) {
        onSearch(query);
      } else {
        navigate(`/search?q=${encodeURIComponent(query)}`);
      }
      setIsExpanded(false);
      setQuery('');
    }
  };

  const handleVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        handleSearch();
      };
      
      recognition.start();
    }
  };

  if (isExpanded) {
    return (
      <div className={cn(
        "fixed inset-0 bg-white z-50 flex flex-col md:hidden",
        className
      )}>
        <div className="flex items-center p-4 border-b">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={localize("Search businesses, categories, provinces...")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-12"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              autoFocus
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleVoiceSearch}
                className="p-1 h-6 w-6"
              >
                <Mic className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="ml-2"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Popular searches:</p>
            <div className="flex flex-wrap gap-2">
              {['Restaurants', 'Hotels', 'Shopping', 'Healthcare', 'Education'].map((term) => (
                <Button
                  key={term}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery(term);
                    setTimeout(handleSearch, 100);
                  }}
                  className="text-xs"
                >
                  {term}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Button
      onClick={() => setIsExpanded(true)}
      className={cn(
        "fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-lg bg-blue-600 text-white md:hidden z-40",
        className
      )}
    >
      <Search className="h-6 w-6" />
    </Button>
  );
}