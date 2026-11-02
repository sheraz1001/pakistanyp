/**
 * Client Entry Point for SSR Hydration
 * Hydrates the server-rendered HTML on the client
 */

import { hydrateRoot, createRoot } from "react-dom/client";
import { QueryClientProvider, HydrationBoundary } from "@tanstack/react-query";
import { HelmetProvider } from "@/lib/helmet-compat";
import App, { preloadRoutes } from "./App";
import { Router as WouterRouter } from "wouter";
import "./index.css";
import { SECOND, SECOND_PREFIX, langOfPath, setDictionary, stripLang } from "@shared/i18n";
import { loadDictionary } from "@shared/countries/dictionary";

const lang = langOfPath(window.location.pathname);
(window as any).__YP_LANG__ = lang;
const routerBase = SECOND && lang === SECOND.code ? SECOND_PREFIX : "";

// API responses come back localised (place, category and business names) for the page's language
if (routerBase) {
  const origFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const apiPath = typeof url === "string" ? url.replace(window.location.origin, "") : "";
    // Forms and dashboards edit the stored (English) values: only reference lists come back localised there
    const formPage = /^\/(dashboard|user-dashboard|business-dashboard|my-|add-business|onboarding|business\/[^/]+\/claim|subscribe|upgrade-premium)/.test(stripLang(window.location.pathname));
    const reference = /^\/api\/(categories|places|provinces|regions|localities|cities)/.test(apiPath);
    if (apiPath.startsWith("/api/") && (!formPage || reference)) {
      const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
      headers.set("x-lang", lang);
      return origFetch(input, { ...init, headers });
    }
    return origFetch(input, init);
  };
}

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
        {/* useSearch() returns the router's ssrSearch while hydrating: pass the real query so it matches the server HTML */}
        <WouterRouter base={routerBase} ssrSearch={window.location.search.replace(/^\?/, "")}>
          <App />
        </WouterRouter>
      </HydrationBoundary>
    </QueryClientProvider>
  </HelmetProvider>
);

// 404 responses carry the generic "Page not found" markup, not the route's own
// tree, so render fresh instead of hydrating (the route then shows its own state).
// Route chunks the server rendered are loaded first so hydration happens in place.
const canHydrate = isSSRRendered && container.hasChildNodes() && !window.__SSR_NOT_FOUND__;
Promise.all([
  preloadRoutes(canHydrate ? window.__SSR_ROUTES__ : []).catch(() => undefined),
  routerBase ? loadDictionary().then(setDictionary).catch(() => undefined) : undefined,
])
  .then(() => {
    if (canHydrate) {
      hydrateRoot(container, AppElement);
    } else {
      createRoot(container).render(AppElement);
    }
  });
