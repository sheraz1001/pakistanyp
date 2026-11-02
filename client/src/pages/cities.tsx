import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Building2, ChevronRight, MapPin, Search, X } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { PageSEO } from "@/components/page-seo";
import { breadcrumbLd } from "@/lib/structured-data";
import { usePlaces, buildCityTree, plural, cityUrl } from "@/lib/places";
import { country, localDir, localLang, regionSlug, regionUrl } from "@shared/country";
import "./localities.css";

interface Province { id: number; name: string; arabicName?: string | null }

/** All cities, grouped by province, with locality and business counts. */
export default function Cities() {
  const [search, setSearch] = useState("");
  const placesQuery = usePlaces();
  const provincesQuery = useQuery<Province[]>({ queryKey: ["/api/provinces"] });
  const places = placesQuery.data || [];
  const q = search.trim().toLowerCase();
  const order = (name: string) => {
    const i = country.regions.findIndex((r) => r.slug === regionSlug(name));
    return i < 0 ? country.regions.length : i;
  };
  const groups = [...(provincesQuery.data || [])]
    .sort((a, b) => order(a.name) - order(b.name))
    .map((p) => {
      const { cities } = buildCityTree(places.filter((pl) => pl.provinceId === p.id));
      const shown = cities
        .filter((c) => !q || c.name.toLowerCase().includes(q))
        .sort((a, b) => b.totalBusinesses - a.totalBusinesses || b.localities.length - a.localities.length || a.name.localeCompare(b.name));
      return { ...p, cities: shown, cityCount: cities.length };
    })
    .filter((g) => g.cities.length > 0);
  const cityTotal = places.filter((p) => p.isMainArea && !p.parentId).length;
  const businessTotal = places.reduce((n, p) => n + (p.businessCount || 0), 0);
  const resultCount = groups.reduce((n, g) => n + g.cities.length, 0);
  const loading = placesQuery.isLoading || provincesQuery.isLoading;

  return (
    <>
      <PageSEO
        title={`Cities in Pakistan – Business Directory by City | ${country.brand}`}
        description={`Browse businesses in ${cityTotal ? cityTotal.toLocaleString() + " " : ""}cities and towns across Pakistan: Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Peshawar, Multan, Quetta and more.`}
        canonicalUrl={`${country.origin}/cities`}
        schemaMarkup={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Cities", path: "/cities" }])}
      />
      <Header />
      <main className="locality-page">
        <section className="locality-hero">
          <div className="locality-shell">
            <nav className="locality-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><ChevronRight aria-hidden="true" /><span aria-current="page">Cities</span></nav>
            <p className="locality-eyebrow"><MapPin aria-hidden="true" />Explore by city</p>
            <h1>Businesses in every city of Pakistan.</h1>
            <p className="locality-lead">Pick a city to see its businesses and localities.</p>
            {!loading && <div className="locality-meta">
              <span><MapPin aria-hidden="true" />{plural(cityTotal, "city", "cities")}</span>
              <span><Building2 aria-hidden="true" />{plural(businessTotal, "business", "businesses")} listed</span>
              <span>{plural(provincesQuery.data?.length || 0, "province & territory", "provinces & territories")}</span>
            </div>}
          </div>
        </section>
        <div className="locality-shell locality-content">
          <section className="locality-search-panel" aria-labelledby="city-search-heading">
            <div>
              <h2 id="city-search-heading">Cities by province</h2>
              <p aria-live="polite">{q && !loading ? `${plural(resultCount, "city matches", "cities match")} your search` : "Busiest cities first in each province."}</p>
            </div>
            <div className="locality-search">
              <Search aria-hidden="true" />
              <input type="search" aria-label="Search cities" placeholder="Search for a city…" value={search} onChange={(e) => setSearch(e.target.value)} />
              {search && <button type="button" aria-label="Clear city search" onClick={() => setSearch("")}><X size={17} aria-hidden="true" /></button>}
            </div>
          </section>

          {loading ? (
            <div className="locality-loading" role="status" aria-label="Loading cities">{[0, 1, 2].map((i) => <div key={i} className="locality-skeleton" />)}</div>
          ) : placesQuery.isError || provincesQuery.isError ? (
            <section className="locality-state" role="alert"><MapPin aria-hidden="true" /><h2>We couldn't load the cities</h2><button type="button" className="locality-button" onClick={() => { void placesQuery.refetch(); void provincesQuery.refetch(); }}>Try again</button></section>
          ) : groups.length === 0 ? (
            <section className="locality-state"><Search aria-hidden="true" /><h2>No matching cities</h2><p>{`We couldn't find a city matching "${search}".`}</p><button type="button" className="locality-button" onClick={() => setSearch("")}>Clear search</button></section>
          ) : (
            <div className="locality-groups">
              {groups.map((g) => (
                <section key={g.id} className="locality-group" aria-labelledby={`cities-${g.id}`}>
                  <div className="locality-group-header">
                    <div className="locality-group-title">
                      <MapPin aria-hidden="true" />
                      <div><h2 id={`cities-${g.id}`}><Link href={regionUrl(g.name)}>{g.name}</Link></h2><p>{plural(g.cityCount, "city", "cities")}</p></div>
                    </div>
                    {g.arabicName && <span lang={localLang} dir={localDir} className="locality-arabic">{g.arabicName}</span>}
                  </div>
                  <div className="locality-grid">
                    {g.cities.map((c) => (
                      <Link key={c.id} href={cityUrl(c)} className="locality-place">
                        <span>
                          <span className="locality-place-name">{c.name}</span>
                          <span className="locality-place-count">{[c.localities.length ? plural(c.localities.length, "locality", "localities") : "", plural(c.totalBusinesses, "business", "businesses")].filter(Boolean).join(" · ")}</span>
                        </span>
                        <ChevronRight aria-hidden="true" />
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
