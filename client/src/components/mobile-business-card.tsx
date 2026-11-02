import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Mail, Star, Clock, Globe, Heart } from 'lucide-react';
import { Business } from '@shared/schema';
import { MobileSwipeActions } from './mobile-swipe-actions';
import { useLocation } from 'wouter';
import { AnimatedCard } from '@/components/ui/animated-card';

interface MobileBusinessCardProps {
  business: Business;
  onFavorite?: (businessId: number) => void;
  isFavorite?: boolean;
}

export function MobileBusinessCard({ 
  business, 
  onFavorite, 
  isFavorite = false 
}: MobileBusinessCardProps) {
  const [, navigate] = useLocation();

  const handleCall = () => {
    if (business.phone) {
      window.open(`tel:${business.phone}`, '_self');
    }
  };

  const handleEmail = () => {
    if (business.email) {
      window.open(`mailto:${business.email}`, '_self');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: business.name,
      text: business.description || '',
      url: window.location.origin + `/business/${business.slug || business.id}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback for browsers without Web Share API
      navigator.clipboard.writeText(shareData.url);
    }
  };

  return (
    <MobileSwipeActions
      onCall={business.phone ? handleCall : undefined}
      onEmail={business.email ? handleEmail : undefined}
      onFavorite={onFavorite ? () => onFavorite(business.id) : undefined}
      onShare={handleShare}
      isFavorite={isFavorite}
    >
      <AnimatedCard className="mb-4 shadow-sm border-0 bg-white hover-lift click-feedback"
        delay={100}
      >
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Business Logo */}
            <div className="w-16 h-16 bg-[#E8F4EC] rounded-[14px] flex items-center justify-center flex-shrink-0 overflow-hidden">
              {business.logo ? (
                <img 
                  src={business.logo} 
                  alt={business.name}
                  className="w-full h-full object-cover rounded-xl"
                  onError={(e) => {
                    // Fallback to initial if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = `
                      <div class="w-12 h-12 bg-[#0B6B2E] rounded-xl flex items-center justify-center">
                        <span class="text-white font-bold text-lg">${business.name.charAt(0).toUpperCase()}</span>
                      </div>
                    `;
                  }}
                />
              ) : (
                <div className="w-12 h-12 bg-[#0B6B2E] rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {business.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Business Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-3">
                <h3 
                  className="font-bold text-lg text-gray-900 truncate cursor-pointer hover:text-blue-600 transition-all duration-200"
                  onClick={() => navigate(`/business/${business.slug || business.id}`)}
                >
                  {business.name}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFavorite?.(business.id)}
                  className="p-1 h-8 w-8"
                >
                  <Heart 
                    className={`h-4 w-4 ${
                      isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'
                    }`} 
                  />
                </Button>
              </div>

              {/* Rating & Reviews */}
              {business.rating && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B]" />
                    <span className="text-sm font-medium">{business.rating}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    ({business.totalReviews || 0} reviews)
                  </span>
                </div>
              )}

              {/* Category & Status */}
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  {business.category}
                </Badge>
                {business.isOpen && (
                  <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                    <Clock className="h-3 w-3 mr-1" />
                    Open
                  </Badge>
                )}
              </div>

              {/* Location */}
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                <MapPin className="h-4 w-4" />
                <span className="truncate">{business.address}</span>
              </div>

              {/* Contact Info */}
              <div className="flex items-center gap-4 text-sm">
                {business.phone && (
                  <button
                    onClick={handleCall}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                  >
                    <Phone className="h-4 w-4" />
                    <span>Call</span>
                  </button>
                )}
                {business.website && (
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                  >
                    <Globe className="h-4 w-4" />
                    <span>Website</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </AnimatedCard>
    </MobileSwipeActions>
  );
}