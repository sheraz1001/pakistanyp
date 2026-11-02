import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ChevronRight, 
  ChevronDown, 
  Search, 
  Filter, 
  BarChart3, 
  TreePine,
  Grid3X3,
  List,
  Eye,
  Building2,
  Folder,
  FolderOpen,
  MapPin,
  X
} from 'lucide-react';
import { Link } from 'wouter';

interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  parentId?: number | null;
  level: number;
  business_count: number;
  businessCount?: number;
  description?: string;
  icon?: string;
  is_active: boolean;
  isActive?: boolean;
  children?: Category[];
}

type ViewMode = 'tree' | 'grid' | 'list' | 'stats';

export default function InteractiveCategoryHierarchy() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories/with-stats'],
  });

  // Build hierarchical structure
  const buildHierarchy = (categories: Category[]): Category[] => {
    if (!categories || categories.length === 0) return [];
    
    const categoryMap = new Map<number, Category>();
    const rootCategories: Category[] = [];

    // Normalize categories and initialize with children array
    categories.forEach(cat => {
      const normalizedCat = {
        ...cat,
        parentId: cat.parent_id || cat.parentId || null,
        businessCount: cat.business_count ?? cat.businessCount ?? 0,
        isActive: cat.is_active ?? cat.isActive ?? true,
        children: []
      };
      categoryMap.set(cat.id, normalizedCat);
    });

    // Build hierarchy
    categories.forEach(cat => {
      const category = categoryMap.get(cat.id)!;
      const parentId = cat.parent_id || cat.parentId;
      if (parentId === null || parentId === undefined) {
        rootCategories.push(category);
      } else {
        const parent = categoryMap.get(parentId);
        if (parent) {
          parent.children!.push(category);
        }
      }
    });

    return rootCategories;
  };

  const hierarchicalCategories = buildHierarchy(categories);

  // Generate search suggestions based on current search term
  const searchSuggestions = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    
    const allCategories = categories.filter(cat => 
      cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return allCategories
      .slice(0, 8) // Limit to 8 suggestions
      .map(cat => ({
        ...cat,
        highlightedName: cat.name.replace(
          new RegExp(`(${searchTerm})`, 'gi'),
          '<mark class="bg-[#E8F4EC] text-[#05501F]">$1</mark>'
        )
      }));
  }, [categories, searchTerm]);

  // Filter categories based on search and level
  const filterCategories = (categories: Category[], searchTerm: string, level: string): Category[] => {
    if (!searchTerm && level === 'all') return categories;
    
    return categories.filter(cat => {
      const matchesSearch = !searchTerm || cat.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLevel = level === 'all' || cat.level.toString() === level;
      
      // Also check children
      const hasMatchingChildren = cat.children && cat.children.some(child => 
        filterCategories([child], searchTerm, level).length > 0
      );
      
      return (matchesSearch && matchesLevel) || hasMatchingChildren;
    }).map(cat => ({
      ...cat,
      children: cat.children ? filterCategories(cat.children, searchTerm, level) : []
    }));
  };

  const filteredCategories = filterCategories(hierarchicalCategories, searchTerm, filterLevel);

  // Sort categories
  const sortCategories = (categories: Category[], sortBy: string): Category[] => {
    return [...categories].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'businessCount':
          return (b.businessCount || b.business_count || 0) - (a.businessCount || a.business_count || 0);
        case 'level':
          return a.level - b.level;
        default:
          return 0;
      }
    }).map(cat => ({
      ...cat,
      children: cat.children ? sortCategories(cat.children, sortBy) : []
    }));
  };

  const sortedCategories = sortCategories(filteredCategories, sortBy);

  const toggleExpanded = (categoryId: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedNodes(newExpanded);
  };

  const expandAll = () => {
    const allIds = new Set<number>();
    const collectIds = (categories: Category[]) => {
      categories.forEach(cat => {
        allIds.add(cat.id);
        if (cat.children) {
          collectIds(cat.children);
        }
      });
    };
    collectIds(hierarchicalCategories);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const handleSearchSelect = (category: Category) => {
    setSearchTerm(category.name);
    setSelectedCategory(category);
    setShowSearchDropdown(false);
    
    // Auto-expand to show selected category
    const pathToCategory = new Set<number>();
    const findPath = (cats: Category[], targetId: number, currentPath: number[] = []): boolean => {
      for (const cat of cats) {
        const newPath = [...currentPath, cat.id];
        if (cat.id === targetId) {
          newPath.forEach(id => pathToCategory.add(id));
          return true;
        }
        if (cat.children && findPath(cat.children, targetId, newPath)) {
          return true;
        }
      }
      return false;
    };
    
    findPath(hierarchicalCategories, category.id);
    setExpandedNodes(prev => new Set([...Array.from(prev), ...Array.from(pathToCategory)]));
  };

  const clearSearch = () => {
    setSearchTerm('');
    setShowSearchDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.search-container')) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Tree View Component
  const TreeNode: React.FC<{ category: Category; depth: number }> = ({ category, depth }) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedNodes.has(category.id);
    const indentStyle = { paddingLeft: `${depth * 20}px` };

    return (
      <div className="category-tree-node">
        <div 
          className={`flex items-center py-2 px-3 hover:bg-gray-50 cursor-pointer border-l-2 transition-colors ${
            selectedCategory?.id === category.id ? 'border-l-blue-500 bg-blue-50' : 'border-l-transparent'
          }`}
          style={indentStyle}
          onClick={() => setSelectedCategory(category)}
        >
          <div className="flex items-center gap-2 flex-1">
            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(category.id);
                }}
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            ) : (
              <div className="h-6 w-6 flex items-center justify-center">
                <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
              </div>
            )}
            
            {hasChildren ? (
              isExpanded ? <FolderOpen className="h-4 w-4 text-blue-500" /> : <Folder className="h-4 w-4 text-gray-500" />
            ) : (
              <Building2 className="h-4 w-4 text-green-500" />
            )}
            
            <span className="font-medium text-sm">{category.name}</span>
            
            <Badge variant="secondary" className="ml-auto">
              {category.businessCount || category.business_count || 0}
            </Badge>
            
            <Badge variant="outline" className="text-xs">
              L{category.level}
            </Badge>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="category-children">
            {category.children!.map(child => (
              <TreeNode key={child.id} category={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Grid View Component
  const GridView: React.FC<{ categories: Category[] }> = ({ categories }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map(category => (
        <Card key={category.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedCategory(category)}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              {category.children && category.children.length > 0 ? (
                <Folder className="h-4 w-4 text-blue-500" />
              ) : (
                <Building2 className="h-4 w-4 text-green-500" />
              )}
              {category.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <Badge variant="secondary">{category.businessCount || category.business_count || 0} businesses</Badge>
              <Badge variant="outline">Level {category.level}</Badge>
            </div>
            {category.children && category.children.length > 0 && (
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  {category.children.length} subcategories
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Statistics View Component
  const StatisticsView: React.FC<{ categories: Category[] }> = ({ categories }) => {
    const stats = {
      totalCategories: categories.length,
      totalBusinesses: categories.reduce((sum, cat) => sum + (cat.businessCount || cat.business_count || 0), 0),
      levelCounts: categories.reduce((acc, cat) => {
        acc[cat.level] = (acc[cat.level] || 0) + 1;
        return acc;
      }, {} as Record<number, number>),
      topCategories: [...categories]
        .sort((a, b) => (b.businessCount || b.business_count || 0) - (a.businessCount || a.business_count || 0))
        .slice(0, 10)
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.totalCategories}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Businesses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.totalBusinesses}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Category Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.levelCounts).map(([level, count]) => (
                  <div key={level} className="flex justify-between">
                    <span>Level {level}:</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Top Categories by Business Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topCategories.map((category, index) => (
                <div key={category.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <span className="font-medium">{category.name}</span>
                    <Badge variant="outline">L{category.level}</Badge>
                  </div>
                  <Badge variant="secondary">{category.businessCount || category.business_count || 0}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading category hierarchy...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Controls Panel */}
        <Card className="lg:w-80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="search-container">
              <label className="text-sm font-medium mb-2 block">Search Categories</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 z-10" />
                <Input
                  placeholder="Type to search categories..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSearchDropdown(e.target.value.length >= 2);
                  }}
                  onFocus={() => searchTerm.length >= 2 && setShowSearchDropdown(true)}
                  className="pl-9 pr-8"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-6 w-6 p-0 hover:bg-gray-100"
                    onClick={clearSearch}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
                
                {/* Search Dropdown */}
                {showSearchDropdown && searchSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
                    <div className="p-2 border-b border-gray-100">
                      <span className="text-xs text-gray-500">
                        {searchSuggestions.length} categories found
                      </span>
                    </div>
                    {searchSuggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0"
                        onClick={() => handleSearchSelect(suggestion)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {suggestion.children && suggestion.children.length > 0 ? (
                              <Folder className="h-4 w-4 text-blue-500" />
                            ) : (
                              <Building2 className="h-4 w-4 text-green-500" />
                            )}
                            <span 
                              className="font-medium text-sm"
                              dangerouslySetInnerHTML={{ __html: suggestion.highlightedName }}
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">L{suggestion.level}</Badge>
                            <Badge variant="secondary" className="text-xs">{suggestion.businessCount || suggestion.business_count || 0}</Badge>
                          </div>
                        </div>
                        {suggestion.description && (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {suggestion.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* No results message */}
                {showSearchDropdown && searchTerm.length >= 2 && searchSuggestions.length === 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4 text-center">
                    <p className="text-sm text-gray-500">
                      No categories found for "{searchTerm}"
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">View Mode</label>
              <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tree">
                    <div className="flex items-center gap-2">
                      <TreePine className="h-4 w-4" />
                      Tree View
                    </div>
                  </SelectItem>
                  <SelectItem value="grid">
                    <div className="flex items-center gap-2">
                      <Grid3X3 className="h-4 w-4" />
                      Grid View
                    </div>
                  </SelectItem>
                  <SelectItem value="list">
                    <div className="flex items-center gap-2">
                      <List className="h-4 w-4" />
                      List View
                    </div>
                  </SelectItem>
                  <SelectItem value="stats">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Statistics
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Filter by Level</label>
              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="1">Level 1 (Main)</SelectItem>
                  <SelectItem value="2">Level 2 (Sub)</SelectItem>
                  <SelectItem value="3">Level 3 (Sub-Sub)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="businessCount">Business Count</SelectItem>
                  <SelectItem value="level">Level</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {viewMode === 'tree' && (
              <div className="space-y-2">
                <Button variant="outline" size="sm" onClick={expandAll} className="w-full">
                  Expand All
                </Button>
                <Button variant="outline" size="sm" onClick={collapseAll} className="w-full">
                  Collapse All
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Main Content */}
        <div className="flex-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TreePine className="h-5 w-5" />
                Category Hierarchy ({sortedCategories.length} categories)
                {searchTerm && (
                  <Badge variant="outline" className="ml-2">
                    Filtering: "{searchTerm}"
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {viewMode === 'tree' && (
                <div className="border rounded-lg max-h-96 overflow-y-auto">
                  {sortedCategories.map(category => (
                    <TreeNode key={category.id} category={category} depth={0} />
                  ))}
                </div>
              )}
              
              {viewMode === 'grid' && (
                <GridView categories={sortedCategories} />
              )}
              
              {viewMode === 'list' && (
                <div className="space-y-2">
                  {sortedCategories.map(category => (
                    <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedCategory(category)}>
                      <div className="flex items-center gap-3">
                        {category.children && category.children.length > 0 ? (
                          <Folder className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Building2 className="h-4 w-4 text-green-500" />
                        )}
                        <span className="font-medium">{category.name}</span>
                        <Badge variant="outline">L{category.level}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{category.businessCount || 0}</Badge>
                        {category.children && category.children.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {category.children.length} sub
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {viewMode === 'stats' && (
                <StatisticsView categories={categories as Category[]} />
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Category Details Panel */}
        {selectedCategory && (
          <Card className="lg:w-80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Category Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedCategory.name}</h3>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">Level {selectedCategory.level}</Badge>
                  <Badge variant="secondary">{selectedCategory.businessCount || 0} businesses</Badge>
                </div>
              </div>
              
              {selectedCategory.description && (
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedCategory.description}
                  </p>
                </div>
              )}
              
              {selectedCategory.children && selectedCategory.children.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Subcategories ({selectedCategory.children.length})</label>
                  <div className="space-y-1 mt-2 max-h-32 overflow-y-auto">
                    {selectedCategory.children.map(child => (
                      <div key={child.id} className="text-sm p-2 bg-gray-50 rounded flex justify-between items-center">
                        <span>{child.name}</span>
                        <Badge variant="secondary" className="text-xs">{child.businessCount || 0}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t">
                <Link href={`/categories/${selectedCategory.slug}`}>
                  <Button className="w-full" size="sm">
                    <MapPin className="h-4 w-4 mr-2" />
                    View Category Page
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}