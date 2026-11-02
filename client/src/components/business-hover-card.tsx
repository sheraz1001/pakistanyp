import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AnimatedButton } from "@/components/ui/animated-button";
import { FadeIn } from "@/components/ui/fade-in";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  Clock,
  Users,
  Heart,
  Share2,
  ExternalLink,
  Calendar,
  Camera,
  Award,
  MessageCircle,
  CheckCircle,
  Zap
} from "lucide-react";
import { format } from "date-fns";

interface BusinessHoverCardProps {
  businessId: number;
  children: React.ReactNode;
  trigger?: "hover" | "click";
  delay?: number;
}

interface BusinessDetails {
  id: number;
  name: string;
  description: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  province: string;
  locality: string;
  category: string;
  subcategories: string[];
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isFeatured: boolean;
  logo: string;
  images: string[];
  workingHours: {
    [key: string]: { open: string; close: string; isClosed: boolean };
  };
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  features: string[];
  establishedYear: number;
  employeeCount: string;
  priceRange: string;
  paymentMethods: string[];
  languages: string[];
  certifications: string[];
  lastUpdated: string;
  responseTime: string;
  businessType: string;
  services: string[];
}

export default function BusinessHoverCard({ 
  businessId, 
  children, 
  trigger = "hover",
  delay = 200 
}: BusinessHoverCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  // Fetch business details with enhanced information
  const { data: businessDetails, isLoading } = useQuery({
    queryKey: [`/api/businesses/${businessId}/details`],
    enabled: isOpen,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleMouseEnter = () => {
    if (trigger === "hover") {
      const timeout = setTimeout(() => {
        setIsOpen(true);
      }, delay);
      setHoverTimeout(timeout);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === "hover") {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        setHoverTimeout(null);
      }
      setIsOpen(false);
    }
  };

  const handleClick = () => {
    if (trigger === "click") {
      setIsOpen(!isOpen);
    }
  };

  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < Math.floor(rating) 
            ? "fill-[#F59E0B] text-[#F59E0B]" 
            : i < rating 
            ? "fill-[#FCD9A0] text-[#F59E0B]" 
            : "fill-gray-200 text-gray-200"
        }`}
      />
    ));
  };

  const getCurrentStatus = () => {
    const now = new Date();
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const currentDay = dayNames[now.getDay()];
    const currentTime = now.getHours() * 100 + now.getMinutes();
    
    if (businessDetails?.workingHours) {
      const todayHours = businessDetails.workingHours[currentDay];
      if (todayHours && !todayHours.isClosed) {
        const openTime = parseInt(todayHours.open.replace(':', ''));
        const closeTime = parseInt(todayHours.close.replace(':', ''));
        
        if (currentTime >= openTime && currentTime <= closeTime) {
          return { status: "Open", color: "text-green-600" };
        }
      }
    }
    return { status: "Closed", color: "text-red-600" };
  };

  const getNextOpenTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const tomorrowDay = dayNames[tomorrow.getDay()];
    
    if (businessDetails?.workingHours) {
      const tomorrowHours = businessDetails.workingHours[tomorrowDay];
      if (tomorrowHours && !tomorrowHours.isClosed) {
        return `Opens tomorrow at ${tomorrowHours.open}`;
      }
    }
    return "Opening hours not available";
  };

  return (
    <HoverCard open={isOpen} onOpenChange={setIsOpen}>
      <HoverCardTrigger asChild>
        <div 
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          className="cursor-pointer"
        >
          {children}
        </div>
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-96 max-w-[calc(100vw-32px)] p-0 rounded-[20px] border border-[#E7E9EE] shadow-[0_24px_48px_-28px_rgba(10,10,10,.25)] bg-white"
        side="right"
        sideOffset={10}
      >
        {isLoading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        ) : businessDetails ? (
          <div className="overflow-hidden rounded-lg">
            {/* Header */}
            <div className="bg-[#F2F9F4] border-b border-[#CFE8D8] p-4 text-[#0A0A0A]">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12 rounded-[14px] border-2 border-white">
                    <AvatarImage src={businessDetails.logo} alt={businessDetails.name} />
                    <AvatarFallback className="rounded-[12px] bg-[#0B6B2E] text-white font-bold">
                      {businessDetails.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-lg truncate">{businessDetails.name}</h3>
                      {businessDetails.isVerified && (
                        <CheckCircle className="w-4 h-4 text-[#0B6B2E]" />
                      )}
                      {businessDetails.isFeatured && (
                        <Zap className="w-4 h-4 text-[#D71920]" />
                      )}
                    </div>
                    <p className="text-sm text-[#5B6475]">{businessDetails.category}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="p-4 space-y-4">
              {/* Rating and status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    {renderStars(businessDetails.rating)}
                  </div>
                  <span className="text-sm font-medium">{businessDetails.rating}</span>
                  <span className="text-sm text-gray-500">({businessDetails.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className={`text-sm font-medium ${getCurrentStatus().color}`}>
                    {getCurrentStatus().status}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 line-clamp-2">
                {businessDetails.description}
              </p>

              {/* Key info */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 truncate">
                    {businessDetails.locality}, {businessDetails.province}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{businessDetails.phone}</span>
                </div>
                {businessDetails.website && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span className="text-blue-600 truncate">
                      {businessDetails.website.replace('https://', '').replace('http://', '')}
                    </span>
                  </div>
                )}
              </div>

              {/* Features */}
              {businessDetails.features && businessDetails.features.length > 0 && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {businessDetails.features.slice(0, 4).map((feature, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {businessDetails.features.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{businessDetails.features.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Working hours preview */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    {getCurrentStatus().status === "Open" 
                      ? `Open until ${businessDetails.workingHours.monday?.close || "late"}`
                      : getNextOpenTime()
                    }
                  </span>
                </div>
              </div>

              <Separator />

              {/* Action buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" className="text-xs">
                    <MessageCircle className="w-3 h-3 mr-1" />
                    Contact
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs">
                    <Heart className="w-3 h-3 mr-1" />
                    Save
                  </Button>
                </div>
                <div className="flex items-center space-x-1">
                  <Button size="sm" variant="ghost" className="text-xs p-1">
                    <Share2 className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs p-1">
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">Est.</div>
                  <div className="text-sm font-medium">{businessDetails.establishedYear}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">Staff</div>
                  <div className="text-sm font-medium">{businessDetails.employeeCount}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">Price</div>
                  <div className="text-sm font-medium">{businessDetails.priceRange}</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            <p>Business information not available</p>
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}