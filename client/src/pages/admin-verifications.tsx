import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { CheckCircle2, XCircle, ExternalLink, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { StatusPill } from "@/components/phase1/nav";
import { AdminOpsShell as OpsShell } from "@/components/admin/admin-shell";
import { SEO } from "@/components/seo";
import { api, fmtDate } from "@/components/phase1/api";

export default function AdminVerifications() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [status, setStatus] = useState("pending");
  const [notes, setNotes] = useState<Record<number, string>>({});
  const { data, isLoading, error } = useQuery({ queryKey: ["/api/admin/verifications", status], queryFn: () => api(`/api/admin/verifications?status=${status}`) });
  const act = useMutation({
    mutationFn: ({ id, action }: { id: number; action: "approve" | "reject" }) => api(`/api/admin/verifications/${id}`, { method: "PATCH", json: { action, notes: notes[id] || "" } }),
    onSuccess: (_r, v) => { toast({ title: v.action === "approve" ? "Business verified" : "Request rejected" }); qc.invalidateQueries({ queryKey: ["/api/admin/verifications"] }); },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
  const c = data?.counts || {};
  const items: any[] = data?.items || [];

  return (
    <OpsShell kind="admin" title="Verification queue" subtitle="Check the trade licence against the authority's public register, confirm the email domain belongs to the company, and call the number if it is not confirmed. Approve only when all three hold.">
      <SEO title="Verification queue | PakistanYP Admin" description="Admin" robotsContent="noindex, nofollow" />
      <div className="flex gap-2 mb-5">
        {["pending", "approved", "rejected", "all"].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className="yp-chip capitalize" data-active={status === s ? "true" : undefined}>{s}{c[s] !== undefined ? ` (${c[s]})` : ""}</button>
        ))}
      </div>
      {error ? <Card><CardContent className="p-6 text-red-700">{(error as any).message} – log in with an admin account.</CardContent></Card>
        : isLoading ? <p>Loading…</p> : items.length === 0 ? <Card><CardContent className="p-8 text-center text-gray-600">Nothing {status === "all" ? "yet" : status}.</CardContent></Card> : (
        <div className="space-y-4">
          {items.map((v) => (
            <Card key={v.id}>
              <CardContent className="p-5 grid lg:grid-cols-[1fr_300px] gap-5">
                <div className="space-y-2 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill value={v.status} />
                    <Link href={`/business/${v.business_slug}`} className="font-semibold text-lg text-pk-navy hover:underline inline-flex items-center gap-1">{v.business_name} <ExternalLink className="h-4 w-4" /></Link>
                    <span className="text-xs text-gray-500">requested {fmtDate(v.created_at)} by {v.requester_email || v.user_id}</span>
                  </div>
                  <table className="text-sm">
                    <tbody>
                      <tr><td className="pr-4 text-gray-500 py-0.5">Licence</td><td><b>{v.licence_number}</b> · {v.licence_authority}{v.licence_expiry ? ` · expires ${fmtDate(v.licence_expiry)}` : ""}{v.licence_document_url && <> · <a className="underline" href={v.licence_document_url} target="_blank" rel="noopener">document</a></>}</td></tr>
                      <tr><td className="pr-4 text-gray-500 py-0.5">Email</td><td>{v.business_email} – {v.email_verified_at ? <span className="text-green-700">confirmed {fmtDate(v.email_verified_at)}</span> : <span className="text-[#7C4A03]">not confirmed</span>}
                        {v.email_domain_matches ? <span className="ml-2 text-green-700">domain matches website/listing</span> : <span className="ml-2 inline-flex items-center gap-1 text-[#7C4A03]"><AlertTriangle className="h-3.5 w-3.5" /> domain differs from website ({v.website || "none listed"})</span>}</td></tr>
                      <tr><td className="pr-4 text-gray-500 py-0.5">Phone</td><td>{v.phone} – {v.phone_verified_at ? <span className="text-green-700">confirmed</span> : <span className="text-[#7C4A03]">not confirmed – call before approving</span>}{v.listed_phone && v.listed_phone !== v.phone ? <span className="text-gray-500"> (listing shows {v.listed_phone})</span> : null}</td></tr>
                      {v.admin_notes && <tr><td className="pr-4 text-gray-500 py-0.5">Notes</td><td>{v.admin_notes}</td></tr>}
                    </tbody>
                  </table>
                </div>
                {v.status === "pending" && (
                  <div className="space-y-2">
                    <Textarea rows={3} placeholder="Note to the owner (shown on rejection) or internal note" value={notes[v.id] || ""} onChange={(e) => setNotes((n) => ({ ...n, [v.id]: e.target.value }))} />
                    <div className="flex gap-2">
                      <Button className="bg-green-600 hover:bg-green-700 text-white flex-1" onClick={() => act.mutate({ id: v.id, action: "approve" })} disabled={act.isPending}><CheckCircle2 className="h-4 w-4 mr-1" /> Approve</Button>
                      <Button variant="outline" className="text-red-700 flex-1" onClick={() => act.mutate({ id: v.id, action: "reject" })} disabled={act.isPending}><XCircle className="h-4 w-4 mr-1" /> Reject</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </OpsShell>
  );
}
