import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, ExternalLink } from "lucide-react";
import { country, localize } from "@shared/country";
import { t as tx } from "@shared/i18n";

interface SEOContent {
  h1Heading: string;
  h2Headings: string[];
  h3Headings: string[];
  introContent: string;
  mainContent: string;
  conclusionContent: string;
  internalLinks: Array<{
    text: string;
    url: string;
    description: string;
  }>;
  keywords: string[];
}

interface SEOContentDisplayProps {
  type: 'category' | 'province' | 'locality';
  id: number;
  fallbackContent?: {
    heading: string;
    description: string;
  };
}

export function SEOContentDisplay({ type, id, fallbackContent }: SEOContentDisplayProps) {
  const [seoContent, setSeoContent] = useState<SEOContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateSEOContent = async () => {
      try {
        let endpoint = '';
        switch (type) {
          case 'category':
            endpoint = `/api/seo/category`;
            break;
          case 'province':
            endpoint = `/api/seo/province`;
            break;
          case 'locality':
            endpoint = `/api/seo/locality`;
            break;
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            [`${type}Id`]: id
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setSeoContent(data.seoContent);
        } else {
          // Use fallback content
          if (fallbackContent) {
            setSeoContent({
              h1Heading: fallbackContent.heading,
              h2Headings: ["Browse Options", "Find What You Need"],
              h3Headings: ["Quality Services", "Verified Listings"],
              introContent: fallbackContent.description,
              mainContent: localize("Discover comprehensive business listings and services across Pakistan with our directory."),
              conclusionContent: "Find exactly what you're looking for with our comprehensive listings.",
              internalLinks: [],
              keywords: []
            });
          }
        }
      } catch (error) {
        console.error("Failed to generate SEO content:", error);
        if (fallbackContent) {
          setSeoContent({
            h1Heading: fallbackContent.heading,
            h2Headings: ["Browse Options", "Find What You Need"],
            h3Headings: ["Quality Services", "Verified Listings"],
            introContent: fallbackContent.description,
            mainContent: localize("Discover comprehensive business listings and services across Pakistan with our directory."),
            conclusionContent: "Find exactly what you're looking for with our comprehensive listings.",
            internalLinks: [],
            keywords: []
          });
        }
      } finally {
        setLoading(false);
      }
    };

    generateSEOContent();
  }, [type, id, fallbackContent]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
        </div>
      </div>
    );
  }

  if (!seoContent) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* H1 Heading */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {seoContent.h1Heading}
        </h1>
        <div className="w-20 h-1 bg-[#0B6B2E] mx-auto rounded-full"></div>
      </div>

      {/* Intro Content */}
      {seoContent.introContent && (
        <div className="text-center">
          <p className="text-lg text-gray-700 leading-relaxed max-w-3xl mx-auto">
            {seoContent.introContent}
          </p>
        </div>
      )}

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* H2 Sections */}
          {seoContent.h2Headings.map((h2, index) => (
            <div key={index} className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 border-s-4 border-blue-600 ps-4">
                {h2}
              </h2>
              
              {/* H3 subsections for this H2 */}
              {index === 0 && seoContent.h3Headings.slice(0, Math.ceil(seoContent.h3Headings.length / 2)).map((h3, h3Index) => (
                <div key={h3Index} className="ms-4">
                  <h3 className="text-xl font-medium text-gray-800 mb-2">
                    {h3}
                  </h3>
                  <p className="text-gray-600">
                    {index === 0 && h3Index === 0 ? seoContent.mainContent : 
                     "Explore comprehensive options and services tailored to your needs."}
                  </p>
                </div>
              ))}
              
              {index === 1 && seoContent.h3Headings.slice(Math.ceil(seoContent.h3Headings.length / 2)).map((h3, h3Index) => (
                <div key={h3Index} className="ms-4">
                  <h3 className="text-xl font-medium text-gray-800 mb-2">
                    {h3}
                  </h3>
                  <p className="text-gray-600">
                    Find quality services and verified listings in this category.
                  </p>
                </div>
              ))}
            </div>
          ))}

          {/* Conclusion Content */}
          {seoContent.conclusionContent && (
            <div className="bg-[#F2F9F4] p-6 rounded-[20px] border border-[#CFE8D8]">
              <p className="text-gray-700 font-medium">
                {seoContent.conclusionContent}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar with Internal Links */}
        <div className="space-y-6">
          {seoContent.internalLinks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Explore More</CardTitle>
                <CardDescription>
                  Discover related categories and locations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {seoContent.internalLinks.slice(0, 8).map((link, index) => (
                  <Link key={index} href={link.url}>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between text-start h-auto p-3 hover:bg-blue-50"
                    >
                      <div>
                        <div className="font-medium text-sm">{link.text}</div>
                        <div className="text-xs text-gray-500 mt-1">{link.description}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Button>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Related Keywords */}
          {seoContent.keywords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Related Topics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {seoContent.keywords.slice(0, 12).map((keyword, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-blue-100 cursor-pointer transition-colors"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* CTA Section */}
          <Card className="bg-[#F2F9F4] border-[#CFE8D8] text-[#0A0A0A]">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">List Your Business</h3>
              <p className="text-[#3A4354] text-sm mb-4">
                {tx("Join thousands of businesses on {0}'s leading directory", country.name)}
              </p>
              <Link href="/add-business">
                <Button className="w-full bg-[#0B6B2E] text-white hover:bg-[#05501F]">
                  Get Started
                  <ExternalLink className="w-4 h-4 ms-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default SEOContentDisplay;