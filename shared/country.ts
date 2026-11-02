/**
 * Site configuration for PakistanYP (pakistanyp.com).
 *
 * Brand, domain, provinces and cities, phone and currency formats, colours and
 * logo files. Import from client and server alike:
 *   import { country } from "@shared/country";
 */

import { REGIONS } from "./countries/places";

// <country-code>
export type CountryCode = "pk";
// </country-code>

export interface Region {
  /** URL slug, also how existing pages derive slugs from the regions table: name.toLowerCase().replace(/\s+/g, "-") */
  slug: string;
  name: string;
  nameAr: string;
  capital?: boolean;
  /** Official subdivision code (ISO 3166-2), stored in the regions table "code" column */
  code?: string;
  /** locality: a neighbourhood inside a city (stored as "<Locality>, <City>", not a main area) */
  cities?: { name: string; nameAr: string; locality?: boolean }[];
}

export interface CountryConfig {
  code: CountryCode;
  /** ISO 3166-1 alpha-2 */
  iso: "PK";
  /** Short name used in running copy */
  name: string;
  /** Name for sentences: "in Pakistan" */
  inName: string;
  /** Short label for compact UI */
  shortName: string;
  nameAr: string;
  /** Adjective: "Pakistani businesses" */
  adjective: string;
  domain: string;
  origin: string;
  brand: string;
  /** "Pakistan Yellow Pages" — used in titles */
  directoryName: string;
  siteName: string;
  tagline: string;
  regionTerm: { singular: string; plural: string };
  /** Provinces index; "<regionsPath>/<slug>" 301s to the canonical "/<slug>" */
  regionsPath: string;
  regions: Region[];
  phonePrefix: string;
  phonePlaceholder: string;
  currency: string;
  locale: string;
  timezone: string;
  /** Map default centre */
  geo: { lat: number; lng: number };
  /** Top header stripe, left to right (flex weights) */
  flagStripe: { color: string; weight: number }[];
  logo: { full: string; fullWebp?: string; fullPng?: string; mark: string; markWebp?: string; markPng?: string; width: number; height: number };
  ogImage: string;
  social: { name: string; href: string }[];
  contact: { email: string; address: string };
  /** Business licence wording used on profiles */
  licenceAuthority: string;
  popularSearches: string[];
  /** Three best-known cities */
  majorCities: [string, string, string];
  /** Script of the local-language (Urdu) names stored in nameAr */
  localLanguage?: { code: string; dir: "rtl" | "ltr" };
  /** "all provinces & territories" style phrase */
  regionsPhrase?: string;
  /** Licence/registration types a business can upload for verification */
  licenceAuthorities?: string[];
}

// <country-config>  (each country pack replaces this block)
const SITE: CountryConfig = {
  code: "pk",
  iso: "PK",
  name: "Pakistan",
  inName: "in Pakistan",
  shortName: "Pakistan",
  nameAr: "پاکستان",
  adjective: "Pakistan",
  domain: "pakistanyp.com",
  origin: "https://pakistanyp.com",
  brand: "PakistanYP",
  directoryName: "Pakistan Yellow Pages",
  siteName: "PakistanYP - Pakistan Business Directory",
  tagline: "Pakistan Business Directory",
  regionTerm: { singular: "Province", plural: "Provinces" },
  regionsPath: "/provinces",
  regions: REGIONS,
  phonePrefix: "+92",
  phonePlaceholder: "300 1234567",
  currency: "PKR",
  locale: "en-PK",
  timezone: "Asia/Karachi",
  geo: { lat: 30.3753, lng: 69.3451 },
  // Brand stripe: white and Pakistan green, in the flag's 1:3 proportion
  flagStripe: [
    { color: "#FFFFFF", weight: 1 },
    { color: "#0B6B2E", weight: 3 },
  ],
  logo: {
    full: "/logo/pakistanyp-logo.png",
    fullWebp: "/logo/pakistanyp-logo-104.webp",
    fullPng: "/logo/pakistanyp-logo-104.png",
    mark: "/logo/pakistanyp-mark.png",
    markWebp: "/logo/pakistanyp-mark-104.webp",
    markPng: "/logo/pakistanyp-mark-104.png",
    width: 1773,
    height: 366,
  },
  ogImage: "/og-homepage.jpg",
  social: [],
  contact: { email: "info@pakistanyp.com", address: "Islamabad, Pakistan" },
  licenceAuthority: "NTN (FBR registration)",
  popularSearches: ["Doctors", "Property dealers", "Solar installers", "Tutors & academies", "AC repair", "Restaurants"],
  majorCities: ["Karachi", "Lahore", "Islamabad"],
  localLanguage: { code: "ur", dir: "rtl" },
  regionsPhrase: "Provinces & Territories",
  licenceAuthorities: [
    "NTN certificate (FBR)",
    "Sales tax registration (STRN)",
    "SECP certificate of incorporation",
    "Chamber of Commerce membership",
    "Trade / municipal licence",
    "Food authority licence",
    "Professional registration (PMDC, PEC, Bar Council...)",
    "Other",
  ],
};
// </country-config>

export const COUNTRIES = { [SITE.code]: SITE } as Record<CountryCode, CountryConfig>;

export const country: CountryConfig = SITE;
/** lang/dir attributes for Urdu names (nameAr) */
export const localLang = country.localLanguage?.code || "ur";
export const localDir: "rtl" | "ltr" = country.localLanguage?.dir || "rtl";

const slugifyName = (name?: string) => (name || "").toLowerCase().trim().replace(/\s+/g, "-");

/**
 * URL slug of a province/territory, from its name or slug. Returns the configured slug,
 * so "Islamabad Capital Territory" -> "islamabad" and "Azad Jammu and Kashmir" -> "azad-kashmir".
 * Unknown names fall back to a plain slug.
 */
export const regionSlug = (name?: string) => {
  const s = slugifyName(name);
  const region = country.regions.find((r) => r.slug === s || slugifyName(r.name) === s);
  return region ? region.slug : s;
};

/** Public URL of a province page: top-level slug (/punjab, /sindh). */
export const regionUrl = (name?: string) => `/${regionSlug(name)}`;

/** "+92" prefix for phone inputs */
export const phonePrefix = country.phonePrefix;

/** Copy hook kept for call sites; all copy is written for Pakistan, so this returns the text unchanged. */
export function localize(text: string): string {
  return text;
}
