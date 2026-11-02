import React, { useState, useMemo } from 'react';
import { Search, Grid, List, Heart, Star, ChevronDown, Zap, Square } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Comprehensive icon collection
const ICON_CATEGORIES = {
  // Business & Professional
  business: [
    'Building2', 'Briefcase', 'Handshake', 'TrendingUp', 'DollarSign', 'PieChart',
    'BarChart3', 'Presentation', 'Calculator', 'FileText', 'UserCheck', 'Target',
    'Award', 'Crown', 'Gem', 'Zap', 'Rocket', 'Globe', 'Shield', 'Lock'
  ],
  // Navigation & Location
  navigation: [
    'Home', 'MapPin', 'Navigation', 'Compass', 'Map', 'Route', 'Signpost',
    'ArrowRight', 'ArrowUp', 'ChevronRight', 'Menu', 'MoreHorizontal',
    'Grid3X3', 'List', 'Search', 'Filter', 'Eye', 'Bookmark'
  ],
  // Communication & Media
  communication: [
    'Mail', 'Phone', 'MessageCircle', 'Send', 'Share2', 'Megaphone',
    'Newspaper', 'Radio', 'Tv', 'Camera', 'Video', 'Mic', 'Speaker',
    'Headphones', 'Rss', 'Wifi', 'Bluetooth', 'Link'
  ],
  // Technology & Development
  technology: [
    'Monitor', 'Smartphone', 'Tablet', 'Cpu', 'HardDrive', 'Server',
    'Database', 'Code', 'Terminal', 'Bug', 'Settings', 'Wrench',
    'Cog', 'Gear', 'Plug', 'Battery', 'Power', 'Zap'
  ],
  // Pakistani & Regional
  pk: [
    'Landmark', 'Building', 'Mosque', 'Palm', 'Sun', 'Moon', 'Star',
    'Crown', 'Gem', 'Diamond', 'Coins', 'Banknote', 'Wallet',
    'CreditCard', 'ShoppingBag', 'Store', 'Truck', 'Plane'
  ],
  // Services & Industries
  services: [
    'Car', 'Truck', 'Bus', 'Plane', 'Ship', 'Train', 'Bike',
    'Hotel', 'Restaurant', 'Coffee', 'Utensils', 'ChefHat',
    'ShoppingCart', 'Store', 'Package', 'Gift', 'Heart',
    'Cross', 'Stethoscope', 'Pill', 'Activity', 'Dumbbell'
  ]
};

// Icon suggestions based on menu item content
const CONTEXTUAL_SUGGESTIONS = {
  'categories': ['Grid3X3', 'List', 'Folder', 'Tags'],
  'provinces': ['MapPin', 'Map', 'Landmark', 'Crown'],
  'localities': ['Navigation', 'MapPin', 'Compass', 'Route'],
  'news': ['Newspaper', 'Rss', 'Radio', 'Megaphone'],
  'blog': ['FileText', 'Edit', 'PenTool', 'BookOpen'],
  'ai': ['Zap', 'Brain', 'Cpu', 'Bot', 'Sparkles'],
  'business': ['Building2', 'Briefcase', 'TrendingUp', 'Target'],
  'services': ['Settings', 'Tool', 'Wrench', 'HelpCircle'],
  'contact': ['Phone', 'Mail', 'MessageCircle', 'Users'],
  'about': ['Info', 'User', 'Users', 'Heart']
};

interface AdaptiveIconPackProps {
  selectedIcon?: string;
  onIconSelect: (iconName: string) => void;
  menuItemTitle?: string;
  showSuggestions?: boolean;
}

export default function AdaptiveIconPack({
  selectedIcon,
  onIconSelect,
  menuItemTitle,
  showSuggestions = true
}: AdaptiveIconPackProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Get icon component by name from Lucide icons
  const getIconComponent = (iconName: string) => {
    try {
      // Dynamic import from lucide-react
      const iconModule = require('lucide-react');
      const IconComponent = iconModule[iconName];
      return IconComponent || Square;
    } catch (error) {
      // Fallback to Square icon if import fails
      return Square;
    }
  };

  // Get contextual suggestions
  const contextualSuggestions = useMemo(() => {
    if (!menuItemTitle) return [];
    
    const title = menuItemTitle.toLowerCase();
    const suggestions: string[] = [];
    
    Object.entries(CONTEXTUAL_SUGGESTIONS).forEach(([key, icons]) => {
      if (title.includes(key)) {
        suggestions.push(...icons);
      }
    });
    
    return Array.from(new Set(suggestions)); // Remove duplicates
  }, [menuItemTitle]);

  // Filter icons based on search and category
  const filteredIcons = useMemo(() => {
    let allIcons: string[] = [];
    
    if (selectedCategory === 'all') {
      allIcons = Object.values(ICON_CATEGORIES).flat();
    } else {
      allIcons = ICON_CATEGORIES[selectedCategory as keyof typeof ICON_CATEGORIES] || [];
    }
    
    if (searchTerm) {
      allIcons = allIcons.filter(icon => 
        icon.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return Array.from(new Set(allIcons)); // Remove duplicates
  }, [searchTerm, selectedCategory]);

  const IconPreview = ({ iconName, isSelected = false }: { iconName: string; isSelected?: boolean }) => {
    const IconComponent = getIconComponent(iconName);
    
    return (
      <div
        className={`
          relative cursor-pointer transition-all duration-200 rounded-lg border-2 p-3
          ${isSelected 
            ? 'border-blue-500 bg-blue-50 shadow-md scale-105' 
            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
          }
          ${viewMode === 'grid' ? 'aspect-square flex flex-col items-center justify-center' : 'flex items-center space-x-3 p-2'}
        `}
        onClick={() => onIconSelect(iconName)}
      >
        <div className={`${viewMode === 'grid' ? 'mb-2' : ''}`}>
          <IconComponent className="w-6 h-6 text-gray-700" />
        </div>
        <span className={`text-xs text-gray-600 ${viewMode === 'grid' ? 'text-center' : ''}`}>
          {iconName}
        </span>
        {isSelected && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
            <Star className="w-2 h-2 text-white fill-current" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search icons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="navigation">Navigation</SelectItem>
              <SelectItem value="communication">Communication</SelectItem>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="pk">Pakistani & Regional</SelectItem>
              <SelectItem value="services">Services</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Contextual Suggestions */}
      {showSuggestions && contextualSuggestions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
            <Star className="w-4 h-4 mr-2 fill-current" />
            Suggested Icons for "{menuItemTitle}"
          </h4>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {contextualSuggestions.slice(0, 8).map((iconName) => (
              <IconPreview
                key={iconName}
                iconName={iconName}
                isSelected={selectedIcon === iconName}
              />
            ))}
          </div>
        </div>
      )}

      {/* Selected Icon Display */}
      {selectedIcon && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-green-800 mb-2">Selected Icon</h4>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white border border-green-300 rounded-lg flex items-center justify-center">
              {React.createElement(getIconComponent(selectedIcon), { className: "w-6 h-6 text-green-600" })}
            </div>
            <div>
              <p className="font-medium text-green-800">{selectedIcon}</p>
              <p className="text-xs text-green-600">This icon will appear in your navigation menu</p>
            </div>
          </div>
        </div>
      )}

      {/* Icon Grid/List */}
      <div className="border border-gray-200 rounded-lg">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">
              Available Icons ({filteredIcons.length})
            </h3>
            <Badge variant="secondary">
              {selectedCategory === 'all' ? 'All Categories' : selectedCategory}
            </Badge>
          </div>
        </div>
        
        <ScrollArea className="h-96 p-4">
          <div className={`
            ${viewMode === 'grid' 
              ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3'
              : 'space-y-2'
            }
          `}>
            {filteredIcons.map((iconName) => (
              <IconPreview
                key={iconName}
                iconName={iconName}
                isSelected={selectedIcon === iconName}
              />
            ))}
          </div>
          
          {filteredIcons.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No icons found matching your search</p>
              <p className="text-sm">Try different keywords or browse categories</p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Icon Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-gray-800">{Object.values(ICON_CATEGORIES).flat().length}</div>
          <div className="text-xs text-gray-600">Total Icons</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-600">{Object.keys(ICON_CATEGORIES).length}</div>
          <div className="text-xs text-blue-600">Categories</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-600">{contextualSuggestions.length}</div>
          <div className="text-xs text-green-600">Suggestions</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-purple-600">4</div>
          <div className="text-xs text-purple-600">Icon Libraries</div>
        </div>
      </div>
    </div>
  );
}