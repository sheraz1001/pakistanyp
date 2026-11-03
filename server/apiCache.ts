/**
 * In-memory response cache for public, read-only data (no new services; per server process).
 *
 * The site's pages read the same lists on every view (categories, places, regions, counts, menus) and crawlers
 * fetch every page and sitemap: without a cache each view re-read ~2 MB from Postgres. Responses of the routes
 * below are kept for a TTL and served from memory; any successful write to the API clears the cache, so edits by
 * admins, owners and users show up immediately.
 *
 * Only anonymous requests are cached (no session cookie): signed-in users always get fresh data. Responses get
 * public Cache-Control (s-maxage + stale-while-revalidate) and an ETag, so repeat requests can be answered with 304.
 */
import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";

const MIN = 60 * 1000, HOUR = 60 * MIN;
/** [path pattern, TTL]: first match wins. */
const RULES: [RegExp, number][] = [
  [/^\/(sitemap[^/]*\.xml|robots\.txt)$/, 24 * HOUR],
  [/^\/api\/(categories|provinces|regions|localities|places|cities|navigation|menus)(\/|$)/, 6 * HOUR],
  [/^\/api\/stats(\/|$)/, 1 * HOUR],
  [/^\/api\/(life\/rules|life\/guides)(\/|$)/, 1 * HOUR],
  [/^\/api\/(blog|news|editorial)(\/|$)/, 30 * MIN],
  [/^\/api\/(rankings|top)(\/|$)/, 1 * HOUR],
  [/^\/api\/(search|businesses\/search|ai\/search-suggestions|localities\/search)(\/|$)/, 10 * MIN],
  [/^\/api\/businesses(\/|$)/, 20 * MIN],
];
/** Never cached even if they match a rule above (per-user or write-adjacent). */
const NEVER = /^\/api\/(admin|auth|user|users|owner|my-|dashboard|metrics|health|stripe|webhook|subscription|claims?)(\/|$)|\/(mine|me|claim|leads|analytics|track)(\/|$)/;
/** Query parameters that only bust caches. */
const IGNORED_PARAMS = new Set(["_cb", "_r", "_t", "t", "ts", "timestamp", "nocache", "v"]);

const MAX_ENTRIES = 3000, MAX_BYTES = 80 * 1024 * 1024;
interface Entry { body: Buffer; type: string; status: number; etag: string; expires: number; ttl: number }
const entries = new Map<string, Entry>();
let bytes = 0;
const stats = { hits: 0, misses: 0, stored: 0, cleared: 0 };

export function clearApiCache() { entries.clear(); bytes = 0; memo.clear(); stats.cleared++; }

// ------------------------------------------------------------------ data-level cache
// Many routes read the same whole table and filter it in JavaScript (e.g. /api/categories/with-stats?parentId=…):
// the table read itself is cached, so every variant of the URL shares one database read.
const memo = new Map<string, { at: number; ttl: number; value: Promise<unknown> }>();
const clone = <T>(v: T): T => (v === null || typeof v !== "object" ? v : structuredClone(v));

/** Memoise read methods of an object (results are copied, so callers may modify them). */
export function memoizeMethods(target: any, methods: Record<string, number>) {
  for (const [name, ttl] of Object.entries(methods)) {
    const orig = target[name];
    if (typeof orig !== "function") { console.warn(`[cache] ${name} not found, not cached`); continue; }
    target[name] = function (...args: any[]) {
      const key = `${name}:${JSON.stringify(args)}`;
      const hit = memo.get(key);
      if (hit && Date.now() - hit.at < hit.ttl) return hit.value.then(clone);
      const value = Promise.resolve(orig.apply(this, args));
      memo.set(key, { at: Date.now(), ttl, value });
      value.catch(() => memo.delete(key)); // never cache failures
      return value.then(clone);
    };
  }
}
export const apiCacheStats = () => ({ ...stats, entries: entries.size, bytes });

function ttlFor(path: string): number {
  if (NEVER.test(path)) return 0;
  for (const [re, ttl] of RULES) if (re.test(path)) return ttl;
  return 0;
}

function keyFor(req: Request): string {
  const u = new URL(req.originalUrl, "http://x");
  const params = [...u.searchParams.entries()].filter(([k]) => !IGNORED_PARAMS.has(k)).sort(([a], [b]) => a.localeCompare(b));
  const lang = String(req.headers["x-lang"] || "") || ((req as any).ypLang ?? "");
  // search terms normalised so "Restaurant " and "restaurant" share an entry
  const q = params.map(([k, v]) => `${k}=${/^(q|query|search|term)$/.test(k) ? v.trim().toLowerCase().replace(/\s+/g, " ") : v}`).join("&");
  return `${lang}|${u.pathname}?${q}`;
}

const anonymous = (req: Request) => !/(^|;\s*)connect\.sid=/.test(String(req.headers.cookie || "")) && !req.headers.authorization;

function store(key: string, e: Entry) {
  const old = entries.get(key);
  if (old) { bytes -= old.body.length; entries.delete(key); }
  if (e.body.length > 8 * 1024 * 1024) return; // never keep huge bodies
  entries.set(key, e); bytes += e.body.length; stats.stored++;
  while (entries.size > MAX_ENTRIES || bytes > MAX_BYTES) {
    const [k, v] = entries.entries().next().value as [string, Entry];
    entries.delete(k); bytes -= v.body.length;
  }
}

const cacheHeaders = (res: Response, ttl: number, etag: string) => {
  const sMax = Math.round(ttl / 1000);
  res.set("Cache-Control", `public, max-age=${Math.min(300, sMax)}, s-maxage=${sMax}, stale-while-revalidate=86400`);
  res.set("ETag", etag);
  res.removeHeader("Pragma"); res.removeHeader("Expires");
};

export function apiCache(req: Request, res: Response, next: NextFunction) {
  // Writes: clear the cache once they succeed (listings, reviews, claims, categories, places...)
  if (req.method !== "GET" && req.method !== "HEAD") {
    if (req.path.startsWith("/api/") && !/^\/api\/(auth|metrics|analytics|track|user\/language)/.test(req.path)) {
      res.on("finish", () => { if (res.statusCode < 400) clearApiCache(); });
    }
    return next();
  }
  const ttl = ttlFor(req.path);
  if (!ttl || !anonymous(req)) return next();
  const key = keyFor(req);
  const hit = entries.get(key);
  if (hit && hit.expires > Date.now()) {
    stats.hits++;
    entries.delete(key); entries.set(key, hit); // LRU: most recent last
    cacheHeaders(res, hit.ttl, hit.etag);
    res.set("X-Cache", "HIT");
    if (req.headers["if-none-match"] === hit.etag) return res.status(304).end();
    return res.status(hit.status).type(hit.type).send(hit.body);
  }
  stats.misses++;
  const send = res.send.bind(res);
  (res as any).send = (body: any) => {
    if (res.statusCode === 200 && body !== undefined && body !== null && typeof body !== "function") {
      const buf = Buffer.isBuffer(body) ? body : Buffer.from(typeof body === "string" ? body : JSON.stringify(body));
      const etag = `W/"${crypto.createHash("sha1").update(buf).digest("base64url").slice(0, 27)}"`;
      const type = String(res.get("Content-Type") || (typeof body === "string" ? "text/html; charset=utf-8" : "application/json; charset=utf-8"));
      store(key, { body: buf, type, status: 200, etag, expires: Date.now() + ttl, ttl });
      cacheHeaders(res, ttl, etag);
      res.set("X-Cache", "MISS");
      if (req.headers["if-none-match"] === etag) { res.status(304); return send(); }
    }
    return send(body);
  };
  next();
}
