import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Star, 
  ArrowRight,
  CheckCircle
} from "lucide-react";
import { Business } from "@shared/schema";
import { localize } from "@shared/country";
import { t as tx } from "@shared/i18n";

export default function NewBusinessesRegistered() {
  const { data: businesses, isLoading } = useQuery<Business[]>({
    queryKey: ["/api/businesses/new"],
    queryFn: async () => {
      const response = await fetch('/api/businesses/new?limit=10');
      if (!response.ok) throw new Error("Failed to fetch new businesses");
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2
  });

  // Always render the section - no conditional logic
  const displayBusinesses = businesses || [];
  const hasBusinesses = displayBusinesses.length > 0;
  
  return (
    <section className="yp-wrap pt-16 md:pt-24">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <div className="yp-label">Just joined</div>
          <h2 className="yp-h2 mt-2 text-[#0A0A0A]">New businesses registered</h2>
          <p className="mt-3 text-[16px] leading-[1.6] text-[#4B5565]">
            {isLoading || hasBusinesses ?
              localize("Welcome our newest members. These businesses have recently joined Pakistan Business Directory.") :
              localize("Be the first to register your business in Pakistan's fastest-growing business directory.")
            }
          </p>
        </div>
        <a href="/categories" className="text-[15px] font-semibold text-[#0B6B2E] hover:text-[#05501F]" data-testid="link-explore-categories">
          Explore all categories →
        </a>
      </div>

      {/* Show loading skeleton while loading */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5" aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="home-new-business-card yp-card animate-pulse p-5">
              <div className="mb-3 h-5 rounded bg-[#F1F2F6]"></div>
              <div className="mb-3 h-4 w-2/3 rounded bg-[#F1F2F6]"></div>
              <div className="h-3 rounded bg-[#F1F2F6]"></div>
            </div>
          ))}
        </div>
      )}

      {/* Show businesses if available */}
      {!isLoading && hasBusinesses && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {displayBusinesses.slice(0, 10).map((business) => (
            <Link
              key={business.id}
              href={`/business/${business.slug || business.id}`}
              className="home-new-business-card yp-card yp-card-link group flex flex-col gap-3 p-5 text-[#0A0A0A] hover:text-[#0A0A0A]"
              data-testid={`link-new-business-${business.slug || business.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-[12px] bg-[#E8F4EC] text-[#0B6B2E]" aria-hidden="true">
                  <Building2 className="h-5 w-5" />
                </span>
                <span className="yp-pill bg-[#FDECEC] text-[#B91C1C]">New</span>
              </div>

              <div className="flex min-w-0 items-center gap-1.5">
                <h3 className="truncate text-[15px] font-semibold group-hover:text-[#0B6B2E]">
                  {business.name}
                </h3>
                {business.isVerified && (
                  <CheckCircle className="h-4 w-4 flex-shrink-0 text-[#0B6B2E]" aria-label="Verified" />
                )}
              </div>

              {(business.shortDescription || business.description) && (
                <p className="line-clamp-2 text-[13px] leading-[1.5] text-[#4B5565]">
                  {business.shortDescription || business.description}
                </p>
              )}

              {business.address && (
                <div className="flex items-center gap-1.5 text-[13px] text-[#5B6475]">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                  <span className="truncate">{business.address}</span>
                </div>
              )}

              <div className="mt-auto flex items-center justify-between border-t border-[#EEF0F4] pt-3">
                <div className="flex items-center gap-1 text-[13px]">
                  <Star className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" aria-hidden="true" />
                  <span className="font-semibold">
                    {parseFloat(business.ratingAverage || "0").toFixed(1)}
                  </span>
                  <span className="text-[#5B6475]">
                    ({business.ratingCount || 0})
                  </span>
                </div>
                {business.phone && (
                  <button
                    type="button"
                    className="grid h-9 w-9 place-items-center rounded-[10px] border border-[#E3E6EC] text-[#0B6B2E] hover:border-[#0B6B2E]"
                    aria-label={tx("Call {0}", business.name)}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(`tel:${business.phone}`, '_self');
                    }}
                  >
                    <Phone className="h-4 w-4" />
                  </button>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Show empty state when no businesses */}
      {!isLoading && !hasBusinesses && (
        <div className="yp-card p-8 text-center">
          <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-[14px] bg-[#E8F4EC] text-[#0B6B2E]" aria-hidden="true">
            <Building2 className="h-6 w-6" />
          </span>
          <h3 className="mb-2 text-xl font-semibold">No new businesses yet</h3>
          <p className="text-[#5B6475]">
            {localize("Be among the first to showcase your business to customers across Pakistan.")}
          </p>
        </div>
      )}

      {/* Registration call to action */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-[#E7E9EE] bg-white p-5">
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#3A4354]">
          <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-[#0B6B2E]" aria-hidden="true" />Free basic listing</li>
          <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-[#0B6B2E]" aria-hidden="true" />Instant visibility</li>
          <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-[#0B6B2E]" aria-hidden="true" />Premium upgrades available</li>
        </ul>
        <a href="/pricing" className="yp-btn yp-btn-red" data-testid="link-register-business">
          Register your business
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
