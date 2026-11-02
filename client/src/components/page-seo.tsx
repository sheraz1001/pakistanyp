import { clampTitle, clampDescription } from "@/lib/seo-text";
import React from "react";
import { Helmet } from "@/lib/helmet-compat";
import { country } from "@shared/country";

interface PageSEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  /** One JSON-LD object or an array of them */
  schemaMarkup?: any;
  noindex?: boolean;
}

/**
 * SEO component that uses existing meta data from API responses
 * No additional API calls needed - uses data already fetched
 */
export function PageSEO({ 
  title,
  description,
  keywords,
  canonicalUrl,
  ogTitle,
  ogDescription,
  ogImage,
  twitterTitle,
  twitterDescription,
  twitterImage,
  schemaMarkup,
  noindex = false
}: PageSEOProps) {
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const abs = (src?: string) => (!src ? undefined : /^https?:\/\//.test(src) ? src : `${country.origin}${src.startsWith("/") ? "" : "/"}${src}`);
  const image = abs(ogImage) || abs(twitterImage) || `${country.origin}${country.ogImage}`;
  const schemas = (Array.isArray(schemaMarkup) ? schemaMarkup : schemaMarkup ? [schemaMarkup] : [])
    .filter((d: any) => d && d["@type"] !== "Organization");
  const robotsContent = noindex ? "noindex, follow" : "index, follow, max-image-preview:large";
  
  title = clampTitle(title);
  description = clampDescription(description);
  return (
    <Helmet>
      {/* Basic meta tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Open Graph tags */}
      <meta property="og:title" content={ogTitle || title} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="PakistanYP.com - Pakistani Business Directory" />
      <meta property="og:url" content={canonicalUrl || currentUrl} />
      <meta property="og:image" content={image} />
      
      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={twitterTitle || ogTitle || title} />
      <meta name="twitter:description" content={twitterDescription || ogDescription || description} />
      <meta name="twitter:image" content={abs(twitterImage) || image} />
      
      {/* Additional SEO tags */}
      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={robotsContent} />
      <meta name="language" content="en" />
      <meta name="geo.region" content="AE" />
      <meta name="geo.country" content="AE" />
      
      {/* Schema markup */}
      {schemas.map((d: any, i: number) => (
        <script key={i} type="application/ld+json">{JSON.stringify({ "@context": "https://schema.org", ...d })}</script>
      ))}
    </Helmet>
  );
}

export default PageSEO;