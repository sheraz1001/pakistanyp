// Force browser cache refresh
export const forceCacheRefresh = () => {
  // Clear service worker cache
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.update();
      });
    });
  }

  // Clear localStorage and sessionStorage
  localStorage.clear();
  sessionStorage.clear();

  // Force reload with cache bypass
  window.location.reload();
};

// Add cache-busting timestamp to URLs
export const addCacheBuster = (url: string) => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_cb=${Date.now()}`;
};

// Force refresh after component mount
export const forceRefreshAfterMount = () => {
  setTimeout(() => {
    console.log("🔄 Forcing cache refresh to show latest changes...");
    if (window.location.search.includes('_refresh=')) {
      return; // Already refreshed
    }
    const url = new URL(window.location.href);
    url.searchParams.set('_refresh', Date.now().toString());
    window.location.replace(url.toString());
  }, 1000);
};