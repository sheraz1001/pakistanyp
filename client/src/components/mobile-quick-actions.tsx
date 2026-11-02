import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, 
  Plus, 
  MapPin, 
  Grid3X3, 
  Brain, 
  Newspaper, 
  Phone,
  Mail
} from 'lucide-react';
import { useLocation } from 'wouter';

interface QuickAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  color: string;
  description: string;
}

const quickActions: QuickAction[] = [
  {
    icon: Search,
    label: 'Search',
    href: '/search',
    color: 'bg-blue-500',
    description: 'Find businesses'
  },
  {
    icon: Plus,
    label: 'Add Business',
    href: '/pricing',
    color: 'bg-green-500',
    description: 'List your business'
  },
  {
    icon: Brain,
    label: 'AI Recommendations',
    href: '/ai-recommendations',
    color: 'bg-purple-500',
    description: 'Smart suggestions'
  },
  {
    icon: Grid3X3,
    label: 'Categories',
    href: '/categories',
    color: 'bg-[#B45309]',
    description: 'Browse categories'
  },
  {
    icon: MapPin,
    label: 'Provinces',
    href: '/provinces',
    color: 'bg-red-500',
    description: 'By location'
  },
  {
    icon: Newspaper,
    label: 'News',
    href: '/news',
    color: 'bg-indigo-500',
    description: 'Business news'
  },
  {
    icon: Phone,
    label: 'Contact',
    href: '/contact-us',
    color: 'bg-teal-500',
    description: 'Get in touch'
  },
  {
    icon: Mail,
    label: 'Help',
    href: '/help-center',
    color: 'bg-pink-500',
    description: 'Support center'
  }
];

export function MobileQuickActions() {
  const [, navigate] = useLocation();

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.href}
                variant="ghost"
                onClick={() => navigate(action.href)}
                className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-gray-50"
              >
                <div className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs text-gray-700 text-center leading-tight">
                  {action.label}
                </span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}