/**
 * Saudi Life (server): official rules data, guides, admin editing with an audit log, sitemap section.
 *
 * Tables (created on start, additive only):
 *   life_rules      id, data jsonb, seed_version, updated_at, updated_by      — rates and rules used by calculators
 *   life_audit_log  entity, entity_id, action, before, after, user, at        — every admin change
 * rules.json (in this folder) is the reviewed baseline: new rules are inserted, and rules nobody has edited
 * are refreshed when the file's version changes; admin edits are never overwritten.
 */
import fs from "fs";
import path from "path";
import type { Express, Request, Response, NextFunction } from "express";
import { pool } from "../../db";
import { country } from "@shared/country";
import { allLifePaths } from "../../../client/src/extensions/saudi-life/sections";

// rules.json and guides/ ship with the source: next to this file in development, ../server/... from the dist bundle
const SRC_DIR = [import.meta.dirname, path.resolve(import.meta.dirname, "..", "server", "extensions", "saudi-life"), path.resolve(process.cwd(), "server", "extensions", "saudi-life")]
  .find((d) => fs.existsSync(path.join(d, "rules.json"))) || path.resolve(process.cwd(), "server", "extensions", "saudi-life");
const read = (f: string) => fs.readFileSync(path.join(SRC_DIR, f), "utf8");

// ------------------------------------------------------------------ guides (Markdown files)
export interface Guide { slug: string; collection: string; meta: Record<string, string>; html: string; links: { name: string; url: string }[] }
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const inline = (s: string) => esc(s)
  .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, t, u) => `<a href="${u}" target="_blank" rel="noopener noreferrer nofollow">${t}</a>`);

/** Small, safe Markdown renderer (escapes HTML; headings, lists incl. Arabic-numbered, bold, http(s) links). */
export function renderMarkdown(md: string): string {
  const out: string[] = [];
  let list: "ul" | "ol" | null = null, para: string[] = [];
  const flushP = () => { if (para.length) { out.push(`<p>${inline(para.join(" "))}</p>`); para = []; } };
  const flushL = () => { if (list) { out.push(`</${list}>`); list = null; } };
  for (const raw of md.replace(/<!--[\s\S]*?-->/g, "").split("\n")) {
    const t = raw.trim();
    if (!t) { flushP(); continue; }
    if (t.startsWith("# ")) continue; // the page already has the H1
    const h = t.match(/^(#{2,4})\s+(.*)$/);
    if (h) { flushP(); flushL(); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); continue; }
    const ol = t.match(/^([0-9٠-٩]+)[.)]\s+(.*)$/), ul = t.match(/^[-*•]\s+(.*)$/);
    if (ol || ul) {
      flushP();
      const kind = ol ? "ol" : "ul";
      if (list !== kind) { flushL(); out.push(`<${kind}>`); list = kind; }
      out.push(`<li>${inline((ol ? ol[2] : ul![1]))}</li>`);
      continue;
    }
    flushL();
    para.push(t);
  }
  flushP(); flushL();
  return out.join("\n");
}

function parseDoc(raw: string) {
  const m = raw.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n?/);
  const meta: Record<string, string> = {};
  if (m) for (const line of m[1].split("\n")) { const i = line.indexOf(":"); if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, ""); }
  return { meta, body: m ? raw.slice(m[0].length) : raw };
}

let guides: Map<string, { en: Guide; ar?: Guide }> | null = null;
export function loadGuides() {
  if (guides) return guides;
  guides = new Map();
  const base = path.join(SRC_DIR, "guides");
  if (!fs.existsSync(base)) return guides;
  for (const collection of fs.readdirSync(base)) {
    const dir = path.join(base, collection);
    for (const f of fs.readdirSync(dir).filter((x) => /^[a-z0-9-]+\.md$/.test(x))) {
      const slug = f.replace(/\.md$/, "");
      const mk = (file: string): Guide => {
        const { meta, body } = parseDoc(fs.readFileSync(path.join(dir, file), "utf8"));
        const links = (meta.officialLinks || "").split(";").map((x) => x.trim()).filter(Boolean).map((x) => { const [name, url] = x.split("|"); return { name: (name || "").trim(), url: (url || "").trim() }; }).filter((l) => /^https:\/\//.test(l.url));
        return { slug, collection, meta, html: renderMarkdown(body), links };
      };
      guides.set(`${collection}/${slug}`, { en: mk(f), ar: fs.existsSync(path.join(dir, `${slug}.ar.md`)) ? mk(`${slug}.ar.md`) : undefined });
    }
  }
  return guides;
}
export const guideSlugs = (collection: string) => [...loadGuides().keys()].filter((k) => k.startsWith(`${collection}/`)).map((k) => k.split("/")[1]);

// ------------------------------------------------------------------ rules
interface RuleRow { id: string; data: any; updated_at: string; updated_by: string | null }
let cache: { at: number; body: any } | null = null;

export async function startSaudiLife() {
  await pool.query(`create table if not exists life_rules (id text primary key, data jsonb not null, seed_version text, updated_at timestamptz not null default now(), updated_by text)`);
  await pool.query(`create table if not exists life_audit_log (id serial primary key, entity text not null, entity_id text not null, action text not null,
    before jsonb, after jsonb, user_id text, user_email text, at timestamptz not null default now())`);
  await pool.query(`create index if not exists life_audit_log_entity_idx on life_audit_log (entity, entity_id, at desc)`);
  const file = JSON.parse(read("rules.json"));
  const existing = new Map((await pool.query("select id, seed_version, updated_by from life_rules")).rows.map((r: any) => [r.id, r]));
  let added = 0, refreshed = 0;
  for (const [id, data] of Object.entries<any>(file.rules)) {
    const row: any = existing.get(id);
    if (!row) {
      await pool.query("insert into life_rules (id, data, seed_version, updated_by) values ($1, $2, $3, 'seed')", [id, data, file.version]);
      added++;
    } else if (row.updated_by === "seed" && row.seed_version !== file.version) {
      await pool.query("update life_rules set data = $2, seed_version = $3, updated_at = now() where id = $1", [id, data, file.version]);
      refreshed++;
    }
  }
  cache = null;
  loadGuides();
  if (added || refreshed) console.log(`[saudi-life] rules: +${added}, ${refreshed} refreshed from rules.json ${file.version}`);
}

async function publicRules() {
  if (cache && Date.now() - cache.at < 60 * 1000) return cache.body;
  const rows = (await pool.query("select id, data, updated_at from life_rules")).rows as RuleRow[];
  const rules: Record<string, any> = {};
  let updatedAt = "";
  for (const r of rows) { rules[r.id] = { id: r.id, ...r.data }; const u = new Date(r.updated_at).toISOString(); if (u > updatedAt) updatedAt = u; }
  cache = { at: Date.now(), body: { rules, updatedAt } };
  return cache.body;
}

// ------------------------------------------------------------------ access control & limits
const EDIT_ROLES = ["super_admin", "admin", "content_manager"];
const READ_ROLES = [...EDIT_ROLES, "moderator", "business_manager"];
const sessionUser = (req: Request): any => (req as any).session?.user || ((req as any).isAuthenticated?.() ? (req as any).user : undefined);
const requireRole = (roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
  const u = sessionUser(req);
  if (!u) return res.status(401).json({ message: "Sign in required" });
  if (!roles.includes(u.role)) return res.status(403).json({ message: "Not allowed" });
  next();
};
const hits = new Map<string, { n: number; reset: number }>();
const rateLimit = (max: number, windowMs: number) => (req: Request, res: Response, next: NextFunction) => {
  const key = `${req.ip}:${req.path.split("/").slice(0, 4).join("/")}`;
  const now = Date.now(), h = hits.get(key);
  if (!h || h.reset < now) { hits.set(key, { n: 1, reset: now + windowMs }); return next(); }
  if (++h.n > max) { res.setHeader("Retry-After", Math.ceil((h.reset - now) / 1000)); return res.status(429).json({ message: "Too many requests" }); }
  next();
};
setInterval(() => { const now = Date.now(); for (const [k, h] of hits) if (h.reset < now) hits.delete(k); }, 5 * 60 * 1000).unref?.();

const RULE_FIELDS = ["summary_en", "summary_ar", "values", "effectiveFrom", "sources", "confidence", "verifiedOn", "notes"];
function validateRule(body: any): string | null {
  if (!body || typeof body !== "object") return "Body must be an object";
  if (JSON.stringify(body).length > 200_000) return "Rule is too large";
  if (typeof body.values !== "object" || body.values === null) return "values must be an object";
  if (!Array.isArray(body.sources) || body.sources.some((s: any) => !s || typeof s.url !== "string" || !/^https:\/\//.test(s.url) || typeof s.title !== "string")) return "sources must be a list of {title, url (https)}";
  if (body.confidence && !["confirmed", "secondary", "unconfirmed"].includes(body.confidence)) return "confidence must be confirmed, secondary or unconfirmed";
  for (const d of ["verifiedOn", "effectiveFrom"]) if (body[d] && !/^\d{4}-\d{2}-\d{2}$/.test(body[d])) return `${d} must be YYYY-MM-DD`;
  return null;
}

// ------------------------------------------------------------------ routes
export function registerSaudiLifeRoutes(app: Express) {
  app.get("/api/life/rules", rateLimit(240, 60 * 1000), async (_req, res) => {
    try { res.set("Cache-Control", "public, max-age=300").json(await publicRules()); }
    catch (e: any) { console.error("[saudi-life] rules", e?.message); res.status(503).json({ message: "Rules unavailable" }); }
  });

  app.get("/api/life/guides/:collection", rateLimit(240, 60 * 1000), (req, res) => {
    const lang = String(req.headers["x-lang"] || "") === "ar" ? "ar" : "en";
    const list = [...loadGuides().entries()].filter(([k]) => k.startsWith(`${req.params.collection}/`)).map(([, g]) => {
      const doc = (lang === "ar" && g.ar) || g.en;
      return { slug: doc.slug, title: doc.meta.title, summary: doc.meta.summary, lastVerified: doc.meta.lastVerified };
    });
    res.set("Cache-Control", "public, max-age=600").json(list);
  });

  app.get("/api/life/guides/:collection/:slug", rateLimit(240, 60 * 1000), (req, res) => {
    const g = loadGuides().get(`${req.params.collection}/${req.params.slug}`);
    if (!g) return res.status(404).json({ message: "Guide not found" });
    const lang = String(req.headers["x-lang"] || "") === "ar" ? "ar" : "en";
    const doc = (lang === "ar" && g.ar) || g.en;
    res.set("Cache-Control", "public, max-age=600").json({ ...doc, lang: doc === g.ar ? "ar" : "en" });
  });

  // Admin (English only, role-based). Editors change rules; reviewers can read rules and the audit log.
  app.get("/api/admin/life/rules", requireRole(READ_ROLES), async (_req, res) => {
    const rows = (await pool.query("select id, data, seed_version, updated_at, updated_by from life_rules order by id")).rows;
    res.json(rows);
  });
  app.put("/api/admin/life/rules/:id", requireRole(EDIT_ROLES), rateLimit(60, 60 * 1000), async (req, res) => {
    const id = String(req.params.id);
    if (!/^[a-z0-9_]{2,80}$/.test(id)) return res.status(400).json({ message: "Invalid rule id" });
    const body = Object.fromEntries(Object.entries(req.body || {}).filter(([k]) => RULE_FIELDS.includes(k)));
    const err = validateRule(body);
    if (err) return res.status(400).json({ message: err });
    const u = sessionUser(req);
    const before = (await pool.query("select data from life_rules where id = $1", [id])).rows[0]?.data ?? null;
    await pool.query(`insert into life_rules (id, data, updated_by, updated_at) values ($1, $2, $3, now())
      on conflict (id) do update set data = excluded.data, updated_by = excluded.updated_by, updated_at = now()`, [id, body, u.email || u.id]);
    await pool.query("insert into life_audit_log (entity, entity_id, action, before, after, user_id, user_email) values ('rule', $1, $2, $3, $4, $5, $6)",
      [id, before ? "update" : "create", before, body, u.id, u.email || null]);
    cache = null;
    res.json({ ok: true });
  });
  app.get("/api/admin/life/audit", requireRole(READ_ROLES), async (req, res) => {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const rows = (await pool.query("select id, entity, entity_id, action, before, after, user_email, at from life_audit_log order by at desc limit $1", [limit])).rows;
    res.json(rows);
  });
}

// ------------------------------------------------------------------ sitemap
export const lifeSitemap = {
  file: "sitemap-saudi-life.xml",
  lastmod: async () => {
    const r = (await pool.query("select max(updated_at) as m from life_rules")).rows[0]?.m;
    return (r ? new Date(r) : new Date("2026-11-03")).toISOString().slice(0, 10);
  },
  generate: async () => {
    const lastmod = await lifeSitemap.lastmod();
    const L = country.secondLanguage;
    const urls = allLifePaths(guideSlugs("expat")).flatMap((p) => {
      const en = `${country.origin}${p}`, ar = L ? `${country.origin}/${L.code}${p}` : null;
      const alt = ar ? `\n    <xhtml:link rel="alternate" hreflang="en" href="${en}"/>\n    <xhtml:link rel="alternate" hreflang="${L!.code}" href="${ar}"/>\n    <xhtml:link rel="alternate" hreflang="x-default" href="${en}"/>` : "";
      const entry = (loc: string) => `  <url>\n    <loc>${loc}</loc>${alt}\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
      return ar ? [entry(en), entry(ar)] : [entry(en)];
    });
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>`;
  },
};
