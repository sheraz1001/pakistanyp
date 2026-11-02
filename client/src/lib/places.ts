/**
 * Province > City > Locality helpers.
 *
 * GET /api/places?provinceId= returns every place in a province: cities have
 * isMainArea = true (parentId null); localities point to their city with parentId.
 * Locality names are stored as "<Locality>, <City>" (e.g. "Clifton, Karachi").
 */
import { useQuery } from "@tanstack/react-query";

export interface Place {
  id: number;
  name: string;
  arabicName?: string | null;
  slug: string;
  provinceId: number;
  parentId: number | null;
  isMainArea: boolean;
  businessCount: number;
}

export interface CityNode extends Place {
  localities: Place[];
  /** Businesses in the city itself plus all of its localities */
  totalBusinesses: number;
}

export function usePlaces(provinceId?: number | null) {
  return useQuery<Place[]>({
    queryKey: [provinceId ? `/api/places?provinceId=${provinceId}` : "/api/places"],
    enabled: provinceId === undefined || !!provinceId,
    staleTime: 5 * 60 * 1000,
  });
}

/** "Clifton, Karachi" -> "Clifton" when shown under Karachi. */
export function shortPlaceName(place: Pick<Place, "name">, city?: Pick<Place, "name"> | null): string {
  if (city && place.name.endsWith(`, ${city.name}`)) return place.name.slice(0, -(city.name.length + 2));
  return place.name;
}

const byName = (a: Place, b: Place) => a.name.localeCompare(b.name);

/** Cities of a province, each with its localities (sorted). Localities without a city are returned separately. */
export function buildCityTree(places: Place[]): { cities: CityNode[]; orphans: Place[] } {
  const cityRows = places.filter((p) => p.isMainArea && !p.parentId);
  const cityIds = new Set(cityRows.map((c) => c.id));
  const children = new Map<number, Place[]>();
  const orphans: Place[] = [];
  for (const p of places) {
    if (cityIds.has(p.id)) continue;
    if (p.parentId && cityIds.has(p.parentId)) {
      const list = children.get(p.parentId) || [];
      list.push(p);
      children.set(p.parentId, list);
    } else orphans.push(p);
  }
  const cities = cityRows
    .map((c) => {
      const localities = (children.get(c.id) || []).sort(byName);
      return { ...c, localities, totalBusinesses: c.businessCount + localities.reduce((n, l) => n + l.businessCount, 0) };
    })
    .sort(byName);
  return { cities, orphans: orphans.sort(byName) };
}

/**
 * A province with a single city that has localities (Islamabad Capital Territory)
 * is shown without the city level: its localities are listed directly.
 */
export function singleCityOf(cities: CityNode[]): CityNode | null {
  return cities.length === 1 && cities[0].localities.length > 0 ? cities[0] : null;
}

export const plural = (n: number, one: string, many: string) => `${n.toLocaleString()} ${n === 1 ? one : many}`;

/** A city's own page: "sindh/karachi" -> "/cities/karachi". */
export const cityUrl = (city: Pick<Place, "slug">) => `/cities/${city.slug.split("/").pop()}`;

/** Page of any place: cities at /cities/<city>, localities at /localities/<province>/<locality>. */
export const placeUrl = (place: Pick<Place, "slug" | "isMainArea" | "parentId">) =>
  place.isMainArea && !place.parentId ? cityUrl(place) : `/localities/${place.slug}`;
