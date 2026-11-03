/**
 * Admin: Saudi Life rules and rates (English only, like the rest of the admin panel).
 * Editors (super_admin, admin, content_manager) change rates, sources and verification dates without code changes;
 * reviewers (moderator, business_manager) can read. Every change is recorded in the audit log.
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/header";
import SEO from "@/components/seo";

interface Row { id: string; data: any; seed_version?: string; updated_at: string; updated_by?: string }

async function api(method: string, url: string, body?: any) {
  const res = await fetch(url, { method, credentials: "include", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `${res.status}`);
  return json;
}

function RuleEditor({ row, onSaved }: { row: Row; onSaved: () => void }) {
  const d = row.data || {};
  const [values, setValues] = useState(JSON.stringify(d.values ?? {}, null, 2));
  const [sources, setSources] = useState(JSON.stringify(d.sources ?? [], null, 2));
  const [meta, setMeta] = useState({ summary_en: d.summary_en || "", summary_ar: d.summary_ar || "", confidence: d.confidence || "secondary", verifiedOn: d.verifiedOn || "", effectiveFrom: d.effectiveFrom || "", notes: d.notes || "" });
  const [state, setState] = useState<{ busy?: boolean; error?: string; ok?: boolean }>({});
  const save = async () => {
    setState({ busy: true });
    try {
      const body = { ...meta, effectiveFrom: meta.effectiveFrom || null, values: JSON.parse(values), sources: JSON.parse(sources) };
      await api("PUT", `/api/admin/life/rules/${row.id}`, body);
      setState({ ok: true }); onSaved();
    } catch (e: any) { setState({ error: e instanceof SyntaxError ? `JSON error: ${e.message}` : e.message }); }
  };
  const field = (k: keyof typeof meta, label: string, type = "text") => (
    <label className="flex flex-col gap-1 text-sm font-medium">{label}
      {k === "confidence"
        ? <select className="yp-input" value={meta.confidence} onChange={(e) => setMeta({ ...meta, confidence: e.target.value })}><option>confirmed</option><option>secondary</option><option>unconfirmed</option></select>
        : <input className="yp-input" type={type} dir={k === "summary_ar" ? "rtl" : "ltr"} value={meta[k]} onChange={(e) => setMeta({ ...meta, [k]: e.target.value })} />}
    </label>
  );
  return (
    <div className="grid gap-3 border-t border-[#EEF0F4] pt-4">
      <div className="grid gap-3 md:grid-cols-3">{field("confidence", "Confidence")}{field("verifiedOn", "Verified on", "date")}{field("effectiveFrom", "Effective from", "date")}</div>
      {field("summary_en", "Summary (English)")}{field("summary_ar", "Summary (Arabic)")}{field("notes", "Internal notes")}
      <label className="flex flex-col gap-1 text-sm font-medium">Values (JSON)<textarea className="yp-input min-h-[200px] font-mono text-xs" dir="ltr" value={values} onChange={(e) => setValues(e.target.value)} /></label>
      <label className="flex flex-col gap-1 text-sm font-medium">Sources (JSON list of {"{title, url, publisher, accessed}"})<textarea className="yp-input min-h-[120px] font-mono text-xs" dir="ltr" value={sources} onChange={(e) => setSources(e.target.value)} /></label>
      <div className="flex items-center gap-3">
        <button type="button" className="yp-btn yp-btn-red" disabled={state.busy} onClick={save}>{state.busy ? "Saving…" : "Save"}</button>
        {state.ok && <span className="text-sm text-[#047857]">Saved. Live within a minute.</span>}
        {state.error && <span role="alert" className="text-sm text-[#B91C1C]">{state.error}</span>}
      </div>
    </div>
  );
}

export default function SaudiLifeAdmin() {
  const qc = useQueryClient();
  const rules = useQuery<Row[]>({ queryKey: ["/api/admin/life/rules"], queryFn: () => api("GET", "/api/admin/life/rules"), retry: false });
  const audit = useQuery<any[]>({ queryKey: ["/api/admin/life/audit"], queryFn: () => api("GET", "/api/admin/life/audit?limit=50"), retry: false });
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const refresh = () => { qc.invalidateQueries({ queryKey: ["/api/admin/life/rules"] }); qc.invalidateQueries({ queryKey: ["/api/admin/life/audit"] }); };
  const stale = (r: Row) => !r.data?.verifiedOn || (Date.now() - Date.parse(r.data.verifiedOn)) / 86400000 > 180;
  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <SEO title="Saudi Life rules | Admin" description="Manage Saudi Life rules and rates" robotsContent="noindex, nofollow" />
      <Header />
      <main className="yp-wrap flex flex-col gap-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Saudi Life — rules and rates</h1>
          <p className="mt-2 max-w-3xl text-[#3A4354]">Official rates, tariffs and dates used by the calculators and the holidays page. Update the values, the sources and the date you verified them; calculators use the new values within a minute. Rules not verified for 180 days are flagged.</p>
          <p className="mt-2 text-sm"><Link href="/saudi-life" className="text-[#006C35] underline">Open Saudi Life</Link></p>
        </div>
        {rules.isError && <p role="alert" className="rounded-xl bg-[#FDECEC] p-4 text-[#B91C1C]">{(rules.error as Error).message === "Sign in required" ? "Sign in with an admin account to manage rules." : `Could not load rules: ${(rules.error as Error).message}`}</p>}
        {rules.data && (
          <section className="flex flex-col gap-3">
            <input className="yp-input max-w-md" placeholder="Filter rules…" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter rules" />
            {rules.data.filter((r) => r.id.includes(filter.toLowerCase())).map((r) => (
              <div key={r.id} className="rounded-2xl border border-[#E7E9EE] bg-white p-4">
                <button type="button" className="flex w-full flex-wrap items-center justify-between gap-2 text-start" onClick={() => setOpen(open === r.id ? null : r.id)} aria-expanded={open === r.id}>
                  <span className="font-mono font-semibold">{r.id}</span>
                  <span className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded-full px-2 py-0.5 ${r.data?.confidence === "confirmed" ? "bg-[#E6F2EC] text-[#004D26]" : r.data?.confidence === "unconfirmed" ? "bg-[#FDECEC] text-[#B91C1C]" : "bg-[#FFF4E0] text-[#B45309]"}`}>{r.data?.confidence || "—"}</span>
                    <span className={stale(r) ? "text-[#B91C1C]" : "text-[#5B6475]"}>verified {r.data?.verifiedOn || "never"}</span>
                    <span className="text-[#5B6475]">updated by {r.updated_by || "—"}</span>
                  </span>
                </button>
                {open === r.id && <RuleEditor row={r} onSaved={refresh} />}
              </div>
            ))}
          </section>
        )}
        {audit.data && (
          <section className="rounded-2xl border border-[#E7E9EE] bg-white p-5">
            <h2 className="text-xl font-semibold">Audit log</h2>
            {audit.data.length === 0 ? <p className="mt-2 text-sm text-[#5B6475]">No changes yet.</p> : (
              <table className="mt-3 w-full text-sm"><thead><tr className="text-start text-[#5B6475]"><th className="py-1 text-start">When</th><th className="text-start">Rule</th><th className="text-start">Action</th><th className="text-start">By</th></tr></thead>
                <tbody>{audit.data.map((a) => <tr key={a.id} className="border-t border-[#EEF0F4]"><td className="py-1.5">{new Date(a.at).toLocaleString("en-GB")}</td><td className="font-mono">{a.entity_id}</td><td>{a.action}</td><td>{a.user_email || "—"}</td></tr>)}</tbody></table>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
