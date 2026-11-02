import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Trophy } from "lucide-react";
import { api } from "./api";
import { country } from "@shared/country";

/** "Top {category} in {province}" links shown on category pages. */
export function RankedLinks({ categorySlug, categoryName }: { categorySlug: string; categoryName: string }) {
  const { data } = useQuery({ queryKey: [`/api/rankings/${categorySlug}?limit=1`], queryFn: () => api(`/api/rankings/${categorySlug}?limit=1`) });
  const provinces = (data?.provinces || []).filter((e: any) => e.n >= 3);
  if (!data || data.total < 3) return null;
  return (
    <div className="yp-card p-6 mb-6">
      <div className="flex items-center gap-3 font-semibold text-[#0A0A0A]"><span className="grid h-10 w-10 place-items-center rounded-[12px] bg-[#E8F4EC] text-[#0B6B2E]"><Trophy className="h-5 w-5" aria-hidden="true" /></span> Ranked lists for {categoryName}</div>
      <p className="text-sm leading-[1.55] text-[#4B5565] mt-3">Compare the best-rated, verified {categoryName.toLowerCase()} – ranked by licence checks, client reviews and profile quality.</p>
      <div className="flex flex-wrap gap-2 mt-4">
        <Link href={`/top/${categorySlug}`} className="yp-chip" data-active="true">Top {categoryName}{` ${country.inName}`}</Link>
        {provinces.map((e: any) => <Link key={e.id} href={`/top/${categorySlug}/${e.slug}`} className="yp-chip">{e.name} ({e.n})</Link>)}
      </div>
    </div>
  );
}
