/**
 * Calculator definitions are declarative: inputs, a pure compute() and bilingual content.
 * compute() never touches the DOM, so it is unit-tested (tests/saudi-life.test.ts) and reused by the UI.
 * Official rates come from the rules data (server/extensions/saudi-life/rules.json, editable in the admin),
 * passed in as `rules`; market prices are editable inputs with labelled defaults.
 */
import type { Bi } from "../lib";

export type InputValue = number | string | boolean;
export type Values = Record<string, InputValue>;

export interface Rule {
  id: string;
  summary_en?: string;
  summary_ar?: string;
  values: Record<string, any>;
  effectiveFrom?: string | null;
  sources: { title: string; url: string; publisher?: string; accessed?: string }[];
  confidence?: "confirmed" | "secondary" | "unconfirmed";
  verifiedOn?: string;
  notes?: string;
}
export type Rules = Record<string, Rule>;

interface BaseInput { id: string; label: Bi; help?: Bi; showIf?: (v: Values) => boolean }
export interface NumberInput extends BaseInput { type: "number"; unit?: Bi; min?: number; max?: number; step?: number; default: number | ((rules: Rules) => number); required?: boolean }
export interface SelectInput extends BaseInput { type: "select"; options: { value: string; label: Bi }[]; default: string }
export interface DateInput extends BaseInput { type: "date"; default: string | (() => string) }
export interface ToggleInput extends BaseInput { type: "toggle"; default: boolean }
export interface TextInput extends BaseInput { type: "text"; default: string; multiline?: boolean; placeholder?: Bi }
export type Input = NumberInput | SelectInput | DateInput | ToggleInput | TextInput;

export interface ResultRow { label: Bi; value: string | Bi; strong?: boolean; note?: Bi }
export interface Result {
  headline: { label: Bi; value: string | Bi };
  rows: ResultRow[];
  /** Plain-language explanation of how this result was reached */
  steps?: Bi[];
  warnings?: Bi[];
}

export interface Faq { q: Bi; a: Bi }

export interface Calculator {
  slug: string;
  section: string;
  title: Bi;           // page title / H1
  short: Bi;           // card description
  metaDescription: Bi;
  inputs: Input[];
  compute: (v: Values, rules: Rules) => Result;
  /** rule ids whose sources and verification dates are shown */
  ruleIds: string[];
  kind: "official" | "estimate";   // official = regulated formula; estimate = illustrative
  content: { intro: Bi; howTo: Bi; formula: Bi; example?: Bi; limitations?: Bi; faq?: Faq[] };
  related?: string[];  // other calculator slugs
  reviewed: string;    // last content review (YYYY-MM-DD)
}

export class InputError extends Error {
  constructor(public field: string, public text: Bi) { super(text.en); }
}

/** Read a validated number from the values. */
export function n(v: Values, id: string, opts: { min?: number; max?: number; label?: Bi } = {}): number {
  const x = typeof v[id] === "number" ? (v[id] as number) : Number(v[id]);
  if (!Number.isFinite(x)) throw new InputError(id, { en: "Enter a number.", ar: "أدخل رقمًا." });
  if (opts.min !== undefined && x < opts.min) throw new InputError(id, { en: `Must be at least ${opts.min}.`, ar: `يجب ألا يقل عن ${opts.min}.` });
  if (opts.max !== undefined && x > opts.max) throw new InputError(id, { en: `Must be at most ${opts.max}.`, ar: `يجب ألا يزيد على ${opts.max}.` });
  return x;
}
export const s = (v: Values, id: string) => String(v[id] ?? "");
export const b = (v: Values, id: string) => v[id] === true || v[id] === "true";
export const ruleValue = (rules: Rules, id: string) => {
  const r = rules[id];
  if (!r) throw new InputError("_rules", { en: `Official rate data "${id}" is not available right now.`, ar: `بيانات "${id}" الرسمية غير متاحة حاليًا.` });
  return r.values;
};
export const round2 = (x: number) => Math.round((x + Number.EPSILON) * 100) / 100;
