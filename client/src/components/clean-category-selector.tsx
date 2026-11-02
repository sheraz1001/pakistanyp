import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Search } from "lucide-react";
import { getCategoryIcon } from "@/lib/category-icons-clean";

interface Category {
  id: number;
  name: string;
  parentId: number | null;
  businessCount?: number;
}

interface CleanCategorySelectorProps {
  selectedCategories: number[];
  onCategoryChange: (categories: number[]) => void;
}

export function CleanCategorySelector({ 
  selectedCategories, 
  onCategoryChange
}: CleanCategorySelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("GET", "/api/categories"),
  });

  // Filter categories based on search
  const filteredCategories = categories.filter((category: Category) => {
    if (!searchTerm) return true;
    return category.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Group categories by level
  const mainCategories = filteredCategories.filter((cat: Category) => cat.parentId === null);
  const subCategories = filteredCategories.filter((cat: Category) => {
    if (cat.parentId === null) return false;
    const parent = categories.find((c: Category) => c.id === cat.parentId);
    return parent?.parentId === null;
  });
  const specializedCategories = filteredCategories.filter((cat: Category) => {
    if (cat.parentId === null) return false;
    const parent = categories.find((c: Category) => c.id === cat.parentId);
    return parent?.parentId !== null;
  });

  const handleCategorySelect = (categoryId: number) => {
    const isSelected = selectedCategories.includes(categoryId);
    
    if (isSelected) {
      onCategoryChange(selectedCategories.filter(id => id !== categoryId));
    } else {
      onCategoryChange([...selectedCategories, categoryId]);
    }
  };

  const getSelectedCategoryDetails = () => {
    return selectedCategories.map(id => 
      categories.find((cat: Category) => cat.id === id)
    ).filter(Boolean);
  };

  const CategoryButton = ({ category, bgColor = "bg-gray-100", textColor = "text-gray-800" }: { 
    category: Category;
    bgColor?: string;
    textColor?: string;
  }) => {
    const isSelected = selectedCategories.includes(category.id);
    const IconComponent = getCategoryIcon(category.name);
    
    return (
      <button
        onClick={() => handleCategorySelect(category.id)}
        className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all w-full text-left ${
          isSelected 
            ? 'border-blue-500 bg-blue-50 text-blue-800' 
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        <IconComponent className="w-5 h-5" />
        <span className="flex-1 font-medium">{category.name}</span>
        {category.businessCount && (
          <span className="text-sm text-gray-500">{category.businessCount}</span>
        )}
        {isSelected && (
          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs" aria-hidden="true">&#10003;</span>
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Selected Categories Bar */}
      {selectedCategories.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-blue-900">Selected Categories ({selectedCategories.length})</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCategoryChange([])}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
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
                  className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                  onClick={() => handleCategorySelect(category.id)}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{category.name}</span>
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Main Categories */}
      {mainCategories.length > 0 && (
        <div>
          <h3 className="font-semibold text-lg mb-3 text-blue-900">Main Categories</h3>
          <div className="grid grid-cols-1 gap-2">
            {mainCategories.map((category) => (
              <CategoryButton
                key={category.id}
                category={category}
                bgColor="bg-blue-50"
                textColor="text-blue-800"
              />
            ))}
          </div>
        </div>
      )}

      {/* Sub Categories */}
      {subCategories.length > 0 && (
        <div>
          <h3 className="font-semibold text-lg mb-3 text-green-900">Sub Categories</h3>
          <div className="grid grid-cols-1 gap-2">
            {subCategories.map((category) => (
              <CategoryButton
                key={category.id}
                category={category}
                bgColor="bg-green-50"
                textColor="text-green-800"
              />
            ))}
          </div>
        </div>
      )}

      {/* Specialized Categories */}
      {specializedCategories.length > 0 && (
        <div>
          <h3 className="font-semibold text-lg mb-3 text-[#B45309]">Specialized Categories</h3>
          <div className="grid grid-cols-1 gap-2">
            {specializedCategories.map((category) => (
              <CategoryButton
                key={category.id}
                category={category}
                bgColor="bg-[#FFF4E0]"
                textColor="text-[#B45309]"
              />
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {filteredCategories.length === 0 && searchTerm && (
        <div className="text-center py-8 text-gray-500">
          <p>No categories found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
}

export default CleanCategorySelector;