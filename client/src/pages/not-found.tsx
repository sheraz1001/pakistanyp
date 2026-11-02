import { Link } from "wouter";
import { ArrowLeft, Search } from "lucide-react";
import SEO from "@/components/seo";
import { PakistanypLogo, FlagStripe } from "@/components/brand/pakistanyp-logo";
import { country } from "@shared/country";

export default function NotFound() {
  return (
    <div data-page-not-found="true" className="min-h-screen w-full flex flex-col bg-[#FAF8F3] text-[#0A0A0A]">
      <SEO 
        title="Page Not Found - PakistanYP Business Directory"
        description="The page you're looking for doesn't exist. Browse our Pakistani business directory to find companies, services, and listings across all provinces."
        keywords="404 error, page not found, Pakistan business directory, PakistanYP"
        canonical="https://pakistanyp.com/404"
        schemaType="WebPage"
      />
      {(
        <FlagStripe />
      )}
      <div className="yp-wrap pt-6">
        <PakistanypLogo href="/" />
      </div>
      <main className="flex-1 flex items-center justify-center py-16">
        <div className="yp-wrap max-w-[640px] text-center flex flex-col items-center gap-5">
          <span className="yp-label !text-[#0B6B2E]">Error 404</span>
          <h1 className="yp-h1">Page not found</h1>
          <p className="yp-lead">
            The page you're looking for doesn't exist or may have moved. Try searching the directory or head back home.
          </p>
          <div className="flex flex-wrap justify-center gap-2.5 pt-2">
            <Link href="/" className="yp-btn yp-btn-primary yp-btn-lg">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to home
            </Link>
            <Link href="/search" className="yp-btn yp-btn-ghost yp-btn-lg">
              <Search className="h-4 w-4" aria-hidden="true" />
              Search businesses
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
