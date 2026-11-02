import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api, BUDGET_BANDS, TIMELINES } from "./api";
import { country } from "@shared/country";
import { tj } from "@/i18n-jsx/tj";
import { t as tx } from "@shared/i18n";

interface Props {
  /** Profile page: the one business that receives the request. */
  businessId?: number; businessName?: string;
  /** Category page: the request goes to up to 5 matching businesses. */
  categoryId?: number; categoryName?: string;
  compact?: boolean;
  /** Narrow sidebar placement: one field per row, short heading. */
  stacked?: boolean;
}

export function QuoteRequestCard({ businessId, businessName, categoryId, categoryName, compact, stacked }: Props) {
  const { toast } = useToast();
  const [done, setDone] = useState<string | null>(null);
  const [f, setF] = useState({ name: "", email: "", phone: "", company: "", serviceNeeded: "", budgetBand: "", timeline: "", message: "", provinceId: "" });
  const { data: provinces = [] } = useQuery<any[]>({ queryKey: ["/api/provinces"], enabled: !businessId });
  const send = useMutation({
    mutationFn: () => api("/api/leads", { method: "POST", json: { ...f, businessId, categoryId, provinceId: f.provinceId || undefined, source: businessId ? "profile" : "category" } }),
    onSuccess: (r: any) => { setDone(r.message); toast({ title: "Request sent", description: r.message }); },
    onError: (e: any) => toast({ title: "Could not send", description: e.message, variant: "destructive" }),
  });
  const set = (k: string, v: string) => setF((o) => ({ ...o, [k]: v }));
  const title = businessId ? `Get a quote from ${businessName}` : `Get quotes from ${categoryName || "businesses"} ${country.inName}`;

  const two = stacked ? "" : "sm:grid-cols-2";
  const full = stacked ? "" : "sm:col-span-2";
  const fld = "flex flex-col gap-1.5 text-[13px] font-medium text-[#3A4354]";
  const selectCls = "min-h-[44px] w-full rounded-xl border border-[#DDE1E8] bg-white px-3 text-[15px] text-[#0A0A0A] focus:border-[#0B6B2E] focus:outline-none focus:ring-2 focus:ring-[#BFE3CD]";

  return (
    <div className={`yp-card flex flex-col gap-4 ${stacked || compact ? "p-6" : "p-6 md:p-7"}`}>
      <div>
        <h2 className={`font-semibold tracking-[-0.02em] text-[#0A0A0A] ${stacked ? "text-lg" : "text-[22px]"}`}>{stacked && businessId ? "Request a quote" : title}</h2>
        <p className="mt-1.5 text-sm leading-[1.55] text-[#5B6475]">{businessId ? "Describe what you need and the business will reply by email or phone. Free, no obligation." : "Tell us what you need once – we send it to up to 5 matching businesses and they come back to you with quotes."}</p>
      </div>
      {done ? (
        <div className="yp-tint flex items-start gap-2.5 rounded-[14px] p-4 text-sm text-[#05501F]"><Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span>{tj("{0} We've emailed you a copy for your records.", done)}</span></div>
      ) : (
        <form className={`grid gap-3.5 ${two}`} onSubmit={(e) => { e.preventDefault(); send.mutate(); }}>
          <label className={`${fld} ${full}`}>What do you need?
            <Input placeholder="e.g. Annual audit for a trading LLC" value={f.serviceNeeded} onChange={(e) => set("serviceNeeded", e.target.value)} />
          </label>
          <label className={fld}>Your name *
            <Input required placeholder="Your name *" value={f.name} onChange={(e) => set("name", e.target.value)} />
          </label>
          <label className={fld}>Email *
            <Input required type="email" placeholder="Email *" value={f.email} onChange={(e) => set("email", e.target.value)} />
          </label>
          <label className={fld}>Phone / WhatsApp
            <Input placeholder="Phone / WhatsApp" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
          </label>
          <label className={fld}>Company
            <Input placeholder="Company (optional)" value={f.company} onChange={(e) => set("company", e.target.value)} />
          </label>
          {!businessId && (
            <label className={fld}>{country.regionTerm.singular}
              <select className={selectCls} value={f.provinceId} onChange={(e) => set("provinceId", e.target.value)}>
                <option value="">{tx("Any {0}", country.regionTerm.singular.toLowerCase())}</option>
                {provinces.map((em: any) => <option key={em.id} value={em.id}>{em.name}</option>)}
              </select>
            </label>
          )}
          <label className={fld}>Budget
            <select className={selectCls} value={f.budgetBand} onChange={(e) => set("budgetBand", e.target.value)}>
              <option value="">Budget (optional)</option>{BUDGET_BANDS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </label>
          <label className={`${fld} ${businessId ? "" : full}`}>Timeline
            <select className={selectCls} value={f.timeline} onChange={(e) => set("timeline", e.target.value)}>
              <option value="">When do you need it?</option>{TIMELINES.map((b) => <option key={b}>{b}</option>)}
            </select>
          </label>
          <label className={`${fld} ${full}`}>Details *
            <Textarea required minLength={20} rows={4} placeholder="Scope, location, quantities, deadlines… (20+ characters)" value={f.message} onChange={(e) => set("message", e.target.value)} />
          </label>
          <div className={`${full} flex flex-col gap-3 ${stacked ? "" : "sm:flex-row sm:items-center sm:justify-between"}`}>
            <span className="text-xs leading-[1.5] text-[#5B6475]">By sending you agree that the business(es) may contact you about this request.</span>
            <Button type="submit" disabled={send.isPending} className={`min-h-[48px] ${stacked ? "w-full" : ""}`}>{send.isPending ? "Sending…" : businessId ? (stacked ? "Send request" : "Request a quote") : "Get quotes"}</Button>
          </div>
        </form>
      )}
    </div>
  );
}
