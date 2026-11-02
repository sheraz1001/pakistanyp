import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Building } from "lucide-react";
import { tj } from "@/i18n-jsx/tj";
import { t as tx } from "@shared/i18n";

interface ProvincesSelectorProps {
  onProvinceClick: (provinceName: string) => void;
}

const provinceImages: { [key: string]: string } = {
  "Lahore": "https://images.unsplash.com/photo-1512632578888-169bbbc64f33?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=200",
  "Karachi": "https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=200",
  "Islamabad": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=200",
  "Rawalpindi": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=200",
  "Peshawar": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=200",
  "Faisalabad": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=200",
  "Multan": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=200",
};

export default function ProvincesSelector({ onProvinceClick }: ProvincesSelectorProps) {
  const { data: provinces = [], isLoading } = useQuery({
    queryKey: ['/api/provinces'],
  });

  const { data: allLocalities = [] } = useQuery({
    queryKey: ['/api/localities'],
  });

  const { data: businessData } = useQuery({
    queryKey: ['/api/businesses', { limit: 1 }],
  });

  if (isLoading) {
    return (
      <section className="py-24 bg-[#FAF8F3]">
        <div className="yp-wrap">
          <div className="text-center mb-12">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-96 bg-[#EEF0F4] rounded-[20px]"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const getLocalitiesForProvince = (provinceId: number) => {
    return allLocalities.filter((locality: any) => locality.provinceId === provinceId);
  };

  const getBadgeText = (province: any) => {
    if (province.isCapital) return "Capital";
    if (province.name === "Karachi") return "Business Hub";
    if (province.name === "Islamabad") return "Cultural";
    return "";
  };

  return (
    <section className="py-24 bg-[#FAF8F3]">
      <div className="yp-wrap">
        <div className="text-center mb-12">
          <span className="yp-label">Provinces</span>
          <h3 className="yp-h2 mt-2 mb-4">
            Explore by Provinces
          </h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Find businesses across all provinces and territories and their localities
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {provinces.map((province: any) => {
            const localities = getLocalitiesForProvince(province.id);
            const badgeText = getBadgeText(province);
            
            return (
              <Card
                key={province.id}
                className="yp-card-link overflow-hidden cursor-pointer"
                onClick={() => onProvinceClick(province.name)}
              >
                <div className="h-48 relative">
                  <img 
                    src={provinceImages[province.name] || provinceImages["Karachi"]}
                    alt={tx("{0} skyline", province.name)}
                    className="w-full h-full object-cover"
                  />
                                    {badgeText && (
                    <Badge className="absolute top-4 end-4 bg-white text-[#05501F] border-0">
                      {badgeText}
                    </Badge>
                  )}
                </div>
                
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xl font-bold tracking-[-0.02em]">{province.name}</h4>
                  </div>
                  
                  <p className="text-gray-600 mb-4">
                    {province.description || tx("Explore businesses across {0}", province.name)}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                    {localities.slice(0, 4).map((locality: any) => (
                      <div key={locality.id} className="text-gray-700">
                        • {locality.name}
                      </div>
                    ))}
                    {localities.length > 4 && (
                      <div className="text-gray-500 text-xs">{tj("+{0} more localities", localities.length - 4)}</div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    {province.area && (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 me-1" />
                        <span>{tj("{0} km²", province.area)}</span>
                      </div>
                    )}
                    {province.population && (
                      <div className="flex items-center">
                        <Users className="w-4 h-4 me-1" />
                        <span>{province.population.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  
                  <Button variant="outline" className="w-full">{tj("Explore {0}", province.name)}</Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
