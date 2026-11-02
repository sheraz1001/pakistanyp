import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { localities, categories, provinces } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { storage } from './storage';

interface SEOData {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  schemaMarkup?: any;
}

async function getLocalitySEO(slug: string): Promise<SEOData | null> {
  try {
    const localityData = await storage.getLocalityBySlug(slug);
    if (!localityData) return null;

    // Get province name
    const province = await db
      .select({ name: provinces.name })
      .from(provinces)
      .where(eq(provinces.id, localityData.provinceId))
      .limit(1);

    const provinceName = province[0]?.name || 'Pakistan';

    return {
      title: localityData.metaTitle || `${provinceName} - ${localityData.name} Business Directory | Pakistan Yellow Pages | Top Local Services`,
      description: localityData.metaDescription || `Discover verified businesses in ${localityData.name}, ${provinceName}, Pakistan. Browse local services, restaurants, shops, professional services with contact details, reviews & ratings. Find the best businesses near you.`,
      keywords: localityData.keywords || `${localityData.name} businesses, ${provinceName} business directory, Pakistani business listings, ${localityData.name} services, local businesses ${provinceName}, verified businesses Pakistan, business directory Pakistan, ${localityData.name} shops, ${provinceName} companies`,
      canonicalUrl: localityData.canonicalUrl || `https://pakistanyp.com/localities/${localityData.slug}`,
      ogTitle: localityData.ogTitle || `${provinceName} - ${localityData.name} Business Directory`,
      ogDescription: localityData.ogDescription || `Explore businesses in ${localityData.name}, ${provinceName}. Verified listings with reviews and contact information.`,
      ogImage: localityData.ogImage || 'https://pakistanyp.com/og-homepage.jpg',
      schemaMarkup: {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": `${localityData.name} Business Directory`,
        "description": localityData.description || `Business directory for ${localityData.name}, ${provinceName}`,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": localityData.name,
          "addressRegion": provinceName,
          "addressCountry": "AE"
        },
        "areaServed": {
          "@type": "GeoCircle",
          "geoMidpoint": {
            "@type": "GeoCoordinates",
            "latitude": 25.2048,
            "longitude": 55.2708
          },
          "geoRadius": "10000"
        }
      }
    };
  } catch (error) {
    console.error('Error fetching locality SEO data:', error);
    return null;
  }
}

async function getCategorySEO(slug: string): Promise<SEOData | null> {
  try {
    const category = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        metaTitle: categories.metaTitle,
        metaDescription: categories.metaDescription,
        keywords: categories.keywords,
        canonicalUrl: categories.canonicalUrl,
        ogTitle: categories.ogTitle,
        ogDescription: categories.ogDescription,
        ogImage: categories.ogImage
      })
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (!category.length) return null;

    const categoryData = category[0];

    return {
      title: categoryData.metaTitle || `${categoryData.name} in Pakistan | Business Directory | pakistanyp.com`,
      description: categoryData.metaDescription || `Find the best ${categoryData.name.toLowerCase()} businesses across all provinces and territories in Pakistan. Browse verified listings with reviews and contact information.`,
      keywords: categoryData.keywords || `${categoryData.name}, Pakistani ${categoryData.name}, ${categoryData.name} businesses Pakistan, ${categoryData.name} companies Pakistan, ${categoryData.name} services Pakistan, Pakistani business directory`,
      canonicalUrl: categoryData.canonicalUrl || `https://pakistanyp.com/categories/${categoryData.slug}`,
      ogTitle: categoryData.ogTitle || `${categoryData.name} Businesses in Pakistan`,
      ogDescription: categoryData.ogDescription || `Discover ${categoryData.name.toLowerCase()} businesses across Pakistan with verified listings and reviews.`,
      ogImage: categoryData.ogImage || 'https://pakistanyp.com/og-homepage.jpg',
      schemaMarkup: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": `${categoryData.name} Business Directory`,
        "description": categoryData.description || `Directory of ${categoryData.name} businesses in Pakistan`,
        "mainEntity": {
          "@type": "ItemList",
          "name": `${categoryData.name} in Pakistan`,
          "description": `List of ${categoryData.name} businesses in Pakistan`
        }
      }
    };
  } catch (error) {
    console.error('Error fetching category SEO data:', error);
    return null;
  }
}

function injectSEOIntoHTML(html: string, seoData: SEOData): string {
  // Replace the default title
  html = html.replace(
    /<title>.*?<\/title>/i,
    `<title>${seoData.title}</title>`
  );

  // Replace the default description
  html = html.replace(
    /<meta name="description" content=".*?"[^>]*>/i,
    `<meta name="description" content="${seoData.description}" />`
  );

  // Replace keywords if provided
  if (seoData.keywords) {
    html = html.replace(
      /<meta name="keywords" content=".*?"[^>]*>/i,
      `<meta name="keywords" content="${seoData.keywords}" />`
    );
  }

  // Replace canonical URL
  if (seoData.canonicalUrl) {
    html = html.replace(
      /<link rel="canonical" href=".*?"[^>]*>/i,
      `<link rel="canonical" href="${seoData.canonicalUrl}" />`
    );
  }

  // Replace Open Graph tags
  if (seoData.ogTitle) {
    html = html.replace(
      /<meta property="og:title" content=".*?"[^>]*>/i,
      `<meta property="og:title" content="${seoData.ogTitle}" />`
    );
  }

  if (seoData.ogDescription) {
    html = html.replace(
      /<meta property="og:description" content=".*?"[^>]*>/i,
      `<meta property="og:description" content="${seoData.ogDescription}" />`
    );
  }

  if (seoData.ogImage) {
    html = html.replace(
      /<meta property="og:image" content=".*?"[^>]*>/i,
      `<meta property="og:image" content="${seoData.ogImage}" />`
    );
  }

  if (seoData.canonicalUrl) {
    html = html.replace(
      /<meta property="og:url" content=".*?"[^>]*>/i,
      `<meta property="og:url" content="${seoData.canonicalUrl}" />`
    );
  }

  // Add structured data if provided
  if (seoData.schemaMarkup) {
    const structuredDataScript = `<script type="application/ld+json">${JSON.stringify(seoData.schemaMarkup, null, 2)}</script>`;
    html = html.replace(
      /<\/head>/i,
      `${structuredDataScript}\n</head>`
    );
  }

  return html;
}

export const seoMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const url = req.originalUrl;
  
  // Only process HTML requests (not API calls, assets, etc.)
  if (!req.headers.accept?.includes('text/html')) {
    return next();
  }

  let seoData: SEOData | null = null;

  // Check for locality pages
  const localityMatch = url.match(/^\/localities\/([^/?]+)/);
  if (localityMatch) {
    const slug = localityMatch[1];
    seoData = await getLocalitySEO(slug);
  }

  // Check for category pages
  const categoryMatch = url.match(/^\/categories\/([^/?]+)/);
  if (categoryMatch) {
    const slug = categoryMatch[1];
    seoData = await getCategorySEO(slug);
  }

  if (seoData) {
    // Store SEO data in response locals for the Vite middleware to use
    res.locals.seoData = seoData;
  }

  next();
};