import { country, regionUrl } from '@shared/country';
import categoryRedirects from "./categoryRedirects.json";
import { PRIVATE_PATH } from "./middleware/seoGuards";
import { storage } from './storage';
import { pool } from './db';

const DEPLOYED_ON = new Date().toISOString().split('T')[0];

/** Active businesses per category, counting a category's own businesses plus those of its sub-categories (2 levels). */
async function categoryBusinessCounts(): Promise<Map<number, number>> {
  const { rows } = await pool.query(`
    with own as (
      select category_id as id, count(*)::int as n from businesses
      where coalesce(is_active, true) and category_id is not null group by category_id
    )
    select c.id,
      coalesce((select n from own where own.id = c.id), 0)
      + coalesce((select sum(o.n) from own o join categories ch on ch.id = o.id where ch.parent_id = c.id), 0)
      + coalesce((select sum(o.n) from own o join categories gc on gc.id = o.id join categories ch on ch.id = gc.parent_id where ch.parent_id = c.id), 0)
      as n
    from categories c`);
  return new Map(rows.map((r: any) => [Number(r.id), Number(r.n)]));
}

async function localityBusinessCounts(): Promise<Map<number, number>> {
  const { rows } = await pool.query(`
    select locality_id as id, count(*)::int as n from businesses
    where coalesce(is_active, true) and locality_id is not null group by locality_id`);
  return new Map(rows.map((r: any) => [Number(r.id), Number(r.n)]));
}

/**
 * Categories in the sitemap: every main category and sub-category (their pages list
 * sub-categories and businesses), plus specialised (3rd-level) categories once they
 * have an active business. Inactive and redirected categories are left out.
 */
async function sitemapCategories(counts: Map<number, number>) {
  const all: any[] = await storage.getCategories();
  const byId = new Map(all.map((c: any) => [Number(c.id), c]));
  const depth = (c: any) => {
    if (c.level) return Number(c.level);
    let d = 1, p = c.parentId ? byId.get(Number(c.parentId)) : null;
    while (p && d < 5) { d++; p = p.parentId ? byId.get(Number(p.parentId)) : null; }
    return d;
  };
  return all
    .filter((c: any) => c.slug && c.isActive !== false && !(categoryRedirects as Record<string, string>)[c.slug])
    .map((c: any) => ({ ...c, level: depth(c) }))
    .filter((c: any) => c.level <= 2 || (counts.get(Number(c.id)) || 0) > 0);
}

const day = (d: any) => (d ? new Date(d).toISOString().split('T')[0] : undefined);
const xmlEsc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

interface SitemapUrl {
  url: string;
  changefreq: string;
  priority: string;
  lastmod?: string;
}

export async function generateSitemap() {
  const baseUrl = country.origin;

  // This is now the main sitemap index, not individual pages
  return await generateSitemapIndex();
}

/** Latest change per section, so crawlers see when each sitemap last changed. */
async function sectionDates(): Promise<Record<string, string>> {
  const today = new Date().toISOString().split('T')[0];
  try {
    const { rows } = await pool.query(`select
      (select max(greatest(updated_at, created_at)) from businesses where coalesce(is_active, true)) as businesses,
      (select max(greatest(updated_at, created_at)) from categories) as categories,
      (select max(greatest(updated_at, created_at)) from provinces) as provinces,
      greatest((select max(greatest(updated_at, created_at)) from localities), (select max(greatest(updated_at, created_at)) from businesses)) as localities,
      (select max(greatest(updated_at, published_at, created_at)) from news_articles) as news,
      (select max(greatest(updated_at, published_at, created_at)) from blog_posts) as pages`);
    const r = rows[0] || {};
    const out: Record<string, string> = {};
    for (const k of ['businesses', 'categories', 'provinces', 'localities', 'news', 'pages']) out[k] = day(r[k]) || DEPLOYED_ON;
    out.static = DEPLOYED_ON;
    out.top = out.businesses;
    return out;
  } catch {
    return { static: DEPLOYED_ON, provinces: today, businesses: today, categories: today, top: today, localities: today, pages: today, news: today };
  }
}

export async function generateSitemapIndex() {
  const baseUrl = country.origin;
  const d = await sectionDates();
  const sections: Array<[string, string]> = [
    ['sitemap-static.xml', d.static],
    ['sitemap-provinces.xml', d.provinces],
    ['sitemap-cities.xml', d.localities],
    ['sitemap-localities.xml', d.localities],
    ['sitemap-categories.xml', d.categories],
    ['sitemap-businesses.xml', d.businesses],
    ['sitemap-top.xml', d.top],
    ['sitemap-blog.xml', d.pages],
    ['sitemap-news.xml', d.news],
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sections.map(([file, lastmod]) => `  <sitemap>
    <loc>${baseUrl}/${file}</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;
}

// Static Pages Sitemap
export async function generateStaticSitemap() {
  const baseUrl = country.origin;

  const staticPages: SitemapUrl[] = [
    { url: '/', changefreq: 'daily', priority: '1.0' },
    { url: '/categories', changefreq: 'weekly', priority: '0.9' },
    { url: country.regionsPath, changefreq: 'weekly', priority: '0.9' },
    { url: '/cities', changefreq: 'weekly', priority: '0.9' },
    { url: '/localities', changefreq: 'weekly', priority: '0.9' },
    { url: '/news', changefreq: 'daily', priority: '0.8' },
    { url: '/blog', changefreq: 'daily', priority: '0.8' },
    // Pakistani-only tools (other countries serve a noindex "not available" page)
    ...([]),
    { url: '/category-hierarchy', changefreq: 'weekly', priority: '0.7' },
    { url: '/help-center', changefreq: 'monthly', priority: '0.7' },
    { url: '/contact-us', changefreq: 'monthly', priority: '0.7' },
    { url: '/about', changefreq: 'monthly', priority: '0.6' },
    { url: '/advertise-with-us', changefreq: 'monthly', priority: '0.6' },
    { url: '/business-guidelines', changefreq: 'monthly', priority: '0.6' },
    { url: '/pricing', changefreq: 'monthly', priority: '0.6' },
    { url: '/pages/privacy-policy', changefreq: 'yearly', priority: '0.5' },
    { url: '/pages/terms-of-service', changefreq: 'yearly', priority: '0.5' },
  ];

  // Static pages change with deployments; use the deploy date as lastmod.
  return generateSitemapXML(baseUrl, staticPages.map((p) => ({ ...p, lastmod: p.lastmod || DEPLOYED_ON })));
}

// Business Pages Sitemap
export async function generateBusinessSitemap() {
  const baseUrl = country.origin;

  const businessData = await storage.getBusinesses({ limit: 10000 });
  const businesses = businessData.businesses;

  const businessPages: SitemapUrl[] = businesses.map(business => ({
    url: `/business/${business.slug}`,
    changefreq: 'weekly',
    priority: business.isFeatured ? '0.9' : '0.8',
    lastmod: business.updatedAt ? new Date(business.updatedAt).toISOString().split('T')[0] : undefined
  }));

  return generateSitemapXML(baseUrl, businessPages);
}

// All Categories Sitemap
export async function generateCategorySitemap() {
  const baseUrl = country.origin;
  const counts = await categoryBusinessCounts();
  const categories = await sitemapCategories(counts);

  const categoryPages: SitemapUrl[] = categories.map(category => ({
    url: `/categories/${category.slug}`,
    changefreq: 'weekly',
    priority: category.level === 1 ? '0.8' : category.level === 2 ? '0.7' : '0.6',
    lastmod: category.updatedAt ? new Date(category.updatedAt).toISOString().split('T')[0] : undefined
  }));

  return generateSitemapXML(baseUrl, categoryPages);
}

// Level 1 Categories Sitemap (Main Categories)
export async function generateCategoriesLevel1Sitemap() {
  const baseUrl = country.origin;
  const counts = await categoryBusinessCounts();
  const categories = await sitemapCategories(counts);

  const level1Categories = categories.filter(category => category.level === 1);
  const categoryPages: SitemapUrl[] = level1Categories.map(category => ({
    url: `/categories/${category.slug}`,
    changefreq: 'weekly',
    priority: '0.8',
    lastmod: category.updatedAt ? new Date(category.updatedAt).toISOString().split('T')[0] : undefined
  }));

  return generateSitemapXML(baseUrl, categoryPages);
}

// Level 2 Categories Sitemap (Sub Categories)
export async function generateCategoriesLevel2Sitemap() {
  const baseUrl = country.origin;
  const counts = await categoryBusinessCounts();
  const categories = await sitemapCategories(counts);

  const level2Categories = categories.filter(category => category.level === 2);
  const categoryPages: SitemapUrl[] = level2Categories.map(category => ({
    url: `/categories/${category.slug}`,
    changefreq: 'weekly',
    priority: '0.7',
    lastmod: category.updatedAt ? new Date(category.updatedAt).toISOString().split('T')[0] : undefined
  }));

  return generateSitemapXML(baseUrl, categoryPages);
}

// Provinces Sitemap
export async function generateProvinceSitemap() {
  const baseUrl = country.origin;
  const provinces = await storage.getProvinces();

  const provincePages: SitemapUrl[] = provinces.map(province => {
    const url = regionUrl(province.name);
    return {
      url,
      changefreq: 'weekly',
      priority: '0.8',
      lastmod: province.updatedAt ? new Date(province.updatedAt).toISOString().split('T')[0] : undefined
    };
  });

  return generateSitemapXML(baseUrl, provincePages);
}

/** Cities and localities with what makes their pages indexable. */
async function placeRows() {
  const counts = await localityBusinessCounts();
  const all: any[] = (await pool.query(`
    select id, slug, parent_id as "parentId", coalesce(is_main_area, false) as "isMainArea",
           coalesce(is_active, true) as "isActive", nullif(trim(coalesce(detailed_description, '')), '') is not null as "hasGuide",
           greatest(updated_at, created_at) as "changedAt"
    from localities where slug like '%/%' order by id`)).rows;
  const cityTotals = new Map<number, number>();
  const childCount = new Map<number, number>();
  for (const l of all) {
    const cityId = l.parentId ? Number(l.parentId) : Number(l.id);
    cityTotals.set(cityId, (cityTotals.get(cityId) || 0) + (counts.get(Number(l.id)) || 0));
    if (l.parentId) childCount.set(Number(l.parentId), (childCount.get(Number(l.parentId)) || 0) + 1);
  }
  return { all, counts, cityTotals, childCount };
}

// Cities Sitemap: every city page that lists businesses, localities or has a city guide
export async function generateCitiesSitemap() {
  const baseUrl = country.origin;
  try {
    const { all, cityTotals, childCount } = await placeRows();
    const cities = all.filter((l) => l.isActive && l.isMainArea && !l.parentId &&
      ((cityTotals.get(Number(l.id)) || 0) > 0 || (childCount.get(Number(l.id)) || 0) > 0 || l.hasGuide));
    const seen = new Set<string>();
    const pages: SitemapUrl[] = [];
    for (const c of cities) {
      const slug = String(c.slug).split('/')[1];
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      const total = cityTotals.get(Number(c.id)) || 0;
      pages.push({ url: `/cities/${slug}`, changefreq: 'weekly', priority: total > 0 || c.hasGuide ? '0.8' : '0.6', lastmod: day(c.changedAt) });
    }
    return generateSitemapXML(baseUrl, pages);
  } catch (error) {
    console.error('Error generating cities sitemap:', error);
    return generateSitemapXML(baseUrl, []);
  }
}

// Localities Sitemap: localities inside a city that list at least one business (others are noindex)
export async function generateLocalitiesSitemap() {
  const baseUrl = country.origin;
  try {
    const { all, counts } = await placeRows();
    const seen = new Set<string>();
    const pages: SitemapUrl[] = [];
    for (const l of all) {
      if (!l.isActive || (l.isMainArea && !l.parentId) || (counts.get(Number(l.id)) || 0) === 0) continue;
      const slug = String(l.slug);
      if (slug.split('/').length !== 2 || seen.has(slug)) continue;
      seen.add(slug);
      pages.push({ url: `/localities/${slug}`, changefreq: 'weekly', priority: '0.7', lastmod: day(l.changedAt) });
    }
    return generateSitemapXML(baseUrl, pages);
  } catch (error) {
    console.error('Error generating localities sitemap:', error);
    return generateSitemapXML(baseUrl, []);
  }
}

// Additional Public Pages Sitemap
export async function generatePagesSitemap() {
  const baseUrl = country.origin;

  try {
    // Get blog posts
    const blogPosts = await storage.getBlogPosts().catch(() => []);

    const publicPages: SitemapUrl[] = [];

    // Add published blog posts
    if (Array.isArray(blogPosts)) {
      blogPosts.forEach((post: any) => {
        const published = post.status ? post.status === 'published' : post.isPublished !== false;
        if (post.slug && post.publishedAt && published) {
          publicPages.push({
            url: `/blog/${post.slug}`,
            changefreq: 'weekly',
            priority: '0.6',
            lastmod: day(post.updatedAt || post.publishedAt)
          });
        }
      });
    }

    // Tool/utility pages (/add-business, /search, /ai-recommendations,
    // /business-card-scanner) are not landing pages and are left out.
    const additionalPages: SitemapUrl[] = [];

    publicPages.push(...additionalPages);

    return generateSitemapXML(baseUrl, publicPages);
  } catch (error) {
    console.error('Error generating pages sitemap:', error);
    return generateSitemapXML(baseUrl, []);
  }
}

// News articles sitemap (Google News extension for articles from the last 48 hours)
export async function generateNewsSitemap() {
  const baseUrl = country.origin;
  try {
    const { rows } = await pool.query(`
      select slug, title, published_at, updated_at from news_articles
      where coalesce(is_active, true) and coalesce(status, 'published') = 'published' and slug is not null
      order by published_at desc nulls last limit 1000`);
    const recent = Date.now() - 48 * 3600 * 1000;
    const urls = rows.map((r: any) => {
      const pub = r.published_at ? new Date(r.published_at) : null;
      const news = pub && pub.getTime() >= recent
        ? `
    <news:news>
      <news:publication><news:name>${country.brand}</news:name><news:language>en</news:language></news:publication>
      <news:publication_date>${pub.toISOString()}</news:publication_date>
      <news:title>${xmlEsc(String(r.title || ''))}</news:title>
    </news:news>`
        : '';
      const lastmod = day(r.updated_at || r.published_at);
      return `  <url>
    <loc>${baseUrl}/news/${xmlEsc(r.slug)}</loc>${lastmod ? `
    <lastmod>${lastmod}</lastmod>` : ''}${news}
  </url>`;
    });
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls.join('\n')}
</urlset>`;
  } catch (error) {
    console.error('Error generating news sitemap:', error);
    return generateSitemapXML(baseUrl, []);
  }
}

// Helper function to generate XML
function generateSitemapXML(baseUrl: string, pages: SitemapUrl[]): string {
  pages = pages.filter((u: any) => u && u.url && !PRIVATE_PATH.test(u.url.split('?')[0]));
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    ${page.lastmod ? `<lastmod>${page.lastmod}</lastmod>` : ''}
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
}