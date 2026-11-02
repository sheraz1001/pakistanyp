import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { CheckCircle2, XCircle, ShieldCheck, AlertTriangle, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { StatusPill } from "@/components/phase1/nav";
import { AdminOpsShell as OpsShell } from "@/components/admin/admin-shell";
import { SEO } from "@/components/seo";
import { api, fmtDate } from "@/components/phase1/api";

export default function AdminReviews() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [status, setStatus] = useState("pending");
  const { data, isLoading, error } = useQuery({ queryKey: ["/api/admin/reviews", status], queryFn: () => api(`/api/admin/reviews?status=${status}`) });
  const act = useMutation({
    mutationFn: ({ id, action }: { id: number; action: "approve" | "reject" | "verify" }) => api(`/api/admin/reviews/${id}`, { method: "PATCH", json: { action } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/reviews"] }),
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
  const c = data?.counts || {};
  const items: any[] = data?.items || [];

  return (
    <OpsShell kind="admin" title="Review moderation" subtitle="Approve genuine client reviews, reject spam or self-reviews. Mark a review as verified once you have confirmed the reviewer (LinkedIn, company email or a short call).">
      <SEO title="Review moderation | PakistanYP Admin" description="Admin" robotsContent="noindex, nofollow" />
      <div className="flex gap-2 mb-5">
        {["pending", "approved", "rejected", "all"].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className="yp-chip capitalize" data-active={status === s ? "true" : undefined}>{s}{c[s] !== undefined ? ` (${c[s]})` : ""}</button>
        ))}
      </div>
      {error ? <Card><CardContent className="p-6 text-red-700">{(error as any).message} – log in with an admin account.</CardContent></Card>
        : isLoading ? <p>Loading…</p> : items.length === 0 ? <Card><CardContent className="p-8 text-center text-gray-600">No {status === "all" ? "" : status} reviews.</CardContent></Card> : (
        <div className="space-y-4">
          {items.map((r) => {
            const flags: string[] = Array.isArray(r.fraud_flags) ? r.fraud_flags : [];
            return (
              <Card key={r.id} className={flags.length ? "border-[#FBE3B5]" : undefined}>
                <CardContent className="p-5 grid lg:grid-cols-[1fr_220px] gap-5">
                  <div className="text-sm space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill value={r.status} />
                      {r.is_verified && <span className="inline-flex items-center gap-1 text-xs text-green-700"><ShieldCheck className="h-3.5 w-3.5" /> verified reviewer</span>}
                      <span className="inline-flex items-center gap-0.5 text-[#F59E0B]">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`h-4 w-4 ${n <= r.rating ? "fill-[#F59E0B]" : "text-gray-300"}`} />)}</span>
                      <Link href={`/business/${r.business_slug}`} className="font-semibold text-pk-navy hover:underline">{r.business_name}</Link>
                      <span className="text-xs text-gray-500">{fmtDate(r.created_at)}</span>
                    </div>
                    {flags.length > 0 && <div className="rounded bg-[#FFF8EB] text-[#7C4A03] p-2 flex gap-2"><AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /><span>{flags.join(" · ")}</span></div>}
                    {r.title && <div className="font-semibold">{r.title}</div>}
                    <p className="text-gray-700 whitespace-pre-line">{r.content}</p>
                    <div className="text-xs text-gray-500">Quality {r.score_quality} · Cost {r.score_cost} · Schedule {r.score_schedule} · Refer {r.score_refer}{r.project_type ? ` · ${r.project_type}` : ""}{r.budget_band ? ` · ${r.budget_band}` : ""}{r.duration ? ` · ${r.duration}` : ""}</div>
                    <div className="rounded bg-gray-50 p-2 text-xs">
                      <b>{r.reviewer_name}</b>{r.reviewer_role ? `, ${r.reviewer_role}` : ""}{r.reviewer_company ? ` at ${r.reviewer_company}` : ""} · {r.reviewer_email}
                      {r.reviewer_linkedin && <> · <a className="underline" href={r.reviewer_linkedin} target="_blank" rel="noopener">LinkedIn</a></>}
                    </div>
                    {r.response && <div className="text-xs text-gray-600"><b>Owner reply:</b> {r.response}</div>}
                  </div>
                  <div className="flex flex-col gap-2">
                    {r.status !== "approved" && <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => act.mutate({ id: r.id, action: "approve" })} disabled={act.isPending}><CheckCircle2 className="h-4 w-4 mr-1" /> Approve</Button>}
                    {r.status !== "rejected" && <Button variant="outline" className="text-red-700" onClick={() => act.mutate({ id: r.id, action: "reject" })} disabled={act.isPending}><XCircle className="h-4 w-4 mr-1" /> Reject</Button>}
                    {!r.is_verified && <Button variant="outline" onClick={() => act.mutate({ id: r.id, action: "verify" })} disabled={act.isPending}><ShieldCheck className="h-4 w-4 mr-1" /> Mark reviewer verified</Button>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </OpsShell>
  );
}
