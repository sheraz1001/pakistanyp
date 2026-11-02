/**
 * Site languages. English is served at the main addresses; an optional second language
 * (country.secondLanguage, e.g. Arabic) is served under "/<code>/...".
 *
 *   t("Find businesses")              -> translated UI text (English is the key)
 *   t("{0} businesses in {1}", n, x)  -> placeholders; numbers are formatted for the language
 *   num(1234)                         -> "1,234" or "١٬٢٣٤"
 *
 * The current language comes from the request (server, via AsyncLocalStorage set in
 * entry-server) or from the page address (browser). Switching language loads the other address.
 */
import { country } from "./country";

export const SECOND = country.secondLanguage;
export const SECOND_PREFIX = SECOND ? `/${SECOND.code}` : "";
export type LangCode = string;

let dictionary: Record<string, string> = {};
export function setDictionary(d: Record<string, string>) { dictionary = d || {}; }
export function hasDictionary() { return Object.keys(dictionary).length > 0; }

/** Language of the path ("/ar/riyadh" -> "ar"). */
export function langOfPath(pathname: string): LangCode {
  if (!SECOND) return "en";
  return pathname === SECOND_PREFIX || pathname.startsWith(`${SECOND_PREFIX}/`) || pathname.startsWith(`${SECOND_PREFIX}?`) ? SECOND.code : "en";
}

export function currentLang(): LangCode {
  if (!SECOND) return "en";
  const store = (globalThis as any).__ypLangStore?.getStore?.();
  if (typeof store === "string") return store;
  if (typeof window !== "undefined") return (window as any).__YP_LANG__ || langOfPath(window.location.pathname);
  return "en";
}

export const isSecondLang = () => !!SECOND && currentLang() === SECOND.code;
export const langDir = (): "rtl" | "ltr" => (isSecondLang() ? SECOND!.dir : "ltr");
export const langLocale = () => (isSecondLang() ? SECOND!.locale : country.locale);

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
/** Western digits -> the language's digits (Arabic-Indic for Arabic). */
export function digits(s: string | number): string {
  const str = String(s);
  if (!isSecondLang() || SECOND!.code !== "ar") return str;
  return str.replace(/[0-9]/g, (d) => ARABIC_DIGITS[+d]).replace(/,/g, "٬").replace(/(\d|[٠-٩])\.(?=[0-9٠-٩])/g, "$1٫");
}

const formatters = new Map<string, Intl.NumberFormat>();
/** Number formatted for the current language. */
export function num(value: unknown, options?: Intl.NumberFormatOptions): string {
  const n = typeof value === "number" ? value : Number(value);
  if (value === null || value === undefined || value === "" || Number.isNaN(n)) return value == null ? "" : String(value);
  const locale = isSecondLang() ? `${SECOND!.locale}-u-nu-${SECOND!.code === "ar" ? "arab" : "latn"}` : country.locale;
  const key = locale + JSON.stringify(options || {});
  let f = formatters.get(key);
  if (!f) { f = new Intl.NumberFormat(locale, options); formatters.set(key, f); }
  return f.format(n);
}

const URLISH = /^(https?:|www\.|mailto:|tel:)|@[\w-]+\.|\.(com|sa|net|org)\b/i;

/**
 * Render-time translation of a text node or text prop (used by the JSX runtime in
 * client/src/i18n-jsx): exact dictionary match on the trimmed text, surrounding spaces kept,
 * then the language's digits. English pages are returned untouched.
 */
export function translateNode(value: string): string {
  if (!isSecondLang() || !value) return value;
  const core = value.trim();
  if (!core) return value;
  let out = value;
  const hit = dictionary[core];
  if (hit !== undefined) {
    const start = value.indexOf(core);
    out = value.slice(0, start) + hit + value.slice(start + core.length);
  }
  return /[0-9]/.test(out) && !URLISH.test(out) ? digits(out) : out;
}

/** Locale for dates: unchanged on English pages; Gregorian calendar with the language's digits otherwise. */
export function dateLocale(original?: string | string[]): any {
  if (!isSecondLang()) return original;
  return `${SECOND!.locale}-u-ca-gregory${SECOND!.code === "ar" ? "-nu-arab" : ""}`;
}

/** Translate UI text. Placeholders {0}, {1}... are filled with the extra arguments. */
export function t(text: string, ...vars: unknown[]): string {
  if (typeof text !== "string") return text as any;
  let out = isSecondLang() ? dictionary[text] ?? dictionary[text.trim()] ?? text : text;
  if (vars.length) out = out.replace(/\{(\d+)\}/g, (m, i) => {
    const v = vars[Number(i)];
    if (v === undefined || v === null) return "";
    if (typeof v === "number") return digits(String(v)); // numbers keep their form (years!), only the digits change
    const str = String(v);
    if (isSecondLang() && /^(s|es)$/.test(str)) return ""; // English plural endings ("{0} review{1}")
    return isSecondLang() ? dictionary[str.trim()] ?? digits(str) : str; // e.g. {n === 1 ? "business" : "businesses"}
  });
  return out;
}

/** Address of `path` in a language ("/riyadh" + "ar" -> "/ar/riyadh"). `path` is a main-site path. */
export function pathInLang(path: string, lang: LangCode): string {
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) return path; // external, mailto:, #hash...
  const clean = stripLang(path);
  if (!SECOND || lang !== SECOND.code) return clean;
  return clean === "/" ? SECOND_PREFIX : `${SECOND_PREFIX}${clean}`;
}

/** "/ar/riyadh" -> "/riyadh" */
export function stripLang(path: string): string {
  if (!SECOND || typeof path !== "string") return path || "/";
  if (path === SECOND_PREFIX) return "/";
  if (path.startsWith(`${SECOND_PREFIX}/`)) return path.slice(SECOND_PREFIX.length) || "/";
  if (path.startsWith(`${SECOND_PREFIX}?`)) return `/${path.slice(SECOND_PREFIX.length)}`;
  return path || "/";
}

/** Prefix for links written as plain strings (wouter <Link>/navigate add it automatically). */
export const langPath = <T,>(path: T): T => (typeof path === "string" && isSecondLang() && !ENGLISH_ONLY.test(path) ? (pathInLang(path, currentLang()) as any) : path);

/** Paths that are always English (admin). */
export const ENGLISH_ONLY = /^\/(admin|super-admin|superadmin|admin-)/;
