import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ShieldCheck, BadgeCheck, Mail, Phone, FileCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { api, fmtDate } from "./api";
import { country } from "@shared/country";

/** "trade licence" (Pakistan) / "commercial registration (CR)" (Pakistan) and its sentence-case form */
const licence = country.licenceAuthority;
const Licence = licence.charAt(0).toUpperCase() + licence.slice(1);

/** Small inline badge for cards and headers. */
export function VerifiedBadge({ verified, className = "" }: { verified?: boolean | null; className?: string }) {
  if (!verified) return null;
  return (
    <span className={`yp-verified ${className}`} title={`${Licence}, email and phone checked by ${country.directoryName}`}>
      <BadgeCheck className="h-3.5 w-3.5" /> Verified business
    </span>
  );
}

/** Profile-page panel: shows what was verified, or invites the owner to claim / verify. */
export function TrustPanel({ businessId, businessName, ownerId, isClaimed }: { businessId: number; businessName: string; ownerId?: string | null; isClaimed?: boolean | null }) {
  const { user } = useAuth() as any;
  const { data: t } = useQuery({ queryKey: [`/api/businesses/${businessId}/trust`], queryFn: () => api(`/api/businesses/${businessId}/trust`) });
  const isOwner = !!user && String(user.id) === String(ownerId);
  // Listings imported as "verified" before the licence/email/phone process existed show a softer line
  const legacy = !!t?.isVerified && !t?.licenceAuthority && !t?.emailVerified && !t?.phoneVerified;
  const checks = legacy
    ? [{ ok: true, icon: FileCheck2, label: "Listing details confirmed by our team" }]
    : [
        { ok: !!t?.isVerified, icon: FileCheck2, label: t?.licenceAuthority ? `${Licence} checked (${t.licenceAuthority})` : `${Licence} checked` },
        { ok: !!t?.emailVerified, icon: Mail, label: "Business email confirmed" },
        { ok: !!t?.phoneVerified, icon: Phone, label: "Phone number confirmed" },
      ];
  return (
    <div className={`rounded-[20px] border p-6 ${t?.isVerified ? "border-[#CFE8D8] bg-[#F2F9F4]" : "border-[#E7E9EE] bg-white"}`}>
      <div className="flex items-start gap-4">
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-[14px] ${t?.isVerified ? "bg-[#E8F4EC] text-[#0B6B2E]" : "bg-[#F1F2F6] text-[#334155]"}`}>
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#0A0A0A]">{t?.isVerified ? `Verified by ${country.directoryName}` : "Not yet verified"}</h2>
          <p className="mt-1 text-sm leading-[1.55] text-[#4B5565]">
            {t?.isVerified
              ? `${t.verifiedAt ? `Checked ${fmtDate(t.verifiedAt)}. ` : ""}Verified businesses confirmed their ${licence} and contact details with our team.`
              : "This listing has not completed our licence and contact checks yet."}
          </p>
          <ul className="mt-4 flex flex-col gap-2 text-sm">
            {checks.map((c) => (
              <li key={c.label} className={`flex items-center gap-2 ${c.ok ? "text-[#05501F]" : "text-[#5B6475]"}`}><c.icon className="h-4 w-4 shrink-0" aria-hidden="true" /> {c.label}{c.ok ? "" : " – pending"}</li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            {isOwner ? (
              !t?.isVerified && <Button asChild><Link href={`/my-verification?business=${businessId}`}>Get verified – free</Link></Button>
            ) : !isClaimed ? (
              <Button asChild variant="outline"><Link href={`/business/${businessId}/claim`}>Is this your business? Claim it</Link></Button>
            ) : null}
            {isOwner && <Button asChild variant="outline"><Link href="/my-leads">View your leads</Link></Button>}
          </div>
        </div>
      </div>
    </div>
  );
}
