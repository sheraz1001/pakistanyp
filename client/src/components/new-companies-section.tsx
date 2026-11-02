import { localLang, localDir } from "@shared/country";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  MapPin, 
  Phone, 
  Globe, 
  Users,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { Business } from "@shared/schema";
import { country, localize } from "@shared/country";

export default function NewCompaniesSection() {
  const { data: businessesData } = useQuery<{ businesses: Business[] }>({
    queryKey: ["/api/businesses", { limit: 6 }],
  });

  const businesses = businessesData?.businesses?.slice(-6) || [];

  if (!businesses.length) {
    return (
      <section className="py-16 md:py-24 bg-white border-y border-[#EEECE6]">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#E8F4EC] rounded-[14px] flex items-center justify-center mx-auto mb-6">
              <Users className="w-7 h-7 text-[#0B6B2E]" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {localize("Launch Your Business in Pakistan Directory")}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              {`Join the inaugural group of businesses in ${country.name}'s most comprehensive directory. Get discovered by thousands of potential customers across all ${country.regions.length} ${country.regionTerm.plural.toLowerCase()}.`}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => window.location.href = '/pricing'}
                className="bg-pk-navy hover:bg-pk-teal text-white px-8 py-4 text-lg"
              >
                Add Your Business Free
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/business-guidelines'}
                className="border-pk-navy text-pk-navy hover:bg-pk-navy hover:text-white px-8 py-4 text-lg"
              >
                Business Guidelines
              </Button>
            </div>
            <div className="mt-8 flex justify-center space-x-8 text-sm text-gray-600">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                Free listing
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                Instant verification
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                Premium features available
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 bg-white border-y border-[#EEECE6]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            New Companies Joining Our Directory
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {localize("Welcome our newest members! These companies have recently joined our Pakistani Business Directory and are ready to serve you with their professional services.")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {businesses.map((business) => (
            <Card key={business.id} className="group yp-card-link bg-white">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                        {business.name}
                      </h3>
                      {business.isVerified && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                    {business.arabicName && (
                      <p className="text-gray-600 mb-2" dir={localDir} lang={localLang}>{business.arabicName}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {business.isPremium && (
                      <Badge variant="secondary" className="bg-[#FDECEC] text-[#B91C1C] text-xs">
                        Premium
                      </Badge>
                    )}
                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                      New
                    </Badge>
                  </div>
                </div>

                <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                  {business.shortDescription || business.description}
                </p>

                <div className="space-y-3 mb-4">
                  {business.address && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-red-500" />
                      <span className="line-clamp-1">{business.address}</span>
                    </div>
                  )}

                  {business.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 text-blue-500" />
                      <span>{business.phone}</span>
                    </div>
                  )}

                  {business.website && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Globe className="h-4 w-4 text-green-500" />
                      <span className="line-clamp-1">{business.website}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B]" />
                      <span className="text-sm font-medium">
                        {parseFloat(business.ratingAverage || "0").toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({business.ratingCount || 0})
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Users className="h-3 w-3" />
                      <span>{business.viewCount || 0} views</span>
                    </div>
                  </div>
                </div>

                {business.specialties && business.specialties.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {business.specialties.slice(0, 2).map((specialty, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                      {business.specialties.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{business.specialties.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => window.location.href = `/business/${business.slug}`}
                  >
                    View Profile
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  {business.phone && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`tel:${business.phone}`}>
                        <Phone className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => window.location.href = "/categories"}
            className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
          >
            Explore All Categories
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}