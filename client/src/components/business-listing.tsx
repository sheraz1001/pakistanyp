import { useQuery } from "@tanstack/react-query";
import BusinessCard, { BusinessCardLayout, BusinessCardSkeleton } from "@/components/business-card";

type DirectoryItem = Record<string, any>;

/** Resolve IDs from real directory data, never from an assumed ID-to-name map. */
export default function BusinessListing({ businesses = [], layout = "grid", loading = false, category, province, onProfileClick }: {
  businesses?: DirectoryItem[];
  layout?: BusinessCardLayout;
  loading?: boolean;
  category?: DirectoryItem;
  province?: DirectoryItem;
  onProfileClick?: (business: DirectoryItem) => void;
}) {
  const { data: categories = [] } = useQuery<DirectoryItem[]>({ queryKey: ["/api/categories"], staleTime: 300000 });
  const { data: provinces = [] } = useQuery<DirectoryItem[]>({ queryKey: ["/api/provinces"], staleTime: 300000 });
  const { data: localities = [] } = useQuery<DirectoryItem[]>({ queryKey: ["/api/localities"], staleTime: 300000 });
  return <div className={`grid ${layout === "grid" ? "gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "gap-3.5 grid-cols-1"}`}>
    {loading ? Array.from({ length: 6 }, (_, index) => <BusinessCardSkeleton key={index} layout={layout} />) : businesses.map(business => <BusinessCard
      key={business.id ?? business.slug}
      business={business}
      layout={layout}
      category={categories.find(item => item.id === business.categoryId) || category}
      province={provinces.find(item => item.id === business.provinceId) || province}
      locality={localities.find(item => item.id === business.localityId)}
      onProfileClick={onProfileClick ? () => onProfileClick(business) : undefined}
    />)}
  </div>;
}
