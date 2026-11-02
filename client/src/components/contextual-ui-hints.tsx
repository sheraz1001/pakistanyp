import { useState, useEffect } from "react";
import { Lightbulb, X, ArrowRight, Search, Star, MapPin, Calendar, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { country, localize } from "@shared/country";

interface UIHint {
  id: string;
  trigger: string; // CSS selector or condition
  message: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  type: 'tip' | 'feature' | 'warning' | 'guide';
  delay?: number; // delay in ms before showing
  action?: {
    text: string;
    callback: () => void;
  };
}

interface ContextualUIHintsProps {
  currentPage: string;
  isFirstVisit?: boolean;
  userInteracted?: boolean;
}

const uiHints: Record<string, UIHint[]> = {
  homepage: [
    {
      id: 'search-hint',
      trigger: '#search-input',
      message: `Start typing to search for businesses, categories, or locations. Try 'restaurants in ${(country.regions.find((r) => r.capital) || country.regions[0]).name}' or 'accounting services'`,
      position: 'bottom',
      type: 'tip',
      delay: 3000
    },
    {
      id: 'categories-hint',
      trigger: '.featured-categories',
      message: "Browse popular business categories to discover services in your area",
      position: 'top',
      type: 'feature',
      delay: 8000
    },
    {
      id: 'weather-widget-hint',
      trigger: '.weather-widget',
      message: localize("Current Pakistani weather helps you find appropriate indoor/outdoor activities"),
      position: 'bottom',
      type: 'tip',
      delay: 12000
    }
  ],
  
  'business-detail': [
    {
      id: 'verified-badge-hint',
      trigger: '.verified-badge',
      message: "This green checkmark means the business information has been verified by our team",
      position: 'right',
      type: 'feature',
      delay: 2000
    },
    {
      id: 'contact-info-hint',
      trigger: '.contact-section',
      message: "Always call ahead to confirm hours and availability before visiting",
      position: 'left',
      type: 'tip',
      delay: 5000
    },
    {
      id: 'reviews-hint',
      trigger: '.reviews-section',
      message: "Read recent reviews to get insights from other customers' experiences",
      position: 'top',
      type: 'guide',
      delay: 8000
    }
  ],
  
  categories: [
    {
      id: 'subcategories-hint',
      trigger: '.category-card',
      message: "Click on any category to see subcategories and related businesses",
      position: 'bottom',
      type: 'guide',
      delay: 3000
    },
    {
      id: 'hierarchy-hint',
      trigger: '.category-hierarchy-link',
      message: "View the complete category structure to find exactly what you're looking for",
      position: 'right',
      type: 'feature',
      delay: 10000
    }
  ],
  
  provinces: [
    {
      id: 'provinces-selection-hint',
      trigger: '.province-card',
      message: localize("Each province has unique business landscapes and opportunities. Explore them all!"),
      position: 'bottom',
      type: 'tip',
      delay: 4000
    },
    {
      id: 'localities-hint',
      trigger: '.localities-tab',
      message: "Switch to localities view to find businesses in specific neighborhoods",
      position: 'top',
      type: 'feature',
      delay: 8000
    }
  ],
  
  blog: [
    {
      id: 'article-toc-hint',
      trigger: '.table-of-contents',
      message: "Use the table of contents to jump to specific sections of interest",
      position: 'left',
      type: 'feature',
      delay: 5000
    },
    {
      id: 'share-hint',
      trigger: '.share-buttons',
      message: "Found this article helpful? Share it with fellow entrepreneurs!",
      position: 'bottom',
      type: 'tip',
      delay: 15000
    }
  ],
  
  'karachi-business-faq': [
    {
      id: 'expandable-faq-hint',
      trigger: '.faq-item',
      message: "Click on any question to expand and read the detailed answer",
      position: 'right',
      type: 'guide',
      delay: 2000
    }
  ]
};

const ContextualUIHints = ({ 
  currentPage, 
  isFirstVisit = false, 
  userInteracted = false 
}: ContextualUIHintsProps) => {
  const [activeHints, setActiveHints] = useState<UIHint[]>([]);
  const [dismissedHints, setDismissedHints] = useState<Set<string>>(new Set());
  const [currentHintIndex, setCurrentHintIndex] = useState(0);

  // Load dismissed hints from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('dismissedUIHints');
    if (dismissed) {
      setDismissedHints(new Set(JSON.parse(dismissed)));
    }
  }, []);

  // Show hints for current page
  useEffect(() => {
    const pageHints = uiHints[currentPage] || [];
    
    // Filter out dismissed hints
    const availableHints = pageHints.filter(hint => !dismissedHints.has(hint.id));
    
    if (availableHints.length === 0) return;

    // Show hints one by one with delays
    const showHint = (hintIndex: number) => {
      if (hintIndex >= availableHints.length) return;
      
      const hint = availableHints[hintIndex];
      const element = document.querySelector(hint.trigger);
      
      if (element) {
        setTimeout(() => {
          setActiveHints(prev => [...prev, hint]);
          setCurrentHintIndex(hintIndex);
          
          // Auto-dismiss after 10 seconds and show next hint
          setTimeout(() => {
            setActiveHints(prev => prev.filter(h => h.id !== hint.id));
            showHint(hintIndex + 1);
          }, 10000);
        }, hint.delay || 0);
      } else {
        // If element not found, try next hint
        showHint(hintIndex + 1);
      }
    };

    // Start showing hints after page load
    const startTimer = setTimeout(() => {
      showHint(0);
    }, 1000);

    return () => clearTimeout(startTimer);
  }, [currentPage, dismissedHints]);

  const dismissHint = (hintId: string) => {
    setActiveHints(prev => prev.filter(hint => hint.id !== hintId));
    
    const newDismissed = new Set(dismissedHints);
    newDismissed.add(hintId);
    setDismissedHints(newDismissed);
    
    localStorage.setItem('dismissedUIHints', JSON.stringify(Array.from(newDismissed)));
  };

  const getHintIcon = (type: string) => {
    switch (type) {
      case 'tip': return Lightbulb;
      case 'feature': return Star;
      case 'warning': return X;
      case 'guide': return ArrowRight;
      default: return Lightbulb;
    }
  };

  const getHintColors = (type: string) => {
    switch (type) {
      case 'tip': return 'bg-white border-[#CFE8D8] text-[#0A0A0A]';
      case 'feature': return 'bg-white border-[#CFE8D8] text-[#0A0A0A]';
      case 'warning': return 'bg-white border-[#F5C2C4] text-[#0A0A0A]';
      case 'guide': return 'bg-[#F2F9F4] border-[#CFE8D8] text-[#0A0A0A]';
      default: return 'bg-white border-[#E7E9EE] text-[#0A0A0A]';
    }
  };

  const getHintPosition = (hint: UIHint, element: Element | null) => {
    if (!element) return {};
    
    const rect = element.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    
    switch (hint.position) {
      case 'top':
        return {
          top: rect.top + scrollY - 10,
          left: rect.left + scrollX + rect.width / 2,
          transform: 'translateX(-50%) translateY(-100%)'
        };
      case 'bottom':
        return {
          top: rect.bottom + scrollY + 10,
          left: rect.left + scrollX + rect.width / 2,
          transform: 'translateX(-50%)'
        };
      case 'left':
        return {
          top: rect.top + scrollY + rect.height / 2,
          left: rect.left + scrollX - 10,
          transform: 'translateX(-100%) translateY(-50%)'
        };
      case 'right':
        return {
          top: rect.top + scrollY + rect.height / 2,
          left: rect.right + scrollX + 10,
          transform: 'translateY(-50%)'
        };
      default:
        return {};
    }
  };

  return (
    <>
      {activeHints.map(hint => {
        const element = document.querySelector(hint.trigger);
        const HintIcon = getHintIcon(hint.type);
        const position = getHintPosition(hint, element);
        
        return (
          <div
            key={hint.id}
            className="fixed z-50 max-w-xs"
            style={position}
          >
            <Card className={`p-3 rounded-[14px] border shadow-[0_18px_40px_-28px_rgba(10,10,10,.4)] ${getHintColors(hint.type)}`}>
              <div className="flex items-start gap-2">
                <HintIcon className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#0B6B2E]" />
                <div className="flex-1">
                  <p className="text-sm leading-relaxed text-[#3A4354]">{hint.message}</p>
                  
                  {hint.action && (
                    <div className="mt-2">
                      <Button
                        size="sm"
                        onClick={hint.action.callback}
                        className="bg-[#0B6B2E] hover:bg-[#05501F] text-white h-8 min-h-0 text-xs"
                      >
                        {hint.action.text}
                      </Button>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissHint(hint.id)}
                  className="h-6 w-6 min-h-0 p-0 text-[#5B6475] hover:bg-[#F1F2F6] flex-shrink-0"
                  aria-label="Dismiss hint"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </Card>
            
            {/* Pointer/Arrow */}
            <div 
              className={`absolute w-0 h-0 ${
                hint.position === 'top' ? 'border-s-4 border-e-4 border-t-4 border-transparent border-t-current bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full' :
                hint.position === 'bottom' ? 'border-s-4 border-e-4 border-b-4 border-transparent border-b-current top-0 left-1/2 transform -translate-x-1/2 -translate-y-full' :
                hint.position === 'left' ? 'border-t-4 border-b-4 border-s-4 border-transparent border-s-current end-0 top-1/2 transform translate-x-full -translate-y-1/2' :
                'border-t-4 border-b-4 border-e-4 border-transparent border-e-current start-0 top-1/2 transform -translate-x-full -translate-y-1/2'
              }`}
              style={{ 
                color: hint.type === 'warning' ? '#F5C2C4' : '#CFE8D8' 
              }}
            />
          </div>
        );
      })}
    </>
  );
};

export default ContextualUIHints;