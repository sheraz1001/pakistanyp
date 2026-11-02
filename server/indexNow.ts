import crypto from "crypto";
import type { Express } from "express";
import { pool } from "./db";
import { country, regionUrl } from "@shared/country";

/**
 * Automatic search-engine updates.
 *
 * The sitemaps (/sitemap.xml and its sections) are generated live from the database,
 * so they always include new businesses, news, blog posts, categories, cities,
 * localities and provinces, whether added in the admin panel or by users.
 *
 * On top of that, this watcher checks the database every few minutes for anything
 * new or changed and notifies IndexNow (Bing, Yandex, Seznam, Naver...) so those
 * pages are crawled within minutes. Google reads the sitemap on its own schedule
 * (it no longer accepts sitemap pings).
 *
 * Env: INDEXNOW_KEY (optional, a stable key is derived from the domain),
 *      INDEXNOW_DISABLED=true to turn it off, INDEXNOW_INTERVAL_MINUTES (default 10).
 */
export const INDEXNOW_KEY =
  (process.env.INDEXNOW_KEY || "").trim() ||
  crypto.createHash("sha256").update(`${country.domain}:indexnow`).digest("hex").slice(0, 32);

/** IndexNow proves site ownership with a text file at /<key>.txt containing the key. */
export function registerIndexNowKeyRoute(app: Express) {
  app.get(`/${INDEXNOW_KEY}.txt`, (_req, res) => {
    res.type("text/plain").set("Cache-Control", "public, max-age=86400").send(INDEXNOW_KEY);
  });
}

const PUBLISHED_BUSINESS = "coalesce(b.is_active, true) and (b.admin_approved = true or b.admin_approved is null)";

/** Public URLs of everything created or changed after `since`. */
export async function changedUrlsSince(since: Date): Promise<string[]> {
  const urls = new Set<string>();
  const q = async (text: string) => (await pool.query(text, [since])).rows as any[];
  const placePath = (slug: string, isCity: boolean) => (isCity ? `/cities/${slug.split("/").pop()}` : `/localities/${slug}`);

  // Businesses, and the locality / city pages that list them
  for (const r of await q(`
    select b.slug, l.slug as loc_slug, (l.is_main_area and l.parent_id is null) as loc_is_city, c.slug as city_slug
    from businesses b
    left join localities l on l.id = b.locality_id
    left join localities c on c.id = l.parent_id
    where ${PUBLISHED_BUSINESS} and b.slug is not null and greatest(b.updated_at, b.created_at) > $1
    limit 5000`)) {
    urls.add(`/business/${r.slug}`);
    if (r.loc_slug) urls.add(placePath(r.loc_slug, !!r.loc_is_city));
    if (r.city_slug) urls.add(placePath(r.city_slug, true));
  }
  for (const r of await q(`select slug from news_articles where slug is not null and coalesce(is_active, true)
      and coalesce(status, 'published') = 'published' and greatest(updated_at, published_at, created_at) > $1 limit 2000`)) urls.add(`/news/${r.slug}`);
  for (const r of await q(`select slug from blog_posts where slug is not null and published_at is not null
      and (status = 'published' or (status is null and coalesce(is_published, true)))
      and greatest(updated_at, published_at, created_at) > $1 limit 2000`)) urls.add(`/blogs/${r.slug}`);
  for (const r of await q(`select slug from categories where slug is not null and coalesce(is_active, true)
      and greatest(updated_at, created_at) > $1 limit 2000`)) urls.add(`/categories/${r.slug}`);
  for (const r of await q(`select slug, (is_main_area and parent_id is null) as is_city from localities
      where slug is not null and coalesce(is_active, true) and greatest(updated_at, created_at) > $1 limit 2000`)) urls.add(placePath(r.slug, !!r.is_city));
  for (const r of await q(`select name from provinces where coalesce(is_active, true) and greatest(updated_at, created_at) > $1`)) urls.add(regionUrl(r.name));

  return [...urls];
}

/** Send URLs to IndexNow (shared endpoint, forwarded to all participating engines). */
export async function submitToIndexNow(paths: string[]): Promise<{ ok: boolean; status?: number; count: number }> {
  if (!paths.length) return { ok: true, count: 0 };
  const host = new URL(country.origin).host;
  const urlList = paths.slice(0, 10000).map((p) => (p.startsWith("http") ? p : `${country.origin}${p}`));
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation: `${country.origin}/${INDEXNOW_KEY}.txt`, urlList }),
  });
  return { ok: res.ok, status: res.status, count: urlList.length };
}

let started = false;

/** Start the background watcher (production only). */
export function startSitemapWatcher() {
  if (started) return;
  started = true;
  if (process.env.NODE_ENV !== "production" || process.env.INDEXNOW_DISABLED === "true") return;
  if (/localhost|127\.0\.0\.1/.test(country.origin)) return;
  const minutes = Math.max(2, Number(process.env.INDEXNOW_INTERVAL_MINUTES) || 10);
  // Start a little in the past so changes made just before a restart are not missed
  let since = new Date(Date.now() - minutes * 60 * 1000);

  const tick = async () => {
    const now = new Date();
    try {
      const urls = await changedUrlsSince(since);
      if (urls.length) {
        const result = await submitToIndexNow(urls);
        console.log(`[indexnow] ${result.count} changed page(s) submitted (HTTP ${result.status})`);
      }
      since = now;
    } catch (error: any) {
      console.warn("[indexnow] check failed, will retry:", error?.message || error);
    }
  };
  setTimeout(tick, 60 * 1000).unref?.();
  setInterval(tick, minutes * 60 * 1000).unref?.();
  console.log(`[indexnow] watching for new and changed pages every ${minutes} min`);
}
