import { Link, useLocation } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";

const OWNER = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/my-leads", label: "Leads" },
  { href: "/my-profile", label: "Profile content" },
  { href: "/my-verification", label: "Verification" },
  { href: "/my-plan", label: "Membership" },
  { href: "/my-business-claims", label: "Claims" },
];
const ADMIN = [
  { href: "/admin", label: "Admin home" },
  { href: "/admin/approvals", label: "Approvals" },
  { href: "/admin/verifications", label: "Verifications" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/sponsorships", label: "Sponsorships" },
  { href: "/admin/business-claims", label: "Claims" },
];

/** Page shell for the Phase 1 owner/admin screens: site header, section tabs, content, footer. */
export function OpsShell({ kind, title, subtitle, children }: { kind: "owner" | "admin"; title: string; subtitle?: string; children: React.ReactNode }) {
  const [loc] = useLocation();
  const items = kind === "admin" ? ADMIN : OWNER;
  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <Header />
      <main className="yp-wrap pt-8 pb-20">
        <nav className="flex flex-wrap gap-2 mb-6" aria-label={kind === "admin" ? "Admin sections" : "Account sections"}>
          {items.map((i) => (
            <Link key={i.href} href={i.href} className="yp-chip" aria-current={loc.startsWith(i.href) && i.href !== "/admin" && i.href !== "/dashboard" ? "page" : undefined}>{i.label}</Link>
          ))}
        </nav>
        <h1 className="text-[clamp(28px,3.2vw,40px)] font-bold leading-[1.1] tracking-[-0.04em] text-[#0A0A0A]">{title}</h1>
        {subtitle && <p className="text-[#5B6475] text-[15px] leading-[1.55] mt-2 mb-6">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

export function StatusPill({ value }: { value?: string | null }) {
  const v = (value || "new").toLowerCase();
  const cls: Record<string, string> = {
    pending: "bg-[#FFF4E0] text-[#B45309] border-[#F5DDB0]", new: "bg-[#E8F4EC] text-[#05501F] border-[#CFE8D8]", approved: "bg-green-50 text-green-800 border-green-200",
    won: "bg-green-50 text-green-800 border-green-200", qualified: "bg-green-50 text-green-800 border-green-200", contacted: "bg-indigo-50 text-indigo-800 border-indigo-200",
    quoted: "bg-purple-50 text-purple-800 border-purple-200", rejected: "bg-red-50 text-red-800 border-red-200", lost: "bg-gray-100 text-gray-700 border-gray-200",
    spam: "bg-red-50 text-red-800 border-red-200", closed: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${cls[v] || "bg-gray-100 text-gray-700"}`}>{v}</span>;
}
