import { country } from "@shared/country";
import { pool } from "../db";
import type { Request, Response, NextFunction } from "express";

/**
 * SEO guards (added in the Oct 2026 audit). Runs before routing:
 *  - 301 www -> apex, trailing slash / uppercase / double slash -> canonical path
 *  - 301 duplicate URL patterns to their canonical page
 *  - serves a single, valid robots.txt
 *  - X-Robots-Tag: noindex for private/utility pages and JSON APIs
 */
const CANONICAL_HOST = (process.env.CANONICAL_HOST || country.domain).toLowerCase();
const PROVINCES = new Set(country.regions.map((r) => r.slug));

export const PRIVATE_PATH = new RegExp(
  "^/(" +
    [
      "admin", "admin-[\\w-]+", "super-admin[\\w-]*", "moderator-dashboard", "content-dashboard", "business-dashboard",
      "user-dashboard", "dashboard", "reports", "advanced-reporting", "upgrade-premium", "login", "register",
      "forgot-password", "reset-password", "verify-email", "onboarding", "search", "search-results",
      "my-business-claims", "create-blog-post", "create-news-article", "newsletter-confirm", "newsletter-unsubscribe",
      "subscribe", "email-test", "test-admin-features", "cache-control", "loading-demo", "mascot-guide-demo",
      "interactive-scanner-demo", "ai-recommendations-old", "business/[^/]+/claim(-auth)?",
    ].join("|") +
    ")(/|$)",
  "i"
);

const ROBOTS_TXT = `# robots.txt for https://${CANONICAL_HOST}
User-agent: *
Allow: /
Disallow: /admin
Disallow: /super-admin
Disallow: /dashboard
Disallow: /user-dashboard
Disallow: /business-dashboard
Disallow: /moderator-dashboard
Disallow: /content-dashboard
Disallow: /api/admin/
Disallow: /api/auth/
Disallow: /*?*_cb=

Sitemap: https://${CANONICAL_HOST}/sitemap.xml
`;

function isAssetPath(p: string) {
  return /\.[a-z0-9]{2,5}$/i.test(p) || p.startsWith("/@") || p.startsWith("/src/") || p.startsWith("/node_modules/");
}

export function seoGuards(req: Request, res: Response, next: NextFunction) {
  const host = (req.headers.host || "").toLowerCase().split(":")[0];
  const isGet = req.method === "GET" || req.method === "HEAD";
  const path = req.path;

  // 1. www -> apex (only for our real domain; Replit preview hosts untouched)
  if (isGet && host === `www.${CANONICAL_HOST}`) {
    return res.redirect(301, `https://${CANONICAL_HOST}${req.originalUrl}`);
  }

  if (path === "/robots.txt") {
    res.type("text/plain").set("Cache-Control", "public, max-age=3600");
    return res.send(ROBOTS_TXT);
  }

  if (path.startsWith("/api/")) {
    res.setHeader("X-Robots-Tag", "noindex");
    return next();
  }

  if (isGet && !isAssetPath(path)) {
    const qs = req.originalUrl.includes("?") ? req.originalUrl.slice(req.originalUrl.indexOf("?")) : "";

    // 2. Path normalisation
    let target = path.replace(/\/{2,}/g, "/");
    if (target.length > 1) target = target.replace(/\/+$/, "");
    let decoded = target;
    try { decoded = decodeURIComponent(target); } catch { /* keep raw */ }
    if (/[A-Z]/.test(decoded)) target = encodeURI(decoded.toLowerCase());

    // 3. Duplicate patterns -> canonical page
    const seg = target.split("/").filter(Boolean);
    if (seg[0] === country.regionsPath.slice(1) && seg.length === 2 && PROVINCES.has(seg[1])) target = `/${seg[1]}`;
    else if (seg[0] === "business-profile" && seg.length === 2) target = `/business/${seg[1]}`;
    else if (seg.length === 2 && PROVINCES.has(seg[0])) target = `/localities/${seg[0]}/${seg[1]}`;
    if (target.startsWith("/localities/")) target = target.replace(/-{2,}/g, "-");

    if (target !== path) return res.redirect(301, target + qs);

    if (PRIVATE_PATH.test(path)) res.setHeader("X-Robots-Tag", "noindex, follow");
  }
  next();
}

const dupCache = new Map<string, boolean>();
/** /localities/<province>/<slug>-2 -> /localities/<province>/<slug> when the original exists (duplicate rows in DB). */
export async function localityDuplicateRedirect(req: Request, res: Response, next: NextFunction) {
  const m = req.path.match(/^\/localities\/([a-z-]+)\/(.+)-(\d{1,2})$/);
  if (!m || (req.method !== "GET" && req.method !== "HEAD")) return next();
  const base = `${m[1]}/${m[2]}`;
  try {
    let exists = dupCache.get(base);
    if (exists === undefined) {
      const r = await pool.query("select 1 from localities where regexp_replace(slug, '-{2,}', '-', 'g') = $1 limit 1", [base]);
      exists = (r.rowCount ?? 0) > 0;
      dupCache.set(base, exists);
    }
    if (exists) return res.redirect(301, `/localities/${base}`);
  } catch (e) {
    console.error("[seoGuards] locality redirect lookup failed", e);
  }
  next();
}

/** Old-site language folders (/fr/, /es/, /de/, /ru/, /zh-cn/ …) never existed on this app: 410 Gone. */
const LEGACY_GONE = /^\/(?:af|am|ar|az|be|bg|bn|bs|ca|cs|cy|da|de|el|eo|es|et|eu|fa|fi|fr|ga|gl|gu|ha|he|hi|hr|ht|hu|hy|id|ig|is|it|ja|jv|ka|kk|km|kn|ko|ku|ky|la|lb|lo|lt|lv|mg|mi|mk|ml|mn|mr|ms|mt|my|ne|nl|no|ny|pa|pl|ps|pt|ro|ru|sd|si|sk|sl|sm|sn|so|sq|sr|st|su|sv|sw|ta|te|tg|th|tl|tr|uk|ur|uz|vi|xh|yi|yo|zh|zu|zh-cn|zh-tw|pt-br|en-gb|en-us|cn|uk|us|pk|sa|eg|qa|om|kw|bh|jo|lb|ng|ke|za|ph|bd|lk|np|ca|au|nz|sg|hk|tw|br|mx|cl|co|pe)(?:\/|$)/i;

export function legacyGone(req: Request, res: Response, next: NextFunction) {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  if (!LEGACY_GONE.test(req.path)) return next();
  res.set("X-Robots-Tag", "noindex");
  res.set("Cache-Control", "public, max-age=86400");
  res.status(410).type("html").send("<!doctype html><html><head><title>410 Gone</title><meta name=\"robots\" content=\"noindex\"></head><body><h1>This page no longer exists</h1><p>The translated pages of the old website were removed. Visit <a href=\"https://pakistanyp.com/\">pakistanyp.com</a> for Pakistan business directory.</p></body></html>");
}
