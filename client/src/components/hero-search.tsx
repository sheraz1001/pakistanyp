import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin } from "lucide-react";
import SmartSearchSuggestions from "@/components/smart-search-suggestions";
import { trackEvent } from "@/lib/analytics";
import { country, localize } from "@shared/country";

interface Province {
  id: number;
  name: string;
  arabicName?: string;
}

interface Stats {
  totalBusinesses?: number;
  totalCategories?: number;
  totalCities?: number;
  totalLocalities?: number;
}

interface HeroSearchProps {
  onSearch: (data: { query: string; province: string }) => void;
}

// Common search terms shown as quick links under the search form.
const popularSearches = country.popularSearches;

function StatValue({ value }: { value?: number }) {
  if (typeof value === "number") {
    return <>{value.toLocaleString()}</>;
  }
  return <span className="inline-block h-9 w-20 rounded-lg bg-[#F1F2F6] align-middle" aria-hidden="true" />;
}

export default function HeroSearch({ onSearch }: HeroSearchProps) {
  const [query, setQuery] = useState("");
  const [province, setProvince] = useState("all");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data: provinces = [] } = useQuery<Province[]>({
    queryKey: ['/api/provinces'],
  });

  const { data: stats } = useQuery<Stats>({
    queryKey: ['/api/stats'],
  });

  const handleSearch = () => {
    setShowSuggestions(false);
    trackEvent('search', 'hero_search', query, province !== 'all' ? 1 : 0);
    onSearch({ query, province });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    trackEvent('search', 'suggestion_click', suggestion);
    onSearch({ query: suggestion, province });
  };

  const handlePopularClick = (e: React.MouseEvent, term: string) => {
    e.preventDefault();
    setQuery(term);
    setShowSuggestions(false);
    trackEvent('search', 'popular_search_click', term);
    onSearch({ query: term, province });
  };

  const localities = stats?.totalLocalities;
  const provinceCount = provinces.length || country.regions.length;

  return (
    <section className="directory-hero relative overflow-hidden border-b border-[#EEECE6] bg-white text-[#0A0A0A]">
      {/* Faint geometric pattern */}
      <svg aria-hidden="true" width="100%" height="100%" className="pointer-events-none absolute left-0 top-0 opacity-[.07]">
        <defs>
          <pattern id="yp-hero-geo" width="72" height="72" patternUnits="userSpaceOnUse">
            <rect x="22" y="22" width="28" height="28" fill="none" stroke="#0B6B2E" strokeWidth="1" />
            <rect x="22" y="22" width="28" height="28" fill="none" stroke="#0B6B2E" strokeWidth="1" transform="rotate(45 36 36)" />
            <circle cx="36" cy="36" r="4" fill="none" stroke="#0B6B2E" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#yp-hero-geo)" />
      </svg>
      {/* Red hoist strip */}
      {(
        <div aria-hidden="true" className="absolute bottom-0 left-0 top-0 w-[6px] sm:w-[10px]" style={{ background: country.flagStripe[0].color }} />
      )}

      <div className="yp-wrap relative z-20 flex flex-col items-center gap-7 pb-12 pt-16 text-center md:pb-16 md:pt-24">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#CFE8D8] bg-[#F2F9F4] py-1.5 pl-1.5 pr-3.5 text-[13px] font-medium text-[#0A0A0A]">
          <span className="rounded-full bg-[#E3A82B] px-2.5 py-[3px] text-xs font-semibold text-[#141414]">New</span>
          Verified business badges are live
        </span>

        <h1 className="m-0 max-w-[960px] text-[clamp(2.5rem,6.6vw,5rem)] font-bold leading-[1.02] tracking-[-0.045em]">
          {localize("Every business in Pakistan, ")}<span className="text-[#0B6B2E]">one search away.</span>
        </h1>

        <p className="m-0 max-w-[640px] text-[17px] leading-[1.55] text-[#4B5565] md:text-[19px]">
          {localize("Find trusted companies across all provinces and territories. Compare details, read real reviews, and contact businesses directly.")}
        </p>

        {/* Search form */}
        <form
          role="search"
          onSubmit={handleSubmit}
          className="relative flex w-full max-w-[900px] flex-wrap gap-2 rounded-[22px] border border-[#DDE1E8] bg-white p-2 text-left shadow-[0_30px_70px_-34px_rgba(0,115,47,.45)]"
        >
          <div className="relative flex min-h-[58px] flex-[2_1_280px] items-center gap-2.5 rounded-[14px] bg-[#F5F5F4] px-3.5">
            <Search className="h-5 w-5 flex-shrink-0 text-[#5B6475]" aria-hidden="true" />
            <label htmlFor="search-input" className="sr-only">What are you looking for?</label>
            <input
              id="search-input"
              type="text"
              autoComplete="off"
              placeholder="Dentist, car repair, interior designer…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              className="w-full border-0 bg-transparent text-base text-[#0A0A0A] outline-none placeholder:text-[#8A92A0]"
            />

            {showSuggestions && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2">
                <SmartSearchSuggestions
                  query={query}
                  onSuggestionClick={handleSuggestionClick}
                />
              </div>
            )}
          </div>

          <div className="flex min-h-[58px] flex-[1_1_200px] items-center gap-2.5 rounded-[14px] bg-[#F5F5F4] px-3.5">
            <MapPin className="h-5 w-5 flex-shrink-0 text-[#5B6475]" aria-hidden="true" />
            <Select value={province} onValueChange={setProvince}>
              <SelectTrigger
                aria-label={localize("Choose Province")}
                className="h-[58px] min-h-0 w-full rounded-none border-0 bg-transparent px-0 text-base text-[#0A0A0A] shadow-none focus:ring-0 focus:ring-offset-0"
              >
                <SelectValue placeholder={localize("Select province")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{localize("All provinces")}</SelectItem>
                {provinces.map((provinceItem: Province) => (
                  <SelectItem key={provinceItem.id} value={provinceItem.name.toLowerCase()}>
                    {provinceItem.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <button
            type="submit"
            className="directory-search-button yp-btn yp-btn-primary min-h-[58px] flex-[1_1_auto] rounded-[14px] px-[30px] text-base sm:flex-[0_1_auto]"
          >
            Search
          </button>
        </form>

        {/* Popular searches */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="mr-1 text-sm text-[#5B6475]">Popular:</span>
          {popularSearches.map((term) => (
            <a
              key={term}
              href={`/search-results?q=${encodeURIComponent(term)}`}
              onClick={(e) => handlePopularClick(e, term)}
              className="yp-chip"
            >
              {term}
            </a>
          ))}
        </div>
      </div>

      {/* Stats strip */}
      <div className="yp-wrap relative z-10 pb-12 md:pb-16">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border border-[#E7E9EE] bg-[#E7E9EE] sm:grid-cols-3 lg:grid-cols-5">
          {[
            { href: "/businesses", value: <StatValue value={stats?.totalBusinesses} />, label: "Listed businesses" },
            { href: "/categories", value: <StatValue value={stats?.totalCategories} />, label: "Categories" },
            { href: country.regionsPath, value: (stats as any)?.totalProvinces ?? provinceCount, label: country.regionTerm.plural },
            { href: "/cities", value: <StatValue value={(stats as any)?.totalCities} />, label: "Cities" },
            { href: "/localities", value: <StatValue value={localities} />, label: "Localities" },
          ].map((tile) => (
            <a key={tile.label} href={tile.href} className="group bg-white p-5 transition-colors hover:bg-[#F2F9F4] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 md:p-6">
              <div className="text-[28px] font-bold tracking-[-0.04em] md:text-4xl">{tile.value}</div>
              <div className="mt-1 flex items-center gap-1 text-sm text-[#5B6475] group-hover:text-[#0B6B2E]">{tile.label}<span aria-hidden="true">→</span></div>
            </a>
          ))}
        </div>
      </div>

      {/* Red / white / black strip */}
      {(
        <div aria-hidden="true" className="relative flex h-[6px]">
          {country.flagStripe.map((s, i) => <span key={i} style={{ flex: s.weight, background: s.color }} />)}
        </div>
      )}
    </section>
  );
}
