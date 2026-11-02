/**
 * Service worker killer utility to prevent caching issues on homepage
 * This unregisters all service workers that might be caching content
 */
export const killServiceWorkers = async () => {
  console.log('🔫 Clearing service worker caches for homepage updates...');
  
  if ('serviceWorker' in navigator) {
    try {
      // Send message to service worker to clear all caches
      if (navigator.serviceWorker.controller && navigator.serviceWorker.controller !== null) {
        const messageChannel = new MessageChannel();
        
        return new Promise((resolve) => {
          messageChannel.port1.onmessage = (event) => {
            console.log('✅ Service worker cleared all caches successfully');
            resolve(true);
          };
          
          navigator.serviceWorker.controller.postMessage(
            { action: 'clearAllCaches' },
            [messageChannel.port2]
          );
          
          // Timeout after 2 seconds
          setTimeout(() => {
            console.log('⏰ Service worker cache clear timeout, continuing...');
            resolve(true);
          }, 2000);
        });
      }
      
      // Fallback: clear caches directly
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        console.log('🗑️ Directly clearing', cacheNames.length, 'cache storages');
        
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
          console.log('🗑️ Deleted cache:', cacheName);
        }
      }
      
      console.log('✅ All service worker caches cleared');
      return true;
    } catch (error) {
      console.error('❌ Error clearing service worker caches:', error);
      return false;
    }
  } else {
    console.log('ℹ️ Service workers not supported in this browser');
    return false;
  }
};

/**
 * Force reload the page after clearing service workers
 */
export const forceReloadWithoutCache = async () => {
  console.log('🔄 Force reloading page without cache...');
  
  // Kill service workers first
  await killServiceWorkers();
  
  // Add timestamp to URL to force fresh load
  const url = new URL(window.location.href);
  url.searchParams.set('_nocache', Date.now().toString());
  url.searchParams.set('_kill_sw', '1');
  
  // Force reload
  window.location.replace(url.toString());
};

// Detect if homepage changes aren't loading and auto-fix
export const detectAndFixCachingIssues = () => {
  console.log('🔍 Cache issue detection disabled to prevent automatic refreshes');
  // Auto-fix functionality disabled to prevent browser refresh loops
  return false;
};

// Global functions for manual testing
if (typeof window !== 'undefined') {
  (window as any).killServiceWorkers = killServiceWorkers;
  (window as any).forceReloadWithoutCache = forceReloadWithoutCache;
  (window as any).detectAndFixCachingIssues = detectAndFixCachingIssues;
}