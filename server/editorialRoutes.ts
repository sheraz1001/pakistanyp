import type { Express } from "express";
import { pool } from "./db";

/**
 * Public endpoints for the Blogs and News sections.
 *
 *   GET /api/editorial/:kind?category=<slug>&tag=<tag>&q=<text>&page=<n>&limit=<n>
 *       -> { items, total, page, pages, featured, categories, tags, popular, recent }
 *   GET /api/editorial/:kind/:slug
 *       -> { article, related, previous, next, categories, popular, recent, tags }
 *
 * kind = "blogs" | "news". Only published content is returned.
 */

type Kind = "blogs" | "news";

export const categorySlug = (name: string) =>
  String(name || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "general";

const SOURCES: Record<Kind, { table: string; published: string; select: string }> = {
  blogs: {
    table: "blog_posts b",
    published: "(b.status = 'published' or (b.status is null and coalesce(b.is_published, false))) and coalesce(b.published_at, b.created_at) <= now()",
    select: `b.id, b.slug, b.title, b.excerpt as summary, b.featured_image as image, coalesce(nullif(trim(b.category), ''), 'General') as category,
      coalesce(b.published_at, b.created_at) as "publishedAt", b.updated_at as "updatedAt", coalesce(b.view_count, 0) as views,
      coalesce(b.is_featured, false) as featured, b.reading_time as "readingTime",
      coalesce((select array_agg(t) from jsonb_array_elements_text(case when jsonb_typeof(b.tags) = 'array' then b.tags else '[]'::jsonb end) t), '{}') as tags,
      nullif(trim(concat_ws(' ', u.first_name, u.last_name)), '') as author`,
  },
  news: {
    table: "news_articles b",
    published: "coalesce(b.is_active, true) and coalesce(b.status, 'published') = 'published' and coalesce(b.published_at, b.created_at) <= now()",
    select: `b.id, b.slug, b.title, b.summary, b.image_url as image, coalesce(nullif(trim(b.category), ''), 'News') as category,
      coalesce(b.published_at, b.created_at) as "publishedAt", b.updated_at as "updatedAt", coalesce(b.view_count, 0) as views,
      coalesce(b.is_featured, false) as featured, null::int as "readingTime", coalesce(b.tags, '{}') as tags,
      coalesce(nullif(trim(b.author), ''), 'PakistanYP Editorial') as author`,
  },
};

const fromClause = (kind: Kind) => kind === "blogs" ? `${SOURCES.blogs.table} left join users u on u.id = b.author_id` : SOURCES.news.table;

function shape(row: any) {
  const words = row.content ? String(row.content).replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length : 0;
  return {
    ...row,
    categorySlug: categorySlug(row.category),
    tags: (row.tags || []).filter(Boolean),
    readingTime: row.readingTime || (words ? Math.max(1, Math.round(words / 200)) : null),
  };
}

async function sidebar(kind: Kind) {
  const s = SOURCES[kind];
  const from = fromClause(kind);
  const [cats, popular, recent, tags] = await Promise.all([
    pool.query(`select coalesce(nullif(trim(b.category), ''), '${kind === "blogs" ? "General" : "News"}') as name, count(*)::int as count
                from ${from} where ${s.published} group by 1 order by 2 desc, 1`),
    pool.query(`select ${s.select} from ${from} where ${s.published} order by coalesce(b.view_count, 0) desc, coalesce(b.published_at, b.created_at) desc limit 5`),
    pool.query(`select ${s.select} from ${from} where ${s.published} order by coalesce(b.published_at, b.created_at) desc limit 5`),
    pool.query(`select t as tag, count(*)::int as count from (select unnest(tags) as t from (select ${s.select} from ${from} where ${s.published}) x) y
                group by t order by 2 desc, 1 limit 24`),
  ]);
  return {
    categories: cats.rows.map((c: any) => ({ ...c, slug: categorySlug(c.name) })),
    popular: popular.rows.map(shape),
    recent: recent.rows.map(shape),
    tags: tags.rows,
  };
}

export function registerEditorialRoutes(app: Express) {
  app.get("/api/editorial/:kind", async (req, res, next) => {
    const kind = req.params.kind as Kind;
    if (kind !== "blogs" && kind !== "news") return next();
    try {
      const s = SOURCES[kind];
      const from = fromClause(kind);
      const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 9));
      const page = Math.max(1, Number(req.query.page) || 1);
      const where = [s.published];
      const params: any[] = [];
      const cat = String(req.query.category || "").trim();
      const tag = String(req.query.tag || "").trim();
      const q = String(req.query.q || "").trim();
      const side = await sidebar(kind);
      if (cat) {
        const match = side.categories.find((c: any) => c.slug === cat);
        if (!match) return res.status(404).json({ message: "Category not found" });
        params.push(match.name);
        where.push(`coalesce(nullif(trim(b.category), ''), '${kind === "blogs" ? "General" : "News"}') = $${params.length}`);
      }
      if (tag) {
        params.push(tag.toLowerCase());
        where.push(kind === "blogs"
          ? `exists (select 1 from jsonb_array_elements_text(case when jsonb_typeof(b.tags) = 'array' then b.tags else '[]'::jsonb end) t where lower(t) = $${params.length})`
          : `exists (select 1 from unnest(b.tags) t where lower(t) = $${params.length})`);
      }
      if (q) {
        params.push(`%${q}%`);
        where.push(`(b.title ilike $${params.length} or ${kind === "blogs" ? "b.excerpt" : "b.summary"} ilike $${params.length} or b.content ilike $${params.length})`);
      }
      const whereSql = where.join(" and ");
      const total = (await pool.query(`select count(*)::int as n from ${from} where ${whereSql}`, params)).rows[0].n;
      const items = (await pool.query(
        `select ${s.select}, b.content from ${from} where ${whereSql}
         order by coalesce(b.published_at, b.created_at) desc, b.id desc limit ${limit} offset ${(page - 1) * limit}`, params)).rows
        .map((r: any) => { const { content, ...rest } = shape(r); return rest; });
      const featuredRow = !cat && !tag && !q && page === 1
        ? (await pool.query(`select ${s.select}, b.content from ${from} where ${s.published} order by coalesce(b.is_featured, false) desc, coalesce(b.published_at, b.created_at) desc limit 1`)).rows[0]
        : null;
      const featured = featuredRow ? (({ content, ...rest }) => rest)(shape(featuredRow)) : null;
      res.json({
        items: featured ? items.filter((i: any) => i.id !== featured.id) : items,
        featured, total, page, pages: Math.max(1, Math.ceil(total / limit)), ...side,
      });
    } catch (error) {
      console.error(`Error listing ${kind}:`, error);
      res.status(500).json({ message: "Failed to load articles" });
    }
  });

  app.get("/api/editorial/:kind/:slug", async (req, res, next) => {
    const kind = req.params.kind as Kind;
    if (kind !== "blogs" && kind !== "news") return next();
    try {
      const s = SOURCES[kind];
      const from = fromClause(kind);
      const extra = kind === "blogs"
        ? `b.content, b.meta_title as "metaTitle", b.meta_description as "metaDescription", b.og_image as "ogImage"`
        : `b.content, b.meta_title as "metaTitle", b.meta_description as "metaDescription", b.source, b.source_url as "sourceUrl"`;
      const row = (await pool.query(`select ${s.select}, ${extra} from ${from} where ${s.published} and b.slug = $1 limit 1`, [req.params.slug])).rows[0];
      if (!row) return res.status(404).json({ message: "Article not found" });
      const article = shape(row);
      pool.query(`update ${kind === "blogs" ? "blog_posts" : "news_articles"} set view_count = coalesce(view_count, 0) + 1 where id = $1`, [article.id]).catch(() => {});
      const [related, previous, next2, side] = await Promise.all([
        pool.query(`select ${s.select} from ${from} where ${s.published} and b.id <> $1
                    order by (coalesce(nullif(trim(b.category), ''), '') = $2) desc, coalesce(b.published_at, b.created_at) desc limit 3`, [article.id, row.category]),
        pool.query(`select b.slug, b.title from ${from} where ${s.published} and coalesce(b.published_at, b.created_at) < $1 order by coalesce(b.published_at, b.created_at) desc limit 1`, [article.publishedAt]),
        pool.query(`select b.slug, b.title from ${from} where ${s.published} and coalesce(b.published_at, b.created_at) > $1 order by coalesce(b.published_at, b.created_at) asc limit 1`, [article.publishedAt]),
        sidebar(kind),
      ]);
      res.json({ article, related: related.rows.map(shape), previous: previous.rows[0] || null, next: next2.rows[0] || null, ...side });
    } catch (error) {
      console.error(`Error loading ${kind} article:`, error);
      res.status(500).json({ message: "Failed to load article" });
    }
  });
}
