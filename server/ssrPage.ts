import { country, localize } from "@shared/country";
/**
 * Builds the final SSR HTML document (added in the Oct 2026 SEO audit).
 *
 * Before: page-specific <title>/<meta>/<link> from Helmet were appended *after*
 * the generic defaults in index.html, so every page shipped two titles, two
 * descriptions and a generic one won. 404 pages returned 200.
 */
import { PRIVATE_PATH } from "./middleware/seoGuards";

export const SITE_ORIGIN = process.env.SITE_ORIGIN || country.origin;

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function escapeJsonForScript(json: string): string {
  return json.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026").replace(/'/g, "\\u0027");
}

/** Canonical form of a path: lowercase, no trailing slash, only ?page=N kept (N>1). */
export function canonicalFor(url: string): string {
  const u = new URL(url, SITE_ORIGIN);
  let path = decodeURIComponent(u.pathname).toLowerCase().replace(/\/{2,}/g, "/");
  if (path.length > 1) path = path.replace(/\/+$/, "");
  const page = parseInt(u.searchParams.get("page") || "", 10);
  const qs = page > 1 ? `?page=${page}` : "";
  return SITE_ORIGIN + (path === "/" ? "/" : encodeURI(path)) + qs;
}

function removeTag(html: string, re: RegExp) {
  return html.replace(re, "");
}


const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}${country.ogImage}`;

const decodeEntities = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const attr = (s: string) => decodeEntities(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const absoluteUrl = (u: string) => (/^https?:\/\//i.test(u) ? u : SITE_ORIGIN + (u.startsWith("/") ? u : "/" + u));

function metaContent(html: string, kind: "name" | "property", key: string): string | null {
  const re = new RegExp(`<meta[^>]+${kind}="${esc(key)}"[^>]*>`, "i");
  const tag = html.match(re)?.[0];
  return tag ? (tag.match(/content="([^"]*)"/i)?.[1] ?? null) : null;
}

/** Remove empty/"undefined" values that broken page data leaves in JSON-LD. */
function cleanLd(v: any): any {
  if (Array.isArray(v)) return v.map(cleanLd).filter((x) => x !== undefined);
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v)) {
      const c = cleanLd(val);
      if (c === undefined || c === null || c === "") continue;
      if (typeof c === "string" && /^(undefined|null)( (undefined|null))*$/i.test(c.trim())) continue;
      if (typeof c === "object" && !Array.isArray(c) && Object.keys(c).filter((x) => x !== "@type").length === 0) continue;
      out[k] = c;
    }
    return out;
  }
  return v;
}

/**
 * JSON-LD hygiene for the final document: drop blocks that are not valid JSON,
 * strip empty values, and keep exactly one Organization (the site-wide one).
 */
export function normalizeJsonLd(html: string): string {
  let seenOrg = false;
  return html.replace(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>\s*/gi, (_m, body) => {
    let data: any;
    try {
      data = JSON.parse(decodeEntities(body.trim()));
    } catch {
      return "";
    }
    const items: any[] = Array.isArray(data) ? data : data?.["@graph"] ? data["@graph"] : [data];
    const kept = items.map(cleanLd).filter((it) => {
      if (!it || typeof it !== "object") return false;
      if (it["@type"] === "Organization") {
        if (seenOrg) return false;
        seenOrg = true;
        Object.assign(it, countryOrganization());
      }
      return Object.keys(it).some((k) => !k.startsWith("@"));
    });
    if (!kept.length) return "";
    return kept
      .map((it) => {
        const obj = it["@context"] ? it : { "@context": "https://schema.org", ...it };
        return `<script type="application/ld+json">${escapeJsonForScript(JSON.stringify(obj))}</script>\n`;
      })
      .join("");
  });
}

/** Site-wide Organization for the active country (replaces Pakistan one in index.html). */
function countryOrganization() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_ORIGIN}/#organization`,
    name: country.brand,
    alternateName: country.directoryName,
    description: `Business directory for ${country.name}: find, compare and contact companies across all ${country.regions.length} ${country.regionTerm.plural.toLowerCase()}.`,
    url: SITE_ORIGIN,
    logo: { "@type": "ImageObject", url: SITE_ORIGIN + country.logo.full, width: country.logo.width, height: country.logo.height },
    areaServed: { "@type": "Country", name: country.name.replace(/^the /, "") },
    contactPoint: { "@type": "ContactPoint", contactType: "customer service", email: country.contact.email, availableLanguage: ["English"] },
    ...(country.social.length ? { sameAs: country.social.map((s) => s.href) } : {}),
  };
}

/** index.html is written for PakistanYP; kept as a hook for template-level changes. */
export function countryTemplate(template: string): string {
  return template;
}

export interface ComposeInput {
  url: string;
  appHtml: string;
  helmet?: any;
  dehydratedState: unknown;
  notFound?: boolean;
  isProduction?: boolean;
  routes?: string[];
}

export function composeSSRPage(template: string, input: ComposeInput): { status: number; html: string } {
  const { helmet, appHtml, url } = input;
  const notFound = !!input.notFound || appHtml.includes("data-page-not-found");

  const parts = helmet
    ? {
        title: helmet.title?.toString() || "",
        meta: helmet.meta?.toString() || "",
        link: helmet.link?.toString() || "",
        script: helmet.script?.toString() || "",
      }
    : { title: "", meta: "", link: "", script: "" };

  let html = countryTemplate(template);

  // 1. Page title wins over the template default
  const hasTitle = /<title[^>]*>[^<]+<\/title>/i.test(parts.title);
  if (hasTitle) html = removeTag(html, /<title[^>]*>[\s\S]*?<\/title>\s*/i);
  else parts.title = "";

  // 2. Each page <meta name|property=X> replaces the template's X
  for (const m of parts.meta.matchAll(/<meta[^>]+(?:name|property)="([^"]+)"[^>]*>/gi)) {
    html = removeTag(html, new RegExp(`<meta[^>]+(?:name|property)="${esc(m[1])}"[^>]*>\\s*`, "gi"));
  }

  // 3. Exactly one self-referencing canonical + matching og:url.
  //    (Page-level canonicals were sometimes wrong, e.g. localities pointing to
  //    /localities/<slug>-<province>-<id>, a URL that doesn't exist. Duplicate URLs
  //    are handled with 301 redirects instead.)
  const canonical = canonicalFor(url);
  parts.link = parts.link.replace(/<link[^>]+rel="canonical"[^>]*>\s*/gi, "");
  html = removeTag(html, /<link[^>]+rel="canonical"[^>]*>\s*/gi);
  html = removeTag(html, /<meta[^>]+property="og:url"[^>]*>\s*/gi);
  parts.meta = parts.meta.replace(/<meta[^>]+property="og:url"[^>]*>\s*/gi, "");
  let extra = `<link rel="canonical" href="${canonical}" />\n<meta property="og:url" content="${canonical}" />`;

  // 4. 404 pages and private/utility pages must not be indexable
  const pathOnly = new URL(url, SITE_ORIGIN).pathname;
  if (notFound || PRIVATE_PATH.test(pathOnly)) {
    html = removeTag(html, /<meta[^>]+name="robots"[^>]*>\s*/gi);
    parts.meta = parts.meta.replace(/<meta[^>]+name="robots"[^>]*>\s*/gi, "");
    extra = `<meta name="robots" content="noindex, follow" />`;
  }

  // 5. Never ship the Replit dev banner to production
  if (input.isProduction) html = removeTag(html, /<script[^>]+replit-dev-banner[^>]*><\/script>\s*/gi);

  // 6. Complete, page-specific social tags. Keys the page did not set fall back to
  //    the page's own title/description instead of the homepage defaults in index.html.
  const pageTitle = decodeEntities((parts.title.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || "").trim());
  const pageDesc = decodeEntities(metaContent(parts.meta, "name", "description") ?? metaContent(html, "name", "description") ?? "");
  const pageOg = (key: string) => metaContent(parts.meta, "property", key);
  const pageTw = (key: string) => metaContent(parts.meta, "name", key);
  const ogTitle = decodeEntities(pageOg("og:title") ?? pageTitle);
  const ogDesc = decodeEntities(pageOg("og:description") ?? pageDesc);
  // /api/og-image/* was never implemented; such values (stored on some localities) fall back to the default card
  const usable = (u: string | null) => (u && !/\/api\/og-image\//.test(u) ? u : null);
  const ogImage = absoluteUrl(decodeEntities(usable(pageOg("og:image")) || usable(pageTw("twitter:image")) || DEFAULT_OG_IMAGE));
  const social: [string, string, string][] = [
    ["property", "og:title", ogTitle],
    ["property", "og:description", ogDesc],
    ["property", "og:image", ogImage],
    ["property", "og:type", decodeEntities(pageOg("og:type") ?? "website")],
    ["name", "twitter:card", "summary_large_image"],
    ["name", "twitter:title", decodeEntities(pageTw("twitter:title") ?? ogTitle)],
    ["name", "twitter:description", decodeEntities(pageTw("twitter:description") ?? ogDesc)],
    ["name", "twitter:image", absoluteUrl(decodeEntities(usable(pageTw("twitter:image")) || ogImage))],
  ];
  for (const [kind, key, value] of social) {
    const re = new RegExp(`<meta[^>]+${kind}="${esc(key)}"[^>]*>\\s*`, "gi");
    html = removeTag(html, re);
    parts.meta = parts.meta.replace(re, "");
    if (value) extra += `\n<meta ${kind}="${key}" content="${attr(value)}" />`;
  }
  // GA4 in the HTML itself (runtime env; previously only injected client-side from a
  // build-time variable, so it never loaded when that was missing at build time).
  const gaId = (process.env.GA_MEASUREMENT_ID || process.env.VITE_GA_MEASUREMENT_ID || "").trim();
  if (gaId && /^G-[A-Z0-9]+$/i.test(gaId)) {
    extra += `\n<script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>` +
      `\n<script>window.__GA_ID__=${JSON.stringify(gaId)};window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(gaId)});</script>`;
  }

  // Optional Search Console verification token (set GOOGLE_SITE_VERIFICATION)
  html = removeTag(html, /<meta[^>]+name="google-site-verification"[^>]*>\s*/gi);
  if (process.env.GOOGLE_SITE_VERIFICATION) {
    extra += `\n<meta name="google-site-verification" content="${attr(process.env.GOOGLE_SITE_VERIFICATION)}" />`;
  }

  const headTags = [parts.title, parts.meta, parts.link, parts.script, extra].filter(Boolean).join("\n");
  const stateScript = `<script>window.__SSR_RENDERED__ = true;${notFound ? "window.__SSR_NOT_FOUND__ = true;" : ""}window.__SSR_ROUTES__ = ${escapeJsonForScript(JSON.stringify(input.routes || []))};window.__REACT_QUERY_STATE__ = ${escapeJsonForScript(
    JSON.stringify(input.dehydratedState ?? {})
  )};</script>`;

  html = html.replace("<!--ssr-head-->", headTags);
  html = html.replace("<!--ssr-outlet-->", appHtml);
  html = html.replace("<!--ssr-state-->", stateScript);
  html = normalizeJsonLd(html);
  return { status: notFound ? 404 : 200, html };
}
