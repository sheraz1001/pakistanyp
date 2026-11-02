import React, { useEffect } from 'react';
import { Helmet } from '@/lib/helmet-compat';
import Header from '@/components/header';
import Footer from '@/components/footer';
import InteractiveCategoryHierarchy from '@/components/interactive-category-hierarchy';
import { CategoryRequestForm } from '@/components/category-request-form';
import { country, localize } from '@shared/country';
import { t as tx } from "@shared/i18n";

export default function CategoryHierarchyPage() {
  useEffect(() => {
    // Additional SEO optimizations for Google ranking
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.innerHTML = localize(JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Pakistani Business Directory Category Hierarchy - Complete Business Categories",
      "description": "Explore 918 business categories across Pakistan. Complete hierarchical directory of businesses in Karachi, Lahore, Islamabad and all Provinces. Interactive category visualization with search and filtering.",
      "url": "https://pakistanyp.com/category-hierarchy",
      "mainEntity": {
        "@type": "ItemList",
        "name": "Pakistani Business Categories",
        "description": "Complete list of business categories in Pakistan",
        "numberOfItems": "918",
        "itemListElement": [
          {
            "@type": "Thing",
            "name": "Accounting, Audit & Tax",
            "description": "Financial services including accounting, auditing, and tax consultancy"
          },
          {
            "@type": "Thing", 
            "name": "Construction & Engineering",
            "description": "Construction companies, engineering services, and infrastructure development"
          },
          {
            "@type": "Thing",
            "name": "Technology & IT Services", 
            "description": "IT companies, software development, and technology solutions"
          }
        ]
      },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://pakistanyp.com"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Categories",
            "item": "https://pakistanyp.com/categories"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "Category Hierarchy",
            "item": "https://pakistanyp.com/category-hierarchy"
          }
        ]
      },
      "publisher": {
        "@type": "Organization",
        "name": "PakistanYP Business Directory",
        "url": "https://pakistanyp.com"
      }
    }));
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <>
      <Helmet>
        {/* Primary SEO Meta Tags */}
        <title>All Business Categories in Pakistan – Full List | PakistanYP</title>
        <meta name="description" content="Browse every business category and subcategory on Pakistan Yellow Pages, from construction and healthcare to IT, retail and services across Pakistan." />
        <meta name="keywords" content="Pakistani business categories, Karachi business directory, Lahore companies, Islamabad businesses, business classification Pakistan, company categories Provinces, Pakistan business listing, business hierarchy Pakistan, commercial directory Pakistan" />
        
        {/* Advanced SEO Meta Tags */}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        <meta name="bingbot" content="index, follow" />
        <meta name="author" content="PakistanYP Business Directory" />
        <meta name="language" content="English" />
        <meta name="geo.region" content={country.iso} />
        <meta name="geo.country" content="Pakistan" />
        <meta name="geo.placename" content="Pakistan" />
        <meta name="ICBM" content="25.2048,55.2708" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://pakistanyp.com/category-hierarchy" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Pakistani Business Directory Category Hierarchy - 918 Business Categories | PakistanYP" />
        <meta property="og:description" content="Explore 918 business categories across Pakistan. Complete hierarchical directory of businesses in Karachi, Lahore, Islamabad and all Provinces. Interactive category visualization with search and filtering." />
        <meta property="og:url" content="https://pakistanyp.com/category-hierarchy" />
        <meta property="og:site_name" content="PakistanYP Business Directory" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:image" content="https://pakistanyp.com/og-homepage.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Pakistani Business Category Hierarchy Visualization" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pakistani Business Directory Category Hierarchy - 918 Categories" />
        <meta name="twitter:description" content="Explore 918 business categories across Pakistan. Complete hierarchical directory with interactive visualization and search." />
        <meta name="twitter:image" content="https://pakistanyp.com/og-homepage.jpg" />
        <meta name="twitter:site" content="@PakistanYP" />
        <meta name="twitter:creator" content="@PakistanYP" />
        
        {/* Additional Meta Tags for Better Ranking */}
        <meta name="theme-color" content="#4F46E5" />
        <meta name="msapplication-TileColor" content="#4F46E5" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Hreflang for International SEO */}
        <link rel="alternate" hrefLang="en" href="https://pakistanyp.com/category-hierarchy" />
        <link rel="alternate" hrefLang="ar" href="https://pakistanyp.com/ar/category-hierarchy" />
        
        {/* Preconnect for Performance */}
        <link rel="preconnect" href="https://api.pakistanyp.com" />
        <link rel="dns-prefetch" href="https://api.pakistanyp.com" />
      </Helmet>

      <Header />
      
      <main className="min-h-screen bg-[#FAF8F3]">
        {/* Breadcrumb Navigation for SEO */}
        <nav aria-label="Breadcrumb" className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-3">
            <ol className="flex items-center space-x-2 rtl:space-x-reverse text-sm">
              <li>
                <a href="/" className="text-blue-600 hover:text-blue-800">Home</a>
              </li>
              <li className="text-gray-400">/</li>
              <li>
                <a href="/categories" className="text-blue-600 hover:text-blue-800">Categories</a>
              </li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-600" aria-current="page">Category Hierarchy</li>
            </ol>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-8">
          {/* SEO-Optimized Header Section */}
          <header className="mb-8 text-center">
            <h1 className="yp-h1 text-[#0A0A0A] mb-4">
              {localize("Pakistani Business Directory Category Hierarchy")}
            </h1>
            <h2 className="text-xl md:text-2xl text-gray-700 mb-4">
              Complete Interactive Visualization of 918 Business Categories
            </h2>
            <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
              {(
                tx("Explore the complete hierarchical structure of the {0} featuring 918 categories across all {1} {2} of {3}. Navigate through main categories, subcategories, and specialized business classifications in {4}. Interactive search, filtering, and statistics for comprehensive business discovery.", country.directoryName, country.regions.length, country.regionTerm.plural.toLowerCase(), country.name, country.regions.map((r) => r.name).join(", "))
              )}
            </p>
            
            {/* Key Features for SEO */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="yp-card p-4 text-center">
                <div className="text-2xl font-bold text-[#0B6B2E]">918</div>
                <div className="text-sm text-gray-600">Total Categories</div>
              </div>
              <div className="yp-card p-4 text-center">
                <div className="text-2xl font-bold text-green-600">13</div>
                <div className="text-sm text-gray-600">Main Sectors</div>
              </div>
              <div className="yp-card p-4 text-center">
                <div className="text-2xl font-bold text-[#0B6B2E]">{country.regions.length}</div>
                <div className="text-sm text-gray-600">{`${country.adjective} ${country.regionTerm.plural}`}</div>
              </div>
              <div className="yp-card p-4 text-center">
                <div className="text-2xl font-bold text-[#0B6B2E]">3</div>
                <div className="text-sm text-gray-600">Hierarchy Levels</div>
              </div>
            </div>
          </header>
          
          {/* Main Content */}
          <article>
            <InteractiveCategoryHierarchy />
          </article>
          
          {/* SEO Content Section */}
          <section className="mt-12 yp-card p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {localize("Pakistani Business Categories - Complete Directory Guide")}
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">
                  {localize("Main Business Sectors in Pakistan")}
                </h4>
                <ul className="space-y-2 text-gray-600">
                  <li>• <strong>Accounting, Audit & Tax:</strong> Financial services and consultancy</li>
                  <li>• <strong>Construction & Engineering:</strong> Infrastructure and development</li>
                  <li>• <strong>Technology & IT Services:</strong> Software and digital solutions</li>
                  <li>• <strong>Healthcare & Medical:</strong> Medical services and facilities</li>
                  <li>• <strong>Education & Training:</strong> Educational institutions and training centers</li>
                  <li>• <strong>Retail & Trading:</strong> Commercial trading and retail businesses</li>
                </ul>
              </div>
              
            </div>
          </section>
          
          {/* Category Request Section */}
          <section className="mt-12 yp-card p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Not able to find your category? 
              </h3>
              <p className="text-lg text-gray-700">
                Fill form below to request inclusion of your desired category
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {tx("We're constantly expanding our directory to include new business categories relevant to the {0} market", country.adjective)}
              </p>
            </div>
            <CategoryRequestForm />
          </section>
        </div>
      </main>
      
      <Footer />
    </>
  );
}