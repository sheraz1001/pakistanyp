import fs from "fs";
import path from "path";
import { pool } from "./db";

/**
 * Publishes the news articles and blog posts in content/news/*.md and content/blog/*.md.
 *
 * Front matter: title, slug, summary|excerpt, category, tags (comma separated), publishedAt (ISO),
 * image, featured (true/false), metaTitle, metaDescription. The body is simple Markdown.
 *
 * An article is inserted only when no article with its slug exists yet, so once it is published,
 * edits (and deletions) made in the admin panel are never overwritten.
 */

const ROOT = path.resolve(import.meta.dirname, "..", "content");
const EDITORIAL_USER = { id: "pakistanyp-editorial", email: "editorial@pakistanyp.com", first: "PakistanYP", last: "Editorial" };

interface Doc { file: string; meta: Record<string, string>; body: string }

function readDocs(dir: string): Doc[] {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full).filter((f) => f.endsWith(".md")).sort().map((file) => {
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

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
const slugId = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Minimal Markdown to HTML: ## / ### headings, paragraphs, - and 1. lists (one nested level), **bold**. */
export function markdownToHtml(md: string): string {
  const lines = md.replace(/<!--[\s\S]*?-->/g, "").split("\n");
  const out: string[] = [];
  let para: string[] = [];
  let list: { tag: "ul" | "ol"; items: { text: string; sub: string[] }[] } | null = null;
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(" "))}</p>`); para = []; } };
  const flushList = () => {
    if (!list) return;
    out.push(`<${list.tag}>${list.items.map((it) => `<li>${inline(it.text)}${it.sub.length ? `<ul>${it.sub.map((s) => `<li>${inline(s)}</li>`).join("")}</ul>` : ""}</li>`).join("")}</${list.tag}>`);
    list = null;
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const t = line.trim();
    if (!t) { flushPara(); continue; }
    const nested = /^\s{2,}[-*] /.test(line);
    if (nested && list && list.items.length) { list.items[list.items.length - 1].sub.push(t.slice(2).trim()); continue; }
    if (t.startsWith("### ")) { flushPara(); flushList(); out.push(`<h3 id="${slugId(t.slice(4))}">${inline(t.slice(4))}</h3>`); continue; }
    if (t.startsWith("## ")) { flushPara(); flushList(); out.push(`<h2 id="${slugId(t.slice(3))}">${inline(t.slice(3))}</h2>`); continue; }
    const ul = t.match(/^[-*] (.*)$/);
    const ol = t.match(/^\d+\. (.*)$/);
    if (ul || ol) {
      flushPara();
      const tag = ul ? "ul" : "ol";
      if (!list || list.tag !== tag) { flushList(); list = { tag, items: [] }; }
      list.items.push({ text: (ul || ol)![1], sub: [] });
      continue;
    }
    flushList();
    para.push(t);
  }
  flushPara();
  flushList();
  return out.join("\n");
}

const words = (html: string) => html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
const date = (s?: string) => { const d = s ? new Date(s) : new Date(); return Number.isNaN(d.getTime()) ? new Date() : d; };

export async function publishContent(): Promise<void> {
  try {
    const news = readDocs("news");
    const blog = readDocs("blog");
    if (!news.length && !blog.length) return;
    let added = 0;

    for (const d of news) {
      const slug = d.meta.slug || d.file.replace(/\.md$/, "");
      const exists = await pool.query("select 1 from news_articles where slug = $1", [slug]);
      if (exists.rows.length) continue;
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
      if (exists.rows.length) continue;
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
    if (added) console.log(`[content] published ${added} new article(s)`);
  } catch (error: any) {
    console.error("[content] publishing failed:", error?.message || error);
  }
}
