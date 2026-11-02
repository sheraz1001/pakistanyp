import type { ReactNode } from "react";
import { Check } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { PakistanypLogo, FlagStripe } from "@/components/brand/pakistanyp-logo";
import { cn } from "@/lib/utils";
import { country } from "@shared/country";

/**
 * Shared auth layouts (Login.dc / Signup.dc mockups).
 * - AuthSplit: white form column + green-wash aside (sign in, admin sign in)
 * - AuthTopBar: flag stripe + logo + right slot (create account)
 * - AuthPage + AuthCard: header/footer page with a centred white card (password, verify, newsletter)
 */

export function AuthSplit({
  children,
  aside,
  badge,
  footnote,
}: {
  children: ReactNode;
  aside?: ReactNode;
  badge?: ReactNode;
  footnote?: ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-[#0A0A0A] font-sans">
      <FlagStripe />
      <div className="flex-1 flex flex-wrap">
        <main className="flex-[1_1_480px] min-w-0 flex flex-col px-4 sm:px-[clamp(24px,5vw,72px)] py-8">
          <div className="flex items-center gap-3 self-start">
            <PakistanypLogo href="/" />
            {badge}
          </div>
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="w-full max-w-[400px]">{children}</div>
          </div>
          <p className="m-0 text-[13px] text-[#5B6475]">
            {footnote ?? <>© {new Date().getFullYear()}{" " + country.brand}</>}
          </p>
        </main>
        {aside}
      </div>
    </div>
  );
}

/** Green-wash right panel with concentric circle decoration. */
export function AuthAside({
  eyebrow,
  title,
  card,
  checks,
  footnote,
}: {
  eyebrow: string;
  title: string;
  card?: ReactNode;
  checks?: string[];
  footnote?: string;
}) {
  return (
    <aside className="hidden lg:flex flex-[1_1_480px] min-w-0 relative overflow-hidden flex-col justify-between gap-12 bg-[#F2F9F4] border-l border-[#DCEBE1] p-[clamp(32px,5vw,72px)]">
      <svg
        width="520"
        height="520"
        viewBox="0 0 520 520"
        className="absolute -right-[140px] -top-[140px] opacity-50 pointer-events-none"
        aria-hidden="true"
      >
        <circle cx="260" cy="260" r="259" fill="none" stroke="#CFE8D8" />
        <circle cx="260" cy="260" r="190" fill="none" stroke="#CFE8D8" />
        <circle cx="260" cy="260" r="120" fill="none" stroke="#CFE8D8" />
      </svg>
      <div className="yp-label relative !text-[#0B6B2E]">{eyebrow}</div>
      <div className="relative flex flex-col gap-7 max-w-[480px]">
        <h2 className="m-0 text-[clamp(32px,3.6vw,46px)] leading-[1.08] tracking-[-0.04em] font-bold">{title}</h2>
        {card}
        {checks && checks.length > 0 && (
          <ul className="flex flex-wrap gap-x-7 gap-y-3 text-sm text-[#3A4354]">
            {checks.map((c) => (
              <li key={c} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#0B6B2E]" strokeWidth={2.5} aria-hidden="true" />
                {c}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="relative text-sm text-[#5B6475]">{footnote}</div>
    </aside>
  );
}

/** White illustration card used inside AuthAside. */
export function AuthAsideCard({
  icon,
  title,
  subtitle,
  items,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  items: string[];
}) {
  return (
    <div className="bg-white rounded-[20px] p-5 flex flex-col gap-3.5 border border-[#DCEBE1] shadow-[0_30px_60px_-36px_rgba(0,115,47,.5)]">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-[#E8F4EC] text-[#0B6B2E] grid place-items-center shrink-0">{icon}</span>
        <span className="flex-1 min-w-0">
          <span className="block font-semibold text-[15px]">{title}</span>
          {subtitle && <span className="block text-[13px] text-[#5B6475]">{subtitle}</span>}
        </span>
      </div>
      <ul className="bg-[#F7F8FA] rounded-xl p-3 flex flex-col gap-2 text-sm text-[#3A4354] leading-normal">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2">
            <Check className="h-4 w-4 mt-0.5 shrink-0 text-[#0B6B2E]" aria-hidden="true" />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Top bar for the create-account page: flag stripe, logo and a right-hand slot. */
export function AuthTopBar({ right }: { right?: ReactNode }) {
  return (
    <>
      <FlagStripe />
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-[clamp(24px,4vw,48px)] py-6">
        <PakistanypLogo href="/" />
        {right}
      </header>
    </>
  );
}

/** Light page with the site header/footer and a centred column. */
export function AuthPage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F3] text-[#0A0A0A]">
      <Header />
      <main className={cn("flex-1 flex justify-center items-start sm:items-center px-4 py-12 sm:py-16", className)}>
        {children}
      </main>
      <Footer />
    </div>
  );
}

/** White form card, radius 24. */
export function AuthCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "w-full max-w-[480px] bg-white border border-[#E7E9EE] rounded-[24px] p-6 sm:p-10 flex flex-col gap-5 shadow-[0_24px_60px_-36px_rgba(10,10,10,.3)]",
        className
      )}
    >
      {children}
    </div>
  );
}

const TONES = {
  green: "bg-[#E8F4EC] text-[#0B6B2E]",
  red: "bg-[#FDECEC] text-[#B91C1C]",
  amber: "bg-[#FFF4E0] text-[#B45309]",
  slate: "bg-[#F1F2F6] text-[#334155]",
} as const;

/** 48px tinted icon tile. */
export function AuthIcon({ children, tone = "green", className }: { children: ReactNode; tone?: keyof typeof TONES; className?: string }) {
  return (
    <span className={cn("w-12 h-12 rounded-[14px] grid place-items-center shrink-0", TONES[tone], className)}>{children}</span>
  );
}

/** Title + subtitle block used at the top of auth forms. */
export function AuthHeading({ title, subtitle, as = "h1" }: { title: ReactNode; subtitle?: ReactNode; as?: "h1" | "h2" }) {
  const H = as;
  return (
    <div>
      <H className="m-0 text-[32px] sm:text-[36px] leading-[1.1] tracking-[-0.04em] font-bold text-[#0A0A0A]">{title}</H>
      {subtitle && <p className="mt-2 mb-0 text-base text-[#5B6475]">{subtitle}</p>}
    </div>
  );
}

/** Small red ADMIN tag shown next to the logo on admin auth screens. */
export function AdminTag() {
  return (
    <span className="inline-flex items-center h-6 px-2 rounded-md bg-[#E3A82B] text-[#141414] font-mono text-[11px] font-medium tracking-[0.08em]">
      ADMIN
    </span>
  );
}

export const authInputClass = "h-12 text-base md:text-base";
export const authBtnClass = "w-full min-h-[48px] h-12 rounded-xl text-[15px] font-semibold";
