/**
 * Bot protection that keeps SEO intact: search engines (Google, Bing, Yandex, DuckDuckGo, Apple, Baidu...) are
 * never blocked; scrapers listed below get 403 (AI crawlers are allowed); every client is rate-limited per IP,
 * more strictly on search and the API. App-level, so it works without Cloudflare.
 * BLOCKED_BOTS / ALLOWED_BOTS env vars (comma-separated, case-insensitive) adjust the lists.
 */
import type { Request, Response, NextFunction } from "express";

// AI crawlers (GPTBot, ChatGPT-User, ClaudeBot, CCBot, Amazonbot...) are allowed for AI-search visibility (Nov 2026).
const DEFAULT_BLOCKED = ["Bytespider", "AhrefsBot", "SemrushBot", "MJ12bot", "DotBot", "PetalBot", "DataForSeoBot", "BLEXBot", "SeekportBot", "serpstatbot", "Barkrowler", "ImagesiftBot", "MegaIndex", "Scrapy"];
const list = (env: string | undefined, fallback: string[]) => (env ? env.split(",").map((s) => s.trim()).filter(Boolean) : fallback);
const BLOCKED = new RegExp(list(process.env.BLOCKED_BOTS, DEFAULT_BLOCKED).map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "i");
const SEARCH_ENGINES = new RegExp(["Googlebot", "Google-InspectionTool", "Storebot-Google", "AdsBot-Google", "bingbot", "BingPreview", "YandexBot", "DuckDuckBot", "Applebot", "Baiduspider",
  ...list(process.env.ALLOWED_BOTS, [])].join("|"), "i");

export const isSearchEngine = (ua: string) => SEARCH_ENGINES.test(ua);

/** Requests per minute per IP. */
const LIMITS = { search: 40, api: 400, page: 240 } as const;
const windows = new Map<string, { n: number; reset: number }>();
setInterval(() => { const now = Date.now(); for (const [k, w] of windows) if (w.reset < now) windows.delete(k); }, 5 * 60 * 1000).unref?.();

function over(key: string, limit: number): number {
  const now = Date.now(), w = windows.get(key);
  if (!w || w.reset < now) { windows.set(key, { n: 1, reset: now + 60_000 }); return 0; }
  return ++w.n > limit ? Math.ceil((w.reset - now) / 1000) : 0;
}

export function botGuard(req: Request, res: Response, next: NextFunction) {
  if ((req.socket as any)?.__ypInternal) return next(); // the server's own SSR data requests
  const ua = String(req.headers["user-agent"] || "");
  const path = req.path;
  if (path === "/robots.txt") return next(); // everyone may read the rules
  if (BLOCKED.test(ua) && !SEARCH_ENGINES.test(ua)) {
    res.set("Cache-Control", "public, max-age=86400");
    return res.status(403).type("text/plain").send("Automated access to this site is not permitted.");
  }
  if (/\.(js|css|png|jpe?g|webp|svg|ico|woff2?|map)$/i.test(path) || path.startsWith("/assets/")) return next();
  const ip = req.ip || req.socket.remoteAddress || "?";
  const kind = /^\/(api\/)?(search|businesses\/search|search-results)|^\/(ar\/)?search/.test(path) ? "search" : path.startsWith("/api/") ? "api" : "page";
  // search engines are not limited on pages (Googlebot spreads its crawl itself), but are on search and the API
  if (kind === "page" && SEARCH_ENGINES.test(ua)) return next();
  const wait = over(`${kind}:${ip}`, LIMITS[kind]);
  if (wait) {
    res.set("Retry-After", String(wait));
    return res.status(429).type(kind === "page" ? "text/plain" : "application/json").send(kind === "page" ? "Too many requests. Please try again shortly." : JSON.stringify({ message: "Too many requests" }));
  }
  next();
}
