import { queryClient } from '@/lib/queryClient';

/**
 * Comprehensive cache refresh utility for homepage and other components
 * This ensures fresh data delivery across the entire application
 */
export const forceCacheRefresh = async () => {
  console.log('🔄 Force cache refresh initiated for homepage changes');
  
  try {
    // Clear all React Query caches first
    queryClient.clear();
    
    // Clear browser cache and service worker cache (but not localStorage to preserve user settings)
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log('🗑️ Clearing service worker caches:', cacheNames);
      await Promise.all(
        cacheNames.map(cacheName => {
          // Only clear API and assets cache, not user data
          if (cacheName.includes('api') || cacheName.includes('assets')) {
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      );
    }
    
    // Clear specific homepage-related queries
    queryClient.removeQueries({ queryKey: ['/api/businesses'] });
    queryClient.removeQueries({ queryKey: ['/api/businesses/featured'] });
    queryClient.removeQueries({ queryKey: ['/api/provinces'] });
    queryClient.removeQueries({ queryKey: ['/api/categories'] });
    queryClient.removeQueries({ queryKey: ['/api/stats'] });
    queryClient.removeQueries({ queryKey: ['/api/blog'] });
    queryClient.removeQueries({ queryKey: ['/api/localities'] });
    queryClient.removeQueries({ queryKey: ['/api/menus'] });
    
    // Force immediate refetch of all queries
    await queryClient.refetchQueries({
      predicate: () => true,
      type: 'active'
    });
    
    // Add a timestamp to force DOM refresh
    const timestamp = Date.now();
    const cacheBuster = document.createElement('meta');
    cacheBuster.setAttribute('name', 'cache-refresh');
    cacheBuster.setAttribute('content', timestamp.toString());
    document.head.appendChild(cacheBuster);
    
    console.log('✅ Comprehensive cache refresh completed successfully');
    
    return { success: true, timestamp };
  } catch (error) {
    console.error('❌ Force cache refresh failed:', error);
    return { success: false, error };
  }
};

// Attach to window for manual testing
if (typeof window !== 'undefined') {
  (window as any).forceCacheRefresh = forceCacheRefresh;
}