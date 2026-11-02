import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Building2, ChevronRight, MapPin, Search, X } from "lucide-react";
import { SEO, SEOConfigs } from "@/components/seo";
import CoreWebVitals from "@/components/core-web-vitals";
import Header from "@/components/header";
import Footer from "@/components/footer";
import "./localities.css";
import { localLang, localDir, country, localize, regionSlug } from "@shared/country";

interface Locality {
  id: number;
  name: string;
  slug: string;
  provinceId: number;
  businessCount: number;
}

interface Province {
  id: number;
  name: string;
  slug: string;
  arabicName: string;
}

export default function Localities() {
  const [searchQuery, setSearchQuery] = useState("");
  const localitiesQuery = useQuery<Locality[]>({ queryKey: ["/api/localities/with-stats"] });
  const provincesQuery = useQuery<Province[]>({ queryKey: ["/api/provinces"] });
  const localities = localitiesQuery.data || [];
  const provinces = provincesQuery.data || [];
  const loading = localitiesQuery.isLoading || provincesQuery.isLoading;
  const error = localitiesQuery.isError || provincesQuery.isError;
  const provinceOrder = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Multan", "Faisalabad", "Peshawar"];
  const regionOrder = (name: string) => {
    const index = country.regions.findIndex(r => r.slug === regionSlug(name));
    return index === -1 ? country.regions.length : index;
  };
  const query = searchQuery.trim().toLowerCase();
  const groups = [...provinces]
    .sort((a, b) => regionOrder(a.name) - regionOrder(b.name))
    .map(province => ({
      ...province,
      localities: localities
        .filter(locality => locality.provinceId === province.id && (!query || locality.name.toLowerCase().includes(query)))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter(group => !query || group.localities.length > 0);
  const totalBusinesses = localities.reduce((sum, locality) => sum + (Number(locality.businessCount) || 0), 0);
  const resultCount = groups.reduce((sum, group) => sum + group.localities.length, 0);

  return (
    <>
      <SEO {...SEOConfigs.localities} />
      <CoreWebVitals />
      <Header />
      <main className="locality-page">
        <section className="locality-hero">
          <div className="locality-shell">
            <nav className="locality-breadcrumb" aria-label="Breadcrumb">
              <Link href="/">Home</Link><ChevronRight aria-hidden="true" /><span aria-current="page">Localities</span>
            </nav>
            <p className="locality-eyebrow"><MapPin aria-hidden="true" />Explore by neighborhood</p>
            <h1>{`Find local businesses ${country.inName}.`}</h1>
            <p className="locality-lead">From everyday essentials to specialist services, find businesses in your neighborhood. Choose a locality to explore its directory.</p>
            {!loading && !error && <div className="locality-meta">
              <span><MapPin aria-hidden="true" />{localities.length.toLocaleString()} localities</span>
              <span><Building2 aria-hidden="true" />{totalBusinesses.toLocaleString()} businesses listed</span>
              <span>{provinces.length}{` ${country.regionTerm.plural.toLowerCase()}`}</span>
            </div>}
          </div>
        </section>
        <div className="locality-shell locality-content">
          <section className="locality-search-panel" aria-labelledby="locality-search-heading">
            <div>
              <h2 id="locality-search-heading">{localize("Browse localities by province")}</h2>
              <p aria-live="polite">{query && !loading && !error ? `${resultCount} ${resultCount === 1 ? "locality matches" : "localities match"} your search` : "Choose an area, then discover the businesses around you."}</p>
            </div>
            <div className="locality-search">
              <Search aria-hidden="true" />
              <input type="search" aria-label="Search localities" placeholder="Search for a locality…" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} />
              {searchQuery && <button type="button" aria-label="Clear locality search" onClick={() => setSearchQuery("")}><X size={17} aria-hidden="true" /></button>}
            </div>
          </section>

          {loading ? (
            <div className="locality-loading" role="status" aria-label="Loading localities">
              {[0, 1, 2].map(index => <div key={index} className="locality-skeleton" />)}
            </div>
          ) : error ? (
            <section className="locality-state" role="alert">
              <MapPin aria-hidden="true" /><h2>We couldn’t load the localities</h2>
              <p>Please try again to browse the directory.</p>
              <button type="button" className="locality-button" onClick={() => { void localitiesQuery.refetch(); void provincesQuery.refetch(); }}>Try again</button>
            </section>
          ) : groups.length === 0 || localities.length === 0 ? (
            <section className="locality-state">
              <Search aria-hidden="true" /><h2>{query ? "No matching localities" : "No localities to display yet"}</h2>
              <p>{query ? `We couldn’t find a locality matching “${searchQuery}”. Try a different spelling or browse all areas.` : localize("You can still explore businesses across Pakistan in the main directory.")}</p>
              {query ? <button type="button" className="locality-button" onClick={() => setSearchQuery("")}>Clear search</button> : <Link href="/search" className="locality-button">Browse businesses</Link>}
            </section>
          ) : (
            <div className="locality-groups">
              {groups.map(group => (
                <section key={group.id} className="locality-group" aria-labelledby={`province-${group.id}`}>
                  <div className="locality-group-header">
                    <div className="locality-group-title">
                      <MapPin aria-hidden="true" />
                      <div><h2 id={`province-${group.id}`}>{group.name}</h2><p>{group.localities.length} {group.localities.length === 1 ? "locality" : "localities"}</p></div>
                    </div>
                    {group.arabicName && <span lang={localLang} dir={localDir} className="locality-arabic">{group.arabicName}</span>}
                  </div>
                  {group.localities.length ? <div className="locality-grid">
                    {group.localities.map(locality => (
                      <Link key={locality.id} href={`/localities/${locality.slug}`} className="locality-place">
                        <span><span className="locality-place-name">{locality.name}</span><span className="locality-place-count">{(Number(locality.businessCount) || 0).toLocaleString()} {Number(locality.businessCount) === 1 ? "business" : "businesses"}</span></span>
                        <ChevronRight aria-hidden="true" />
                      </Link>
                    ))}
                  </div> : <p className="p-6 text-sm text-muted-foreground">No localities available in {group.name} yet.</p>}
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
