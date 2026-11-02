import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, ShieldCheck, MessageSquareReply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { api, BUDGET_BANDS, DURATIONS, fmtDate } from "./api";
import { t as tx } from "@shared/i18n";
import { tj } from "@/i18n-jsx/tj";

interface Props { businessId: number; businessName: string; ownerId?: string | null }

const SCORES: { key: "quality" | "cost" | "schedule" | "refer"; label: string; hint: string }[] = [
  { key: "quality", label: "Quality of work", hint: "Did the result meet the brief?" },
  { key: "cost", label: "Value for money", hint: "Was the price fair for what you got?" },
  { key: "schedule", label: "On schedule", hint: "Were deadlines kept?" },
  { key: "refer", label: "Would recommend", hint: "Would you refer them to a friend?" },
];

function Stars({ value, onChange, size = 18 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" role={onChange ? "radiogroup" : undefined}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" disabled={!onChange} onClick={() => onChange?.(n)} aria-label={tx("{0} star{1}", n, n > 1 ? "s" : "")}
          className={onChange ? "cursor-pointer" : "cursor-default"}>
          <Star style={{ width: size, height: size }} className={n <= Math.round(value) ? "fill-[#F59E0B] text-[#F59E0B]" : "text-[#D5D9E0]"} />
        </button>
      ))}
    </span>
  );
}

function ScoreBar({ label, value }: { label: string; value: number | null }) {
  const v = Number(value || 0);
  return (
    <div className="grid grid-cols-[minmax(96px,140px)_1fr_32px] items-center gap-3 text-sm text-[#3A4354]">
      <span>{label}</span>
      <div className="h-2 overflow-hidden rounded-full bg-[#EEF0F4]"><div className="h-full rounded-full bg-[#0B6B2E]" style={{ width: `${(v / 5) * 100}%` }} /></div>
      <strong className="text-end font-semibold text-[#0A0A0A]">{v ? v.toFixed(1) : "–"}</strong>
    </div>
  );
}

export function StructuredReviews({ businessId, businessName, ownerId }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuth() as any;
  const isOwner = !!user && (String(user.id) === String(ownerId) || user.role === "admin" || user.role === "super_admin");
  const [open, setOpen] = useState(false);
  const [replyFor, setReplyFor] = useState<number | null>(null);
  const [reply, setReply] = useState("");
  const [form, setForm] = useState({ quality: 0, cost: 0, schedule: 0, refer: 0, title: "", content: "", projectType: "", budgetBand: "", duration: "", reviewerName: "", reviewerCompany: "", reviewerRole: "", reviewerEmail: "", reviewerLinkedin: "" });

  const { data, isLoading } = useQuery({ queryKey: [`/api/businesses/${businessId}/structured-reviews`], queryFn: () => api(`/api/businesses/${businessId}/structured-reviews`) });
  const submit = useMutation({
    mutationFn: () => api(`/api/businesses/${businessId}/structured-reviews`, { method: "POST", json: form }),
    onSuccess: (r: any) => { toast({ title: "Review submitted", description: r.message }); setOpen(false); },
    onError: (e: any) => toast({ title: "Could not submit", description: e.message, variant: "destructive" }),
  });
  const sendReply = useMutation({
    mutationFn: (id: number) => api(`/api/reviews/${id}/reply`, { method: "POST", json: { response: reply } }),
    onSuccess: () => { toast({ title: "Reply posted" }); setReplyFor(null); setReply(""); qc.invalidateQueries({ queryKey: [`/api/businesses/${businessId}/structured-reviews`] }); },
    onError: (e: any) => toast({ title: "Could not reply", description: e.message, variant: "destructive" }),
  });

  const s = data?.summary || {};
  const items: any[] = data?.items || [];
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const initials = (name?: string) => String(name || "").trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "–";

  return (
    <div className="yp-card p-6 md:p-7">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-[#0A0A0A]">Reviews</h2>
          <p className="mt-1 text-sm leading-[1.55] text-[#5B6475]">Verified, structured feedback from real clients – every review is checked by our team before it appears.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="outline">Write a review</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{tj("Review {0}", businessName)}</DialogTitle></DialogHeader>
            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); submit.mutate(); }}>
              <div className="grid sm:grid-cols-2 gap-4">
                {SCORES.map((sc) => (
                  <div key={sc.key} className="rounded-[14px] border border-[#E7E9EE] p-3">
                    <div className="font-medium text-sm">{sc.label}</div>
                    <div className="text-xs text-[#5B6475] mb-1">{sc.hint}</div>
                    <Stars value={form[sc.key]} onChange={(v) => set(sc.key, v)} size={22} />
                  </div>
                ))}
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <Input placeholder="Type of work, e.g. Office fit-out" value={form.projectType} onChange={(e) => set("projectType", e.target.value)} />
                <select className="min-h-[44px] rounded-xl border border-[#DDE1E8] bg-white px-3 text-sm" value={form.budgetBand} onChange={(e) => set("budgetBand", e.target.value)}>
                  <option value="">Project budget (optional)</option>{BUDGET_BANDS.map((b) => <option key={b}>{b}</option>)}
                </select>
                <select className="min-h-[44px] rounded-xl border border-[#DDE1E8] bg-white px-3 text-sm" value={form.duration} onChange={(e) => set("duration", e.target.value)}>
                  <option value="">Engagement length (optional)</option>{DURATIONS.map((b) => <option key={b}>{b}</option>)}
                </select>
              </div>
              <Input placeholder="Headline, e.g. Delivered our warehouse on time" value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={160} />
              <Textarea required minLength={80} rows={5} placeholder="What did they do for you, what went well, what could be better? (at least 80 characters)" value={form.content} onChange={(e) => set("content", e.target.value)} />
              <div className="yp-panel p-4 space-y-3">
                <div className="text-sm font-medium">About you <span className="text-[#5B6475] font-normal">– we use this to confirm the review is genuine; your email is never shown.</span></div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input required placeholder="Full name *" value={form.reviewerName} onChange={(e) => set("reviewerName", e.target.value)} />
                  <Input required type="email" placeholder="Work email *" value={form.reviewerEmail} onChange={(e) => set("reviewerEmail", e.target.value)} />
                  <Input placeholder="Company" value={form.reviewerCompany} onChange={(e) => set("reviewerCompany", e.target.value)} />
                  <Input placeholder="Your role, e.g. Operations Manager" value={form.reviewerRole} onChange={(e) => set("reviewerRole", e.target.value)} />
                  <Input className="sm:col-span-2" placeholder="LinkedIn profile URL (speeds up verification)" value={form.reviewerLinkedin} onChange={(e) => set("reviewerLinkedin", e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submit.isPending}>{submit.isPending ? "Sending…" : "Submit review"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex flex-col">
        {isLoading ? <p className="text-[#5B6475]">Loading reviews…</p> : s.count > 0 ? (
          <div className="flex flex-wrap gap-8 border-b border-[#EEF0F4] pb-6">
            <div className="flex-none">
              <div className="text-[56px] font-bold leading-none tracking-[-0.05em] text-[#0A0A0A]">{Number(s.overall).toFixed(1)}</div>
              <div className="mt-2" role="img" aria-label={tx("{0} out of 5 stars", Number(s.overall).toFixed(1))}><Stars value={Number(s.overall)} /></div>
              <div className="mt-1.5 text-sm text-[#5B6475]">{tj("{0} review{1}{2}", s.count, s.count === 1 ? "" : "s", s.verified ? ` · ${s.verified} verified` : "")}</div>
              {s.budgets?.[0] && <div className="mt-1 text-xs text-[#5B6475]">{tj("Typical project: {0}", s.budgets[0].budget_band)}</div>}
            </div>
            <div className="grid min-w-0 flex-[1_1_280px] content-center gap-3.5">
              <ScoreBar label="Quality of work" value={s.quality} /><ScoreBar label="Value for money" value={s.cost} />
              <ScoreBar label="On schedule" value={s.schedule} /><ScoreBar label="Would recommend" value={s.refer} />
            </div>
          </div>
        ) : (
          <p className="yp-panel p-4 text-[#4B5565]">{tj("No reviews yet. Worked with {0}? Be the first to share how it went.", businessName)}</p>
        )}
        <div className="flex flex-col">
          {items.map((r) => (
            <article key={r.id} className="flex flex-col gap-2.5 border-b border-[#EEF0F4] py-6 last:border-b-0 last:pb-0">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#F1F2F6] text-sm font-semibold text-[#0A0A0A]" aria-hidden="true">{initials(r.reviewer_name)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-[#0A0A0A]">{r.reviewer_name}{r.reviewer_role ? `, ${r.reviewer_role}` : ""}{r.reviewer_company ? tx(" at {0}", r.reviewer_company) : ""}</span>
                  <span className="block text-[13px] text-[#5B6475]"><time>{fmtDate(r.created_at)}</time>{r.project_type ? ` · ${r.project_type}` : ""}</span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[#0A0A0A]"><Star className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B]" aria-hidden="true" />{Number(r.rating || 0).toFixed(1)}</span>
              </div>
              {r.is_verified && <span className="yp-verified self-start"><ShieldCheck className="h-3 w-3" aria-hidden="true" /> Verified client</span>}
              {r.title && <h3 className="font-semibold text-[#0A0A0A]">{r.title}</h3>}
              <p className="whitespace-pre-line text-[15px] leading-[1.65] text-[#3A4354]">{r.content}</p>
              {(r.budget_band || r.duration) && (
                <div className="flex flex-wrap gap-1.5">
                  {r.budget_band && <span className="yp-tag">{tj("Budget: {0}", r.budget_band)}</span>}
                  {r.duration && <span className="yp-tag">{tj("Duration: {0}", r.duration)}</span>}
                </div>
              )}
              {r.response && (
                <div className="rounded-xl bg-[#F7F8FA] px-3.5 py-3 text-sm text-[#3A4354]">
                  <strong className="text-[#0A0A0A]">{tj("Response from {0}", businessName)}</strong>
                  <p className="mt-1 whitespace-pre-line">{r.response}</p>
                </div>
              )}
              {isOwner && !r.response && (
                replyFor === r.id ? (
                  <div className="space-y-2">
                    <Textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Thank the client or address the feedback…" />
                    <div className="flex gap-2"><Button size="sm" onClick={() => sendReply.mutate(r.id)} disabled={sendReply.isPending}>Post reply</Button><Button size="sm" variant="ghost" onClick={() => setReplyFor(null)}>Cancel</Button></div>
                  </div>
                ) : <Button size="sm" variant="outline" className="self-start" onClick={() => setReplyFor(r.id)}><MessageSquareReply className="h-4 w-4 me-1" /> Reply as owner</Button>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
