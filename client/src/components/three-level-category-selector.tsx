import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, X, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { getCategoryIcon } from '@/lib/category-icons-clean';

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

interface ThreeLevelCategorySelectorProps {
  selectedCategories: number[];
  onCategoryChange: (categoryIds: number[]) => void;
  maxCategories?: number;
  showCounts?: boolean;
  allowMultiple?: boolean;
  isPremium?: boolean;
}

export default function ThreeLevelCategorySelector({
  selectedCategories,
  onCategoryChange,
  maxCategories = 5,
  showCounts = true,
  allowMultiple = true,
  isPremium = false
}: ThreeLevelCategorySelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMainCategory, setSelectedMainCategory] = useState<number | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<number | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

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

  // Get main categories (level 1)
  const mainCategories = hierarchicalCategories.filter((cat: Category) => cat.level === 1);

  // Get subcategories for selected main category
  const subCategories = selectedMainCategory
    ? hierarchicalCategories.find((cat: Category) => cat.id === selectedMainCategory)?.subcategories || []
    : [];

  // Get sub-subcategories for selected subcategory
  const subSubCategories = selectedSubCategory
    ? subCategories.find((cat: Category) => cat.id === selectedSubCategory)?.subSubcategories || []
    : [];

  // Get selected category objects
  const selectedCategoryObjects = selectedCategories.map(id => 
    allCategories.find((cat: Category) => cat.id === id)
  ).filter(Boolean);

  // Handle category selection with level-based limits for free users
  const handleCategorySelect = (categoryId: number) => {
    if (selectedCategories.includes(categoryId)) {
      // Remove if already selected
      onCategoryChange(selectedCategories.filter(id => id !== categoryId));
    } else {
      // Add if not selected (check limits)
      if (allowMultiple) {
        // For free users, enforce level-based limits
        if (!isPremium) {
          const selectedCategoryObjs = selectedCategories.map(id => 
            allCategories.find((cat: Category) => cat.id === id)
          ).filter(Boolean);
          
          const newCategory = allCategories.find((cat: Category) => cat.id === categoryId);
          if (newCategory) {
            const mainCategories = selectedCategoryObjs.filter(cat => cat.level === 1);
            const subCategories = selectedCategoryObjs.filter(cat => cat.level === 2);
            
            // Check limits based on category level
            if (newCategory.level === 1 && mainCategories.length >= 1) {
              // Free users can only select 1 main category
              return;
            }
            if (newCategory.level === 2 && subCategories.length >= 3) {
              // Free users can only select 3 second level categories
              return;
            }
            // Level 3 categories are unlimited for free users
          }
        }
        
        if (selectedCategories.length < maxCategories) {
          onCategoryChange([...selectedCategories, categoryId]);
        }
      } else {
        onCategoryChange([categoryId]);
      }
    }
  };

  // Handle category removal
  const handleCategoryRemove = (categoryId: number) => {
    onCategoryChange(selectedCategories.filter(id => id !== categoryId));
  };

  // Toggle category expansion
  const toggleCategoryExpansion = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
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
          <CardTitle>Loading Categories...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate category limits for display
  const selectedCategoryObjs = selectedCategories.map(id => 
    allCategories.find((cat: Category) => cat.id === id)
  ).filter(Boolean);
  
  const mainCategoriesCount = selectedCategoryObjs.filter(cat => cat.level === 1).length;
  const subCategoriesCount = selectedCategoryObjs.filter(cat => cat.level === 2).length;
  const subSubCategoriesCount = selectedCategoryObjs.filter(cat => cat.level === 3).length;

  return (
    <div className="space-y-6">
      {/* Free User Limits Display */}
      {!isPremium && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-sm font-medium text-blue-800">Free Plan Category Limits</div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className={`${mainCategoriesCount >= 1 ? 'text-red-600' : 'text-green-600'}`}>
              Main: {mainCategoriesCount}/1
            </div>
            <div className={`${subCategoriesCount >= 3 ? 'text-red-600' : 'text-green-600'}`}>
              Second Level: {subCategoriesCount}/3
            </div>
            <div className="text-green-600">
              Third Level: {subSubCategoriesCount}/∞
            </div>
          </div>
        </div>
      )}

      {/* Dropdown Category Selection */}
      <div className="space-y-4">
        {/* Main Category Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Main Category
          </label>
          <Select value={selectedMainCategory?.toString() || ""} onValueChange={(value) => setSelectedMainCategory(value ? parseInt(value) : null)}>
            <SelectTrigger>
              <SelectValue placeholder="Select main category" />
            </SelectTrigger>
            <SelectContent>
              {mainCategories.map((category) => {
                const IconComponent = getCategoryIcon(category.name);
                return (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    <div className="flex items-center gap-2">
                      <IconComponent className="w-4 h-4" />
                      <span>{category.name}</span>
                      {showCounts && category.businessCount && (
                        <span className="text-sm text-gray-500">({category.businessCount})</span>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Sub Category Selection */}
        {selectedMainCategory && subCategories.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sub Category
            </label>
            <Select value={selectedSubCategory?.toString() || ""} onValueChange={(value) => setSelectedSubCategory(value ? parseInt(value) : null)}>
              <SelectTrigger>
                <SelectValue placeholder="Select sub category" />
              </SelectTrigger>
              <SelectContent>
                {subCategories.map((category) => {
                  const IconComponent = getCategoryIcon(category.name);
                  return (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4" />
                        <span>{category.name}</span>
                        {showCounts && category.businessCount && (
                          <span className="text-sm text-gray-500">({category.businessCount})</span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Sub-Sub Category Selection */}
        {selectedSubCategory && subSubCategories.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specialized Category
            </label>
            <Select value="" onValueChange={(value) => {
              if (value) {
                const categoryId = parseInt(value);
                if (!selectedCategories.includes(categoryId)) {
                  onCategoryChange([...selectedCategories, categoryId]);
                }
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select specialized category" />
              </SelectTrigger>
              <SelectContent>
                {subSubCategories.map((category) => {
                  const IconComponent = getCategoryIcon(category.name);
                  return (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4" />
                        <span>{category.name}</span>
                        {showCounts && category.businessCount && (
                          <span className="text-sm text-gray-500">({category.businessCount})</span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Add Category Buttons */}
        <div className="flex gap-2">
          {selectedMainCategory && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const canAdd = isPremium || mainCategoriesCount < 1;
                if (canAdd && !selectedCategories.includes(selectedMainCategory)) {
                  onCategoryChange([...selectedCategories, selectedMainCategory]);
                }
              }}
              disabled={!isPremium && mainCategoriesCount >= 1}
            >
              Add Main Category
            </Button>
          )}
          {selectedSubCategory && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const canAdd = isPremium || subCategoriesCount < 3;
                if (canAdd && !selectedCategories.includes(selectedSubCategory)) {
                  onCategoryChange([...selectedCategories, selectedSubCategory]);
                }
              }}
              disabled={!isPremium && subCategoriesCount >= 3}
            >
              Add Sub Category
            </Button>
          )}
        </div>
      </div>

      {/* Selected Categories Display */}
      {selectedCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Selected Categories ({selectedCategories.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedCategoryObjects.map((category) => {
                if (!category) return null;
                const path = getCategoryPath(category.id);
                return (
                  <Badge
                    key={category.id}
                    variant="secondary"
                    className="flex items-center gap-1 px-3 py-1"
                  >
                    <span className="text-sm">
                      {path.map(cat => cat.name).join(' → ')}
                    </span>
                    {showCounts && category.businessCount !== undefined && (
                      <span className="text-xs text-gray-500">
                        ({category.businessCount})
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-gray-200"
                      onClick={() => handleCategoryRemove(category.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Search Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {searchTerm && (
            <div className="mt-4 max-h-48 overflow-y-auto">
              {filteredCategories.length > 0 ? (
                <div className="space-y-2">
                  {filteredCategories.map((category: Category) => {
                    const path = getCategoryPath(category.id);
                    const isSelected = selectedCategories.includes(category.id);
                    
                    return (
                      <div
                        key={category.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-gray-50 ${
                          isSelected ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
                        }`}
                        onClick={() => handleCategorySelect(category.id)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">
                            {path.map(cat => cat.name).join(' → ')}
                          </div>
                          {showCounts && category.businessCount !== undefined && (
                            <Badge variant="outline" className="text-xs">
                              {category.businessCount} companies
                            </Badge>
                          )}
                        </div>
                        {isSelected && (
                          <Badge variant="default" className="text-xs">Selected</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No categories found matching "{searchTerm}"
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hierarchical Browse Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Browse Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Main Category Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Main Category
              </label>
              <Select
                value={selectedMainCategory?.toString() || ''}
                onValueChange={(value) => {
                  setSelectedMainCategory(value ? parseInt(value) : null);
                  setSelectedSubCategory(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select main category" />
                </SelectTrigger>
                <SelectContent>
                  {mainCategories.map((category: Category) => {
                    const IconComponent = getCategoryIcon(category.name);
                    return (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          <span>{category.name}</span>
                          {showCounts && category.subcategoryCount !== undefined && (
                            <Badge variant="outline" className="text-xs">
                              {category.subcategoryCount} subcategories
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Sub Category Selection */}
            {selectedMainCategory && subCategories.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Sub Category
                </label>
                <Select
                  value={selectedSubCategory?.toString() || ''}
                  onValueChange={(value) => {
                    setSelectedSubCategory(value ? parseInt(value) : null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sub category" />
                  </SelectTrigger>
                  <SelectContent>
                    {subCategories.map((category: Category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        <div className="flex items-center gap-2">
                          <ChevronRight className="h-4 w-4" />
                          <span>{category.name}</span>
                          {showCounts && category.businessCount !== undefined && (
                            <Badge variant="outline" className="text-xs">
                              {category.businessCount} companies
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Quick select buttons for subcategories */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {subCategories.map((category: Category) => {
                    const isSelected = selectedCategories.includes(category.id);
                    return (
                      <Button
                        key={category.id}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleCategorySelect(category.id)}
                        className="text-xs"
                      >
                        {category.name}
                        {showCounts && category.businessCount !== undefined && (
                          <span className="ml-1">({category.businessCount})</span>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sub-Sub Category Selection */}
            {selectedSubCategory && subSubCategories.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Sub-Sub Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {subSubCategories.map((category: Category) => {
                    const isSelected = selectedCategories.includes(category.id);
                    return (
                      <Button
                        key={category.id}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleCategorySelect(category.id)}
                        className="text-xs justify-start"
                      >
                        <div className="flex items-center gap-2">
                          <ChevronRight className="h-3 w-3" />
                          <span>{category.name}</span>
                          {showCounts && category.businessCount !== undefined && (
                            <Badge variant="outline" className="text-xs">
                              {category.businessCount}
                            </Badge>
                          )}
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Notice for Free Users */}
      {!isPremium && selectedCategories.length >= 3 && (
        <Card className="border-[#F5DDB0] bg-[#FFF4E0]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#B45309]">
                  Upgrade to Premium
                </p>
                <p className="text-xs text-[#B45309]">
                  Select unlimited categories and unlock advanced features
                </p>
              </div>
              <Button size="sm" variant="outline" className="text-[#B45309] border-[#F5DDB0]">
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}