// Define the gtag function globally
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    __GA_ID__?: string;
  }
}

/**
 * GA4 measurement id. The server injects window.__GA_ID__ (and the gtag snippet)
 * from the runtime environment, so it works even when VITE_GA_MEASUREMENT_ID was
 * not present at build time. The build-time value is the fallback.
 */
export const getMeasurementId = (): string | undefined =>
  (typeof window !== "undefined" && window.__GA_ID__) || import.meta.env.VITE_GA_MEASUREMENT_ID || undefined;

// Initialize Google Analytics (no-op when the server already loaded gtag)
export const initGA = () => {
  const measurementId = getMeasurementId();

  if (!measurementId) {
    console.warn('Google Analytics not configured (set VITE_GA_MEASUREMENT_ID)');
    return;
  }
  if (typeof window.gtag === 'function') return;

  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script1);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId);
};

// Track page views on client-side navigation (the first view is sent by gtag config)
export const trackPageView = (url: string) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  const measurementId = getMeasurementId();
  if (!measurementId) return;

  window.gtag('event', 'page_view', {
    page_path: url,
    page_location: window.location.href,
    page_title: document.title,
    send_to: measurementId,
  });
};

// Track events
export const trackEvent = (
  action: string, 
  category?: string, 
  label?: string, 
  value?: number
) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};