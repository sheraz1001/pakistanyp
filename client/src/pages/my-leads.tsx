import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Phone, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { OwnerShell as OpsShell, OwnerPill as StatusPill } from "@/components/owner-shell";
import { SEO } from "@/components/seo";
import { country } from "@shared/country";
import { api, fmtDate } from "@/components/phase1/api";

const STATUSES = ["new", "contacted", "quoted", "won", "lost"];

export default function MyLeads() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [notes, setNotes] = useState<Record<number, string>>({});
  const { data: leads = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/my/leads"], queryFn: () => api("/api/my/leads") });
  const update = useMutation({
    mutationFn: ({ id, status, note }: { id: number; status?: string; note?: string }) => api(`/api/my/leads/${id}`, { method: "PATCH", json: { status, notes: note } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/my/leads"] }),
    onError: (e: any) => toast({ title: "Could not update", description: e.message, variant: "destructive" }),
  });
  const shown = leads.filter((l) => filter === "all" || l.status === filter);
  const counts = STATUSES.reduce((m, s) => ({ ...m, [s]: leads.filter((l) => l.status === s).length }), {} as Record<string, number>);

  return (
    <OpsShell title="Quote requests" subtitle="Customers who asked for a quote through your listings. Reply quickly – leads answered within an hour convert far more often.">
      <SEO title="My leads | PakistanYP" description="Quote requests for your business." robotsContent="noindex, nofollow" />
      <div className="flex flex-wrap gap-2 mb-5">
        {["all", ...STATUSES].map((s) => (
          <button key={s} onClick={() => setFilter(s)} type="button" data-active={filter === s ? "true" : undefined} className="yp-chip capitalize">{s}{s !== "all" ? ` (${counts[s] || 0})` : ` (${leads.length})`}</button>
        ))}
      </div>
      {isLoading ? <p>Loading…</p> : shown.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-600">No quote requests {filter === "all" ? "yet" : `with status "${filter}"`}. Verified, complete profiles get the most requests – add photos, services and prices to your listing.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {shown.map((l) => (
            <Card key={l.id} className={l.status === "new" ? "border-[#CFE8D8]" : undefined}>
              <CardContent className="p-5 grid md:grid-cols-[1fr_260px] gap-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <StatusPill value={l.status} />
                    <span className="text-xs text-gray-500">{fmtDate(l.created_at)} · via {l.source === "category" ? "category page" : "your profile"}{l.business_name ? ` · ${l.business_name}` : ""}</span>
                  </div>
                  <h2 className="font-semibold text-lg tracking-[-0.02em]">{l.service_needed || "Quote request"}</h2>
                  <p className="text-gray-700 mt-1 whitespace-pre-line">{l.message}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mt-3">
                    {l.budget_band && <span>Budget: {l.budget_band}</span>}{l.timeline && <span>Timeline: {l.timeline}</span>}
                  </div>
                  {l.contactLocked ? (
                    <div className="mt-3 rounded-xl border border-[#CFE8D8] bg-[#F2F9F4] p-4 text-sm">
                      <div className="font-medium">{l.name.split(" ")[0]} … <span className="text-gray-500 font-normal">contact details hidden</span></div>
                      <p className="text-gray-600 mt-1">This request was sent to several businesses in your category. Pro and Premium members see the customer's email and phone and can reply first.</p>
                      <Button asChild size="sm" className="mt-2"><a href={`/my-plan?business=${l.business_id}`}>Upgrade to see contact details</a></Button>
                    </div>
                  ) : (
                  <div className="mt-3 yp-panel p-4 text-sm space-y-1">
                    <div className="font-medium">{l.name}{l.company ? <span className="text-gray-500 font-normal"> · <Building2 className="inline h-3.5 w-3.5" /> {l.company}</span> : null}</div>
                    <div><a className="text-[#0B6B2E] underline inline-flex items-center gap-1" href={`mailto:${l.email}?subject=Your quote request on ${country.directoryName}`}><Mail className="h-3.5 w-3.5" /> {l.email}</a></div>
                    {l.phone && <div className="flex gap-3"><a className="text-[#0B6B2E] underline inline-flex items-center gap-1" href={`tel:${l.phone}`}><Phone className="h-3.5 w-3.5" /> {l.phone}</a><a className="text-green-700 underline" href={`https://wa.me/${l.phone.replace(/[^\d]/g, "").replace(/^0/, "971")}`} target="_blank" rel="noopener">WhatsApp</a></div>}
                  </div>
                  )}
                </div>
                <div className="space-y-3">
                  <label className="yp-field"><span>Status</span>
                    <select className="h-11 w-full rounded-xl border border-[#DDE1E8] bg-white px-3 text-sm capitalize" value={l.status} onChange={(e) => update.mutate({ id: l.id, status: e.target.value })}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select></label>
                  <label className="yp-field"><span>Private notes</span>
                    <Textarea rows={3} value={notes[l.id] ?? l.notes ?? ""} onChange={(e) => setNotes((n) => ({ ...n, [l.id]: e.target.value }))} placeholder="Called on Monday, sending quote…" /></label>
                  <Button size="sm" variant="outline" onClick={() => update.mutate({ id: l.id, note: notes[l.id] ?? l.notes ?? "" })} disabled={update.isPending}>Save notes</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </OpsShell>
  );
}
