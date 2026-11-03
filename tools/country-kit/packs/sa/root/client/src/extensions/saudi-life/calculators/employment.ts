/** Employment & salary calculators (Saudi Labor Law, GOSI). Rates come from the rules data. */
import { bi, sar, fmt, pct, formatDate } from "../lib";
import { type Calculator, type Values, type Rules, n, s, ruleValue, round2, InputError } from "./types";

const REVIEWED = "2026-11-03";

// ------------------------------------------------------------------ shared math
/** Years of service between two dates (days / 365, as commonly applied for pro-rating the award). */
export function serviceYears(start: string, end: string): { years: number; days: number } {
  const a = new Date(`${start}T00:00:00Z`), b = new Date(`${end}T00:00:00Z`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) throw new InputError("start", bi("Enter valid dates.", "أدخل تواريخ صحيحة."));
  const days = Math.round((b.getTime() - a.getTime()) / 86400000);
  if (days <= 0) throw new InputError("end", bi("The end date must be after the start date.", "يجب أن يكون تاريخ الانتهاء بعد تاريخ البدء."));
  return { years: days / 365, days };
}

/** Article 84 award: rate months per year, with a threshold after which a higher rate applies. */
export function eosbFull(wage: number, years: number, r: { firstYears: number; firstRate: number; laterRate: number }): number {
  const first = Math.min(years, r.firstYears), later = Math.max(0, years - r.firstYears);
  return wage * (first * r.firstRate + later * r.laterRate);
}

/** Article 85: share of the Article 84 award on resignation. */
export function resignationShare(years: number, bands: { minYears: number; maxYears: number | null; maxInclusive?: boolean; share: number }[]): number {
  // first matching band wins: exactly 5 years is "not more than five" (one third), exactly 10 is the full award
  const band = bands.find((b) => years >= b.minYears && (b.maxYears === null || years < b.maxYears || (!!b.maxInclusive && years <= b.maxYears)));
  return band ? band.share : 0;
}

// ------------------------------------------------------------------ calculators
const today = () => new Date().toISOString().slice(0, 10);

export const endOfService: Calculator = {
  slug: "end-of-service",
  section: "calculators",
  title: bi("Saudi End-of-Service Benefit Calculator", "حاسبة مكافأة نهاية الخدمة في السعودية"),
  short: bi("Estimate your end-of-service award under the Saudi Labor Law, for termination or resignation.", "احسب مكافأة نهاية الخدمة وفق نظام العمل السعودي عند انتهاء العقد أو الاستقالة."),
  metaDescription: bi("Calculate the end-of-service award under Articles 84 and 85 of the Saudi Labor Law for termination or resignation, with a full breakdown.", "احسب مكافأة نهاية الخدمة وفق المادتين ٨٤ و٨٥ من نظام العمل السعودي: مدة الخدمة والأجر الأخير والاستقالة أو انتهاء العقد، مع تفصيل كامل."),
  kind: "official",
  ruleIds: ["eosb_termination", "eosb_resignation", "eosb_full_award_exceptions"],
  inputs: [
    { id: "wage", type: "number", label: bi("Last monthly wage", "الأجر الشهري الأخير"), unit: bi("SAR", "ر.س"), min: 0, step: 50, default: 8000,
      help: bi("The last wage used for the award: basic wage plus regular allowances such as housing and transport, per your contract.", "الأجر الأخير المعتمد لحساب المكافأة: الأجر الأساسي مع البدلات الثابتة كالسكن والنقل وفق عقدك.") },
    { id: "start", type: "date", label: bi("Start date", "تاريخ بداية الخدمة"), default: "2019-01-01" },
    { id: "end", type: "date", label: bi("Last working day", "آخر يوم عمل"), default: today },
    { id: "reason", type: "select", label: bi("How the contract ended", "سبب انتهاء العلاقة العقدية"), default: "termination", options: [
      { value: "termination", label: bi("Contract ended or employer terminated (Article 84)", "انتهاء العقد أو إنهاؤه من صاحب العمل (المادة ٨٤)") },
      { value: "resignation", label: bi("Employee resigned (Article 85)", "استقالة العامل (المادة ٨٥)") },
      { value: "full_exception", label: bi("Resignation with full award (e.g. Article 81 / 87 cases)", "ترك العمل مع استحقاق المكافأة كاملة (حالات المادة ٨١ أو ٨٧)") },
      { value: "article80", label: bi("Dismissed under Article 80", "فصل وفق المادة ٨٠") },
    ] },
  ],
  compute(v: Values, rules: Rules) {
    const wage = n(v, "wage", { min: 0 });
    const { years, days } = serviceYears(s(v, "start"), s(v, "end"));
    const t = ruleValue(rules, "eosb_termination");
    const full = eosbFull(wage, years, { firstYears: t.firstYears, firstRate: t.firstRate, laterRate: t.laterRate });
    const reason = s(v, "reason");
    let share = 1;
    const steps = [
      bi(`Service: ${fmt(days, 0)} days = ${fmt(years, 3)} years.`, `مدة الخدمة: ${fmt(days, 0)} يومًا = ${fmt(years, 3)} سنة.`),
      bi(`First ${t.firstYears} years at ${fmt(t.firstRate)} month's wage per year, later years at ${fmt(t.laterRate)} month per year: ${sar(full)}.`,
         `أول ${t.firstYears} سنوات بأجر ${fmt(t.firstRate)} شهر عن كل سنة، وما بعدها بأجر ${fmt(t.laterRate)} شهر عن كل سنة: ${sar(full)}.`),
    ];
    if (reason === "resignation") {
      share = resignationShare(years, ruleValue(rules, "eosb_resignation").bands);
      steps.push(bi(`Resignation after ${fmt(years, 2)} years: ${pct(share * 100, 1)} of the award (Article 85).`, `الاستقالة بعد ${fmt(years, 2)} سنة: ${pct(share * 100, 1)} من المكافأة (المادة ٨٥).`));
    } else if (reason === "article80") {
      share = 0;
      steps.push(bi("Dismissal under Article 80 removes the right to the award.", "الفصل وفق المادة ٨٠ يُسقط الحق في المكافأة."));
    }
    const award = round2(full * share);
    return {
      headline: { label: bi("Estimated end-of-service award", "مكافأة نهاية الخدمة التقديرية"), value: sar(award) },
      rows: [
        { label: bi("Years of service", "سنوات الخدمة"), value: fmt(years, 2) },
        { label: bi("Full award (Article 84)", "المكافأة الكاملة (المادة ٨٤)"), value: sar(full) },
        { label: bi("Share due", "النسبة المستحقة"), value: pct(share * 100, 1) },
        { label: bi("Award due", "المكافأة المستحقة"), value: sar(award), strong: true },
      ],
      steps,
      warnings: [bi("Contracts or company policies may grant more than the legal minimum; disputes are settled by the labour courts.", "قد تمنح العقود أو لوائح المنشأة أكثر من الحد النظامي، والفصل في النزاعات للمحاكم العمالية.")],
    };
  },
  content: {
    intro: bi(
      "The end-of-service award (مكافأة نهاية الخدمة) is the amount an employer pays a worker when the employment relationship ends. The Saudi Labor Law sets the minimum: the award is calculated on the last wage and the length of service, and a worker who resigns receives part of it depending on how long they worked.",
      "مكافأة نهاية الخدمة هي المبلغ الذي يدفعه صاحب العمل للعامل عند انتهاء علاقة العمل. ويحدد نظام العمل السعودي الحد الأدنى لها: تُحسب على أساس الأجر الأخير ومدة الخدمة، ويحصل العامل المستقيل على جزء منها بحسب مدة عمله."),
    howTo: bi(
      "Enter your last monthly wage including regular allowances, your start date and last working day, and how the contract ended. The calculator counts service in days and pro-rates part years.",
      "أدخل أجرك الشهري الأخير شاملًا البدلات الثابتة، وتاريخ بداية الخدمة وآخر يوم عمل، وسبب انتهاء العقد. تحسب الأداة مدة الخدمة بالأيام وتحتسب أجزاء السنة نسبيًا."),
    formula: bi(
      "Award = wage × (½ × years up to 5 + 1 × years after 5). On resignation (Article 85): nothing below 2 years, one third from 2 to 5 years, two thirds from 5 to 10 years, the full award from 10 years.",
      "المكافأة = الأجر × (½ × السنوات حتى ٥ + ١ × السنوات بعد ٥). وعند الاستقالة (المادة ٨٥): لا شيء قبل سنتين، والثلث من سنتين إلى ٥ سنوات، والثلثان من ٥ إلى ١٠ سنوات، والمكافأة كاملة بعد ١٠ سنوات."),
    example: bi(
      "Last wage SAR 10,000 and 8 years of service, contract ended: 5 × ½ × 10,000 + 3 × 10,000 = SAR 55,000. If the employee resigned instead: two thirds = SAR 36,666.67.",
      "أجر أخير ١٠٬٠٠٠ ر.س وخدمة ٨ سنوات وانتهى العقد: ٥ × ½ × ١٠٬٠٠٠ + ٣ × ١٠٬٠٠٠ = ٥٥٬٠٠٠ ر.س. ولو استقال العامل: الثلثان = ٣٦٬٦٦٦٫٦٧ ر.س."),
    limitations: bi(
      "This is an estimate of the statutory minimum. It does not cover government-sector employees (civil service rules), domestic workers, or awards set by a contract above the legal minimum.",
      "هذه تقديرات للحد النظامي الأدنى، ولا تشمل موظفي القطاع الحكومي (أنظمة الخدمة المدنية) أو العمالة المنزلية أو ما يزيد على الحد النظامي وفق العقد."),
    faq: [
      { q: bi("Which wage is used?", "ما الأجر المعتمد في الحساب؟"), a: bi("The last wage received, which normally includes the basic wage and regular allowances such as housing. Check your contract and payslip.", "الأجر الأخير الذي تقاضاه العامل، ويشمل عادة الأجر الأساسي والبدلات الثابتة كبدل السكن. راجع عقدك ومسيّر الرواتب.") },
      { q: bi("Do part years count?", "هل تُحتسب أجزاء السنة؟"), a: bi("Yes. The award is due for parts of a year in proportion to the time worked.", "نعم، يستحق العامل مكافأة عن أجزاء السنة بنسبة ما قضاه منها في العمل.") },
      { q: bi("Is the award the same for Saudis and non-Saudis?", "هل تختلف المكافأة بين السعودي وغير السعودي؟"), a: bi("The Labor Law award applies to private-sector workers regardless of nationality.", "تنطبق مكافأة نظام العمل على عمال القطاع الخاص بصرف النظر عن الجنسية.") },
    ],
  },
  related: ["unused-leave", "notice-period", "gosi"],
  reviewed: REVIEWED,
};

export const overtime: Calculator = {
  slug: "overtime",
  section: "calculators",
  title: bi("Overtime Pay Calculator (Saudi Labor Law)", "حاسبة أجر العمل الإضافي (نظام العمل السعودي)"),
  short: bi("Overtime pay: the hourly wage plus 50% of the basic hourly wage, for each extra hour.", "أجر الساعات الإضافية: أجر الساعة مضافًا إليه ٥٠٪ من أجر الساعة الأساسي."),
  metaDescription: bi("Work out Saudi overtime pay under Article 107: hourly wage plus 50% of the basic wage for each overtime hour, with the hourly-rate formula explained.", "احسب أجر العمل الإضافي وفق المادة ١٠٧: أجر الساعة مضافًا إليه ٥٠٪ من الأجر الأساسي عن كل ساعة إضافية، مع شرح طريقة احتساب أجر الساعة."),
  kind: "official",
  ruleIds: ["overtime", "working_hours"],
  inputs: [
    { id: "basic", type: "number", label: bi("Monthly basic wage", "الأجر الأساسي الشهري"), unit: bi("SAR", "ر.س"), min: 0, step: 50, default: 6000 },
    { id: "allowances", type: "number", label: bi("Monthly allowances (housing, transport…)", "البدلات الشهرية (سكن، نقل…)"), unit: bi("SAR", "ر.س"), min: 0, step: 50, default: 1500 },
    { id: "hours", type: "number", label: bi("Overtime hours", "عدد الساعات الإضافية"), unit: bi("hours", "ساعة"), min: 0, max: 1000, step: 0.5, default: 10 },
  ],
  compute(v, rules) {
    const basic = n(v, "basic", { min: 0 }), allowances = n(v, "allowances", { min: 0 }), hours = n(v, "hours", { min: 0 });
    const o = ruleValue(rules, "overtime");
    const hourly = (basic + allowances) / o.monthDays / o.dailyHours;
    const basicHourly = basic / o.monthDays / o.dailyHours;
    const perHour = hourly + basicHourly * o.premiumOfBasic;
    const total = round2(perHour * hours);
    return {
      headline: { label: bi("Overtime pay", "أجر العمل الإضافي"), value: sar(total) },
      rows: [
        { label: bi("Hourly wage (total wage ÷ 30 ÷ 8)", "أجر الساعة (الأجر الكلي ÷ ٣٠ ÷ ٨)"), value: sar(hourly) },
        { label: bi("Premium: 50% of basic hourly wage", "الإضافة: ٥٠٪ من أجر الساعة الأساسي"), value: sar(basicHourly * o.premiumOfBasic) },
        { label: bi("Pay per overtime hour", "أجر الساعة الإضافية"), value: sar(perHour) },
        { label: bi("Total for the hours entered", "الإجمالي للساعات المدخلة"), value: sar(total), strong: true },
      ],
      steps: [bi(`${fmt(hours, 1)} hours × ${sar(perHour)} = ${sar(total)}.`, `${fmt(hours, 1)} ساعة × ${sar(perHour)} = ${sar(total)}.`)],
    };
  },
  content: {
    intro: bi("Overtime is any work beyond the normal working hours. The Saudi Labor Law requires the employer to pay the worker's hourly wage plus an extra 50% of the basic hourly wage for each overtime hour.",
      "العمل الإضافي هو كل عمل يتجاوز ساعات العمل المعتادة. ويلزم نظام العمل السعودي صاحب العمل بأن يدفع للعامل أجر الساعة مضافًا إليه ٥٠٪ من أجره الأساسي عن كل ساعة إضافية."),
    howTo: bi("Enter your monthly basic wage, your regular allowances and the number of overtime hours.", "أدخل أجرك الأساسي الشهري والبدلات الثابتة وعدد الساعات الإضافية."),
    formula: bi("Hourly wage = monthly wage ÷ 30 ÷ 8. Overtime hour = hourly wage + 50% × (basic wage ÷ 30 ÷ 8).", "أجر الساعة = الأجر الشهري ÷ ٣٠ ÷ ٨. والساعة الإضافية = أجر الساعة + ٥٠٪ × (الأجر الأساسي ÷ ٣٠ ÷ ٨)."),
    example: bi("Basic SAR 6,000 and allowances SAR 1,500: hourly wage = 7,500 ÷ 240 = SAR 31.25; premium = 50% × 25 = SAR 12.50; one overtime hour = SAR 43.75.", "أجر أساسي ٦٬٠٠٠ ر.س وبدلات ١٬٥٠٠ ر.س: أجر الساعة = ٧٬٥٠٠ ÷ ٢٤٠ = ٣١٫٢٥ ر.س، والإضافة = ٥٠٪ × ٢٥ = ١٢٫٥٠ ر.س، فتكون الساعة الإضافية ٤٣٫٧٥ ر.س."),
    limitations: bi("Dividing by 30 days and 8 hours is the common convention; your contract or company policy may define the hourly wage differently.", "القسمة على ٣٠ يومًا و٨ ساعات هي الطريقة الشائعة، وقد يحدد العقد أو لائحة المنشأة أجر الساعة بطريقة مختلفة."),
  },
  related: ["salary-breakdown", "end-of-service"],
  reviewed: REVIEWED,
};

export const annualLeave: Calculator = {
  slug: "annual-leave",
  section: "calculators",
  title: bi("Annual Leave Salary Calculator", "حاسبة راتب الإجازة السنوية"),
  short: bi("Your annual leave entitlement (21 or 30 days) and the salary for the leave days.", "استحقاقك من الإجازة السنوية (٢١ أو ٣٠ يومًا) وأجر أيام الإجازة."),
  metaDescription: bi("Find your annual leave entitlement under the Saudi Labor Law (21 days, 30 days after 5 years) and the leave salary for the days you take.", "اعرف استحقاقك من الإجازة السنوية وفق نظام العمل السعودي (٢١ يومًا، و٣٠ يومًا بعد ٥ سنوات) وأجر أيام الإجازة."),
  kind: "official",
  ruleIds: ["annual_leave"],
  inputs: [
    { id: "wage", type: "number", label: bi("Monthly wage (basic + allowances)", "الأجر الشهري (الأساسي + البدلات)"), unit: bi("SAR", "ر.س"), min: 0, step: 50, default: 9000 },
    { id: "years", type: "number", label: bi("Years of continuous service", "سنوات الخدمة المتصلة"), min: 0, max: 60, step: 0.5, default: 3 },
    { id: "days", type: "number", label: bi("Leave days to take", "أيام الإجازة المطلوبة"), min: 0, max: 60, step: 1, default: 21 },
  ],
  compute(v, rules) {
    const wage = n(v, "wage", { min: 0 }), years = n(v, "years", { min: 0 }), days = n(v, "days", { min: 0 });
    const a = ruleValue(rules, "annual_leave");
    const entitlement = years >= a.afterYears ? a.daysAfter : a.daysBase;
    const daily = wage / 30;
    const pay = round2(daily * days);
    return {
      headline: { label: bi("Salary for the leave days", "أجر أيام الإجازة"), value: sar(pay) },
      rows: [
        { label: bi("Annual entitlement", "الاستحقاق السنوي"), value: fmt(entitlement, 0), note: bi(`${entitlement} days a year`, `${entitlement} يومًا في السنة`) },
        { label: bi("Daily wage (monthly ÷ 30)", "الأجر اليومي (الشهري ÷ ٣٠)"), value: sar(daily) },
        { label: bi("Leave salary", "أجر الإجازة"), value: sar(pay), strong: true },
      ],
      warnings: days > entitlement ? [bi(`You entered more days than one year's entitlement (${entitlement}).`, `أدخلت أيامًا أكثر من استحقاق سنة واحدة (${entitlement}).`)] : [],
    };
  },
  content: {
    intro: bi("Every worker is entitled to paid annual leave: at least 21 days a year, rising to 30 days after five years of continuous service with the same employer. The leave salary is paid at the worker's wage.",
      "لكل عامل الحق في إجازة سنوية مدفوعة الأجر لا تقل عن ٢١ يومًا، تزيد إلى ٣٠ يومًا بعد خمس سنوات متصلة لدى صاحب العمل نفسه، ويُدفع أجر الإجازة على أساس أجر العامل."),
    howTo: bi("Enter your monthly wage, your years of continuous service and the number of leave days you plan to take.", "أدخل أجرك الشهري وسنوات خدمتك المتصلة وعدد أيام الإجازة التي تنوي أخذها."),
    formula: bi("Entitlement = 21 days (30 days from 5 years). Leave salary = (monthly wage ÷ 30) × leave days.", "الاستحقاق = ٢١ يومًا (٣٠ يومًا من ٥ سنوات). أجر الإجازة = (الأجر الشهري ÷ ٣٠) × أيام الإجازة."),
    example: bi("Wage SAR 9,000 and 21 days: 9,000 ÷ 30 × 21 = SAR 6,300.", "أجر ٩٬٠٠٠ ر.س و٢١ يومًا: ٩٬٠٠٠ ÷ ٣٠ × ٢١ = ٦٬٣٠٠ ر.س."),
  },
  related: ["unused-leave", "end-of-service"],
  reviewed: REVIEWED,
};
export const unusedLeave: Calculator = {
  slug: "unused-leave",
  section: "calculators",
  title: bi("Unused Leave Compensation Calculator", "حاسبة تعويض رصيد الإجازات"),
  short: bi("Cash due for annual leave days not taken when employment ends.", "المبلغ المستحق عن أيام الإجازة السنوية غير المستخدمة عند انتهاء العمل."),
  metaDescription: bi("Calculate the cash compensation for unused annual leave days when a Saudi employment contract ends, based on the worker's wage.", "احسب التعويض النقدي عن أيام الإجازة السنوية غير المستخدمة عند انتهاء عقد العمل في السعودية على أساس أجر العامل."),
  kind: "official",
  ruleIds: ["leave_compensation", "annual_leave"],
  inputs: [
    { id: "wage", type: "number", label: bi("Monthly wage (basic + allowances)", "الأجر الشهري (الأساسي + البدلات)"), unit: bi("SAR", "ر.س"), min: 0, step: 50, default: 9000 },
    { id: "days", type: "number", label: bi("Unused leave days", "أيام الإجازة غير المستخدمة"), min: 0, max: 400, step: 0.5, default: 15 },
  ],
  compute(v) {
    const wage = n(v, "wage", { min: 0 }), days = n(v, "days", { min: 0 });
    const daily = wage / 30, total = round2(daily * days);
    return {
      headline: { label: bi("Leave compensation", "تعويض رصيد الإجازات"), value: sar(total) },
      rows: [
        { label: bi("Daily wage (monthly ÷ 30)", "الأجر اليومي (الشهري ÷ ٣٠)"), value: sar(daily) },
        { label: bi("Unused days", "الأيام غير المستخدمة"), value: fmt(days, 1) },
        { label: bi("Compensation", "التعويض"), value: sar(total), strong: true },
      ],
    };
  },
  content: {
    intro: bi("When employment ends, the worker is entitled to be paid for annual leave days that are due and were not taken, at the worker's wage.", "عند انتهاء العمل يستحق العامل أجر أيام الإجازة السنوية المستحقة التي لم يتمتع بها، على أساس أجره."),
    howTo: bi("Enter your monthly wage and the number of leave days left in your balance.", "أدخل أجرك الشهري وعدد أيام الإجازة المتبقية في رصيدك."),
    formula: bi("Compensation = (monthly wage ÷ 30) × unused leave days.", "التعويض = (الأجر الشهري ÷ ٣٠) × أيام الإجازة غير المستخدمة."),
    example: bi("Wage SAR 9,000 and 15 days left: 300 × 15 = SAR 4,500.", "أجر ٩٬٠٠٠ ر.س و١٥ يومًا متبقية: ٣٠٠ × ١٥ = ٤٬٥٠٠ ر.س."),
  },
  related: ["end-of-service", "annual-leave"],
  reviewed: REVIEWED,
};

/** GOSI contribution for one month. */
export function gosiContribution(wage: number, opts: { saudi: boolean; scheme: "legacy" | "new"; date: string }, rules: Rules) {
  const lim = ruleValue(rules, "gosi_wage_limits");
  const base = Math.min(Math.max(wage, opts.saudi ? lim.minSaudi ?? 0 : 0), lim.max);
  if (!opts.saudi) {
    const ns = ruleValue(rules, "gosi_non_saudi");
    return { base, employee: 0, employer: round2(base * ns.hazardsEmployer), parts: [{ id: "hazards", employee: 0, employer: ns.hazardsEmployer }] };
  }
  const g = ruleValue(rules, "gosi_saudi_legacy");
  let annuitiesEmployee = g.annuitiesEmployee, annuitiesEmployer = g.annuitiesEmployer;
  if (opts.scheme === "new") {
    const nl = ruleValue(rules, "gosi_saudi_new_law");
    const row = [...(nl.schedule as { from: string; employee: number; employer: number }[])].sort((a, b) => b.from.localeCompare(a.from)).find((r) => opts.date >= r.from);
    if (row) { annuitiesEmployee = row.employee; annuitiesEmployer = row.employer; }
  }
  const parts = [
    { id: "annuities", employee: annuitiesEmployee, employer: annuitiesEmployer },
    { id: "saned", employee: g.sanedEmployee, employer: g.sanedEmployer },
    { id: "hazards", employee: 0, employer: g.hazardsEmployer },
  ];
  const employee = round2(parts.reduce((t, p) => t + base * p.employee, 0));
  const employer = round2(parts.reduce((t, p) => t + base * p.employer, 0));
  return { base, employee, employer, parts };
}

export const gosi: Calculator = {
  slug: "gosi",
  section: "calculators",
  title: bi("GOSI Contribution Calculator", "حاسبة اشتراكات التأمينات الاجتماعية"),
  short: bi("Monthly social insurance contributions for Saudi and non-Saudi employees, employee and employer shares.", "اشتراكات التأمينات الاجتماعية الشهرية للموظف السعودي وغير السعودي، حصة الموظف وصاحب العمل."),
  metaDescription: bi("Calculate GOSI contributions: annuities, SANED unemployment insurance and occupational hazards for Saudi and non-Saudi employees, including the new law rates.", "احسب اشتراكات التأمينات الاجتماعية: المعاشات وساند والأخطار المهنية للموظف السعودي وغير السعودي، بما في ذلك نسب النظام الجديد."),
  kind: "official",
  ruleIds: ["gosi_saudi_legacy", "gosi_saudi_new_law", "gosi_non_saudi", "gosi_wage_limits"],
  inputs: [
    { id: "basic", type: "number", label: bi("Monthly basic wage", "الأجر الأساسي الشهري"), unit: bi("SAR", "ر.س"), min: 0, step: 50, default: 8000 },
    { id: "housing", type: "number", label: bi("Monthly housing allowance", "بدل السكن الشهري"), unit: bi("SAR", "ر.س"), min: 0, step: 50, default: 2000 },
    { id: "nationality", type: "select", label: bi("Employee", "الموظف"), default: "saudi", options: [
      { value: "saudi", label: bi("Saudi", "سعودي") }, { value: "non_saudi", label: bi("Non-Saudi", "غير سعودي") }] },
    { id: "scheme", type: "select", label: bi("Insurance scheme", "النظام التأميني"), default: "legacy", showIf: (v) => v.nationality === "saudi", options: [
      { value: "legacy", label: bi("Registered before the new Social Insurance Law", "مسجل قبل نظام التأمينات الاجتماعية الجديد") },
      { value: "new", label: bi("First registered under the new law (from 3 July 2024)", "مسجل لأول مرة وفق النظام الجديد (من ٣ يوليو ٢٠٢٤)") }] },
    { id: "date", type: "date", label: bi("Contribution month", "شهر الاشتراك"), default: today, showIf: (v) => v.nationality === "saudi" && v.scheme === "new",
      help: bi("Annuity rates under the new law rise each July.", "ترتفع نسب المعاشات في النظام الجديد كل يوليو.") },
  ],
  compute(v, rules) {
    const basic = n(v, "basic", { min: 0 }), housing = n(v, "housing", { min: 0 });
    const saudi = s(v, "nationality") === "saudi";
    const r = gosiContribution(basic + housing, { saudi, scheme: s(v, "scheme") === "new" ? "new" : "legacy", date: s(v, "date") || today() }, rules);
    const label: Record<string, ReturnType<typeof bi>> = {
      annuities: bi("Annuities (pension)", "فرع المعاشات"), saned: bi("SANED unemployment insurance", "فرع ساند (التعطل عن العمل)"), hazards: bi("Occupational hazards", "فرع الأخطار المهنية"),
    };
    return {
      headline: { label: bi("Deducted from the employee each month", "يُستقطع من الموظف شهريًا"), value: sar(r.employee) },
      rows: [
        { label: bi("Contributory wage (basic + housing, within limits)", "الأجر الخاضع للاشتراك (الأساسي + السكن ضمن الحدود)"), value: sar(r.base) },
        ...r.parts.map((p) => ({ label: label[p.id], value: `${pct(p.employee * 100)} / ${pct(p.employer * 100)}`, note: bi("employee / employer", "الموظف / صاحب العمل") })),
        { label: bi("Employee share", "حصة الموظف"), value: sar(r.employee), strong: true },
        { label: bi("Employer share", "حصة صاحب العمل"), value: sar(r.employer), strong: true },
        { label: bi("Total contribution", "إجمالي الاشتراك"), value: sar(r.employee + r.employer) },
      ],
    };
  },
  content: {
    intro: bi("The General Organization for Social Insurance (GOSI) collects monthly contributions on the wages of private-sector employees. Saudi employees contribute to the annuities (pension) and SANED unemployment branches; the employer also pays occupational hazards. For non-Saudi employees only the employer pays, for occupational hazards.",
      "تحصّل المؤسسة العامة للتأمينات الاجتماعية اشتراكات شهرية على أجور موظفي القطاع الخاص. يساهم الموظف السعودي في فرعي المعاشات وساند، ويدفع صاحب العمل كذلك اشتراك الأخطار المهنية. أما غير السعودي فيدفع صاحب العمل عنه اشتراك الأخطار المهنية فقط."),
    howTo: bi("Enter the basic wage and housing allowance, choose Saudi or non-Saudi and, for Saudis, whether the employee was first registered under the new Social Insurance Law.", "أدخل الأجر الأساسي وبدل السكن، واختر سعودي أو غير سعودي، وللسعوديين حدد ما إذا كان التسجيل لأول مرة وفق نظام التأمينات الاجتماعية الجديد."),
    formula: bi("Contribution = contributory wage × rate for each branch. The contributory wage is the basic wage plus housing allowance, between the minimum and maximum set by GOSI.", "الاشتراك = الأجر الخاضع × نسبة كل فرع. والأجر الخاضع هو الأجر الأساسي مع بدل السكن بين الحدين الأدنى والأعلى المحددين من التأمينات."),
    limitations: bi("Rates and limits are set by GOSI and can change; the employer's registration in GOSI's systems is the final record.", "النسب والحدود تحددها التأمينات الاجتماعية وقد تتغير، وسجل صاحب العمل لدى التأمينات هو المرجع النهائي."),
  },
  related: ["salary-breakdown", "end-of-service"],
  reviewed: REVIEWED,
};

export const salaryBreakdown: Calculator = {
  slug: "salary-breakdown",
  section: "calculators",
  title: bi("Saudi Salary Breakdown Calculator", "حاسبة تفصيل الراتب في السعودية"),
  short: bi("Gross salary, GOSI deduction and net pay from basic wage and allowances.", "إجمالي الراتب واستقطاع التأمينات وصافي الراتب من الأجر الأساسي والبدلات."),
  metaDescription: bi("Break down a Saudi salary: basic wage, housing and transport allowances, GOSI deduction and net monthly pay for Saudi and non-Saudi employees.", "فصّل الراتب في السعودية: الأجر الأساسي وبدلا السكن والنقل واستقطاع التأمينات وصافي الراتب الشهري للسعودي وغير السعودي."),
  kind: "official",
  ruleIds: ["gosi_saudi_legacy", "gosi_non_saudi", "gosi_wage_limits"],
  inputs: [
    { id: "basic", type: "number", label: bi("Basic wage", "الأجر الأساسي"), unit: bi("SAR / month", "ر.س / شهريًا"), min: 0, step: 50, default: 8000 },
    { id: "housing", type: "number", label: bi("Housing allowance", "بدل السكن"), unit: bi("SAR / month", "ر.س / شهريًا"), min: 0, step: 50, default: 2000 },
    { id: "transport", type: "number", label: bi("Transport allowance", "بدل النقل"), unit: bi("SAR / month", "ر.س / شهريًا"), min: 0, step: 50, default: 800 },
    { id: "other", type: "number", label: bi("Other allowances", "بدلات أخرى"), unit: bi("SAR / month", "ر.س / شهريًا"), min: 0, step: 50, default: 0 },
    { id: "nationality", type: "select", label: bi("Employee", "الموظف"), default: "saudi", options: [
      { value: "saudi", label: bi("Saudi", "سعودي") }, { value: "non_saudi", label: bi("Non-Saudi", "غير سعودي") }] },
  ],
  compute(v, rules) {
    const basic = n(v, "basic", { min: 0 }), housing = n(v, "housing", { min: 0 }), transport = n(v, "transport", { min: 0 }), other = n(v, "other", { min: 0 });
    const gross = basic + housing + transport + other;
    const g = gosiContribution(basic + housing, { saudi: s(v, "nationality") === "saudi", scheme: "legacy", date: today() }, rules);
    const net = round2(gross - g.employee);
    return {
      headline: { label: bi("Net monthly pay", "صافي الراتب الشهري"), value: sar(net) },
      rows: [
        { label: bi("Gross monthly salary", "إجمالي الراتب الشهري"), value: sar(gross) },
        { label: bi("GOSI deduction (employee)", "استقطاع التأمينات (الموظف)"), value: `− ${sar(g.employee)}` },
        { label: bi("Net monthly pay", "صافي الراتب الشهري"), value: sar(net), strong: true },
        { label: bi("Annual gross", "الإجمالي السنوي"), value: sar(gross * 12) },
        { label: bi("Employer's GOSI cost", "تكلفة التأمينات على صاحب العمل"), value: sar(g.employer) },
      ],
      warnings: [bi("Saudi Arabia has no personal income tax on salaries. Other deductions (loans, absences) are not included.", "لا توجد ضريبة دخل شخصية على الرواتب في السعودية، ولا تشمل الحسبة الاستقطاعات الأخرى (القروض والغياب).")],
    };
  },
  content: {
    intro: bi("A Saudi private-sector salary is usually made up of a basic wage and allowances. GOSI contributions are deducted from the basic wage and housing allowance of Saudi employees; there is no income tax on salaries.",
      "يتكون راتب القطاع الخاص في السعودية عادة من أجر أساسي وبدلات. وتُستقطع اشتراكات التأمينات من الأجر الأساسي وبدل السكن للموظف السعودي، ولا توجد ضريبة دخل على الرواتب."),
    howTo: bi("Enter each salary component and choose the nationality to see the deduction and net pay.", "أدخل كل مكوّن من مكونات الراتب واختر الجنسية لمعرفة الاستقطاع وصافي الراتب."),
    formula: bi("Net pay = basic + allowances − employee GOSI share. The GOSI share uses the rates of the scheme for employees registered before the new Social Insurance Law; use the GOSI calculator for new-law rates.", "صافي الراتب = الأساسي + البدلات − حصة الموظف في التأمينات. وتُستخدم نسب المسجلين قبل نظام التأمينات الجديد، ويمكنك استخدام حاسبة التأمينات لنسب النظام الجديد."),
  },
  related: ["gosi", "salary-increase", "household-budget"],
  reviewed: REVIEWED,
};

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) throw new InputError("date", bi("Enter a valid date.", "أدخل تاريخًا صحيحًا."));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export const noticePeriod: Calculator = {
  slug: "notice-period",
  section: "calculators",
  title: bi("Notice Period Date Calculator", "حاسبة تاريخ انتهاء فترة الإشعار"),
  short: bi("The last day of your notice period for an indefinite-term contract.", "آخر يوم في فترة الإشعار لعقد غير محدد المدة."),
  metaDescription: bi("Work out the end date of the notice period under the Saudi Labor Law for indefinite-term contracts, when the worker or the employer gives notice.", "احسب تاريخ انتهاء فترة الإشعار وفق نظام العمل السعودي للعقود غير محددة المدة عند الإشعار من العامل أو من صاحب العمل."),
  kind: "official",
  ruleIds: ["notice_period"],
  inputs: [
    { id: "date", type: "date", label: bi("Date notice is given", "تاريخ تقديم الإشعار"), default: today },
    { id: "by", type: "select", label: bi("Notice given by", "الإشعار مقدَّم من"), default: "employee", options: [
      { value: "employee", label: bi("The employee", "العامل") }, { value: "employer", label: bi("The employer", "صاحب العمل") }] },
    { id: "pay", type: "select", label: bi("Wage paid", "صرف الأجر"), default: "monthly", options: [
      { value: "monthly", label: bi("Monthly", "شهريًا") }, { value: "other", label: bi("Not monthly (daily, weekly…)", "غير شهري (يومي، أسبوعي…)") }] },
    { id: "contractDays", type: "number", label: bi("Longer notice in your contract (optional)", "مدة إشعار أطول في العقد (اختياري)"), unit: bi("days", "يوم"), min: 0, max: 365, step: 1, default: 0 },
  ],
  compute(v, rules) {
    const np = ruleValue(rules, "notice_period");
    const legal = s(v, "pay") === "other" ? np.nonMonthlyDays : s(v, "by") === "employer" ? np.employerDays : np.employeeDays;
    const days = Math.max(legal, n(v, "contractDays", { min: 0 }));
    const end = addDays(s(v, "date"), days);
    return {
      headline: { label: bi("Notice period ends on", "تنتهي فترة الإشعار في"), value: formatDate(end) },
      rows: [
        { label: bi("Legal minimum notice", "الحد النظامي للإشعار"), value: `${fmt(legal, 0)}` , note: bi("days", "يوم") },
        { label: bi("Notice period applied", "فترة الإشعار المطبقة"), value: `${fmt(days, 0)}`, note: bi("days", "يوم"), strong: true },
      ],
    };
  },
  content: {
    intro: bi("For an indefinite-term contract, either party can end the contract for a legitimate reason by giving written notice. The Saudi Labor Law sets a minimum notice period that differs depending on who gives notice; a contract may set a longer one.",
      "في العقد غير محدد المدة يجوز لأي من الطرفين إنهاؤه لسبب مشروع بإشعار كتابي. ويحدد نظام العمل حدًا أدنى لمدة الإشعار يختلف بحسب الطرف المُشعِر، ويجوز أن ينص العقد على مدة أطول."),
    howTo: bi("Choose who gives notice and the date it is given. If your contract sets a longer notice period, enter it.", "اختر الطرف المقدِّم للإشعار وتاريخ تقديمه، وإذا نص عقدك على مدة أطول فأدخلها."),
    formula: bi("Since 19 February 2025, for a monthly-paid worker the minimum notice is 30 days when the worker ends the contract and 60 days when the employer does; for other workers it is 30 days either way. End date = notice date + the longer of the legal minimum and the contract's notice period (calendar days).", "منذ ١٩ فبراير ٢٠٢٥ أصبح الحد الأدنى للإشعار للعامل ذي الأجر الشهري ٣٠ يومًا إذا كان الإنهاء من العامل و٦٠ يومًا إذا كان من صاحب العمل، و٣٠ يومًا لأي من الطرفين لغيره. تاريخ الانتهاء = تاريخ الإشعار + المدة الأطول بين الحد النظامي ومدة الإشعار في العقد (أيام تقويمية)."),
    limitations: bi("Fixed-term contracts end on their end date and are not covered by this notice rule.", "العقود محددة المدة تنتهي بانتهاء مدتها ولا تشملها قاعدة الإشعار هذه."),
  },
  related: ["end-of-service", "contract-duration"],
  reviewed: REVIEWED,
};

export const contractDuration: Calculator = {
  slug: "contract-duration",
  section: "calculators",
  title: bi("Employment Contract Duration Calculator", "حاسبة مدة عقد العمل"),
  short: bi("Contract length, time served and time remaining between two dates.", "مدة العقد والمدة المنقضية والمتبقية بين تاريخين."),
  metaDescription: bi("Calculate the length of an employment contract in years, months and days, how much has been served and how much remains until it ends.", "احسب مدة عقد العمل بالسنوات والأشهر والأيام، والمدة المنقضية والمتبقية حتى انتهائه."),
  kind: "estimate",
  ruleIds: ["fixed_term_contracts"],
  inputs: [
    { id: "start", type: "date", label: bi("Contract start", "بداية العقد"), default: "2025-01-01" },
    { id: "end", type: "date", label: bi("Contract end", "نهاية العقد"), default: "2027-12-31" },
  ],
  compute(v) {
    const start = s(v, "start"), end = s(v, "end");
    const total = serviceYears(start, end);
    const now = today();
    const served = now <= start ? 0 : Math.min(total.days, Math.round((Date.parse(`${now}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000));
    const ymd = (a: string, b: string) => {
      const d1 = new Date(`${a}T00:00:00Z`), d2 = new Date(`${b}T00:00:00Z`);
      let y = d2.getUTCFullYear() - d1.getUTCFullYear(), m = d2.getUTCMonth() - d1.getUTCMonth(), d = d2.getUTCDate() - d1.getUTCDate();
      if (d < 0) { m--; d += new Date(Date.UTC(d2.getUTCFullYear(), d2.getUTCMonth(), 0)).getUTCDate(); }
      if (m < 0) { y--; m += 12; }
      return { y, m, d };
    };
    const t = ymd(start, end);
    return {
      headline: { label: bi("Contract length", "مدة العقد"), value: `${fmt(t.y, 0)} / ${fmt(t.m, 0)} / ${fmt(t.d, 0)}` },
      rows: [
        { label: bi("Years / months / days", "سنوات / أشهر / أيام"), value: `${fmt(t.y, 0)} / ${fmt(t.m, 0)} / ${fmt(t.d, 0)}` },
        { label: bi("Total days", "إجمالي الأيام"), value: fmt(total.days, 0) },
        { label: bi("Days served so far", "الأيام المنقضية"), value: fmt(served, 0) },
        { label: bi("Days remaining", "الأيام المتبقية"), value: fmt(Math.max(0, total.days - served), 0), strong: true },
      ],
    };
  },
  content: {
    intro: bi("Use this tool to see how long a contract runs and how much of it is left, for example before a renewal or a notice decision.", "استخدم هذه الأداة لمعرفة مدة العقد وما تبقى منه، مثلًا قبل التجديد أو اتخاذ قرار الإشعار."),
    howTo: bi("Enter the contract's start and end dates from your contract or Qiwa.", "أدخل تاريخي بداية العقد ونهايته من عقدك أو من منصة قوى."),
    formula: bi("Calendar difference between the two dates; days served are counted up to today.", "الفرق التقويمي بين التاريخين، وتُحسب الأيام المنقضية حتى اليوم."),
  },
  related: ["notice-period", "end-of-service"],
  reviewed: REVIEWED,
};

export const salaryIncrease: Calculator = {
  slug: "salary-increase",
  section: "calculators",
  title: bi("Salary Increase Percentage Calculator", "حاسبة نسبة زيادة الراتب"),
  short: bi("The percentage between an old and a new salary, or the new salary after a raise.", "نسبة الزيادة بين راتب قديم وجديد، أو الراتب الجديد بعد الزيادة."),
  metaDescription: bi("Calculate a salary increase as a percentage, or the new salary after a percentage raise, with monthly and annual differences.", "احسب زيادة الراتب كنسبة مئوية أو الراتب الجديد بعد زيادة بنسبة معينة، مع الفرق الشهري والسنوي."),
  kind: "estimate",
  ruleIds: [],
  inputs: [
    { id: "mode", type: "select", label: bi("I know", "أعرف"), default: "two", options: [
      { value: "two", label: bi("The old and the new salary", "الراتب القديم والجديد") }, { value: "pct", label: bi("The old salary and the raise %", "الراتب القديم ونسبة الزيادة") }] },
    { id: "old", type: "number", label: bi("Old monthly salary", "الراتب الشهري القديم"), unit: bi("SAR", "ر.س"), min: 0, step: 50, default: 10000 },
    { id: "new", type: "number", label: bi("New monthly salary", "الراتب الشهري الجديد"), unit: bi("SAR", "ر.س"), min: 0, step: 50, default: 11000, showIf: (v) => v.mode !== "pct" },
    { id: "pct", type: "number", label: bi("Raise", "نسبة الزيادة"), unit: bi("%", "٪"), min: -100, max: 1000, step: 0.5, default: 5, showIf: (v) => v.mode === "pct" },
  ],
  compute(v) {
    const old = n(v, "old", { min: 0 });
    if (old === 0) throw new InputError("old", bi("Enter the old salary.", "أدخل الراتب القديم."));
    const nw = s(v, "mode") === "pct" ? old * (1 + n(v, "pct") / 100) : n(v, "new", { min: 0 });
    const change = (nw - old) / old * 100;
    return {
      headline: { label: s(v, "mode") === "pct" ? bi("New monthly salary", "الراتب الشهري الجديد") : bi("Increase", "نسبة الزيادة"), value: s(v, "mode") === "pct" ? sar(nw) : pct(change) },
      rows: [
        { label: bi("Change per month", "الفرق الشهري"), value: sar(nw - old) },
        { label: bi("Change per year", "الفرق السنوي"), value: sar((nw - old) * 12) },
        { label: bi("Percentage", "النسبة"), value: pct(change), strong: true },
      ],
    };
  },
  content: {
    intro: bi("Compare an offer or a raise in percentage terms.", "قارن عرضًا وظيفيًا أو زيادة في الراتب بالنسبة المئوية."),
    howTo: bi("Enter both salaries, or the old salary and the raise percentage.", "أدخل الراتبين، أو الراتب القديم ونسبة الزيادة."),
    formula: bi("Increase % = (new − old) ÷ old × 100.", "نسبة الزيادة = (الجديد − القديم) ÷ القديم × ١٠٠."),
    example: bi("SAR 10,000 to SAR 11,000 is a 10% increase, SAR 12,000 more a year.", "من ١٠٬٠٠٠ إلى ١١٬٠٠٠ ر.س زيادة بنسبة ١٠٪، أي ١٢٬٠٠٠ ر.س إضافية في السنة."),
  },
  related: ["salary-breakdown", "household-budget"],
  reviewed: REVIEWED,
};

export const EMPLOYMENT = [endOfService, overtime, annualLeave, unusedLeave, gosi, salaryBreakdown, noticePeriod, contractDuration, salaryIncrease];
