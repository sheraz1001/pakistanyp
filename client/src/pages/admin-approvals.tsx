import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Check, X, Mail, ExternalLink, Phone, Globe, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { StatusPill } from "@/components/phase1/nav";
import { AdminOpsShell as OpsShell } from "@/components/admin/admin-shell";
import { SEO } from "@/components/seo";
import { api, fmtDate } from "@/components/phase1/api";

type Status = "pending" | "approved" | "rejected";
type Tree = { id: number; name: string; children: { id: number; name: string }[] }[];
const REASONS = ["Incomplete or unclear business details", "Duplicate of an existing listing", "Wrong or misleading category", "Could not verify the business / trade licence", "Contact details not working", "Inappropriate content"];

/** Category picker: main categories as groups, subcategories as options (a main category can be picked too). */
function CategorySelect({ tree, value, onChange, disabled }: { tree: Tree; value?: number | null; onChange: (id: number) => void; disabled?: boolean }) {
  return (
    <select className="h-9 w-full rounded-md border bg-white px-2 text-sm" value={value || ""} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))}>
      <option value="" disabled>— choose category —</option>
      {tree.map((p) => (
        <optgroup key={p.id} label={p.name}>
          <option value={p.id}>{p.name} (main)</option>
          {p.children.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </optgroup>
      ))}
    </select>
  );
}

export default function AdminApprovals() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [status, setStatus] = useState<Status>("pending");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [notify, setNotify] = useState(true);
  const [rejecting, setRejecting] = useState<number[] | null>(null);
  const [reason, setReason] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const key = ["/api/admin/approvals", status, q];
  const { data, isLoading, error } = useQuery<{ items: any[]; counts: Record<Status, number> }>({
    queryKey: key, queryFn: () => api(`/api/admin/approvals?status=${status}&q=${encodeURIComponent(q)}`),
  });
  const { data: tree = [] } = useQuery<Tree>({ queryKey: ["/api/admin/category-tree"], queryFn: () => api("/api/admin/category-tree"), staleTime: 600000 });
  const items = data?.items || [];
  const allChecked = items.length > 0 && items.every((b) => selected.has(b.id));
  const refresh = () => qc.invalidateQueries({ queryKey: ["/api/admin/approvals"] });

  const setCategory = useMutation({
    mutationFn: ({ id, categoryId }: { id: number; categoryId: number }) => api(`/api/admin/businesses/${id}/category`, { method: "PATCH", json: { categoryId } }),
    onSuccess: (r: any) => { toast({ title: "Category updated", description: r.categoryName }); refresh(); },
    onError: (e: any) => toast({ title: "Could not change category", description: e.message, variant: "destructive" }),
  });
  const decide = useMutation({
    mutationFn: (v: { ids: number[]; action: "approve" | "reject"; reason?: string }) => api("/api/admin/approvals/bulk", { method: "POST", json: { ...v, notify } }),
    onSuccess: (r: any) => {
      const verb = r.action === "approve" ? "Approved" : "Rejected";
      const missing = r.noEmail?.length ? ` · no email address for: ${r.noEmail.slice(0, 3).join(", ")}${r.noEmail.length > 3 ? "…" : ""}` : "";
      toast({ title: `${verb} ${r.updated} listing${r.updated === 1 ? "" : "s"}`, description: notify ? `Emailed ${r.emailed} owner${r.emailed === 1 ? "" : "s"}${missing}` : "Owners were not emailed" });
      setSelected(new Set()); setRejecting(null); setReason(""); refresh();
    },
    onError: (e: any) => toast({ title: "Action failed", description: e.message, variant: "destructive" }),
  });

  const toggle = (id: number) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(items.map((b) => b.id)));
  const ids = useMemo(() => Array.from(selected), [selected]);
  const switchTab = (s: Status) => { setStatus(s); setSelected(new Set()); };

  return (
    <OpsShell kind="admin" title="Business approvals" subtitle="Check each listing and its category, then approve or reject — one at a time or in bulk. Owners get an email with the result (and the reason, if rejected).">
      <SEO title="Approvals | PakistanYP Admin" description="Admin" robotsContent="noindex, nofollow" />
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(["pending", "approved", "rejected"] as Status[]).map((s) => (
          <button key={s} onClick={() => switchTab(s)} className="yp-chip capitalize" data-active={status === s ? "true" : undefined}>
            {s} {data?.counts ? <span className="ml-1 opacity-80">({data.counts[s]})</span> : null}
          </button>
        ))}
        <Input className="sm:ml-auto sm:w-72" placeholder="Search name or email…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {/* bulk bar */}
      <Card className="mb-4 sticky top-2 z-10">
        <CardContent className="p-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="h-4 w-4" checked={allChecked} onChange={toggleAll} disabled={!items.length} /> Select all ({items.length})</label>
          <span className="text-sm text-gray-600">{ids.length} selected</span>
          <label className="flex items-center gap-2 text-sm ml-auto"><input type="checkbox" className="h-4 w-4" checked={notify} onChange={(e) => setNotify(e.target.checked)} /><Mail className="h-4 w-4" /> Email owners</label>
          {status !== "approved" && <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" disabled={!ids.length || decide.isPending} onClick={() => decide.mutate({ ids, action: "approve" })}><Check className="h-4 w-4 mr-1" />Approve selected</Button>}
          {status !== "rejected" && <Button size="sm" variant="destructive" disabled={!ids.length || decide.isPending} onClick={() => setRejecting(ids)}><X className="h-4 w-4 mr-1" />Reject selected</Button>}
        </CardContent>
      </Card>

      {rejecting && (
        <Card className="mb-4 border-red-200">
          <CardContent className="p-4 space-y-3">
            <div className="font-medium">Reject {rejecting.length} listing{rejecting.length === 1 ? "" : "s"} — reason (sent to the owner{rejecting.length > 1 ? "s" : ""})</div>
            <div className="flex flex-wrap gap-2">{REASONS.map((r) => <button key={r} onClick={() => setReason(r)} className="rounded-full border px-3 py-1 text-xs hover:bg-gray-100">{r}</button>)}</div>
            <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain what needs fixing…" />
            <div className="flex gap-2">
              <Button variant="destructive" disabled={decide.isPending} onClick={() => decide.mutate({ ids: rejecting, action: "reject", reason })}>Confirm reject</Button>
              <Button variant="outline" onClick={() => { setRejecting(null); setReason(""); }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error && <Card className="mb-4"><CardContent className="p-4 text-red-700">{(error as any).message}</CardContent></Card>}
      {isLoading ? <p className="text-gray-600">Loading…</p> : items.length === 0 ? <Card><CardContent className="p-8 text-center text-gray-600">Nothing {status} right now.</CardContent></Card> : (
        <div className="space-y-2">
          {items.map((b) => {
            const parentMismatch = !b.category_id;
            return (
              <Card key={b.id} className={selected.has(b.id) ? "ring-2 ring-pk-navy/40" : ""}>
                <CardContent className="p-3">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-3">
                    <input type="checkbox" className="h-4 w-4 mt-1" checked={selected.has(b.id)} onChange={() => toggle(b.id)} aria-label={`Select ${b.name}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <button className="font-semibold text-left hover:underline" onClick={() => setExpanded(expanded === b.id ? null : b.id)}>{b.name}</button>
                        <StatusPill value={b.admin_approved ? "approved" : status === "rejected" ? "rejected" : "pending"} />
                        {b.slug && <Link href={`/business/${b.slug}`} target="_blank" className="text-gray-500 hover:text-gray-800" title="Open listing"><ExternalLink className="h-3.5 w-3.5" /></Link>}
                        <span className="text-xs text-gray-500">#{b.id} · {fmtDate(b.created_at)}</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-0.5">
                        {[b.locality_name, b.province_name].filter(Boolean).join(", ") || "No location"} · Owner: {b.owner_email || <span className="text-[#7C4A03]">no account email</span>}
                        {!b.owner_email && b.email ? ` (listing: ${b.email})` : ""}
                      </div>
                      {b.rejection_reason && <div className="text-xs text-red-700 mt-1">Rejected: {b.rejection_reason}</div>}
                      {expanded === b.id && (
                        <div className="mt-2 text-sm text-gray-700 space-y-1 border-t pt-2">
                          <p className="whitespace-pre-line">{(b.description || b.short_description || "No description").slice(0, 800)}</p>
                          <div className="flex flex-wrap gap-4 text-gray-600">
                            {b.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{b.phone}</span>}
                            {b.website && <a href={b.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline"><Globe className="h-3.5 w-3.5" />{b.website}</a>}
                            {b.trade_license && <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" />Licence {b.trade_license}</span>}
                            {b.address && <span>{b.address}</span>}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="lg:w-72">
                      <div className="text-xs text-gray-500 mb-1">Category {b.parent_category_name ? `· ${b.parent_category_name}` : ""}{parentMismatch ? <span className="text-[#7C4A03]"> · not set</span> : ""}</div>
                      <CategorySelect tree={tree} value={b.category_id} disabled={setCategory.isPending} onChange={(categoryId) => setCategory.mutate({ id: b.id, categoryId })} />
                    </div>
                    <div className="flex gap-2 lg:pt-5">
                      {!b.admin_approved && <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" disabled={decide.isPending} onClick={() => decide.mutate({ ids: [b.id], action: "approve" })} title="Approve"><Check className="h-4 w-4" /></Button>}
                      {status !== "rejected" && <Button size="sm" variant="destructive" disabled={decide.isPending} onClick={() => setRejecting([b.id])} title="Reject"><X className="h-4 w-4" /></Button>}
                    </div>
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
