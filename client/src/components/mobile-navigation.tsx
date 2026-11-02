import React from 'react';
import { Link, useLocation } from 'wouter';
import { Home, Search, Grid3X3, MapPin, User, Building2, Brain, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { country } from "@shared/country";

const navigationItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Search, label: 'Search', href: '/search' },
  { icon: Grid3X3, label: 'Categories', href: '/categories' },
  { icon: MapPin, label: country.regionTerm.plural, href: country.regionsPath },
  { icon: Brain, label: 'AI', href: '/ai-recommendations', badge: true },
];

export function MobileNavigation() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden shadow-lg">
      <div className="grid grid-cols-5 h-16">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || 
            (item.href !== '/' && location.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center text-xs transition-colors relative",
                isActive 
                  ? "text-blue-600 bg-blue-50" 
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Icon className={cn("h-5 w-5 mb-1", isActive && "text-blue-600")} />
              {item.badge && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              )}
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
      
      {/* Add Business FAB for authenticated users */}
      {isAuthenticated && (
        <Link href="/pricing">
          <div className="absolute -top-8 right-4 bg-blue-600 text-white rounded-full p-3 shadow-lg">
            <Building2 className="h-6 w-6" />
          </div>
        </Link>
      )}
    </nav>
  );
}