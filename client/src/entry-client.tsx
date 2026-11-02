/**
 * Client Entry Point for SSR Hydration
 * Hydrates the server-rendered HTML on the client
 */

import { hydrateRoot, createRoot } from "react-dom/client";
import { QueryClientProvider, HydrationBoundary } from "@tanstack/react-query";
import { HelmetProvider } from "@/lib/helmet-compat";
import App, { preloadRoutes } from "./App";
import "./index.css";

// Declare global window properties for SSR data
declare global {
  interface Window {
    __REACT_QUERY_STATE__?: unknown;
    __SSR_RENDERED__?: boolean;
    __SSR_NOT_FOUND__?: boolean;
    __SSR_ROUTES__?: string[];
  }
}

// Single shared QueryClient (has the default queryFn the pages rely on)
import { queryClient } from "./lib/queryClient";

// Export queryClient for use in other modules
export { queryClient };

const container = document.getElementById("root")!;

// Get dehydrated state from server
const dehydratedState = window.__REACT_QUERY_STATE__;
const isSSRRendered = window.__SSR_RENDERED__ === true;

// Create the app element
const AppElement = (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>
        <App />
      </HydrationBoundary>
    </QueryClientProvider>
  </HelmetProvider>
);

// 404 responses carry the generic "Page not found" markup, not the route's own
// tree, so render fresh instead of hydrating (the route then shows its own state).
// Route chunks the server rendered are loaded first so hydration happens in place.
const canHydrate = isSSRRendered && container.hasChildNodes() && !window.__SSR_NOT_FOUND__;
preloadRoutes(canHydrate ? window.__SSR_ROUTES__ : [])
  .catch(() => undefined)
  .then(() => {
    if (canHydrate) {
      hydrateRoot(container, AppElement);
    } else {
      createRoot(container).render(AppElement);
    }
  });
