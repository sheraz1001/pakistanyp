import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AlertCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { Business } from "@shared/schema";
import { localize } from "@shared/country";

type DirectoryItem = Record<string, any>;

const monoTints = [
  { bg: "#E8F4EC", fg: "#0B6B2E" },
  { bg: "#FFF4E0", fg: "#B45309" },
  { bg: "#F1F2F6", fg: "#334155" },
  { bg: "#E6F6F1", fg: "#047857" },
];

function monogram(name: string) {
  const words = (name || "").replace(/[^\p{L}\p{N}\s]/gu, " ").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  return (words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[1][0]).toUpperCase();
}

function VerifiedSeal() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" role="img" aria-label="Verified" className="flex-shrink-0">
      <path d="M12 2l2.4 1.8 3-.2.9 2.9 2.5 1.7-1 2.8 1 2.8-2.5 1.7-.9 2.9-3-.2L12 22l-2.4-1.8-3 .2-.9-2.9-2.5-1.7 1-2.8-1-2.8 2.5-1.7.9-2.9 3 .2z" fill="#0B6B2E" />
      <path d="m8.5 12 2.3 2.3 4.7-4.7" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Heading() {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="yp-label">Top rated</div>
        <h2 className="yp-h2 mt-2 text-[#0A0A0A]">Featured businesses</h2>
      </div>
      <Link href="/categories?featured=true" className="text-[15px] font-semibold text-[#0B6B2E] hover:text-[#05501F]">View all →</Link>
    </div>
  );
}

export default function FeaturedBusinesses() {
  const { data: businesses = [], isLoading, error, refetch } = useQuery<Business[]>({
    queryKey: ["/api/businesses/featured"],
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
  // Directory lookups (same shared queries the business listing uses) to resolve IDs into names.
  const { data: categories = [] } = useQuery<DirectoryItem[]>({ queryKey: ["/api/categories"], staleTime: 300000 });
  const { data: provinces = [] } = useQuery<DirectoryItem[]>({ queryKey: ["/api/provinces"], staleTime: 300000 });
  const { data: localities = [] } = useQuery<DirectoryItem[]>({ queryKey: ["/api/localities"], staleTime: 300000 });

  return <section className="yp-wrap pt-16 md:pt-24">
    <Heading />
    {isLoading ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => <div key={i} className="yp-card overflow-hidden animate-pulse">
        <div className="h-[150px] bg-[#F1F2F6]" />
        <div className="p-5"><div className="h-4 w-2/3 rounded bg-[#F1F2F6]" /><div className="mt-3 h-3 w-1/2 rounded bg-[#F1F2F6]" /></div>
      </div>)}
    </div> : error ? <div role="alert" className="yp-card py-14 text-center">
      <AlertCircle className="mx-auto mb-4 h-10 w-10 text-[#5B6475]" aria-hidden="true" />
      <h3 className="mb-2 text-xl font-semibold">Unable to load featured businesses</h3>
      <p className="mb-5 text-[#5B6475]">Please try again in a moment.</p>
      <Button onClick={() => refetch()}>Try again</Button>
    </div> : businesses.length ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {businesses.map((business: DirectoryItem, index) => {
        const tint = monoTints[index % monoTints.length];
        const category = categories.find(item => item.id === business.categoryId);
        const province = provinces.find(item => item.id === business.provinceId);
        const locality = localities.find(item => item.id === business.localityId);
        const place = [locality?.name, province?.name].filter(Boolean).join(", ");
        const meta = [category?.name, place].filter(Boolean).join(" · ");
        const rating = parseFloat(business.ratingAverage || business.rating || "0");
        const reviews = business.ratingCount || 0;
        const logo = business.logoUrl || business.logo;
        return <Link
          key={business.id ?? business.slug}
          href={`/business/${business.slug || business.id}`}
          className="yp-card yp-card-link flex flex-col overflow-hidden text-[#0A0A0A] hover:text-[#0A0A0A]"
          onClick={() => trackEvent("business_click", "featured_business", business.name)}
          data-testid={`link-featured-business-${business.slug || business.id}`}
        >
          <div className="grid h-[150px] place-items-center" style={{ background: tint.bg, color: tint.fg }}>
            {logo
              ? <img src={logo} alt={`${business.name} logo`} loading="lazy" className="max-h-[96px] max-w-[60%] rounded-xl object-contain" />
              : <span className="text-[40px] font-bold tracking-[-0.04em]" aria-hidden="true">{monogram(business.name)}</span>}
          </div>
          <div className="flex flex-col gap-2.5 p-5">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[17px] font-semibold">{business.name}</span>
              {business.isVerified && <VerifiedSeal />}
            </div>
            {meta && <div className="text-sm text-[#5B6475]">{meta}</div>}
            <div className="flex items-center gap-1.5 text-sm">
              {reviews > 0 ? <>
                <Star className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B]" aria-hidden="true" />
                <span className="font-semibold">{rating.toFixed(1)}</span>
                <span className="text-[#5B6475]">({reviews} {reviews === 1 ? "review" : "reviews"})</span>
              </> : <span className="text-[#5B6475]">No reviews yet</span>}
            </div>
          </div>
        </Link>;
      })}
    </div> : <div className="yp-card py-14 text-center">
      <Star className="mx-auto mb-4 h-10 w-10 text-[#5B6475]" aria-hidden="true" />
      <h3 className="mb-2 text-xl font-semibold">No featured businesses yet</h3>
      <p className="mb-5 text-[#5B6475]">{localize("Showcase your business to residents across Pakistan.")}</p>
      <Button asChild><Link href="/pricing">Add your business</Link></Button>
    </div>}
  </section>;
}
