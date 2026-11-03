/** Saudi Life block on the home page (kept small: it does not load the calculators). */
import { Link } from "wouter";
import { Calculator } from "lucide-react";
import { L, bi } from "./lib";

const PICKS = [
  ["end-of-service", bi("End-of-service benefit", "مكافأة نهاية الخدمة")],
  ["electricity-bill", bi("Electricity bill", "فاتورة الكهرباء")],
  ["gosi", bi("GOSI contributions", "اشتراكات التأمينات")],
  ["fuel-cost", bi("Fuel cost", "تكلفة الوقود")],
  ["weighted-admission", bi("University weighted percentage", "النسبة الموزونة")],
  ["household-budget", bi("Household budget", "ميزانية الأسرة")],
] as const;
const SHORTCUTS = [
  ["/expat-guide", bi("Expatriate Guide", "دليل المقيمين")], ["/cars-driving", bi("Cars & Driving", "السيارات والقيادة")],
  ["/home-utilities", bi("Home & Utilities", "المنزل والخدمات")], ["/education", bi("Education & Schools", "التعليم والمدارس")],
  ["/holidays", bi("Public Holidays", "العطلات والتقويم")], ["/cost-of-living", bi("Cost of Living", "تكلفة المعيشة")],
  ["/family-kids", bi("Family & Kids", "العائلة والأطفال")], ["/travel-tourism", bi("Travel & Tourism", "السفر والسياحة")],
] as const;

export default function LifeHomeBlock() {
  return (
    <section className="yp-wrap pt-14 md:pt-20" aria-labelledby="home-life-heading">
      <div className="rounded-3xl border border-[#CCE5D7] bg-gradient-to-br from-[#F1F8F4] to-white p-6 md:p-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[#006C35]">{L(bi("New: Saudi Life", "جديد: الحياة في السعودية"))}</p>
            <h2 id="home-life-heading" className="mt-1 text-[28px] font-bold tracking-[-0.02em] md:text-[34px]">{L(bi("Calculators and guides for life in Saudi Arabia", "حاسبات وأدلة للحياة في السعودية"))}</h2>
            <p className="mt-2 text-[16px] text-[#3A4354]">{L(bi("End of service, GOSI, electricity bills, fuel, school admission, expat procedures and more — with official sources.", "نهاية الخدمة والتأمينات وفواتير الكهرباء والوقود والقبول المدرسي وإجراءات المقيمين وغيرها — بمصادر رسمية."))}</p>
          </div>
          <Link href="/saudi-life" className="yp-btn yp-btn-red">{L(bi("Explore Saudi Life", "استكشف الحياة في السعودية"))}</Link>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PICKS.map(([slug, label]) => (
            <Link key={slug} href={`/calculators/${slug}`} className="flex items-center gap-3 rounded-2xl border border-[#E7E9EE] bg-white px-4 py-3 no-underline hover:border-[#CCE5D7]">
              <Calculator className="h-5 w-5 text-[#006C35]" aria-hidden="true" /><span className="font-medium text-[#0A0A0A]">{L(label)}</span>
            </Link>
          ))}
        </div>
        <nav aria-label={L(bi("Saudi Life sections", "أقسام الحياة في السعودية"))} className="mt-5 flex flex-wrap gap-2">
          {SHORTCUTS.map(([href, label]) => <Link key={href} href={href} className="yp-pill border border-[#CCE5D7] bg-white px-3.5 py-1.5 text-sm text-[#004D26] no-underline hover:bg-[#F1F8F4]">{L(label)}</Link>)}
        </nav>
      </div>
    </section>
  );
}
