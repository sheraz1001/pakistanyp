/**
 * Manual cache clearing functions for testing homepage changes
 * These functions are attached to the window object for easy access
 */

import { forceCacheRefresh } from './forceCacheRefresh';
import { performHardRefresh } from './hardRefresh';
import { killServiceWorkers, forceReloadWithoutCache } from './serviceworkerKiller';

/**
 * Complete cache clearing sequence for homepage issues
 */
export const clearEverything = async () => {
  console.log('🧹 Starting complete cache clearing sequence...');
  
  try {
    // Step 1: Kill service workers and clear their caches
    console.log('Step 1: Clearing service worker caches...');
    await killServiceWorkers();
    
    // Step 2: Force React Query cache refresh
    console.log('Step 2: Clearing React Query caches...');
    await forceCacheRefresh();
    
    // Step 3: Clear browser storage
    console.log('Step 3: Clearing browser storage...');
    if (typeof Storage !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
    
    // Step 4: Clear all cache storage
    console.log('Step 4: Clearing all cache storage...');
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    
    console.log('✅ Complete cache clearing finished. Reloading page...');
    
    // Step 5: Hard refresh page
    setTimeout(() => {
      performHardRefresh();
    }, 500);
    
  } catch (error) {
    console.error('❌ Error during complete cache clearing:', error);
    // Fallback to hard refresh
    performHardRefresh();
  }
};

/**
 * Quick cache clear without page reload
 */
export const quickCacheClear = async () => {
  console.log('⚡ Quick cache clear...');
  
  try {
    await killServiceWorkers();
    await forceCacheRefresh();
    
    console.log('✅ Quick cache clear completed');
    return true;
  } catch (error) {
    console.error('❌ Quick cache clear failed:', error);
    return false;
  }
};

/**
 * Test homepage elements visibility
 */
export const testHomepageElements = () => {
  console.log('🔍 Testing homepage elements visibility...');
  
  const elements = [
    { id: 'hero-search', name: 'Hero Search' },
    { id: 'featured-categories', name: 'Featured Categories' },
    { id: 'featured-businesses', name: 'Featured Businesses' },
    { id: 'new-businesses-registered', name: 'New Businesses' },
    { id: 'enhanced-provinces-display', name: 'Provinces Display' },
    { class: 'voice-search', name: 'Voice Search' },
    { class: 'weather-mascot', name: 'Weather Mascot' }
  ];
  
  const results = elements.map(element => {
    let found = false;
    
    if (element.id) {
      found = !!document.getElementById(element.id);
    }
    
    if (!found && element.class) {
      found = !!document.querySelector(`.${element.class}`);
    }
    
    console.log(`${found ? '✅' : '❌'} ${element.name}: ${found ? 'Found' : 'Missing'}`);
    
    return { ...element, found };
  });
  
  const missingCount = results.filter(r => !r.found).length;
  console.log(`\n📊 Summary: ${results.length - missingCount}/${results.length} elements found`);
  
  if (missingCount > 0) {
    console.log('⚠️ Some elements are missing. Consider running clearEverything()');
  }
  
  return results;
};

// Attach functions to window for easy access in browser console
if (typeof window !== 'undefined') {
  (window as any).clearEverything = clearEverything;
  (window as any).quickCacheClear = quickCacheClear;
  (window as any).testHomepageElements = testHomepageElements;
  
  // Helper message
  console.log(`
🛠️ Manual Cache Clearing Tools Available:
- clearEverything() - Complete cache clear with page reload
- quickCacheClear() - Quick cache clear without reload  
- testHomepageElements() - Check if homepage elements are visible
- killServiceWorkers() - Clear service worker caches only
- performHardRefresh() - Force page reload with cache bypass
- forceReloadWithoutCache() - Reload with service worker clearing
  `);
}