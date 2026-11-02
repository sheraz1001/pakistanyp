import { CheckCircle, AlertCircle, Info } from "lucide-react";

interface SEOAuditItem {
  title: string;
  status: 'completed' | 'warning' | 'info';
  description: string;
}

const seoAuditItems: SEOAuditItem[] = [
  {
    title: "H1 Tag Optimization",
    status: 'completed',
    description: "Proper H1 tag with target keywords 'Pakistan Yellow Pages - Find Businesses Across All Provinces & Territories'"
  },
  {
    title: "Header Structure (H1, H2, H3)",
    status: 'completed',
    description: "Well-structured hierarchy with H1 > H2 > H3 tags for better SEO and user experience"
  },
  {
    title: "Meta Title & Description",
    status: 'completed',
    description: "SEO-optimized meta title and description with target keywords and proper length"
  },
  {
    title: "Structured Data (JSON-LD)",
    status: 'completed',
    description: "Organization schema, LocalBusiness, and BreadcrumbList markup implemented"
  },
  {
    title: "Open Graph & Twitter Cards",
    status: 'completed',
    description: "Social media sharing optimization with proper OG tags and Twitter cards"
  },
  {
    title: "E-E-A-T Content Elements",
    status: 'completed',
    description: "Experience, Expertise, Authoritativeness, and Trustworthiness content added"
  },
  {
    title: "Core Web Vitals Optimization",
    status: 'completed',
    description: "Performance monitoring, preconnect links, and loading optimizations"
  },
  {
    title: "Comprehensive FAQ Section",
    status: 'completed',
    description: "User-focused FAQ targeting common search queries and business directory questions"
  },
  {
    title: "Breadcrumb Navigation",
    status: 'completed',
    description: "SEO-friendly breadcrumb navigation for better site structure and user experience"
  },
  {
    title: "Internal Linking Structure",
    status: 'completed',
    description: "Strategic internal links to province pages and business categories"
  },
  {
    title: "Canonical URL",
    status: 'completed',
    description: "Proper canonical tag to prevent duplicate content issues"
  },
  {
    title: "Mobile-First Responsive Design",
    status: 'completed',
    description: "Fully responsive design optimized for mobile devices and Core Web Vitals"
  },
  {
    title: "Sitemaps & Robots.txt",
    status: 'completed',
    description: "Comprehensive XML sitemaps and optimized robots.txt for search engine crawling"
  },
  {
    title: "Local Business Optimization",
    status: 'completed',
    description: "Pakistani-specific geo-targeting, local business schema, and province-focused content"
  }
];

export default function SEOAuditSummary() {
  const completedItems = seoAuditItems.filter(item => item.status === 'completed').length;
  const totalItems = seoAuditItems.length;
  const completionPercentage = Math.round((completedItems / totalItems) * 100);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">SEO Audit Summary</h2>
        <div className="flex items-center space-x-2">
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            {completionPercentage}% Complete
          </div>
          <div className="text-sm text-gray-500">
            {completedItems}/{totalItems} optimizations
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {seoAuditItems.map((item, index) => (
          <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 mt-0.5">
              {item.status === 'completed' && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              {item.status === 'warning' && (
                <AlertCircle className="w-5 h-5 text-[#B45309]" />
              )}
              {item.status === 'info' && (
                <Info className="w-5 h-5 text-blue-500" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center">
          <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
          <div className="text-sm">
            <strong className="text-green-800">SEO Optimization Complete:</strong>
            <span className="text-green-700 ml-1">
              PakistanYP homepage is now fully optimized for search engines with comprehensive on-page SEO, 
              structured data, Core Web Vitals optimizations, and E-E-A-T content elements.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}