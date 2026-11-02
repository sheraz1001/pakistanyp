import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "@/lib/helmet-compat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MapPin, 
  Building2, 
  Users, 
  Eye, 
  Globe, 
  Phone, 
  Mail,
  ExternalLink,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";
import { tj } from "@/i18n-jsx/tj";

interface Province {
  id: number;
  name: string;
  description: string;
  detailedDescription?: string;
  homepageImage?: string;
  headerImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  isActive: boolean;
  isPublished: boolean;
  sortOrder: number;
  viewCount: number;
  businessCount?: number;
  localityCount?: number;
  highlights?: any[];
  keyFacts?: any[];
  attractions?: any[];
  economicSectors?: any[];
}

export default function IndividualProvincePage() {
  const { provinceName } = useParams() as { provinceName: string };
  
  // Convert URL slug back to province name for lookup
  const displayName = provinceName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const { data: provinces = [], isLoading } = useQuery({
    queryKey: ['/api/provinces', { with_stats: 'true' }],
  });

  const province = provinces.find((e: Province) => 
    e.name.toLowerCase().replace(/ /g, '-') === provinceName
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F3]">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200"></div>
          <div className="container mx-auto px-4 py-8">
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!province) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Province Not Found</h1>
          <p className="text-gray-600 mb-6">The requested province could not be found.</p>
          <Link href="/provinces">
            <Button>
              <ArrowLeft className="h-4 w-4 me-2" />
              Back to Provinces
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* SEO meta tags are handled server-side for Provinces pages */}
      
      <div className="min-h-screen bg-[#FAF8F3]">
        {/* Province header */}
        <div className="border-b border-[#CFE8D8] bg-[#F2F9F4]">
          <div className="yp-wrap grid items-center gap-8 py-14 md:grid-cols-[1.3fr_1fr]">
            <div>
              <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap gap-2 text-sm text-[#5B6475]">
                <Link href="/" className="text-[#0B6B2E] hover:text-[#05501F]">Home</Link>
                <span aria-hidden="true">/</span>
                <Link href="/provinces" className="text-[#0B6B2E] hover:text-[#05501F]">Provinces</Link>
                <span aria-hidden="true">/</span>
                <span>{province.name}</span>
              </nav>
              <h1 className="yp-h1 text-[#0A0A0A]">{province.name}</h1>
              <p className="yp-lead mt-4 max-w-2xl">
                {province.description}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <span className="yp-pill border border-[#CFE8D8] bg-white text-[#05501F]">{tj("{0} Businesses", province.businessCount || 0)}</span>
                <span className="yp-pill border border-[#CFE8D8] bg-white text-[#05501F]">{tj("{0} Areas", province.localityCount || 0)}</span>
                <span className="yp-pill border border-[#CFE8D8] bg-white text-[#05501F]">{tj("{0} Views", province.viewCount || 0)}</span>
              </div>
            </div>
            {province.headerImage && (
              <div className="hidden h-64 overflow-hidden rounded-[24px] border border-[#CFE8D8] md:block">
                <img src={province.headerImage} alt={province.name} className="h-full w-full object-cover" />
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* About Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" />{tj("About {0}", province.name)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    {province.detailedDescription ? (
                      <div className="space-y-4">
                        <p className="text-gray-700 leading-relaxed">
                          {province.detailedDescription}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-700 leading-relaxed">
                        {province.description}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Key Highlights */}
              {province.highlights && province.highlights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Key Highlights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {province.highlights.map((highlight: any, index: number) => (
                        <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">{highlight.title}</h4>
                            <p className="text-sm text-gray-600">{highlight.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Economic Sectors */}
              {province.economicSectors && province.economicSectors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Economic Sectors</CardTitle>
                    <CardDescription>{tj("Key industries and business sectors in {0}", province.name)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {province.economicSectors.map((sector: any, index: number) => (
                        <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                          <h4 className="font-medium text-gray-900 mb-2">{sector.name}</h4>
                          <p className="text-sm text-gray-600">{sector.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-600">Businesses</span>
                    </div>
                    <span className="font-medium">{province.businessCount || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-600">Areas</span>
                    </div>
                    <span className="font-medium">{province.localityCount || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-gray-600">Page Views</span>
                    </div>
                    <span className="font-medium">{province.viewCount || 0}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href={`/businesses?province=${province.id}`}>
                    <Button className="w-full justify-start" variant="outline">
                      <Building2 className="h-4 w-4 me-2" />
                      Browse Businesses
                    </Button>
                  </Link>
                  
                  <Link href={`/localities?province=${province.id}`}>
                    <Button className="w-full justify-start" variant="outline">
                      <MapPin className="h-4 w-4 me-2" />
                      Explore Areas
                    </Button>
                  </Link>
                  
                  <Link href="/add-business-enhanced">
                    <Button className="w-full justify-start">
                      <Building2 className="h-4 w-4 me-2" />
                      Add Your Business
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Key Facts */}
              {province.keyFacts && province.keyFacts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Key Facts</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {province.keyFacts.map((fact: any, index: number) => (
                      <div key={index} className="border-s-4 border-blue-600 ps-4">
                        <h4 className="font-medium text-gray-900 text-sm">{fact.title}</h4>
                        <p className="text-sm text-gray-600">{fact.value}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}