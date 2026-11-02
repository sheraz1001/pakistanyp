import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "@/lib/helmet-compat";
import { ChevronDown, Briefcase, Users, Tag, HelpCircle, ExternalLink, Linkedin } from "lucide-react";
import { api } from "./api";
import { country } from "@shared/country";
import { tj } from "@/i18n-jsx/tj";

const price = (n?: number | null) => (n ? `${country.currency} ${Number(n).toLocaleString()}` : "");

/** Services & prices, portfolio, team and FAQ sections for the public profile page. */
export function ProfileExtras({ businessId, businessName }: { businessId: number; businessName: string }) {
  const { data } = useQuery({ queryKey: [`/api/businesses/${businessId}/extras`], queryFn: () => api(`/api/businesses/${businessId}/extras`) });
  const [open, setOpen] = useState<number | null>(0);
  if (!data) return null;
  const { servicePrices = [], portfolio = [], team = [], faqs = [] } = data;
  if (!servicePrices.length && !portfolio.length && !team.length && !faqs.length) return null;
  const faqLd = faqs.length ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f: any) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })) } : null;
  return (
    <>
      {faqLd && <Helmet><script type="application/ld+json">{JSON.stringify(faqLd)}</script></Helmet>}
      {servicePrices.length > 0 && (
        <section id="prices" aria-label="Services and prices">
          <div className="yp-card p-6 md:p-7"><h2 className="mb-4 flex items-center gap-3 text-[22px] font-semibold tracking-[-0.02em] text-[#0A0A0A]"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[#E8F4EC] text-[#0B6B2E]"><Tag className="h-5 w-5" aria-hidden="true" /></span> Services &amp; prices</h2>
            <div>
              <table className="w-full text-sm">
                <tbody>{servicePrices.map((s: any, i: number) => (
                  <tr key={i} className="border-t border-[#EEF0F4] first:border-0"><td className="py-3 pe-3"><div className="font-medium">{s.name}</div>{s.description && <div className="text-[#5B6475] text-xs mt-0.5">{s.description}</div>}</td>
                    <td className="py-3 text-end whitespace-nowrap font-semibold text-[#05501F]">{s.priceFrom ? `${s.priceTo ? `${price(s.priceFrom)} – ${price(s.priceTo)}` : `from ${price(s.priceFrom)}`}${s.unit ? ` / ${s.unit}` : ""}` : "On request"}</td></tr>
                ))}</tbody>
              </table>
              <p className="text-xs text-[#5B6475] mt-3">Indicative prices provided by the business; confirm with a quote.</p>
            </div></div>
        </section>
      )}
      {portfolio.length > 0 && (
        <section id="portfolio" aria-label="Portfolio and case studies">
          <div className="yp-card p-6 md:p-7"><h2 className="mb-4 flex items-center gap-3 text-[22px] font-semibold tracking-[-0.02em] text-[#0A0A0A]"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[#E8F4EC] text-[#0B6B2E]"><Briefcase className="h-5 w-5" aria-hidden="true" /></span> Portfolio &amp; case studies</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {portfolio.map((p: any, i: number) => (
                <article key={i} className="rounded-[14px] border border-[#E7E9EE] overflow-hidden bg-white">
                  {p.image && <img src={p.image} alt={p.title} loading="lazy" className="w-full h-40 object-cover" />}
                  <div className="p-4"><h3 className="font-semibold text-[#0A0A0A]">{p.title}</h3><div className="text-xs text-[#5B6475]">{[p.client, p.year].filter(Boolean).join(" · ")}</div>{p.description && <p className="text-sm text-[#3A4354] mt-2 whitespace-pre-line">{p.description}</p>}{p.link && <a href={p.link} target="_blank" rel="noopener nofollow" className="inline-flex items-center gap-1 text-sm font-medium text-[#0B6B2E] hover:text-[#05501F] mt-2">View project <ExternalLink className="h-3.5 w-3.5" /></a>}</div>
                </article>
              ))}
            </div></div>
        </section>
      )}
      {team.length > 0 && (
        <section id="team" aria-label="Team">
          <div className="yp-card p-6 md:p-7"><h2 className="mb-4 flex items-center gap-3 text-[22px] font-semibold tracking-[-0.02em] text-[#0A0A0A]"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[#E8F4EC] text-[#0B6B2E]"><Users className="h-5 w-5" aria-hidden="true" /></span> Meet the team</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {team.map((m: any, i: number) => (
                <div key={i} className="flex gap-3 items-start">
                  {m.photo ? <img src={m.photo} alt={m.name} loading="lazy" className="h-14 w-14 rounded-full object-cover" /> : <div className="h-14 w-14 rounded-full bg-[#E8F4EC] flex items-center justify-center font-semibold text-[#0B6B2E]">{m.name.split(" ").map((x: string) => x[0]).join("").slice(0, 2)}</div>}
                  <div><div className="font-medium text-[#0A0A0A]">{m.name}{m.linkedin && <a href={m.linkedin} target="_blank" rel="noopener nofollow" className="ms-1 inline-block align-middle text-[#0a66c2]"><Linkedin className="h-4 w-4" /></a>}</div><div className="text-sm text-[#4B5565]">{m.role}</div>{m.bio && <p className="text-xs text-[#5B6475] mt-1">{m.bio}</p>}</div>
                </div>
              ))}
            </div></div>
        </section>
      )}
      {faqs.length > 0 && (
        <section id="faq" aria-label="Frequently asked questions">
          <div className="yp-card p-6 md:p-7"><h2 className="mb-4 flex items-center gap-3 text-[22px] font-semibold tracking-[-0.02em] text-[#0A0A0A]"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[#E8F4EC] text-[#0B6B2E]"><HelpCircle className="h-5 w-5" aria-hidden="true" /></span>{" "}{tj("Questions about {0}", businessName)}</h2>
            <div className="divide-y divide-[#EEF0F4]">
              {faqs.map((f: any, i: number) => (
                <div key={i}>
                  <button className="w-full flex justify-between items-center gap-3 min-h-[48px] py-3 text-start font-medium text-[#0A0A0A]" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>{f.question}<ChevronDown className={`h-4 w-4 shrink-0 text-[#5B6475] transition ${open === i ? "rotate-180" : ""}`} /></button>
                  {open === i && <p className="pb-4 text-sm leading-[1.6] text-[#3A4354] whitespace-pre-line">{f.answer}</p>}
                </div>
              ))}
            </div></div>
        </section>
      )}
    </>
  );
}
