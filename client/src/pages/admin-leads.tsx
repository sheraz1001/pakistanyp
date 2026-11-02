import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { StatusPill } from "@/components/phase1/nav";
import { AdminOpsShell as OpsShell } from "@/components/admin/admin-shell";
import { SEO } from "@/components/seo";
import { api, fmtDate } from "@/components/phase1/api";

export default function AdminLeads() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["/api/admin/leads"], queryFn: () => api("/api/admin/leads") });
  const update = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api(`/api/admin/leads/${id}`, { method: "PATCH", json: { status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/leads"] }),
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
  const s = data?.stats || {};
  const items: any[] = data?.items || [];

  return (
    <OpsShell kind="admin" title="Lead manager" subtitle="Every quote request, which businesses received it and whether they acted on it. Leads nobody has opened after 48 hours are worth a nudge to the business.">
      <SEO title="Lead manager | PakistanYP Admin" description="Admin" robotsContent="noindex, nofollow" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[["Total leads", s.total], ["This week", s.this_week], ["Won", s.won], ["Not yet opened", s.untouched]].map(([l, v]) => (
          <Card key={String(l)}><CardContent className="p-4"><div className="text-xs text-gray-500">{l}</div><div className="text-2xl font-bold text-pk-navy">{v ?? "–"}</div></CardContent></Card>
        ))}
      </div>
      {error ? <Card><CardContent className="p-6 text-red-700">{(error as any).message} – log in with an admin account.</CardContent></Card>
        : isLoading ? <p>Loading…</p> : items.length === 0 ? <Card><CardContent className="p-8 text-center text-gray-600">No leads yet.</CardContent></Card> : (
        <div className="overflow-x-auto bg-white rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="p-3">Lead</th><th className="p-3">Request</th><th className="p-3">Sent to</th><th className="p-3">Status</th></tr></thead>
            <tbody>
              {items.map((l) => (
                <tr key={l.id} className="border-t align-top">
                  <td className="p-3 min-w-[180px]"><div className="font-medium">{l.name}</div><div className="text-xs text-gray-500">{l.company}</div><div className="text-xs">{l.email}</div><div className="text-xs">{l.phone}</div><div className="text-xs text-gray-400 mt-1">{fmtDate(l.created_at)} · {l.source}</div></td>
                  <td className="p-3 min-w-[260px]"><div className="font-medium">{l.service_needed || "—"}</div><div className="text-gray-700 line-clamp-3">{l.message}</div><div className="text-xs text-gray-500 mt-1">{[l.budget_band, l.timeline].filter(Boolean).join(" · ")}</div></td>
                  <td className="p-3 min-w-[200px]">{(l.assignments || []).map((a: any) => <div key={a.id} className="flex items-center gap-2 mb-1"><StatusPill value={a.status} /><span className={a.viewedAt ? "" : "text-gray-500"}>{a.businessName}</span></div>)}</td>
                  <td className="p-3"><select className="h-8 rounded-md border bg-white px-2 text-sm capitalize" value={l.status || "new"} onChange={(e) => update.mutate({ id: l.id, status: e.target.value })}>{["new", "qualified", "spam", "closed"].map((x) => <option key={x}>{x}</option>)}</select></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </OpsShell>
  );
}
