/**
 * Second site language on the server (see shared/i18n.ts).
 *
 * - languageRouting: "/ar/..." is the same app as "/...": the prefix is removed for routing
 *   (so every existing route, redirect and SSR handler works), the language is remembered on the
 *   request, and relative redirects keep the prefix. Admin pages are English only.
 * - localizeApi: JSON from /api in the requested language (header x-lang): every field that has an
 *   Arabic twin (nameAr, arabicName, descriptionAr, meta_title_ar...) shows the twin, and names of
 *   places and categories inside other objects (categoryName, provinceName, city...) are looked up.
 * - htmlLangAttributes: <html lang dir> for the page's language.
 */
import type { Request, Response, NextFunction } from "express";
import { SECOND, SECOND_PREFIX, langOfPath, ENGLISH_ONLY } from "@shared/i18n";
import { pool } from "./db";
import { country } from "@shared/country";

export function requestLang(req: Request): string {
  if (!SECOND) return "en";
  const h = String(req.headers["x-lang"] || "").toLowerCase();
  if (h === SECOND.code) return SECOND.code;
  return (req as any).ypLang || "en";
}

export function languageRouting(req: Request, res: Response, next: NextFunction) {
  if (!SECOND) return next();
  const path = req.path;
  if (langOfPath(path) !== SECOND.code) return next();
  const rest = path === SECOND_PREFIX ? "/" : path.slice(SECOND_PREFIX.length) || "/";
  const q = req.originalUrl.indexOf("?");
  const query = q >= 0 ? req.originalUrl.slice(q) : "";
  // Admin, API and files are not translated
  if (ENGLISH_ONLY.test(rest) || rest.startsWith("/api/") || /\.[a-z0-9]{2,5}$/i.test(rest)) {
    return res.redirect(301, rest + query);
  }
  (req as any).ypLang = SECOND.code;
  req.url = rest + query;
  const redirect = res.redirect.bind(res) as any;
  (res as any).redirect = (a: any, b?: any) => {
    const [status, url] = typeof a === "number" ? [a, b] : [302, a];
    const target = typeof url === "string" && url.startsWith("/") && !url.startsWith("//") && langOfPath(url) !== SECOND!.code && !ENGLISH_ONLY.test(url) && !url.startsWith("/api/")
      ? (url === "/" ? SECOND_PREFIX : SECOND_PREFIX + url) : url;
    return redirect(status, target);
  };
  next();
}

// ------------------------------------------------------------------ API localisation
let names: Map<string, string> = new Map();
let namesLoadedAt = 0;
let loading: Promise<void> | null = null;

/** English -> second-language names of regions, cities, localities and categories (refreshed every 5 minutes). */
async function loadNames() {
  if (Date.now() - namesLoadedAt < 5 * 60 * 1000) return;
  if (loading) return loading;
  loading = (async () => {
    try {
      const rows = (await pool.query(`
        select name, arabic_name as ar from provinces where coalesce(arabic_name, '') <> ''
        union all select name, arabic_name from localities where coalesce(arabic_name, '') <> ''
        union all select name, arabic_name from categories where coalesce(arabic_name, '') <> ''
        union all select distinct trim(category), category_ar from blog_posts where coalesce(category_ar, '') <> '' and coalesce(category, '') <> ''
        union all select distinct trim(category), category_ar from news_articles where coalesce(category_ar, '') <> '' and coalesce(category, '') <> ''`)).rows;
      const m = new Map<string, string>();
      for (const r of rows) {
        m.set(r.name, r.ar);
        // "Al Olaya, Riyadh" is also referred to as "Al Olaya" next to its city
        const i = r.name.lastIndexOf(", ");
        const j = r.ar.lastIndexOf("، ");
        if (i > 0 && j > 0 && !m.has(r.name.slice(0, i))) m.set(r.name.slice(0, i), r.ar.slice(0, j));
      }
      m.set(SECOND_COUNTRY_EN, SECOND_COUNTRY_AR);
      names = m;
      namesLoadedAt = Date.now();
    } catch { /* keep the previous map */ } finally { loading = null; }
  })();
  return loading;
}
const SECOND_COUNTRY_EN = country.name;
const SECOND_COUNTRY_AR = country.nameAr;

const NAME_KEYS = /^(name|category|categoryName|category_name|parentName|parent_name|provinceName|province_name|regionName|region_name|cityName|city_name|localityName|locality_name|province|region|city|locality|area|emirate|country|mainCategoryName|subcategoryName|subCategoryName|categoryLabel)$/;
const TWIN = (k: string) => [`${k}Ar`, `${k}_ar`, ...(k === "name" ? ["arabicName", "arabic_name", "nameAr", "name_ar"] : [])];
const TWIN_KEY = /(Ar|_ar)$|^arabic(Name|_name)$/;

/**
 * Place and category names stay English in the API (pages match and build links from them);
 * they are translated where they are shown (dictionary, see build). Here only free text is swapped:
 * descriptions, guides, articles, and business names that have an Arabic name.
 */
const BUSINESS_LIKE = (o: any) => "categoryId" in o || "category_id" in o || "phone" in o || "ratingAverage" in o || "rating_average" in o;
function localize(value: any, depth = 0): any {
  if (depth > 12 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) { for (let i = 0; i < value.length; i++) value[i] = localize(value[i], depth + 1); return value; }
  if (value instanceof Date) return value;
  const business = BUSINESS_LIKE(value);
  for (const k of Object.keys(value)) {
    const v = value[k];
    if (v && typeof v === "object") { value[k] = localize(v, depth + 1); continue; }
    if (typeof v !== "string" || !v || TWIN_KEY.test(k)) continue;
    if (k === "name" && !business) continue;
    const twin = TWIN(k).map((t) => value[t]).find((x) => typeof x === "string" && x.trim());
    if (twin) value[k] = twin;
  }
  return value;
}

/** Localise JSON responses of GET /api requests made in the second language. */
export function localizeApi(req: Request, res: Response, next: NextFunction) {
  if (!SECOND || req.method !== "GET" || !req.path.startsWith("/api/") || requestLang(req) !== SECOND.code) return next();
  if (/^\/api\/(admin|auth|super-admin|owner|user\b|users\b|me\b|sitemap)/.test(req.path)) return next();
  res.setHeader("Vary", "x-lang");
  const json = res.json.bind(res);
  (res as any).json = (body: any) => {
    Promise.resolve().then(() => {
      try { body = localize(JSON.parse(JSON.stringify(body))); } catch { /* send as is */ } // copy: handlers may return cached objects
      json(body);
    });
    return res;
  };
  next();
}

/** <html lang="ar" dir="rtl"> for second-language pages. */
export function htmlLangAttributes(html: string, url: string): string {
  if (!SECOND || langOfPath(url.split("?")[0]) !== SECOND.code) return html;
  return html.replace(/<html([^>]*)\blang="[^"]*"/i, `<html$1lang="${SECOND.code}" dir="${SECOND.dir}"`);
}

// ------------------------------------------------------------------ user's preferred language
const userIdOf = (req: any): string | null => req.user?.claims?.sub || req.user?.id || req.session?.user?.id || null;

/** PUT /api/user/language {language} saves the signed-in user's site language. */
export function registerLanguageRoutes(app: import("express").Express) {
  app.put("/api/user/language", async (req: any, res) => {
    const id = userIdOf(req);
    if (!id) return res.status(401).json({ message: "Not signed in" });
    const language = String(req.body?.language || "");
    if (!SECOND || ![SECOND.code, "en"].includes(language)) return res.status(400).json({ message: "Unknown language" });
    await pool.query("update users set preferred_language = $2 where id = $1", [id, language]);
    if (req.user && typeof req.user === "object") req.user.preferredLanguage = language;
    if (req.session?.user && typeof req.session.user === "object") req.session.user.preferredLanguage = language;
    res.json({ language });
  });
}

/**
 * Signed-in users always get their chosen language: a page requested in the other language
 * redirects to the same page in theirs. Returns true when it redirected.
 */
export async function preferredLanguageRedirect(req: Request, res: Response): Promise<boolean> {
  if (!SECOND || req.method !== "GET") return false;
  const id = userIdOf(req);
  if (!id) return false;
  const url = req.originalUrl;
  const path = url.split("?")[0];
  if (ENGLISH_ONLY.test(stripLangPath(path))) return false;
  try {
    const pref = (await pool.query("select preferred_language from users where id = $1", [id])).rows[0]?.preferred_language;
    if (!pref || pref === langOfPath(path)) return false;
    const target = pathInLangOf(url, pref);
    if (target === url) return false;
    res.status(302).setHeader("Location", target); // not res.redirect: that keeps the current language prefix
    res.end();
    return true;
  } catch { return false; }
}
import { pathInLang as pathInLangOf, stripLang as stripLangPath } from "@shared/i18n";

// ------------------------------------------------------------------ Arabic search
const AR_FROM = "أإآىةًٌٍَُِّْـ";
const AR_TO = "اااايه";
/** Arabic spelling variants treated as the same letter, vowel marks removed. */
export const normalizeArabic = (s: string) => s.replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[ً-ْـ]/g, "");
const hasArabic = (s: string) => /[؀-ۿ]/.test(s);

/** Spelling and plural variants of an Arabic search word (مطعم <-> مطاعم). */
function arabicVariants(word: string): string[] {
  const w = normalizeArabic(word.trim()).replace(/^ال(?=..)/, "");
  const v = new Set([w]);
  if (w.length === 4) v.add(w.slice(0, 2) + "ا" + w.slice(2));            // broken plural مطعم -> مطاعم
  if (w.length === 5 && w[2] === "ا") v.add(w.slice(0, 2) + w.slice(3));    // and back
  return [...v].filter((x) => x.length >= 2);
}

/**
 * Search condition for Arabic queries: business Arabic name/description, and businesses whose
 * category or place has a matching Arabic name. Returns null for non-Arabic queries.
 */
export function arabicSearchCondition(query: string | undefined | null) {
  if (!query || !SECOND || !hasArabic(query)) return null;
  const words = query.split(/\s+/).filter(Boolean).slice(0, 4);
  const norm = (col: any) => sql`translate(coalesce(${col}, ''), ${AR_FROM}, ${AR_TO})`;
  const perWord = words.map((word) => {
    const likes = arabicVariants(word).map((v) => `%${v}%`);
    const any = (col: any) => sql.join(likes.map((l) => sql`${norm(col)} like ${l}`), sql` or `);
    return sql`(
      (${any(sql.raw("businesses.arabic_name"))}) or (${any(sql.raw("businesses.description_ar"))}) or (${any(sql.raw("businesses.name"))})
      or businesses.category_id in (select c.id from categories c where (${any(sql.raw("c.arabic_name"))})
           or c.parent_id in (select p.id from categories p where (${any(sql.raw("p.arabic_name"))})))
      or businesses.locality_id in (select l.id from localities l where (${any(sql.raw("l.arabic_name"))})
           or l.parent_id in (select c2.id from localities c2 where (${any(sql.raw("c2.arabic_name"))})))
      or businesses.province_id in (select pr.id from provinces pr where (${any(sql.raw("pr.arabic_name"))}))
    )`;
  });
  return sql.join(perWord, sql` and `);
}
import { sql } from "drizzle-orm";
