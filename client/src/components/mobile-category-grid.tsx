import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Category } from '@shared/schema';
import { 
  Utensils, 
  ShoppingBag, 
  Car, 
  Heart, 
  GraduationCap, 
  Building,
  Wrench,
  Coffee,
  Home,
  Plane,
  Camera,
  Gamepad2
} from 'lucide-react';

const categoryIcons: { [key: string]: React.ComponentType<{ className?: string }> } = {
  'Restaurants & Food': Utensils,
  'Shopping & Retail': ShoppingBag,
  'Automotive': Car,
  'Healthcare': Heart,
  'Education': GraduationCap,
  'Real Estate': Building,
  'Professional Services': Wrench,
  'Entertainment': Coffee,
  'Home & Garden': Home,
  'Travel & Tourism': Plane,
  'Photography': Camera,
  'Sports & Recreation': Gamepad2,
};

interface MobileCategoryGridProps {
  limit?: number;
  onCategorySelect?: (category: Category) => void;
}

export function MobileCategoryGrid({ limit = 8, onCategorySelect }: MobileCategoryGridProps) {
  const [, navigate] = useLocation();
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  const displayCategories = categories.slice(0, limit);

  const handleCategoryClick = (category: Category) => {
    if (onCategorySelect) {
      onCategorySelect(category);
    } else {
      navigate(`/search?category=${category.id}`);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {displayCategories.map((category) => {
        const Icon = categoryIcons[category.name] || Building;
        
        return (
          <Card 
            key={category.id}
            className="cursor-pointer hover:shadow-md transition-shadow border-0 shadow-sm"
            onClick={() => handleCategoryClick(category)}
          >
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-medium text-sm text-gray-900 mb-1 leading-tight">
                  {category.name}
                </h3>
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                  {category.description}
                </p>
                <Badge variant="secondary" className="text-xs">
                  {category.businessCount || 0} businesses
                </Badge>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}