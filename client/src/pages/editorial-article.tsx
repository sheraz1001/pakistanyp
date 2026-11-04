import { Link, useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, ChevronRight, Clock } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { PageSEO } from "@/components/page-seo";
import { breadcrumbLd } from "@/lib/structured-data";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { country } from "@shared/country";
import { ArticleCard, CategoryChip, Cover, EDITORIAL, EditorialSidebar, ShareBar, formatDate, tagSlug, type EditorialItem, type EditorialKind, type EditorialSide } from "@/components/editorial";
import { tj } from "@/i18n-jsx/tj";
import { t as tx } from "@shared/i18n";

interface ArticleResponse extends EditorialSide {
  article: EditorialItem & { content?: string | null; metaTitle?: string | null; metaDescription?: string | null; source?: string | null; sourceUrl?: string | null };
  related: EditorialItem[];
  previous: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
}

const slugify = (s: string) => s.toLowerCase().replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Give every h2 an id (for the table of contents) and collect them. */
function withHeadingIds(html: string) {
  const toc: { id: string; text: string }[] = [];
  const used = new Set<string>();
  const out = html.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (_m, attrs: string, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();
    let id = (attrs.match(/id="([^"]+)"/) || [])[1] || slugify(text) || `section-${toc.length + 1}`;
    while (used.has(id)) id = `${id}-2`;
    used.add(id);
    toc.push({ id, text });
    return `<h2${attrs.replace(/\s*id="[^"]*"/, "")} id="${id}">${inner}</h2>`;
  });
  return { html: out, toc };
}

/** Questions and answers of the article's FAQ block (server/richMarkdown.ts), for FAQPage structured data. */
function faqItems(html: string) {
  const text = (s: string) => s.replace(/<\/(p|li|div)>/g, " ").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  return [...html.matchAll(/<details class="yp-faq-item"[^>]*><summary>([\s\S]*?)<\/summary><div class="yp-faq-a">([\s\S]*?)<\/div><\/details>/g)]
    .map((m) => ({ q: text(m[1]), a: text(m[2]) })).filter((x) => x.q && x.a);
}

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

/** Single blog post or news story. */
export default function EditorialArticle({ kind }: { kind: EditorialKind }) {
  const cfg = EDITORIAL[kind];
  const [, navigate] = useLocation();
  const { slug = "" } = useParams() as { slug?: string };
  const { data, isLoading, isError, error, refetch } = useQuery<ArticleResponse>({ queryKey: [`/api/editorial/${kind}/${slug}`], enabled: !!slug });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F3]"><Header />
        <div className="yp-wrap-wide animate-pulse py-12" role="status" aria-label="Loading"><div className="mx-auto h-10 max-w-2xl rounded bg-[#EEF0F4]" /><div className="mt-8 h-80 rounded-[20px] bg-[#EEF0F4]" /></div>
      <Footer /></div>
    );
  }
  if (!data || isError) {
    const missing = !data || /404/.test(String(error));
    return (
      <div className="min-h-screen bg-[#FAF8F3]" data-page-not-found={missing ? "" : undefined}>
        <Header />
        <main className="yp-wrap pt-16 pb-24"><div className="yp-card mx-auto max-w-xl p-10 text-center">
          <h1 className="mb-3 text-2xl font-bold tracking-[-0.03em]">{missing ? "Article not found" : "We couldn't load this article"}</h1>
          <p className="mb-6 text-[#4B5565]">{missing ? "It may have been moved or removed." : "Please try again."}</p>
          {!missing && <button type="button" className="yp-btn yp-btn-primary me-2" onClick={() => refetch()}>Try again</button>}
          <Link href={cfg.base} className="yp-btn yp-btn-ghost">{tj("All {0}", cfg.label.toLowerCase())}</Link>
        </div></main>
        <Footer />
      </div>
    );
  }

  const a = data.article;
  const url = `${country.origin}${cfg.base}/${a.slug}`;
  const { html, toc } = withHeadingIds(sanitizeHtml(a.content || (a.summary ? `<p>${a.summary}</p>` : "")));
  const image = a.image ? (/^https?:/.test(a.image) ? a.image : `${country.origin}${a.image}`) : `${country.origin}${country.ogImage}`;
  const updated = a.updatedAt && new Date(a.updatedAt).getTime() - new Date(a.publishedAt).getTime() > 36 * 3600 * 1000 ? a.updatedAt : null;
  const author = a.author || "PakistanYP Editorial";
  const faq = faqItems(html);
  const words = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#0A0A0A]">
      <PageSEO
        title={a.metaTitle || tx("{0} | PakistanYP", a.title)}
        description={a.metaDescription || a.summary || cfg.lead}
        canonicalUrl={url}
        ogTitle={a.title}
        ogDescription={a.summary || undefined}
        ogImage={image}
        schemaMarkup={[
          {
            "@context": "https://schema.org",
            "@type": cfg.schema,
            headline: a.title,
            description: a.summary || undefined,
            image: [image],
            datePublished: a.publishedAt,
            dateModified: a.updatedAt || a.publishedAt,
            author: { "@type": "Organization", name: author, url: country.origin },
            publisher: { "@type": "Organization", name: country.brand, logo: { "@type": "ImageObject", url: `${country.origin}${country.logo.full}` } },
            mainEntityOfPage: { "@type": "WebPage", "@id": url },
            articleSection: a.category,
            keywords: a.tags.join(", ") || undefined,
            wordCount: words,
            inLanguage: "en",
          },
          ...(faq.length ? [{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })),
          }] : []),
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: cfg.label, path: cfg.base },
            { name: a.category, path: `${cfg.base}/category/${a.categorySlug}` },
            { name: a.title, path: `${cfg.base}/${a.slug}` },
          ]),
        ]}
      />
      <Header />

      <header className="border-b border-[#E7E9EE] bg-white">
        <div className="yp-wrap-wide pt-8 pb-10">
          <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-1.5 text-sm text-[#5B6475]">
            <Link href="/" className="text-[#0B6B2E] hover:text-[#05501F]">Home</Link><ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <Link href={cfg.base} className="text-[#0B6B2E] hover:text-[#05501F]">{cfg.label}</Link><ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <Link href={`${cfg.base}/category/${a.categorySlug}`} className="text-[#0B6B2E] hover:text-[#05501F]">{a.category}</Link>
          </nav>
          <div className="max-w-[860px]">
            <CategoryChip kind={kind} item={a} />
            <h1 className="mt-4 text-[clamp(30px,4.2vw,50px)] font-bold leading-[1.08] tracking-[-0.04em]">{a.title}</h1>
            {a.summary && <p className="mt-5 text-[19px] leading-relaxed text-[#4B5565]">{a.summary}</p>}
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#0B6B2E] text-sm font-bold text-white" aria-hidden="true">{initials(author)}</span>
                <div className="text-sm">
                  <p className="font-semibold text-[#0A0A0A]">{author}</p>
                  <p className="text-[#5B6475]">
                    <time dateTime={a.publishedAt}>{formatDate(a.publishedAt)}</time>
                    {updated && <> · Updated <time dateTime={updated}>{formatDate(updated)}</time></>}
                  </p>
                </div>
              </div>
              {a.readingTime ? <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F1F2F6] px-3 py-1.5 text-sm text-[#3A4354]"><Clock className="h-4 w-4" aria-hidden="true" />{tj("{0} min read", a.readingTime)}</span> : null}
            </div>
          </div>
        </div>
      </header>

      <main className="yp-wrap-wide grid items-start gap-10 pt-10 pb-16 lg:grid-cols-[minmax(0,1fr)_340px]">
        <article className="min-w-0">
          <div className="overflow-hidden rounded-[22px] border border-[#E7E9EE] bg-[#EEF0F4]">
            <div className="aspect-[1200/630]"><Cover item={a} /></div>
          </div>

          <div className="mt-8 rounded-[22px] border border-[#E7E9EE] bg-white p-6 md:p-10">
            <div
              className="prose prose-lg max-w-none prose-headings:scroll-mt-28 prose-headings:font-semibold prose-headings:tracking-[-0.02em] prose-headings:text-[#0A0A0A] prose-h2:mt-10 prose-h2:text-[26px] prose-h3:text-[20px] prose-p:text-[#3A4354] prose-p:leading-[1.8] prose-a:text-[#0B6B2E] prose-a:font-medium prose-strong:text-[#0A0A0A] prose-li:text-[#3A4354] prose-li:marker:text-[#0B6B2E] prose-img:rounded-[16px]"
              dangerouslySetInnerHTML={{ __html: html }}
              onClick={(e) => {
                const link = (e.target as HTMLElement).closest?.("a");
                const href = link?.getAttribute("href");
                if (!link || !href || !href.startsWith("/") || link.target || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                navigate(href);
                window.scrollTo(0, 0);
              }}
            />
            {a.source && kind === "news" && (
              <p className="mt-8 border-t border-[#EEF0F4] pt-4 text-sm text-[#5B6475]">Source: {a.sourceUrl ? <a href={a.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-[#0B6B2E]">{a.source}</a> : a.source}</p>
            )}

            {a.tags.length > 0 && (
              <ul className="mt-8 flex flex-wrap gap-2 border-t border-[#EEF0F4] pt-6" aria-label="Topics">
                {a.tags.map((t) => (
                  <li key={t}><Link href={`${cfg.base}/tag/${tagSlug(t)}`} className="inline-flex rounded-full border border-[#E7E9EE] px-3 py-1 text-[13px] text-[#3A4354] hover:border-[#9FD3B3] hover:text-[#0B6B2E]">#{t}</Link></li>
                ))}
              </ul>
            )}
            <div className="mt-6 border-t border-[#EEF0F4] pt-6"><ShareBar url={url} title={a.title} /></div>
          </div>

          <section className="mt-6 flex items-start gap-4 rounded-[22px] border border-[#E7E9EE] bg-white p-6" aria-label="About the author">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#0B6B2E] text-base font-bold text-white" aria-hidden="true">{initials(author)}</span>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#5B6475]">Written by</p>
              <p className="mt-1 text-[17px] font-semibold">{author}</p>
              <p className="mt-1 text-[15px] leading-relaxed text-[#4B5565]">The PakistanYP team writes practical guides and news for business owners and customers across Pakistan's provinces, cities and localities.</p>
            </div>
          </section>

          {(data.previous || data.next) && (
            <nav className="mt-6 grid gap-4 sm:grid-cols-2" aria-label={tx("More {0}", cfg.nouns)}>
              {data.previous ? (
                <Link href={`${cfg.base}/${data.previous.slug}`} className="group rounded-[18px] border border-[#E7E9EE] bg-white p-5 hover:border-[#9FD3B3]">
                  <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#5B6475]"><ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />Previous</span>
                  <span className="mt-2 block font-semibold leading-snug group-hover:text-[#0B6B2E]">{data.previous.title}</span>
                </Link>
              ) : <span />}
              {data.next && (
                <Link href={`${cfg.base}/${data.next.slug}`} className="group rounded-[18px] border border-[#E7E9EE] bg-white p-5 text-end hover:border-[#9FD3B3]">
                  <span className="flex items-center justify-end gap-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#5B6475]">Next<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></span>
                  <span className="mt-2 block font-semibold leading-snug group-hover:text-[#0B6B2E]">{data.next.title}</span>
                </Link>
              )}
            </nav>
          )}
        </article>

        <EditorialSidebar kind={kind} side={data} activeCategory={a.categorySlug} toc={toc} />
      </main>

      {data.related.length > 0 && (
        <section className="border-t border-[#E7E9EE] bg-white" aria-labelledby="related-heading">
          <div className="yp-wrap-wide py-14">
            <div className="mb-6 flex items-end justify-between gap-4">
              <h2 id="related-heading" className="text-[26px] font-bold tracking-[-0.03em]">{kind === "news" ? "More news" : "Keep reading"}</h2>
              <Link href={cfg.base} className="inline-flex items-center gap-1 text-sm font-semibold text-[#0B6B2E]">{tj("All {0}", cfg.label.toLowerCase())}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.related.map((item) => <ArticleCard key={item.id} kind={kind} item={item} />)}
            </div>
          </div>
        </section>
      )}
      <Footer />
    </div>
  );
}
