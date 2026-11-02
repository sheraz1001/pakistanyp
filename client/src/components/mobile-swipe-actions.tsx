import React, { useState, useRef } from 'react';
import { Phone, Mail, Heart, Share2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SwipeActionsProps {
  children: React.ReactNode;
  onCall?: () => void;
  onEmail?: () => void;
  onFavorite?: () => void;
  onShare?: () => void;
  onRate?: () => void;
  isFavorite?: boolean;
}

export function MobileSwipeActions({ 
  children, 
  onCall, 
  onEmail, 
  onFavorite, 
  onShare, 
  onRate,
  isFavorite = false 
}: SwipeActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const diff = startX - currentX;
    
    if (diff > 50) {
      setIsExpanded(true);
    } else if (diff < -50) {
      setIsExpanded(false);
    }
    
    setCurrentX(currentX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setCurrentX(0);
  };

  const actions = [
    { icon: Phone, label: 'Call', action: onCall, color: 'bg-green-500' },
    { icon: Mail, label: 'Email', action: onEmail, color: 'bg-blue-500' },
    { icon: Heart, label: 'Favorite', action: onFavorite, color: isFavorite ? 'bg-red-500' : 'bg-gray-500' },
    { icon: Share2, label: 'Share', action: onShare, color: 'bg-purple-500' },
    { icon: Star, label: 'Rate', action: onRate, color: 'bg-[#B45309]' },
  ].filter(action => action.action);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={cn(
          "transition-transform duration-300",
          isExpanded ? "-translate-x-16" : "translate-x-0"
        )}
      >
        {children}
      </div>
      
      {/* Action buttons */}
      <div
        className={cn(
          "absolute right-0 top-0 h-full flex items-center transition-transform duration-300",
          isExpanded ? "translate-x-0" : "translate-x-full"
        )}
      >
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Button
              key={index}
              size="sm"
              className={cn(
                "h-12 w-12 rounded-none border-r border-white",
                action.color
              )}
              onClick={action.action}
            >
              <Icon className="h-4 w-4" />
            </Button>
          );
        })}
      </div>
    </div>
  );
}