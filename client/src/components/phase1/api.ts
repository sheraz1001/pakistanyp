import { dateLocale } from "@shared/i18n";
import { country, localize } from "@shared/country";

/** Tiny fetch helper for Phase 1 components: JSON in/out, cookies included, readable errors. */
export async function api<T = any>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: { Accept: "application/json", ...(init?.json !== undefined ? { "Content-Type": "application/json" } : {}), ...(init?.headers || {}) },
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { message: text.slice(0, 200) }; }
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
  return data as T;
}

export const BUDGET_BANDS = ["Under PKR 5,000", "PKR 5,000 – 20,000", "PKR 20,000 – 50,000", "PKR 50,000 – 200,000", "Over PKR 200,000"].map(localize);
export const TIMELINES = ["As soon as possible", "Within a month", "In 1–3 months", "Later this year", "Just comparing options"];
export const DURATIONS = ["One-off job", "Under a month", "1–6 months", "6–12 months", "Ongoing"];
export const LICENCE_AUTHORITIES = country.licenceAuthorities ? country.licenceAuthorities : [
  // Non-Pakistani (Pakistan): provisional list - owner to confirm
  "Ministry of Commerce (Commercial Registration)", "Ministry of Investment (MISA)", "Other",
];

export const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString(dateLocale(country.locale), { year: "numeric", month: "short", day: "numeric" }) : "");
