import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { StatusPill } from "@/components/phase1/nav";
import { AdminOpsShell as OpsShell } from "@/components/admin/admin-shell";
import { SEO } from "@/components/seo";
import { api, fmtDate } from "@/components/phase1/api";

export default function AdminSponsorships() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [f, setF] = useState({ businessId: 0, businessName: "", categoryId: 0, categoryName: "", provinceId: "", position: 1, endsAt: "", note: "" });
  const [tierEdit, setTierEdit] = useState({ businessId: "", tier: "pro", interval: "yearly" });
  const { data: slots = [], error } = useQuery<any[]>({ queryKey: ["/api/admin/sponsorships"], queryFn: () => api("/api/admin/sponsorships") });
  const { data: lookup } = useQuery({ queryKey: ["/api/admin/lookup", q], queryFn: () => api(`/api/admin/lookup?q=${encodeURIComponent(q)}`), enabled: q.length >= 2 });
  const { data: billing } = useQuery({ queryKey: ["/api/admin/billing"], queryFn: () => api("/api/admin/billing") });
  const create = useMutation({
    mutationFn: () => api("/api/admin/sponsorships", { method: "POST", json: { ...f, provinceId: f.provinceId || undefined, endsAt: f.endsAt || undefined } }),
    onSuccess: () => { toast({ title: "Sponsored slot added" }); qc.invalidateQueries({ queryKey: ["/api/admin/sponsorships"] }); },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
  const remove = useMutation({
    mutationFn: (id: number) => api(`/api/admin/sponsorships/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/sponsorships"] }),
  });
  const setTier = useMutation({
    mutationFn: () => api(`/api/admin/businesses/${tierEdit.businessId}/tier`, { method: "PATCH", json: { tier: tierEdit.tier, interval: tierEdit.interval } }),
    onSuccess: () => { toast({ title: "Tier updated" }); qc.invalidateQueries({ queryKey: ["/api/admin/billing"] }); },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  return (
    <OpsShell kind="admin" title="Sponsorships & memberships" subtitle="Sponsored slots appear, clearly labelled, above the ranking on /top/{category}/{province} pages. Memberships normally activate through Stripe; set them here for bank transfers or comps.">
      <SEO title="Sponsorships | PakistanYP Admin" description="Admin" robotsContent="noindex, nofollow" />
      {error && <Card className="mb-4"><CardContent className="p-4 text-red-700">{(error as any).message}</CardContent></Card>}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Add a sponsored slot</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Search business or category name…" value={q} onChange={(e) => setQ(e.target.value)} />
            {lookup && (
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div><div className="font-medium mb-1">Businesses</div>{lookup.businesses.map((b: any) => <button key={b.id} className={`block w-full text-left rounded px-2 py-1 hover:bg-gray-100 ${f.businessId === b.id ? "bg-pk-navy/10" : ""}`} onClick={() => setF({ ...f, businessId: b.id, businessName: b.name })}>{b.name}</button>)}</div>
                <div><div className="font-medium mb-1">Categories</div>{lookup.categories.map((c: any) => <button key={c.id} className={`block w-full text-left rounded px-2 py-1 hover:bg-gray-100 ${f.categoryId === c.id ? "bg-pk-navy/10" : ""}`} onClick={() => setF({ ...f, categoryId: c.id, categoryName: c.name })}>{c.name}</button>)}</div>
              </div>
            )}
            <div className="text-sm">Selected: <b>{f.businessName || "—"}</b> in <b>{f.categoryName || "—"}</b></div>
            <div className="grid sm:grid-cols-3 gap-3">
              <select className="h-10 rounded-md border bg-white px-2 text-sm" value={f.provinceId} onChange={(e) => setF({ ...f, provinceId: e.target.value })}><option value="">All provinces</option>{(lookup?.provinces || []).map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
              <Input type="number" min={1} max={3} value={f.position} onChange={(e) => setF({ ...f, position: Number(e.target.value) })} placeholder="Position 1-3" />
              <Input type="date" value={f.endsAt} onChange={(e) => setF({ ...f, endsAt: e.target.value })} />
            </div>
            <Input placeholder="Note (invoice no., contact)" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
            <Button disabled={!f.businessId || !f.categoryId || create.isPending} onClick={() => create.mutate()}>Add slot</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Set a membership manually</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid sm:grid-cols-3 gap-3">
              <Input placeholder="Business ID" value={tierEdit.businessId} onChange={(e) => setTierEdit({ ...tierEdit, businessId: e.target.value })} />
              <select className="h-10 rounded-md border bg-white px-2 text-sm" value={tierEdit.tier} onChange={(e) => setTierEdit({ ...tierEdit, tier: e.target.value })}><option value="free">Free</option><option value="pro">Pro</option><option value="premium">Premium</option></select>
              <select className="h-10 rounded-md border bg-white px-2 text-sm" value={tierEdit.interval} onChange={(e) => setTierEdit({ ...tierEdit, interval: e.target.value })}><option value="monthly">1 month</option><option value="yearly">1 year</option></select>
            </div>
            <Button variant="outline" disabled={!tierEdit.businessId || setTier.isPending} onClick={() => setTier.mutate()}>Apply</Button>
            <div className="text-sm font-medium mt-4">Paid members ({billing?.members?.length || 0})</div>
            <div className="max-h-64 overflow-y-auto text-sm divide-y">
              {(billing?.members || []).map((m: any) => <div key={m.id} className="py-1.5 flex items-center gap-2"><StatusPill value={m.effectiveTier} /><Link href={`/business/${m.slug}`} className="hover:underline">{m.name}</Link><span className="text-gray-500 ml-auto">#{m.id} · {m.tier_expires_at ? `until ${fmtDate(m.tier_expires_at)}` : ""}</span></div>)}
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle>Sponsored slots</CardTitle></CardHeader>
        <CardContent>
          {slots.length === 0 ? <p className="text-gray-600 text-sm">No sponsored slots yet.</p> : (
            <table className="w-full text-sm"><thead className="text-left text-xs uppercase text-gray-500"><tr><th className="py-2">Business</th><th>Category</th><th>Province</th><th>Pos</th><th>Until</th><th>Note</th><th></th></tr></thead>
              <tbody>{slots.map((s: any) => { const active = !s.ends_at || new Date(s.ends_at) > new Date(); return (
                <tr key={s.id} className={`border-t ${active ? "" : "text-gray-400"}`}><td className="py-2"><Link href={`/business/${s.business_slug}`} className="hover:underline">{s.business_name}</Link></td><td>{s.category_name}</td><td>{s.province_name || "All"}</td><td>{s.position}</td><td>{s.ends_at ? fmtDate(s.ends_at) : "open"}</td><td>{s.note}</td>
                  <td><button onClick={() => remove.mutate(s.id)} className="text-red-600" title="Remove"><Trash2 className="h-4 w-4" /></button></td></tr>); })}</tbody></table>
          )}
        </CardContent>
      </Card>
    </OpsShell>
  );
}
