import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Crown, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { OwnerShell as OpsShell, OwnerPill as StatusPill } from "@/components/owner-shell";
import { SEO } from "@/components/seo";
import { country, localize } from "@shared/country";
import { api, fmtDate } from "@/components/phase1/api";

export default function MyPlan() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const [businessId, setBusinessId] = useState<number | null>(Number(params.get("business")) || null);
  const [interval, setInterval_] = useState<"monthly" | "yearly">("yearly");
  const { data: tiers } = useQuery({ queryKey: ["/api/billing/tiers"], queryFn: () => api("/api/billing/tiers") });
  const { data: businesses = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/my/plan"], queryFn: () => api("/api/my/plan") });
  useEffect(() => { if (!businessId && businesses.length) setBusinessId(businesses[0].id); }, [businesses, businessId]);
  const biz = businesses.find((b) => b.id === businessId);

  const confirm = useMutation({
    mutationFn: (sessionId: string) => api("/api/billing/confirm", { method: "POST", json: { sessionId } }),
    onSuccess: (r: any) => { toast({ title: `${r.tier === "premium" ? "Premium" : "Pro"} activated`, description: "Thank you – your benefits are live now." }); qc.invalidateQueries({ queryKey: ["/api/my/plan"] }); window.history.replaceState({}, "", "/my-plan"); },
    onError: (e: any) => toast({ title: "Could not confirm payment", description: e.message, variant: "destructive" }),
  });
  useEffect(() => { const sid = params.get("session_id"); if (sid) confirm.mutate(sid); if (params.get("cancelled")) toast({ title: "Checkout cancelled", description: "No payment was taken." }); }, []);

  const checkout = useMutation({
    mutationFn: (tier: string) => api("/api/billing/checkout", { method: "POST", json: { businessId, tier, interval } }),
    onSuccess: (r: any) => { if (r.url) window.location.href = r.url; },
    onError: (e: any) => toast({ title: "Checkout unavailable", description: e.message, variant: "destructive" }),
  });
  const portal = useMutation({
    mutationFn: () => api("/api/billing/portal", { method: "POST", json: { businessId } }),
    onSuccess: (r: any) => { if (r.url) window.location.href = r.url; },
    onError: (e: any) => toast({ title: "Not available", description: e.message, variant: "destructive" }),
  });

  const T = tiers?.tiers || {};
  const order = ["free", "pro", "premium"];

  return (
    <OpsShell showUpgrade={false} title="Membership" subtitle="Pro and Premium members get the contact details on category quote requests, rank higher and stand out with sponsored placement. Cancel anytime from the billing portal.">
      <SEO title="Membership plans | PakistanYP" description="Upgrade your Pakistan Yellow Pages listing." robotsContent="noindex, nofollow" />
      {isLoading ? <p>Loading…</p> : businesses.length === 0 ? (
        <Card><CardContent className="p-6 text-[#3A4354]">You don't manage any listings yet. Claim your business from its profile page first.</CardContent></Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <label className="text-sm font-medium text-[#283141]">Business
              <select className="ml-2 h-11 rounded-xl border border-[#DDE1E8] bg-white px-3 text-sm" value={businessId || ""} onChange={(e) => setBusinessId(Number(e.target.value))}>
                {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>
            {biz && <span className="text-sm">Current plan: <StatusPill value={biz.effectiveTier === "free" ? "free" : biz.effectiveTier} />{biz.tier_expires_at && biz.effectiveTier !== "free" ? <span className="text-gray-500"> · renews / expires {fmtDate(biz.tier_expires_at)}</span> : null}</span>}
            <div className="ml-auto inline-flex gap-1 rounded-xl bg-[#F1F2F6] p-1 text-sm">
              {(["monthly", "yearly"] as const).map((i) => <button key={i} onClick={() => setInterval_(i)} type="button" aria-pressed={interval === i} className={`min-h-[36px] rounded-[9px] px-3 font-semibold capitalize ${interval === i ? "bg-white text-[#0A0A0A] shadow-sm" : "text-[#5B6475]"}`}>{i}{i === "yearly" ? " · 2 months free" : ""}</button>)}
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {order.map((k) => {
              const t = T[k]; if (!t) return null;
              const price = interval === "yearly" ? t.yearly : t.monthly;
              const current = biz?.effectiveTier === k;
              return (
                <Card key={k} className={k === "pro" ? "border-[#0B6B2E] ring-1 ring-[#0B6B2E]" : ""}>
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-center gap-2 text-lg font-semibold">{k === "premium" ? <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FDECEC] text-[#B91C1C]"><Crown className="h-5 w-5" /></span> : k === "pro" ? <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#E8F4EC] text-[#0B6B2E]"><Sparkles className="h-5 w-5" /></span> : null}{t.name}</div>
                    <div className="mt-2"><span className="text-[34px] font-bold tracking-[-0.04em]">{price === 0 ? "Free" : `${country.currency} ${price.toLocaleString()}`}</span>{price > 0 && <span className="text-gray-500 text-sm"> / {interval === "yearly" ? "year" : "month"}</span>}</div>
                    <ul className="mt-4 space-y-2 text-sm flex-1">{t.features.map((f: string) => <li key={f} className="flex gap-2"><Check className="h-4 w-4 text-[#0B6B2E] shrink-0 mt-0.5" /> {f}</li>)}</ul>
                    <div className="mt-5">
                      {current ? <Button variant="outline" className="w-full" disabled>Current plan</Button>
                        : k === "free" ? <Button variant="outline" className="w-full" onClick={() => portal.mutate()} disabled={!biz || biz.effectiveTier === "free"}>Manage / cancel in billing portal</Button>
                        : <Button className="w-full" onClick={() => checkout.mutate(k)} disabled={checkout.isPending || !biz}>{checkout.isPending ? "Opening checkout…" : `Upgrade to ${t.name}`}</Button>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {tiers && !tiers.stripeEnabled && <p className="text-sm text-[#B45309] mt-4">Online card payment is being set up – contact us to activate a plan by bank transfer.</p>}
          <p className="text-xs text-gray-500 mt-6">{localize("Prices in PKR, exclusive of VAT where applicable. Payments are processed by Stripe; we never see your card details.")}</p>
        </>
      )}
    </OpsShell>
  );
}
