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

export async function generateSitemapIndex() {
  const baseUrl = country.origin;
  const today = new Date().toISOString().split('T')[0];

  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap-static.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-provinces.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-businesses.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-categories.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-top.xml</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-localities.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-pages.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-news.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;

  return sitemapIndex;
}

// Static Pages Sitemap
export async function generateStaticSitemap() {
  const baseUrl = country.origin;

  const staticPages: SitemapUrl[] = [
    { url: '/', changefreq: 'daily', priority: '1.0' },
    { url: '/categories', changefreq: 'weekly', priority: '0.9' },
    { url: country.regionsPath, changefreq: 'weekly', priority: '0.9' },
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
  // Category pages without any active business are thin (and served noindex) - keep them out.
  const categories = (await storage.getCategories()).filter(
    (c: any) => !(categoryRedirects as Record<string, string>)[c.slug] && (counts.get(Number(c.id)) || 0) > 0,
  );

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
  // Category pages without any active business are thin (and served noindex) - keep them out.
  const categories = (await storage.getCategories()).filter(
    (c: any) => !(categoryRedirects as Record<string, string>)[c.slug] && (counts.get(Number(c.id)) || 0) > 0,
  );

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
  // Category pages without any active business are thin (and served noindex) - keep them out.
  const categories = (await storage.getCategories()).filter(
    (c: any) => !(categoryRedirects as Record<string, string>)[c.slug] && (counts.get(Number(c.id)) || 0) > 0,
  );

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

// Localities Sitemap
export async function generateLocalitiesSitemap() {
  const baseUrl = country.origin;
  
  try {
    const counts = await localityBusinessCounts();
    // Only localities that list at least one active business (others are noindex)
    const localities = (await storage.getLocalities()).filter((l: any) => (counts.get(Number(l.id)) || 0) > 0);
    
    const seenLocality = new Set<string>();
    const seenSlug = new Set<string>();
    const uniqueLocalities = [...localities]
      .sort((a: any, b: any) => (a.id ?? 0) - (b.id ?? 0))
      .filter((l: any) => {
        if (!l.slug || String(l.slug).split('/').length !== 2) return false; // "<province>/<locality>" only
        if (/-\d+$/.test(l.slug) && localities.some((o: any) => o.slug === String(l.slug).replace(/-\d+$/, ''))) return false;
        const key = `${l.provinceId}|${String(l.name || '').trim().toLowerCase()}`;
        if (seenLocality.has(key) || seenSlug.has(l.slug)) return false;
        seenLocality.add(key);
        seenSlug.add(l.slug);
        return true;
      });
    const localityPages: SitemapUrl[] = uniqueLocalities.map(locality => ({
      url: `/localities/${locality.slug}`,
      changefreq: 'weekly',
      priority: '0.7',
      lastmod: locality.updatedAt ? new Date(locality.updatedAt).toISOString().split('T')[0] : undefined
    }));

    return generateSitemapXML(baseUrl, localityPages);
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