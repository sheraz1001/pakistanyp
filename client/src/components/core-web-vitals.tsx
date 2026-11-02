import { useEffect } from 'react';

// Core Web Vitals measurement and optimization component
export default function CoreWebVitals() {
  useEffect(() => {
    // Measure and track Core Web Vitals
    if (typeof window !== 'undefined') {
      // Import web-vitals library functions if available
      const trackWebVitals = async () => {
        try {
          // Track Largest Contentful Paint (LCP)
          const observer = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            
            // Good LCP is under 2.5 seconds
            
            // Track to analytics if needed
            if (lastEntry.startTime > 2500) {
              console.warn('LCP is slow:', lastEntry.startTime / 1000, 'seconds');
            }
          });
          
          observer.observe({ type: 'largest-contentful-paint', buffered: true });
          
          // Track First Input Delay (FID) and Cumulative Layout Shift (CLS)
          // This would typically use the web-vitals library
          
        } catch (error) {
          // PerformanceObserver is not supported by every browser.
        }
      };
      
      trackWebVitals();
    }
  }, []);

  return null; // This is a measurement component, no UI needed
}

// Performance optimization utilities
export const performanceOptimizations = {
  // Preload critical resources
  preloadCriticalResources: () => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = '/critical.css';
    link.as = 'style';
    document.head.appendChild(link);
  },
  
  // Optimize images loading
  optimizeImageLoading: () => {
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach((img) => {
      if (img.getBoundingClientRect().top < window.innerHeight * 1.5) {
        img.removeAttribute('loading');
      }
    });
  },
  
  // Minimize layout shifts
  minimizeLayoutShifts: () => {
    // Add explicit width/height to images and containers
    const images = document.querySelectorAll('img:not([width]):not([height])');
    images.forEach((img) => {
      if (img.naturalWidth && img.naturalHeight) {
        img.setAttribute('width', img.naturalWidth.toString());
        img.setAttribute('height', img.naturalHeight.toString());
      }
    });
  }
};