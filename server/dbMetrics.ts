/**
 * Database usage metering: queries, rows and bytes returned, per route.
 * Bytes are the JSON size of the returned rows, a close proxy for the network transfer Neon bills as egress.
 *
 *   GET /api/metrics/db           admin only: totals per route since start (?reset=1 clears)
 *   DB_METRICS_LOG=1                    also logs the top routes every hour
 *
 * Requests made by server-side rendering (in-process API calls) are counted under their API route and
 * also under the page that triggered them ("page" totals).
 */
import { AsyncLocalStorage } from "node:async_hooks";
import type { Express, Request, Response, NextFunction } from "express";
import { apiCacheStats } from "./apiCache";

interface Ctx { route: string; page?: string }
interface Stat { requests: number; queries: number; rows: number; bytes: number; maxBytes: number }
const store: AsyncLocalStorage<Ctx> = ((globalThis as any).__ypDbMetricsStore ||= new AsyncLocalStorage<Ctx>());
const routes = new Map<string, Stat>();
const pages = new Map<string, Stat>();
let since = Date.now();

const stat = (m: Map<string, Stat>, k: string) => { let s = m.get(k); if (!s) { s = { requests: 0, queries: 0, rows: 0, bytes: 0, maxBytes: 0 }; m.set(k, s); } return s; };
const sizeOf = (rows: unknown) => { try { return Buffer.byteLength(JSON.stringify(rows ?? null)); } catch { return 0; } };

/** "/business/abc-trading" -> "/business/:slug", "/api/businesses/12" -> "/api/businesses/:id" */
export function routeKey(method: string, path: string): string {
  const parts = path.split("?")[0].split("/").filter(Boolean);
  const keep = parts[0] === "api" ? 3 : parts[0] === "ar" ? 2 : 1; // API: resource names kept; pages: section kept
  const seg = parts.map((s, i) => (/^\d+$/.test(s) ? ":id" : i >= keep ? ":slug" : s));
  const p = `/${seg.slice(0, 4).join("/")}`;
  return `${method} ${p.replace(/^\/ar(\/|$)/, "/(ar)$1")}`;
}

function record(rows: any[] | undefined, ctx: Ctx | undefined) {
  const key = ctx?.route || "background";
  const bytes = sizeOf(rows), n = Array.isArray(rows) ? rows.length : 0;
  for (const [m, k] of [[routes, key], ...(ctx?.page && ctx.page !== key ? [[pages, ctx.page]] : [])] as [Map<string, Stat>, string][]) {
    const s = stat(m, k); s.queries++; s.rows += n; s.bytes += bytes; if (bytes > s.maxBytes) s.maxBytes = bytes;
  }
}

/**
 * Wrap a pg / Neon pool so every query is metered once, credited to the request that made it.
 * Queries are metered on the client; pool.query() is routed through pool.connect() (as pg does internally).
 */
export function meterPool(pool: any) {
  if (pool.__metered) return;
  pool.__metered = true;
  const rowsOf = (r: any) => (Array.isArray(r) ? r.flatMap((x: any) => x?.rows || []) : r?.rows);
  const meterClient = (client: any) => {
    if (!client || client.__metered) return client;
    client.__metered = true;
    const orig = client.query.bind(client);
    client.query = (...args: any[]) => {
      const ctx = store.getStore(); // captured now: callbacks run later in the socket's context
      const cb = typeof args[args.length - 1] === "function" ? args.pop() : null;
      if (cb) return orig(...args, (err: any, r: any) => { if (!err) record(rowsOf(r), ctx); cb(err, r); });
      const res = orig(...args);
      return res && typeof res.then === "function" ? res.then((r: any) => { record(rowsOf(r), ctx); return r; }) : res;
    };
    return client;
  };
  const connect = pool.connect.bind(pool);
  pool.connect = (...a: any[]) => {
    const cb = typeof a[a.length - 1] === "function" ? a.pop() : null;
    if (cb) return connect((err: any, client: any, done: any) => cb(err, meterClient(client), done));
    return connect().then(meterClient);
  };
  const run = async (args: any[]) => {
    const client = await pool.connect();
    try { const r = await client.query(...args); client.release(); return r; }
    catch (e) { client.release(e instanceof Error && (e as any).code === undefined ? e : undefined); throw e; }
  };
  pool.query = (...args: any[]) => {
    const cb = typeof args[args.length - 1] === "function" ? args.pop() : null;
    const p = run(args);
    if (!cb) return p;
    p.then((r) => cb(null, r), (e) => cb(e));
    return undefined;
  };
}

/** Run background work (timers, start-up tasks) under a label. */
export const meterAs = <T>(label: string, fn: () => Promise<T>) => store.run({ route: `background:${label}` }, fn);

export function dbMetricsMiddleware(req: Request, _res: Response, next: NextFunction) {
  const outer = store.getStore();
  const key = routeKey(req.method, req.originalUrl || req.url);
  const ctx: Ctx = { route: key, page: outer?.page || (key.includes(" /api/") ? undefined : key) };
  stat(routes, key).requests++;
  if (ctx.page === key) stat(pages, key).requests++;
  store.run(ctx, next);
}

export function dbMetricsReport(limit = 40) {
  const rank = (m: Map<string, Stat>) => [...m.entries()].sort((a, b) => b[1].bytes - a[1].bytes).slice(0, limit)
    .map(([k, s]) => ({ route: k, ...s, bytesPerRequest: s.requests ? Math.round(s.bytes / s.requests) : null }));
  const totalBytes = [...routes.values()].reduce((t, s) => t + s.bytes, 0);
  return { since: new Date(since).toISOString(), totalBytes, totalQueries: [...routes.values()].reduce((t, s) => t + s.queries, 0), routes: rank(routes), pages: rank(pages) };
}
export function resetDbMetrics() { routes.clear(); pages.clear(); since = Date.now(); }

export function registerDbMetrics(app: Express, isAdmin: (req: Request) => boolean) {
  app.get("/api/metrics/db", (req, res) => {
    if (!isAdmin(req) && process.env.DB_METRICS_OPEN !== "1") return res.status(403).json({ message: "Admin only" });
    const report: any = dbMetricsReport(Number(req.query.limit) || 40);
    report.cache = apiCacheStats();
    if (req.query.reset === "1") resetDbMetrics();
    res.set("Cache-Control", "no-store").json(report);
  });
  if (process.env.DB_METRICS_LOG === "1") {
    setInterval(() => {
      const r = dbMetricsReport(8);
      console.log(`[db-metrics] ${(r.totalBytes / 1e6).toFixed(1)} MB in ${r.totalQueries} queries since ${r.since}: ` +
        r.routes.map((x) => `${x.route} ${(x.bytes / 1e6).toFixed(2)}MB/${x.requests}req`).join(" | "));
    }, 60 * 60 * 1000).unref?.();
  }
}
