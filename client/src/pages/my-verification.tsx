import { VerificationDocuments } from "@/components/phase1/verification-documents";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ShieldCheck, Mail, Phone, FileCheck2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { OwnerShell as OpsShell, OwnerPill as StatusPill } from "@/components/owner-shell";
import { SEO } from "@/components/seo";
import { api, LICENCE_AUTHORITIES, fmtDate } from "@/components/phase1/api";

export default function MyVerification() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const [businessId, setBusinessId] = useState<number | null>(Number(params.get("business")) || null);
  const [otp, setOtp] = useState("");
  const [f, setF] = useState({ licenceNumber: "", licenceAuthority: "", licenceExpiry: "", licenceDocumentUrl: "", businessEmail: "", phone: "" });
  const { data: businesses = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/my/businesses"], queryFn: () => api("/api/my/businesses") });
  useEffect(() => { if (!businessId && businesses.length) setBusinessId(businesses[0].id); }, [businesses, businessId]);
  const biz = businesses.find((b) => b.id === businessId);
  const { data: v } = useQuery({ queryKey: [`/api/businesses/${businessId}/verification`], queryFn: () => api(`/api/businesses/${businessId}/verification`), enabled: !!businessId });
  useEffect(() => { if (biz) setF((o) => ({ ...o, licenceNumber: o.licenceNumber || biz.trade_license || "", businessEmail: o.businessEmail || biz.email || "", phone: o.phone || biz.phone || "" })); }, [biz]);
  useEffect(() => {
    const e = params.get("email");
    if (e === "confirmed") toast({ title: "Email confirmed", description: "Thanks – the business email is now verified." });
    if (e === "invalid") toast({ title: "Link expired", description: "Submit the form again to get a new confirmation email.", variant: "destructive" });
  }, []);

  const submit = useMutation({
    mutationFn: () => api(`/api/businesses/${businessId}/verification`, { method: "POST", json: f }),
    onSuccess: (r: any) => { toast({ title: "Request sent", description: r.message }); qc.invalidateQueries({ queryKey: [`/api/businesses/${businessId}/verification`] }); qc.invalidateQueries({ queryKey: ["/api/my/businesses"] }); },
    onError: (e: any) => toast({ title: "Check the form", description: e.message, variant: "destructive" }),
  });
  const sendOtp = useMutation({
    mutationFn: () => api(`/api/businesses/${businessId}/verification/phone/send`, { method: "POST", json: {} }),
    onSuccess: (r: any) => toast({ title: r.sent ? "Code sent by SMS" : "Phone check", description: r.message || "Enter the 6-digit code you received." }),
    onError: (e: any) => toast({ title: "Could not send code", description: e.message, variant: "destructive" }),
  });
  const confirmOtp = useMutation({
    mutationFn: () => api(`/api/businesses/${businessId}/verification/phone/confirm`, { method: "POST", json: { code: otp } }),
    onSuccess: () => { toast({ title: "Phone confirmed" }); qc.invalidateQueries({ queryKey: [`/api/businesses/${businessId}/verification`] }); },
    onError: (e: any) => toast({ title: "Wrong code", description: e.message, variant: "destructive" }),
  });
  const set = (k: string, val: string) => setF((o) => ({ ...o, [k]: val }));

  return (
    <OpsShell title="Get your business verified" subtitle="Verified businesses show a green badge, rank higher in category lists and receive more quote requests. It is free and takes about two working days.">
      <SEO title="Business verification | PakistanYP" description="Verify your business on Pakistan Yellow Pages." robotsContent="noindex, nofollow" />
      {isLoading ? <p>Loading your businesses…</p> : businesses.length === 0 ? (
        <Card><CardContent className="p-6 text-[#3A4354]">
          <p>You don't manage any listings yet. <Link href="/add-business" className="text-[#0B6B2E] underline">Add your business</Link> or find it in the directory and click <b>Claim this business</b>.</p>
        </CardContent></Card>
      ) : (
        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          <div className="space-y-3">
            {businesses.map((b) => (
              <button key={b.id} onClick={() => setBusinessId(b.id)} type="button" aria-pressed={b.id === businessId} className={`w-full text-left rounded-[20px] border p-4 bg-white ${b.id === businessId ? "border-[#0B6B2E] ring-1 ring-[#0B6B2E]" : "border-[#E7E9EE] hover:border-[#CFE8D8]"}`}>
                <div className="font-medium">{b.name}</div>
                <div className="text-xs text-gray-500">{b.category_name}{b.province_name ? ` · ${b.province_name}` : ""}</div>
                <div className="mt-2">{b.is_verified ? <StatusPill value="approved" /> : <StatusPill value={b.verification_status || "not started"} />}</div>
              </button>
            ))}
          </div>
          {biz && (
            <div className="space-y-6">
              {biz.is_verified ? (
                <Card className="border-[#CFE8D8] bg-[#F2F9F4]"><CardContent className="p-6 flex gap-4 items-start">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-[#E6F6F1] text-[#047857]"><ShieldCheck className="h-6 w-6" /></span>
                  <div><h2 className="text-lg font-semibold">{biz.name} is verified</h2><p className="text-gray-600">The badge is live on <Link href={`/business/${biz.slug}`} className="underline">your profile</Link>. Keep your licence current – we re-check when it expires.</p></div>
                </CardContent></Card>
              ) : (
                <>
                  {v && (
                    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Current request <StatusPill value={v.status} /></CardTitle></CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex items-center gap-2"><FileCheck2 className="h-4 w-4" /> Licence {v.licence_number} ({v.licence_authority}) – {v.status === "approved" ? "checked" : v.status === "rejected" ? "not accepted" : "awaiting review"}</div>
                        <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {v.business_email} – {v.email_verified_at ? `confirmed ${fmtDate(v.email_verified_at)}` : "not confirmed yet – check the inbox for our email"}</div>
                        <div className="flex items-center gap-2 flex-wrap"><Phone className="h-4 w-4" /> {v.phone} – {v.phone_verified_at ? "confirmed" : "not confirmed"}
                          {!v.phone_verified_at && v.status === "pending" && (
                            <span className="inline-flex gap-2 items-center ml-2">
                              <Button size="sm" variant="outline" onClick={() => sendOtp.mutate()} disabled={sendOtp.isPending}>Send code</Button>
                              <Input className="h-8 w-28" placeholder="6-digit code" value={otp} onChange={(e) => setOtp(e.target.value)} />
                              <Button size="sm" onClick={() => confirmOtp.mutate()} disabled={otp.length < 6 || confirmOtp.isPending}>Confirm</Button>
                            </span>
                          )}
                        </div>
                        {(v.status === "pending" || v.status === "under_review") && businessId && <VerificationDocuments businessId={businessId} editable={v.status === "pending"} />}
                        {v.status === "rejected" && (v.rejection_reason || v.admin_notes) && <div className="rounded-xl bg-[#FDECEC] text-[#B91C1C] p-3">Reason: {v.rejection_reason || v.admin_notes}</div>}
                      </CardContent></Card>
                  )}
                  <Card>
                    <CardHeader><CardTitle>{v?.status === "pending" ? "Update the details" : "Submit verification details"}</CardTitle></CardHeader>
                    <CardContent>
                      <form className="grid sm:grid-cols-2 gap-4" onSubmit={(e) => { e.preventDefault(); submit.mutate(); }}>
                        <label className="yp-field"><span>Trade licence number *</span><Input required value={f.licenceNumber} onChange={(e) => set("licenceNumber", e.target.value)} placeholder="e.g. 1234567" /></label>
                        <label className="yp-field"><span>Licensing authority *</span>
                          <select required className="h-11 w-full rounded-xl border border-[#DDE1E8] bg-white px-3 text-sm" value={f.licenceAuthority} onChange={(e) => set("licenceAuthority", e.target.value)}>
                            <option value="">Select…</option>{LICENCE_AUTHORITIES.map((a) => <option key={a}>{a}</option>)}
                          </select></label>
                        <label className="yp-field"><span>Licence expiry</span><Input type="date" value={f.licenceExpiry} onChange={(e) => set("licenceExpiry", e.target.value)} /></label>
                        <label className="yp-field"><span>Link to licence copy (optional)</span><Input value={f.licenceDocumentUrl} onChange={(e) => set("licenceDocumentUrl", e.target.value)} placeholder="Google Drive / Dropbox link" /></label>
                        <label className="yp-field"><span>Business email on your company domain *</span><Input required type="email" value={f.businessEmail} onChange={(e) => set("businessEmail", e.target.value)} placeholder="info@yourcompany.pk" /><span className="text-xs font-normal text-[#5B6475]">We send a confirmation link there. Free webmail addresses are not accepted.</span></label>
                        <label className="yp-field"><span>Business phone *</span><Input required value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="050 123 4567" /></label>
                        <div className="sm:col-span-2 flex justify-end"><Button type="submit" disabled={submit.isPending}>{submit.isPending ? "Sending…" : "Submit for verification"}</Button></div>
                      </form>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </OpsShell>
  );
}
