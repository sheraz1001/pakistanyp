import { useState } from "react";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Building2, ChevronRight, MapPin, Search } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import BusinessListing from "@/components/business-listing";
import { PageSEO } from "@/components/page-seo";
import { Button } from "@/components/ui/button";
import { breadcrumbLd } from "@/lib/structured-data";
import { usePlaces, buildCityTree, shortPlaceName, plural, cityUrl } from "@/lib/places";
import { parseGuide, PlaceGuide, GuideFacts, guideFaqLd } from "@/components/place-guide";
import { country, localDir, localLang, regionUrl } from "@shared/country";
import { t as tx } from "@shared/i18n";
import { tj } from "@/i18n-jsx/tj";

interface CityRecord {
  id: number;
  name: string;
  arabicName?: string | null;
  slug: string;
  provinceId: number;
  provinceName: string;
  description?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  detailedDescription?: string | null;
}

/** City page: Province > City, with the city's localities (sidebar) and all of its businesses. */
export default function CityDetail() {
  const params = useParams();
  const slug = String(params.city || "").toLowerCase();
  const cityQuery = useQuery<CityRecord>({ queryKey: [`/api/cities/slug/${slug}`], enabled: !!slug });
  const city = cityQuery.data;
  const placesQuery = usePlaces(city?.provinceId || null);
  const { cities } = buildCityTree(placesQuery.data || []);
  const node = cities.find((c) => c.id === city?.id);
  const localities = node?.localities || [];
  const otherCities = cities
    .filter((c) => c.id !== city?.id)
    .sort((a, b) => b.totalBusinesses - a.totalBusinesses || b.localities.length - a.localities.length || a.name.localeCompare(b.name))
    .slice(0, 12);
  const businessesQuery = useQuery<{ businesses: any[]; total: number }>({
    queryKey: ["/api/businesses", { localityId: city?.id, limit: 48 }],
    enabled: !!city?.id,
  });
  const businesses = businessesQuery.data?.businesses || [];
  const total = businessesQuery.data?.total ?? businesses.length;
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const shownLocalities = q ? localities.filter((l) => shortPlaceName(l, city).toLowerCase().includes(q)) : localities;

  if (cityQuery.isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F3]">
        <Header />
        <div className="animate-pulse" role="status" aria-label="Loading city">
          <div className="h-64 border-b border-[#CFE8D8] bg-[#F2F9F4]" />
          <div className="yp-wrap-wide grid gap-6 py-8 lg:grid-cols-[320px_1fr]"><div className="h-96 rounded-[20px] bg-[#EEF0F4]" /><div className="h-96 rounded-[20px] bg-[#EEF0F4]" /></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!city) {
    return (
      <div className="min-h-screen bg-[#FAF8F3]" data-page-not-found>
        <Header />
        <div className="yp-wrap pt-16 pb-24">
          <div className="yp-card mx-auto max-w-xl p-10 text-center">
            <h1 className="mb-3 text-2xl font-bold tracking-[-0.03em] text-[#0A0A0A]">{cityQuery.isError && !/404/.test(String(cityQuery.error)) ? "We couldn't load this city" : "City not found"}</h1>
            <p className="mb-6 text-[#4B5565]">Browse all cities to find the one you're looking for.</p>
            <Link href="/cities" className="yp-btn yp-btn-primary">Browse cities</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const path = cityUrl(city);
  const guide = parseGuide(city.detailedDescription);
  const faqLd = guideFaqLd(guide);
  const provinceHref = regionUrl(city.provinceName);
  const title = city.metaTitle && !/undefined|null/.test(city.metaTitle) ? city.metaTitle : `${city.name} Business Directory – Businesses in ${city.name}, ${city.provinceName} | ${country.brand}`;
  const description = city.metaDescription || `Find businesses in ${city.name}, ${city.provinceName}${localities.length ? ` across ${localities.length} localities` : ""}. Contact details, addresses and reviews on ${country.brand}.`;

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#0A0A0A]">
      <PageSEO
        title={title}
        description={description}
        canonicalUrl={`${country.origin}${path}`}
        noindex={businessesQuery.isSuccess && total === 0 && placesQuery.isSuccess && localities.length === 0}
        schemaMarkup={[
          {
            "@context": "https://schema.org",
            "@type": "City",
            name: city.name,
            url: `${country.origin}${path}`,
            containedInPlace: { "@type": "AdministrativeArea", name: city.provinceName, containedInPlace: { "@type": "Country", name: country.name } },
          },
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: city.provinceName, path: provinceHref },
            { name: "Cities", path: "/cities" },
            { name: city.name, path },
          ]),
          ...(faqLd ? [faqLd] : []),
        ]}
      />
      <Header />

      {/* City header */}
      <section className="border-b border-[#CFE8D8] bg-[#F2F9F4]">
        <div className="yp-wrap-wide pt-8 pb-10">
          <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-2 text-sm text-[#5B6475]">
            <Link href="/" className="text-[#0B6B2E] hover:text-[#05501F]">Home</Link><ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <Link href={provinceHref} className="text-[#0B6B2E] hover:text-[#05501F]">{city.provinceName}</Link><ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span aria-current="page">{city.name}</span>
          </nav>
          <span className="yp-pill gap-1 border border-[#CFE8D8] bg-white text-[#05501F]"><MapPin className="h-3 w-3" aria-hidden="true" />{tj("City in {0}", city.provinceName)}</span>
          {city.arabicName && <p dir={localDir} lang={localLang} className="mt-5 font-arabic text-[22px] text-[#0B6B2E]">{city.arabicName}</p>}
          <h1 className="yp-h1 mt-2">{city.name}</h1>
          <p className="yp-lead mt-4 max-w-2xl">{city.description || tx("Businesses and services in {0}, {1}.", city.name, city.provinceName)}</p>
          <dl className="mt-7 grid max-w-xl grid-cols-3 gap-3">
            {[
              { value: businessesQuery.isSuccess ? total : "–", label: "Businesses" },
              { value: localities.length, label: "Localities" },
              { value: city.provinceName, label: country.regionTerm.singular, small: true },
            ].map((stat) => (
              <div key={stat.label} className="yp-card px-4 py-4">
                <dd className={stat.small ? "truncate text-base font-semibold" : "text-2xl font-bold tracking-[-0.03em]"}>{stat.value}</dd>
                <dt className="mt-1 text-[13px] text-[#5B6475]">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="yp-wrap-wide grid items-start gap-6 pt-8 pb-20 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Localities of the city */}
        <aside className="flex min-w-0 flex-col gap-4" aria-label={tx("Localities in {0}", city.name)}>
          <section className="yp-card p-5" aria-labelledby="city-localities-heading">
            <h2 id="city-localities-heading" className="text-base font-semibold">{tj("Localities in {0}", city.name)}</h2>
            <p className="mt-1 text-sm text-[#5B6475]">{localities.length ? plural(localities.length, "locality", "localities") : tx("No separate localities are listed for {0}.", city.name)}</p>
            {localities.length > 8 && (
              <div className="relative mt-3">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6475]" aria-hidden="true" />
                <label htmlFor="city-locality-search" className="sr-only">{tj("Search localities in {0}", city.name)}</label>
                <input id="city-locality-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tx("Search {0} localities", city.name)} className="yp-input ps-9 text-[15px]" />
              </div>
            )}
            {localities.length > 0 && (
              <ul className="-mx-2 mt-3 flex max-h-[560px] flex-col overflow-y-auto" aria-label={tx("Localities in {0}", city.name)}>
                {!q && (
                  <li>
                    <span className="flex min-h-[40px] items-center justify-between gap-2 rounded-[10px] bg-[#F2F9F4] px-2 text-sm font-semibold text-[#05501F]">
                      <span className="flex items-center gap-2"><Building2 className="h-4 w-4" aria-hidden="true" />{tj("All of {0}", city.name)}</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold tabular-nums">{(node?.totalBusinesses ?? total).toLocaleString()}</span>
                    </span>
                  </li>
                )}
                {shownLocalities.map((l) => (
                  <li key={l.id}>
                    <Link href={`/localities/${l.slug}`} className="flex min-h-[40px] items-center justify-between gap-2 rounded-[10px] px-2 text-sm font-medium text-[#3A4354] hover:bg-[#F1F2F6] hover:text-[#0A0A0A] focus-visible:outline focus-visible:outline-2">
                      <span className="flex min-w-0 items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-[#0B6B2E]" aria-hidden="true" /><span className="truncate">{shortPlaceName(l, city)}</span></span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${l.businessCount ? "bg-[#E8F4EC] text-[#05501F]" : "bg-[#F1F2F6] text-[#5B6475]"}`}>{l.businessCount.toLocaleString()}</span>
                    </Link>
                  </li>
                ))}
                {q && !shownLocalities.length && <li className="px-2 py-2 text-sm text-[#5B6475]">No localities match your search.</li>}
              </ul>
            )}
          </section>

          <GuideFacts guide={guide} title={tx("{0} at a glance", city.name)} />

          {otherCities.length > 0 && (
            <section className="yp-card p-5" aria-labelledby="other-cities-heading">
              <h2 id="other-cities-heading" className="text-base font-semibold">{tj("Other cities in {0}", city.provinceName)}</h2>
              <ul className="-mx-2 mt-3 flex flex-col">
                {otherCities.map((c) => (
                  <li key={c.id}>
                    <Link href={cityUrl(c)} className="flex min-h-[38px] items-center justify-between gap-2 rounded-[10px] px-2 text-sm font-medium text-[#3A4354] hover:bg-[#F1F2F6] hover:text-[#0A0A0A]">
                      <span className="truncate">{c.name}</span>
                      <span className="rounded-full bg-[#F1F2F6] px-2 py-0.5 text-xs font-semibold tabular-nums text-[#5B6475]">{c.totalBusinesses.toLocaleString()}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href={provinceHref} className="mt-3 inline-block text-sm font-semibold text-[#0B6B2E] hover:text-[#05501F]">{tj("All cities in {0} →", city.provinceName)}</Link>
            </section>
          )}
        </aside>

        {/* Businesses in the city, then the city guide */}
        <div className="flex min-w-0 flex-col gap-8">
        <section className="flex min-w-0 flex-col gap-4" aria-labelledby="city-businesses-heading">
          <div>
            <h2 id="city-businesses-heading" className="text-[22px] font-semibold tracking-[-0.02em]">{tj("Businesses in {0}", city.name)}</h2>
            {businessesQuery.isSuccess && <p className="mt-1 text-sm text-[#5B6475]">{businesses.length === total ? plural(total, "business", "businesses") : tx("Showing {0} of {1} businesses", businesses.length, total.toLocaleString())}</p>}
          </div>
          {businessesQuery.isError ? (
            <div role="alert" className="yp-card p-8 text-center">
              <h3 className="mb-2 text-lg font-semibold">Unable to load business listings</h3>
              <Button onClick={() => businessesQuery.refetch()}>Try again</Button>
            </div>
          ) : businessesQuery.isLoading || businesses.length > 0 ? (
            <BusinessListing businesses={businesses} layout="list" loading={businessesQuery.isLoading} />
          ) : (
            <div className="yp-card px-6 py-12 text-center">
              <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-[14px] bg-[#F1F2F6] text-[#334155]"><Building2 className="h-6 w-6" aria-hidden="true" /></span>
              <h3 className="mb-2 text-xl font-semibold">{tj("No businesses listed in {0} yet", city.name)}</h3>
              <p className="mb-6 text-[#4B5565]">{tj("Be the first to list your business in {0}.", city.name)}</p>
              <Link href="/add-business-enhanced" className="yp-btn yp-btn-red">Add your business</Link>
            </div>
          )}
        </section>
        <PlaceGuide guide={guide} placeName={city.name} />
        </div>
      </div>
      <Footer />
    </div>
  );
}
