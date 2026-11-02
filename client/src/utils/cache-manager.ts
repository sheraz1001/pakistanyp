
// Cache management utility for clearing all types of cache
export class CacheManager {
  // Clear browser storage
  static clearBrowserStorage() {
    try {
      localStorage.clear();
      sessionStorage.clear();
      console.log('✅ Browser storage cleared');
    } catch (error) {
      console.error('❌ Error clearing browser storage:', error);
    }
  }

  // Clear all service worker caches
  static async clearServiceWorkerCache() {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('✅ Service Worker caches cleared');
      } catch (error) {
        console.error('❌ Error clearing Service Worker cache:', error);
      }
    }
  }

  // Unregister service worker
  static async unregisterServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(registration => registration.unregister())
        );
        console.log('✅ Service Worker unregistered');
      } catch (error) {
        console.error('❌ Error unregistering Service Worker:', error);
      }
    }
  }

  // Clear React Query cache
  static clearReactQueryCache(queryClient: any) {
    try {
      queryClient.clear();
      console.log('✅ React Query cache cleared');
    } catch (error) {
      console.error('❌ Error clearing React Query cache:', error);
    }
  }

  // Clear all caches
  static async clearAllCache(queryClient?: any) {
    console.log('🧹 Starting cache cleanup...');
    
    // Clear browser storage
    this.clearBrowserStorage();
    
    // Clear Service Worker cache
    await this.clearServiceWorkerCache();
    
    // Unregister Service Worker
    await this.unregisterServiceWorker();
    
    // Clear React Query cache if provided
    if (queryClient) {
      this.clearReactQueryCache(queryClient);
    }
    
    console.log('🎉 All caches cleared! Please refresh the page.');
    
    // Optional: Auto refresh after clearing
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  // Clear specific cache by name
  static async clearSpecificCache(cacheName: string) {
    if ('caches' in window) {
      try {
        const deleted = await caches.delete(cacheName);
        if (deleted) {
          console.log(`✅ Cache "${cacheName}" cleared`);
        } else {
          console.log(`ℹ️ Cache "${cacheName}" not found`);
        }
      } catch (error) {
        console.error(`❌ Error clearing cache "${cacheName}":`, error);
      }
    }
  }

  // Get cache info
  static async getCacheInfo() {
    const info = {
      localStorage: localStorage.length,
      sessionStorage: sessionStorage.length,
      caches: [] as string[]
    };

    if ('caches' in window) {
      try {
        info.caches = await caches.keys();
      } catch (error) {
        console.error('Error getting cache names:', error);
      }
    }

    return info;
  }
}
