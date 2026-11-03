/**
 * Lazy route modules that also server-render (see App.tsx): each rendered route id is recorded during SSR
 * and the browser loads those chunks before hydrating. Shared by App.tsx and country extensions.
 */
import { Suspense, type ComponentType } from "react";

const routeLoaders = new Map<string, () => Promise<unknown>>();
const loadedRoutes = new Set<string>();

export function lazy(factory: () => Promise<{ default: ComponentType<any> }>, id: string) {
  let Loaded: ComponentType<any> | null = null;
  let failure: unknown = null;
  let pending: Promise<unknown> | null = null;
  const load = () =>
    (pending ||= factory().then(
      (m) => { Loaded = m.default; loadedRoutes.add(id); },
      (e) => { failure = e; },
    ));
  routeLoaders.set(id, load);

  function RouteModule(props: any) {
    if (failure) throw failure;
    if (!Loaded) throw load();
    const C = Loaded;
    return <C {...props} />;
  }

  return function DeferredRoute(props: any) {
    if (typeof window === "undefined") {
      (globalThis as any).__pakistanypSsrStore?.getStore()?.routes?.add(id);
    }
    if (Loaded) {
      const C = Loaded;
      return <C {...props} />;
    }
    return <Suspense fallback={<div role="status" className="min-h-[60vh] flex items-center justify-center">Loading page…</div>}>
      <RouteModule {...props} />
    </Suspense>;
  };
}

/** True when every listed route module has already been loaded. */
export function routesLoaded(ids: Iterable<string>): boolean {
  return Array.from(ids).every((id) => loadedRoutes.has(id));
}

/** Load the route chunks the server rendered, before hydration. */
export function preloadRoutes(ids: unknown): Promise<unknown> {
  const list = Array.isArray(ids) ? ids : [];
  return Promise.all(list.map((id) => routeLoaders.get(String(id))?.()).filter(Boolean));
}
