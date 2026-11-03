/** Family & cost-of-living calculators. No market averages are invented: amounts are the user's own, assumptions are labelled. */
import { bi, sar, fmt, pct } from "../lib";
import { type Calculator, n, s, InputError } from "./types";

const REVIEWED = "2026-11-03";
const money = (id: string, en: string, ar: string, help?: [string, string]) => ({
  id, type: "number" as const, label: bi(en, ar), unit: bi("SAR / month", "ر.س / شهريًا"), min: 0, step: 50, default: 0,
  ...(help ? { help: bi(help[0], help[1]) } : {}),
});

const CITIES = ["Riyadh", "Jeddah", "Makkah", "Madinah", "Dammam", "Khobar", "Dhahran", "Taif", "Abha", "Tabuk", "Hail", "Jazan", "Najran", "Al Ahsa"];
const CITY_AR: Record<string, string> = { Riyadh: "الرياض", Jeddah: "جدة", Makkah: "مكة المكرمة", Madinah: "المدينة المنورة", Dammam: "الدمام", Khobar: "الخبر", Dhahran: "الظهران", Taif: "الطائف", Abha: "أبها", Tabuk: "تبوك", Hail: "حائل", Jazan: "جازان", Najran: "نجران", "Al Ahsa": "الأحساء" };
export const COL_CITIES = CITIES.map((c) => ({ value: c.toLowerCase().replace(/\s+/g, "-"), label: bi(c, CITY_AR[c]) }));

export const householdBudget: Calculator = {
  slug: "household-budget",
  section: "calculators",
  title: bi("Monthly Household Budget Calculator", "حاسبة ميزانية الأسرة الشهرية"),
  short: bi("Income against spending by category, what is left to save and each category's share.", "الدخل مقابل الإنفاق حسب البند، وما يتبقى للادخار ونسبة كل بند."),
  metaDescription: bi("Build a monthly household budget in Saudi Arabia: income, housing, utilities, food, transport, schooling and healthcare, with each category's share.", "أعد ميزانية شهرية لأسرتك في السعودية: الدخل والسكن والفواتير والطعام والمواصلات والتعليم والرعاية الصحية والادخار، مع نسبة كل بند."),
  kind: "estimate",
  ruleIds: [],
  inputs: [
    money("income", "Net household income", "صافي دخل الأسرة"),
    money("housing", "Rent or housing installment", "الإيجار أو قسط السكن", ["Annual rent ÷ 12", "الإيجار السنوي ÷ ١٢"]),
    money("utilities", "Electricity, water, internet, mobile", "الكهرباء والمياه والإنترنت والجوال"),
    money("food", "Groceries and eating out", "البقالة والمطاعم"),
    money("transport", "Transport (fuel, installments, taxis)", "المواصلات (الوقود والأقساط وسيارات الأجرة)"),
    money("education", "School and childcare", "المدرسة ورعاية الأطفال", ["Yearly fees ÷ 12", "الرسوم السنوية ÷ ١٢"]),
    money("health", "Healthcare and insurance", "الرعاية الصحية والتأمين"),
    money("domestic", "Domestic help", "العمالة المنزلية"),
    money("remit", "Money sent to family", "التحويلات للأهل"),
    money("other", "Other spending", "مصاريف أخرى"),
  ],
  compute(v) {
    const income = n(v, "income", { min: 0 });
    const keys = [["housing", bi("Housing", "السكن")], ["utilities", bi("Utilities", "الفواتير")], ["food", bi("Food", "الطعام")], ["transport", bi("Transport", "المواصلات")],
      ["education", bi("Education", "التعليم")], ["health", bi("Healthcare", "الرعاية الصحية")], ["domestic", bi("Domestic help", "العمالة المنزلية")],
      ["remit", bi("Remittances", "التحويلات")], ["other", bi("Other", "أخرى")]] as const;
    const amounts = keys.map(([k, label]) => ({ label, amount: n(v, k, { min: 0 }) })).filter((x) => x.amount > 0);
    const spend = amounts.reduce((t, x) => t + x.amount, 0);
    const left = income - spend;
    return {
      headline: { label: left >= 0 ? bi("Left each month", "المتبقي شهريًا") : bi("Monthly shortfall", "العجز الشهري"), value: sar(Math.abs(left), 0) },
      rows: [
        ...amounts.map((x) => ({ label: x.label, value: sar(x.amount, 0), note: income > 0 ? bi(`${fmt(x.amount / income * 100, 1)}% of income`, `${fmt(x.amount / income * 100, 1)}٪ من الدخل`) : undefined })),
        { label: bi("Total spending", "إجمالي الإنفاق"), value: sar(spend, 0), strong: true },
        { label: bi("Savings rate", "نسبة الادخار"), value: income > 0 ? pct(Math.max(0, left) / income * 100, 1) : "—" },
      ],
      warnings: left < 0 ? [bi("Spending is higher than income.", "الإنفاق أعلى من الدخل.")] : [],
    };
  },
  content: {
    intro: bi("A clear monthly budget shows where the money goes and what is left to save. Enter your own figures; nothing is pre-filled with assumed prices.", "تُظهر الميزانية الشهرية الواضحة أين يذهب المال وما يتبقى للادخار. أدخل أرقامك الخاصة، فلا توجد أسعار مفترضة مسبقًا."),
    howTo: bi("Enter your net monthly income and what you spend in each category. Convert yearly costs (rent, school fees, insurance) to monthly by dividing by 12.", "أدخل صافي دخلك الشهري وما تنفقه في كل بند، وحوّل التكاليف السنوية (الإيجار والرسوم والتأمين) إلى شهرية بقسمتها على ١٢."),
    formula: bi("Left = income − Σ categories. Share = category ÷ income.", "المتبقي = الدخل − مجموع البنود. النسبة = البند ÷ الدخل."),
  },
  related: ["savings-goal", "rent-affordability", "cost-of-living", "utility-budget"],
  reviewed: REVIEWED,
};

export const savingsGoal: Calculator = {
  slug: "savings-goal",
  section: "calculators",
  title: bi("Savings Goal Calculator", "حاسبة هدف الادخار"),
  short: bi("How long it takes to reach a goal, or how much to save each month.", "كم من الوقت تحتاج للوصول إلى هدفك، أو كم تدّخر شهريًا."),
  metaDescription: bi("Work out how many months it takes to reach a savings goal with a monthly amount, or the monthly saving needed for a goal by a date.", "احسب عدد الأشهر اللازمة لبلوغ هدف ادخار بمبلغ شهري، أو المبلغ الشهري اللازم لبلوغ هدف بحلول موعد."),
  kind: "estimate",
  ruleIds: [],
  inputs: [
    { id: "goal", type: "number", label: bi("Savings goal", "هدف الادخار"), unit: bi("SAR", "ر.س"), min: 1, step: 500, default: 30000 },
    { id: "saved", type: "number", label: bi("Already saved", "المدخر حاليًا"), unit: bi("SAR", "ر.س"), min: 0, step: 500, default: 0 },
    { id: "mode", type: "select", label: bi("I want to know", "أريد أن أعرف"), default: "time", options: [
      { value: "time", label: bi("How long it takes", "المدة اللازمة") }, { value: "amount", label: bi("How much to save monthly", "المبلغ الشهري") }] },
    { id: "monthly", type: "number", label: bi("Monthly saving", "الادخار الشهري"), unit: bi("SAR", "ر.س"), min: 1, step: 100, default: 1500, showIf: (v) => v.mode !== "amount" },
    { id: "months", type: "number", label: bi("Months to reach it", "عدد الأشهر"), min: 1, max: 600, step: 1, default: 24, showIf: (v) => v.mode === "amount" },
  ],
  compute(v) {
    const need = Math.max(0, n(v, "goal", { min: 1 }) - n(v, "saved", { min: 0 }));
    if (s(v, "mode") === "amount") {
      const months = n(v, "months", { min: 1 });
      return { headline: { label: bi("Save each month", "ادّخر شهريًا"), value: sar(need / months) }, rows: [{ label: bi("Still needed", "المتبقي"), value: sar(need, 0) }] };
    }
    const monthly = n(v, "monthly", { min: 0.01 });
    const months = Math.ceil(need / monthly);
    return {
      headline: { label: bi("Months to reach the goal", "الأشهر اللازمة"), value: fmt(months, 0) },
      rows: [{ label: bi("In years", "بالسنوات"), value: fmt(months / 12, 1) }, { label: bi("Still needed", "المتبقي"), value: sar(need, 0) }],
    };
  },
  content: {
    intro: bi("Set a target, such as an emergency fund, a car down payment or a trip, and see the plan.", "حدد هدفًا مثل صندوق الطوارئ أو الدفعة الأولى للسيارة أو رحلة، واعرف الخطة."),
    howTo: bi("Enter the goal and current savings, then either a monthly amount or a number of months.", "أدخل الهدف والمدخر الحالي، ثم المبلغ الشهري أو عدد الأشهر."),
    formula: bi("Months = (goal − saved) ÷ monthly saving; monthly saving = (goal − saved) ÷ months.", "الأشهر = (الهدف − المدخر) ÷ الادخار الشهري، والادخار الشهري = (الهدف − المدخر) ÷ الأشهر."),
  },
  related: ["household-budget", "education-savings"],
  reviewed: REVIEWED,
};

export const rentAffordability: Calculator = {
  slug: "rent-affordability",
  section: "cost-of-living",
  title: bi("Rent Affordability Calculator", "حاسبة القدرة على تحمّل الإيجار"),
  short: bi("The yearly rent you can afford from your income and the share you choose.", "الإيجار السنوي الذي يمكنك تحمّله من دخلك والنسبة التي تختارها."),
  metaDescription: bi("Find an affordable yearly rent in Saudi Arabia from your monthly income and the share of income you are willing to spend on housing, with payment schedules.", "اعرف الإيجار السنوي المناسب في السعودية من دخلك الشهري ونسبة الدخل التي ترغب في إنفاقها على السكن، مع جداول الدفع."),
  kind: "estimate",
  ruleIds: [],
  inputs: [
    { id: "income", type: "number", label: bi("Net monthly income", "صافي الدخل الشهري"), unit: bi("SAR", "ر.س"), min: 0, step: 500, default: 15000 },
    { id: "share", type: "number", label: bi("Share of income for rent (your choice)", "نسبة الدخل للإيجار (حسب اختيارك)"), unit: bi("%", "٪"), min: 1, max: 80, step: 1, default: 30,
      help: bi("A common budgeting guideline is about 30%, not a rule; choose what fits your other costs.", "إرشاد شائع في التخطيط المالي نحو ٣٠٪ وليس قاعدة؛ اختر ما يناسب تكاليفك الأخرى.") },
    { id: "rent", type: "number", label: bi("Yearly rent you are considering (optional)", "الإيجار السنوي الذي تدرسه (اختياري)"), unit: bi("SAR", "ر.س"), min: 0, step: 1000, default: 0 },
  ],
  compute(v) {
    const income = n(v, "income", { min: 0 }), share = n(v, "share", { min: 0, max: 100 }) / 100, rent = n(v, "rent", { min: 0 });
    const yearly = income * 12 * share;
    return {
      headline: { label: bi("Affordable yearly rent", "الإيجار السنوي المناسب"), value: sar(yearly, 0) },
      rows: [
        { label: bi("Per month", "شهريًا"), value: sar(yearly / 12, 0) },
        { label: bi("Two payments (every 6 months)", "دفعتان (كل ٦ أشهر)"), value: sar(yearly / 2, 0) },
        { label: bi("Four payments (quarterly)", "أربع دفعات (ربع سنوية)"), value: sar(yearly / 4, 0) },
        ...(rent > 0 ? [{ label: bi("The rent you entered takes", "الإيجار المدخل يمثل"), value: income > 0 ? pct(rent / 12 / income * 100, 1) : "—", note: bi("of income", "من الدخل"), strong: true }] : []),
      ],
    };
  },
  content: {
    intro: bi("Rents in Saudi Arabia are usually quoted per year and paid in one, two or four instalments through contracts registered on Ejar. Decide what share of your income can go on housing.", "تُعرض الإيجارات في السعودية عادة بالسنة وتُدفع على دفعة أو دفعتين أو أربع دفعات بعقود موثقة في منصة إيجار. حدد نسبة دخلك التي يمكن تخصيصها للسكن."),
    howTo: bi("Enter your net monthly income and the share you want to spend on rent; optionally test a specific rent.", "أدخل صافي دخلك الشهري والنسبة التي تريد إنفاقها على الإيجار، ويمكنك اختبار إيجار محدد."),
    formula: bi("Affordable yearly rent = monthly income × 12 × share.", "الإيجار السنوي المناسب = الدخل الشهري × ١٢ × النسبة."),
    limitations: bi("Agency commission, deposit, utilities connection and Ejar fees are not included.", "لا تشمل الحسبة عمولة المكتب والتأمين وتوصيل الخدمات ورسوم إيجار."),
  },
  related: ["cost-of-living", "household-budget", "relocation-cost"],
  reviewed: REVIEWED,
};

export const costOfLiving: Calculator = {
  slug: "cost-of-living",
  section: "cost-of-living",
  title: bi("Family Cost-of-Living Calculator (Saudi Cities)", "حاسبة تكلفة المعيشة للأسرة (المدن السعودية)"),
  short: bi("A monthly family budget for living in a Saudi city, built from your own assumptions.", "ميزانية شهرية لمعيشة الأسرة في مدينة سعودية، مبنية على افتراضاتك."),
  metaDescription: bi("Estimate your family's monthly cost of living in Riyadh, Jeddah, Dammam, Khobar and other Saudi cities from the rent, school fees and costs you set.", "قدّر تكلفة المعيشة الشهرية لأسرتك في الرياض وجدة والدمام والخبر وغيرها من المدن السعودية من الإيجار والرسوم والتكاليف التي تحددها."),
  kind: "estimate",
  ruleIds: [],
  inputs: [
    { id: "city", type: "select", label: bi("City", "المدينة"), default: "riyadh", options: COL_CITIES },
    { id: "adults", type: "number", label: bi("Adults", "البالغون"), min: 1, max: 10, step: 1, default: 2 },
    { id: "children", type: "number", label: bi("Children", "الأطفال"), min: 0, max: 12, step: 1, default: 2 },
    { id: "housing", type: "select", label: bi("Housing", "السكن"), default: "apartment", options: [
      { value: "apartment", label: bi("Apartment", "شقة") }, { value: "villa", label: bi("Villa", "فيلا") }, { value: "compound", label: bi("Compound", "مجمع سكني") }, { value: "floor", label: bi("Floor in a villa", "دور في فيلا") }] },
    { id: "rentYear", type: "number", label: bi("Yearly rent", "الإيجار السنوي"), unit: bi("SAR", "ر.س"), min: 0, step: 1000, default: 0 },
    { id: "schoolYear", type: "number", label: bi("School fees per year (all children)", "الرسوم الدراسية سنويًا (لكل الأطفال)"), unit: bi("SAR", "ر.س"), min: 0, step: 1000, default: 0 },
    money("transport", "Transport", "المواصلات"),
    money("utilities", "Utilities", "الفواتير"),
    money("groceries", "Groceries", "البقالة"),
    money("health", "Healthcare", "الرعاية الصحية"),
    money("other", "Leisure and other", "الترفيه وغيرها"),
    money("savings", "Savings target", "هدف الادخار"),
    money("income", "Net household income (optional)", "صافي دخل الأسرة (اختياري)"),
  ],
  compute(v) {
    const rent = n(v, "rentYear", { min: 0 }) / 12, school = n(v, "schoolYear", { min: 0 }) / 12;
    const items = [
      [bi("Housing (rent ÷ 12)", "السكن (الإيجار ÷ ١٢)"), rent], [bi("Schooling (fees ÷ 12)", "التعليم (الرسوم ÷ ١٢)"), school],
      [bi("Transport", "المواصلات"), n(v, "transport", { min: 0 })], [bi("Utilities", "الفواتير"), n(v, "utilities", { min: 0 })],
      [bi("Groceries", "البقالة"), n(v, "groceries", { min: 0 })], [bi("Healthcare", "الرعاية الصحية"), n(v, "health", { min: 0 })],
      [bi("Leisure and other", "الترفيه وغيرها"), n(v, "other", { min: 0 })], [bi("Savings", "الادخار"), n(v, "savings", { min: 0 })],
    ] as const;
    const total = items.reduce((t, [, x]) => t + (x as number), 0);
    if (total === 0) throw new InputError("rentYear", bi("Enter at least one cost to build the budget.", "أدخل تكلفة واحدة على الأقل لبناء الميزانية."));
    const people = n(v, "adults", { min: 1 }) + n(v, "children", { min: 0 });
    const income = n(v, "income", { min: 0 });
    const city = COL_CITIES.find((c) => c.value === s(v, "city"))?.label;
    return {
      headline: { label: city ? bi(`Monthly budget in ${city.en}`, `الميزانية الشهرية في ${city.ar}`) : bi("Monthly budget", "الميزانية الشهرية"), value: sar(total, 0) },
      rows: [
        ...items.filter(([, x]) => (x as number) > 0).map(([label, x]) => ({ label, value: sar(x as number, 0) })),
        { label: bi("Per person", "للفرد"), value: sar(total / people, 0) },
        { label: bi("Per year", "سنويًا"), value: sar(total * 12, 0), strong: true },
        ...(income > 0 ? [{ label: bi("Income left after the budget", "المتبقي من الدخل بعد الميزانية"), value: sar(income - total, 0) }] : []),
      ],
      warnings: [bi("SaudiYP does not show city price averages without verified data. Use quotes, listings and your bills for each figure.", "لا يعرض SaudiYP متوسطات أسعار للمدن دون بيانات موثقة؛ استخدم عروض الأسعار والإعلانات وفواتيرك لكل رقم.")],
    };
  },
  content: {
    intro: bi("Living costs vary widely by city, neighbourhood, housing type and lifestyle. Rather than quoting unverified averages, this calculator builds your family's budget from the figures you collect for the city you are considering.", "تختلف تكاليف المعيشة كثيرًا بحسب المدينة والحي ونوع السكن ونمط الحياة. وبدل عرض متوسطات غير موثقة، تبني هذه الحاسبة ميزانية أسرتك من الأرقام التي تجمعها للمدينة التي تدرسها."),
    howTo: bi("Pick the city and household, then enter the yearly rent and school fees you have been quoted and your expected monthly costs.", "اختر المدينة وأفراد الأسرة، ثم أدخل الإيجار والرسوم الدراسية السنوية التي عُرضت عليك وتكاليفك الشهرية المتوقعة."),
    formula: bi("Monthly = rent ÷ 12 + school fees ÷ 12 + monthly costs + savings.", "الشهري = الإيجار ÷ ١٢ + الرسوم ÷ ١٢ + التكاليف الشهرية + الادخار."),
  },
  related: ["rent-affordability", "relocation-cost", "household-budget", "school-budget"],
  reviewed: REVIEWED,
};

export const relocationCost: Calculator = {
  slug: "relocation-cost",
  section: "cost-of-living",
  title: bi("Family Relocation Cost Estimator", "مقدّر تكلفة انتقال الأسرة"),
  short: bi("One-off costs of moving to a new Saudi city or into the Kingdom.", "التكاليف لمرة واحدة للانتقال إلى مدينة سعودية جديدة أو إلى المملكة."),
  metaDescription: bi("Add up the one-off costs of relocating a family in Saudi Arabia: rent advance, deposit, agency fee, movers, furniture, utility connections and travel.", "اجمع التكاليف لمرة واحدة لانتقال الأسرة في السعودية: الإيجار المقدم والتأمين وعمولة المكتب ونقل العفش والأثاث وتوصيل الخدمات والسفر."),
  kind: "estimate",
  ruleIds: [],
  inputs: [
    { id: "rentAdvance", type: "number", label: bi("First rent payment", "دفعة الإيجار الأولى"), unit: bi("SAR", "ر.س"), min: 0, step: 500, default: 0 },
    { id: "deposit", type: "number", label: bi("Security deposit", "مبلغ التأمين"), unit: bi("SAR", "ر.س"), min: 0, step: 500, default: 0 },
    { id: "agency", type: "number", label: bi("Agency commission", "عمولة المكتب العقاري"), unit: bi("SAR", "ر.س"), min: 0, step: 100, default: 0 },
    { id: "movers", type: "number", label: bi("Movers (quote)", "نقل العفش (عرض السعر)"), unit: bi("SAR", "ر.س"), min: 0, step: 100, default: 0 },
    { id: "furniture", type: "number", label: bi("Furniture and appliances", "الأثاث والأجهزة"), unit: bi("SAR", "ر.س"), min: 0, step: 500, default: 0 },
    { id: "connections", type: "number", label: bi("Utility and internet connections", "توصيل الخدمات والإنترنت"), unit: bi("SAR", "ر.س"), min: 0, step: 50, default: 0 },
    { id: "travel", type: "number", label: bi("Travel and temporary stay", "السفر والسكن المؤقت"), unit: bi("SAR", "ر.س"), min: 0, step: 100, default: 0 },
    { id: "other", type: "number", label: bi("Other (school registration, car…)", "أخرى (تسجيل المدرسة، السيارة…)"), unit: bi("SAR", "ر.س"), min: 0, step: 100, default: 0 },
    { id: "buffer", type: "number", label: bi("Contingency", "احتياطي للطوارئ"), unit: bi("%", "٪"), min: 0, max: 50, step: 1, default: 10 },
  ],
  compute(v) {
    const ids = ["rentAdvance", "deposit", "agency", "movers", "furniture", "connections", "travel", "other"];
    const sum = ids.reduce((t, id) => t + n(v, id, { min: 0 }), 0);
    const buffer = sum * n(v, "buffer", { min: 0, max: 100 }) / 100;
    return {
      headline: { label: bi("Total moving budget", "ميزانية الانتقال الإجمالية"), value: sar(sum + buffer, 0) },
      rows: [
        { label: bi("Costs entered", "التكاليف المدخلة"), value: sar(sum, 0) },
        { label: bi("Contingency", "الاحتياطي"), value: sar(buffer, 0) },
        { label: bi("Refundable (deposit)", "المسترد (التأمين)"), value: sar(n(v, "deposit"), 0) },
      ],
    };
  },
  content: {
    intro: bi("A move costs more than the first rent. List every one-off cost with your quotes and keep a contingency.", "الانتقال يكلف أكثر من دفعة الإيجار الأولى؛ اكتب كل تكلفة لمرة واحدة من عروض الأسعار واحتفظ باحتياطي."),
    howTo: bi("Enter each cost you expect, using quotes from agencies and movers.", "أدخل كل تكلفة متوقعة باستخدام عروض أسعار المكاتب وشركات النقل."),
    formula: bi("Total = Σ costs × (1 + contingency %).", "الإجمالي = مجموع التكاليف × (١ + نسبة الاحتياطي)."),
  },
  related: ["cost-of-living", "rent-affordability"],
  reviewed: REVIEWED,
};

export const FAMILY = [householdBudget, savingsGoal, rentAffordability, costOfLiving, relocationCost];
