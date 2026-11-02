import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Users, Eye, ArrowRight } from "lucide-react";

interface Province {
  id: number;
  name: string;
  description: string;
  detailedDescription?: string;
  homepageImage?: string;
  headerImage?: string;
  isActive: boolean;
  isPublished: boolean;
  sortOrder: number;
  viewCount: number;
  businessCount?: number;
  localityCount?: number;
}

export default function EnhancedProvincesDisplay() {
  const { data: rawProvinces = [], isLoading } = useQuery({
    queryKey: ['/api/provinces', { with_stats: 'true' }],
    queryFn: async () => {
      const response = await fetch('/api/provinces?with_stats=true');
      if (!response.ok) throw new Error("Failed to fetch provinces");
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes  
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Custom ordering as requested: Lahore, Karachi, Islamabad, Rawalpindi, Multan, Faisalabad, Peshawar
  const provinceOrder = [
    'Lahore',
    'Karachi', 
    'Islamabad',
    'Rawalpindi',
    'Multan',
    'Faisalabad',
    'Peshawar'
  ];

  const provinces = [...rawProvinces].sort((a, b) => {
    const indexA = provinceOrder.indexOf(a.name);
    const indexB = provinceOrder.indexOf(b.name);
    
    // If both provinces are in our custom order, sort by custom order
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    
    // If only one is in custom order, prioritize it
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    
    // If neither is in custom order, fall back to original sortOrder
    return a.sortOrder - b.sortOrder;
  });

  if (isLoading) {
    return (
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Explore Pakistani Provinces</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover business opportunities across all provinces and territories of Pakistan
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(7)].map((_, index) => (
              <Card key={index} className="animate-pulse">
                <div className="aspect-video bg-gray-200 rounded-t-lg"></div>
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-8 w-16 bg-gray-200 rounded"></div>
                    <div className="h-8 w-16 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Explore Pakistani Provinces</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover business opportunities across all provinces and territories of Pakistan
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {provinces.map((province: Province) => {
            // Map province names to image filenames
            const getProvinceImage = (name: string) => {
              const imageMap: { [key: string]: string } = {
                'Lahore': '/assets/provinces/lahore.jpg',
                'Karachi': '/assets/provinces/karachi.jpg',
                'Islamabad': '/assets/provinces/islamabad.jpg',
                'Rawalpindi': '/assets/provinces/rawalpindi.jpg',
                'Faisalabad': '/assets/provinces/faisalabad.jpg',
                'Peshawar': '/assets/provinces/peshawar.jpg',
                'Multan': '/assets/provinces/multan.jpg'
              };
              return imageMap[name] || '/assets/provinces/karachi.jpg';
            };

            // Map province names to correct URLs
            const getProvinceUrl = (name: string) => {
              const urlMap: { [key: string]: string } = {
                'Lahore': '/lahore',
                'Karachi': '/karachi',
                'Islamabad': '/islamabad',
                'Rawalpindi': '/rawalpindi',
                'Faisalabad': '/faisalabad',
                'Peshawar': '/peshawar',
                'Multan': '/multan'
              };
              return urlMap[name] || '/';
            };

            return (
              <Card key={province.id} className="group hover:shadow-lg transition-all duration-300 bg-white border-0 shadow-md">
                {/* Province Image */}
                <div className="aspect-video relative overflow-hidden rounded-t-lg">
                  <img 
                    src={getProvinceImage(province.name)} 
                    alt={`${province.name} skyline`}
                    className="w-full h-full object-cover transition-transform duration-300"
                  />
                  
                  {/* Status badges */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    {province.isPublished && (
                      <Badge variant="default" className="bg-green-500 text-white text-xs">
                        Live
                      </Badge>
                    )}
                  </div>
                </div>
              
              <CardContent className="p-6">
                {/* Province Info */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {province.name}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                    {province.description}
                  </p>
                </div>
                
                {/* Statistics */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Building2 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      {province.businessCount || 0}
                    </div>
                    <div className="text-xs text-gray-500">Businesses</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <MapPin className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {province.localityCount || 0}
                    </div>
                    <div className="text-xs text-gray-500">Areas</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Eye className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="text-lg font-bold text-purple-600">
                      {province.viewCount || 0}
                    </div>
                    <div className="text-xs text-gray-500">Views</div>
                  </div>
                </div>
                
                {/* Action Button */}
                <Link href={getProvinceUrl(province.name)}>
                  <Button 
                    className="w-full group/btn bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    <span>Explore {province.name}</span>
                    <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
          })}
        </div>
        
        {/* View All Provinces Button */}
        <div className="text-center mt-12">
          <Link href="/provinces">
            <Button 
              variant="outline" 
              size="lg"
              className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white group"
            >
              View All Provinces
              <ArrowRight className="h-4 w-4 ml-2 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}