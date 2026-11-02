/**
 * Hard refresh utility for forcing page reload with complete cache bypass
 */

export const performHardRefresh = () => {
  console.log('🔄 Performing hard refresh with cache bypass...');
  
  // Method 1: Add cache-busting parameters to URL
  const url = new URL(window.location.href);
  url.searchParams.set('_t', Date.now().toString());
  url.searchParams.set('_cb', Math.random().toString(36).substring(7));
  url.searchParams.set('_hard_refresh', '1');
  
  // Method 2: Use location.replace to avoid browser history caching
  window.location.replace(url.toString());
};

export const forceReloadWithoutCache = () => {
  console.log('🚨 Force reloading page without any cache...');
  
  // Clear all possible caches first
  if (typeof Storage !== 'undefined') {
    try {
      localStorage.clear();
      sessionStorage.clear();
      console.log('✅ Browser storage cleared');
    } catch (e) {
      console.warn('⚠️ Could not clear browser storage:', e);
    }
  }
  
  // Clear cache storage
  if ('caches' in window) {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach(cacheName => {
        caches.delete(cacheName);
        console.log('🗑️ Deleted cache:', cacheName);
      });
    });
  }
  
  // Perform hard refresh
  setTimeout(() => {
    performHardRefresh();
  }, 100);
};

export const autoRefreshIfNeeded = () => {
  console.log('🔍 Auto-refresh disabled to prevent constant page reloads');
  // Auto-refresh functionality disabled to prevent browser refresh loops
  return false;
};

// Attach to window for manual use
if (typeof window !== 'undefined') {
  (window as any).performHardRefresh = performHardRefresh;
  (window as any).forceReloadWithoutCache = forceReloadWithoutCache;
  (window as any).autoRefreshIfNeeded = autoRefreshIfNeeded;
  
  console.log('🛠️ Hard refresh utilities loaded');
}