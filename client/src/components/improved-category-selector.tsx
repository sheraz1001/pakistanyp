import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, X, Search, Crown, ChevronRight, ChevronDown } from "lucide-react";
import { getCategoryIcon } from "@/lib/category-icons-clean";
import { tj } from "@/i18n-jsx/tj";

interface Category {
  id: number;
  name: string;
  parentId: number | null;
  businessCount?: number;
}

interface CategoryHierarchy {
  main: Category;
  subcategories: {
    category: Category;
    specialized: Category[];
  }[];
}

interface ImprovedCategorySelectorProps {
  selectedCategories: number[];
  onCategoryChange: (categories: number[]) => void;
  isPremium?: boolean;
}

export function ImprovedCategorySelector({ 
  selectedCategories, 
  onCategoryChange, 
  isPremium = false 
}: ImprovedCategorySelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("GET", "/api/categories"),
  });

  // Build category hierarchy
  const buildCategoryHierarchy = (): CategoryHierarchy[] => {
    const mainCategories = categories.filter((cat: Category) => cat.parentId === null);
    
    return mainCategories.map((main: Category) => {
      const subcategories = categories.filter((cat: Category) => cat.parentId === main.id);
      
      return {
        main,
        subcategories: subcategories.map((sub: Category) => ({
          category: sub,
          specialized: categories.filter((cat: Category) => cat.parentId === sub.id)
        }))
      };
    });
  };

  const categoryHierarchy = buildCategoryHierarchy();

  // Filter categories based on search
  const filteredHierarchy = categoryHierarchy.filter(({ main, subcategories }) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Check if main category matches
    if (main.name.toLowerCase().includes(searchLower)) return true;
    
    // Check if any subcategory matches
    const hasMatchingSubcategory = subcategories.some(({ category, specialized }) => {
      if (category.name.toLowerCase().includes(searchLower)) return true;
      
      // Check if any specialized category matches
      return specialized.some(spec => spec.name.toLowerCase().includes(searchLower));
    });
    
    return hasMatchingSubcategory;
  });

  // Category limits for free users
  const mainCategoriesCount = selectedCategories.filter(id => {
    const cat = categories.find((c: Category) => c.id === id);
    return cat?.parentId === null;
  }).length;

  const subCategoriesCount = selectedCategories.filter(id => {
    const cat = categories.find((c: Category) => c.id === id);
    return cat?.parentId !== null && categories.find((c: Category) => c.id === cat.parentId)?.parentId === null;
  }).length;

  const canAddMain = isPremium || mainCategoriesCount < 1;
  const canAddSub = isPremium || subCategoriesCount < 3;

  const handleCategorySelect = (categoryId: number) => {
    const category = categories.find((c: Category) => c.id === categoryId);
    if (!category) return;

    const isSelected = selectedCategories.includes(categoryId);
    
    if (isSelected) {
      // Remove category
      onCategoryChange(selectedCategories.filter(id => id !== categoryId));
    } else {
      // Check limits
      const isMainCategory = category.parentId === null;
      const isSubCategory = category.parentId !== null && categories.find((c: Category) => c.id === category.parentId)?.parentId === null;
      
      if (isMainCategory && !canAddMain) return;
      if (isSubCategory && !canAddSub) return;
      
      // Add category
      onCategoryChange([...selectedCategories, categoryId]);
    }
  };

  const toggleExpanded = (categoryId: number) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const getSelectedCategoryDetails = () => {
    return selectedCategories.map(id => 
      categories.find((cat: Category) => cat.id === id)
    ).filter(Boolean);
  };

  const isExpanded = (categoryId: number) => expandedCategories.includes(categoryId);

  return (
    <div className="space-y-4">
      {/* Selected Categories Display */}
      {selectedCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Selected Categories
              <Badge variant="secondary">{selectedCategories.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {getSelectedCategoryDetails().map((category) => {
                if (!category) return null;
                const IconComponent = getCategoryIcon(category.name);
                const isMain = category.parentId === null;
                const isSub = category.parentId !== null && categories.find((c: Category) => c.id === category.parentId)?.parentId === null;
                
                return (
                  <Badge
                    key={category.id}
                    variant={isMain ? "default" : isSub ? "secondary" : "outline"}
                    className="flex items-center gap-2 px-3 py-1"
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{category.name}</span>
                    <button
                      onClick={() => handleCategorySelect(category.id)}
                      className="ms-1 hover:bg-white/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Limits for Free Users */}
      {!isPremium && (
        <Card className="border-[#F5DDB0] bg-[#FFF4E0]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5 text-[#B45309]" />
              <h3 className="font-semibold text-[#B45309]">Free Plan Limits</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Main Categories:</span>
                <span className={mainCategoriesCount >= 1 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                  {mainCategoriesCount}/1
                </span>
              </div>
              <div className="flex justify-between">
                <span>Sub Categories:</span>
                <span className={subCategoriesCount >= 3 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                  {subCategoriesCount}/3
                </span>
              </div>
              <div className="flex justify-between">
                <span>Specialized Categories:</span>
                <span className="text-green-600">Unlimited</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#F5DDB0]">
              <Button size="sm" variant="outline" className="w-full text-[#B45309] border-[#F5DDB0] hover:bg-[#FFF4E0]">
                <Crown className="w-4 h-4 me-2" />
                Upgrade for Unlimited Categories
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Browse Categories</CardTitle>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ps-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredHierarchy.map(({ main, subcategories }) => {
              const isMainSelected = selectedCategories.includes(main.id);
              const isMainExpanded = isExpanded(main.id);
              const MainIconComponent = getCategoryIcon(main.name);
              const canSelectMain = isPremium || canAddMain || isMainSelected;
              
              return (
                <div key={main.id} className="border rounded-lg">
                  {/* Main Category */}
                  <div className="flex items-center p-3 hover:bg-gray-50">
                    <button
                      onClick={() => toggleExpanded(main.id)}
                      className="me-2 p-1 hover:bg-gray-200 rounded"
                    >
                      {isMainExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => canSelectMain && handleCategorySelect(main.id)}
                      className={`flex items-center gap-3 flex-1 text-start p-2 rounded-lg transition-all ${
                        isMainSelected 
                          ? 'bg-blue-100 border-2 border-blue-300' 
                          : canSelectMain 
                            ? 'hover:bg-blue-50 border-2 border-transparent' 
                            : 'opacity-50 cursor-not-allowed'
                      }`}
                      disabled={!canSelectMain}
                    >
                      <MainIconComponent className="w-5 h-5 text-blue-600" />
                      <div className="flex-1">
                        <div className="font-medium">{main.name}</div>
                        {main.businessCount && (
                          <div className="text-sm text-gray-500">{tj("{0} businesses", main.businessCount)}</div>
                        )}
                      </div>
                      {isMainSelected && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <X className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Subcategories */}
                  {isMainExpanded && (
                    <div className="border-t bg-gray-50">
                      {subcategories.map(({ category: sub, specialized }) => {
                        const isSubSelected = selectedCategories.includes(sub.id);
                        const isSubExpanded = isExpanded(sub.id);
                        const SubIconComponent = getCategoryIcon(sub.name);
                        const canSelectSub = isPremium || canAddSub || isSubSelected;
                        
                        return (
                          <div key={sub.id} className="ms-6 border-s-2 border-gray-200">
                            {/* Subcategory */}
                            <div className="flex items-center p-2 hover:bg-gray-100">
                              {specialized.length > 0 && (
                                <button
                                  onClick={() => toggleExpanded(sub.id)}
                                  className="me-2 p-1 hover:bg-gray-200 rounded"
                                >
                                  {isSubExpanded ? (
                                    <ChevronDown className="w-3 h-3" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                              
                              <button
                                onClick={() => canSelectSub && handleCategorySelect(sub.id)}
                                className={`flex items-center gap-3 flex-1 text-start p-2 rounded-lg transition-all ${
                                  isSubSelected 
                                    ? 'bg-green-100 border-2 border-green-300' 
                                    : canSelectSub 
                                      ? 'hover:bg-green-50 border-2 border-transparent' 
                                      : 'opacity-50 cursor-not-allowed'
                                }`}
                                disabled={!canSelectSub}
                              >
                                <SubIconComponent className="w-4 h-4 text-green-600" />
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{sub.name}</div>
                                  {sub.businessCount && (
                                    <div className="text-xs text-gray-500">{tj("{0} businesses", sub.businessCount)}</div>
                                  )}
                                </div>
                                {isSubSelected && (
                                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                    <X className="w-3 h-3 text-white" />
                                  </div>
                                )}
                              </button>
                            </div>

                            {/* Specialized Categories */}
                            {isSubExpanded && specialized.length > 0 && (
                              <div className="ms-6 border-s-2 border-gray-200">
                                {specialized.map((spec) => {
                                  const isSpecSelected = selectedCategories.includes(spec.id);
                                  const SpecIconComponent = getCategoryIcon(spec.name);
                                  
                                  return (
                                    <button
                                      key={spec.id}
                                      onClick={() => handleCategorySelect(spec.id)}
                                      className={`flex items-center gap-3 w-full text-start p-2 m-1 rounded-lg transition-all ${
                                        isSpecSelected 
                                          ? 'bg-purple-100 border-2 border-purple-300' 
                                          : 'hover:bg-purple-50 border-2 border-transparent'
                                      }`}
                                    >
                                      <SpecIconComponent className="w-4 h-4 text-purple-600" />
                                      <div className="flex-1">
                                        <div className="font-medium text-sm">{spec.name}</div>
                                        {spec.businessCount && (
                                          <div className="text-xs text-gray-500">{tj("{0} businesses", spec.businessCount)}</div>
                                        )}
                                      </div>
                                      {isSpecSelected && (
                                        <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                                          <X className="w-3 h-3 text-white" />
                                        </div>
                                      )}
                                    </button>
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
        </CardContent>
      </Card>
    </div>
  );
}

export default ImprovedCategorySelector;