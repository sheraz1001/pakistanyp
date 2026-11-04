import { country } from "@shared/country";
import fs from "fs";
import path from "path";
import { pool } from "./db";
import { richMarkdownToHtml } from "./richMarkdown";
import { clearApiCache } from "./apiCache";
import { meterAs } from "./dbMetrics";

/**
 * Publishes the news articles and blog posts in content/news/*.md and content/blog/*.md.
 *
 * Front matter: title, slug, summary|excerpt, category, tags (comma separated), publishedAt (ISO),
 * image, featured (true/false), metaTitle, metaDescription. The body is simple Markdown.
 *
 * An article is inserted only when no article with its slug exists yet, so once it is published,
 * edits (and deletions) made in the admin panel are never overwritten.
 *
 * Scheduling: an article whose publishedAt is in the future is not inserted until that time. A timer fires at
 * the next due time (no polling), and each published slug is recorded in content_published, so an article
 * deleted in the admin panel is not published again.
 */

const ROOT = path.resolve(import.meta.dirname, "..", "content");
const EDITORIAL_USER = { id: "pakistanyp-editorial", email: "editorial@pakistanyp.com", first: "PakistanYP", last: "Editorial" };

interface Doc { file: string; meta: Record<string, string>; body: string }
const L2 = country.secondLanguage?.code; // "<name>.<code>.md" = second-language version of "<name>.md"
const isSecond = (d: Doc) => !!L2 && d.file.endsWith(`.${L2}.md`);

function readDocs(dir: string): Doc[] {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full).filter((f) => /^[^.]+\.md$/.test(f) || (L2 && f.endsWith(`.${L2}.md`))).sort().map((file) => {
    const raw = fs.readFileSync(path.join(full, file), "utf8").replace(/\r\n/g, "\n");
    const meta: Record<string, string> = {};
    let body = raw;
    const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
    if (m) {
      for (const line of m[1].split("\n")) {
        const i = line.indexOf(":");
        if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
      }
      body = raw.slice(m[0].length);
    }
    return { file, meta, body: body.trim() };
  });
}

/** Markdown to HTML (headings, lists, links, tables, callouts, CTA banners, FAQ, infographics): server/richMarkdown.ts */
export function markdownToHtml(md: string): string { return richMarkdownToHtml(md); }

const words = (html: string) => html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
const date = (s?: string) => { const d = s ? new Date(s) : new Date(); return Number.isNaN(d.getTime()) ? new Date() : d; };

const isDue = (d: Doc, now = Date.now()) => !d.meta.publishedAt || date(d.meta.publishedAt).getTime() <= now;
let logReady = false;

export async function publishContent(): Promise<void> {
  try {
    const allNews = readDocs("news"), allBlog = readDocs("blog");
    const due = (d: Doc) => !isSecond(d) && isDue(d);
    if (!allNews.some(due) && !allBlog.some(due)) return;
    if (!logReady) {
      await pool.query("create table if not exists content_published (kind text not null, slug text not null, published_at timestamptz not null default now(), primary key (kind, slug))");
      logReady = true;
    }
    const done = new Set((await pool.query("select kind || ':' || slug as k from content_published")).rows.map((r: any) => r.k));
    const pending = (d: Doc, kind: string) => due(d) && !done.has(`${kind}:${d.meta.slug || d.file.replace(/\.md$/, "")}`);
    const news = allNews.filter((d) => pending(d, "news"));
    const blog = allBlog.filter((d) => pending(d, "blog"));
    if (!news.length && !blog.length) return;
    const record = (kind: string, slug: string) => pool.query("insert into content_published (kind, slug) values ($1, $2) on conflict do nothing", [kind, slug]);
    const fresh = new Set<string>();
    let added = 0;

    for (const d of news) {
      const slug = d.meta.slug || d.file.replace(/\.md$/, "");
      const exists = await pool.query("select 1 from news_articles where slug = $1", [slug]);
      await record("news", slug);
      if (exists.rows.length) continue;
      fresh.add(slug);
      await pool.query(
        `insert into news_articles (title, slug, summary, content, source, author, image_url, category, tags, published_at,
           is_active, is_featured, status, meta_title, meta_description, created_at, updated_at)
         values ($1,$2,$3,$4,'PakistanYP','PakistanYP Editorial',$5,$6,$7,$8,true,$9,'published',$10,$11,now(),now())`,
        [d.meta.title, slug, d.meta.summary || null, markdownToHtml(d.body), d.meta.image || null, d.meta.category || "Company News",
         (d.meta.tags || "").split(",").map((t) => t.trim()).filter(Boolean), date(d.meta.publishedAt), d.meta.featured === "true",
         d.meta.metaTitle || null, d.meta.metaDescription || null],
      );
      added++;
    }

    if (blog.length) {
      await pool.query(
        `insert into users (id, email, first_name, last_name, role, is_active, is_email_verified, created_at, updated_at)
         values ($1,$2,$3,$4,'user',true,true,now(),now()) on conflict (id) do nothing`,
        [EDITORIAL_USER.id, EDITORIAL_USER.email, EDITORIAL_USER.first, EDITORIAL_USER.last],
      );
    }
    for (const d of blog) {
      const slug = d.meta.slug || d.file.replace(/\.md$/, "");
      const exists = await pool.query("select 1 from blog_posts where slug = $1", [slug]);
      await record("blog", slug);
      if (exists.rows.length) continue;
      fresh.add(slug);
      const html = markdownToHtml(d.body);
      await pool.query(
        `insert into blog_posts (title, slug, excerpt, content, featured_image, author_id, category, meta_title, meta_description,
           is_published, is_featured, published_at, reading_time, status, og_title, og_description, og_image, tags, created_at, updated_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,$10,$11,$12,'published',$14,$15,$16,$13::jsonb,now(),now())`,
        [d.meta.title, slug, d.meta.excerpt || null, html, d.meta.image || null, EDITORIAL_USER.id, d.meta.category || "Guides",
         d.meta.metaTitle || null, d.meta.metaDescription || null, d.meta.featured === "true", date(d.meta.publishedAt),
         Math.max(1, Math.round(words(html) / 200)), JSON.stringify((d.meta.tags || "").split(",").map((t) => t.trim()).filter(Boolean)),
         d.meta.metaTitle || d.meta.title, d.meta.metaDescription || d.meta.excerpt || null, d.meta.image || null],
      );
      added++;
    }
    if (added) { console.log(`[content] published ${added} new article(s)`); clearApiCache(); }

    // Second-language versions fill the *_<code> columns once (later edits in the admin panel are kept)
    let translated = 0;
    for (const d of [...allNews, ...allBlog].filter(isSecond)) {
      const news = allNews.includes(d);
      const base = (news ? allNews : allBlog).find((x) => x.file === d.file.replace(`.${L2}.md`, ".md"));
      const slug = d.meta.slug || base?.meta.slug || d.file.replace(`.${L2}.md`, "");
      if (!fresh.has(slug)) continue; // only articles published in this run
      const table = news ? "news_articles" : "blog_posts";
      const r = await pool.query(
        `update ${table} set title_${L2} = $2, ${news ? "summary" : "excerpt"}_${L2} = $3, content_${L2} = $4, meta_title_${L2} = $5,
           meta_description_${L2} = $6, category_${L2} = $7 where slug = $1 and title_${L2} is null`,
        [slug, d.meta.title, (news ? d.meta.summary : d.meta.excerpt) || null, markdownToHtml(d.body), d.meta.metaTitle || null, d.meta.metaDescription || null, d.meta.category || null],
      );
      translated += r.rowCount || 0;
    }
    if (translated) console.log(`[content] ${translated} ${country.secondLanguage?.englishName} version(s) added`);
  } catch (error: any) {
    console.error("[content] publishing failed:", error?.message || error);
  }
}

/** Publish each scheduled article at its publishedAt time (one timer for the next due article, no polling). */
let timer: NodeJS.Timeout | null = null;
export function scheduleContent(): void {
  if (timer) clearTimeout(timer);
  const now = Date.now();
  const next = [...readDocs("news"), ...readDocs("blog")].filter((d) => !isSecond(d) && !isDue(d, now))
    .map((d) => date(d.meta.publishedAt).getTime()).sort((a, b) => a - b)[0];
  if (!next) return;
  const wait = Math.min(next - now + 5000, 24 * 3600 * 1000); // re-check at least daily (timer limit ~24 days)
  timer = setTimeout(() => { void meterAs("content", publishContent).finally(scheduleContent); }, wait);
  timer.unref?.();
  console.log(`[content] next scheduled article at ${new Date(next).toISOString()}`);
}
