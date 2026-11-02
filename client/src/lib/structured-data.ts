/** Small JSON-LD builders shared by page <head>s (server-rendered via Helmet). */
import { country } from "@shared/country";

export const SITE = country.origin;

export interface Crumb {
  name: string;
  path?: string;
}

/** schema.org BreadcrumbList. Items without a path (current page) still get the page URL. */
export function breadcrumbLd(crumbs: Crumb[], currentPath?: string) {
  const items = crumbs.filter((c) => c && c.name);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: SITE + (c.path ?? currentPath ?? "/"),
    })),
  };
}

/** {lat,lng} from the various coordinate shapes stored on businesses/localities. */
export function geoFrom(coords: any): { "@type": "GeoCoordinates"; latitude: number; longitude: number } | undefined {
  if (!coords) return undefined;
  let c = coords;
  if (typeof c === "string") {
    try {
      c = JSON.parse(c);
    } catch {
      return undefined;
    }
  }
  const lat = Number(c.lat ?? c.latitude);
  const lng = Number(c.lng ?? c.lon ?? c.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return undefined;
  return { "@type": "GeoCoordinates", latitude: lat, longitude: lng };
}

export const provinceSlug = (name?: string) => (name || "").toLowerCase().trim().replace(/\s+/g, "-");
