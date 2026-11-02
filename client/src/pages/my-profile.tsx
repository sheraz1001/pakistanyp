import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Trash2, Upload, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { OwnerShell as OpsShell, OwnerPill as StatusPill } from "@/components/owner-shell";
import { SEO } from "@/components/seo";
import { country } from "@shared/country";
import { api } from "@/components/phase1/api";
import { t as tx } from "@shared/i18n";

type Extras = { servicePrices: any[]; portfolio: any[]; team: any[]; faqs: any[] };
const EMPTY: Extras = { servicePrices: [], portfolio: [], team: [], faqs: [] };

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData(); fd.append("image", file);
  const res = await fetch("/api/upload/image", { method: "POST", body: fd, credentials: "include" });
  const d = await res.json();
  if (!res.ok || !d.url) throw new Error(d.message || "Upload failed");
  return d.url;
}

function ImageField({ value, onChange }: { value?: string; onChange: (u: string) => void }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex items-center gap-2">
      {value ? <img src={value} alt="" className="h-12 w-12 rounded-xl object-cover border border-[#E7E9EE]" /> : <div className="h-12 w-12 rounded-xl bg-[#F1F2F6] border border-[#E7E9EE]" />}
      <label className="inline-flex items-center gap-1 text-sm cursor-pointer min-h-[40px] rounded-xl border border-[#E3E6EC] px-3 bg-white font-medium hover:border-[#C9CED8]"><Upload className="h-4 w-4" /> {busy ? "Uploading…" : "Upload"}
        <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setBusy(true); try { onChange(await uploadImage(f)); } catch (err: any) { toast({ title: "Upload failed", description: err.message, variant: "destructive" }); } finally { setBusy(false); } }} />
      </label>
      {value && <button type="button" className="text-xs text-red-600" onClick={() => onChange("")}>remove</button>}
    </div>
  );
}

export default function MyProfile() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const [businessId, setBusinessId] = useState<number | null>(Number(params.get("business")) || null);
  const [d, setD] = useState<Extras>(EMPTY);
  const { data: businesses = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/my/businesses"], queryFn: () => api("/api/my/businesses") });
  useEffect(() => { if (!businessId && businesses.length) setBusinessId(businesses[0].id); }, [businesses, businessId]);
  const { data } = useQuery({ queryKey: [`/api/my/businesses/${businessId}/extras`], queryFn: () => api(`/api/my/businesses/${businessId}/extras`), enabled: !!businessId });
  useEffect(() => { if (data) setD({ servicePrices: data.servicePrices, portfolio: data.portfolio, team: data.team, faqs: data.faqs }); }, [data]);
  const save = useMutation({
    mutationFn: () => api(`/api/my/businesses/${businessId}/extras`, { method: "PUT", json: d }),
    onSuccess: () => { toast({ title: "Profile updated", description: "Changes are live on your public page." }); qc.invalidateQueries({ queryKey: [`/api/my/businesses/${businessId}/extras`] }); qc.invalidateQueries({ queryKey: [`/api/businesses/${businessId}/extras`] }); },
    onError: (e: any) => toast({ title: "Could not save", description: e.message, variant: "destructive" }),
  });
  const paid = data?.tier && data.tier !== "free";
  const lim = data?.limits || { servicePrices: 30, portfolio: 12, team: 10, faqs: 15 };
  const upd = <K extends keyof Extras>(k: K, i: number, patch: any) => setD((o) => ({ ...o, [k]: o[k].map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
  const add = <K extends keyof Extras>(k: K, item: any) => setD((o) => (o[k].length >= (lim as any)[k] ? o : { ...o, [k]: [...o[k], item] }));
  const del = <K extends keyof Extras>(k: K, i: number) => setD((o) => ({ ...o, [k]: o[k].filter((_, j) => j !== i) }));
  const PaidNote = () => (!paid ? <div className="rounded-xl bg-[#F2F9F4] border border-[#CFE8D8] p-3 text-sm flex gap-2 items-start"><Lock className="h-4 w-4 mt-0.5 text-[#0B6B2E]" /><span>Portfolio and team are shown to visitors on Pro and Premium plans. You can prepare them now – <Link href={`/my-plan?business=${businessId}`} className="underline">upgrade</Link> to publish.</span></div> : null);

  return (
    <OpsShell title="Profile content" subtitle="Add the details buyers compare before they call: what you charge, what you have delivered, who they will work with, and answers to common questions (FAQs are also shown in Google results).">
      <SEO title="Edit profile content | PakistanYP" description="Edit your Pakistan Yellow Pages profile." robotsContent="noindex, nofollow" />
      {isLoading ? <p>Loading…</p> : businesses.length === 0 ? <Card><CardContent className="p-6 text-[#3A4354]">You don't manage any listings yet. Claim your business from its profile page first.</CardContent></Card> : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-[#283141]">Business
              <select className="ms-2 h-11 rounded-xl border border-[#DDE1E8] bg-white px-3 text-sm" value={businessId || ""} onChange={(e) => setBusinessId(Number(e.target.value))}>{businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
            </label>
            {data && <span className="text-sm">Plan: <StatusPill value={data.tier} /> · <Link href={`/business/${data.slug}`} className="underline">view public page</Link></span>}
            <Button className="ms-auto" onClick={() => save.mutate()} disabled={save.isPending || !businessId}>{save.isPending ? "Saving…" : "Save changes"}</Button>
          </div>

          <Card><CardHeader><CardTitle>Services &amp; prices <span className="text-sm font-normal text-gray-500">({d.servicePrices.length}/{lim.servicePrices})</span></CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {d.servicePrices.map((s, i) => (
                <div key={i} className="grid sm:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 items-start">
                  <Input placeholder="Service, e.g. VAT registration" value={s.name || ""} onChange={(e) => upd("servicePrices", i, { name: e.target.value })} />
                  <Input type="number" placeholder={tx("From ({0})", country.currency)} value={s.priceFrom || ""} onChange={(e) => upd("servicePrices", i, { priceFrom: e.target.value })} />
                  <Input type="number" placeholder={tx("To ({0})", country.currency)} value={s.priceTo || ""} onChange={(e) => upd("servicePrices", i, { priceTo: e.target.value })} />
                  <Input placeholder="Unit, e.g. per month" value={s.unit || ""} onChange={(e) => upd("servicePrices", i, { unit: e.target.value })} />
                  <button className="text-red-600 p-2" onClick={() => del("servicePrices", i)} title="Remove"><Trash2 className="h-4 w-4" /></button>
                  <Input className="sm:col-span-5" placeholder="Short description (optional)" value={s.description || ""} onChange={(e) => upd("servicePrices", i, { description: e.target.value })} />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => add("servicePrices", { name: "" })}><Plus className="h-4 w-4 me-1" /> Add service</Button>
            </CardContent></Card>

          <Card><CardHeader><CardTitle>Portfolio &amp; case studies <span className="text-sm font-normal text-gray-500">({d.portfolio.length}/{lim.portfolio})</span></CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <PaidNote />
              {d.portfolio.map((p, i) => (
                <div key={i} className="yp-panel p-4 space-y-2">
                  <div className="grid sm:grid-cols-[2fr_1fr_90px_auto] gap-2">
                    <Input placeholder="Project title *" value={p.title || ""} onChange={(e) => upd("portfolio", i, { title: e.target.value })} />
                    <Input placeholder="Client (optional)" value={p.client || ""} onChange={(e) => upd("portfolio", i, { client: e.target.value })} />
                    <Input type="number" placeholder="Year" value={p.year || ""} onChange={(e) => upd("portfolio", i, { year: e.target.value })} />
                    <button className="text-red-600 p-2" onClick={() => del("portfolio", i)} title="Remove"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <Textarea rows={3} placeholder="What was the brief, what did you deliver, what was the result?" value={p.description || ""} onChange={(e) => upd("portfolio", i, { description: e.target.value })} />
                  <div className="flex flex-wrap gap-3 items-center"><ImageField value={p.image} onChange={(u) => upd("portfolio", i, { image: u })} /><Input className="flex-1 min-w-[200px]" placeholder="Link (optional)" value={p.link || ""} onChange={(e) => upd("portfolio", i, { link: e.target.value })} /></div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => add("portfolio", { title: "" })}><Plus className="h-4 w-4 me-1" /> Add project</Button>
            </CardContent></Card>

          <Card><CardHeader><CardTitle>Team <span className="text-sm font-normal text-gray-500">({d.team.length}/{lim.team})</span></CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <PaidNote />
              {d.team.map((m, i) => (
                <div key={i} className="yp-panel p-4 grid sm:grid-cols-[auto_1fr_1fr_1fr_auto] gap-2 items-center">
                  <ImageField value={m.photo} onChange={(u) => upd("team", i, { photo: u })} />
                  <Input placeholder="Name *" value={m.name || ""} onChange={(e) => upd("team", i, { name: e.target.value })} />
                  <Input placeholder="Role" value={m.role || ""} onChange={(e) => upd("team", i, { role: e.target.value })} />
                  <Input placeholder="LinkedIn URL" value={m.linkedin || ""} onChange={(e) => upd("team", i, { linkedin: e.target.value })} />
                  <button className="text-red-600 p-2" onClick={() => del("team", i)} title="Remove"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => add("team", { name: "" })}><Plus className="h-4 w-4 me-1" /> Add person</Button>
            </CardContent></Card>

          <Card><CardHeader><CardTitle>FAQs <span className="text-sm font-normal text-gray-500">({d.faqs.length}/{lim.faqs})</span></CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {d.faqs.map((f, i) => (
                <div key={i} className="yp-panel p-4 space-y-2">
                  <div className="flex gap-2"><Input placeholder="Question, e.g. Do you work with free-zone companies?" value={f.question || ""} onChange={(e) => upd("faqs", i, { question: e.target.value })} /><button className="text-red-600 p-2" onClick={() => del("faqs", i)} title="Remove"><Trash2 className="h-4 w-4" /></button></div>
                  <Textarea rows={2} placeholder="Answer" value={f.answer || ""} onChange={(e) => upd("faqs", i, { answer: e.target.value })} />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => add("faqs", { question: "", answer: "" })}><Plus className="h-4 w-4 me-1" /> Add question</Button>
            </CardContent></Card>
          <div className="flex justify-end"><Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save changes"}</Button></div>
        </div>
      )}
    </OpsShell>
  );
}
