import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface GestureHandlerProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  threshold?: number;
  className?: string;
}

export function MobileGestureHandler({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onTap,
  onDoubleTap,
  threshold = 50,
  className
}: GestureHandlerProps) {
  const [startTouch, setStartTouch] = useState({ x: 0, y: 0 });
  const [lastTap, setLastTap] = useState(0);
  const touchStartRef = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setStartTouch({ x: touch.clientX, y: touch.clientY });
    touchStartRef.current = Date.now();
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const endTouch = { x: touch.clientX, y: touch.clientY };
    const deltaX = endTouch.x - startTouch.x;
    const deltaY = endTouch.y - startTouch.y;
    const touchDuration = Date.now() - touchStartRef.current;

    // Check for swipe gestures
    if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
    } else if (touchDuration < 300) {
      // Check for tap gestures
      const now = Date.now();
      if (now - lastTap < 300 && onDoubleTap) {
        onDoubleTap();
        setLastTap(0);
      } else {
        setLastTap(now);
        if (onTap) {
          setTimeout(() => {
            if (Date.now() - lastTap >= 300) {
              onTap();
            }
          }, 300);
        }
      }
    }
  }, [startTouch, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap, onDoubleTap, threshold, lastTap]);

  return (
    <div
      className={cn("touch-manipulation", className)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}