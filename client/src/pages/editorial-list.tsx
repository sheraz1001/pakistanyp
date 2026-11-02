import { Link, useParams, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Newspaper, Search, X } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { PageSEO } from "@/components/page-seo";
import { breadcrumbLd } from "@/lib/structured-data";
import { country } from "@shared/country";
import { ArticleCard, EDITORIAL, EditorialSidebar, FeaturedCard, Pagination, type EditorialItem, type EditorialKind, type EditorialSide } from "@/components/editorial";
import { tj } from "@/i18n-jsx/tj";
import { t as tx } from "@shared/i18n";

interface ListResponse extends EditorialSide {
  items: EditorialItem[];
  featured: EditorialItem | null;
  total: number;
  page: number;
  pages: number;
}

/** Blogs / News list: all, by category, by topic, or a search. */
export default function EditorialList({ kind }: { kind: EditorialKind }) {
  const cfg = EDITORIAL[kind];
  const params = useParams() as { category?: string; tag?: string };
  const search = new URLSearchParams(useSearch() || "");
  const q = (search.get("q") || "").trim();
  const page = Math.max(1, Number(search.get("page")) || 1);
  const category = params.category || "";
  const tag = params.tag ? decodeURIComponent(params.tag) : "";

  const apiParams = new URLSearchParams();
  if (category) apiParams.set("category", category);
  if (tag) apiParams.set("tag", tag);
  if (q) apiParams.set("q", q);
  if (page > 1) apiParams.set("page", String(page));
  const qs = apiParams.toString();
  const { data, isLoading, isError, error, refetch } = useQuery<ListResponse>({ queryKey: [`/api/editorial/${kind}${qs ? `?${qs}` : ""}`] });

  const activeCategory = data?.categories.find((c) => c.slug === category);
  const notFound = (!!category && isError && /404/.test(String(error))) || (!!category && !!data && !activeCategory);
  const base = category ? `${cfg.base}/category/${category}` : tag ? `${cfg.base}/tag/${params.tag}` : cfg.base;
  const heading = activeCategory ? activeCategory.name : tag ? `#${tag}` : q ? `Search results for “${q}”` : cfg.heading;
  const lead = activeCategory
    ? `${activeCategory.count} ${activeCategory.count === 1 ? cfg.noun : cfg.nouns} in ${activeCategory.name}.`
    : tag ? `${cfg.label} tagged ${tag}.` : q ? `${data?.total ?? 0} ${data?.total === 1 ? cfg.noun : cfg.nouns} found.` : cfg.lead;
  const title = activeCategory ? `${activeCategory.name} – ${cfg.heading}` : tag ? `${tag} – ${cfg.heading}` : q ? `Search ${cfg.label} | PakistanYP` : `${cfg.heading} – ${kind === "blogs" ? "Guides & Insights for Pakistani Businesses" : "Updates & Announcements"}`;
  const canonical = `${country.origin}${base}${page > 1 ? `?page=${page}` : ""}`;

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#FAF8F3]" data-page-not-found>
        <Header />
        <main className="yp-wrap pt-16 pb-24"><div className="yp-card mx-auto max-w-xl p-10 text-center">
          <h1 className="mb-3 text-2xl font-bold tracking-[-0.03em]">Category not found</h1>
          <Link href={cfg.base} className="yp-btn yp-btn-primary">{tj("All {0}", cfg.label.toLowerCase())}</Link>
        </div></main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#0A0A0A]">
      <PageSEO
        title={title.length > 65 ? tx("{0} | PakistanYP", heading) : title}
        description={activeCategory ? tx("Read {0} {1} from PakistanYP: {2}", activeCategory.name.toLowerCase(), cfg.nouns, cfg.lead) : cfg.lead}
        canonicalUrl={canonical}
        noindex={!!q || !!tag || (!!data && data.total === 0)}
        schemaMarkup={[
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: cfg.label, path: cfg.base },
            ...(activeCategory ? [{ name: activeCategory.name, path: base }] : []),
          ]),
          {
            "@context": "https://schema.org",
            "@type": kind === "blogs" ? "Blog" : "CollectionPage",
            name: activeCategory ? `${activeCategory.name} – ${cfg.heading}` : cfg.heading,
            url: `${country.origin}${base}`,
            publisher: { "@type": "Organization", name: country.brand, url: country.origin },
          },
        ]}
      />
      <Header />

      <section className="border-b border-[#E7E9EE] bg-white">
        <div className="yp-wrap-wide pt-8 pb-10">
          <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-[#5B6475]">
            <Link href="/" className="text-[#0B6B2E] hover:text-[#05501F]">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            {(activeCategory || tag || q) ? <Link href={cfg.base} className="text-[#0B6B2E] hover:text-[#05501F]">{cfg.label}</Link> : <span aria-current="page">{cfg.label}</span>}
            {(activeCategory || tag) && <><ChevronRight className="h-3.5 w-3.5" aria-hidden="true" /><span aria-current="page">{activeCategory?.name || `#${tag}`}</span></>}
          </nav>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-3xl">
              <p className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.12em] text-[#0B6B2E]"><Newspaper className="h-4 w-4" aria-hidden="true" />{activeCategory || tag ? cfg.heading : kind === "blogs" ? "Guides & insights" : "Newsroom"}</p>
              <h1 className="mt-3 text-[clamp(32px,4.4vw,52px)] font-bold leading-[1.05] tracking-[-0.04em]">{heading}</h1>
              <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-[#4B5565]">{lead}</p>
            </div>
            {data && !q && <p className="text-sm text-[#5B6475]"><span className="font-semibold text-[#0A0A0A]">{(data.categories.reduce((n, c) => n + c.count, 0)).toLocaleString()}</span> {cfg.nouns} · <span className="font-semibold text-[#0A0A0A]">{data.categories.length}</span> categories</p>}
          </div>
          {data && data.categories.length > 0 && (
            <nav aria-label={tx("{0} categories", cfg.label)} className="-mx-1 mt-7 flex gap-2 overflow-x-auto px-1 pb-1">
              <Link href={cfg.base} className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${!category && !tag && !q ? "bg-[#0B6B2E] text-white" : "border border-[#E7E9EE] bg-white text-[#3A4354] hover:border-[#0B6B2E]"}`}>All</Link>
              {data.categories.map((c) => (
                <Link key={c.slug} href={`${cfg.base}/category/${c.slug}`} className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${c.slug === category ? "bg-[#0B6B2E] text-white" : "border border-[#E7E9EE] bg-white text-[#3A4354] hover:border-[#0B6B2E]"}`}>
                  {c.name} <span className={`ms-1 tabular-nums ${c.slug === category ? "text-[#CFE8D8]" : "text-[#8A93A3]"}`}>{c.count}</span>
                </Link>
              ))}
            </nav>
          )}
        </div>
      </section>

      <main className="yp-wrap-wide grid items-start gap-10 pt-10 pb-20 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-8">
          {q && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#E7E9EE] bg-white px-4 py-3 text-sm">
              <span className="flex items-center gap-2 text-[#3A4354]"><Search className="h-4 w-4 text-[#0B6B2E]" aria-hidden="true" />Showing results for <strong className="text-[#0A0A0A]">{q}</strong></span>
              <Link href={cfg.base} className="inline-flex items-center gap-1 font-semibold text-[#0B6B2E]"><X className="h-4 w-4" aria-hidden="true" />Clear search</Link>
            </div>
          )}

          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2" aria-hidden="true">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-80 animate-pulse rounded-[18px] bg-[#EEF0F4]" />)}</div>
          ) : isError ? (
            <div role="alert" className="yp-card p-8 text-center"><h2 className="mb-2 text-lg font-semibold">{tj("We couldn't load {0}", cfg.label.toLowerCase())}</h2><button type="button" className="yp-btn yp-btn-primary" onClick={() => refetch()}>Try again</button></div>
          ) : data && (data.items.length > 0 || data.featured) ? (
            <>
              {data.featured && <FeaturedCard kind={kind} item={data.featured} />}
              {data.items.length > 0 && (
                <section aria-labelledby="latest-heading" className="flex flex-col gap-5">
                  <div className="flex items-baseline justify-between gap-3 border-b border-[#E7E9EE] pb-3">
                    <h2 id="latest-heading" className="text-[20px] font-semibold tracking-[-0.02em]">{activeCategory || tag || q ? `${data.total} ${data.total === 1 ? cfg.noun : cfg.nouns}` : tx("Latest {0}", cfg.nouns)}</h2>
                    {data.pages > 1 && <span className="text-sm text-[#5B6475]">{tj("Page {0} of {1}", data.page, data.pages)}</span>}
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    {data.items.map((item) => <ArticleCard key={item.id} kind={kind} item={item} />)}
                  </div>
                </section>
              )}
              <Pagination base={base} page={data.page} pages={data.pages} query={q} />
            </>
          ) : (
            <div className="yp-card px-6 py-14 text-center">
              <h2 className="mb-2 text-xl font-semibold">{q ? tx("No {0} match “{1}”", cfg.nouns, q) : tx("No {0} yet", cfg.nouns)}</h2>
              <p className="mb-6 text-[#4B5565]">{q ? "Try a different word, or browse the categories." : "New articles will appear here soon."}</p>
              <Link href={cfg.base} className="yp-btn yp-btn-primary">{tj("All {0}", cfg.label.toLowerCase())}</Link>
            </div>
          )}
        </div>
        <EditorialSidebar kind={kind} side={data} activeCategory={category} query={q} />
      </main>
      <Footer />
    </div>
  );
}
