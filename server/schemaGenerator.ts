import { country } from "@shared/country";
import type { Business, Category, Locality, Province, BlogPost } from "@shared/schema";

// Base configuration
const BASE_URL = country.origin;
const SITE_NAME = country.directoryName;
const SITE_LOGO = `${BASE_URL}${country.logo.full}`;

// Helper function to escape JSON-LD content
function escapeJSONLD(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

// Map category names to specific LocalBusiness types
function getCategorySchemaType(categoryName: string): string {
  const categoryMap: Record<string, string> = {
    'restaurant': 'Restaurant',
    'restaurants': 'Restaurant',
    'fast food': 'FastFoodRestaurant',
    'cafe': 'CafeOrCoffeeShop',
    'coffee shop': 'CafeOrCoffeeShop',
    'hotel': 'Hotel',
    'hotels': 'Hotel',
    'resort': 'Resort',
    'dentist': 'Dentist',
    'dental': 'Dentist',
    'pharmacy': 'Pharmacy',
    'pharmacies': 'Pharmacy',
    'hospital': 'Hospital',
    'medical clinic': 'MedicalClinic',
    'clinic': 'MedicalClinic',
    'doctor': 'Physician',
    'physician': 'Physician',
    'auto repair': 'AutoRepair',
    'car repair': 'AutoRepair',
    'car dealer': 'AutoDealer',
    'gas station': 'GasStation',
    'lawyer': 'Attorney',
    'attorney': 'Attorney',
    'legal': 'Attorney',
    'accountant': 'AccountingService',
    'accounting': 'AccountingService',
    'real estate': 'RealEstateAgent',
    'property': 'RealEstateAgent',
    'salon': 'HairSalon',
    'hair salon': 'HairSalon',
    'barber': 'HairSalon',
    'beauty salon': 'BeautySalon',
    'clothing': 'ClothingStore',
    'apparel': 'ClothingStore',
    'book store': 'BookStore',
    'bookstore': 'BookStore',
    'jewelry': 'JewelryStore',
    'bakery': 'Bakery',
    'gym': 'HealthClub',
    'fitness': 'HealthClub',
    'bank': 'BankOrCreditUnion',
    'banking': 'BankOrCreditUnion',
  };

  const lowerCategory = categoryName.toLowerCase();
  for (const [key, value] of Object.entries(categoryMap)) {
    if (lowerCategory.includes(key)) {
      return value;
    }
  }
  return 'LocalBusiness';
}

// Generate schema for a business detail page
export function generateBusinessSchema(
  business: any,
  category?: Category,
  province?: Province,
  locality?: Locality,
  reviews?: any[]
): any {
  const schemaType = category ? getCategorySchemaType(category.name) : 'LocalBusiness';
  
  const schema: any = {
    "@context": "https://schema.org",
    "@type": schemaType,
    "name": business.name,
    "url": `${BASE_URL}/business/${business.slug}`,
  };

  // Add description
  if (business.description) {
    schema.description = business.description;
  }

  // Add logo/image
  if (business.logoUrl) {
    schema.image = business.logoUrl;
    schema.logo = business.logoUrl;
  }

  // Add contact information
  if (business.phone) {
    schema.telephone = business.phone;
  }
  if (business.email) {
    schema.email = business.email;
  }
  if (business.website) {
    schema.url = business.website;
  }

  // Add address
  if (province || locality) {
    schema.address = {
      "@type": "PostalAddress",
      addressCountry: "AE"
    };
    
    if (locality) {
      schema.address.addressLocality = locality.name;
    }
    if (province) {
      schema.address.addressRegion = province.name;
    }
    if (business.address) {
      schema.address.streetAddress = business.address;
    }
  }

  // Add geographic coordinates
  if (business.latitude && business.longitude) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: business.latitude,
      longitude: business.longitude
    };
  }

  // Add price range
  if (business.priceRange) {
    schema.priceRange = business.priceRange;
  }

  // Add opening hours
  if (business.openingHours) {
    schema.openingHoursSpecification = parseOpeningHours(business.openingHours);
  }

  // Add ratings and reviews
  if (reviews && reviews.length > 0) {
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: avgRating.toFixed(1),
      reviewCount: reviews.length,
      bestRating: "5",
      worstRating: "1"
    };

    // Add individual reviews (limit to 5 most recent)
    schema.review = reviews.slice(0, 5).map(review => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: review.userName || "Anonymous"
      },
      datePublished: review.createdAt,
      reviewBody: review.comment,
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating.toString(),
        bestRating: "5",
        worstRating: "1"
      }
    }));
  }

  // Add social media links
  const socialLinks = [];
  if (business.facebookUrl) socialLinks.push(business.facebookUrl);
  if (business.instagramUrl) socialLinks.push(business.instagramUrl);
  if (business.linkedinUrl) socialLinks.push(business.linkedinUrl);
  if (business.twitterUrl) socialLinks.push(business.twitterUrl);
  if (socialLinks.length > 0) {
    schema.sameAs = socialLinks;
  }

  return schema;
}

// Helper to parse opening hours (if stored as JSON or string)
function parseOpeningHours(hours: any): any[] {
  if (typeof hours === 'string') {
    try {
      hours = JSON.parse(hours);
    } catch {
      return [];
    }
  }
  
  if (Array.isArray(hours)) {
    return hours;
  }
  
  return [];
}

// Generate schema for province page
export function generateProvinceSchema(province: Province): any {
  return {
    "@context": "https://schema.org",
    "@type": "AdministrativeArea",
    "name": province.name,
    "alternateName": province.arabicName,
    "url": `${BASE_URL}/provinces/${province.slug}`,
    "description": `Business directory for ${province.name}, Pakistan`,
    "containedInPlace": {
      "@type": "Country",
      "name": "Pakistan",
      "alternateName": "Pakistan"
    }
  };
}

// Generate schema for category page
export function generateCategorySchema(category: Category, businessCount: number = 0): any {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${category.name} in Pakistan`,
    "description": category.description || `Find ${category.name.toLowerCase()} businesses across Pakistan`,
    "url": `${BASE_URL}/categories/${category.slug}`,
    "about": {
      "@type": "Thing",
      "name": category.name,
      "description": category.description
    },
    "numberOfItems": businessCount
  };
}

// Generate schema for locality page
export function generateLocalitySchema(
  locality: Locality,
  province?: Province,
  businessCount: number = 0
): any {
  return {
    "@context": "https://schema.org",
    "@type": "Place",
    "name": locality.name,
    "url": `${BASE_URL}/localities/${locality.slug}`,
    "description": locality.description || `Find businesses in ${locality.name}, Pakistan`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": locality.name,
      "addressRegion": province?.name || "Pakistan",
      "addressCountry": "AE"
    },
    "numberOfBusinesses": businessCount
  };
}

// Generate schema for blog post
export function generateBlogPostSchema(post: any, author?: any): any {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt || post.metaDescription,
    "image": post.featuredImage || `${BASE_URL}/og-homepage.jpg`,
    "datePublished": post.publishedAt || post.createdAt,
    "dateModified": post.updatedAt || post.createdAt,
    "author": {
      "@type": "Person",
      "name": author?.name || post.authorName || "Pakistan Yellow Pages Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": SITE_NAME,
      "logo": {
        "@type": "ImageObject",
        "url": SITE_LOGO
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${BASE_URL}/blog/${post.slug}`
    }
  };
}

// Generate schema for breadcrumbs
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>): any {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

// Generate schema for organization (homepage)
export function generateOrganizationSchema(): any {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": SITE_NAME,
    "alternateName": "PakistanYP",
    "url": BASE_URL,
    "logo": SITE_LOGO,
    "description": "Pakistan's comprehensive business directory. Find verified businesses across all provinces and territories with reviews, contact information, and ratings.",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "info@pakistanyp.com",
      "availableLanguage": ["English", "Arabic"]
    },
    "areaServed": {
      "@type": "Country",
      "name": "Pakistan"
    },
  };
}

// Generate schema for website (homepage - search functionality)
export function generateWebSiteSchema(): any {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": SITE_NAME,
    "alternateName": "PakistanYP",
    "url": BASE_URL,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${BASE_URL}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}

// Generate schema for categories listing page
export function generateCategoriesListingSchema(totalCategories: number): any {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Business Categories in Pakistan",
    "description": "Browse all business categories across Pakistan",
    "url": `${BASE_URL}/categories`,
    "numberOfItems": totalCategories
  };
}

// Generate schema for localities listing page
export function generateLocalitiesListingSchema(totalLocalities: number): any {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Pakistani Localities and Areas",
    "description": "Browse all localities and neighborhoods across Pakistan",
    "url": `${BASE_URL}/localities`,
    "numberOfItems": totalLocalities
  };
}

// Generate schema for blog listing page
export function generateBlogListingSchema(totalPosts: number): any {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Pakistani Business Blog",
    "description": "Expert articles about doing business in Pakistan",
    "url": `${BASE_URL}/blog`,
    "numberOfItems": totalPosts,
    "about": {
      "@type": "Thing",
      "name": "Business in Pakistan",
      "description": "Business insights, guides, and tips for Pakistani market"
    }
  };
}

// Helper function to generate multiple schemas (returns array)
export function generateMultipleSchemas(...schemas: any[]): string {
  const validSchemas = schemas.filter(s => s !== null && s !== undefined);
  if (validSchemas.length === 1) {
    return `<script type="application/ld+json">${JSON.stringify(validSchemas[0], null, 2)}</script>`;
  }
  return validSchemas
    .map(schema => `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`)
    .join('\n');
}

// Single function to inject all schemas into HTML
export function injectSchemasIntoHTML(html: string, ...schemas: any[]): string {
  const schemaScripts = generateMultipleSchemas(...schemas);
  return html.replace(/<\/head>/i, `${schemaScripts}\n</head>`);
}
