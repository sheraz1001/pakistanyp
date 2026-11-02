/**
 * Emergency cache fix for persistent homepage caching issues
 * This implements the most aggressive cache clearing possible
 */

export const emergencyCacheFix = async () => {
  console.log('🚨 EMERGENCY CACHE FIX: Starting nuclear cache clearing...');
  
  try {
    // 1. Unregister ALL service workers completely
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log(`🗑️ Unregistering ${registrations.length} service workers...`);
      
      for (const registration of registrations) {
        await registration.unregister();
        console.log('✅ Service worker unregistered:', registration.scope);
      }
    }
    
    // 2. Delete ALL cache storage
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log(`🗑️ Deleting ${cacheNames.length} cache storages...`);
      
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
        console.log('✅ Cache deleted:', cacheName);
      }
    }
    
    // 3. Clear ALL browser storage
    try {
      localStorage.clear();
      sessionStorage.clear();
      console.log('✅ Browser storage cleared');
    } catch (e) {
      console.warn('⚠️ Could not clear browser storage:', e);
    }
    
    // 4. Clear IndexedDB if it exists
    if ('indexedDB' in window) {
      try {
        // This is a more aggressive approach - we'll try to delete common DB names
        const commonDBNames = ['keyval-store', 'firebaseLocalStorageDb', 'workbox-expiration'];
        for (const dbName of commonDBNames) {
          try {
            indexedDB.deleteDatabase(dbName);
          } catch (e) {
            // Ignore errors for non-existent databases
          }
        }
        console.log('✅ IndexedDB cleared');
      } catch (e) {
        console.warn('⚠️ Could not clear IndexedDB:', e);
      }
    }
    
    // 5. Force page reload with maximum cache busting
    const url = new URL(window.location.href);
    url.searchParams.set('_emergency_fix', Date.now().toString());
    url.searchParams.set('_no_cache', '1');
    url.searchParams.set('_bypass_sw', '1');
    url.searchParams.set('_force_refresh', Math.random().toString());
    
    console.log('🔄 Emergency cache fix complete, forcing page reload...');
    
    // Use location.replace to avoid browser back button cache
    window.location.replace(url.toString());
    
  } catch (error) {
    console.error('❌ Emergency cache fix failed:', error);
    // Last resort - hard reload
    window.location.reload(true as any);
  }
};

// Attach to window immediately
if (typeof window !== 'undefined') {
  (window as any).emergencyCacheFix = emergencyCacheFix;
  console.log('🚨 Emergency cache fix loaded. Use emergencyCacheFix() if homepage changes not visible.');
}