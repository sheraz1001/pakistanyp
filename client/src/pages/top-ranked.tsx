import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { BadgeCheck, Star, Phone, Globe, ArrowRight, Info } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { QuoteRequestCard } from "@/components/phase1/quote-request";
import { api } from "@/components/phase1/api";
import { breadcrumbLd } from "@/lib/structured-data";
import { country } from "@shared/country";

const YEAR = new Date().getFullYear();
const plain = (s?: string | null, n = 180) => (s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, n);

function Row({ b, rank, sponsored }: { b: any; rank?: number; sponsored?: boolean }) {
  return (
    <article className={`flex flex-wrap sm:flex-nowrap gap-4 rounded-[20px] border bg-white p-5 ${sponsored ? "border-[#CFE8D8]" : "border-[#E7E9EE]"}`}>
      <div className="w-12 shrink-0 text-center">
        {sponsored ? <span className="yp-pill bg-[#FDECEC] text-[#B3141B] uppercase text-[10px] tracking-wide">Sponsored</span>
          : <span className="text-2xl font-bold tracking-[-0.04em] text-[#0B6B2E]">#{rank}</span>}
      </div>
      {b.logo ? <img src={b.logo} alt="" className="h-16 w-16 rounded-[14px] object-contain border border-[#E7E9EE] bg-white p-1 shrink-0" loading="lazy" /> : <div className="h-16 w-16 rounded-[14px] bg-[#E8F4EC] text-[#0B6B2E] grid place-items-center text-xl font-bold tracking-[-0.04em] shrink-0" aria-hidden="true">{String(b.name || "").trim().split(/\s+/).slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()}</div>}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/business/${b.slug}`} className="font-semibold text-lg tracking-[-0.01em] text-[#0A0A0A] hover:text-[#0B6B2E]">{b.name}</Link>
          {b.is_verified && <span className="yp-verified"><BadgeCheck className="h-3.5 w-3.5" /> Verified</span>}
          {b.tier === "premium" && !sponsored && <span className="yp-tag yp-tag-green text-xs min-h-[24px]">Premium member</span>}
        </div>
        <div className="text-sm text-[#5B6475] mt-1">{[b.locality_name, b.province_name].filter(Boolean).join(", ")}{b.category_name ? ` · ${b.category_name}` : ""}</div>
        <p className="text-sm leading-[1.55] text-[#4B5565] mt-2 line-clamp-2">{plain(b.short_description || b.description)}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm mt-2">
          {Number(b.review_avg || b.rating_average) > 0 && <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B]" /> {Number(b.review_avg || b.rating_average).toFixed(1)}{b.reviews ? ` (${b.reviews} review${b.reviews === 1 ? "" : "s"})` : ""}</span>}
          {b.phone && <a className="inline-flex items-center gap-1 text-[#0B6B2E] hover:text-[#05501F]" href={`tel:${b.phone}`}><Phone className="h-4 w-4" /> {b.phone}</a>}
          {b.website && <a className="inline-flex items-center gap-1 text-[#0B6B2E] hover:text-[#05501F]" href={b.website} target="_blank" rel="noopener nofollow"><Globe className="h-4 w-4" /> Website</a>}
          {typeof b.score === "number" && <span className="font-mono text-xs text-[#5B6475]" title={`Verified ${b.breakdown.verified} · Claimed ${b.breakdown.claimed} · Reviews ${b.breakdown.reviews} · Rating ${b.breakdown.rating} · Profile ${b.breakdown.completeness} · Membership ${b.breakdown.tier}`}>Score {b.score}/100</span>}
        </div>
      </div>
      <div className="hidden sm:flex items-center"><Button asChild variant="outline"><Link href={`/business/${b.slug}`}>View <ArrowRight className="h-4 w-4 ml-1" /></Link></Button></div>
    </article>
  );
}

export default function TopRanked() {
  const params = useParams<{ category: string; province?: string }>();
  const key = `/api/rankings/${params.category}${params.province ? `?province=${params.province}` : ""}`;
  const { data, isLoading, error } = useQuery({ queryKey: [key], queryFn: () => api(key) });
  const cat = data?.category, em = data?.province;
  const where = em ? em.name : country.name;
  const n = Math.min(10, data?.items?.length || 0);
  const title = cat ? `Top ${n >= 3 ? n + " " : ""}${cat.name} in ${where} (${YEAR}) – Ranked | ${country.brand}` : `Top businesses | ${country.brand}`;
  const total = Number(data?.total || data?.items?.length || 0);
  const description = cat
    ? `${n >= 3 ? `Top ${n}` : "Best"} ${cat.name.toLowerCase()} in ${where} (${YEAR}), ranked by verified licence, reviews and profile quality.${total ? ` Compare ${total} ${total === 1 ? "company" : "companies"}` : " Compare companies"} and get free quotes.`
    : "";
  const canonical = `${country.origin}/top/${params.category}${params.province ? `/${params.province}` : ""}`;
  const thin = !isLoading && (!data || data.items.length < 3);
  const crumbs = cat ? breadcrumbLd([
    { name: "Home", path: "/" },
    { name: "Categories", path: "/categories" },
    { name: cat.name, path: `/categories/${cat.slug}` },
    { name: em ? `Top in ${em.name}` : `Top in ${country.name}`, path: canonical.replace(country.origin, "") },
  ]) : undefined;
  const ld = cat && data?.items?.length ? {
    "@context": "https://schema.org", "@type": "ItemList", name: title.replace(` | ${country.brand}`, ""), url: canonical, numberOfItems: data.items.length,
    itemListElement: data.items.map((b: any, i: number) => ({ "@type": "ListItem", position: i + 1, url: `${country.origin}/business/${b.slug}`, name: b.name })),
  } : undefined;

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <SEO title={title} description={description} canonical={canonical} robotsContent={thin ? "noindex, follow" : "index, follow"} schemaType="ItemList" schemaData={ld} structuredData={crumbs ? [crumbs] : []} />
      <Header />
      <main className="yp-wrap pt-8 pb-20">
        {error ? <div role="alert" className="yp-card p-8 text-[#B3141B]">{(error as any).message}</div> : isLoading ? <p className="text-[#5B6475]">Loading ranking…</p> : (
          <>
            <nav className="flex flex-wrap gap-2 text-sm text-[#5B6475] mb-4 [&_a]:text-[#0B6B2E] [&_a:hover]:text-[#05501F]" aria-label="Breadcrumb">
              <Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/categories">Categories</Link><span aria-hidden="true">/</span><Link href={`/categories/${cat.slug}`}>{cat.name}</Link>{em ? <><span aria-hidden="true">/</span><span>{em.name}</span></> : null}
            </nav>
            <span className="yp-label">Ranked list</span>
            <h1 className="mt-2 text-[clamp(30px,3.6vw,44px)] font-bold leading-[1.1] tracking-[-0.04em] text-[#0A0A0A]">Top {n >= 3 ? n : ""} {cat.name} in {where} <span className="text-[#5B6475] font-normal">({YEAR})</span></h1>
            <p className="text-[#3A4354] text-[18px] leading-[1.6] mt-3 max-w-3xl">
              Looking for {cat.name.toLowerCase()} in {where}? {total > 0 ? <>We compared {total} {total === 1 ? "listed company" : "listed companies"}</> : <>We compare listed companies</>}{` and ranked them on what matters when you hire: a verified ${country.licenceAuthority}, a claimed and complete profile, and the number and quality of client reviews.`}
            </p>
            <p className="text-[#5B6475] text-[15px] leading-[1.6] mt-2 max-w-3xl">Updated {data.updatedAt}. Membership adds at most 10 points and sponsored listings are always labelled, so the order reflects quality, not payment.</p>
            <div className="flex flex-wrap gap-2 mt-6">
              <Link href={`/top/${cat.slug}`} className="yp-chip" aria-current={!em ? "page" : undefined}>{`All ${country.shortName}`}</Link>
              {data.provinces.filter((e: any) => e.n > 0).map((e: any) => (
                <Link key={e.id} href={`/top/${cat.slug}/${e.slug}`} className="yp-chip" aria-current={em?.id === e.id ? "page" : undefined}>{e.name} <span className="ml-1 opacity-70">({e.n})</span></Link>
              ))}
            </div>
            <div className="flex flex-col gap-3.5 mt-7">
              {data.sponsored.map((b: any) => <Row key={`s${b.id}`} b={b} sponsored />)}
              {data.items.map((b: any, i: number) => <Row key={b.id} b={b} rank={i + 1} />)}
              {data.items.length === 0 && <div className="yp-card p-8 text-[#5B6475]">No businesses listed here yet. <Link href="/add-business" className="font-medium text-[#0B6B2E]">Add yours</Link>.</div>}
            </div>
            <div className="mt-8 yp-panel p-5 text-sm leading-[1.6] text-[#3A4354] flex gap-3">
              <Info className="h-5 w-5 shrink-0 text-[#0B6B2E]" />
              <div><b className="text-[#0A0A0A]">How the score works.</b> Verified licence 30 · claimed listing 10 · up to 25 for approved client reviews (5 each) · up to 20 for average rating · up to 15 for profile completeness · Pro 5 / Premium 10. Sponsored slots are sold separately and never change the ranking. Own one of these businesses? <Link href="/my-verification" className="font-medium text-[#0B6B2E]">Get verified</Link> to move up.</div>
            </div>
            <div className="mt-8"><QuoteRequestCard categoryId={cat.id} categoryName={cat.name} /></div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
