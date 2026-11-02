import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export function usePageTransition() {
  const [location] = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayLocation, setDisplayLocation] = useState(location);

  useEffect(() => {
    if (location !== displayLocation) {
      setIsTransitioning(true);
      
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setIsTransitioning(false);
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  return {
    location: displayLocation,
    isTransitioning,
  };
}