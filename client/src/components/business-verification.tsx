import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Shield, CheckCircle, XCircle, AlertCircle, FileText, Download, Eye, Building2, User, Clock, ExternalLink, Mail, Phone } from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { api } from "@/components/phase1/api";

type Tab = "pending" | "under_review" | "completed";

interface VerificationDocument {
  id: number | null; doc_type: string; file_name: string; mime_type: string | null; size_bytes: number | null;
  url: string; downloadUrl: string; external?: boolean; created_at?: string;
}
interface VerificationRequest {
  id: number; business_id: number; business_name: string; business_slug: string; website?: string;
  requester_name?: string; requester_email?: string; business_email?: string; phone?: string;
  licence_number?: string; licence_authority?: string; licence_expiry?: string;
  email_verified_at?: string | null; phone_verified_at?: string | null;
  status: "pending" | "under_review" | "approved" | "rejected";
  admin_notes?: string | null; rejection_reason?: string | null;
  created_at: string; processed_at?: string | null; documents: VerificationDocument[];
}
interface QueueStats {
  pending: number; under_review: number; completed: number; verified_this_month: number; rejected_this_month: number;
  avg_processing_hours: string | number | null; total_verified_businesses: number;
}

const DOC_LABEL: Record<string, string> = { trade_licence: "Trade licence", owner_id: "Owner ID / passport", establishment_card: "Establishment card", other: "Other document", external_link: "External link" };
const fmt = (d?: string | null) => (d ? format(new Date(d), "dd MMM yyyy, HH:mm") : "—");
const size = (b?: number | null) => (!b ? "" : b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
function avgLabel(h: QueueStats["avg_processing_hours"]) {
  if (h === null || h === undefined) return "—";
  const n = Number(h);
  return n < 48 ? `${n.toFixed(1)} h` : `${(n / 24).toFixed(1)} days`;
}
function statusBadge(s: VerificationRequest["status"]) {
  const map = { pending: "bg-[#FFF4E0] text-[#B45309]", under_review: "bg-blue-100 text-blue-800", approved: "bg-green-100 text-green-800", rejected: "bg-red-100 text-red-800" } as const;
  return <Badge className={map[s]}>{s.replace("_", " ")}</Badge>;
}

export default function BusinessVerification() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<VerificationRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading, error } = useQuery<{ items: VerificationRequest[]; stats: QueueStats }>({
    queryKey: ["/api/admin/verification/queue", activeTab, search],
    queryFn: () => api(`/api/admin/verification/queue?tab=${activeTab}&q=${encodeURIComponent(search)}`),
  });
  const requests = data?.items || [];
  const stats = data?.stats;
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["/api/admin/verification/queue"] });
  const closeAll = () => { setSelected(null); setShowRejectDialog(false); setRejectReason(""); setReviewNotes(""); };
  const fail = (title: string) => (e: any) => toast({ title, description: e?.message || "Something went wrong", variant: "destructive" });

  const startReviewMutation = useMutation({
    mutationFn: (requestId: number) => api(`/api/admin/verification/${requestId}/review`, { method: "POST", json: {} }),
    onSuccess: () => { toast({ title: "Moved to Under review" }); setSelected((s) => (s ? { ...s, status: "under_review" } : s)); refresh(); },
    onError: fail("Could not start review"),
  });
  const approveMutation = useMutation({
    mutationFn: ({ requestId, notes }: { requestId: number; notes: string }) => api(`/api/admin/verification/${requestId}/approve`, { method: "POST", json: { notes } }),
    onSuccess: (r: any) => {
      toast({ title: "Business verified", description: r.emailed ? `The owner was emailed (${r.emailedTo.join(", ")}).` : "Verified. No owner email address on file, so no email was sent." });
      closeAll(); refresh();
    },
    onError: fail("Approval failed"),
  });
  const rejectMutation = useMutation({
    mutationFn: ({ requestId, reason }: { requestId: number; reason: string }) => api(`/api/admin/verification/${requestId}/reject`, { method: "POST", json: { reason } }),
    onSuccess: (r: any) => {
      toast({ title: "Verification rejected", description: r.emailed ? `The owner was emailed the reason (${r.emailedTo.join(", ")}).` : "Rejected. No owner email address on file." });
      closeAll(); refresh();
    },
    onError: fail("Rejection failed"),
  });
  const busy = approveMutation.isPending || rejectMutation.isPending || startReviewMutation.isPending;

  const statCards = [
    { label: "Pending", value: stats?.pending, icon: AlertCircle, cls: "text-[#B45309]" },
    { label: "Under review", value: stats?.under_review, icon: Clock, cls: "text-blue-600" },
    { label: "Verified this month", value: stats?.verified_this_month, icon: CheckCircle, cls: "text-green-600" },
    { label: "Avg processing time", value: avgLabel(stats?.avg_processing_hours ?? null), icon: Shield, cls: "text-indigo-600", hint: "last 90 days" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Shield className="h-6 w-6" /> Verification Queue</h2>
        <p className="text-gray-600">Licence and contact checks submitted by business owners. {stats ? `${stats.total_verified_businesses} businesses are verified in total.` : ""}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.cls}`} />
              <div>
                <div className="text-2xl font-bold">{isLoading && s.value === undefined ? "…" : s.value ?? 0}</div>
                <div className="text-sm text-gray-600">{s.label}{s.hint ? <span className="text-xs text-gray-400"> · {s.hint}</span> : null}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
            <TabsList>
              <TabsTrigger value="pending">Pending ({stats?.pending ?? 0})</TabsTrigger>
              <TabsTrigger value="under_review">Under review ({stats?.under_review ?? 0})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({stats?.completed ?? 0})</TabsTrigger>
            </TabsList>
          </Tabs>
          <Input className="md:w-72" placeholder="Search business, email or licence…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </CardHeader>
        <CardContent>
          {error ? <p className="text-red-700">{(error as any).message}</p>
            : isLoading ? <p className="text-gray-600">Loading verification requests…</p>
            : requests.length === 0 ? <p className="text-gray-600 py-8 text-center">No {activeTab.replace("_", " ")} verification requests.</p>
            : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead><TableHead>Owner</TableHead><TableHead>Licence</TableHead>
                    <TableHead>Documents</TableHead><TableHead>Submitted</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.business_name}</TableCell>
                      <TableCell className="text-sm">{r.requester_name || "—"}<div className="text-gray-500">{r.requester_email}</div></TableCell>
                      <TableCell className="text-sm">{r.licence_number || "—"}<div className="text-gray-500">{r.licence_authority}</div></TableCell>
                      <TableCell>{r.documents.length ? <Badge variant="outline"><FileText className="h-3 w-3 mr-1" />{r.documents.length}</Badge> : <span className="text-[#B45309] text-sm">none</span>}</TableCell>
                      <TableCell className="text-sm">{fmt(r.created_at)}</TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell><Button size="sm" variant="outline" onClick={() => { setSelected(r); setReviewNotes(r.admin_notes || ""); }}><Eye className="h-4 w-4 mr-1" />Review</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
        </CardContent>
      </Card>

      {/* Review dialog */}
      <Dialog open={!!selected && !showRejectDialog} onOpenChange={(o) => { if (!o) closeAll(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Verification Request Review</DialogTitle>
                <DialogDescription>#{selected.id} · submitted {fmt(selected.created_at)} · {statusBadge(selected.status)}</DialogDescription>
              </DialogHeader>

              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" />Business</CardTitle></CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <div className="font-medium">{selected.business_name}</div>
                    <a className="text-blue-700 hover:underline inline-flex items-center gap-1" href={`/business/${selected.business_slug}`} target="_blank" rel="noreferrer">Open listing <ExternalLink className="h-3 w-3" /></a>
                    {selected.website && <div className="text-gray-600">{selected.website}</div>}
                    <div>Licence: <b>{selected.licence_number || "—"}</b></div>
                    <div>Authority: {selected.licence_authority || "—"}</div>
                    <div>Expiry: {selected.licence_expiry ? format(new Date(selected.licence_expiry), "dd MMM yyyy") : "—"}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" />Owner & contact checks</CardTitle></CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <div>{selected.requester_name || "—"} · {selected.requester_email || "no account email"}</div>
                    <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{selected.business_email || "—"} {selected.email_verified_at ? <Badge className="bg-green-100 text-green-800">confirmed</Badge> : <Badge variant="outline">not confirmed</Badge>}</div>
                    <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{selected.phone || "—"} {selected.phone_verified_at ? <Badge className="bg-green-100 text-green-800">confirmed</Badge> : <Badge variant="outline">not confirmed</Badge>}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" />Documents ({selected.documents.length})</CardTitle></CardHeader>
                <CardContent>
                  {selected.documents.length === 0 ? <p className="text-sm text-[#B45309]">The owner has not uploaded any documents yet.</p> : (
                    <div className="divide-y">
                      {selected.documents.map((d, i) => (
                        <div key={d.id ?? `ext-${i}`} className="py-2 flex flex-wrap items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{d.file_name}</div>
                            <div className="text-gray-500">{DOC_LABEL[d.doc_type] || d.doc_type}{d.size_bytes ? ` · ${size(d.size_bytes)}` : ""}{d.created_at ? ` · ${fmt(d.created_at)}` : ""}</div>
                          </div>
                          <Button asChild size="sm" variant="outline"><a href={d.url} target="_blank" rel="noopener noreferrer"><Eye className="h-4 w-4 mr-1" />View</a></Button>
                          {!d.external && <Button asChild size="sm" variant="outline"><a href={d.downloadUrl} download={d.file_name}><Download className="h-4 w-4 mr-1" />Download</a></Button>}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {selected.rejection_reason && <p className="text-sm text-red-700"><b>Rejection reason:</b> {selected.rejection_reason}</p>}
              {selected.status !== "approved" && selected.status !== "rejected" ? (
                <div className="space-y-1">
                  <label className="text-sm font-medium">Review notes (internal, saved with the approval)</label>
                  <Textarea rows={3} value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} placeholder="e.g. Licence checked on DET portal, valid until 2027" />
                </div>
              ) : selected.admin_notes ? <p className="text-sm text-gray-700"><b>Notes:</b> {selected.admin_notes}</p> : null}

              <DialogFooter className="gap-2 flex-wrap">
                {selected.status === "pending" && (
                  <Button variant="outline" disabled={busy} onClick={() => startReviewMutation.mutate(selected.id)}><Clock className="h-4 w-4 mr-1" />Start review</Button>
                )}
                {selected.status !== "rejected" && selected.status !== "approved" && (
                  <Button variant="destructive" disabled={busy} onClick={() => setShowRejectDialog(true)}><XCircle className="h-4 w-4 mr-1" />Reject</Button>
                )}
                {selected.status !== "approved" && (
                  <Button className="bg-green-600 hover:bg-green-700 text-white" disabled={busy} onClick={() => approveMutation.mutate({ requestId: selected.id, notes: reviewNotes })}>
                    <CheckCircle className="h-4 w-4 mr-1" />{approveMutation.isPending ? "Approving…" : "Approve Verification"}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject reason form */}
      <Dialog open={showRejectDialog} onOpenChange={(o) => { if (!o) { setShowRejectDialog(false); setRejectReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject verification</DialogTitle>
            <DialogDescription>{selected?.business_name} — the reason is emailed to the owner so they can fix it.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            {["Trade licence is expired", "Licence number does not match the document", "Document is unreadable – please upload a clearer copy", "Business name does not match the licence", "Could not confirm the business email or phone"].map((r) => (
              <button key={r} type="button" className="rounded-full border px-3 py-1 text-xs hover:bg-gray-100" onClick={() => setRejectReason(r)}>{r}</button>
            ))}
          </div>
          <Textarea rows={4} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for rejection (required)" />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowRejectDialog(false); setRejectReason(""); }}>Back</Button>
            <Button variant="destructive" disabled={rejectReason.trim().length < 5 || rejectMutation.isPending || !selected}
              onClick={() => selected && rejectMutation.mutate({ requestId: selected.id, reason: rejectReason.trim() })}>
              {rejectMutation.isPending ? "Rejecting…" : "Confirm rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
