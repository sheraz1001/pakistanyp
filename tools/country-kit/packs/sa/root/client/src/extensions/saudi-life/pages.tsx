/** Saudi Life pages: hub, sections, calculators, holidays, Hijri converter, city comparison, guides. */
import { useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, ExternalLink, ShieldAlert } from "lucide-react";
import NotFound from "@/pages/not-found";
import { L, bi, isAr, absUrl, formatDate, sar, type Bi } from "./lib";
import { LifeLayout, Card, CalculatorCard, CalculatorView, Prose, RelatedCalculators, Sources, useRules, hubCrumb, HUB_TITLE, Icon } from "./components";
import { CALCULATORS, CALCULATOR_BY_SLUG, CALCULATOR_GROUPS } from "./calculators";
import { SECTIONS, SECTION_BY_ID, HUB_PATH, calculatorsFor } from "./sections";
import { costOfLiving, COL_CITIES } from "./calculators/family";
import type { Values } from "./calculators/types";
import { n } from "./calculators/types";

const REVIEWED = "2026-11-03";
const GROUP_TITLES: Record<string, Bi> = {
  employment: bi("Employment & salary", "العمل والرواتب"), home: bi("Home & utilities", "المنزل والخدمات"), cars: bi("Cars & driving", "السيارات والقيادة"),
  education: bi("Education", "التعليم"), family: bi("Family & cost of living", "الأسرة وتكلفة المعيشة"),
};

// ------------------------------------------------------------------ search over tools and guides
function useLifeIndex() {
  const { data: guides = [] } = useQuery<{ slug: string; title: string; summary: string }[]>({ queryKey: ["/api/life/guides/expat"] });
  return useMemo(() => [
    ...CALCULATORS.map((c) => ({ href: `/calculators/${c.slug}`, title: L(c.title), desc: L(c.short) })),
    ...SECTIONS.map((s) => ({ href: s.path, title: L(s.title), desc: L(s.tagline) })),
    ...guides.map((g) => ({ href: `/expat-guide/${g.slug}`, title: g.title, desc: g.summary })),
    { href: "/holidays/hijri-converter", title: L(bi("Hijri ⇄ Gregorian converter", "محوّل التاريخ الهجري والميلادي")), desc: "" },
  ], [guides]);
}
const norm = (s: string) => s.toLowerCase().replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[ً-ْ]/g, "");

function LifeSearch() {
  const index = useLifeIndex();
  const [q, setQ] = useState("");
  const terms = norm(q.trim()).split(/\s+/).filter(Boolean);
  const results = terms.length ? index.filter((x) => terms.every((t) => norm(`${x.title} ${x.desc}`).includes(t))).slice(0, 8) : [];
  return (
    <div role="search" className="relative max-w-2xl">
      <label htmlFor="life-search" className="sr-only">{L(bi("Search Saudi Life", "ابحث في الحياة في السعودية"))}</label>
      <Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5B6475]" aria-hidden="true" />
      <input id="life-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} className="yp-input h-14 w-full ps-12 text-[16px]"
        placeholder={L(bi("Search calculators and guides, e.g. end of service, electricity, iqama", "ابحث في الحاسبات والأدلة، مثل نهاية الخدمة، الكهرباء، الإقامة"))} aria-controls="life-search-results" />
      {terms.length > 0 && (
        <ul id="life-search-results" className="mt-2 divide-y divide-[#EEF0F4] rounded-2xl border border-[#E7E9EE] bg-white">
          {results.length ? results.map((r) => (
            <li key={r.href}><Link href={r.href} className="block px-4 py-3 no-underline hover:bg-[#F7F8FA]"><span className="font-medium text-[#0A0A0A]">{r.title}</span>{r.desc && <span className="block text-sm text-[#5B6475]">{r.desc}</span>}</Link></li>
          )) : <li className="px-4 py-3 text-sm text-[#5B6475]">{L(bi("Nothing found. Try another word.", "لا توجد نتائج، جرّب كلمة أخرى."))}</li>}
        </ul>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ hub
export function LifeHub() {
  const title = bi("Saudi Life — calculators and guides for living in Saudi Arabia", "الحياة في السعودية — حاسبات وأدلة للعيش في المملكة");
  return (
    <LifeLayout title={HUB_TITLE} h1={title} crumbs={[{ label: HUB_TITLE }]}
      description={bi("Free calculators and guides for life in Saudi Arabia: end of service, GOSI, electricity bills, cars, schools, expat procedures, holidays and cost of living.", "حاسبات وأدلة مجانية للحياة في السعودية: نهاية الخدمة والتأمينات وفواتير الكهرباء والسيارات والمدارس وإجراءات المقيمين والإجازات وتكلفة المعيشة.")}
      lead={bi("Practical tools for citizens, residents and families: official rates with their sources, and guides that point you to the right government platform.", "أدوات عملية للمواطنين والمقيمين والأسر: نسب رسمية مع مصادرها، وأدلة ترشدك إلى المنصة الحكومية الصحيحة.")}>
      <div className="yp-wrap flex flex-col gap-10 py-8 md:py-12">
        <LifeSearch />
        <section aria-labelledby="sections-heading">
          <h2 id="sections-heading" className="mb-4 text-2xl font-semibold">{L(bi("Explore", "استكشف"))}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SECTIONS.map((s) => <Card key={s.id} href={s.path} icon={s.icon} title={s.title} desc={s.tagline} />)}
          </div>
        </section>
        <section aria-labelledby="popular-heading">
          <h2 id="popular-heading" className="mb-4 text-2xl font-semibold">{L(bi("Popular calculators", "الحاسبات الأكثر استخدامًا"))}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {["end-of-service", "electricity-bill", "gosi", "weighted-admission", "fuel-cost", "household-budget"].map((s) => <CalculatorCard key={s} c={CALCULATOR_BY_SLUG.get(s)!} />)}
          </div>
        </section>
        <TrustNote />
      </div>
    </LifeLayout>
  );
}

function TrustNote() {
  return (
    <aside className="rounded-2xl border border-[#E7E9EE] bg-white p-5 text-sm leading-relaxed text-[#3A4354]">
      <p className="font-semibold text-[#0A0A0A]">{L(bi("How we keep this information reliable", "كيف نحافظ على موثوقية المعلومات"))}</p>
      <p className="mt-1">{L(bi("Official rates come from the bodies that publish them (MHRSD, GOSI, Saudi Energy, the National Water Company, Aramco, the Ministry of Interior and others). Each calculator lists its sources, whether each figure is confirmed, and the date it was last checked. SaudiYP is not a government service and does not ask for your Absher, Qiwa or Iqama details.", "تأتي النسب الرسمية من الجهات التي تنشرها (وزارة الموارد البشرية، والتأمينات الاجتماعية، والشركة السعودية للطاقة، وشركة المياه الوطنية، وأرامكو، ووزارة الداخلية وغيرها). وتعرض كل حاسبة مصادرها ومدى تأكيد كل رقم وتاريخ آخر مراجعة. وSaudiYP ليس جهة حكومية ولا يطلب بيانات أبشر أو قوى أو الإقامة."))}</p>
    </aside>
  );
}

// ------------------------------------------------------------------ section landing pages
export function SectionPage({ id }: { id: string }) {
  const s = SECTION_BY_ID.get(id)!;
  const calcs = id === "calculators" ? [] : calculatorsFor(id);
  const { data: guides = [] } = useQuery<{ slug: string; title: string; summary: string; lastVerified?: string }[]>({ queryKey: [`/api/life/guides/${s.guides}`], enabled: !!s.guides });
  return (
    <LifeLayout title={s.title} h1={s.title} lead={s.intro.en ? s.intro : s.tagline} description={s.tagline} crumbs={[hubCrumb, { label: s.title }]}>
      <div className="yp-wrap flex flex-col gap-10 py-8 md:py-12">
        {id === "calculators" && <CalculatorsIndex />}
        {calcs.length > 0 && (
          <section aria-labelledby="calcs-heading">
            <h2 id="calcs-heading" className="mb-4 text-2xl font-semibold">{L(bi("Calculators", "الحاسبات"))}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{calcs.map((c) => <CalculatorCard key={c.slug} c={c} />)}</div>
          </section>
        )}
        {s.tools?.length ? (
          <section aria-labelledby="tools-heading">
            <h2 id="tools-heading" className="mb-4 text-2xl font-semibold">{L(bi("Tools", "الأدوات"))}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{s.tools.map((t) => <Card key={t.href} href={t.href} icon="Sparkles" title={t.title} desc={t.desc} />)}</div>
          </section>
        ) : null}
        {s.guides && (
          <section aria-labelledby="guides-heading">
            <h2 id="guides-heading" className="mb-4 text-2xl font-semibold">{L(bi("Guides", "الأدلة"))}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map((g) => <Card key={g.slug} href={`/expat-guide/${g.slug}`} icon="FileText" title={{ en: g.title, ar: g.title }} desc={{ en: g.summary, ar: g.summary }} />)}
            </div>
          </section>
        )}
        {s.directory?.length ? (
          <section aria-labelledby="dir-heading">
            <h2 id="dir-heading" className="mb-4 text-2xl font-semibold">{L(bi("Find businesses", "ابحث عن الأنشطة التجارية"))}</h2>
            <div className="flex flex-wrap gap-2">{s.directory.map((d) => <Link key={d.slug} href={`/categories/${d.slug}`} className="yp-pill border border-[#CCE5D7] bg-white px-4 py-2 text-[15px] text-[#004D26] no-underline hover:bg-[#F1F8F4]">{L(d.title)}</Link>)}</div>
          </section>
        ) : null}
        {!calcs.length && !s.tools?.length && !s.guides && id !== "calculators" && (
          <p className="rounded-2xl border border-dashed border-[#DDE1E8] bg-white p-6 text-[#4B5565]">{L(bi("More tools for this section are on the way.", "المزيد من الأدوات لهذا القسم قريبًا."))}</p>
        )}
        <TrustNote />
      </div>
    </LifeLayout>
  );
}

function CalculatorsIndex() {
  return (
    <>
      {CALCULATOR_GROUPS.map((g) => (
        <section key={g.id} aria-labelledby={`g-${g.id}`}>
          <h2 id={`g-${g.id}`} className="mb-4 text-2xl font-semibold">{L(GROUP_TITLES[g.id])}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{g.items.map((c) => <CalculatorCard key={c.slug} c={c} />)}</div>
        </section>
      ))}
    </>
  );
}

// ------------------------------------------------------------------ calculator page
export function CalculatorPage() {
  const { slug } = useParams<{ slug: string }>();
  const c = CALCULATOR_BY_SLUG.get(slug || "");
  const { data } = useRules();
  if (!c) return <NotFound />;
  const section = SECTION_BY_ID.get(c.section);
  const faqLd = c.content.faq?.length ? [{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: c.content.faq.map((f) => ({ "@type": "Question", name: L(f.q), acceptedAnswer: { "@type": "Answer", text: L(f.a) } })) }] : [];
  const pageLd = { "@context": "https://schema.org", "@type": "WebPage", name: L(c.title), description: L(c.metaDescription), url: absUrl(`/calculators/${c.slug}`), dateModified: c.reviewed, inLanguage: isAr() ? "ar" : "en" };
  return (
    <LifeLayout title={c.title} h1={c.title} lead={c.content.intro} description={c.metaDescription} updated={c.reviewed} jsonLd={[pageLd, ...faqLd]}
      crumbs={[hubCrumb, { href: "/calculators", label: bi("Calculators", "الحاسبات") }, ...(section && section.id !== "calculators" ? [{ href: section.path, label: section.title }] : []), { label: c.title }]}>
      <CalculatorView c={c} />
      <div className="yp-wrap flex flex-col gap-6 pb-12">
        <Prose id="how-heading" title={bi("How to use it", "طريقة الاستخدام")}><p>{L(c.content.howTo)}</p></Prose>
        <Prose id="formula-heading" title={bi("Formula and assumptions", "المعادلة والافتراضات")}>
          <p>{L(c.content.formula)}</p>
          {c.content.limitations && <p className="mt-3 text-[#4B5565]">{L(c.content.limitations)}</p>}
        </Prose>
        {c.content.example && <Prose id="example-heading" title={bi("Worked example", "مثال محلول")}><p>{L(c.content.example)}</p></Prose>}
        {c.content.faq?.length ? (
          <Prose id="faq-heading" title={bi("Questions", "أسئلة شائعة")}>
            <dl className="flex flex-col gap-4">{c.content.faq.map((f, i) => <div key={i}><dt className="font-semibold">{L(f.q)}</dt><dd className="mt-1 text-[#3A4354]">{L(f.a)}</dd></div>)}</dl>
          </Prose>
        ) : null}
        <Prose id="sources-heading" title={bi("Sources", "المصادر")}><Sources ruleIds={c.ruleIds} rules={data?.rules} /></Prose>
        <RelatedCalculators slugs={c.related} />
      </div>
    </LifeLayout>
  );
}

// ------------------------------------------------------------------ holidays
function DateRow({ label, date, status }: { label: Bi; date: string; status: "official" | "expected" | "fixed" }) {
  const badge = { official: bi("Announced", "معلن رسميًا"), expected: bi("Expected — awaiting official announcement", "متوقع — بانتظار الإعلان الرسمي"), fixed: bi("Fixed date", "تاريخ ثابت") }[status];
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEF0F4] py-3 last:border-0">
      <span className="font-medium">{L(label)}</span>
      <span className="flex flex-wrap items-center gap-2">
        <time dateTime={date} className="tabular-nums">{formatDate(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</time>
        <span className="text-xs text-[#5B6475]">{hijri(date)}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${status === "expected" ? "bg-[#FFF4E0] text-[#B45309]" : "bg-[#E6F2EC] text-[#004D26]"}`}>{L(badge)}</span>
      </span>
    </div>
  );
}

export function hijri(date: string | Date, lang = isAr() ? "ar-SA" : "en") {
  const d = typeof date === "string" ? new Date(`${date}T12:00:00Z`) : date;
  try { return new Intl.DateTimeFormat(`${lang}-u-ca-islamic-umalqura${lang.startsWith("ar") ? "-nu-arab" : ""}`, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(d); }
  catch { return ""; }
}

export function HolidaysPage() {
  const { data } = useRules();
  const r = data?.rules;
  const y26 = r?.holiday_dates_2026?.values, y27 = r?.holiday_dates_2027?.values, school = r?.school_calendar_2026_2027?.values, eid = r?.eid_holidays?.values;
  const s = SECTION_BY_ID.get("holidays")!;
  return (
    <LifeLayout title={bi("Saudi Public Holidays 2026–2027", "الإجازات الرسمية في السعودية ٢٠٢٦–٢٠٢٧")} h1={bi("Saudi public holidays and important dates", "الإجازات الرسمية والمواعيد المهمة في السعودية")} lead={s.intro}
      description={bi("Saudi public holidays: Founding Day, National Day, Eid al-Fitr and Eid al-Adha dates for 2026 and expected dates for 2027, Ramadan, the school calendar and payday.", "الإجازات الرسمية في السعودية: يوم التأسيس واليوم الوطني وعيد الفطر وعيد الأضحى لعام ٢٠٢٦ والمواعيد المتوقعة لعام ٢٠٢٧ ورمضان والتقويم الدراسي وموعد الرواتب.")}
      crumbs={[hubCrumb, { label: s.title }]} updated={REVIEWED}>
      <div className="yp-wrap grid gap-6 py-8 md:py-12 lg:grid-cols-2">
        <Prose id="h-2026" title={bi("2026", "٢٠٢٦")}>
          {y26 ? <>
            <DateRow label={bi("Founding Day", "يوم التأسيس")} date={y26.founding_day} status="fixed" />
            <DateRow label={bi("Ramadan begins", "بداية رمضان")} date={y26.ramadan_start} status="official" />
            <DateRow label={bi("Eid al-Fitr", "عيد الفطر")} date={y26.eid_al_fitr} status="official" />
            <DateRow label={bi("Arafat Day", "يوم عرفة")} date={y26.arafat_day} status="official" />
            <DateRow label={bi("Eid al-Adha", "عيد الأضحى")} date={y26.eid_al_adha} status="official" />
            <DateRow label={bi("National Day", "اليوم الوطني")} date={y26.national_day} status="fixed" />
          </> : <p>{L(bi("Loading…", "جارٍ التحميل…"))}</p>}
        </Prose>
        <Prose id="h-2027" title={bi("2027", "٢٠٢٧")}>
          {y27 ? <>
            <DateRow label={bi("Ramadan begins", "بداية رمضان")} date={y27.ramadan_start_estimate} status="expected" />
            <DateRow label={bi("Founding Day", "يوم التأسيس")} date={y27.founding_day} status="fixed" />
            <DateRow label={bi("Eid al-Fitr", "عيد الفطر")} date={y27.eid_al_fitr_estimate} status="expected" />
            <DateRow label={bi("Arafat Day", "يوم عرفة")} date={y27.arafat_day_estimate} status="expected" />
            <DateRow label={bi("Eid al-Adha", "عيد الأضحى")} date={y27.eid_al_adha_estimate} status="expected" />
            <DateRow label={bi("National Day", "اليوم الوطني")} date={y27.national_day} status="fixed" />
            <p className="mt-3 text-sm text-[#4B5565]">{L(bi("Expected dates follow the Umm al-Qura calendar. The start of Ramadan, Shawwal and Dhu al-Hijjah is confirmed by the Supreme Court after the crescent is sighted, and the holidays are then announced officially.", "تتبع التواريخ المتوقعة تقويم أم القرى، وتُثبت المحكمة العليا بداية رمضان وشوال وذي الحجة بعد تحري الهلال، ثم تُعلن الإجازات رسميًا."))}</p>
          </> : null}
        </Prose>
        <Prose id="h-rules" title={bi("How long are the holidays?", "كم مدة الإجازات؟")}>
          <ul className="list-disc space-y-2 ps-5">
            <li>{L(bi(`Private sector: Eid al-Fitr ${eid?.private_sector?.eid_al_fitr_days ?? 4} days from the day after 29 Ramadan; Eid al-Adha ${eid?.private_sector?.eid_al_adha_days ?? 4} days from Arafat Day. Days that fall on the weekly rest day are compensated.`, `القطاع الخاص: عيد الفطر ${eid?.private_sector?.eid_al_fitr_days ?? 4} أيام تبدأ من اليوم التالي لـ٢٩ رمضان، وعيد الأضحى ${eid?.private_sector?.eid_al_adha_days ?? 4} أيام تبدأ من يوم عرفة، ويُعوَّض ما يوافق يوم الراحة الأسبوعية.`))}</li>
            <li>{L(bi(`Government sector: between ${eid?.government_sector?.eid_working_days_min ?? 4} and ${eid?.government_sector?.eid_working_days_max ?? 5} working days for each Eid, as announced each year.`, `القطاع الحكومي: من ${eid?.government_sector?.eid_working_days_min ?? 4} إلى ${eid?.government_sector?.eid_working_days_max ?? 5} أيام عمل لكل عيد بحسب الإعلان السنوي.`))}</li>
            <li>{L(bi("Founding Day (22 February) and National Day (23 September) are one day each.", "يوم التأسيس (٢٢ فبراير) واليوم الوطني (٢٣ سبتمبر) يوم واحد لكل منهما."))}</li>
            <li>{L(bi("Government salaries are paid on the 27th of each Gregorian month.", "تُصرف رواتب القطاع الحكومي في اليوم ٢٧ من كل شهر ميلادي."))}</li>
          </ul>
        </Prose>
        {school && (
          <Prose id="h-school" title={bi("School year 2026–2027", "العام الدراسي ٢٠٢٦–٢٠٢٧")}>
            <DateRow label={bi("Students return", "عودة الطلاب")} date={school.students_start} status="official" />
            <DateRow label={bi("Summer holiday begins", "بداية إجازة نهاية العام")} date={school.year_end_holiday_start} status="official" />
            <p className="mt-3 text-sm text-[#4B5565]">{L(bi("Two semesters. Mid-year and Eid breaks are listed in the Ministry of Education's calendar; dates reported in the press differ by a day in places, so check the official calendar.", "عامان دراسيان بفصلين. وإجازات منتصف العام والأعياد في تقويم وزارة التعليم، وتختلف بعض التواريخ المنشورة في الصحف بيوم واحد، فراجع التقويم الرسمي."))}</p>
          </Prose>
        )}
        <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
          <Card href="/holidays/hijri-converter" icon="CalendarDays" title={bi("Hijri ⇄ Gregorian converter", "محوّل التاريخ الهجري والميلادي")} desc={bi("Convert dates with the Umm al-Qura calendar.", "حوّل التواريخ وفق تقويم أم القرى.")} />
          <Card href="/calculators/school-age" icon="GraduationCap" title={bi("School admission age", "عمر القبول المدرسي")} desc={bi("Check Grade 1 eligibility for the coming year.", "تحقق من أهلية الصف الأول للعام القادم.")} />
        </div>
        <div className="lg:col-span-2"><Prose id="h-sources" title={bi("Sources", "المصادر")}><Sources ruleIds={["national_holidays", "eid_holidays", "holiday_dates_2026", "holiday_dates_2027", "school_calendar_2026_2027", "government_payday"]} rules={r} /></Prose></div>
      </div>
    </LifeLayout>
  );
}

// ------------------------------------------------------------------ Hijri converter
const HIJRI_MONTHS = { en: ["Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani", "Jumada al-Ula", "Jumada al-Akhirah", "Rajab", "Shaban", "Ramadan", "Shawwal", "Dhu al-Qadah", "Dhu al-Hijjah"],
  ar: ["محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"] };

/** Umm al-Qura parts of a Gregorian date (via Intl). */
export function toHijri(d: Date): { y: number; m: number; d: number } | null {
  try {
    const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", { year: "numeric", month: "numeric", day: "numeric", timeZone: "UTC" }).formatToParts(d);
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    return { y: get("year"), m: get("month"), d: get("day") };
  } catch { return null; }
}
/** Gregorian date of an Umm al-Qura date (searches around the arithmetic estimate). */
export function fromHijri(y: number, m: number, d: number): Date | null {
  const est = Date.UTC(622, 6, 16) + ((y - 1) * 354.36708 + (m - 1) * 29.530588 + (d - 1)) * 86400000;
  for (let off = -5; off <= 5; off++) {
    const g = new Date(est + off * 86400000);
    const h = toHijri(g);
    if (h && h.y === y && h.m === m && h.d === d) return g;
  }
  return null;
}

export function HijriConverter() {
  const today = new Date();
  const [g, setG] = useState(today.toISOString().slice(0, 10));
  const t = toHijri(today);
  const [hy, setHy] = useState(t?.y || 1448), [hm, setHm] = useState(t?.m || 1), [hd, setHd] = useState(t?.d || 1);
  const gDate = new Date(`${g}T12:00:00Z`);
  const h = Number.isNaN(gDate.getTime()) ? null : toHijri(gDate);
  const back = fromHijri(hy, hm, hd);
  const months = isAr() ? HIJRI_MONTHS.ar : HIJRI_MONTHS.en;
  return (
    <LifeLayout title={bi("Hijri to Gregorian Date Converter (Umm al-Qura)", "تحويل التاريخ من هجري إلى ميلادي (أم القرى)")} h1={bi("Hijri ⇄ Gregorian date converter", "محوّل التاريخ الهجري والميلادي")}
      lead={bi("Convert dates using the Umm al-Qura calendar, the official civil calendar of Saudi Arabia.", "حوّل التواريخ وفق تقويم أم القرى، التقويم المدني الرسمي في المملكة العربية السعودية.")}
      description={bi("Convert between Hijri (Umm al-Qura) and Gregorian dates instantly, with today's Hijri date and notes on lunar month announcements.", "حوّل بين التاريخ الهجري (أم القرى) والميلادي فورًا، مع تاريخ اليوم الهجري وملاحظات حول إعلان بدايات الأشهر.")}
      crumbs={[hubCrumb, { href: "/holidays", label: bi("Public Holidays & Calendars", "العطلات والتقويم") }, { label: bi("Hijri converter", "محوّل التاريخ") }]} updated={REVIEWED}>
      <div className="yp-wrap grid gap-6 py-8 md:grid-cols-2 md:py-12">
        <section className="rounded-2xl border border-[#E7E9EE] bg-white p-6" aria-labelledby="g2h">
          <h2 id="g2h" className="text-xl font-semibold">{L(bi("Gregorian → Hijri", "ميلادي ← هجري"))}</h2>
          <label htmlFor="gdate" className="mt-4 block text-[15px] font-medium">{L(bi("Gregorian date", "التاريخ الميلادي"))}</label>
          <input id="gdate" type="date" dir="ltr" className="yp-input mt-1.5 w-full" value={g} onChange={(e) => setG(e.target.value)} />
          <p className="mt-5 text-[28px] font-bold text-[#004D26]" aria-live="polite">{h ? `${isAr() ? hijri(gDate, "ar-SA") : `${h.d} ${months[h.m - 1]} ${h.y} AH`}` : "—"}</p>
        </section>
        <section className="rounded-2xl border border-[#E7E9EE] bg-white p-6" aria-labelledby="h2g">
          <h2 id="h2g" className="text-xl font-semibold">{L(bi("Hijri → Gregorian", "هجري ← ميلادي"))}</h2>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <label className="text-[15px] font-medium">{L(bi("Day", "اليوم"))}<input type="number" min={1} max={30} dir="ltr" className="yp-input mt-1.5 w-full" value={hd} onChange={(e) => setHd(Number(e.target.value))} /></label>
            <label className="text-[15px] font-medium">{L(bi("Month", "الشهر"))}<select className="yp-input mt-1.5 w-full" value={hm} onChange={(e) => setHm(Number(e.target.value))}>{months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}</select></label>
            <label className="text-[15px] font-medium">{L(bi("Year (AH)", "السنة (هـ)"))}<input type="number" min={1356} max={1500} dir="ltr" className="yp-input mt-1.5 w-full" value={hy} onChange={(e) => setHy(Number(e.target.value))} /></label>
          </div>
          <p className="mt-5 text-[28px] font-bold text-[#004D26]" aria-live="polite">{back ? formatDate(back, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : L(bi("This date does not exist in the Umm al-Qura calendar.", "هذا التاريخ غير موجود في تقويم أم القرى."))}</p>
        </section>
        <div className="md:col-span-2"><Prose id="conv-notes" title={bi("About the Umm al-Qura calendar", "عن تقويم أم القرى")}>
          <p>{L(bi("Umm al-Qura is calculated in advance and used for official civil dates. Religious months such as Ramadan, Shawwal and Dhu al-Hijjah begin when the Supreme Court confirms the crescent sighting, so the start of these months can differ by a day from the calculated calendar.", "يُحسب تقويم أم القرى مسبقًا ويُستخدم للتواريخ المدنية الرسمية، أما الأشهر ذات الصلة بالعبادات كرمضان وشوال وذي الحجة فتبدأ بعد إثبات المحكمة العليا لرؤية الهلال، لذا قد تختلف بدايتها يومًا عن التقويم المحسوب."))}</p>
          <p className="mt-3 text-sm text-[#4B5565]">{L(bi("Conversion uses the Umm al-Qura data built into your browser (Unicode CLDR).", "يعتمد التحويل على بيانات أم القرى المضمّنة في متصفحك (Unicode CLDR)."))}</p>
        </Prose></div>
      </div>
    </LifeLayout>
  );
}

// ------------------------------------------------------------------ city comparison
export function CityCompare() {
  const fields = costOfLiving.inputs.filter((i) => !["city", "income"].includes(i.id));
  const blank = () => Object.fromEntries(costOfLiving.inputs.map((i) => [i.id, i.default])) as Values;
  const [a, setA] = useState<Values>({ ...blank(), city: "riyadh" });
  const [b, setB] = useState<Values>({ ...blank(), city: "jeddah" });
  const total = (v: Values) => n(v, "rentYear") / 12 + n(v, "schoolYear") / 12 + ["transport", "utilities", "groceries", "health", "other", "savings"].reduce((t, k) => t + (Number(v[k]) || 0), 0);
  const col = (v: Values, set: (x: Values) => void, label: string) => (
    <section className="flex flex-col gap-3 rounded-2xl border border-[#E7E9EE] bg-white p-5" aria-label={label}>
      <label className="text-[15px] font-medium">{L(bi("City", "المدينة"))}
        <select className="yp-input mt-1.5 w-full" value={String(v.city)} onChange={(e) => set({ ...v, city: e.target.value })}>{COL_CITIES.map((c) => <option key={c.value} value={c.value}>{L(c.label)}</option>)}</select>
      </label>
      {fields.filter((f) => f.type === "number").map((f) => (
        <label key={f.id} className="text-sm font-medium">{L(f.label)}
          <input type="number" min={0} dir="ltr" className="yp-input mt-1 w-full" value={v[f.id] as number} onChange={(e) => set({ ...v, [f.id]: e.target.value === "" ? 0 : Number(e.target.value) })} />
        </label>
      ))}
      <p className="mt-2 rounded-xl bg-[#F1F8F4] p-3 text-lg font-semibold text-[#004D26]">{L(bi("Monthly", "شهريًا"))}: {sar(total(v), 0)}</p>
    </section>
  );
  const nameA = COL_CITIES.find((c) => c.value === a.city)?.label, nameB = COL_CITIES.find((c) => c.value === b.city)?.label;
  const diff = total(b) - total(a);
  return (
    <LifeLayout title={bi("Compare the Cost of Living in Two Saudi Cities", "قارن تكلفة المعيشة بين مدينتين سعوديتين")} h1={bi("Compare two Saudi cities", "قارن بين مدينتين سعوديتين")}
      lead={bi("Put the quotes you have collected for two cities side by side. SaudiYP does not pre-fill city averages without verified data.", "ضع عروض الأسعار التي جمعتها لمدينتين جنبًا إلى جنب، ولا يملأ SaudiYP متوسطات للمدن دون بيانات موثقة.")}
      description={bi("Compare monthly family budgets for two Saudi cities, such as Riyadh and Jeddah, using your own rent, school, transport and grocery figures.", "قارن الميزانية الشهرية للأسرة في مدينتين سعوديتين مثل الرياض وجدة باستخدام أرقامك للإيجار والمدارس والمواصلات والبقالة.")}
      crumbs={[hubCrumb, { href: "/cost-of-living", label: bi("Cost of Living", "تكلفة المعيشة") }, { label: bi("Compare cities", "مقارنة المدن") }]} updated={REVIEWED}>
      <div className="yp-wrap flex flex-col gap-6 py-8 md:py-12">
        <div className="grid gap-6 md:grid-cols-2">{col(a, setA, "A")}{col(b, setB, "B")}</div>
        <p className="rounded-2xl border border-[#CCE5D7] bg-[#F1F8F4] p-5 text-lg" aria-live="polite">
          {total(a) + total(b) === 0 ? L(bi("Enter figures in both columns to compare.", "أدخل الأرقام في العمودين للمقارنة."))
            : diff === 0 ? L(bi("Both budgets are the same.", "الميزانيتان متساويتان."))
            : L(bi(`${(diff > 0 ? nameB : nameA)?.en} costs ${sar(Math.abs(diff), 0)} more a month (${sar(Math.abs(diff) * 12, 0)} a year).`, `${(diff > 0 ? nameB : nameA)?.ar} أعلى بمقدار ${sar(Math.abs(diff), 0)} شهريًا (${sar(Math.abs(diff) * 12, 0)} سنويًا).`))}
        </p>
        <RelatedCalculators slugs={["cost-of-living", "rent-affordability", "relocation-cost"]} />
      </div>
    </LifeLayout>
  );
}

// ------------------------------------------------------------------ guides
export function GuidePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: g, isLoading, isError } = useQuery<any>({ queryKey: [`/api/life/guides/expat/${slug}`], retry: false });
  if (isError) return <NotFound />;
  const s = SECTION_BY_ID.get("expat-guide")!;
  const title = g ? { en: g.meta.title, ar: g.meta.title } : bi("Guide", "دليل");
  const articleLd = g ? [{ "@context": "https://schema.org", "@type": "Article", headline: g.meta.title, description: g.meta.summary, dateModified: g.meta.lastVerified, inLanguage: g.lang,
    publisher: { "@type": "Organization", name: "SaudiYP", url: absUrl("/") }, mainEntityOfPage: absUrl(`/expat-guide/${slug}`) }] : [];
  return (
    <LifeLayout title={g ? { en: g.meta.metaTitle?.replace(/ \| SaudiYP$/, "") || g.meta.title, ar: g.meta.metaTitle?.replace(/ \| SaudiYP$/, "") || g.meta.title } : title}
      description={g ? { en: g.meta.metaDescription, ar: g.meta.metaDescription } : s.tagline} h1={title} lead={g ? { en: g.meta.summary, ar: g.meta.summary } : undefined}
      crumbs={[hubCrumb, { href: s.path, label: s.title }, { label: title }]} updated={g?.meta.lastVerified} jsonLd={articleLd}>
      <div className="yp-wrap grid gap-8 py-8 md:py-12 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="life-prose rounded-2xl border border-[#E7E9EE] bg-white p-5 md:p-8">
          {isLoading ? <p>{L(bi("Loading…", "جارٍ التحميل…"))}</p> : g && <div dangerouslySetInnerHTML={{ __html: g.html }} />}
        </article>
        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-[#F2D9A8] bg-[#FFF8EB] p-5 text-sm leading-relaxed text-[#5C3B00]">
            <ShieldAlert className="mb-2 h-5 w-5" aria-hidden="true" />
            {L(bi("SaudiYP is not a government service. Complete official procedures only on the official platforms, and never share your Absher, Nafath or Iqama details with anyone else.", "SaudiYP ليس جهة حكومية. أنجز الإجراءات الرسمية عبر المنصات الرسمية فقط، ولا تشارك بيانات أبشر أو نفاذ أو الإقامة مع أي جهة أخرى."))}
          </div>
          {g?.links?.length ? (
            <div className="rounded-2xl border border-[#E7E9EE] bg-white p-5">
              <h2 className="text-base font-semibold">{L(bi("Official platforms", "المنصات الرسمية"))}</h2>
              <ul className="mt-3 flex flex-col gap-2">{g.links.map((l: any) => <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[#006C35] hover:underline">{l.name}<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a></li>)}</ul>
            </div>
          ) : null}
          <Link href={s.path} className="text-sm font-semibold text-[#006C35]">{L(bi("All expat guides", "جميع أدلة المقيمين"))}</Link>
        </aside>
      </div>
    </LifeLayout>
  );
}

export function sectionComponent(id: string) {
  return function SectionRoute() { return <SectionPage id={id} />; };
}
