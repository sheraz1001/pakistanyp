import { useEffect } from "react";

export function FaviconCacheManager() {
  useEffect(() => {
    // Simplified automatic favicon cache clearing
    const simpleFaviconCacheClearing = () => {
      const timestamp = Date.now();

      // Remove existing favicon links
      const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
      existingFavicons.forEach(favicon => favicon.remove());

      // Create new favicon link with cache-busting parameter
      const newFavicon = document.createElement('link');
      newFavicon.rel = 'icon';
      newFavicon.type = 'image/png';
      newFavicon.href = `/dynamic-favicon.ico?v=${timestamp}`;
      document.head.appendChild(newFavicon);

      console.log(`🎯 Automatic favicon cache cleared with timestamp: ${timestamp}`);

      // Clear service worker cache for PWA/desktop app
      if ('serviceWorker' in navigator && 'caches' in window) {
        caches.keys().then((cacheNames) => {
          cacheNames.forEach((cacheName) => {
            caches.delete(cacheName);
          });
        });
      }
    };

    simpleFaviconCacheClearing();

    // Set up periodic cache clearing (every 30 seconds for active updates)
    const interval = setInterval(simpleFaviconCacheClearing, 10 * 60 * 1000);

    // Listen for favicon update events
    const handleFaviconUpdate = () => {
      simpleFaviconCacheClearing();
    };

    window.addEventListener('faviconUpdate', handleFaviconUpdate);

    // Expose functions globally for debugging
    (window as any).clearFaviconCache = () => {
      window.dispatchEvent(new CustomEvent('faviconUpdate'));
    };

    return () => {
      clearInterval(interval);
      window.removeEventListener('faviconUpdate', handleFaviconUpdate);
    };
  }, []);

  return null; // This component doesn't render anything
}

// Helper function to trigger favicon update from anywhere in the app
export function triggerFaviconUpdate() {
  window.dispatchEvent(new CustomEvent('faviconUpdate'));
}