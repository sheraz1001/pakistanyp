import { useState } from "react";
import { ArrowUpRight, Check, Globe, LayoutGrid, List, MapPin, MessageCircle, Navigation, Phone, Star } from "lucide-react";
import "./business-card.css";
import { country } from "@shared/country";

export type BusinessCardLayout = "grid" | "list";
type DirectoryRecord = Record<string, any>;
interface BusinessCardProps {
  business: DirectoryRecord;
  layout?: BusinessCardLayout;
  category?: DirectoryRecord;
  province?: DirectoryRecord;
  locality?: DirectoryRecord;
  showCategory?: boolean;
  onProfileClick?: () => void;
}

/** Plain text only: never inserts API content as HTML or interprets markdown. */
export function cleanBusinessDescription(value: unknown): string {
  if (typeof value !== "string") return "";
  const entities: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return value
    .replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (match, code: string) => {
      if (code[0] !== "#") return entities[code.toLowerCase()] ?? match;
      const numeric = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return numeric > 0 && numeric <= 0x10ffff && !(numeric >= 0xd800 && numeric <= 0xdfff) ? String.fromCodePoint(numeric) : "";
    })
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/^\s{0,3}(?:#{1,6}\s*|[-+*>]\s+|\d+\.\s+)/gm, "")
    .replace(/[*_`#~|\\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function businessTitleCase(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\p{L}\p{N}]+(?:['’][\p{L}]+)?/gu, word =>
    /^(PVT|LTD|SMC|LLP|DHA|PECHS|IT|CNG|LPG|ATM|NADRA|SECP|FBR)$/i.test(word)
      ? word.toUpperCase()
      : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

// Pakistani numbers. Mobiles: 03XX XXXXXXX (10 digits after the trunk 0).
// Landlines: 0 + area code (2 digits for the big cities, e.g. 21 Karachi, 42 Lahore,
// 51 Islamabad/Rawalpindi; 3 digits elsewhere) + local number.
const PK_TWO_DIGIT_AREA = /^(21|22|41|42|51|52|55|61|71|81|91)/;

export function normalizeBusinessPhone(value: unknown): string {
  if (typeof value !== "string") return "";
  // Do not merge extensions or multiple phone numbers into a fictional number.
  const first = value.split(/[,;/]|\s+(?:or|ext\.?|x)\s*/i)[0].trim();
  let digits = first.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (/^03\d{9}$/.test(digits)) return `92${digits.slice(1)}`;
  if (/^3\d{9}$/.test(digits)) return `92${digits}`;
  if (/^0[1-9]\d{8,9}$/.test(digits)) return `92${digits.slice(1)}`;
  return digits;
}

export function formatBusinessPhone(value: unknown): string {
  const digits = normalizeBusinessPhone(value);
  if (/^923\d{9}$/.test(digits)) return `+92 ${digits.slice(2, 5)} ${digits.slice(5)}`;
  if (/^92[1-9]\d{8,9}$/.test(digits)) {
    const rest = digits.slice(2);
    const code = PK_TWO_DIGIT_AREA.test(rest) ? rest.slice(0, 2) : rest.slice(0, 3);
    return `+92 ${code} ${rest.slice(code.length)}`;
  }
  return typeof value === "string" ? value : "";
}

function safeWebUrl(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const raw = value.trim();
    if (/^[a-z][a-z\d+.-]*:/i.test(raw) && !/^https?:/i.test(raw)) return "";
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw.replace(/^\/\//, "")}`);
    return url.hostname.includes(".") && !url.username && !url.password ? url.href : "";
  } catch { return ""; }
}

function safeImage(value: unknown): string {
  return typeof value === "string" && (/^\/(?!\/)/.test(value) || /^https?:\/\//i.test(value)) ? value : "";
}

function named(value: unknown): string {
  return typeof value === "string" ? value : value && typeof value === "object" && "name" in value ? String(value.name || "") : "";
}

function hash(value: string): number {
  return Array.from(value).reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 0);
}

/** Tinted monogram tiles from the brand palette (Main.dc.html category tiles). */
const TILE_TINTS: [string, string][] = [
  ["#E8F4EC", "#0B6B2E"], ["#E6F6F1", "#047857"], ["#FFF4E0", "#B45309"], ["#FDECEC", "#B91C1C"], ["#F1F2F6", "#334155"],
];

export default function BusinessCard({ business, layout = "grid", category, province, locality, onProfileClick }: BusinessCardProps) {
  const [failedLogo, setFailedLogo] = useState("");
  const name = businessTitleCase(business.name);
  const href = `/business/${business.slug || business.id}`;
  const categoryName = businessTitleCase(named(business.category) || business.categoryName || category?.name);
  const localityName = businessTitleCase(named(business.locality) || business.localityName || locality?.name);
  const provinceName = businessTitleCase(named(business.province) || business.provinceName || province?.name);
  const location = [...new Set([localityName, provinceName].filter(Boolean))].join(", ") || businessTitleCase(business.address);
  const [tint, ink] = TILE_TINTS[hash(String(business.name || "")) % TILE_TINTS.length];
  const logo = safeImage(business.logoUrl) || safeImage(business.logo);
  const initials = String(business.name || "").trim().split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join("").toUpperCase();
  const phone = normalizeBusinessPhone(business.phone);
  const whatsapp = [business.whatsapp, business.phone].map(normalizeBusinessPhone).find(number => (new RegExp(`^${country.phonePrefix.replace(/\D/g, "")}5\\d{8}$`)).test(number));
  const website = safeWebUrl(business.website);
  const domain = website ? new URL(website).hostname.replace(/^www\./i, "") : "";
  const count = Number(business.ratingCount ?? business.reviewCount ?? business.totalReviews ?? 0);
  const rating = Number(business.ratingAverage) > 0 ? Number(business.ratingAverage) : Number(business.rating);
  const hasReviews = Number.isFinite(count) && count > 0 && Number.isFinite(rating) && rating > 0 && rating <= 5;
  const coords = business.coordinates;
  const hasCoordinates = coords && coords.lat != null && coords.lng != null && Number.isFinite(Number(coords.lat)) && Number.isFinite(Number(coords.lng)) && Math.abs(Number(coords.lat)) <= 90 && Math.abs(Number(coords.lng)) <= 180;
  const directionsQuery = hasCoordinates ? `${coords.lat},${coords.lng}` : [business.name, business.address, localityName, provinceName].filter(Boolean).join(", ");
  const directions = safeWebUrl(business.googleMapsUrl) || (business.address || location || hasCoordinates ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(directionsQuery)}` : "");
  const description = cleanBusinessDescription(business.shortDescription || business.description);
  const isList = layout === "list";

  const tile = (
    <a href={href} onClick={onProfileClick} aria-label={name} tabIndex={-1}
      className={`directory-tile ${isList ? "directory-tile-lg" : ""}`} style={{ background: tint, color: ink }}>
      <span aria-hidden="true">{initials}</span>
      {logo && logo !== failedLogo && <img src={logo} alt={`${name} logo`} loading="lazy" onError={() => setFailedLogo(logo)} />}
    </a>
  );

  const ratingLine = (
    <div className="directory-rating">
      {hasReviews ? <>
        <Star size={16} className="fill-[#F59E0B] text-[#F59E0B]" aria-hidden="true" />
        <span className="font-semibold text-[#0A0A0A]">{rating.toFixed(1)}</span>
        <span className="text-[#5B6475]">({count} {count === 1 ? "review" : "reviews"}){location ? ` · ${location}` : ""}</span>
      </> : <>
        <span className="directory-new">New listing</span>
        {location && <span className="inline-flex items-center gap-1 text-[#5B6475]"><MapPin size={14} aria-hidden="true" /><span className="line-clamp-1">{location}</span></span>}
      </>}
    </div>
  );

  const tags = (categoryName || business.isFeatured) ? (
    <div className="flex flex-wrap gap-1.5">
      {categoryName && <span className="yp-tag line-clamp-1 max-w-full">{categoryName}</span>}
      {business.isFeatured && <span className="yp-tag yp-tag-green">Featured</span>}
    </div>
  ) : null;

  const heading = (
    <div className="directory-heading">
      <h3><a href={href} className="line-clamp-2" onClick={onProfileClick}>{name}</a></h3>
      {business.isVerified && <span className="yp-verified"><Check size={12} strokeWidth={3} aria-hidden="true" />Verified</span>}
    </div>
  );

  if (isList) {
    return (
      <article className="directory-card directory-card-list" aria-label={name}>
        {tile}
        <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-2">
          {heading}
          {ratingLine}
          {description && <p className="directory-description line-clamp-2">{description}</p>}
          {tags}
          {(website || directions) && <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
            {website && <a className="inline-flex items-center gap-1.5 text-[#0B6B2E] hover:text-[#05501F]" href={website} target="_blank" rel="noopener noreferrer" aria-label={`${name} website (opens in a new tab)`}><Globe size={14} aria-hidden="true" /><span className="truncate">{domain}</span></a>}
            {directions && <a className="inline-flex items-center gap-1.5 text-[#0B6B2E] hover:text-[#05501F]" href={directions} target="_blank" rel="noopener noreferrer" aria-label={`Directions to ${name} on Google Maps (opens in a new tab)`}><Navigation size={14} aria-hidden="true" />Directions</a>}
          </div>}
        </div>
        <div className="flex flex-[0_1_170px] flex-col justify-center gap-2">
          <a className="yp-btn yp-btn-primary" href={`${href}#quote`} onClick={onProfileClick}>Request quote</a>
          {phone
            ? <a className="yp-btn yp-btn-ghost" href={`tel:+${phone}`} aria-label={`Call ${name} at ${formatBusinessPhone(business.phone)}`}><Phone size={16} aria-hidden="true" />Call</a>
            : <a className="yp-btn yp-btn-ghost" href={href} onClick={onProfileClick}>View profile</a>}
          {whatsapp && <a className="yp-btn yp-btn-ghost" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label={`Message ${name} on WhatsApp (opens in a new tab)`}><MessageCircle size={16} aria-hidden="true" />WhatsApp</a>}
        </div>
      </article>
    );
  }

  return (
    <article className="directory-card" aria-label={name}>
      <div className="flex items-start gap-4">
        {tile}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {heading}
          {ratingLine}
        </div>
      </div>
      {description && <p className="directory-description line-clamp-2">{description}</p>}
      {tags}
      {(phone || website) && <div className="directory-contact">
        {phone && <a href={`tel:+${phone}`} aria-label={`Call ${name} at ${formatBusinessPhone(business.phone)}`}><Phone size={14} aria-hidden="true" /><span dir="ltr">{formatBusinessPhone(business.phone)}</span></a>}
        {website && <a href={website} target="_blank" rel="noopener noreferrer" aria-label={`${name} website (opens in a new tab)`}><Globe size={14} aria-hidden="true" /><span className="truncate">{domain}</span></a>}
      </div>}
      <div className="directory-actions">
        <div className="directory-icon-actions">
          {phone && <a className="directory-action" href={`tel:+${phone}`} aria-label={`Call ${name}`} title="Call"><Phone size={16} aria-hidden="true" /></a>}
          {whatsapp && <a className="directory-action" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label={`Message ${name} on WhatsApp (opens in a new tab)`} title="WhatsApp"><MessageCircle size={16} aria-hidden="true" /></a>}
          {website && <a className="directory-action" href={website} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${name} website (opens in a new tab)`} title="Website"><Globe size={16} aria-hidden="true" /></a>}
          {directions && <a className="directory-action" href={directions} target="_blank" rel="noopener noreferrer" aria-label={`Directions to ${name} on Google Maps (opens in a new tab)`} title="Directions"><Navigation size={16} aria-hidden="true" /></a>}
        </div>
        <a className="yp-btn yp-btn-primary directory-profile" href={href} onClick={onProfileClick}>View profile<ArrowUpRight size={15} aria-hidden="true" /></a>
      </div>
    </article>
  );
}

export function BusinessCardSkeleton({ layout = "grid", className = "" }: { layout?: BusinessCardLayout; className?: string }) {
  const isList = layout === "list";
  return <div className={`directory-card directory-skeleton ${isList ? "directory-card-list" : ""} ${className}`} role="status" aria-label="Loading business">
    <div className={`directory-tile ${isList ? "directory-tile-lg" : ""} directory-placeholder animate-pulse`} />
    <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-3 animate-pulse">
      <div className="directory-placeholder h-6 w-3/5" />
      <div className="directory-placeholder h-4 w-2/5" />
      <div className="directory-placeholder h-4 w-full" />
      <div className="directory-placeholder h-4 w-4/5" />
      <div className="flex gap-2"><div className="directory-placeholder h-7 w-20" /><div className="directory-placeholder h-7 w-16" /></div>
    </div>
    {isList && <div className="flex flex-[0_1_170px] flex-col gap-2 animate-pulse"><div className="directory-placeholder h-11 w-full" /><div className="directory-placeholder h-11 w-full" /></div>}
  </div>;
}

export function BusinessViewToggle({ value, onChange }: { value: BusinessCardLayout; onChange: (value: BusinessCardLayout) => void }) {
  return <div className="directory-view-toggle" role="group" aria-label="Business listing view">
    <button type="button" aria-label="Grid view" aria-pressed={value === "grid"} onClick={() => onChange("grid")}><LayoutGrid size={17} aria-hidden="true" /><span className="hidden sm:inline">Grid</span></button>
    <button type="button" aria-label="List view" aria-pressed={value === "list"} onClick={() => onChange("list")}><List size={17} aria-hidden="true" /><span className="hidden sm:inline">List</span></button>
  </div>;
}
