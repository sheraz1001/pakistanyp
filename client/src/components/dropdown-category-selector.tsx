import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { getCategoryIcon } from "@/lib/category-icons-clean";

interface Category {
  id: number;
  name: string;
  parentId: number | null;
  businessCount?: number;
}

interface DropdownCategorySelectorProps {
  selectedCategories: number[];
  onCategoryChange: (categories: number[]) => void;
}

export function DropdownCategorySelector({ 
  selectedCategories, 
  onCategoryChange
}: DropdownCategorySelectorProps) {
  const [selectedMainId, setSelectedMainId] = useState<string>("");
  const [selectedSubId, setSelectedSubId] = useState<string>("");
  const [selectedSpecId, setSelectedSpecId] = useState<string>("");

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("GET", "/api/categories"),
  });

  // Get categories by level
  const mainCategories = categories.filter((cat: Category) => cat.parentId === null);
  const subCategories = categories.filter((cat: Category) => 
    cat.parentId && cat.parentId === parseInt(selectedMainId)
  );
  const specializedCategories = categories.filter((cat: Category) => 
    cat.parentId && cat.parentId === parseInt(selectedSubId)
  );

  // Handle category selection
  const handleMainSelect = (value: string) => {
    setSelectedMainId(value);
    setSelectedSubId("");
    setSelectedSpecId("");
    if (value) {
      addCategory(parseInt(value));
    }
  };

  const handleSubSelect = (value: string) => {
    setSelectedSubId(value);
    setSelectedSpecId("");
    if (value) {
      addCategory(parseInt(value));
    }
  };

  const handleSpecSelect = (value: string) => {
    setSelectedSpecId(value);
    if (value) {
      addCategory(parseInt(value));
    }
  };

  const addCategory = (categoryId: number) => {
    if (!selectedCategories.includes(categoryId)) {
      onCategoryChange([...selectedCategories, categoryId]);
    }
  };

  const removeCategory = (categoryId: number) => {
    onCategoryChange(selectedCategories.filter(id => id !== categoryId));
  };

  const getSelectedCategoryDetails = () => {
    return selectedCategories.map(id => 
      categories.find((cat: Category) => cat.id === id)
    ).filter(Boolean);
  };

  return (
    <div className="space-y-4">
      {/* Selected Categories */}
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
                  onClick={() => removeCategory(category.id)}
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

      {/* Level 1 - Main Categories */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Level 1 - Main Category
        </label>
        <Select value={selectedMainId} onValueChange={handleMainSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Select main category..." />
          </SelectTrigger>
          <SelectContent>
            {mainCategories.map((category: Category) => {
              const IconComponent = getCategoryIcon(category.name);
              return (
                <SelectItem key={category.id} value={category.id.toString()}>
                  <div className="flex items-center gap-2">
                    <IconComponent className="w-4 h-4" />
                    <span>{category.name}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Level 2 - Sub Categories */}
      {selectedMainId && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Level 2 - Sub Category
          </label>
          <Select value={selectedSubId} onValueChange={handleSubSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select sub category..." />
            </SelectTrigger>
            <SelectContent>
              {subCategories.map((category: Category) => {
                const IconComponent = getCategoryIcon(category.name);
                return (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    <div className="flex items-center gap-2">
                      <IconComponent className="w-4 h-4" />
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Level 3 - Specialized Categories */}
      {selectedSubId && specializedCategories.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Level 3 - Specialized Category
          </label>
          <Select value={selectedSpecId} onValueChange={handleSpecSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select specialized category..." />
            </SelectTrigger>
            <SelectContent>
              {specializedCategories.map((category: Category) => {
                const IconComponent = getCategoryIcon(category.name);
                return (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    <div className="flex items-center gap-2">
                      <IconComponent className="w-4 h-4" />
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

export default DropdownCategorySelector;