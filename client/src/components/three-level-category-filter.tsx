import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, X, ChevronRight, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { getCategoryIcon } from '@/lib/category-icons-clean';
import { tj } from "@/i18n-jsx/tj";

interface Category {
  id: number;
  name: string;
  slug: string;
  parentId?: number;
  level: number;
  subcategories?: Category[];
  subSubcategories?: Category[];
  businessCount?: number;
  subcategoryCount?: number;
}

interface ThreeLevelCategoryFilterProps {
  selectedCategories: number[];
  onCategoryChange: (categoryIds: number[]) => void;
  showCounts?: boolean;
  allowMultiple?: boolean;
  compact?: boolean;
}

export default function ThreeLevelCategoryFilter({
  selectedCategories,
  onCategoryChange,
  showCounts = true,
  allowMultiple = true,
  compact = false
}: ThreeLevelCategoryFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedMainCategories, setExpandedMainCategories] = useState<Set<number>>(new Set());
  const [expandedSubCategories, setExpandedSubCategories] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(!compact);

  // Fetch hierarchical categories
  const { data: hierarchicalCategories = [], isLoading } = useQuery({
    queryKey: ['/api/categories/hierarchical'],
  });

  // Fetch all categories for search
  const { data: allCategories = [] } = useQuery({
    queryKey: ['/api/categories/with-stats'],
  });

  // Filter categories based on search term
  const filteredCategories = searchTerm
    ? allCategories.filter((cat: Category) =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Get selected category objects for display
  const selectedCategoryObjects = selectedCategories.map(id => 
    allCategories.find((cat: Category) => cat.id === id)
  ).filter(Boolean);

  // Handle category selection
  const handleCategorySelect = (categoryId: number) => {
    if (selectedCategories.includes(categoryId)) {
      // Remove if already selected
      onCategoryChange(selectedCategories.filter(id => id !== categoryId));
    } else {
      // Add if not selected
      if (allowMultiple) {
        onCategoryChange([...selectedCategories, categoryId]);
      } else {
        onCategoryChange([categoryId]);
      }
    }
  };

  // Handle category removal
  const handleCategoryRemove = (categoryId: number) => {
    onCategoryChange(selectedCategories.filter(id => id !== categoryId));
  };

  // Toggle main category expansion
  const toggleMainCategoryExpansion = (categoryId: number) => {
    const newExpanded = new Set(expandedMainCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedMainCategories(newExpanded);
  };

  // Toggle sub category expansion
  const toggleSubCategoryExpansion = (categoryId: number) => {
    const newExpanded = new Set(expandedSubCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedSubCategories(newExpanded);
  };

  // Clear all filters
  const clearAllFilters = () => {
    onCategoryChange([]);
    setSearchTerm('');
  };

  // Get category path for breadcrumb
  const getCategoryPath = (categoryId: number) => {
    const category = allCategories.find((cat: Category) => cat.id === categoryId);
    if (!category) return [];
    
    const path = [category];
    let current = category;
    
    while (current.parentId) {
      const parent = allCategories.find((cat: Category) => cat.id === current.parentId);
      if (parent) {
        path.unshift(parent);
        current = parent;
      } else {
        break;
      }
    }
    
    return path;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Loading Filters...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={compact ? 'border-0 shadow-none' : ''}>
      <CardHeader className={compact ? 'p-0 pb-4' : ''}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Category Filters
            {selectedCategories.length > 0 && (
              <Badge variant="secondary" className="text-xs">{tj("{0} selected", selectedCategories.length)}</Badge>
            )}
          </CardTitle>
          {compact && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-8 w-8 p-0"
            >
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </CardHeader>
      
      {showFilters && (
        <CardContent className={compact ? 'p-0' : ''}>
          <div className="space-y-4">
            {/* Selected Categories Display */}
            {selectedCategories.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-gray-600">
                    Selected Categories
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="h-6 text-xs text-red-600 hover:text-red-700"
                  >
                    Clear All
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedCategoryObjects.map((category) => {
                    if (!category) return null;
                    const path = getCategoryPath(category.id);
                    return (
                      <Badge
                        key={category.id}
                        variant="secondary"
                        className="flex items-center gap-1 text-xs px-2 py-1"
                      >
                        <span className="truncate max-w-[120px]">
                          {path.length > 1 ? path[path.length - 1].name : category.name}
                        </span>
                        {showCounts && category.businessCount !== undefined && (
                          <span className="text-xs text-gray-500">
                            ({category.businessCount})
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-3 w-3 p-0 hover:bg-gray-200"
                          onClick={() => handleCategoryRemove(category.id)}
                        >
                          <X className="h-2 w-2" />
                        </Button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Search Interface */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-600">Search Categories</Label>
              <div className="relative">
                <Search className="absolute start-2 top-2.5 h-3 w-3 text-gray-400" />
                <Input
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="ps-7 h-8 text-sm"
                />
              </div>
              
              {searchTerm && (
                <div className="max-h-32 overflow-y-auto border rounded-md">
                  {filteredCategories.length > 0 ? (
                    <div className="p-1">
                      {filteredCategories.slice(0, 5).map((category: Category) => {
                        const path = getCategoryPath(category.id);
                        const isSelected = selectedCategories.includes(category.id);
                        
                        return (
                          <div
                            key={category.id}
                            className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50 text-sm ${
                              isSelected ? 'bg-blue-50 text-blue-700' : ''
                            }`}
                            onClick={() => handleCategorySelect(category.id)}
                          >
                            <Checkbox
                              checked={isSelected}
                              onChange={() => handleCategorySelect(category.id)}
                              className="h-3 w-3"
                            />
                            <div className="flex-1 truncate">
                              {path.map(cat => cat.name).join(' → ')}
                            </div>
                            {showCounts && category.businessCount !== undefined && (
                              <Badge variant="outline" className="text-xs">
                                {category.businessCount}
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-sm text-gray-500">
                      No categories found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Hierarchical Browse Interface */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-600">Browse Categories</Label>
              <div className="max-h-64 overflow-y-auto border rounded-md">
                <div className="p-1">
                  {hierarchicalCategories.map((mainCategory: Category) => {
                    const IconComponent = getCategoryIcon(mainCategory.name);
                    const isMainExpanded = expandedMainCategories.has(mainCategory.id);
                    const isMainSelected = selectedCategories.includes(mainCategory.id);
                    
                    return (
                      <div key={mainCategory.id} className="mb-1">
                        {/* Main Category */}
                        <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0"
                            onClick={() => toggleMainCategoryExpansion(mainCategory.id)}
                          >
                            {mainCategory.subcategories && mainCategory.subcategories.length > 0 ? (
                              isMainExpanded ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )
                            ) : (
                              <div className="h-3 w-3" />
                            )}
                          </Button>
                          <Checkbox
                            checked={isMainSelected}
                            onChange={() => handleCategorySelect(mainCategory.id)}
                            className="h-3 w-3"
                          />
                          <IconComponent className="h-3 w-3" />
                          <span className="text-sm flex-1 truncate">
                            {mainCategory.name}
                          </span>
                          {showCounts && mainCategory.businessCount !== undefined && (
                            <Badge variant="outline" className="text-xs">
                              {mainCategory.businessCount}
                            </Badge>
                          )}
                        </div>

                        {/* Sub Categories */}
                        {isMainExpanded && mainCategory.subcategories && (
                          <div className="ms-4 space-y-1">
                            {mainCategory.subcategories.map((subCategory: Category) => {
                              const isSubExpanded = expandedSubCategories.has(subCategory.id);
                              const isSubSelected = selectedCategories.includes(subCategory.id);
                              
                              return (
                                <div key={subCategory.id}>
                                  {/* Sub Category */}
                                  <div className="flex items-center gap-2 p-1 rounded hover:bg-gray-50">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-4 w-4 p-0"
                                      onClick={() => toggleSubCategoryExpansion(subCategory.id)}
                                    >
                                      {subCategory.subSubcategories && subCategory.subSubcategories.length > 0 ? (
                                        isSubExpanded ? (
                                          <ChevronDown className="h-3 w-3" />
                                        ) : (
                                          <ChevronRight className="h-3 w-3" />
                                        )
                                      ) : (
                                        <div className="h-3 w-3" />
                                      )}
                                    </Button>
                                    <Checkbox
                                      checked={isSubSelected}
                                      onChange={() => handleCategorySelect(subCategory.id)}
                                      className="h-3 w-3"
                                    />
                                    <span className="text-sm flex-1 truncate">
                                      {subCategory.name}
                                    </span>
                                    {showCounts && subCategory.businessCount !== undefined && (
                                      <Badge variant="outline" className="text-xs">
                                        {subCategory.businessCount}
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Sub-Sub Categories */}
                                  {isSubExpanded && subCategory.subSubcategories && (
                                    <div className="ms-4 space-y-1">
                                      {subCategory.subSubcategories.map((subSubCategory: Category) => {
                                        const isSubSubSelected = selectedCategories.includes(subSubCategory.id);
                                        
                                        return (
                                          <div key={subSubCategory.id} className="flex items-center gap-2 p-1 rounded hover:bg-gray-50">
                                            <div className="h-4 w-4" />
                                            <Checkbox
                                              checked={isSubSubSelected}
                                              onChange={() => handleCategorySelect(subSubCategory.id)}
                                              className="h-3 w-3"
                                            />
                                            <span className="text-sm flex-1 truncate">
                                              {subSubCategory.name}
                                            </span>
                                            {showCounts && subSubCategory.businessCount !== undefined && (
                                              <Badge variant="outline" className="text-xs">
                                                {subSubCategory.businessCount}
                                              </Badge>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}