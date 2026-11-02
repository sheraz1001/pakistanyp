import { Fragment, type ReactNode } from "react";
import { tj } from "@/i18n-jsx/tj";

/**
 * Renders a province / city guide written in simple Markdown
 * (## sections, ### FAQ questions, "- " bullets, **bold**, paragraphs).
 * "## Key facts" becomes a facts panel and "## Frequently asked questions" an FAQ list;
 * use guideFaqLd() for the matching FAQPage structured data.
 */

type Block = { type: "p"; text: string } | { type: "ul"; items: string[] };
interface Section { title: string; blocks: Block[]; questions: { q: string; a: Block[] }[] }
export interface ParsedGuide { intro: Block[]; sections: Section[]; facts: { label: string; value: string }[]; faqs: { q: string; a: string }[] }

const isFacts = (t: string) => /^key facts$/i.test(t.trim());
const isFaq = (t: string) => /^(frequently asked questions|faqs?)$/i.test(t.trim());

export function parseGuide(markdown?: string | null): ParsedGuide | null {
  if (!markdown || !markdown.trim()) return null;
  const text = markdown.replace(/<!--[\s\S]*?-->/g, "").replace(/\r\n/g, "\n");
  const intro: Block[] = [];
  const sections: Section[] = [];
  let section: Section | null = null;
  let question: { q: string; a: Block[] } | null = null;
  const target = () => (question ? question.a : section ? section.blocks : intro);
  for (const chunk of text.split(/\n{2,}/)) {
    const lines = chunk.split("\n").map((l) => l.trimEnd()).filter((l) => l.trim());
    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      if (line.startsWith("## ")) {
        section = { title: line.slice(3).trim(), blocks: [], questions: [] };
        sections.push(section);
        question = null;
        i++;
      } else if (line.startsWith("### ") && section) {
        question = { q: line.slice(4).trim(), a: [] };
        section.questions.push(question);
        i++;
      } else if (/^[-*] /.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^[-*] /.test(lines[i].trim())) { items.push(lines[i].trim().slice(2).trim()); i++; }
        target().push({ type: "ul", items });
      } else {
        const para: string[] = [];
        while (i < lines.length && !/^(#{2,3} |[-*] )/.test(lines[i].trim())) { para.push(lines[i].trim()); i++; }
        target().push({ type: "p", text: para.join(" ") });
      }
    }
  }
  const factsSection = sections.find((s) => isFacts(s.title));
  const facts = (factsSection?.blocks || [])
    .flatMap((b) => (b.type === "ul" ? b.items : []))
    .map((item) => {
      const m = item.match(/^\*\*(.+?):?\*\*:?\s*(.*)$/);
      return m ? { label: m[1].replace(/:$/, ""), value: m[2] } : { label: "", value: item };
    });
  const faqSection = sections.find((s) => isFaq(s.title));
  const plain = (b: Block[]) => b.map((x) => (x.type === "p" ? x.text : x.items.join("; "))).join(" ").replace(/\*\*/g, "");
  const faqs = (faqSection?.questions || []).map((q) => ({ q: q.q.replace(/\*\*/g, ""), a: plain(q.a) })).filter((f) => f.q && f.a);
  return { intro, sections: sections.filter((s) => !isFacts(s.title) && !isFaq(s.title)), facts, faqs };
}

/** FAQPage structured data for a guide (null when it has no questions). */
export function guideFaqLd(guide: ParsedGuide | null) {
  if (!guide || !guide.faqs.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

function inline(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i} className="font-semibold text-[#0A0A0A]">{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>,
  );
}

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) =>
        b.type === "p" ? (
          <p key={i} className="max-w-[72ch] text-[16px] leading-[1.75] text-[#3A4354]">{inline(b.text)}</p>
        ) : (
          <ul key={i} className="flex max-w-[72ch] list-disc flex-col gap-1.5 ps-5 text-[16px] leading-[1.7] text-[#3A4354] marker:text-[#0B6B2E]">
            {b.items.map((item, j) => <li key={j}>{inline(item)}</li>)}
          </ul>
        ),
      )}
    </>
  );
}

/** Key facts panel (for a sidebar). */
export function GuideFacts({ guide, title = "Key facts" }: { guide: ParsedGuide | null; title?: string }) {
  if (!guide || !guide.facts.length) return null;
  return (
    <section className="yp-card p-5" aria-labelledby="guide-facts-heading">
      <h2 id="guide-facts-heading" className="text-base font-semibold">{title}</h2>
      <dl className="mt-3 flex flex-col divide-y divide-[#EEF0F4]">
        {guide.facts.map((f, i) => (
          <div key={i} className="flex flex-col gap-0.5 py-2.5">
            {f.label && <dt className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#5B6475]">{f.label}</dt>}
            <dd className="text-sm text-[#0A0A0A]">{inline(f.value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** The guide body: intro, sections and FAQ. */
export function PlaceGuide({ guide, placeName }: { guide: ParsedGuide | null; placeName: string }) {
  if (!guide) return null;
  return (
    <article className="yp-card flex flex-col gap-8 p-6 md:p-8" aria-labelledby="place-guide-heading">
      <header className="flex flex-col gap-4">
        <p className="yp-label">Guide</p>
        <h2 id="place-guide-heading" className="text-[26px] font-bold leading-tight tracking-[-0.03em] text-[#0A0A0A]">{tj("About {0}", placeName)}</h2>
        <Blocks blocks={guide.intro} />
      </header>
      {guide.sections.map((s, i) => (
        <section key={i} className="flex flex-col gap-3">
          <h3 className="text-[19px] font-semibold tracking-[-0.02em] text-[#0A0A0A]">{s.title}</h3>
          <Blocks blocks={s.blocks} />
        </section>
      ))}
      {guide.faqs.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="place-faq-heading">
          <h3 id="place-faq-heading" className="text-[19px] font-semibold tracking-[-0.02em] text-[#0A0A0A]">Frequently asked questions</h3>
          <div className="flex flex-col divide-y divide-[#EEF0F4] rounded-[14px] border border-[#E7E9EE]">
            {guide.faqs.map((f, i) => (
              <details key={i} className="group px-4 py-3" open={i === 0}>
                <summary className="cursor-pointer list-none text-[15px] font-semibold text-[#0A0A0A] marker:hidden">
                  <span className="me-2 inline-block text-[#0B6B2E] transition-transform group-open:rotate-90" aria-hidden="true">›</span>{f.q}
                </summary>
                <p className="mt-2 max-w-[72ch] ps-5 text-[15px] leading-[1.7] text-[#3A4354]">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
