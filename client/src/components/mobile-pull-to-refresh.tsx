import React, { useState, useRef, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
}

export function MobilePullToRefresh({ 
  children, 
  onRefresh, 
  threshold = 100 
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    setIsPulling(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;

    if (distance > 0 && window.scrollY === 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, threshold + 50));
    }
  }, [isPulling, isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

  const pullProgress = Math.min(pullDistance / threshold, 1);
  const shouldShowRefresh = pullDistance > 20;

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-300",
          shouldShowRefresh ? "opacity-100" : "opacity-0"
        )}
        style={{
          transform: `translateY(${pullDistance - 60}px)`,
          height: '60px'
        }}
      >
        <div className="bg-white rounded-full p-2 shadow-lg">
          <RefreshCw
            className={cn(
              "h-5 w-5 text-blue-600 transition-transform duration-300",
              isRefreshing ? "animate-spin" : "",
              pullProgress >= 1 ? "rotate-180" : ""
            )}
            style={{
              transform: `rotate(${pullProgress * 180}deg)`
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div
        className="transition-transform duration-300"
        style={{
          transform: `translateY(${pullDistance * 0.5}px)`
        }}
      >
        {children}
      </div>
    </div>
  );
}