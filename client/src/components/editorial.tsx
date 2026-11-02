import { Link } from "wouter";
import { useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronRight, Clock, Copy, Facebook, Linkedin, Search, Twitter, Tag as TagIcon } from "lucide-react";

/** Blogs and News share one editorial design. */
export type EditorialKind = "blogs" | "news";

export interface EditorialItem {
  id: number;
  slug: string;
  title: string;
  summary?: string | null;
  image?: string | null;
  category: string;
  categorySlug: string;
  publishedAt: string;
  updatedAt?: string | null;
  views?: number;
  featured?: boolean;
  readingTime?: number | null;
  tags: string[];
  author?: string | null;
}

export interface EditorialSide {
  categories: { name: string; slug: string; count: number }[];
  popular: EditorialItem[];
  recent: EditorialItem[];
  tags: { tag: string; count: number }[];
}

export const EDITORIAL: Record<EditorialKind, {
  base: string; label: string; heading: string; lead: string; noun: string; nouns: string; schema: "BlogPosting" | "NewsArticle"; other: EditorialKind;
}> = {
  blogs: {
    base: "/blogs", label: "Blogs", heading: "PakistanYP Blogs",
    lead: "Practical guides, tips and insights for Pakistani businesses and the customers who look for them.",
    noun: "article", nouns: "articles", schema: "BlogPosting", other: "news",
  },
  news: {
    base: "/news", label: "News", heading: "PakistanYP News",
    lead: "Company news, product updates and announcements from PakistanYP, Pakistan's business directory.",
    noun: "story", nouns: "stories", schema: "NewsArticle", other: "blogs",
  },
};

/** Stable date text (same on server and browser). */
export const formatDate = (d?: string | null, short = false) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: short ? "short" : "long", year: "numeric", timeZone: "Asia/Karachi" });
  } catch { return ""; }
};

export const tagSlug = (t: string) => encodeURIComponent(t.trim().toLowerCase());

/** Cover image, or a branded placeholder when an article has none. */
export function Cover({ item, className = "", sizes }: { item: Pick<EditorialItem, "image" | "title" | "category">; className?: string; sizes?: string }) {
  if (item.image) {
    return <img src={item.image} alt="" loading="lazy" decoding="async" sizes={sizes} className={`h-full w-full object-cover ${className}`} />;
  }
  return (
    <div className={`flex h-full w-full items-end bg-gradient-to-br from-[#0B6B2E] to-[#05501F] p-5 ${className}`} aria-hidden="true">
      <span className="font-mono text-xs uppercase tracking-[0.1em] text-[#F2C14E]">{item.category}</span>
    </div>
  );
}

export function CategoryChip({ kind, item, onDark = false }: { kind: EditorialKind; item: Pick<EditorialItem, "category" | "categorySlug">; onDark?: boolean }) {
  return (
    <Link href={`${EDITORIAL[kind].base}/category/${item.categorySlug}`} className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.08em] ${onDark ? "bg-white/15 text-white hover:bg-white/25" : "bg-[#E8F4EC] text-[#05501F] hover:bg-[#D6EEDD]"}`}>
      {item.category}
    </Link>
  );
}

export function Meta({ item, kind }: { item: EditorialItem; kind: EditorialKind }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-[#5B6475]">
      <time dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time>
      {kind === "blogs" && item.readingTime ? <><span aria-hidden="true">·</span><span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{item.readingTime} min read</span></> : null}
      {item.author && <><span aria-hidden="true">·</span><span>{item.author}</span></>}
    </p>
  );
}

/** Large lead story at the top of a list. */
export function FeaturedCard({ kind, item }: { kind: EditorialKind; item: EditorialItem }) {
  const href = `${EDITORIAL[kind].base}/${item.slug}`;
  return (
    <article className="group grid overflow-hidden rounded-[22px] border border-[#E7E9EE] bg-white md:grid-cols-[1.15fr_1fr]">
      <Link href={href} className="flex aspect-[1200/630] items-center overflow-hidden bg-[#0B6B2E] md:aspect-auto md:min-h-[320px]" tabIndex={-1} aria-hidden="true">
        {/* whole image, letterboxed on brand green so titles in cover art are never cropped */}
        <Cover item={item} className="!h-auto !object-contain transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none" />
      </Link>
      <div className="flex flex-col justify-center gap-4 p-6 md:p-8">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#B07D10]">{kind === "news" ? "Top story" : "Featured"}</span>
          <CategoryChip kind={kind} item={item} />
        </div>
        <h2 className="text-[clamp(24px,2.6vw,32px)] font-bold leading-[1.15] tracking-[-0.03em] text-[#0A0A0A]">
          <Link href={href} className="hover:text-[#0B6B2E]">{item.title}</Link>
        </h2>
        {item.summary && <p className="line-clamp-3 text-[16px] leading-relaxed text-[#4B5565]">{item.summary}</p>}
        <Meta item={item} kind={kind} />
        <Link href={href} className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-[#0B6B2E] hover:text-[#05501F]">
          Read {kind === "news" ? "story" : "article"}<ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

/** Standard card in a grid. */
export function ArticleCard({ kind, item }: { kind: EditorialKind; item: EditorialItem }) {
  const href = `${EDITORIAL[kind].base}/${item.slug}`;
  return (
    <article className="group flex flex-col overflow-hidden rounded-[18px] border border-[#E7E9EE] bg-white transition-shadow hover:shadow-[0_8px_30px_rgba(10,10,10,0.06)]">
      <Link href={href} className="block aspect-[1200/630] overflow-hidden bg-[#EEF0F4]" tabIndex={-1} aria-hidden="true">
        <Cover item={item} className="transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none" />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <CategoryChip kind={kind} item={item} />
        <h3 className="text-[18px] font-semibold leading-snug tracking-[-0.015em] text-[#0A0A0A]">
          <Link href={href} className="hover:text-[#0B6B2E]">{item.title}</Link>
        </h3>
        {item.summary && <p className="line-clamp-2 text-[14px] leading-relaxed text-[#5B6475]">{item.summary}</p>}
        <div className="mt-auto pt-1"><Meta item={item} kind={kind} /></div>
      </div>
    </article>
  );
}

/** Small row: thumbnail + title (sidebar lists). */
export function MiniItem({ kind, item, index }: { kind: EditorialKind; item: EditorialItem; index?: number }) {
  return (
    <li>
      <Link href={`${EDITORIAL[kind].base}/${item.slug}`} className="group flex items-start gap-3 rounded-[12px] p-2 hover:bg-[#F7F8FA]">
        {index !== undefined ? (
          <span className="w-6 shrink-0 pt-0.5 text-right font-mono text-sm font-semibold text-[#B07D10]">{String(index + 1).padStart(2, "0")}</span>
        ) : null}
        <span className="h-14 w-20 shrink-0 overflow-hidden rounded-[8px] bg-[#EEF0F4]"><Cover item={item} /></span>
        <span className="min-w-0">
          <span className="line-clamp-2 text-[14px] font-semibold leading-snug text-[#0A0A0A] group-hover:text-[#0B6B2E]">{item.title}</span>
          <span className="mt-0.5 block text-xs text-[#5B6475]">{formatDate(item.publishedAt, true)}</span>
        </span>
      </Link>
    </li>
  );
}

function Panel({ title, children, id }: { title: string; children: ReactNode; id: string }) {
  return (
    <section className="rounded-[18px] border border-[#E7E9EE] bg-white p-5" aria-labelledby={id}>
      <h2 id={id} className="mb-3 text-[15px] font-semibold tracking-[-0.01em] text-[#0A0A0A]">{title}</h2>
      {children}
    </section>
  );
}

/** Right sidebar for lists and articles. */
export function EditorialSidebar({ kind, side, activeCategory, toc, query }: {
  kind: EditorialKind; side?: EditorialSide; activeCategory?: string; toc?: { id: string; text: string }[]; query?: string;
}) {
  const cfg = EDITORIAL[kind];
  const total = (side?.categories || []).reduce((n, c) => n + c.count, 0);
  return (
    <aside className="flex min-w-0 flex-col gap-5" aria-label={`${cfg.label} sidebar`}>
      {toc && toc.length > 1 && (
        <Panel title="On this page" id="toc-heading">
          <ol className="flex flex-col gap-1 border-l-2 border-[#E7E9EE]">
            {toc.map((h) => (
              <li key={h.id}><a href={`#${h.id}`} className="-ml-[2px] block border-l-2 border-transparent py-1 pl-3 text-[14px] text-[#3A4354] hover:border-[#0B6B2E] hover:text-[#0B6B2E]">{h.text}</a></li>
            ))}
          </ol>
        </Panel>
      )}

      <Panel title={`Search ${cfg.label.toLowerCase()}`} id="side-search-heading">
        <form action={cfg.base} method="get" role="search" className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6475]" aria-hidden="true" />
          <label htmlFor={`${kind}-search`} className="sr-only">Search {cfg.label.toLowerCase()}</label>
          <input id={`${kind}-search`} name="q" type="search" defaultValue={query || ""} placeholder={`Search ${cfg.nouns}…`} className="yp-input pl-9 text-[15px]" />
        </form>
      </Panel>

      {side && side.categories.length > 0 && (
        <Panel title="Categories" id="side-categories-heading">
          <ul className="-mx-2 flex flex-col">
            <li>
              <Link href={cfg.base} className={`flex min-h-[40px] items-center justify-between gap-2 rounded-[10px] px-2 text-[14px] ${!activeCategory ? "bg-[#F2F9F4] font-semibold text-[#05501F]" : "text-[#3A4354] hover:bg-[#F7F8FA]"}`} aria-current={!activeCategory ? "page" : undefined}>
                <span>All {cfg.label.toLowerCase()}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold tabular-nums ring-1 ring-[#E7E9EE]">{total}</span>
              </Link>
            </li>
            {side.categories.map((c) => {
              const active = c.slug === activeCategory;
              return (
                <li key={c.slug}>
                  <Link href={`${cfg.base}/category/${c.slug}`} className={`flex min-h-[40px] items-center justify-between gap-2 rounded-[10px] px-2 text-[14px] ${active ? "bg-[#F2F9F4] font-semibold text-[#05501F]" : "text-[#3A4354] hover:bg-[#F7F8FA]"}`} aria-current={active ? "page" : undefined}>
                    <span className="flex items-center gap-2"><ChevronRight className="h-3.5 w-3.5 text-[#0B6B2E]" aria-hidden="true" />{c.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${active ? "bg-white text-[#05501F]" : "bg-[#F1F2F6] text-[#5B6475]"}`}>{c.count}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}

      {side && side.popular.length > 0 && (
        <Panel title={kind === "news" ? "Most read" : "Popular articles"} id="side-popular-heading">
          <ol className="-mx-2 flex flex-col gap-1">
            {side.popular.map((item, i) => <MiniItem key={item.id} kind={kind} item={item} index={i} />)}
          </ol>
        </Panel>
      )}

      {side && side.tags.length > 0 && (
        <Panel title="Topics" id="side-tags-heading">
          <ul className="flex flex-wrap gap-1.5">
            {side.tags.map((t) => (
              <li key={t.tag}>
                <Link href={`${cfg.base}/tag/${tagSlug(t.tag)}`} className="inline-flex items-center gap-1 rounded-full border border-[#E7E9EE] px-2.5 py-1 text-[13px] text-[#3A4354] hover:border-[#9FD3B3] hover:text-[#0B6B2E]">
                  #{t.tag}
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <section className="overflow-hidden rounded-[18px] bg-[#0A4A24] p-6 text-white" aria-labelledby="side-cta-heading">
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#F2C14E]">For business owners</p>
        <h2 id="side-cta-heading" className="mt-2 text-[20px] font-bold leading-tight tracking-[-0.02em]">List your business on PakistanYP, free.</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-[#D5E8DC]">Get found by customers in your city and locality, with click-to-call, WhatsApp and quote requests.</p>
        <Link href="/add-business-enhanced" className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-[12px] bg-[#E3A82B] px-4 text-sm font-semibold text-[#141414] hover:bg-[#D19719]">
          List your business<ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>

      <Link href={EDITORIAL[cfg.other].base} className="group flex items-center justify-between rounded-[18px] border border-[#E7E9EE] bg-white p-5 hover:border-[#9FD3B3]">
        <span>
          <span className="block font-mono text-[11px] uppercase tracking-[0.1em] text-[#5B6475]">Also on PakistanYP</span>
          <span className="mt-1 block text-[15px] font-semibold text-[#0A0A0A] group-hover:text-[#0B6B2E]">{EDITORIAL[cfg.other].heading}</span>
        </span>
        <ArrowRight className="h-5 w-5 text-[#0B6B2E]" aria-hidden="true" />
      </Link>
    </aside>
  );
}

/** Share links (plain links; no tracking scripts). */
export function ShareBar({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url), t = encodeURIComponent(title);
  const links = [
    { name: "WhatsApp", href: `https://wa.me/?text=${t}%20${u}`, icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.6 14.2c-.2.7-1.4 1.3-2 1.3-.5.1-1.1.1-1.8-.1a16 16 0 0 1-1.6-.6 12.6 12.6 0 0 1-4.9-4.3c-.4-.5-1.1-1.6-1.1-3s.7-2.1 1-2.4c.3-.3.6-.4.8-.4h.6c.2 0 .5 0 .7.5l1 2.4c.1.2.1.4 0 .6l-.3.5-.4.5c-.2.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.2.5.1.6-.1l.9-1c.2-.3.4-.2.7-.1l2.2 1c.3.2.5.2.6.3.1.3.1.8-.1 1.5Z"/></svg> },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, icon: <Facebook className="h-4 w-4" aria-hidden="true" /> },
    { name: "X", href: `https://twitter.com/intent/tweet?url=${u}&text=${t}`, icon: <Twitter className="h-4 w-4" aria-hidden="true" /> },
    { name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, icon: <Linkedin className="h-4 w-4" aria-hidden="true" /> },
  ];
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm font-medium text-[#5B6475]">Share</span>
      {links.map((l) => (
        <a key={l.name} href={l.href} target="_blank" rel="noopener noreferrer" aria-label={`Share on ${l.name}`} className="grid h-10 w-10 place-items-center rounded-full border border-[#E7E9EE] text-[#3A4354] hover:border-[#0B6B2E] hover:text-[#0B6B2E]">
          {l.icon}
        </a>
      ))}
      <button type="button" onClick={copy} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[#E7E9EE] px-3.5 text-sm text-[#3A4354] hover:border-[#0B6B2E] hover:text-[#0B6B2E]">
        {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}{copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}

export function Pagination({ base, page, pages, query }: { base: string; page: number; pages: number; query?: string }) {
  if (pages <= 1) return null;
  const href = (p: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  };
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1);
  return (
    <nav className="flex flex-wrap items-center justify-center gap-2 pt-4" aria-label="Pagination">
      {page > 1 && <Link href={href(page - 1)} className="inline-flex h-10 items-center gap-1 rounded-[10px] border border-[#E7E9EE] bg-white px-3 text-sm hover:border-[#0B6B2E]"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Previous</Link>}
      {nums.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && p - nums[i - 1] > 1 && <span className="text-[#5B6475]">…</span>}
          <Link href={href(p)} aria-current={p === page ? "page" : undefined} className={`grid h-10 min-w-10 place-items-center rounded-[10px] px-3 text-sm font-semibold ${p === page ? "bg-[#0B6B2E] text-white" : "border border-[#E7E9EE] bg-white hover:border-[#0B6B2E]"}`}>{p}</Link>
        </span>
      ))}
      {page < pages && <Link href={href(page + 1)} className="inline-flex h-10 items-center gap-1 rounded-[10px] border border-[#E7E9EE] bg-white px-3 text-sm hover:border-[#0B6B2E]">Next<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
    </nav>
  );
}

export { TagIcon };
