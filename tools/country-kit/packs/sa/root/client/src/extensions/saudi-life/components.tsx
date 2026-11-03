/** Saudi Life UI: page layout with breadcrumbs, calculator view, cards and source lists. */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import * as Icons from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import SEO from "@/components/seo";
import { country } from "@shared/country";
import { L, bi, isAr, absUrl, formatDate, type Bi } from "./lib";
import type { Calculator, Input, Rules, Values, Result } from "./calculators/types";
import { InputError } from "./calculators/types";
import { CALCULATOR_BY_SLUG } from "./calculators";
import { HUB_PATH } from "./sections";

export const HUB_TITLE = bi("Saudi Life", "الحياة في السعودية");

export function useRules() {
  return useQuery<{ rules: Rules; updatedAt?: string }>({ queryKey: ["/api/life/rules"], staleTime: 5 * 60 * 1000 });
}

export function Icon({ name, className }: { name: string; className?: string }) {
  const C = (Icons as any)[name] || Icons.Circle;
  return <C className={className} aria-hidden="true" />;
}

export interface Crumb { href?: string; label: Bi }

export function LifeLayout({ title, description, crumbs, children, h1, lead, jsonLd = [], updated }: {
  title: Bi; description: Bi; crumbs: Crumb[]; children: ReactNode; h1: Bi; lead?: Bi; jsonLd?: any[]; updated?: string;
}) {
  const all: Crumb[] = [{ href: "/", label: bi("Home", "الرئيسية") }, ...crumbs];
  const breadcrumbLd = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: all.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: L(c.label), ...(c.href ? { item: absUrl(c.href) } : {}) })),
  };
  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#0A0A0A]">
      <SEO title={`${L(title)} | ${country.brand}`} description={L(description)} structuredData={[breadcrumbLd, ...jsonLd]} />
      <Header />
      <main id="main-content" className="life-page">
        <section className="border-b border-[#E7E9EE] bg-white">
          <div className="yp-wrap py-8 md:py-12">
            <nav aria-label={L(bi("Breadcrumb", "مسار التنقل"))} className="mb-5 text-sm">
              <ol className="flex flex-wrap items-center gap-1.5 text-[#5B6475]">
                {all.map((c, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    {i > 0 && <Icons.ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
                    {c.href && i < all.length - 1 ? <Link href={c.href} className="font-medium text-[#006C35] hover:underline">{L(c.label)}</Link> : <span aria-current="page">{L(c.label)}</span>}
                  </li>
                ))}
              </ol>
            </nav>
            <h1 className="text-[32px] font-bold leading-tight tracking-[-0.02em] md:text-[44px]">{L(h1)}</h1>
            {lead && <p className="mt-3 max-w-3xl text-[17px] leading-relaxed text-[#3A4354]">{L(lead)}</p>}
            {updated && <p className="mt-3 text-sm text-[#5B6475]">{L(bi("Last reviewed", "آخر مراجعة"))}: <time dateTime={updated}>{formatDate(updated)}</time></p>}
          </div>
        </section>
        {children}
      </main>
      <Footer />
    </div>
  );
}

export function Card({ href, icon, title, desc, badge }: { href: string; icon?: string; title: Bi; desc?: Bi; badge?: Bi }) {
  return (
    <Link href={href} className="group flex h-full flex-col gap-2 rounded-2xl border border-[#E7E9EE] bg-white p-5 no-underline transition hover:border-[#CCE5D7] hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#006C35]">
      <div className="flex items-center gap-3">
        {icon && <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#E6F2EC] text-[#006C35]"><Icon name={icon} className="h-5 w-5" /></span>}
        <span className="text-[17px] font-semibold text-[#0A0A0A] group-hover:text-[#006C35]">{L(title)}</span>
      </div>
      {desc && <span className="text-sm leading-relaxed text-[#4B5565]">{L(desc)}</span>}
      {badge && <span className="mt-auto w-fit rounded-full bg-[#FFF4E0] px-2.5 py-0.5 text-xs font-semibold text-[#B45309]">{L(badge)}</span>}
    </Link>
  );
}

const kindBadge = (c: Calculator) => (c.kind === "official" ? bi("Official rules", "أنظمة رسمية") : bi("Estimate", "تقديري"));
export function CalculatorCard({ c }: { c: Calculator }) {
  return <Card href={`/calculators/${c.slug}`} icon="Calculator" title={c.title} desc={c.short} badge={kindBadge(c)} />;
}

const confidenceLabel = {
  confirmed: bi("Confirmed from the official source", "مؤكد من المصدر الرسمي"),
  secondary: bi("Confirmed from published reports of the official source", "مؤكد من تقارير منشورة عن المصدر الرسمي"),
  unconfirmed: bi("Not officially confirmed", "غير مؤكد رسميًا"),
} as const;

export function Sources({ ruleIds, rules }: { ruleIds: string[]; rules?: Rules }) {
  if (!ruleIds.length) return (
    <p className="text-sm text-[#4B5565]">{L(bi("This calculator uses only the figures you enter and standard arithmetic; no official rates are involved.", "تعتمد هذه الحاسبة على الأرقام التي تدخلها والعمليات الحسابية فقط، دون نسب رسمية."))}</p>
  );
  if (!rules) return <p className="text-sm text-[#5B6475]">{L(bi("Loading sources…", "جارٍ تحميل المصادر…"))}</p>;
  return (
    <ul className="flex flex-col gap-4">
      {ruleIds.map((id) => {
        const r = rules[id];
        if (!r) return null;
        return (
          <li key={id} className="rounded-xl border border-[#E7E9EE] bg-[#F7F8FA] p-4">
            <p className="text-sm leading-relaxed text-[#283141]">{isAr() ? r.summary_ar || r.summary_en : r.summary_en}</p>
            <p className="mt-2 text-xs text-[#5B6475]">
              {L(confidenceLabel[r.confidence || "secondary"])}
              {r.verifiedOn && <> · {L(bi("checked", "تمت المراجعة"))} <time dateTime={r.verifiedOn}>{formatDate(r.verifiedOn)}</time></>}
              {r.effectiveFrom && <> · {L(bi("in force from", "سارٍ منذ"))} {formatDate(r.effectiveFrom)}</>}
            </p>
            {r.sources?.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1">
                {r.sources.slice(0, 4).map((src, i) => (
                  <li key={i} className="text-sm"><a href={src.url} target="_blank" rel="noopener noreferrer nofollow" className="text-[#006C35] underline-offset-2 hover:underline">{src.title}</a>{src.publisher && <span className="text-[#5B6475]"> — {src.publisher}</span>}</li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// ------------------------------------------------------------------ calculator view
function initialValues(c: Calculator, rules: Rules | undefined, search: string): Values {
  const q = new URLSearchParams(search);
  const v: Values = {};
  for (const i of c.inputs) {
    const fromUrl = q.get(i.id);
    const def = typeof i.default === "function" ? (i.default as any)(rules || {}) : i.default;
    if (fromUrl === null) v[i.id] = def;
    else v[i.id] = i.type === "number" ? Number(fromUrl) : i.type === "toggle" ? fromUrl === "1" || fromUrl === "true" : fromUrl;
  }
  return v;
}

function Field({ input, value, onChange, error }: { input: Input; value: any; onChange: (v: any) => void; error?: Bi }) {
  const id = `f-${input.id}`;
  const help = input.help ? `${id}-help` : undefined;
  const err = error ? `${id}-err` : undefined;
  const describedBy = [help, err].filter(Boolean).join(" ") || undefined;
  const base = "yp-input w-full text-[16px]";
  let control: ReactNode;
  if (input.type === "select") {
    control = (
      <select id={id} className={base} value={value} onChange={(e) => onChange(e.target.value)} aria-describedby={describedBy}>
        {input.options.map((o) => <option key={o.value} value={o.value}>{L(o.label)}</option>)}
      </select>
    );
  } else if (input.type === "toggle") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-[#E7E9EE] bg-white p-3">
        <input id={id} type="checkbox" className="mt-1 h-5 w-5 accent-[#006C35]" checked={!!value} onChange={(e) => onChange(e.target.checked)} aria-describedby={describedBy} />
        <label htmlFor={id} className="text-[15px] font-medium text-[#283141]">{L(input.label)}{input.help && <span id={help} className="mt-1 block text-sm font-normal text-[#5B6475]">{L(input.help)}</span>}</label>
      </div>
    );
  } else if (input.type === "text") {
    control = input.multiline
      ? <textarea id={id} className={`${base} min-h-[120px] font-mono`} dir="ltr" value={value} onChange={(e) => onChange(e.target.value)} aria-describedby={describedBy} aria-invalid={!!error} />
      : <input id={id} type="text" className={base} value={value} onChange={(e) => onChange(e.target.value)} aria-describedby={describedBy} aria-invalid={!!error} />;
  } else {
    control = (
      <div className="relative">
        <input id={id} type={input.type === "date" ? "date" : "number"} inputMode={input.type === "number" ? "decimal" : undefined} dir="ltr"
          className={`${base} ${input.type === "number" && input.unit ? "pr-24" : ""}`} value={value ?? ""} aria-invalid={!!error} aria-describedby={describedBy}
          min={input.type === "number" ? input.min : undefined} max={input.type === "number" ? input.max : undefined} step={input.type === "number" ? input.step ?? "any" : undefined}
          onChange={(e) => onChange(input.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)} />
        {/* numbers are typed left-to-right in both languages, so the unit sits on the physical right */}
        {input.type === "number" && input.unit && <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-[#5B6475]">{L(input.unit)}</span>}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[15px] font-medium text-[#283141]">{L(input.label)}</label>
      {control}
      {input.help && <p id={help} className="text-sm text-[#5B6475]">{L(input.help)}</p>}
      {error && <p id={err} role="alert" className="text-sm font-medium text-[#B91C1C]">{L(error)}</p>}
    </div>
  );
}

const show = (x: string | Bi) => (typeof x === "string" ? x : L(x));

export function CalculatorView({ c }: { c: Calculator }) {
  const { data, isLoading, isError } = useRules();
  const search = useSearch();
  const rules = data?.rules;
  const [values, setValues] = useState<Values>(() => initialValues(c, rules, search));
  const [copied, setCopied] = useState(false);
  const loadedDefaults = useRef(!!rules);
  useEffect(() => { if (rules && !loadedDefaults.current) { loadedDefaults.current = true; setValues(initialValues(c, rules, search)); } }, [rules]); // eslint-disable-line

  const outcome = useMemo((): { result?: Result; error?: InputError | Error } => {
    if (!rules) return {};
    try { return { result: c.compute(values, rules) }; } catch (e: any) { return { error: e }; }
  }, [values, rules, c]);
  const fieldError = outcome.error instanceof InputError ? outcome.error : undefined;
  const visible = c.inputs.filter((i) => !i.showIf || i.showIf(values));

  const shareUrl = () => {
    const q = new URLSearchParams();
    for (const i of visible) q.set(i.id, i.type === "toggle" ? (values[i.id] ? "1" : "0") : String(values[i.id]));
    return `${absUrl(`/calculators/${c.slug}`)}?${q.toString()}`;
  };
  const share = async () => {
    const url = shareUrl();
    try {
      if (navigator.share) await navigator.share({ title: L(c.title), url });
      else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2500); }
    } catch { /* cancelled */ }
  };

  return (
    <div className="yp-wrap grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:py-12">
      <form className="life-calc-form flex flex-col gap-5 rounded-2xl border border-[#E7E9EE] bg-white p-5 md:p-7" onSubmit={(e) => e.preventDefault()} aria-labelledby="calc-inputs-heading" noValidate>
        <h2 id="calc-inputs-heading" className="text-xl font-semibold">{L(bi("Your details", "بياناتك"))}</h2>
        {visible.map((i) => (
          <Field key={i.id} input={i} value={values[i.id]} error={fieldError?.field === i.id ? fieldError.text : undefined}
            onChange={(x) => setValues((v) => ({ ...v, [i.id]: x }))} />
        ))}
        <div className="flex flex-wrap gap-2 print:hidden">
          <button type="button" className="yp-btn yp-btn-ghost" onClick={() => setValues(initialValues(c, rules, ""))}><Icons.RotateCcw className="h-4 w-4" aria-hidden="true" />{L(bi("Reset", "إعادة تعيين"))}</button>
        </div>
      </form>

      <section aria-labelledby="calc-result-heading" className="flex flex-col gap-5">
        <div className="rounded-2xl border border-[#CCE5D7] bg-[#F1F8F4] p-5 md:p-7" aria-live="polite">
          <h2 id="calc-result-heading" className="text-sm font-semibold uppercase text-[#004D26]">{L(bi("Result", "النتيجة"))}</h2>
          {isLoading && !rules && <p className="mt-3 text-[#3A4354]">{L(bi("Loading official rates…", "جارٍ تحميل النسب الرسمية…"))}</p>}
          {isError && <p className="mt-3 text-[#B91C1C]">{L(bi("Official rates could not be loaded. Please try again later.", "تعذر تحميل النسب الرسمية، حاول لاحقًا."))}</p>}
          {outcome.error && !fieldError && <p className="mt-3 font-medium text-[#B91C1C]">{outcome.error instanceof InputError ? L(outcome.error.text) : L(bi("Check the values you entered.", "تحقق من القيم المدخلة."))}</p>}
          {fieldError && <p className="mt-3 font-medium text-[#B91C1C]">{L(fieldError.text)}</p>}
          {outcome.result && (
            <>
              <p className="mt-3 text-[15px] text-[#3A4354]">{L(outcome.result.headline.label)}</p>
              <p className="mt-1 text-[34px] font-bold leading-tight text-[#004D26] md:text-[40px]" dir="auto">{show(outcome.result.headline.value)}</p>
              <dl className="mt-5 divide-y divide-[#CCE5D7] border-t border-[#CCE5D7]">
                {outcome.result.rows.map((r, i) => (
                  <div key={i} className="flex items-start justify-between gap-4 py-2.5">
                    <dt className={`text-[15px] ${r.strong ? "font-semibold text-[#0A0A0A]" : "text-[#3A4354]"}`}>{L(r.label)}{r.note && <span className="block text-xs text-[#5B6475]">{L(r.note)}</span>}</dt>
                    <dd className={`text-end text-[15px] tabular-nums ${r.strong ? "font-semibold text-[#0A0A0A]" : "text-[#283141]"}`} dir="auto">{show(r.value)}</dd>
                  </div>
                ))}
              </dl>
              {outcome.result.steps?.length ? (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-[#004D26]">{L(bi("How we worked it out", "طريقة الحساب"))}</h3>
                  <ol className="mt-2 list-decimal space-y-1 ps-5 text-sm text-[#283141]">{outcome.result.steps.map((st, i) => <li key={i}>{L(st)}</li>)}</ol>
                </div>
              ) : null}
              {outcome.result.warnings?.map((w, i) => <p key={i} className="mt-4 rounded-lg bg-white/70 p-3 text-sm text-[#4B5565]"><Icons.Info className="me-1.5 inline h-4 w-4 align-[-2px] text-[#B45309]" aria-hidden="true" />{L(w)}</p>)}
            </>
          )}
          <div className="mt-5 flex flex-wrap gap-2 print:hidden">
            <button type="button" className="yp-btn yp-btn-ghost bg-white" onClick={() => window.print()}><Icons.Printer className="h-4 w-4" aria-hidden="true" />{L(bi("Print", "طباعة"))}</button>
            <button type="button" className="yp-btn yp-btn-ghost bg-white" onClick={share}><Icons.Share2 className="h-4 w-4" aria-hidden="true" />{copied ? L(bi("Link copied", "تم نسخ الرابط")) : L(bi("Share", "مشاركة"))}</button>
          </div>
        </div>
        <p className="text-sm text-[#5B6475]">
          {c.kind === "official"
            ? L(bi("Uses the official rules shown under Sources. Results are a guide and do not replace a decision by the employer, the authority or a court.", "تعتمد على الأنظمة الرسمية المبينة في المصادر، والنتائج للاسترشاد ولا تغني عن قرار صاحب العمل أو الجهة المختصة أو المحكمة."))
            : L(bi("An illustrative estimate built from the figures and assumptions you enter.", "تقدير توضيحي مبني على الأرقام والافتراضات التي تدخلها."))}
        </p>
      </section>
    </div>
  );
}

export function Prose({ title, children, id }: { title: Bi; children: ReactNode; id: string }) {
  return (
    <section aria-labelledby={id} className="rounded-2xl border border-[#E7E9EE] bg-white p-5 md:p-7">
      <h2 id={id} className="text-xl font-semibold">{L(title)}</h2>
      <div className="mt-3 text-[16px] leading-[1.8] text-[#283141]">{children}</div>
    </section>
  );
}

export function RelatedCalculators({ slugs }: { slugs?: string[] }) {
  const list = (slugs || []).map((s) => CALCULATOR_BY_SLUG.get(s)).filter(Boolean) as Calculator[];
  if (!list.length) return null;
  return (
    <section aria-labelledby="related-heading">
      <h2 id="related-heading" className="mb-4 text-xl font-semibold">{L(bi("Related calculators", "حاسبات ذات صلة"))}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map((c) => <CalculatorCard key={c.slug} c={c} />)}</div>
    </section>
  );
}

export const hubCrumb: Crumb = { href: HUB_PATH, label: HUB_TITLE };
