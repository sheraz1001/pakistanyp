import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutGrid, CheckCircle2, ShieldCheck, Star, Inbox, Megaphone, FileText, Newspaper,
  Users, Settings, Search, Menu, X, Building2, BadgeCheck, type LucideIcon,
} from "lucide-react";
import { AccountMenu } from "@/components/account-menu";
import Footer from "@/components/footer";
import { PakistanypLogo, FlagStripe } from "@/components/brand/pakistanyp-logo";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Sidebar building blocks                                             */
/* ------------------------------------------------------------------ */

/** Mono uppercase group label (Overview / Directory / Content / System). */
export function AdminSideLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("yp-label block px-3 pt-[18px] pb-1.5", className)}>{children}</span>;
}

/** Red count badge used in the sidebar. Renders nothing for 0 / undefined. */
export function AdminCount({ value }: { value?: number | null }) {
  if (!value) return null;
  return (
    <span className="ml-auto rounded-full bg-[#D71920] px-2 py-px text-xs font-semibold leading-5 text-white">
      {value > 999 ? "999+" : value}
    </span>
  );
}

type SideLinkProps = {
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  label: React.ReactNode;
  active?: boolean;
  count?: number | null;
  href?: string;
  onClick?: () => void;
  className?: string;
};

/** A sidebar entry: a link when `href` is given, otherwise a button (for state-driven sections). */
export function AdminSideLink({ icon: Icon, label, active, count, href, onClick, className }: SideLinkProps) {
  const inner = (
    <>
      {Icon ? <Icon className="h-[18px] w-[18px] shrink-0" /> : null}
      <span className="min-w-0 truncate">{label}</span>
      <AdminCount value={count} />
    </>
  );
  if (href) {
    return (
      <Link href={href} onClick={onClick} aria-current={active ? "page" : undefined} className={cn("min-h-[40px]", className)}>
        {inner}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      data-active={active ? "true" : undefined}
      aria-current={active ? "page" : undefined}
      className={cn("yp-side-link min-h-[40px]", className)}
    >
      {inner}
    </button>
  );
}

/** Default navigation for the standalone admin pages (approvals, claims, reviews, ...). */
const ADMIN_NAV: { label: string; items: { href: string; label: string; icon: LucideIcon; exact?: boolean }[] }[] = [
  { label: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: LayoutGrid, exact: true }] },
  {
    label: "Directory",
    items: [
      { href: "/admin/approvals", label: "Approvals", icon: CheckCircle2 },
      { href: "/admin/business-claims", label: "Claims", icon: ShieldCheck },
      { href: "/admin/verifications", label: "Verification", icon: BadgeCheck },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
      { href: "/admin/leads", label: "Leads", icon: Inbox },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/create-blog-post", label: "New blog post", icon: FileText },
      { href: "/create-news-article", label: "New news article", icon: Newspaper },
      { href: "/admin/social-media-generator", label: "Social media", icon: Megaphone },
      { href: "/admin/sponsorships", label: "Sponsorships", icon: Megaphone },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/moderator-dashboard", label: "Moderation", icon: Users },
      { href: "/content-dashboard", label: "Content team", icon: FileText },
      { href: "/cache-control", label: "Cache control", icon: Settings },
    ],
  },
];

export function DefaultAdminNav() {
  const [loc] = useLocation();
  return (
    <>
      {ADMIN_NAV.map((g) => (
        <div key={g.label} className="flex flex-col gap-0.5">
          <AdminSideLabel>{g.label}</AdminSideLabel>
          {g.items.map((i) => (
            <AdminSideLink
              key={i.href}
              href={i.href}
              icon={i.icon}
              label={i.label}
              active={i.exact ? loc === i.href : loc.startsWith(i.href)}
            />
          ))}
        </div>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Shell                                                               */
/* ------------------------------------------------------------------ */

function initials(user: any): string {
  const a = (user?.firstName || "").trim();
  const b = (user?.lastName || "").trim();
  const s = (a[0] || "") + (b[0] || "");
  if (s) return s.toUpperCase();
  const e = (user?.email || "").trim();
  return e ? e.slice(0, 2).toUpperCase() : "AD";
}

/**
 * Admin layout: site header, white 256px sidebar (logo + red ADMIN tag), top bar with flag stripe,
 * search, "+ Add business" and avatar, then the page content on the warm page background.
 */
export function AdminShell({
  nav,
  children,
  tag = "ADMIN",
  showFooter = false,
}: {
  nav?: React.ReactNode;
  children: React.ReactNode;
  tag?: string;
  showFooter?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#0A0A0A]">
      <div className="flex flex-col lg:flex-row">
        <aside
          className="yp-side bg-white border-b border-[#E7E9EE] lg:border-b-0 lg:border-r lg:w-[256px] lg:shrink-0 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto"
          aria-label="Admin navigation"
        >
          <div className="flex items-center justify-between gap-2 px-[14px] pt-5 pb-1.5 lg:pb-0">
            <div className="flex min-w-0 flex-col items-start gap-1.5">
              <PakistanypLogo href="/" height={40} className="!min-h-0 !w-auto !p-1 hover:!bg-transparent" />
              <span className="ml-1 rounded-md bg-[#D71920] px-1.5 py-0.5 text-[11px] font-semibold leading-4 tracking-[.04em] text-white">{tag}</span>
            </div>
            <button
              type="button"
              className="lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#E3E6EC] text-[#3A4354]"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close admin menu" : "Open admin menu"}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
          <nav className={cn("flex-col gap-0.5 px-[14px] pb-6", menuOpen ? "flex" : "hidden lg:flex")}>
            {nav ?? <DefaultAdminNav />}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="bg-white border-b border-[#E7E9EE]">
            <FlagStripe />
            <div className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-6 lg:px-10">
              <form action="/search" method="get" role="search" className="flex min-h-[44px] flex-[0_1_420px] min-w-[200px] items-center gap-2.5 rounded-xl border border-[#E7E9EE] bg-[#F7F8FA] px-3.5">
                <Search className="h-[18px] w-[18px] shrink-0 text-[#5B6475]" aria-hidden="true" />
                <label htmlFor="admin-top-search" className="sr-only">Search businesses</label>
                <input
                  id="admin-top-search"
                  type="search"
                  name="q"
                  placeholder="Search businesses…"
                  className="w-full border-0 bg-transparent text-[15px] outline-none placeholder:text-[#5B6475]"
                />
              </form>
              <div className="ml-auto flex items-center gap-2.5">
                <Link href="/add-business" className="yp-btn yp-btn-primary">
                  <Building2 className="h-4 w-4" aria-hidden="true" />
                  Add business
                </Link>
                <AccountMenu tone="tint" />
              </div>
            </div>
          </div>
          <main className="flex min-w-0 flex-col gap-6 px-4 pb-14 pt-8 sm:px-6 lg:px-10">{children}</main>
        </div>
      </div>
      {showFooter ? <Footer /> : null}
    </div>
  );
}

/** Page heading row: H1 + subtitle on the left, optional actions on the right. */
export function AdminPageHeader({ title, subtitle, actions }: { title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="m-0 text-[28px] font-bold leading-tight tracking-[-0.04em] text-[#0A0A0A] sm:text-[32px]">{title}</h1>
        {subtitle ? <p className="mt-1.5 max-w-3xl text-[15px] text-[#5B6475]">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** Drop-in replacement for the Phase 1 `OpsShell` on admin screens. */
export function AdminOpsShell({ title, subtitle, children }: { kind?: "admin"; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <AdminShell>
      <AdminPageHeader title={title} subtitle={subtitle} />
      <div>{children}</div>
    </AdminShell>
  );
}

export default AdminShell;
