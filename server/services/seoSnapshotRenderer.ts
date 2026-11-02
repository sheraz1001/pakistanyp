/**
 * SEO Snapshot Renderer
 * Generates static HTML snapshots with crawlable links for search engine bots.
 * Bypasses React/Puppeteer for heavy listing pages.
 */

import { storage } from '../storage';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  businessCount?: number;
}

interface Business {
  id: number;
  name: string;
  slug: string;
  description?: string;
  province?: string;
  city?: string;
  category?: string;
}

interface Province {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

interface Locality {
  id: number;
  name: string;
  slug: string;
  provinceId?: number;
  provinceName?: string;
}

const BASE_URL = 'https://pakistanyp.com';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateBaseHtml(title: string, description: string, canonical: string, content: string, schema?: object | object[], noindex: boolean = false): string {
  const robotsContent = noindex 
    ? "noindex, follow" 
    : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
  const schemaMarkup = schema ? `
  <!-- Schema.org JSON-LD -->
  <script type="application/ld+json">${JSON.stringify(Array.isArray(schema) ? schema : [schema])}</script>
` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="${robotsContent}">
  <link rel="canonical" href="${canonical}">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="PakistanYP - Pakistani Business Directory">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  ${schemaMarkup}
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #1a1a1a; margin-bottom: 10px; }
    .subtitle { color: #666; margin-bottom: 30px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .card { background: white; padding: 16px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .card a { color: #0066cc; text-decoration: none; font-weight: 500; display: block; margin-bottom: 8px; }
    .card a:hover { text-decoration: underline; }
    .card p { color: #666; font-size: 14px; margin: 0; line-clamp: 2; -webkit-line-clamp: 2; overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; }
    .count { color: #888; font-size: 12px; margin-top: 8px; }
    .breadcrumb { margin-bottom: 20px; }
    .breadcrumb a { color: #0066cc; text-decoration: none; }
    .breadcrumb span { color: #666; margin: 0 8px; }
    nav { background: #1a1a1a; padding: 16px 20px; margin: -20px -20px 20px; }
    nav a { color: white; text-decoration: none; margin-right: 20px; }
    footer { margin-top: 40px; padding: 20px; background: #1a1a1a; color: white; text-align: center; }
    footer a { color: #4dabf7; }
  </style>
</head>
<body>
  <nav>
    <a href="/">PakistanYP - Pakistani Business Directory</a>
    <a href="/categories">Categories</a>
    <a href="/businesses">Businesses</a>
    <a href="/provinces">Provinces</a>
    <a href="/localities">Localities</a>
  </nav>
  <div class="container">
    ${content}
  </div>
  <footer>
    <p>&copy; 2024 PakistanYP - Pakistani Business Directory. All rights reserved.</p>
    <p><a href="/">Home</a> | <a href="/categories">Categories</a> | <a href="/businesses">Businesses</a> | <a href="/contact">Contact</a></p>
  </footer>
</body>
</html>`;
}

export async function renderCategoriesSnapshot(): Promise<string> {
  try {
    const categories = await storage.getCategoriesWithStats();
    const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));
    
    const categoryCards = sortedCategories.map((cat: any) => `
      <div class="card">
        <a href="${BASE_URL}/categories/${escapeHtml(cat.slug)}" data-testid="link-category-${escapeHtml(cat.slug)}">${escapeHtml(cat.name)}</a>
        <p>${escapeHtml(cat.description || `Explore ${cat.name} businesses in Pakistan`)}</p>
        <div class="count">${cat.businessCount || 0} businesses</div>
      </div>
    `).join('');

    const content = `
      <div class="breadcrumb">
        <a href="/">Home</a><span>/</span><span>Categories</span>
      </div>
      <h1>Pakistani Business Categories</h1>
      <p class="subtitle">Browse ${categories.length} business categories across all 7 Pakistani provinces. Find companies by industry.</p>
      <div class="grid">
        ${categoryCards}
      </div>
    `;

    console.log(`[SEO Snapshot] Rendered categories page with ${categories.length} category links`);

    return generateBaseHtml(
      'Business Categories in Pakistan | Complete Directory | PakistanYP',
      `Browse ${categories.length} business categories across Pakistan. Find companies in Business Services, Finance, Construction, Automotive, Food, Health, Technology, Retail and more.`,
      `${BASE_URL}/categories`,
      content
    );
  } catch (error) {
    console.error('[SEO Snapshot] Error rendering categories:', error);
    throw error;
  }
}

export async function renderBusinessesSnapshot(): Promise<string> {
  try {
    const { businesses } = await storage.getBusinesses({ limit: 1000 });
    const sortedBusinesses = [...businesses].sort((a, b) => a.name.localeCompare(b.name));
    
    const businessCards = sortedBusinesses.map((biz: any) => `
      <div class="card">
        <a href="${BASE_URL}/business/${escapeHtml(biz.slug)}" data-testid="link-business-${escapeHtml(biz.slug)}">${escapeHtml(biz.name)}</a>
        <p>${escapeHtml(biz.description?.substring(0, 120) || `${biz.name} - Business in Pakistan`)}</p>
        <div class="count">${escapeHtml(biz.provinceName || 'Pakistan')} ${biz.localityName ? `• ${escapeHtml(biz.localityName)}` : ''}</div>
      </div>
    `).join('');

    const content = `
      <div class="breadcrumb">
        <a href="/">Home</a><span>/</span><span>Businesses</span>
      </div>
      <h1>Pakistani Business Directory</h1>
      <p class="subtitle">Discover ${businesses.length} verified businesses across all 7 Pakistani provinces.</p>
      <div class="grid">
        ${businessCards}
      </div>
    `;

    console.log(`[SEO Snapshot] Rendered businesses page with ${businesses.length} business links`);

    return generateBaseHtml(
      'Business Directory Pakistani | All Companies | PakistanYP',
      `Discover ${businesses.length} verified businesses across Pakistan. Find local companies in Karachi, Lahore, Islamabad, and all provinces.`,
      `${BASE_URL}/businesses`,
      content
    );
  } catch (error) {
    console.error('[SEO Snapshot] Error rendering businesses:', error);
    throw error;
  }
}

export async function renderProvincesSnapshot(): Promise<string> {
  try {
    const provinces = await storage.getProvinces();
    
    const provinceCards = provinces.map((province: any) => {
      const provinceSlug = province.code?.toLowerCase() || province.name.toLowerCase().replace(/\s+/g, '-');
      return `
      <div class="card">
        <a href="${BASE_URL}/provinces/${escapeHtml(provinceSlug)}" data-testid="link-province-${escapeHtml(provinceSlug)}">${escapeHtml(province.name)}</a>
        <p>${escapeHtml(province.description || `Explore businesses in ${province.name}, Pakistan`)}</p>
      </div>
    `;
    }).join('');

    const content = `
      <div class="breadcrumb">
        <a href="/">Home</a><span>/</span><span>Provinces</span>
      </div>
      <h1>Pakistani Provinces</h1>
      <p class="subtitle">Explore businesses across all provinces and territories of Pakistan.</p>
      <div class="grid">
        ${provinceCards}
      </div>
    `;

    console.log(`[SEO Snapshot] Rendered provinces page with ${provinces.length} province links`);

    return generateBaseHtml(
      'Pakistani Provinces | Business Directory by Region | PakistanYP',
      'Explore businesses across all provinces and territories of Pakistan. Find local companies in Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Peshawar, and Multan.',
      `${BASE_URL}/provinces`,
      content
    );
  } catch (error) {
    console.error('[SEO Snapshot] Error rendering provinces:', error);
    throw error;
  }
}

export async function renderLocalitiesSnapshot(): Promise<string> {
  try {
    const localities = await storage.getLocalities();
    const sortedLocalities = [...localities].sort((a, b) => a.name.localeCompare(b.name));
    
    const localityCards = sortedLocalities.map((loc: any) => `
      <div class="card">
        <a href="${BASE_URL}/localities/${escapeHtml(loc.slug)}" data-testid="link-locality-${escapeHtml(loc.slug)}">${escapeHtml(loc.name)}</a>
        <p>${escapeHtml(`Explore businesses in ${loc.name}${loc.provinceName ? `, ${loc.provinceName}` : ''}`)}</p>
      </div>
    `).join('');

    const content = `
      <div class="breadcrumb">
        <a href="/">Home</a><span>/</span><span>Localities</span>
      </div>
      <h1>Pakistani Localities & Areas</h1>
      <p class="subtitle">Browse ${localities.length} localities and areas across Pakistan.</p>
      <div class="grid">
        ${localityCards}
      </div>
    `;

    console.log(`[SEO Snapshot] Rendered localities page with ${localities.length} locality links`);

    return generateBaseHtml(
      'Pakistani Localities & Areas | Business Directory | PakistanYP',
      `Browse ${localities.length} localities and areas across Pakistan. Find local businesses in specific neighborhoods and districts.`,
      `${BASE_URL}/localities`,
      content
    );
  } catch (error) {
    console.error('[SEO Snapshot] Error rendering localities:', error);
    throw error;
  }
}

export async function renderCategoryDetailSnapshot(slug: string): Promise<string | null> {
  try {
    const category = await storage.getCategoryBySlug(slug);
    if (!category) return null;

    const { businesses } = await storage.getBusinesses({ categoryId: category.id, limit: 500 });
    
    const businessCards = businesses.map((biz: any) => `
      <div class="card">
        <a href="${BASE_URL}/business/${escapeHtml(biz.slug)}" data-testid="link-business-${escapeHtml(biz.slug)}">${escapeHtml(biz.name)}</a>
        <p>${escapeHtml(biz.description?.substring(0, 120) || `${biz.name} - ${category.name} in Pakistan`)}</p>
        <div class="count">${escapeHtml(biz.provinceName || 'Pakistan')}</div>
      </div>
    `).join('');

    // Generate rich content for categories (especially those with 0 businesses)
    const aboutSection = `
      <div class="card" style="margin-bottom: 30px; max-width: 800px;">
        <h2>About ${escapeHtml(category.name)} in Pakistan</h2>
        <p>${escapeHtml(category.description || `Discover ${category.name} businesses and services across Pakistan. PakistanYP is your trusted directory for finding verified ${category.name.toLowerCase()} companies in Karachi, Lahore, Islamabad, Rawalpindi, Peshawar, Faisalabad, and Multan.`)}</p>
        <p>Whether you're looking for local ${escapeHtml(category.name.toLowerCase())} providers or exploring business opportunities in Pakistan, our comprehensive directory helps you connect with the right companies. Each listing includes contact information, location details, and customer reviews to help you make informed decisions.</p>
      </div>
    `;

    // Add province links section
    const provinceLinks = `
      <h2 style="margin-top: 30px;">Browse ${escapeHtml(category.name)} by Province</h2>
      <div class="grid" style="margin-bottom: 30px;">
        <div class="card"><a href="${BASE_URL}/provinces/dxb">${escapeHtml(category.name)} in Karachi</a></div>
        <div class="card"><a href="${BASE_URL}/provinces/auh">${escapeHtml(category.name)} in Lahore</a></div>
        <div class="card"><a href="${BASE_URL}/provinces/shj">${escapeHtml(category.name)} in Islamabad</a></div>
        <div class="card"><a href="${BASE_URL}/provinces/ajm">${escapeHtml(category.name)} in Rawalpindi</a></div>
        <div class="card"><a href="${BASE_URL}/provinces/fuj">${escapeHtml(category.name)} in Peshawar</a></div>
        <div class="card"><a href="${BASE_URL}/provinces/rak">${escapeHtml(category.name)} in Faisalabad</a></div>
        <div class="card"><a href="${BASE_URL}/provinces/uaq">${escapeHtml(category.name)} in Multan</a></div>
      </div>
    `;

    // Rich content for categories without current listings - focus on value, not "0 results"
    const industryGuideContent = businesses.length === 0 ? `
      <div class="card" style="margin: 20px 0; padding: 25px;">
        <h2>Finding ${escapeHtml(category.name)} Services in Pakistan</h2>
        <p>Pakistan is home to world-class ${escapeHtml(category.name.toLowerCase())} providers serving businesses and individuals across all provinces and territories. When selecting a ${escapeHtml(category.name.toLowerCase())} provider in Pakistan, consider factors such as:</p>
        <ul style="margin: 15px 0; padding-left: 20px;">
          <li style="margin: 8px 0;">Experience and expertise in Pakistan market</li>
          <li style="margin: 8px 0;">Proper licensing and certifications</li>
          <li style="margin: 8px 0;">Customer reviews and reputation</li>
          <li style="margin: 8px 0;">Service coverage across provinces</li>
          <li style="margin: 8px 0;">Competitive pricing and value</li>
        </ul>
      </div>
      
      <div class="card" style="margin: 20px 0; padding: 25px;">
        <h2>List Your ${escapeHtml(category.name)} Business</h2>
        <p>Are you a ${escapeHtml(category.name.toLowerCase())} provider in Pakistan? Join PakistanYP to reach thousands of potential customers searching for your services. Our directory connects businesses with customers across Karachi, Lahore, Islamabad, and all Pakistani provinces.</p>
        <p style="margin-top: 15px;"><a href="/dashboard" style="background: #0066cc; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">Add Your Business Free</a></p>
      </div>
      
      <h2>Related Business Categories</h2>
      <div class="grid">
        <div class="card"><a href="${BASE_URL}/categories/business-services">Business Services</a><p>Professional business support services</p></div>
        <div class="card"><a href="${BASE_URL}/categories/construction-real-estate">Construction & Real Estate</a><p>Building and property services</p></div>
        <div class="card"><a href="${BASE_URL}/categories/technology-it">Technology & IT</a><p>Tech solutions and IT services</p></div>
        <div class="card"><a href="${BASE_URL}/categories/professional-services">Professional Services</a><p>Expert consulting and advisory</p></div>
      </div>
    ` : '';

    // Subtitle without mentioning count for empty categories
    const subtitleText = businesses.length > 0 
      ? `${escapeHtml(category.description || `Find ${category.name} businesses across Pakistan.`)} Showing ${businesses.length} verified listings.`
      : escapeHtml(category.description || `Your guide to ${category.name.toLowerCase()} services across Pakistan.`);

    const content = `
      <div class="breadcrumb">
        <a href="/">Home</a><span>/</span><a href="/categories">Categories</a><span>/</span><span>${escapeHtml(category.name)}</span>
      </div>
      <h1>${escapeHtml(category.name)} in Pakistan</h1>
      <p class="subtitle">${subtitleText}</p>
      ${aboutSection}
      ${businesses.length > 0 ? `
        <h2>Businesses in ${escapeHtml(category.name)}</h2>
        <div class="grid">${businessCards}</div>
      ` : industryGuideContent}
      ${provinceLinks}
    `;

    console.log(`[SEO Snapshot] Rendered category ${slug} with ${businesses.length} business links`);

    // Build CategoryPage schema
    const categorySchema = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": `${category.name} Businesses in Pakistan`,
      "description": category.description || `Find ${category.name} businesses across Pakistan.`,
      "url": `${BASE_URL}/categories/${slug}`,
      "mainEntity": {
        "@type": "ItemList",
        "name": `${category.name} in Pakistan`,
        "numberOfItems": businesses.length,
        "itemListElement": businesses.slice(0, 10).map((biz: any, i: number) => ({
          "@type": "ListItem",
          "position": i + 1,
          "item": {
            "@type": "LocalBusiness",
            "name": biz.name,
            "url": `${BASE_URL}/business/${biz.slug}`
          }
        }))
      }
    };

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE_URL },
        { "@type": "ListItem", "position": 2, "name": "Categories", "item": `${BASE_URL}/categories` },
        { "@type": "ListItem", "position": 3, "name": category.name, "item": `${BASE_URL}/categories/${slug}` }
      ]
    };

    return generateBaseHtml(
      `${category.name} Businesses in Pakistan | PakistanYP`,
      category.description || `Professional ${category.name.toLowerCase()} services in Pakistan. Find trusted ${category.name.toLowerCase()} companies in Karachi, Lahore, Islamabad and all provinces.`,
      `${BASE_URL}/categories/${slug}`,
      content,
      [categorySchema, breadcrumbSchema]
    );
  } catch (error) {
    console.error(`[SEO Snapshot] Error rendering category ${slug}:`, error);
    return null;
  }
}

export async function renderBusinessDetailSnapshot(slug: string): Promise<string | null> {
  try {
    const business = await storage.getBusinessBySlug(slug);
    if (!business || (business as any).isActive === false) return null;

    const categoryName = business.categoryId 
      ? (await storage.getCategoryById(business.categoryId))?.name || 'Business'
      : 'Business';
    
    // Get province name from provinceId
    const province = business.provinceId ? await storage.getProvinceById(business.provinceId) : null;
    const provinceName = province?.name || 'Pakistan';
    
    // Get locality name from localityId
    const locality = business.localityId ? await storage.getLocalityById(business.localityId) : null;
    const localityName = locality?.name || '';

    const content = `
      <div class="breadcrumb">
        <a href="/">Home</a><span>/</span><a href="/businesses">Businesses</a><span>/</span><span>${escapeHtml(business.name)}</span>
      </div>
      <h1>${escapeHtml(business.name)}</h1>
      <p class="subtitle">${escapeHtml(categoryName)} in ${escapeHtml(provinceName)}</p>
      <div class="card" style="max-width: 800px;">
        <p>${escapeHtml(business.description || `${business.name} is a ${categoryName} business in Pakistan.`)}</p>
        <div class="count">
          ${localityName ? `<p>Area: ${escapeHtml(localityName)}</p>` : ''}
          ${provinceName ? `<p>Province: ${escapeHtml(provinceName)}</p>` : ''}
          ${business.phone ? `<p>Phone: ${escapeHtml(business.phone)}</p>` : ''}
          ${business.website ? `<p>Website: <a href="${escapeHtml(business.website)}">${escapeHtml(business.website)}</a></p>` : ''}
        </div>
      </div>
      <h2 style="margin-top: 30px;">Related Links</h2>
      <div class="grid">
        <div class="card"><a href="/businesses">Browse All Businesses</a></div>
        <div class="card"><a href="/categories">Browse Categories</a></div>
        ${province ? `<div class="card"><a href="/provinces/${province.code?.toLowerCase() || provinceName.toLowerCase().replace(/\s+/g, '-')}">More in ${escapeHtml(provinceName)}</a></div>` : ''}
      </div>
    `;

    console.log(`[SEO Snapshot] Rendered business ${slug}`);

    // Build LocalBusiness schema
    const localBusinessSchema = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": business.name,
      "description": business.description?.substring(0, 300) || `${business.name} - ${categoryName} business in ${provinceName}`,
      "url": `${BASE_URL}/business/${slug}`,
      ...(business.phone && { "telephone": business.phone }),
      ...(business.website && { "sameAs": [business.website] }),
      "address": {
        "@type": "PostalAddress",
        "addressLocality": localityName || provinceName,
        "addressRegion": provinceName,
        "addressCountry": "AE"
      },
      "areaServed": {
        "@type": "Place",
        "name": provinceName + ", Pakistan"
      }
    };

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE_URL },
        { "@type": "ListItem", "position": 2, "name": "Businesses", "item": `${BASE_URL}/businesses` },
        { "@type": "ListItem", "position": 3, "name": business.name, "item": `${BASE_URL}/business/${slug}` }
      ]
    };

    return generateBaseHtml(
      `${business.name} | ${categoryName} in ${provinceName} | PakistanYP`,
      business.description?.substring(0, 160) || `${business.name} - ${categoryName} business in ${provinceName}. Contact information and details.`,
      `${BASE_URL}/business/${slug}`,
      content,
      [localBusinessSchema, breadcrumbSchema]
    );
  } catch (error) {
    console.error(`[SEO Snapshot] Error rendering business ${slug}:`, error);
    return null;
  }
}

export async function renderProvinceDetailSnapshot(code: string): Promise<string | null> {
  try {
    // Find province by code (case-insensitive)
    const provinces = await storage.getProvinces();
    const province = provinces.find((e: any) => 
      e.code?.toLowerCase() === code.toLowerCase() || 
      e.name.toLowerCase().replace(/\s+/g, '-') === code.toLowerCase()
    );
    
    if (!province) {
      console.log(`[SEO Snapshot] Province not found for code: ${code}`);
      return null;
    }

    // Get businesses in this province
    const { businesses } = await storage.getBusinesses({ provinceId: province.id, limit: 500 });
    
    // Get localities in this province
    const allLocalities = await storage.getLocalities();
    const provinceLocalities = allLocalities.filter((l: any) => l.provinceId === province.id);
    
    // Get categories with businesses in this province
    const categories = await storage.getCategoriesWithStats();
    const categoryIds = Array.from(new Set(businesses.map((b: any) => b.categoryId)));
    const provinceCategories = categories.filter((c: any) => categoryIds.includes(c.id)).slice(0, 20);
    
    const provinceSlug = province.code?.toLowerCase() || province.name.toLowerCase().replace(/\s+/g, '-');
    
    const businessCards = businesses.slice(0, 30).map((biz: any) => `
      <div class="card">
        <a href="${BASE_URL}/business/${escapeHtml(biz.slug)}" data-testid="link-business-${escapeHtml(biz.slug)}">${escapeHtml(biz.name)}</a>
        <p>${escapeHtml(biz.description?.substring(0, 120) || `${biz.name} - Business in ${province.name}`)}</p>
      </div>
    `).join('');

    const localityCards = provinceLocalities.slice(0, 20).map((loc: any) => `
      <div class="card">
        <a href="${BASE_URL}/localities/${escapeHtml(loc.slug)}" data-testid="link-locality-${escapeHtml(loc.slug)}">${escapeHtml(loc.name)}</a>
        <p>Explore businesses in ${escapeHtml(loc.name)}</p>
      </div>
    `).join('');

    const categoryLinks = provinceCategories.map((cat: any) => `
      <a href="${BASE_URL}/category/${escapeHtml(cat.slug)}" style="margin-right: 15px; color: #0066cc;">${escapeHtml(cat.name)}</a>
    `).join('');

    const provinceDescription = province.description || 
      `${province.name} is one of provinces and territories of Pakistan, offering diverse business opportunities across multiple industries. ` +
      `Discover ${businesses.length} registered businesses and explore commercial activities in various localities including ${provinceLocalities.slice(0, 5).map((l: any) => l.name).join(', ')}.`;

    const content = `
      <div class="breadcrumb">
        <a href="/">Home</a><span>/</span><a href="/provinces">Provinces</a><span>/</span><span>${escapeHtml(province.name)}</span>
      </div>
      <h1>Businesses in ${escapeHtml(province.name)}, Pakistan</h1>
      <p class="subtitle">${escapeHtml(provinceDescription.substring(0, 300))}</p>
      
      <div class="card" style="margin-bottom: 30px;">
        <h3>About ${escapeHtml(province.name)}</h3>
        <p>${escapeHtml(provinceDescription)}</p>
        <p><strong>Total Businesses:</strong> ${businesses.length}</p>
        <p><strong>Areas/Localities:</strong> ${provinceLocalities.length}</p>
      </div>
      
      ${provinceLocalities.length > 0 ? `
        <h2>Localities in ${escapeHtml(province.name)}</h2>
        <div class="grid">${localityCards}</div>
      ` : ''}
      
      ${provinceCategories.length > 0 ? `
        <h2 style="margin-top: 30px;">Popular Categories</h2>
        <p>${categoryLinks}</p>
      ` : ''}
      
      <h2 style="margin-top: 30px;">Businesses in ${escapeHtml(province.name)}</h2>
      <div class="grid">${businessCards}</div>
      ${businesses.length > 30 ? `<p><a href="/businesses?province=${provinceSlug}">View all ${businesses.length} businesses in ${escapeHtml(province.name)} →</a></p>` : ''}
      
      <h2 style="margin-top: 30px;">Other Provinces</h2>
      <p>
        ${provinces.filter((e: any) => e.id !== province.id).map((e: any) => {
          const eSlug = e.code?.toLowerCase() || e.name.toLowerCase().replace(/\s+/g, '-');
          return `<a href="${BASE_URL}/provinces/${escapeHtml(eSlug)}" style="margin-right: 15px; color: #0066cc;">${escapeHtml(e.name)}</a>`;
        }).join('')}
      </p>
    `;

    console.log(`[SEO Snapshot] Rendered province ${code} with ${businesses.length} businesses, ${provinceLocalities.length} localities`);

    return generateBaseHtml(
      `Businesses in ${province.name}, Pakistan | PakistanYP Business Directory`,
      `Discover ${businesses.length} verified businesses in ${province.name}, Pakistan. Browse local companies across ${provinceLocalities.length} areas and ${provinceCategories.length} categories.`,
      `${BASE_URL}/provinces/${provinceSlug}`,
      content
    );
  } catch (error) {
    console.error(`[SEO Snapshot] Error rendering province ${code}:`, error);
    return null;
  }
}

export async function renderLocalityDetailSnapshot(slug: string): Promise<string | null> {
  try {
    const localities = await storage.getLocalities();
    
    // Decode URI components to handle encoded characters (spaces, apostrophes, etc.)
    const decodedSlug = decodeURIComponent(slug);
    const normalizedSlug = decodedSlug.toLowerCase();
    
    // Try exact slug match first (for compound slugs like "karachi/downtown-karachi")
    let locality = localities.find((l: any) => l.slug === decodedSlug || l.slug === slug);
    
    // If not found, try matching the end of slug (locality slugs are format: province/locality)
    if (!locality) {
      locality = localities.find((l: any) => {
        const parts = l.slug?.split('/');
        if (parts && parts.length > 1) {
          const localityPart = parts[parts.length - 1];
          return localityPart === decodedSlug || localityPart === slug || localityPart === normalizedSlug;
        }
        return false;
      });
    }
    
    // If still not found, try matching locality name (case-insensitive with various formats)
    if (!locality) {
      const slugWithoutDashes = normalizedSlug.replace(/-/g, ' ');
      locality = localities.find((l: any) => {
        const name = l.name?.toLowerCase() || '';
        const nameWithDashes = name.replace(/\s+/g, '-');
        return name === slugWithoutDashes || 
               nameWithDashes === normalizedSlug ||
               name === normalizedSlug;
      });
    }
    
    // If still not found, try partial matching on slug ending (for simple slugs like "downtown-karachi")
    if (!locality) {
      locality = localities.find((l: any) => {
        const parts = l.slug?.split('/');
        if (parts && parts.length > 1) {
          return parts[parts.length - 1].includes(decodedSlug) || decodedSlug.includes(parts[parts.length - 1]);
        }
        return false;
      });
    }
    
    if (!locality) {
      console.log(`[SEO Snapshot] Locality not found for slug: ${slug} (decoded: ${decodedSlug})`);
      return null;
    }

    // Get province for this locality
    const province = locality.provinceId ? await storage.getProvinceById(locality.provinceId) : null;
    const provinceName = province?.name || 'Pakistan';
    const provinceSlug = province?.code?.toLowerCase() || provinceName.toLowerCase().replace(/\s+/g, '-');

    // Get businesses in this locality
    const { businesses } = await storage.getBusinesses({ localityId: locality.id, limit: 500 });
    
    // Get categories with businesses in this locality
    const categories = await storage.getCategoriesWithStats();
    const categoryIds = Array.from(new Set(businesses.map((b: any) => b.categoryId)));
    const localityCategories = categories.filter((c: any) => categoryIds.includes(c.id)).slice(0, 15);

    const businessCards = businesses.slice(0, 30).map((biz: any) => `
      <div class="card">
        <a href="${BASE_URL}/business/${escapeHtml(biz.slug)}" data-testid="link-business-${escapeHtml(biz.slug)}">${escapeHtml(biz.name)}</a>
        <p>${escapeHtml(biz.description?.substring(0, 120) || `${biz.name} - Business in ${locality.name}`)}</p>
      </div>
    `).join('');

    const categoryLinks = localityCategories.map((cat: any) => `
      <a href="${BASE_URL}/category/${escapeHtml(cat.slug)}" style="margin-right: 15px; color: #0066cc;">${escapeHtml(cat.name)}</a>
    `).join('');

    const localityDescription = locality.description || 
      `${locality.name} is a prominent area in ${provinceName}, Pakistan, known for its diverse business landscape. ` +
      `The locality hosts ${businesses.length} registered businesses spanning various industries including ` +
      `${localityCategories.slice(0, 3).map((c: any) => c.name).join(', ')}. ` +
      `Whether you're looking for services, retail, or professional businesses, ${locality.name} offers numerous options.`;

    // Get nearby localities (same province)
    const nearbyLocalities = localities
      .filter((l: any) => l.provinceId === locality.provinceId && l.id !== locality.id)
      .slice(0, 10);

    const content = `
      <div class="breadcrumb">
        <a href="/">Home</a><span>/</span><a href="/localities">Localities</a><span>/</span>
        ${province ? `<a href="/provinces/${provinceSlug}">${escapeHtml(provinceName)}</a><span>/</span>` : ''}
        <span>${escapeHtml(locality.name)}</span>
      </div>
      <h1>Businesses in ${escapeHtml(locality.name)}, ${escapeHtml(provinceName)}</h1>
      <p class="subtitle">${escapeHtml(localityDescription.substring(0, 300))}</p>
      
      <div class="card" style="margin-bottom: 30px;">
        <h3>About ${escapeHtml(locality.name)}</h3>
        <p>${escapeHtml(localityDescription)}</p>
        <p><strong>Province:</strong> <a href="/provinces/${provinceSlug}">${escapeHtml(provinceName)}</a></p>
        <p><strong>Total Businesses:</strong> ${businesses.length}</p>
      </div>
      
      ${localityCategories.length > 0 ? `
        <h2>Business Categories in ${escapeHtml(locality.name)}</h2>
        <p>${categoryLinks}</p>
      ` : ''}
      
      <h2 style="margin-top: 30px;">Businesses in ${escapeHtml(locality.name)}</h2>
      ${businesses.length > 0 ? `
        <div class="grid">${businessCards}</div>
        ${businesses.length > 30 ? `<p><a href="/businesses?locality=${slug}">View all ${businesses.length} businesses in ${escapeHtml(locality.name)} →</a></p>` : ''}
      ` : `<p>No businesses currently listed in ${escapeHtml(locality.name)}. <a href="/add-business">Add your business</a>.</p>`}
      
      ${nearbyLocalities.length > 0 ? `
        <h2 style="margin-top: 30px;">Nearby Areas in ${escapeHtml(provinceName)}</h2>
        <p>
          ${nearbyLocalities.map((l: any) => `<a href="${BASE_URL}/localities/${escapeHtml(l.slug)}" style="margin-right: 15px; color: #0066cc;">${escapeHtml(l.name)}</a>`).join('')}
        </p>
      ` : ''}
      
      <h2 style="margin-top: 30px;">Explore More</h2>
      <div class="grid">
        <div class="card"><a href="/provinces/${provinceSlug}">All businesses in ${escapeHtml(provinceName)}</a></div>
        <div class="card"><a href="/localities">All Pakistani Localities</a></div>
        <div class="card"><a href="/categories">Browse Categories</a></div>
      </div>
    `;

    console.log(`[SEO Snapshot] Rendered locality ${slug} with ${businesses.length} businesses`);

    return generateBaseHtml(
      `Businesses in ${locality.name}, ${provinceName} | PakistanYP`,
      `Find ${businesses.length} local businesses in ${locality.name}, ${provinceName}. Browse companies in ${localityCategories.slice(0, 3).map((c: any) => c.name).join(', ')} and more.`,
      `${BASE_URL}/localities/${slug}`,
      content
    );
  } catch (error) {
    console.error(`[SEO Snapshot] Error rendering locality ${slug}:`, error);
    return null;
  }
}

export async function renderBlogListSnapshot(): Promise<string> {
  try {
    const blogPosts = await storage.getBlogPosts();
    const publishedPosts = blogPosts.filter((post: any) => post.publishedAt);
    
    const blogCards = publishedPosts.slice(0, 50).map((post: any) => {
      const excerptText = escapeHtml(post.excerpt || post.content?.replace(/<[^>]*>/g, '').substring(0, 150) || '');
      return `
      <div class="card">
        <a href="${BASE_URL}/blog/${escapeHtml(post.slug)}" data-testid="link-blog-${escapeHtml(post.slug)}">${escapeHtml(post.title)}</a>
        <p>${excerptText}</p>
        ${post.publishedAt ? `<div class="count">Published: ${new Date(post.publishedAt).toLocaleDateString()}</div>` : ''}
      </div>
    `;
    }).join('');

    const content = `
      <h1>Blog - Pakistani Business Insights & News</h1>
      <p class="subtitle">Stay updated with the latest business insights, tips, and news from across Pakistan.</p>
      
      <div class="grid">${blogCards || '<p>No blog posts available yet.</p>'}</div>
    `;

    console.log(`[SEO Snapshot] Rendered blog list with ${publishedPosts.length} posts`);

    return generateBaseHtml(
      'Blog | Pakistani Business Insights & News | PakistanYP',
      'Read the latest business insights, tips, and news from Pakistan. Expert articles on entrepreneurship, business growth, and market trends.',
      `${BASE_URL}/blog`,
      content
    );
  } catch (error) {
    console.error('[SEO Snapshot] Error rendering blog list:', error);
    throw error;
  }
}

export async function renderBlogDetailSnapshot(slug: string): Promise<string | null> {
  try {
    const post = await storage.getBlogPostBySlug(slug);
    if (!post) return null;

    // Sanitize content by removing HTML tags and escaping
    const sanitizedContent = post.content 
      ? escapeHtml(post.content.replace(/<[^>]*>/g, '')).replace(/\n/g, '<br>')
      : '<p>No content available.</p>';
    
    const descriptionText = post.excerpt 
      ? escapeHtml(post.excerpt) 
      : escapeHtml(post.content?.replace(/<[^>]*>/g, '').substring(0, 160) || `Read ${post.title} on PakistanYP blog.`);

    const content = `
      <div class="breadcrumb">
        <a href="/">Home</a>
        <span>›</span>
        <a href="/blog">Blog</a>
        <span>›</span>
        ${escapeHtml(post.title)}
      </div>
      
      <article>
        <h1>${escapeHtml(post.title)}</h1>
        ${post.publishedAt ? `<p class="count">Published: ${new Date(post.publishedAt).toLocaleDateString()}</p>` : ''}
        
        <div style="margin: 30px 0; line-height: 1.8;">
          ${sanitizedContent}
        </div>
      </article>
      
      <p><a href="/blog">← Back to Blog</a></p>
    `;

    console.log(`[SEO Snapshot] Rendered blog post: ${slug}`);

    return generateBaseHtml(
      `${escapeHtml(post.title)} | PakistanYP Blog`,
      descriptionText,
      `${BASE_URL}/blog/${slug}`,
      content
    );
  } catch (error) {
    console.error(`[SEO Snapshot] Error rendering blog post ${slug}:`, error);
    return null;
  }
}

export async function renderNewsListSnapshot(): Promise<string> {
  try {
    const newsArticles = await storage.getNewsArticles();
    const publishedNews = newsArticles.filter((article: any) => article.publishedAt);
    
    const newsCards = publishedNews.slice(0, 50).map((article: any) => {
      const summaryText = escapeHtml(article.summary || article.content?.replace(/<[^>]*>/g, '').substring(0, 150) || '');
      return `
      <div class="card">
        <a href="${BASE_URL}/news/${escapeHtml(article.slug)}" data-testid="link-news-${escapeHtml(article.slug)}">${escapeHtml(article.title)}</a>
        <p>${summaryText}</p>
        ${article.publishedAt ? `<div class="count">Published: ${new Date(article.publishedAt).toLocaleDateString()}</div>` : ''}
      </div>
    `;
    }).join('');

    const content = `
      <h1>Pakistani Business News</h1>
      <p class="subtitle">Latest business news, updates, and announcements from Pakistan.</p>
      
      <div class="grid">${newsCards || '<p>No news articles available yet.</p>'}</div>
    `;

    console.log(`[SEO Snapshot] Rendered news list with ${publishedNews.length} articles`);

    return generateBaseHtml(
      'Pakistani Business News | Latest Updates & Announcements | PakistanYP',
      'Stay informed with the latest Pakistani business news, market updates, and industry announcements across all provinces.',
      `${BASE_URL}/news`,
      content
    );
  } catch (error) {
    console.error('[SEO Snapshot] Error rendering news list:', error);
    throw error;
  }
}

export async function renderNewsDetailSnapshot(slug: string): Promise<string | null> {
  try {
    const article = await storage.getNewsArticleBySlug(slug);
    if (!article) return null;

    // Sanitize content by removing HTML tags and escaping
    const sanitizedContent = article.content 
      ? escapeHtml(article.content.replace(/<[^>]*>/g, '')).replace(/\n/g, '<br>')
      : '<p>No content available.</p>';
    
    const descriptionText = article.summary 
      ? escapeHtml(article.summary) 
      : escapeHtml(article.content?.replace(/<[^>]*>/g, '').substring(0, 160) || `Read ${article.title} on PakistanYP.`);

    const content = `
      <div class="breadcrumb">
        <a href="/">Home</a>
        <span>›</span>
        <a href="/news">News</a>
        <span>›</span>
        ${escapeHtml(article.title)}
      </div>
      
      <article>
        <h1>${escapeHtml(article.title)}</h1>
        ${article.publishedAt ? `<p class="count">Published: ${new Date(article.publishedAt).toLocaleDateString()}</p>` : ''}
        
        <div style="margin: 30px 0; line-height: 1.8;">
          ${sanitizedContent}
        </div>
      </article>
      
      <p><a href="/news">← Back to News</a></p>
    `;

    console.log(`[SEO Snapshot] Rendered news article: ${slug}`);

    return generateBaseHtml(
      `${escapeHtml(article.title)} | Pakistani Business News | PakistanYP`,
      descriptionText,
      `${BASE_URL}/news/${slug}`,
      content
    );
  } catch (error) {
    console.error(`[SEO Snapshot] Error rendering news article ${slug}:`, error);
    return null;
  }
}

export async function renderHomepageSnapshot(): Promise<string> {
  try {
    const { businesses } = await storage.getBusinesses({ limit: 1000 });
    const categories = await storage.getCategoriesWithStats();
    const provinces = await storage.getProvinces();
    
    const featuredBusinesses = businesses.slice(0, 20);
    const featuredCategories = [...categories].sort((a, b) => (b.businessCount || 0) - (a.businessCount || 0)).slice(0, 20);
    
    const businessCards = featuredBusinesses.map((biz: any) => `
      <div class="card">
        <a href="${BASE_URL}/business/${escapeHtml(biz.slug)}" data-testid="link-business-${escapeHtml(biz.slug)}">${escapeHtml(biz.name)}</a>
        <p>${escapeHtml(biz.description?.substring(0, 100) || `${biz.name} in Pakistan`)}</p>
      </div>
    `).join('');

    const categoryCards = featuredCategories.map((cat: any) => `
      <div class="card">
        <a href="${BASE_URL}/categories/${escapeHtml(cat.slug)}" data-testid="link-category-${escapeHtml(cat.slug)}">${escapeHtml(cat.name)}</a>
        <div class="count">${cat.businessCount || 0} businesses</div>
      </div>
    `).join('');

    const provinceLinks = provinces.map((e: any) => {
      const provinceSlug = e.code?.toLowerCase() || e.name.toLowerCase().replace(/\s+/g, '-');
      return `<a href="${BASE_URL}/provinces/${escapeHtml(provinceSlug)}" style="margin-right: 15px; color: #0066cc;">${escapeHtml(e.name)}</a>`;
    }).join('');

    const content = `
      <h1>PakistanYP - Pakistani Business Directory</h1>
      <p class="subtitle">Discover ${businesses.length} businesses across ${categories.length} categories in all provinces and territories of Pakistan.</p>
      
      <h2>Provinces</h2>
      <p>${provinceLinks}</p>
      
      <h2>Featured Businesses</h2>
      <div class="grid">${businessCards}</div>
      <p><a href="/businesses">View all ${businesses.length} businesses →</a></p>
      
      <h2>Popular Categories</h2>
      <div class="grid">${categoryCards}</div>
      <p><a href="/categories">View all ${categories.length} categories →</a></p>
    `;

    console.log(`[SEO Snapshot] Rendered homepage with ${featuredBusinesses.length} businesses, ${featuredCategories.length} categories`);

    return generateBaseHtml(
      'PakistanYP - Pakistani Business Directory | Find Companies in Karachi, Lahore & All Provinces',
      `Discover ${businesses.length} verified businesses across ${categories.length} categories in Pakistan. Find local companies in Karachi, Lahore, Islamabad, and all provinces and territories.`,
      BASE_URL,
      content
    );
  } catch (error) {
    console.error('[SEO Snapshot] Error rendering homepage:', error);
    throw error;
  }
}
