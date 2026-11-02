import { clampTitle, clampDescription } from "@/lib/seo-text";
import { Helmet } from "@/lib/helmet-compat";
import { useLocation } from "wouter";
import { country } from "@shared/country";
import { geoFrom } from "@/lib/structured-data";

/**
 * Page <head> manager.
 *
 * Rewritten Oct 2026: the previous version wrote tags with document.* inside
 * useEffect, which never runs during SSR — so every server-rendered page had the
 * generic homepage title/description. Rendering through Helmet puts the tags in
 * the SSR HTML (see entry-server.tsx + server/ssrPage.ts) and keeps them in sync
 * on client-side navigation.
 */
const SITE_ORIGIN = country.origin;

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  /** @deprecated always summary_large_image */
  twitterCard?: string;
  twitterSite?: string;
  schemaType?: string;
  schemaData?: any;
  alternateLanguages?: { lang: string; href: string }[];
  robotsContent?: string;
  structuredData?: any[];
}

function canonicalFromPath(path: string) {
  let p = (path || "/").split("?")[0].toLowerCase();
  if (p.length > 1) p = p.replace(/\/+$/, "");
  return SITE_ORIGIN + (p || "/");
}

const absolute = (src: string) => (/^https?:\/\//.test(src) ? src : SITE_ORIGIN + (src.startsWith("/") ? src : "/" + src));

export function SEO({
  title,
  description,
  keywords,
  canonical,
  ogTitle,
  ogDescription,
  ogImage = country.ogImage,
  ogType = "website",
  twitterSite = "@PakistanYP",
  schemaType = "WebPage",
  schemaData,
  robotsContent = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  structuredData = [],
}: SEOProps) {
  const [location] = useLocation();
  title = clampTitle(title);
  description = clampDescription(description);
  const url = canonical ? canonical.replace(/^https?:\/\/[^/]+/, SITE_ORIGIN) : canonicalFromPath(location);
  const image = absolute(ogImage || country.ogImage);
  // Large preview cards site-wide (audit 2026-11)
  const twitterCard = "summary_large_image";

  // Page entity only when the page supplies one. The single site-wide
  // Organization lives in index.html, so it is never repeated here.
  const primarySchema = schemaData ? { "@context": "https://schema.org", "@type": schemaType, ...schemaData } : null;
  const allStructuredData = [primarySchema, ...(structuredData || [])]
    .filter(Boolean)
    .filter((d: any) => d["@type"] !== "Organization");

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords ? <meta name="keywords" content={keywords} /> : null}
      <meta name="robots" content={robotsContent} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={ogTitle || title} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="PakistanYP - Pakistani Business Directory" />
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:site" content={twitterSite} />
      <meta name="twitter:title" content={ogTitle || title} />
      <meta name="twitter:description" content={ogDescription || description} />
      <meta name="twitter:image" content={image} />
      {allStructuredData.map((data, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(data)}</script>
      ))}
    </Helmet>
  );
}

// Predefined SEO configurations for different page types
export const SEOConfigs = {
  homepage: {
    title: "Pakistan Yellow Pages – Business Directory | PakistanYP",
    description: "Find companies across Karachi, Lahore, Islamabad and all provinces and territories. Search by category and area, compare details and contact businesses directly.",
    keywords: "Pakistani yellow pages, Pakistan business directory, Karachi businesses, Lahore companies, Pakistan companies, find businesses Pakistan, business listings Pakistan, verified Pakistani directory, province businesses",
    canonical: `${country.origin}/`,
    ogTitle: "PakistanYP – Pakistan Business Directory for Every Province",
    ogDescription: "Search businesses by category and area across Karachi, Lahore, Islamabad and every province. Compare details and contact companies directly.",
    ogImage: `${country.origin}${country.ogImage}`,
    schemaType: "WebSite",
    structuredData: [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "PakistanYP - Pakistan Yellow Pages",
        "alternateName": "Pakistani Business Directory",
        "url": country.origin,
        "description": "Business directory for Pakistan covering all provinces and territories.",
        "publisher": {
          "@type": "Organization",
          "@id": `${country.origin}/#organization`
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": `${country.origin}/search?q={search_term_string}`
          },
          "query-input": "required name=search_term_string"
        },
        "mainEntity": {
          "@id": `${country.origin}/#organization`
        }
      },
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": `${country.origin}/#organization`,
        "name": "PakistanYP",
        "alternateName": "Pakistan Yellow Pages",
        "description": "Pakistan's most trusted business directory featuring verified listings, authentic reviews, and comprehensive business information across all provinces and territories.",
        "url": country.origin,
        "logo": {
          "@type": "ImageObject",
          "url": `${country.origin}${country.logo.full}`,
          "width": 1338,
          "height": 490
        },
        "foundingDate": "2024",
        "areaServed": {
          "@type": "Country",
          "name": "Pakistan"
        },
        "knowsAbout": [
          "Business Directory Services",
          "Pakistani Business Listings", 
          "Company Information",
          "Business Reviews",
          "Local Search",
          "B2B Directory"
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer service",
          "email": `support@${country.domain}`,
          "availableLanguage": ["English"]
        },
        "sameAs": country.social.map((s) => s.href)
      }
    ]
  },
  
  businessListing: (business: any) => {
    const clean = (v: any) => (typeof v === "string" && v.trim() && v !== "undefined" ? v.trim() : "");
    const place = clean(business.localityName) || clean(business.city) || clean(business.provinceName) || clean(business.province) || "Pakistan";
    const category = clean(business.categoryName) || clean(typeof business.category === "string" ? business.category : business.category?.name);
    const plain = (clean(business.shortDescription) || clean(business.description)).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const name = clean(business.name).replace(/\s*\|\s*/g, " – ");
    const metaTitle = clean(business.metaTitle).replace(/\s*\|\s*(pakistanyp|pk yellow pages).*$/i, "");
    const candidates = [
      metaTitle && metaTitle.length <= 57 ? `${metaTitle} | PakistanYP` : "",
      category ? `${name} – ${category} in ${place} | PakistanYP` : "",
      `${name} in ${place} | PakistanYP`,
      `${name} | PakistanYP`,
    ].filter(Boolean);
    const title = candidates.find((t) => t.length <= 65) || candidates[candidates.length - 1];
    let description = clean(business.metaDescription) || plain || "";
    if (description.length < 70) description = `${description ? description.replace(/[.\s]+$/, "") + ". " : ""}${name}${category ? " – " + category : ""} in ${place}, Pakistan: address, phone, opening hours and reviews on Pakistan Yellow Pages.`;
    description = description.slice(0, 160);
    const ratingCount = Number(business.ratingCount || 0);
    const ratingValue = Number(business.ratingAverage || business.rating || 0);
    return {
      title,
      description,
      canonical: `${country.origin}/business/${business.slug}`,
      ogImage: business.logoUrl || business.logo || undefined,
      schemaType: "LocalBusiness",
      schemaData: {
        "@type": "LocalBusiness",
        "@id": `${country.origin}/business/${business.slug}#business`,
        name: business.name,
        alternateName: clean(business.arabicName) || undefined,
        description: plain ? plain.slice(0, 300) : undefined,
        url: `${country.origin}/business/${business.slug}`,
        sameAs: clean(business.website) ? [business.website] : undefined,
        image: business.logoUrl || business.logo || undefined,
        address: {
          "@type": "PostalAddress",
          streetAddress: clean(business.address) || undefined,
          addressLocality: place,
          addressCountry: country.iso,
        },
        telephone: clean(business.phone) || undefined,
        geo: geoFrom(business.coordinates),
        email: clean(business.email) || undefined,
        aggregateRating: ratingCount > 0 && ratingValue > 0
          ? { "@type": "AggregateRating", ratingValue, reviewCount: ratingCount }
          : undefined,
        // Organization defaults from <SEO> must not leak into a business entity
        logo: undefined,
        areaServed: undefined,
      },
    };
  },

  categoryPage: (category: any) => ({
    title: `${category.name} in Pakistan - Find Best ${category.name} | PakistanYP Directory`,
    description: `Discover top-rated ${category.name.toLowerCase()} businesses across Pakistan. Browse verified listings in Karachi, Lahore, Islamabad and other provinces. Reviews, ratings, and contact details available.`,
    keywords: `${category.name} Pakistan, ${category.name} Karachi, ${category.name} Lahore, best ${category.name.toLowerCase()}, Pakistan ${category.name.toLowerCase()}`,
    canonical: `${country.origin}/categories/${category.slug}`,
    schemaType: "CollectionPage",
    schemaData: {
      "@type": "CollectionPage",
      "name": `${category.name} in Pakistan`,
      "description": `Directory of ${category.name.toLowerCase()} businesses in Pakistan`,
      "url": `${country.origin}/categories/${category.slug}`
    }
  }),

  provincePage: (province: any) => ({
    title: `Businesses in ${province.name}, Pakistan - Complete Directory | PakistanYP`,
    description: `Find all types of businesses in ${province.name}, Pakistan. Comprehensive directory with contact details, reviews, and ratings for companies in ${province.name}.`,
    keywords: `${province.name} businesses, ${province.name} companies, ${province.name} directory, ${province.name} Pakistan`,
    canonical: `${country.origin}/${province.name.toLowerCase().replace(/\s+/g, '-')}`,
    schemaType: "Place",
    schemaData: {
      "@type": "Place",
      "name": province.name,
      "description": `Business directory for ${province.name}, Pakistan`,
      "address": {
        "@type": "PostalAddress",
        "addressRegion": province.name,
        "addressCountry": country.iso
      }
    }
  }),

  staticPage: (pageTitle: string, pageDescription: string) => ({
    title: `${pageTitle} | PakistanYP - Pakistani Business Directory`,
    description: pageDescription,
    keywords: `PakistanYP, Pakistan business directory, ${pageTitle.toLowerCase()}`,
    schemaType: "WebPage"
  }),
  
  // Categories page schema
  categories: {
    title: "Business Categories in Pakistan | PakistanYP Directory",
    description: "Browse business categories across all Pakistani provinces. Find restaurants, retail, services, healthcare, finance & more. Complete directory of Pakistan businesses by industry.",
    keywords: "Pakistani business categories, Karachi business types, Lahore industries, business directory categories, Pakistan company types, commercial categories Pakistan",
    canonical: `${country.origin}/categories`,
    structuredData: [{
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Business Categories - PakistanYP",
      "description": "Complete categorized directory of Pakistan businesses across all industries",
      "url": `${country.origin}/categories`,
      "mainEntity": {
        "@type": "ItemList",
        "itemListElement": []
      }
    }]
  },

  // Provinces page schema
  provinces: {
    title: "Pakistani Provinces Business Directory | All Provinces & Territories | PakistanYP",
    description: "Comprehensive business listings across all Pakistani provinces. Find companies in Karachi, Lahore, Islamabad, Rawalpindi, Peshawar, Faisalabad & Multan with detailed profiles.",
    keywords: "Pakistani provinces businesses, Karachi companies, Lahore businesses, Islamabad directory, all provinces Pakistan, Pakistan business locations",
    canonical: `${country.origin}${country.regionsPath}`,
    structuredData: [{
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Pakistani Provinces Directory - PakistanYP",
      "description": "Business directory covering all provinces and territories of Pakistan",
      "url": `${country.origin}${country.regionsPath}`
    }]
  },

  // Localities page schema
  localities: {
    title: "Pakistani Business Localities – Areas & Districts | PakistanYP",
    description: "Find businesses by area in Pakistan. Browse localities across Karachi, Lahore, Islamabad & all provinces. Local business directory with detailed area coverage.",
    keywords: "Pakistani business areas, Karachi localities, Lahore districts, business by location Pakistan, local businesses Pakistan, area wise directory",
    canonical: `${country.origin}/localities`,
    structuredData: [{
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Pakistani Business Localities - PakistanYP",
      "description": "Comprehensive directory of businesses organized by local areas and districts",
      "url": `${country.origin}/localities`
    }]
  },

  // News page schema
  news: {
    title: "Pakistani Business News & Industry Updates | Latest News | PakistanYP",
    description: "Stay updated with latest Pakistani business news, industry trends, market analysis & economic updates. Daily coverage of Karachi, Lahore & Pakistani business developments.",
    keywords: "Pakistani business news, Karachi business updates, Lahore business news, Pakistan economy news, business trends Pakistan, industry news Pakistan",
    canonical: `${country.origin}/news`,
    structuredData: [{
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Pakistani Business News - PakistanYP",
      "description": "Latest business news and industry updates from across Pakistan",
      "url": `${country.origin}/news`
    }]
  },

  // Add Business page schema
  addBusiness: {
    title: "Add Your Business to Pakistan's Leading Directory | PakistanYP",
    description: "List your business in the PakistanYP directory. Reach customers across Karachi, Lahore & all provinces. Free and premium listing options available.",
    keywords: "add business Pakistan, list business Karachi, Pakistan business directory listing, register business Lahore, Pakistan yellow pages registration",
    canonical: `${country.origin}/add-business`,
    structuredData: [{
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Add Business - PakistanYP",
      "description": "Register your business with Pakistan's premier business directory",
      "url": `${country.origin}/add-business`
    }]
  },

  // Blog page schema
  blog: {
    title: "Pakistani Business Blog - Expert Insights & Industry News | PakistanYP",
    description: "Discover expert insights, business tips, and industry trends in Pakistan. Your go-to resource for business success in the Provinces with comprehensive market analysis.",
    keywords: "Pakistani business blog, business insights Pakistan, Karachi business tips, Lahore entrepreneurship, Pakistan startup guide, business trends Pakistan, industry analysis",
    canonical: `${country.origin}/blog`,
    ogTitle: "PakistanYP Business Blog - Pakistani Business Insights & Tips",
    ogDescription: "Discover expert insights, business tips, and industry trends in Pakistan. Your go-to resource for business success in the Provinces.",
    ogImage: `${country.origin}${country.ogImage}`,
    schemaType: "Blog",
    structuredData: [{
      "@context": "https://schema.org",
      "@type": "Blog",
      "name": "PakistanYP Business Blog",
      "description": "Expert insights and tips about Pakistani business landscape",
      "url": `${country.origin}/blog`,
      "publisher": {
        "@type": "Organization",
        "name": "PakistanYP",
        "logo": {
          "@type": "ImageObject",
          "url": `${country.origin}${country.logo.full}`
        }
      }
    }]
  },

  // AI Recommendations page schema
  aiRecommendations: {
    title: "AI-Powered Business Recommendations | Smart Business Discovery | PakistanYP",
    description: "Get intelligent business recommendations powered by AI. Discover the perfect businesses in Pakistan with smart matching technology based on your preferences and location.",
    keywords: "AI business recommendations, smart business search, Pakistan business directory AI, artificial intelligence business finder, personalized business discovery",
    canonical: `${country.origin}/ai-recommendations`,
    ogTitle: "AI Business Recommendations - Smart Discovery | PakistanYP",
    ogDescription: "Discover businesses tailored to your needs using advanced AI technology. Smart matching for Pakistan businesses.",
    ogImage: `${country.origin}${country.ogImage}`,
    schemaType: "WebPage",
    structuredData: [{
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "AI Business Recommendations - PakistanYP",
      "description": "AI-powered business recommendation engine for Pakistan businesses",
      "url": `${country.origin}/ai-recommendations`,
      "mainEntity": {
        "@type": "SoftwareApplication",
        "name": "AI Business Recommendation Engine",
        "description": "Intelligent system for discovering businesses based on user preferences and location",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web Browser"
      }
    }]
  }
};

export default SEO;
