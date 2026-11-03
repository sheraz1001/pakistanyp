/**
 * Saudi Life helpers: bilingual text, number/currency formatting, URLs.
 * Page text in this module is written in both languages (no dictionary lookup needed).
 */
import { isSecondLang, langPath, num, dateLocale } from "@shared/i18n";
import { country } from "@shared/country";

export interface Bi { en: string; ar: string }
export const bi = (en: string, ar: string): Bi => ({ en, ar });
/** Pick the text for the page language. */
export const L = (text: Bi | string): string => (typeof text === "string" ? text : isSecondLang() ? text.ar : text.en);
export const isAr = () => isSecondLang();

/** SAR amount: "SAR 1,234.50" / "١٬٢٣٤٫٥٠ ر.س" */
export function sar(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "—";
  const n = num(Math.round(value * 10 ** decimals) / 10 ** decimals, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return isAr() ? `${n} ر.س` : `SAR ${n}`;
}
export const fmt = (value: number, decimals = 2) => (Number.isFinite(value) ? num(Math.round(value * 10 ** decimals) / 10 ** decimals, { maximumFractionDigits: decimals }) : "—");
export const pct = (value: number, decimals = 2) => (Number.isFinite(value) ? `${fmt(value, decimals)}${isAr() ? "٪" : "%"}` : "—");

export function formatDate(d: Date | string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }): string {
  const date = typeof d === "string" ? new Date(`${d.length === 10 ? `${d}T12:00:00` : d}`) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(dateLocale("en-GB"), { timeZone: "Asia/Riyadh", ...opts });
}

/** Absolute URL of a path in the current language (for share links and JSON-LD). */
export const absUrl = (path: string) => `${country.origin}${langPath(path)}`;
export { langPath };
