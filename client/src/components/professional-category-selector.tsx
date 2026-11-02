import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Plus, X, Search, Crown, AlertCircle } from "lucide-react";
import { getCategoryIcon } from "@/lib/category-icons-clean";

interface Category {
  id: number;
  name: string;
  parentId: number | null;
  businessCount?: number;
}

interface ProfessionalCategorySelectorProps {
  selectedCategories: number[];
  onCategoryChange: (categories: number[]) => void;
  isPremium?: boolean;
}

export function ProfessionalCategorySelector({ 
  selectedCategories, 
  onCategoryChange, 
  isPremium = false 
}: ProfessionalCategorySelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeLevel, setActiveLevel] = useState<'main' | 'sub' | 'specialized'>('main');
  const [selectedMain, setSelectedMain] = useState<number | null>(null);
  const [selectedSub, setSelectedSub] = useState<number | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("GET", "/api/categories"),
  });

  // Get category hierarchy
  const mainCategories = categories.filter((cat: Category) => cat.parentId === null);
  const subCategories = categories.filter((cat: Category) => cat.parentId === selectedMain);
  const specializedCategories = categories.filter((cat: Category) => cat.parentId === selectedSub);

  // Filter categories based on search
  const filterCategories = (cats: Category[]) => {
    if (!searchTerm) return cats;
    return cats.filter(cat => 
      cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Get selected category details
  const getSelectedCategoryDetails = () => {
    return selectedCategories.map(id => 
      categories.find((cat: Category) => cat.id === id)
    ).filter(Boolean);
  };

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

    const isMainCategory = category.parentId === null;
    const isSubCategory = category.parentId !== null && 
      categories.find((c: Category) => c.id === category.parentId)?.parentId === null;

    // Check limits for free users
    if (!isPremium) {
      if (isMainCategory && !canAddMain) return;
      if (isSubCategory && !canAddSub) return;
    }

    if (selectedCategories.includes(categoryId)) {
      // Remove category
      onCategoryChange(selectedCategories.filter(id => id !== categoryId));
    } else {
      // Add category
      onCategoryChange([...selectedCategories, categoryId]);
    }

    // Auto-navigate to next level when selecting main category
    if (isMainCategory && !selectedCategories.includes(categoryId)) {
      setSelectedMain(categoryId);
      setActiveLevel('sub');
    }
  };

  const handleRemoveCategory = (categoryId: number) => {
    onCategoryChange(selectedCategories.filter(id => id !== categoryId));
  };

  const getCategoryLevel = (category: Category) => {
    if (category.parentId === null) return 'main';
    const parent = categories.find((c: Category) => c.id === category.parentId);
    return parent?.parentId === null ? 'sub' : 'specialized';
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'main': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sub': return 'bg-green-100 text-green-800 border-green-200';
      case 'specialized': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Selected Categories Display */}
      {selectedCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {selectedCategories.length} Selected
              </Badge>
              Selected Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {getSelectedCategoryDetails().map((category) => {
                if (!category) return null;
                const level = getCategoryLevel(category);
                const IconComponent = getCategoryIcon(category.name);
                
                return (
                  <Badge
                    key={category.id}
                    variant="secondary"
                    className={`${getLevelColor(level)} flex items-center gap-2 px-3 py-2 text-sm`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{category.name}</span>
                    <button
                      onClick={() => handleRemoveCategory(category.id)}
                      className="ml-1 hover:bg-black/20 rounded-full p-0.5"
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

      {/* Limits Display for Free Users */}
      {!isPremium && (
        <Card className="border-[#F5DDB0] bg-[#FFF4E0]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-[#B45309]" />
              <h3 className="font-semibold text-[#B45309]">Free Plan Limits</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
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
            </div>
            <div className="mt-3 pt-3 border-t border-[#F5DDB0]">
              <Button size="sm" variant="outline" className="w-full text-[#B45309] border-[#F5DDB0] hover:bg-[#FFF4E0]">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade for Unlimited Categories
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Level Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Categories</CardTitle>
          <div className="flex gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Level Navigation */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={activeLevel === 'main' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveLevel('main')}
              className="flex items-center gap-2"
            >
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              Main Categories
            </Button>
            <Button
              variant={activeLevel === 'sub' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveLevel('sub')}
              disabled={!selectedMain}
              className="flex items-center gap-2"
            >
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              Sub Categories
            </Button>
            <Button
              variant={activeLevel === 'specialized' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveLevel('specialized')}
              disabled={!selectedSub}
              className="flex items-center gap-2"
            >
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              Specialized
            </Button>
          </div>

          <Separator className="my-4" />

          {/* Category Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeLevel === 'main' && filterCategories(mainCategories).map((category) => {
              const isSelected = selectedCategories.includes(category.id);
              const IconComponent = getCategoryIcon(category.name);
              const canSelect = isPremium || canAddMain || isSelected;
              
              return (
                <Card
                  key={category.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' 
                      : canSelect 
                        ? 'hover:shadow-md hover:border-blue-300' 
                        : 'opacity-50 cursor-not-allowed'
                  }`}
                  onClick={() => canSelect && handleCategorySelect(category.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <IconComponent className="w-5 h-5 text-blue-600" />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{category.name}</h4>
                        {category.businessCount && (
                          <p className="text-xs text-gray-500">{category.businessCount} businesses</p>
                        )}
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <X className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {activeLevel === 'sub' && filterCategories(subCategories).map((category) => {
              const isSelected = selectedCategories.includes(category.id);
              const IconComponent = getCategoryIcon(category.name);
              const canSelect = isPremium || canAddSub || isSelected;
              
              return (
                <Card
                  key={category.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'ring-2 ring-green-500 bg-green-50 border-green-200' 
                      : canSelect 
                        ? 'hover:shadow-md hover:border-green-300' 
                        : 'opacity-50 cursor-not-allowed'
                  }`}
                  onClick={() => canSelect && handleCategorySelect(category.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <IconComponent className="w-5 h-5 text-green-600" />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{category.name}</h4>
                        {category.businessCount && (
                          <p className="text-xs text-gray-500">{category.businessCount} businesses</p>
                        )}
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <X className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {activeLevel === 'specialized' && filterCategories(specializedCategories).map((category) => {
              const isSelected = selectedCategories.includes(category.id);
              const IconComponent = getCategoryIcon(category.name);
              
              return (
                <Card
                  key={category.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'ring-2 ring-purple-500 bg-purple-50 border-purple-200' 
                      : 'hover:shadow-md hover:border-purple-300'
                  }`}
                  onClick={() => handleCategorySelect(category.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <IconComponent className="w-5 h-5 text-purple-600" />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{category.name}</h4>
                        {category.businessCount && (
                          <p className="text-xs text-gray-500">{category.businessCount} businesses</p>
                        )}
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                          <X className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Navigation Helper */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Main</span>
              </div>
              <span>→</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Sub</span>
              </div>
              <span>→</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span>Specialized</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Click on a main category to explore subcategories. Selected categories can be removed by clicking the X.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProfessionalCategorySelector;