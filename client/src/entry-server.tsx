/**
 * SSR entry point (rewritten in the Oct 2026 SEO audit).
 *
 * Previous version pre-fetched a hand-written list of query keys that no longer
 * matched the keys used by the pages, and App.tsx wrapped itself in its own
 * QueryClientProvider/HelmetProvider, so the server always rendered loading
 * skeletons with the generic <title>. Google therefore saw near-empty pages.
 *
 * This version does a "prepass": render -> collect every query the tree asked
 * for -> fetch them with the page's own queryFn -> render again (max 3 passes).
 * Whatever the components request is what gets server-rendered, so it can't
 * drift out of sync again.
 */
import { renderToPipeableStream } from "react-dom/server";
import { PassThrough } from "node:stream";
import { AsyncLocalStorage } from "node:async_hooks";
import { QueryClient, QueryClientProvider, dehydrate } from "@tanstack/react-query";
import { HelmetProvider, type HelmetServerState } from "@/lib/helmet-compat";
import { Router as WouterRouter } from "wouter";
import { getQueryFn } from "@/lib/queryClient";
import App, { preloadRoutes, routesLoaded } from "./App";
import NotFound from "@/pages/not-found";

const API_BASE = process.env.SSR_API_BASE || `http://127.0.0.1:${process.env.PORT || 5000}`;
const MAX_PASSES = 3;
const PASS_BUDGET_MS = parseInt(process.env.SSR_DATA_BUDGET_MS || "3500", 10);

type FetchLog = { url: string; status: number }[] & { routes?: Set<string> };
// kept on globalThis so the patched fetch and a hot-reloaded module share one store
const requestStore: AsyncLocalStorage<FetchLog> = ((globalThis as any).__pakistanypSsrStore ||= new AsyncLocalStorage<FetchLog>());

// Components call fetch('/api/...') with relative URLs. On the server resolve them
// against our own HTTP listener and record statuses so we can detect 404 pages.
const g = globalThis as any;
if (!g.__pakistanypSsrFetchPatched) {
  const origFetch: typeof fetch = g.fetch.bind(globalThis);
  g.fetch = async (input: any, init?: any) => {
    const raw = typeof input === "string" ? input : input instanceof URL ? input.toString() : input?.url;
    const isRelative = typeof raw === "string" && raw.startsWith("/");
    const target = isRelative ? API_BASE + raw : input;
    const headers = isRelative ? { ...(init?.headers || {}), "x-ssr-internal": "1", accept: "application/json" } : init?.headers;
    // Prefer the in-process dispatcher installed by the server (no network hop, works
    // when the app is not reachable on 127.0.0.1:$PORT, e.g. behind LiteSpeed/Passenger).
    const dispatch = (globalThis as any).__pakistanypSsrDispatch;
    const res: Response = isRelative && typeof dispatch === "function"
      ? await dispatch(raw, { method: init?.method, headers, body: init?.body })
      : await origFetch(target, isRelative ? { ...init, headers, credentials: undefined, cache: undefined } : init);
    const log = ((globalThis as any).__pakistanypSsrStore as AsyncLocalStorage<FetchLog> | undefined)?.getStore();
    if (log && isRelative) log.push({ url: raw.split("?")[0], status: res.status });
    return res;
  };
  g.__pakistanypSsrFetchPatched = true;
}

export interface SSRRenderResult {
  html: string;
  helmetContext: { helmet?: HelmetServerState };
  dehydratedState: unknown;
  notFound: boolean;
  /** Lazy route modules rendered for this URL (the browser preloads them before hydrating). */
  routes: string[];
}

function createStaticLocationHook(path: string) {
  return function useStaticLocation(): [string, (to: string) => void] {
    return [path, () => {}];
  };
}

function createSSRQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        queryFn: getQueryFn({ on401: "returnNull" }),
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      },
    },
  });
}

function isEnabled(q: any): boolean {
  const e = q.options?.enabled;
  if (e === false) return false;
  if (typeof e === "function") {
    try { return e(q) !== false; } catch { return false; }
  }
  // A key containing undefined/null almost always means "waiting for a parent query"
  return !q.queryKey.some((k: unknown) => k === undefined || k === null);
}

/** API URLs whose 404 means the *page itself* does not exist. */
function primaryApiPatterns(pathname: string): RegExp[] {
  const seg = pathname.split("/").filter(Boolean).map((s) => decodeURIComponent(s));
  const last = seg[seg.length - 1];
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (seg[0] === "business" && seg[1]) return [new RegExp(`^/api/businesses/(slug/)?${esc(seg[1])}$`)];
  if (seg[0] === "business-profile" && seg[1]) return [new RegExp(`^/api/businesses/(slug/)?${esc(seg[1])}$`)];
  if (seg[0] === "categories" && last && seg.length > 1) return [new RegExp(`^/api/categories/(by-slug/)?${esc(last)}$`)];
  if (seg[0] === "localities" && seg.length === 3) return [new RegExp(`^/api/localities/.*${esc(last)}$`)];
  if (seg[0] === "blog" && seg[1]) return [new RegExp(`^/api/blog/${esc(seg[1])}$`)];
  if (seg[0] === "news" && seg[1]) return [new RegExp(`^/api/news/(slug/)?${esc(seg[1])}$`)];
  if (seg[0] === "top" && seg[1]) return [new RegExp(`^/api/rankings/${esc(seg[1])}$`)];
  return [];
}

const LIGHT_KEYS = new Set(["id","name","slug","arabicName","nameAr","parentId","level","provinceId","province","provinceName","provinceSlug","localityId","categoryId","businessCount","subcategoryCount","count","icon","color","sortOrder","isActive","isFeatured","isPopular","isVerified","image","imageUrl","logoUrl","rating","ratingAverage","type","path","fullPath"]);
const HEAVY_KEYS = /^(description|content|seoContent|seo_content|metaDescription|metaTitle|keywords|faq|faqs|longDescription|introContent|aboutContent|generatedContent|aiContent|customCSS|customJS)$/i;

function slimItem(item: any) {
  if (!item || typeof item !== "object") return item;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(item)) {
    if (v === null || v === undefined || v === "") continue;
    if (HEAVY_KEYS.test(k) || !LIGHT_KEYS.has(k)) continue;
    if (typeof v === "string" && v.length > 160) continue;
    if (typeof v === "object" && JSON.stringify(v).length > 400) continue;
    out[k] = v;
  }
  return out;
}

/** Slim big list queries in the cache BEFORE rendering so server HTML === client hydration. */
function slimListsInCache(queryClient: QueryClient) {
  for (const q of queryClient.getQueryCache().getAll() as any[]) {
    const data = q.state?.data;
    if (!Array.isArray(data) || data.length < 40 || q.state.__slim) continue;
    queryClient.setQueryData(q.queryKey, data.map(slimItem), { updatedAt: 0 });
    q.state.__slim = true;
  }
}

/** Large lists only need light fields to hydrate; the browser refetches full data right after. */
function slimForHydration(state: any) {
  for (const q of state?.queries || []) {
    const data = q?.state?.data;
    if (!Array.isArray(data) || data.length < 40) continue;
    q.state.data = data.map(slimItem);
    q.state.dataUpdatedAt = 0; // mark stale -> client refetches the full list after hydration
  }
  return state;
}

export async function render(url: string): Promise<SSRRenderResult> {
  const queryClient = createSSRQueryClient();
  // Browser location hooks expose pathname only; including ?q=... would select NotFound.
  const pathname = new URL(url, "http://ssr.internal").pathname;
  const useStaticLocation = createStaticLocationHook(pathname);
  const fetchLog: FetchLog = Object.assign([], { routes: new Set<string>() });

  const renderOnce = async (notFoundPage = false) => {
    const helmetContext: { helmet?: HelmetServerState } = {};
    const tree = (
      <HelmetProvider context={helmetContext}>
        <QueryClientProvider client={queryClient}>
          <WouterRouter hook={useStaticLocation}>
            {notFoundPage ? <NotFound /> : <App />}
          </WouterRouter>
        </QueryClientProvider>
      </HelmetProvider>
    );
    // Wait for lazy route modules before collecting queries or sending HTML.
    // renderToString would emit Suspense placeholders instead of SEO content.
    const html = await new Promise<string>((resolve, reject) => {
      const output = new PassThrough();
      const chunks: Buffer[] = [];
      let renderError: unknown;
      const timer = setTimeout(() => {
        stream.abort();
        reject(new Error("SSR route render timed out"));
      }, 10000);
      const finish = () => clearTimeout(timer);
      output.on("data", chunk => chunks.push(Buffer.from(chunk)));
      output.on("end", () => {
        finish();
        if (renderError) reject(renderError);
        else resolve(Buffer.concat(chunks).toString("utf8"));
      });
      output.on("error", error => { finish(); reject(error); });
      const stream = renderToPipeableStream(tree, {
        onAllReady() { stream.pipe(output); },
        onShellError(error) { finish(); reject(error); },
        onError(error) { renderError = error; },
      });
    });
    return { html, helmetContext };
  };

  return requestStore.run(fetchLog, async () => {
    try {
      const started = Date.now();
      const attempted = new Set<string>();
      let result = await renderOnce();
      // First request for a lazy route: its module loaded during that render, so the
      // HTML still has a Suspense boundary. Render again without it (see App.tsx).
      if (fetchLog.routes?.size && !routesLoaded(fetchLog.routes)) {
        await preloadRoutes(Array.from(fetchLog.routes));
        result = await renderOnce();
      } else if (fetchLog.routes?.size && result.html.includes("<!--$-->")) {
        result = await renderOnce();
      }

      for (let pass = 0; pass < MAX_PASSES; pass++) {
        const pending = queryClient
          .getQueryCache()
          .getAll()
          .filter((q: any) => q.state.data === undefined && q.state.status === "pending" && !attempted.has(q.queryHash) && isEnabled(q));
        if (pending.length === 0) break;
        const remaining = PASS_BUDGET_MS - (Date.now() - started);
        if (remaining <= 0) break;

        pending.forEach((q: any) => attempted.add(q.queryHash));
        await Promise.race([
          Promise.allSettled(pending.map((q: any) => q.fetch().catch(() => undefined))),
          new Promise((r) => setTimeout(r, remaining)),
        ]);
        slimListsInCache(queryClient);
        result = await renderOnce();
      }

      const patterns = primaryApiPatterns(pathname);
      const notFound = fetchLog.some((f) => f.status === 404 && patterns.some((p) => p.test(f.url)));
      // Unknown slug: serve the real "Page not found" page (status 404 + noindex is set
      // by server/ssrPage.ts) instead of the page's empty shell with the default title.
      if (notFound) result = await renderOnce(true);

      // Only ship successful queries to the browser.
      const dehydratedState = slimForHydration(dehydrate(queryClient, {
        shouldDehydrateQuery: (q) => q.state.status === "success" && !String(q.queryKey[0]).match(/^\/api\/(auth|admin)\/user/), // login state is per-browser
      }));

      return { html: result.html, helmetContext: result.helmetContext, dehydratedState, notFound, routes: notFound ? [] : Array.from(fetchLog.routes || []) };
    } finally {
      queryClient.clear();
    }
  });
}

export { render as default };
