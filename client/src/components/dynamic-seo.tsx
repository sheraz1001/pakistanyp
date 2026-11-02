import React, { useEffect, useState } from "react";
import { Helmet } from "@/lib/helmet-compat";

interface DynamicSEOProps {
  type: 'category' | 'province' | 'locality';
  id: number;
  fallback?: {
    title?: string;
    description?: string;
    keywords?: string;
  };
}

interface SEOData {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  schemaMarkup?: any;
}

export function DynamicSEO({ type, id, fallback }: DynamicSEOProps) {
  const [seoData, setSeoData] = useState<SEOData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSEOData = async () => {
      try {
        const response = await fetch(`/api/seo/${type}/${id}`);
        if (response.ok) {
          const data = await response.json();
          setSeoData(data.seoData);
        } else {
          // Use fallback if no SEO data exists
          if (fallback) {
            setSeoData({
              metaTitle: fallback.title || "Pakistani Business Directory | pakistanyp.com",
              metaDescription: fallback.description || "Find the best businesses in Pakistan",
              keywords: fallback.keywords || "Pakistan, business, directory"
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch SEO data:", error);
        if (fallback) {
          setSeoData({
            metaTitle: fallback.title || "Pakistani Business Directory | pakistanyp.com",
            metaDescription: fallback.description || "Find the best businesses in Pakistan",
            keywords: fallback.keywords || "Pakistan, business, directory"
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSEOData();
  }, [type, id, fallback]);

  if (loading || !seoData) {
    return (
      <Helmet>
        <title>{fallback?.title || "Loading... | pakistanyp.com"}</title>
        <meta name="description" content={fallback?.description || "Loading Pakistani business directory"} />
      </Helmet>
    );
  }

  return (
    <Helmet>
      <title>{seoData.metaTitle}</title>
      <meta name="description" content={seoData.metaDescription} />
      <meta name="keywords" content={seoData.keywords} />
      
      {/* Open Graph tags */}
      <meta property="og:title" content={seoData.metaTitle} />
      <meta property="og:description" content={seoData.metaDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="PakistanYP.com" />
      
      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={seoData.metaTitle} />
      <meta name="twitter:description" content={seoData.metaDescription} />
      
      {/* Schema markup */}
      {seoData.schemaMarkup && (
        <script type="application/ld+json">
          {JSON.stringify(seoData.schemaMarkup)}
        </script>
      )}
    </Helmet>
  );
}

export default DynamicSEO;