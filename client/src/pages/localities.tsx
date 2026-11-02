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
import { usePlaces, buildCityTree, shortPlaceName, plural, cityUrl } from "@/lib/places";

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
  const localitiesQuery = usePlaces();
  const provincesQuery = useQuery<Province[]>({ queryKey: ["/api/provinces"] });
  const localities = localitiesQuery.data || [];
  const provinces = provincesQuery.data || [];
  const loading = localitiesQuery.isLoading || provincesQuery.isLoading;
  const error = localitiesQuery.isError || provincesQuery.isError;
  const regionOrder = (name: string) => {
    const index = country.regions.findIndex(r => r.slug === regionSlug(name));
    return index === -1 ? country.regions.length : index;
  };
  const query = searchQuery.trim().toLowerCase();
  // Province > City > Locality. A search keeps a city when its name or any of its localities match.
  const matches = (name: string) => !query || name.toLowerCase().includes(query);
  const groups = [...provinces]
    .sort((a, b) => regionOrder(a.name) - regionOrder(b.name))
    .map(province => {
      const { cities } = buildCityTree(localities.filter(place => place.provinceId === province.id));
      const shown = cities
        .map(city => ({ ...city, localities: matches(city.name) ? city.localities : city.localities.filter(l => matches(shortPlaceName(l, city))) }))
        .filter(city => matches(city.name) || city.localities.length > 0);
      return {
        ...province,
        singleCity: cities.length === 1 ? cities[0] : null,
        citiesWithAreas: shown.filter(city => city.localities.length > 0),
        towns: shown.filter(city => city.localities.length === 0),
        cityCount: cities.length,
        localityCount: cities.reduce((n, city) => n + city.localities.length, 0),
        resultCount: shown.reduce((n, city) => n + 1 + city.localities.length, 0),
      };
    })
    .filter(group => !query || group.resultCount > 0);
  const totalBusinesses = localities.reduce((sum, locality) => sum + (Number(locality.businessCount) || 0), 0);
  const resultCount = groups.reduce((sum, group) => sum + group.resultCount, 0);
  const cityTotal = localities.filter(place => place.isMainArea && !place.parentId).length;

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
            <p className="locality-lead">From everyday essentials to specialist services, find businesses in your neighborhood. Choose a province, a city and then a locality.</p>
            {!loading && !error && <div className="locality-meta">
              <span><MapPin aria-hidden="true" />{plural(cityTotal, "city", "cities")} · {plural(localities.length - cityTotal, "locality", "localities")}</span>
              <span><Building2 aria-hidden="true" />{plural(totalBusinesses, "business", "businesses")} listed</span>
              <span>{provinces.length}{` ${country.regionTerm.plural.toLowerCase()}`}</span>
            </div>}
          </div>
        </section>
        <div className="locality-shell locality-content">
          <section className="locality-search-panel" aria-labelledby="locality-search-heading">
            <div>
              <h2 id="locality-search-heading">Browse by province, city and locality</h2>
              <p aria-live="polite">{query && !loading && !error ? `${plural(resultCount, "place matches", "places match")} your search` : "Choose a province, then a city and its locality, to find the businesses around you."}</p>
            </div>
            <div className="locality-search">
              <Search aria-hidden="true" />
              <input type="search" aria-label="Search cities and localities" placeholder="Search a city or locality…" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} />
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
                      <div><h2 id={`province-${group.id}`}><Link href={`/${regionSlug(group.name)}`}>{group.name}</Link></h2><p>{group.singleCity ? plural(group.localityCount, "locality", "localities") : `${plural(group.cityCount, "city", "cities")} · ${plural(group.localityCount, "locality", "localities")}`}</p></div>
                    </div>
                    {group.arabicName && <span lang={localLang} dir={localDir} className="locality-arabic">{group.arabicName}</span>}
                  </div>
                  {group.citiesWithAreas.map(city => (
                    <div key={city.id} className="locality-city">
                      {!group.singleCity && <div className="locality-city-head"><Link href={cityUrl(city)}>{city.name}</Link><span>{plural(city.localities.length, "locality", "localities")} · {plural(city.totalBusinesses, "business", "businesses")}</span></div>}
                      <ul className="locality-chips">
                        {city.localities.map(locality => (
                          <li key={locality.id}><Link href={`/localities/${locality.slug}`}>{shortPlaceName(locality, city)}</Link></li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {group.towns.length > 0 && (
                    <div className="locality-towns">
                      <h3>{group.citiesWithAreas.length ? "Other cities and towns" : "Cities and towns"}</h3>
                      <ul className="locality-chips">
                        {group.towns.map(town => (
                          <li key={town.id}><Link href={cityUrl(town)}>{town.name}</Link></li>
                        ))}
                      </ul>
                    </div>
                  )}
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
