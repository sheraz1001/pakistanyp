import { useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Languages } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SECOND, ENGLISH_ONLY, currentLang, pathInLang, t } from "@shared/i18n";
import { cn } from "@/lib/utils";

/**
 * English <-> second-language switch (only on sites with a second language).
 * Signed-in users: the choice is saved as their language and applied on every visit.
 */
export function LanguageSwitch({ className, compact = false }: { className?: string; compact?: boolean }) {
  const [location] = useLocation();
  const search = useSearch();
  const { user } = useAuth();
  if (!SECOND) return null;
  const lang = currentLang();
  const target = lang === SECOND.code ? "en" : SECOND.code;
  const href = pathInLang(location + (search ? `?${search}` : ""), target);
  const label = target === "en" ? "English" : SECOND.name;

  const onClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!user) return; // plain link
    e.preventDefault();
    try {
      await fetch("/api/user/language", { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ language: target }) });
    } catch { /* still switch */ }
    window.location.assign(href);
  };

  return (
    <a
      href={href}
      hrefLang={target}
      lang={target}
      onClick={onClick}
      className={cn("yp-btn yp-btn-ghost inline-flex items-center gap-1.5", compact && "px-2.5", className)}
      aria-label={target === "en" ? "View this page in English" : t("View this page in {0}", SECOND.englishName)}
      data-testid="language-switch"
    >
      <Languages className="h-4 w-4" aria-hidden="true" />
      {compact ? <><span className="2xl:hidden">{target === "en" ? "EN" : SECOND.name.slice(0, 1)}</span><span className="hidden 2xl:inline">{label}</span></> : <span>{label}</span>}
    </a>
  );
}

/**
 * Keeps signed-in users on their saved language, and admin pages in English.
 * (The server does the same for full page loads; this covers in-app navigation and sign-in.)
 */
export function LanguageGuard() {
  const [location] = useLocation();
  const search = useSearch();
  const { user } = useAuth();
  useEffect(() => {
    if (!SECOND) return;
    const lang = currentLang();
    if (lang === SECOND.code && ENGLISH_ONLY.test(location)) {
      window.location.replace(location + (search ? `?${search}` : ""));
      return;
    }
    const pref = (user as any)?.preferredLanguage;
    if (pref && pref !== lang && (pref === "en" || pref === SECOND.code) && !ENGLISH_ONLY.test(location)) {
      window.location.replace(pathInLang(location + (search ? `?${search}` : ""), pref));
    }
  }, [location, search, user]);
  return null;
}

/** Choose the default site language (user dashboard / profile). */
export function LanguagePreference() {
  const { user } = useAuth();
  if (!SECOND || !user) return null;
  const pref = (user as any).preferredLanguage || currentLang();
  const choose = async (language: string) => {
    await fetch("/api/user/language", { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ language }) });
    window.location.assign(pathInLang(window.location.pathname + window.location.search, language));
  };
  return (
    <section className="rounded-2xl border border-[#E7E9EE] bg-white p-5" data-testid="language-preference">
      <h3 className="text-base font-semibold text-[#0A0A0A]">{t("Site language")}</h3>
      <p className="mt-1 text-sm text-[#5B6475]">{t("The site always opens in this language when you are signed in.")}</p>
      <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label={t("Site language")}>
        {[["en", "English"], [SECOND.code, SECOND.name]].map(([code, name]) => (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={pref === code}
            lang={code}
            onClick={() => pref !== code && choose(code)}
            className={cn("yp-btn", pref === code ? "yp-btn-red" : "yp-btn-ghost")}
          >
            {name}
          </button>
        ))}
      </div>
    </section>
  );
}
