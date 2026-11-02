import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Bell, Search, Menu, X, LayoutDashboard, Inbox, FileText, ShieldCheck, CreditCard, MessageCircle,
} from "lucide-react";
import { AccountMenu } from "@/components/account-menu";
import { PakistanypLogo, FlagStripe } from "@/components/brand/pakistanyp-logo";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/components/phase1/api";

/** Shared quote-request list (same cache entry as /my-leads). */
export function useOwnerLeads(enabled = true) {
  return useQuery<any[]>({
    queryKey: ["/api/my/leads"],
    queryFn: () => api("/api/my/leads"),
    retry: false,
    enabled,
  });
}

export function initialsOf(user: any): string {
  const a = (user?.firstName || "").trim();
  const b = (user?.lastName || "").trim();
  const s = (a[0] || "") + (b[0] || "");
  if (s) return s.toUpperCase();
  return ((user?.email || "U")[0] || "U").toUpperCase();
}

const PILL: Record<string, string> = {
  new: "bg-[#E8F4EC] text-[#05501F]",
  approved: "bg-[#E6F6F1] text-[#065F46]",
  verified: "bg-[#E6F6F1] text-[#065F46]",
  won: "bg-[#E6F6F1] text-[#065F46]",
  qualified: "bg-[#E6F6F1] text-[#065F46]",
  contacted: "bg-[#E8F4EC] text-[#05501F]",
  quoted: "bg-[#FFF4E0] text-[#B45309]",
  pending: "bg-[#FFF4E0] text-[#B45309]",
  under_review: "bg-[#FFF4E0] text-[#B45309]",
  "in review": "bg-[#FFF4E0] text-[#B45309]",
  rejected: "bg-[#FDECEC] text-[#B91C1C]",
  spam: "bg-[#FDECEC] text-[#B91C1C]",
  lost: "bg-[#F1F2F6] text-[#334155]",
  closed: "bg-[#F1F2F6] text-[#334155]",
  free: "bg-[#F1F2F6] text-[#334155]",
  "not started": "bg-[#F1F2F6] text-[#334155]",
  pro: "bg-[#E8F4EC] text-[#05501F]",
  premium: "bg-[#FDECEC] text-[#B3141B]",
};

/** Brand status pill used across owner screens. */
export function OwnerPill({ value }: { value?: string | null }) {
  const v = (value || "new").toLowerCase();
  return <span className={`yp-pill capitalize ${PILL[v] || "bg-[#F1F2F6] text-[#334155]"}`}>{v.replace(/_/g, " ")}</span>;
}

/** Green-wash "Upgrade to Premium" card shown at the foot of the sidebar. */
export function UpgradeCard({ href = "/my-plan" }: { href?: string }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-[#CFE8D8] bg-[#F2F9F4] p-[18px] text-[#0A0A0A]">
      <span className="text-[15px] font-semibold">Upgrade to Premium</span>
      <span className="text-[13px] leading-normal text-[#3A4354]">Top placement in search and the contact details on every quote request.</span>
      <a href={href} className="yp-btn yp-btn-red !min-h-[40px]">See plans</a>
    </div>
  );
}

/** White sidebar frame: logo, nav (children), upgrade card. Renders desktop column + mobile drawer. */
export function OwnerSidebar({
  children, open, onClose, showUpgrade = true, label = "Account sections",
}: { children: ReactNode; open: boolean; onClose: () => void; showUpgrade?: boolean; label?: string }) {
  const body = (
    <>
      <div className="flex items-center justify-between px-2 pb-5 pt-1">
        <PakistanypLogo href="/" height={44} />
        <button type="button" onClick={onClose} className="lg:hidden yp-btn yp-btn-ghost !min-h-[40px] !w-10 !p-0" aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="yp-side flex flex-col gap-1" aria-label={label}>{children}</nav>
      {showUpgrade && <div className="mt-auto pt-6"><UpgradeCard /></div>}
    </>
  );
  return (
    <>
      <aside className="hidden lg:block w-[256px] shrink-0 border-r border-[#E7E9EE] bg-white">
        <div className="sticky top-[76px] flex min-h-[calc(100vh-76px)] flex-col px-4 py-5">{body}</div>
      </aside>
      {open && <div className="fixed inset-0 z-[60] bg-black/40 lg:hidden" onClick={onClose} aria-hidden="true" />}
      <aside
        className={`fixed inset-y-0 left-0 z-[61] flex w-[272px] max-w-[85vw] flex-col overflow-y-auto border-r border-[#E7E9EE] bg-white px-4 py-5 transition-transform duration-200 lg:hidden ${open ? "translate-x-0" : "-translate-x-full"}`}
        aria-hidden={!open}
      >
        {body}
      </aside>
    </>
  );
}

/** Lead count badge for sidebar links. */
export function CountBadge({ n }: { n: number }) {
  if (!n) return null;
  return <span className="ml-auto rounded-full bg-[#0B6B2E] px-2 py-px text-xs font-semibold text-white">{n}</span>;
}

/** Top bar: flag stripe, directory search, notifications, avatar. */
export function OwnerTopBar({ onMenu, newLeads = 0 }: { onMenu: () => void; newLeads?: number }) {
  const { user } = useAuth();
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "Account";
  return (
    <div className="bg-white">
      <FlagStripe />
      <div className="flex flex-wrap items-center gap-3 border-b border-[#E7E9EE] px-4 py-4 sm:px-[clamp(20px,3vw,40px)]">
        <button type="button" onClick={onMenu} className="lg:hidden yp-btn yp-btn-ghost !w-11 !p-0" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <form action="/search" method="get" role="search" className="flex min-h-[44px] min-w-0 flex-[0_1_380px] items-center gap-2.5 rounded-xl border border-[#E7E9EE] bg-[#F7F8FA] px-3.5">
          <Search className="h-4 w-4 shrink-0 text-[#5B6475]" aria-hidden="true" />
          <label className="sr-only" htmlFor="owner-search">Search the directory</label>
          <input id="owner-search" name="q" type="search" placeholder="Search businesses, categories…" className="w-full min-w-0 border-0 bg-transparent text-[15px] outline-none placeholder:text-[#8A92A3]" />
        </form>
        <div className="ml-auto flex items-center gap-2.5">
          <a href="/my-leads" className="yp-btn yp-btn-ghost relative !w-11 !p-0" aria-label={newLeads ? `Notifications: ${newLeads} new quote requests` : "Notifications"}>
            <Bell className="h-[18px] w-[18px]" />
            {newLeads > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#D71920]" aria-hidden="true" />}
          </a>
          <AccountMenu tone="green" />
        </div>
      </div>
    </div>
  );
}

const OWNER_LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/my-leads", label: "Quote requests", icon: Inbox, leads: true },
  { href: "/my-profile", label: "Profile content", icon: FileText },
  { href: "/my-verification", label: "Verification", icon: ShieldCheck },
  { href: "/my-plan", label: "Plan & billing", icon: CreditCard },
  { href: "/my-business-claims", label: "Claims", icon: MessageCircle },
];

/** Page shell for owner sub-pages (leads, profile, verification, plan, claims). */
export function OwnerShell({
  title, subtitle, actions, children, showUpgrade = true,
}: { title: string; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode; showUpgrade?: boolean }) {
  const [loc] = useLocation();
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { data: leads = [] } = useOwnerLeads(!!user);
  const newLeads = Array.isArray(leads) ? leads.filter((l) => l.status === "new").length : 0;
  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#0A0A0A]">
      <div className="flex min-h-screen">
        <OwnerSidebar open={open} onClose={() => setOpen(false)} showUpgrade={showUpgrade}>
          {OWNER_LINKS.map((i) => {
            const active = i.href === "/dashboard" ? loc === "/dashboard" : loc.startsWith(i.href);
            return (
              <Link key={i.href} href={i.href} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)}>
                <i.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                {i.label}
                {i.leads && <CountBadge n={newLeads} />}
              </Link>
            );
          })}
        </OwnerSidebar>
        <div className="flex min-w-0 flex-1 flex-col">
          <OwnerTopBar onMenu={() => setOpen(true)} newLeads={newLeads} />
          <main className="flex flex-col gap-6 px-4 pb-14 pt-8 sm:px-[clamp(20px,3vw,40px)]">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0 max-w-3xl">
                <h1 className="text-[28px] font-bold leading-tight tracking-[-0.04em] sm:text-[32px]">{title}</h1>
                {subtitle && <p className="mt-1.5 text-[15px] leading-relaxed text-[#5B6475]">{subtitle}</p>}
              </div>
              {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
            </div>
            <div className="min-w-0">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

/** Segmented step indicator (as in the signup design): one bar + label per step. */
export function StepBar({ step, labels, total }: { step: number; labels?: string[]; total?: number }) {
  const n = total ?? labels?.length ?? 3;
  return (
    <ol className="m-0 flex list-none gap-2 p-0" aria-label="Steps">
      {Array.from({ length: n }).map((_, i) => {
        const done = i < step;
        const current = i === step - 1;
        return (
          <li key={i} className="flex min-w-0 flex-1 flex-col gap-2" aria-current={current ? "step" : undefined}>
            <span className={`h-1 rounded-full ${done ? "bg-[#0B6B2E]" : "bg-[#DDE1E8]"}`} />
            {labels?.[i] && (
              <span className={`truncate text-[13px] ${current ? "font-semibold text-[#0A0A0A]" : "text-[#5B6475]"}`}>{i + 1}. {labels[i]}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
