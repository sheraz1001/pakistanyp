import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Province } from '@shared/schema';
import { tj } from "@/i18n-jsx/tj";

interface MobileProvincesSelectorProps {
  onProvinceSelect?: (province: Province) => void;
  selectedProvinceId?: number;
}

export function MobileProvincesSelector({ 
  onProvinceSelect, 
  selectedProvinceId 
}: MobileProvincesSelectorProps) {
  const [, navigate] = useLocation();
  const { data: provinces = [] } = useQuery({
    queryKey: ['/api/provinces'],
  });

  const handleProvinceClick = (province: Province) => {
    if (onProvinceSelect) {
      onProvinceSelect(province);
    } else {
      navigate(`/search?province=${province.id}`);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900 mb-3">Browse by Province</h3>
      <div className="grid grid-cols-1 gap-3">
        {provinces.map((province) => {
          const isSelected = selectedProvinceId === province.id;
          
          return (
            <Card 
              key={province.id}
              className={`cursor-pointer transition-all border-0 shadow-sm ${
                isSelected 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => handleProvinceClick(province)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isSelected ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <MapPin className={`h-5 w-5 ${
                        isSelected ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{province.name}</h4>
                      <p className="text-sm text-gray-600">{province.arabicName}</p>
                    </div>
                  </div>
                  <Badge variant={isSelected ? 'default' : 'secondary'} className="text-xs">{tj("{0} businesses", province.businessCount || 0)}</Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}