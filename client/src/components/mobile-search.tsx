import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useQuery } from '@tanstack/react-query';
import { Category, Province } from '@shared/schema';
import { country, localize } from '@shared/country';

export function MobileSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { data: provinces } = useQuery<Province[]>({
    queryKey: ['/api/provinces'],
  });

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('q', searchQuery);
    if (selectedCategory) params.append('category', selectedCategory);
    if (selectedProvince) params.append('province', selectedProvince);
    
    window.location.href = `/search?${params.toString()}`;
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedProvince('');
  };

  return (
    <div className="p-4 bg-white border border-[#E7E9EE] rounded-[20px] md:hidden">
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search businesses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-10"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        
        <Sheet open={showFilters} onOpenChange={setShowFilters}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[400px] rounded-t-[24px]">
            <SheetHeader>
              <SheetTitle>Search Filters</SheetTitle>
            </SheetHeader>
            
            <div className="space-y-4 mt-4">
              <div>
                <label className="yp-label mb-2 block">Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="yp-label mb-2 block">{country.regionTerm.singular}</label>
                <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                  <SelectTrigger>
                    <SelectValue placeholder={localize("Select province")} />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces?.map((province) => (
                      <SelectItem key={province.id} value={province.id.toString()}>
                        {province.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSearch} className="flex-1">
                  Search
                </Button>
                <Button variant="outline" onClick={clearFilters}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}