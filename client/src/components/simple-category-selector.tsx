import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { X, Search, ChevronRight, ChevronDown } from "lucide-react";
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

interface SimpleCategorySelectorProps {
  selectedCategories: number[];
  onCategoryChange: (categories: number[]) => void;
}

export function SimpleCategorySelector({ 
  selectedCategories, 
  onCategoryChange
}: SimpleCategorySelectorProps) {
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

  const handleCategorySelect = (categoryId: number) => {
    const isSelected = selectedCategories.includes(categoryId);
    
    if (isSelected) {
      // Remove category
      onCategoryChange(selectedCategories.filter(id => id !== categoryId));
    } else {
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
      {/* Selected Categories Bar */}
      {selectedCategories.length > 0 && (
        <div className="bg-gray-50 border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">{tj("Selected Categories ({0})", selectedCategories.length)}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCategoryChange([])}
              className="text-gray-500 hover:text-red-600"
            >
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {getSelectedCategoryDetails().map((category) => {
              if (!category) return null;
              const IconComponent = getCategoryIcon(category.name);
              
              return (
                <Badge
                  key={category.id}
                  variant="secondary"
                  className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200"
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{category.name}</span>
                  <button
                    onClick={() => handleCategorySelect(category.id)}
                    className="ms-1 hover:bg-blue-300 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="ps-10"
        />
      </div>

      {/* Category Tree */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Browse Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredHierarchy.map(({ main, subcategories }) => {
              const isMainSelected = selectedCategories.includes(main.id);
              const isMainExpanded = isExpanded(main.id);
              const MainIconComponent = getCategoryIcon(main.name);
              
              return (
                <div key={main.id} className="border rounded-lg overflow-hidden">
                  {/* Main Category */}
                  <div className="flex items-center p-3 hover:bg-gray-50 border-b">
                    <button
                      onClick={() => toggleExpanded(main.id)}
                      className="me-3 p-1 hover:bg-gray-200 rounded"
                    >
                      {isMainExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleCategorySelect(main.id)}
                      className={`flex items-center gap-3 flex-1 text-start p-2 rounded-lg transition-all ${
                        isMainSelected 
                          ? 'bg-blue-100 text-blue-800 font-medium' 
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <MainIconComponent className="w-5 h-5" />
                      <span className="font-medium">{main.name}</span>
                      {main.businessCount && (
                        <span className="text-sm text-gray-500 ms-auto">{tj("{0} businesses", main.businessCount)}</span>
                      )}
                    </button>
                  </div>

                  {/* Subcategories */}
                  {isMainExpanded && (
                    <div className="bg-gray-50">
                      {subcategories.map(({ category: sub, specialized }) => {
                        const isSubSelected = selectedCategories.includes(sub.id);
                        const isSubExpanded = isExpanded(sub.id);
                        const SubIconComponent = getCategoryIcon(sub.name);
                        
                        return (
                          <div key={sub.id} className="ms-6 border-s border-gray-200">
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
                                onClick={() => handleCategorySelect(sub.id)}
                                className={`flex items-center gap-3 flex-1 text-start p-2 rounded-lg transition-all ${
                                  isSubSelected 
                                    ? 'bg-green-100 text-green-800 font-medium' 
                                    : 'hover:bg-gray-100'
                                }`}
                              >
                                <SubIconComponent className="w-4 h-4" />
                                <span>{sub.name}</span>
                                {sub.businessCount && (
                                  <span className="text-xs text-gray-500 ms-auto">{tj("{0} businesses", sub.businessCount)}</span>
                                )}
                              </button>
                            </div>

                            {/* Specialized Categories */}
                            {isSubExpanded && specialized.length > 0 && (
                              <div className="ms-6 border-s border-gray-200">
                                {specialized.map((spec) => {
                                  const isSpecSelected = selectedCategories.includes(spec.id);
                                  const SpecIconComponent = getCategoryIcon(spec.name);
                                  
                                  return (
                                    <button
                                      key={spec.id}
                                      onClick={() => handleCategorySelect(spec.id)}
                                      className={`flex items-center gap-3 w-full text-start p-2 m-1 rounded-lg transition-all ${
                                        isSpecSelected 
                                          ? 'bg-[#FFF4E0] text-[#B45309] font-medium' 
                                          : 'hover:bg-gray-100'
                                      }`}
                                    >
                                      <SpecIconComponent className="w-4 h-4" />
                                      <span className="text-sm">{spec.name}</span>
                                      {spec.businessCount && (
                                        <span className="text-xs text-gray-500 ms-auto">{tj("{0} businesses", spec.businessCount)}</span>
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

export default SimpleCategorySelector;