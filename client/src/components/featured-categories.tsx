import { useQuery } from "@tanstack/react-query";
import { getCategoryIcon } from "@/lib/category-icons-clean";
import { trackEvent } from "@/lib/analytics";
import { tj } from "@/i18n-jsx/tj";

interface FeaturedCategoriesProps {
  onCategoryClick?: (categorySlug: string) => void;
}

// Icon tile tints from the brand system (background / stroke).
const tileTints = [
  { bg: "#E8F4EC", fg: "#0B6B2E" },
  { bg: "#FFF4E0", fg: "#B45309" },
  { bg: "#E6F6F1", fg: "#047857" },
  { bg: "#FDECEC", fg: "#B91C1C" },
  { bg: "#F1F2F6", fg: "#334155" },
];

function SectionHeading({ count }: { count?: number }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="yp-label">Browse</div>
        <h2 className="yp-h2 mt-2 text-[#0A0A0A]">Popular categories</h2>
      </div>
      {count ? (
        <a
          href="/categories"
          className="text-[15px] font-semibold text-[#0B6B2E] hover:text-[#05501F]"
          onClick={() => trackEvent('category_click', 'view_all', 'all_categories')}
          data-testid="link-view-all-categories"
        >{tj("All {0} categories →", count.toLocaleString())}</a>
      ) : null}
    </div>
  );
}

export default function FeaturedCategories({ onCategoryClick }: FeaturedCategoriesProps) {
  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ['categories-with-stats'],
    queryFn: async () => {
      const response = await fetch('/api/categories/with-stats');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 0, // Always fresh data
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  if (isLoading) {
    return (
      <section className="yp-wrap pt-16 md:pt-24">
        <SectionHeading />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="yp-card home-category-card h-[150px] animate-pulse p-6" aria-hidden="true">
              <div className="h-12 w-12 rounded-[14px] bg-[#F1F2F6]" />
              <div className="mt-5 h-4 w-2/3 rounded bg-[#F1F2F6]" />
              <div className="mt-2 h-3 w-1/2 rounded bg-[#F1F2F6]" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="yp-wrap pt-16 md:pt-24">
        <SectionHeading />
        <div className="yp-card p-8 text-center text-[#5B6475]">Unable to load categories. Please try again later.</div>
      </section>
    );
  }

  if (!isLoading && (!categories || categories.length === 0)) {
    return (
      <section className="yp-wrap pt-16 md:pt-24">
        <SectionHeading />
        <div className="yp-card p-8 text-center text-[#5B6475]">No categories available at the moment.</div>
      </section>
    );
  }

  // Filter to level 1 categories only and show the most populated
  const mainCategories = categories.filter((cat: any) => cat.level === 1);

  const topCategories = mainCategories
    .sort((a: any, b: any) => (b.businessCount || 0) - (a.businessCount || 0))
    .slice(0, 8);

  return (
    <section className="yp-wrap pt-16 md:pt-24">
      <SectionHeading count={categories.length} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {topCategories.map((category: any, index: number) => {
          const IconComponent = getCategoryIcon(category.name);
          const tint = tileTints[index % tileTints.length];
          const companies = category.businessCount || 0;
          const subs = category.subcategoryCount || 0;

          return (
            <a
              key={category.id}
              href={`/categories/${category.slug}`}
              className="yp-card yp-card-link home-category-card flex flex-col gap-[18px] p-6 text-[#0A0A0A] hover:text-[#0A0A0A]"
              onClick={() => {
                trackEvent('category_click', 'featured_category', category.name);
                if (onCategoryClick) onCategoryClick(category.slug);
              }}
              data-testid={`link-featured-category-${category.slug}`}
            >
              <span
                className="grid h-12 w-12 place-items-center rounded-[14px]"
                style={{ background: tint.bg, color: tint.fg }}
                aria-hidden="true"
              >
                <IconComponent className="h-6 w-6" strokeWidth={1.8} />
              </span>
              <span>
                <span className="block text-[17px] font-semibold">{category.name}</span>
                <span className="mt-1 block text-sm text-[#5B6475]">
                  {companies === 0 ? 'No companies yet' : `${companies.toLocaleString()} ${companies === 1 ? 'company' : 'companies'}`}
                  {subs > 0 && ` · ${subs} subcategories`}
                </span>
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
