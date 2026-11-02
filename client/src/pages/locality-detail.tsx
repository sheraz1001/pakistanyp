import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight, Building2, ChevronRight, MapPin, Navigation } from "lucide-react";
import { PageSEO } from "@/components/page-seo";
import BusinessListing from "@/components/business-listing";
import { cleanBusinessDescription } from "@/components/business-card";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { breadcrumbLd, provinceSlug, geoFrom } from "@/lib/structured-data";
import "./localities.css";
import { country, localize, regionUrl } from "@shared/country";
import { usePlaces, buildCityTree, shortPlaceName, plural, cityUrl } from "@/lib/places";
import { Redirect } from "wouter";
import { useState } from "react";
import { t as tx } from "@shared/i18n";
import { tj } from "@/i18n-jsx/tj";

interface Locality {
  id: number;
  name: string;
  slug: string;
  provinceId: number;
  parentId?: number | null;
  isMainArea?: boolean;
  description: string;
  businessCount: number;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  schemaMarkup: any;
  coordinates: { lat: number; lng: number };
  population: number;
  viewCount: number;
}

interface Business extends Record<string, any> {
  id: number;
  name: string;
  slug: string;
  ratingAverage: number;
  ratingCount: number;
}

interface Province { id: number; name: string; slug: string; }

export default function LocalityDetail() {
  const params = useParams();
  const apiEndpoint = params.province && params.locality ? `/api/localities/by-path/${params.province}/${params.locality}` : null;
  const localityQuery = useQuery<Locality>({ queryKey: [apiEndpoint], enabled: !!apiEndpoint });
  const localityData = localityQuery.data;
  const businessesQuery = useQuery<{ businesses: Business[]; total: number }>({
    queryKey: ["/api/businesses", { localityId: localityData?.id }],
    enabled: !!localityData?.id,
  });
  const { data: provinces } = useQuery<Province[]>({ queryKey: ["/api/provinces"] });
  const province = provinces?.find(item => item.id === localityData?.provinceId);
  const provinceLabel = province?.name || (country.name);
  const businessList = businessesQuery.data?.businesses || [];
  // Province > City > Locality
  const [placeSearch, setPlaceSearch] = useState("");
  const [showAllChildren, setShowAllChildren] = useState(false);
  const placesQuery = usePlaces(localityData?.provinceId || null);
  const { cities } = buildCityTree(placesQuery.data || []);
  const isCity = !!localityData && !localityData.parentId && !!localityData.isMainArea;
  const cityNode = isCity ? cities.find(c => c.id === localityData!.id) : undefined;
  const childLocalities = cityNode?.localities || [];
  const parentCity = localityData?.parentId ? cities.find(c => c.id === localityData.parentId) : undefined;
  const singleCityProvince = cities.length === 1;
  const displayName = localityData ? shortPlaceName(localityData, parentCity) : "";
  const childQuery = placeSearch.trim().toLowerCase();
  const matchingChildren = childQuery ? childLocalities.filter(l => l.name.toLowerCase().includes(childQuery)) : childLocalities;
  const CHILD_PREVIEW = 24;
  const visibleChildren = childQuery || showAllChildren ? matchingChildren : matchingChildren.slice(0, CHILD_PREVIEW);
  const total = businessesQuery.data?.total ?? businessList.length;

  if (localityQuery.isLoading) {
    return <><Header /><main className="locality-page"><div className="locality-shell locality-content locality-loading" role="status" aria-label="Loading locality"><div className="locality-skeleton" /><div className="locality-columns"><div className="locality-loading"><div className="locality-skeleton" /><div className="locality-skeleton" /></div><div className="locality-skeleton" /></div></div></main><Footer /></>;
  }

  if (!localityData || localityQuery.isError) {
    const notFound = !apiEndpoint || !localityQuery.isError || /404|not found/i.test(String(localityQuery.error));
    return <><Header /><main className="locality-page"><div className="locality-shell locality-content"><section className="locality-state" role={notFound ? undefined : "alert"}>
      <MapPin aria-hidden="true" /><h1 className="text-2xl font-bold">{notFound ? "Locality not found" : "We couldn’t load this locality"}</h1>
      <p>{notFound ? "This area may have moved or is no longer in the directory. Browse all localities to find your neighborhood." : "Please try again to see this area and its businesses."}</p>
      <div className="locality-state-actions">{!notFound && <button type="button" className="locality-button" onClick={() => void localityQuery.refetch()}>Try again</button>}<Link href="/localities" className="locality-button locality-button-outline"><ArrowLeft aria-hidden="true" />Browse all localities</Link></div>
    </section></div></main><Footer /></>;
  }

  // Cities have their own page (/cities/<city>); the server answers old URLs with a 301.
  if (isCity) return <Redirect to={cityUrl(localityData)} replace />;

  // Keep the existing locality SEO, canonical URLs and structured-data fields.
  const description = cleanBusinessDescription(localityData.description);
  const pagePath = `/localities/${params.province}/${params.locality}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: localityData.name,
    description: description || localize(tx("Businesses and services in {0}{1}, Pakistan.", localityData.name, province?.name ? `, ${province.name}` : "")),
    url: `${country.origin}${pagePath}`,
    address: { "@type": "PostalAddress", addressLocality: localityData.name, addressRegion: province?.name || undefined, addressCountry: country.iso },
    geo: geoFrom(localityData.coordinates),
    containedInPlace: parentCity ? { "@type": "City", name: parentCity.name, containedInPlace: province?.name ? { "@type": "AdministrativeArea", name: province.name } : undefined }
      : province?.name ? { "@type": "AdministrativeArea", name: province.name } : undefined,
  };
  const hasCoordinates = localityData.coordinates && Number.isFinite(Number(localityData.coordinates.lat)) && Number.isFinite(Number(localityData.coordinates.lng));

  return (
    <>
      <PageSEO
        title={(localityData.metaTitle && !/undefined|null/.test(localityData.metaTitle)) ? localityData.metaTitle : tx("{0}{1} Business Directory | PakistanYP", localityData.name, province?.name ? `, ${province.name}` : "")}
        description={localityData.metaDescription || tx("Discover verified businesses in {0}, {1}, Pakistan. Browse local services, restaurants, shops, professional services with contact details, reviews & ratings. Find the best businesses near you.", localityData.name, province?.name)}
        keywords={localityData.keywords || tx("{0} businesses, {1} business directory, Pakistan business listings, {2} services, local businesses {3}, verified businesses Pakistan, business directory Pakistan, {4} shops, {5} companies", localityData.name, province?.name, localityData.name, province?.name, localityData.name, province?.name)}
        canonicalUrl={tx("https://pakistanyp.com{0}", pagePath)}
        noindex={businessesQuery.isSuccess && total === 0}
        ogTitle={localityData.ogTitle || tx("{0} - {1} Business Directory", province?.name, localityData.name)}
        ogDescription={localityData.ogDescription || tx("Explore businesses in {0}, {1}. Verified listings with reviews and contact information.", localityData.name, province?.name)}
        ogImage={localityData.ogImage}
        twitterTitle={localityData.twitterTitle}
        twitterDescription={localityData.twitterDescription}
        twitterImage={localityData.twitterImage}
        schemaMarkup={[
          localityData.schemaMarkup || structuredData,
          breadcrumbLd([
            { name: "Home", path: "/" },
            province ? { name: province.name, path: `/${provinceSlug(province.name)}` } : null,
            parentCity && !singleCityProvince ? { name: parentCity.name, path: cityUrl(parentCity) } : null,
            { name: displayName, path: pagePath },
          ].filter(Boolean) as any),
        ]}
      />
      <Header />
      <main className="locality-page">
        <section className="locality-hero">
          <div className="locality-shell">
            <nav className="locality-breadcrumb" aria-label="Breadcrumb">
              <Link href="/">Home</Link><ChevronRight aria-hidden="true" />
              {province && <><Link href={regionUrl(province.name)}>{province.name}</Link><ChevronRight aria-hidden="true" /></>}
              {parentCity && <><Link href={cityUrl(parentCity)}>{parentCity.name}</Link><ChevronRight aria-hidden="true" /></>}
              <span aria-current="page">{displayName}</span>
            </nav>
            <p className="locality-eyebrow"><MapPin aria-hidden="true" />{isCity ? tx("City in {0}", provinceLabel) : parentCity ? tx("Locality in {0}", singleCityProvince ? provinceLabel : `${parentCity.name}, ${provinceLabel}`) : tx("{0} neighborhood directory", provinceLabel)}</p>
            <h1>{displayName}</h1>
            <p className="locality-lead">{description || tx("Find businesses and local services in {0}, {1}. Browse listings for contact details, locations and customer reviews where available.", localityData.name, provinceLabel)}</p>
            <div className="locality-meta">
              <span><MapPin aria-hidden="true" />{parentCity && !singleCityProvince ? `${parentCity.name}, ` : ""}{provinceLabel}{`, ${country.name}`}</span>
              {isCity && childLocalities.length > 0 && <span>{plural(childLocalities.length, "locality", "localities")}</span>}
              {!businessesQuery.isLoading && !businessesQuery.isError && <span><Building2 aria-hidden="true" />{tj("{0} {1} listed", total.toLocaleString(), total === 1 ? "business" : "businesses")}</span>}
            </div>
          </div>
        </section>
        <div className="locality-shell locality-content locality-columns">
          <div className="locality-primary">
            {isCity && childLocalities.length > 0 && (
              <section aria-labelledby="city-localities-heading" className="locality-children">
                <div className="locality-section-heading">
                  <h2 id="city-localities-heading">{tj("Localities in {0}", localityData.name)}</h2>
                  <p role="status">{childQuery ? tx("{0} match your search", plural(matchingChildren.length, "locality", "localities")) : plural(childLocalities.length, "locality", "localities")}</p>
                </div>
                {childLocalities.length > 12 && (
                  <div className="locality-search locality-children-search">
                    <input type="search" aria-label={tx("Search localities in {0}", localityData.name)} placeholder={tx("Search localities in {0}…", localityData.name)} value={placeSearch} onChange={event => setPlaceSearch(event.target.value)} />
                  </div>
                )}
                <ul className="locality-children-grid">
                  {visibleChildren.map(child => (
                    <li key={child.id}>
                      <Link href={`/localities/${child.slug}`} className="locality-child">
                        <MapPin aria-hidden="true" />
                        <span><span className="locality-place-name">{shortPlaceName(child, localityData)}</span><span className="locality-place-count">{plural(child.businessCount, "business", "businesses")}</span></span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {!visibleChildren.length && <p className="locality-children-empty">No localities match your search.</p>}
                {!childQuery && childLocalities.length > CHILD_PREVIEW && (
                  <button type="button" className="locality-text-link locality-children-more" aria-expanded={showAllChildren} onClick={() => setShowAllChildren(v => !v)}>
                    {showAllChildren ? "Show fewer" : tx("Show all {0}", plural(childLocalities.length, "locality", "localities"))}
                  </button>
                )}
              </section>
            )}
            <section aria-labelledby="locality-business-heading">
              <div className="locality-section-heading">
                <h2 id="locality-business-heading">{tj("Businesses in {0}", displayName)}</h2>
                {!businessesQuery.isLoading && !businessesQuery.isError && <p>{businessList.length === total ? `${total.toLocaleString()} ${total === 1 ? "listing" : "listings"}` : tx("Showing {0} of {1} listings", businessList.length, total.toLocaleString())}</p>}
              </div>
              {businessesQuery.isError ? (
                <div className="locality-state" role="alert"><Building2 aria-hidden="true" /><h2>Listings couldn’t be loaded</h2><p>Please try again to see businesses in this area.</p><button type="button" className="locality-button" onClick={() => void businessesQuery.refetch()}>Try again</button></div>
              ) : businessesQuery.isLoading || businessList.length > 0 ? (
                <BusinessListing businesses={businessList} layout="list" loading={businessesQuery.isLoading} province={province} />
              ) : (
                <div className="locality-state">
                  <Building2 aria-hidden="true" /><h2>No businesses listed here yet</h2>
                  <p>{tj("There are no listings in {0} at the moment. Explore another locality, or add your business to this area.", localityData.name)}</p>
                  <div className="locality-state-actions"><Link href="/localities" className="locality-button locality-button-outline">Explore localities</Link><Link href="/pricing" className="locality-button">Add your business</Link></div>
                </div>
              )}
            </section>
            <section className="locality-about" aria-labelledby="locality-about-heading">
              <h2 id="locality-about-heading">{tj("Your guide to businesses in {0}", localityData.name)}</h2>
              <p>{tx("Looking for a business in {0}, {1}? Use this directory to explore local listings and find the services you need close to home.", localityData.name, provinceLabel)}</p>
              <p>Open a business profile for available contact details, address information and customer reviews. You can call a business directly or get directions from its listing.</p>
              <Link href="/localities" className="locality-text-link"><ArrowLeft size={15} aria-hidden="true" />Browse all localities</Link>
            </section>
          </div>
          <aside className="locality-sidebar" aria-label="Locality information">
            <section className="locality-panel">
              <h2>Area at a glance</h2>
              <dl>
                <div><dt>{isCity ? "City" : "Locality"}</dt><dd>{displayName}</dd></div>
                {parentCity && <div><dt>City</dt><dd><Link href={cityUrl(parentCity)}>{parentCity.name}</Link></dd></div>}
                {isCity && childLocalities.length > 0 && <div><dt>Localities</dt><dd>{childLocalities.length.toLocaleString()}</dd></div>}
                <div><dt>{country.regionTerm.singular}</dt><dd>{provinceLabel}</dd></div>
                {!businessesQuery.isLoading && !businessesQuery.isError && <div><dt>Businesses</dt><dd>{total.toLocaleString()}</dd></div>}
                {Number(localityData.population) > 0 && <div><dt>Population</dt><dd>{Number(localityData.population).toLocaleString()}</dd></div>}
              </dl>
              {hasCoordinates && <a href={`https://www.google.com/maps/@${localityData.coordinates.lat},${localityData.coordinates.lng},15z`} target="_blank" rel="noopener noreferrer" className="locality-button locality-button-outline"><Navigation aria-hidden="true" />View area on map<ArrowUpRight aria-hidden="true" /></a>}
              {parentCity && <Link href={cityUrl(parentCity)} className="locality-text-link">{tj("All of {0}", parentCity.name)}<ChevronRight size={15} aria-hidden="true" /></Link>}
              {province && <Link href={regionUrl(province.name)} className="locality-text-link">{tj("Explore {0}", province.name)}<ChevronRight size={15} aria-hidden="true" /></Link>}
            </section>
            <section className="locality-panel locality-owner">
              <p className="locality-eyebrow">For business owners</p>
              <h2>Be found in your neighborhood.</h2>
              <p>{tj("List your business in {0} so people searching locally can find and contact you.", localityData.name)}</p>
              <Link href="/pricing" className="locality-button">Add your business<ArrowUpRight aria-hidden="true" /></Link>
            </section>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
