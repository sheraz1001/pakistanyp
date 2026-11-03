/** Cars & driving calculators. Government fees and fuel prices come from the rules data; market prices are user inputs. */
import { bi, sar, fmt, pct } from "../lib";
import { type Calculator, type Rules, type Values, n, s, ruleValue, round2, InputError } from "./types";
import { tieredCharge } from "./utilities";

const REVIEWED = "2026-11-03";

const fuelPrice = (rules: Rules, fuel: string) => {
  const f = ruleValue(rules, "fuel_prices");
  const p = fuel === "gasoline95" ? f.gasoline95 : fuel === "diesel" ? f.diesel : fuel === "gasoline98" ? f.gasoline98?.price : f.gasoline91;
  if (typeof p !== "number") throw new InputError("fuel", bi("No official price for this fuel; enter a price.", "لا يوجد سعر رسمي لهذا الوقود؛ أدخل السعر."));
  return p;
};
const fuelInputs = [
  { id: "fuel", type: "select" as const, label: bi("Fuel", "نوع الوقود"), default: "gasoline91", options: [
    { value: "gasoline91", label: bi("Gasoline 91", "بنزين ٩١") }, { value: "gasoline95", label: bi("Gasoline 95", "بنزين ٩٥") },
    { value: "gasoline98", label: bi("Gasoline 98", "بنزين ٩٨") }, { value: "diesel", label: bi("Diesel", "ديزل") }] },
  { id: "price", type: "number" as const, label: bi("Price per litre (0 = official price)", "السعر للتر (٠ = السعر الرسمي)"), unit: bi("SAR", "ر.س"), min: 0, max: 20, step: 0.01, default: 0,
    help: bi("Leave 0 to use the latest Aramco price in our data, or enter the pump price.", "اترك ٠ لاستخدام آخر سعر من أرامكو في بياناتنا، أو أدخل سعر المحطة.") },
];
const litrePrice = (v: Values, rules: Rules) => (n(v, "price", { min: 0 }) > 0 ? n(v, "price") : fuelPrice(rules, s(v, "fuel")));

export const fuelCost: Calculator = {
  slug: "fuel-cost",
  section: "cars-driving",
  title: bi("Fuel Cost Calculator (Saudi Fuel Prices)", "حاسبة تكلفة الوقود (أسعار الوقود في السعودية)"),
  short: bi("Monthly and yearly fuel cost from distance driven and consumption, at Saudi fuel prices.", "تكلفة الوقود الشهرية والسنوية من المسافة والاستهلاك بأسعار الوقود في السعودية."),
  metaDescription: bi("Calculate your car's fuel cost in Saudi Arabia per month and year from kilometres driven and fuel consumption, using current Aramco fuel prices.", "احسب تكلفة وقود سيارتك في السعودية شهريًا وسنويًا من الكيلومترات المقطوعة واستهلاك الوقود بأسعار أرامكو الحالية."),
  kind: "estimate",
  ruleIds: ["fuel_prices"],
  inputs: [
    { id: "km", type: "number", label: bi("Distance per month", "المسافة شهريًا"), unit: bi("km", "كم"), min: 0, max: 50000, step: 50, default: 2000 },
    { id: "kmpl", type: "number", label: bi("Fuel economy", "معدل الاستهلاك"), unit: bi("km per litre", "كم/لتر"), min: 1, max: 50, step: 0.1, default: 12 },
    ...fuelInputs,
  ],
  compute(v, rules) {
    const km = n(v, "km", { min: 0 }), kmpl = n(v, "kmpl", { min: 0.5 }), price = litrePrice(v, rules);
    const litres = km / kmpl, cost = litres * price;
    return {
      headline: { label: bi("Fuel cost per month", "تكلفة الوقود شهريًا"), value: sar(cost) },
      rows: [
        { label: bi("Litres per month", "اللترات شهريًا"), value: fmt(litres, 1) },
        { label: bi("Price per litre", "سعر اللتر"), value: sar(price) },
        { label: bi("Cost per km", "التكلفة لكل كم"), value: sar(price / kmpl, 3) },
        { label: bi("Per month", "شهريًا"), value: sar(cost), strong: true },
        { label: bi("Per year", "سنويًا"), value: sar(cost * 12) },
      ],
    };
  },
  content: {
    intro: bi("Fuel prices in Saudi Arabia are set by Aramco and reviewed periodically. Gasoline 91 and 95 prices have been capped since July 2021; diesel is reviewed once a year and Gasoline 98 monthly.", "تحدد أرامكو السعودية أسعار الوقود وتراجعها دوريًا. وأسعار بنزين ٩١ و٩٥ ثابتة بسقف منذ يوليو ٢٠٢١، ويُراجع سعر الديزل سنويًا وبنزين ٩٨ شهريًا."),
    howTo: bi("Enter how far you drive each month and your car's fuel economy in km per litre (from the trip computer or the manufacturer).", "أدخل المسافة التي تقطعها شهريًا ومعدل استهلاك سيارتك بالكيلومتر لكل لتر (من كمبيوتر الرحلة أو بيانات الشركة المصنعة)."),
    formula: bi("Litres = km ÷ km per litre. Cost = litres × price per litre.", "اللترات = الكيلومترات ÷ كم لكل لتر. التكلفة = اللترات × سعر اللتر."),
    example: bi("2,000 km a month at 12 km/L with Gasoline 91 at SAR 2.18: 166.7 L × 2.18 = SAR 363.33 a month.", "٢٬٠٠٠ كم شهريًا بمعدل ١٢ كم/لتر وبنزين ٩١ بسعر ٢٫١٨ ر.س: ١٦٦٫٧ لتر × ٢٫١٨ = ٣٦٣٫٣٣ ر.س شهريًا."),
  },
  related: ["trip-fuel-cost", "car-ownership", "ev-charging"],
  reviewed: REVIEWED,
};

export const tripCost: Calculator = {
  slug: "trip-fuel-cost",
  section: "cars-driving",
  title: bi("Road Trip Fuel Cost Calculator", "حاسبة تكلفة وقود الرحلة البرية"),
  short: bi("Fuel for a trip, one way or return, and the cost per passenger.", "تكلفة وقود الرحلة ذهابًا أو ذهابًا وعودة، ونصيب كل راكب."),
  metaDescription: bi("Plan a road trip in Saudi Arabia: fuel needed and cost for one way or a return trip, split between passengers, at current fuel prices.", "خطط لرحلتك البرية في السعودية: كمية الوقود وتكلفتها ذهابًا أو ذهابًا وعودة، مقسمة على الركاب بأسعار الوقود الحالية."),
  kind: "estimate",
  ruleIds: ["fuel_prices"],
  inputs: [
    { id: "km", type: "number", label: bi("Distance (one way)", "المسافة (ذهابًا)"), unit: bi("km", "كم"), min: 1, max: 5000, step: 5, default: 950, help: bi("For example Riyadh to Jeddah by road is roughly 950 km; check your route on a map.", "مثلًا المسافة البرية من الرياض إلى جدة نحو ٩٥٠ كم تقريبًا؛ تحقق من مسارك على الخريطة.") },
    { id: "return", type: "toggle", label: bi("Return trip", "ذهاب وعودة"), default: true },
    { id: "kmpl", type: "number", label: bi("Fuel economy on the highway", "معدل الاستهلاك على الطرق السريعة"), unit: bi("km per litre", "كم/لتر"), min: 1, max: 50, step: 0.1, default: 13 },
    { id: "people", type: "number", label: bi("People sharing the cost", "عدد المشاركين في التكلفة"), min: 1, max: 20, step: 1, default: 1 },
    ...fuelInputs,
  ],
  compute(v, rules) {
    const km = n(v, "km", { min: 0 }) * (v.return === true || v.return === "true" ? 2 : 1), kmpl = n(v, "kmpl", { min: 0.5 }), people = n(v, "people", { min: 1 });
    const price = litrePrice(v, rules), litres = km / kmpl, cost = litres * price;
    return {
      headline: { label: bi("Fuel cost for the trip", "تكلفة وقود الرحلة"), value: sar(cost) },
      rows: [
        { label: bi("Total distance", "المسافة الإجمالية"), value: `${fmt(km, 0)} km` },
        { label: bi("Fuel needed", "الوقود المطلوب"), value: `${fmt(litres, 1)} L` },
        { label: bi("Per person", "لكل شخص"), value: sar(cost / people), strong: true },
      ],
    };
  },
  content: {
    intro: bi("Estimate fuel for intercity driving, such as a family trip between Riyadh, Jeddah, Dammam or Abha.", "قدّر وقود رحلاتك بين المدن، كرحلة عائلية بين الرياض وجدة والدمام وأبها."),
    howTo: bi("Enter the route distance, your highway fuel economy and how many people share the cost.", "أدخل مسافة الطريق ومعدل استهلاك السيارة على الطرق السريعة وعدد المشاركين في التكلفة."),
    formula: bi("Cost = distance (× 2 for return) ÷ km per litre × price per litre.", "التكلفة = المسافة (× ٢ للعودة) ÷ كم لكل لتر × سعر اللتر."),
  },
  related: ["fuel-cost", "car-ownership"],
  reviewed: REVIEWED,
};

/** Flat-rate car finance (as commonly quoted in KSA) and its equivalent annual percentage rate. */
export function carLoan(principal: number, flatRate: number, months: number) {
  const interest = principal * flatRate * (months / 12);
  const monthly = (principal + interest) / months;
  // APR: solve monthly IRR for the level payment (bisection)
  let lo = 0, hi = 1;
  const pv = (r: number) => (r === 0 ? monthly * months : monthly * (1 - Math.pow(1 + r, -months)) / r);
  if (interest > 0) { for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (pv(mid) > principal) lo = mid; else hi = mid; } }
  const apr = interest > 0 ? (lo + hi) / 2 * 12 : 0;
  return { interest: round2(interest), monthly: round2(monthly), total: round2(principal + interest), apr };
}

export const carLoanCalc: Calculator = {
  slug: "car-loan",
  section: "cars-driving",
  title: bi("Car Loan Installment Calculator", "حاسبة قسط تمويل السيارة"),
  short: bi("Monthly installment, total cost and the equivalent APR of a car finance offer.", "القسط الشهري والتكلفة الإجمالية ومعدل النسبة السنوي المكافئ لعرض تمويل السيارة."),
  metaDescription: bi("Calculate a Saudi car finance installment from price, down payment, flat rate and term, with the total cost and the equivalent APR.", "احسب قسط تمويل السيارة في السعودية من السعر والدفعة الأولى ونسبة الربح الثابتة والمدة، مع التكلفة الإجمالية ومعدل النسبة السنوي المكافئ."),
  kind: "estimate",
  ruleIds: [],
  inputs: [
    { id: "price", type: "number", label: bi("Car price", "سعر السيارة"), unit: bi("SAR", "ر.س"), min: 0, step: 1000, default: 100000 },
    { id: "down", type: "number", label: bi("Down payment", "الدفعة الأولى"), unit: bi("SAR", "ر.س"), min: 0, step: 1000, default: 10000 },
    { id: "rate", type: "number", label: bi("Flat profit rate per year (from your offer)", "نسبة الربح الثابتة سنويًا (من عرضك)"), unit: bi("%", "٪"), min: 0, max: 30, step: 0.05, default: 4,
      help: bi("Example value only. Use the rate in your bank's or finance company's offer.", "قيمة توضيحية فقط؛ استخدم النسبة الواردة في عرض البنك أو شركة التمويل.") },
    { id: "months", type: "number", label: bi("Term", "المدة"), unit: bi("months", "شهر"), min: 1, max: 120, step: 1, default: 60 },
    { id: "balloon", type: "number", label: bi("Final (balloon) payment", "الدفعة الأخيرة"), unit: bi("SAR", "ر.س"), min: 0, step: 1000, default: 0 },
  ],
  compute(v) {
    const price = n(v, "price", { min: 0 }), down = n(v, "down", { min: 0 }), rate = n(v, "rate", { min: 0 }) / 100, months = n(v, "months", { min: 1 }), balloon = n(v, "balloon", { min: 0 });
    const principal = price - down;
    if (principal <= 0) throw new InputError("down", bi("The down payment covers the whole price.", "الدفعة الأولى تغطي السعر كاملًا."));
    if (balloon >= principal) throw new InputError("balloon", bi("The final payment must be less than the financed amount.", "يجب أن تكون الدفعة الأخيرة أقل من مبلغ التمويل."));
    const profit = principal * rate * (months / 12);
    const monthly = (principal + profit - balloon) / months;
    const apr = carLoan(principal, rate, months).apr;
    return {
      headline: { label: bi("Monthly installment", "القسط الشهري"), value: sar(monthly) },
      rows: [
        { label: bi("Amount financed", "مبلغ التمويل"), value: sar(principal) },
        { label: bi("Total profit (interest)", "إجمالي الربح (الفائدة)"), value: sar(profit) },
        { label: bi("Final payment", "الدفعة الأخيرة"), value: sar(balloon) },
        { label: bi("Total you pay (incl. down payment)", "إجمالي ما تدفعه (مع الدفعة الأولى)"), value: sar(price + profit), strong: true },
        { label: bi("Equivalent APR (no balloon)", "معدل النسبة السنوي المكافئ (بدون دفعة أخيرة)"), value: pct(apr * 100) },
      ],
      warnings: [bi("Admin fees, insurance and other charges in your offer are not included. SAMA requires lenders to disclose the APR; compare offers by APR.", "لا تشمل الحسبة الرسوم الإدارية والتأمين والرسوم الأخرى في العرض، ويلزم البنك المركزي السعودي جهات التمويل بالإفصاح عن معدل النسبة السنوي؛ قارن العروض به.")],
    };
  },
  content: {
    intro: bi("Car finance in Saudi Arabia is usually quoted as a flat annual profit rate on the amount financed. The real yearly cost is higher than the flat rate, which is why the annual percentage rate (APR) matters.", "يُعرض تمويل السيارات في السعودية عادة بنسبة ربح سنوية ثابتة على مبلغ التمويل، والتكلفة السنوية الحقيقية أعلى من النسبة الثابتة، ولذلك يهم معدل النسبة السنوي."),
    howTo: bi("Enter the car price, your down payment, the flat rate and term from the offer, and any final payment.", "أدخل سعر السيارة والدفعة الأولى ونسبة الربح الثابتة والمدة من العرض، والدفعة الأخيرة إن وجدت."),
    formula: bi("Profit = amount financed × flat rate × years. Installment = (amount financed + profit − final payment) ÷ months. APR is the yearly rate at which the installments repay the amount financed.", "الربح = مبلغ التمويل × النسبة الثابتة × عدد السنوات. القسط = (مبلغ التمويل + الربح − الدفعة الأخيرة) ÷ عدد الأشهر. ومعدل النسبة السنوي هو المعدل السنوي الذي تسدد به الأقساط مبلغ التمويل."),
    example: bi("SAR 90,000 financed at 4% flat for 60 months: profit = SAR 18,000, installment = SAR 1,800, APR ≈ 7.4%.", "تمويل ٩٠٬٠٠٠ ر.س بنسبة ٤٪ ثابتة لمدة ٦٠ شهرًا: الربح = ١٨٬٠٠٠ ر.س، والقسط = ١٬٨٠٠ ر.س، ومعدل النسبة السنوي ≈ ٧٫٤٪."),
  },
  related: ["car-ownership", "vehicle-fees", "depreciation"],
  reviewed: REVIEWED,
};

export const evCharging: Calculator = {
  slug: "ev-charging",
  section: "cars-driving",
  title: bi("EV Charging Cost Calculator", "حاسبة تكلفة شحن السيارة الكهربائية"),
  short: bi("Cost of charging an electric car at home or at a public charger, per month.", "تكلفة شحن السيارة الكهربائية في المنزل أو في محطة عامة شهريًا."),
  metaDescription: bi("Estimate electric car charging costs in Saudi Arabia at home (residential tariff) or at public chargers (price you enter), compared with petrol.", "قدّر تكلفة شحن السيارة الكهربائية في السعودية في المنزل (التعرفة السكنية) أو في المحطات العامة (بالسعر الذي تدخله)، مقارنة بالبنزين."),
  kind: "estimate",
  ruleIds: ["electricity_residential", "ev_charging", "fuel_prices", "vat"],
  inputs: [
    { id: "km", type: "number", label: bi("Distance per month", "المسافة شهريًا"), unit: bi("km", "كم"), min: 0, step: 50, default: 2000 },
    { id: "eff", type: "number", label: bi("Consumption", "الاستهلاك"), unit: bi("kWh per 100 km", "ك.و.س/١٠٠ كم"), min: 5, max: 60, step: 0.5, default: 17 },
    { id: "homeShare", type: "number", label: bi("Charged at home", "نسبة الشحن المنزلي"), unit: bi("%", "٪"), min: 0, max: 100, step: 5, default: 80 },
    { id: "publicPrice", type: "number", label: bi("Public charger price", "سعر الشحن العام"), unit: bi("SAR per kWh", "ر.س/ك.و.س"), min: 0, max: 10, step: 0.01, default: 0,
      help: bi("There is no regulated public charging tariff; enter the operator's price.", "لا توجد تعرفة منظمة للشحن العام؛ أدخل سعر المشغل.") },
    { id: "loss", type: "number", label: bi("Charging losses", "فاقد الشحن"), unit: bi("%", "٪"), min: 0, max: 30, step: 1, default: 10 },
    { id: "kmpl", type: "number", label: bi("Compare with a petrol car (km/L)", "مقارنة بسيارة بنزين (كم/لتر)"), min: 1, max: 50, step: 0.5, default: 12 },
  ],
  compute(v, rules) {
    const km = n(v, "km", { min: 0 }), eff = n(v, "eff", { min: 1 }) / 100, home = n(v, "homeShare", { min: 0, max: 100 }) / 100, pub = n(v, "publicPrice", { min: 0 }), loss = n(v, "loss", { min: 0, max: 50 }) / 100;
    const kwh = km * eff / (1 - loss);
    const vat = ruleValue(rules, "vat").standardRate;
    const tiers = ruleValue(rules, "electricity_residential").current.tiers;
    const homeCost = kwh * home * tiers[0].rate / 100 * (1 + vat);
    const publicCost = kwh * (1 - home) * pub;
    const petrol = km / n(v, "kmpl", { min: 0.5 }) * ruleValue(rules, "fuel_prices").gasoline91;
    return {
      headline: { label: bi("Charging cost per month", "تكلفة الشحن شهريًا"), value: sar(homeCost + publicCost) },
      rows: [
        { label: bi("Energy needed (incl. losses)", "الطاقة المطلوبة (مع الفاقد)"), value: `${fmt(kwh, 0)} kWh` },
        { label: bi("Home charging (first residential tier + VAT)", "الشحن المنزلي (الشريحة السكنية الأولى + الضريبة)"), value: sar(homeCost) },
        { label: bi("Public charging", "الشحن العام"), value: sar(publicCost), note: pub === 0 && home < 1 ? bi("enter a price", "أدخل السعر") : undefined },
        { label: bi("Petrol car, same distance (Gasoline 91)", "سيارة بنزين للمسافة نفسها (بنزين ٩١)"), value: sar(petrol) },
      ],
    };
  },
  content: {
    intro: bi("Charging at home is billed through your home electricity bill at the residential tariff. Public charging prices are set by each operator.", "يُحاسَب الشحن المنزلي ضمن فاتورة كهرباء المنزل بالتعرفة السكنية، ويحدد كل مشغل أسعار الشحن العام."),
    howTo: bi("Enter your monthly distance, the car's consumption (kWh per 100 km), how much you charge at home and the public price you pay.", "أدخل المسافة الشهرية واستهلاك السيارة (ك.و.س لكل ١٠٠ كم) ونسبة الشحن المنزلي وسعر الشحن العام الذي تدفعه."),
    formula: bi("kWh = km × consumption ÷ (1 − losses). Home cost = kWh × home share × first-tier rate × 1.15. Public cost = kWh × public share × price.", "الطاقة = المسافة × الاستهلاك ÷ (١ − الفاقد). تكلفة المنزل = الطاقة × نسبة المنزل × سعر الشريحة الأولى × ١٫١٥. تكلفة العام = الطاقة × النسبة العامة × السعر."),
    limitations: bi("If home charging pushes your monthly use above 6,000 kWh, the extra is billed at the higher tier.", "إذا رفع الشحن المنزلي استهلاكك الشهري فوق ٦٬٠٠٠ ك.و.س فستُحاسب الزيادة بسعر الشريحة الأعلى."),
  },
  related: ["fuel-cost", "electricity-bill"],
  reviewed: REVIEWED,
};

/** SASO fuel-efficiency fee for 2016+ light vehicles from km/L. */
export function fuelEfficiencyFee(kmpl: number, bands: any[]): number {
  for (const b of bands) {
    if (b.minKmL !== undefined && kmpl < b.minKmL) continue;
    if (b.maxKmL !== undefined && kmpl > b.maxKmL) continue;
    if (b.maxKmLExclusive !== undefined && kmpl >= b.maxKmLExclusive) continue;
    return b.fee;
  }
  return 0;
}

export const vehicleFees: Calculator = {
  slug: "vehicle-fees",
  section: "cars-driving",
  title: bi("Vehicle Registration, Inspection & Licence Fees", "رسوم تسجيل المركبة والفحص الدوري ورخصة القيادة"),
  short: bi("Government fees for istimara renewal, the fuel-efficiency fee, Fahas inspection and driving licence.", "الرسوم الحكومية لتجديد الاستمارة ورسوم كفاءة الوقود والفحص الدوري ورخصة القيادة."),
  metaDescription: bi("Add up Saudi vehicle fees: istimara registration renewal, the SASO fuel-efficiency fee, periodic technical inspection (Fahas) and driving licence renewal.", "اجمع رسوم المركبة في السعودية: تجديد الاستمارة ورسوم كفاءة استهلاك الوقود والفحص الفني الدوري وتجديد رخصة القيادة."),
  kind: "official",
  ruleIds: ["vehicle_registration", "vehicle_inspection", "driving_licence", "vat"],
  inputs: [
    { id: "regYears", type: "number", label: bi("Istimara renewal period", "مدة تجديد الاستمارة"), unit: bi("years", "سنة"), min: 1, max: 10, step: 1, default: 1 },
    { id: "modelYear", type: "select", label: bi("Car model year", "سنة صنع السيارة"), default: "new", options: [
      { value: "new", label: bi("2016 or newer", "٢٠١٦ أو أحدث") }, { value: "old", label: bi("2015 or older", "٢٠١٥ أو أقدم") }] },
    { id: "kmpl", type: "number", label: bi("Fuel economy (from the SASO label)", "معدل الاستهلاك (من بطاقة كفاءة الوقود)"), unit: bi("km/L", "كم/لتر"), min: 1, max: 50, step: 0.1, default: 14.5, showIf: (v) => v.modelYear !== "old" },
    { id: "engine", type: "number", label: bi("Engine size", "سعة المحرك"), unit: bi("litres", "لتر"), min: 0.5, max: 10, step: 0.1, default: 2.0, showIf: (v) => v.modelYear === "old" },
    { id: "inspection", type: "toggle", label: bi("Include periodic inspection (Fahas)", "تضمين الفحص الدوري"), default: true },
    { id: "licenceYears", type: "number", label: bi("Driving licence renewal (0 = not now)", "تجديد رخصة القيادة (٠ = لا)"), unit: bi("years", "سنة"), min: 0, max: 10, step: 1, default: 0 },
  ],
  compute(v, rules) {
    const reg = ruleValue(rules, "vehicle_registration"), insp = ruleValue(rules, "vehicle_inspection"), lic = ruleValue(rules, "driving_licence");
    const years = n(v, "regYears", { min: 1, max: 10 });
    let effFee = 0;
    if (s(v, "modelYear") === "old") {
      const L = n(v, "engine", { min: 0.1 });
      const band = (reg.fuelEfficiencyFeePerYear.lightVehicles2015AndOlder_and_heavy_engineL as any[]).find((b) => (b.minLExclusive !== undefined ? L > b.minLExclusive : (b.minL === undefined || L >= b.minL) && (b.maxL === undefined || L <= b.maxL)));
      effFee = band ? band.fee : 0;
    } else effFee = fuelEfficiencyFee(n(v, "kmpl", { min: 0.1 }), reg.fuelEfficiencyFeePerYear.lightVehicles2016Plus_kmPerL);
    const registration = reg.privateRegistrationPerYear * years;
    const efficiency = effFee * years;
    const inspection = v.inspection === true || v.inspection === "true" ? insp.privateCarInspectionInclVat : 0;
    const licenceYears = n(v, "licenceYears", { min: 0, max: 10 });
    const licence = lic.privatePerYear * licenceYears;
    const total = registration + efficiency + inspection + licence;
    return {
      headline: { label: bi("Total government fees", "إجمالي الرسوم الحكومية"), value: sar(total) },
      rows: [
        { label: bi("Istimara registration", "رسوم الاستمارة"), value: sar(registration), note: bi(`SAR ${reg.privateRegistrationPerYear} per year`, `${reg.privateRegistrationPerYear} ر.س سنويًا`) },
        { label: bi("Fuel-efficiency fee", "رسوم كفاءة استهلاك الوقود"), value: sar(efficiency), note: bi(`SAR ${effFee} per year`, `${effFee} ر.س سنويًا`) },
        { label: bi("Periodic inspection (Fahas, incl. VAT)", "الفحص الدوري (شامل الضريبة)"), value: sar(inspection) },
        { label: bi("Driving licence", "رخصة القيادة"), value: sar(licence), note: bi(`SAR ${lic.privatePerYear} per year of validity`, `${lic.privatePerYear} ر.س لكل سنة صلاحية`) },
        { label: bi("Total", "الإجمالي"), value: sar(total), strong: true },
      ],
      warnings: [bi("Fees are paid through Absher and SADAD; traffic violations, ownership transfer and insurance are separate. Check the amount shown in Absher before paying.", "تُسدَّد الرسوم عبر أبشر وسداد، والمخالفات المرورية ونقل الملكية والتأمين منفصلة. تحقق من المبلغ الظاهر في أبشر قبل السداد.")],
    };
  },
  content: {
    intro: bi("Renewing a private car's registration (istimara) involves the registration fee and the annual fuel-efficiency fee, and requires a valid periodic technical inspection (Fahas). Driving licence fees depend on the years of validity.", "يتضمن تجديد استمارة السيارة الخاصة رسوم التسجيل ورسوم كفاءة استهلاك الوقود السنوية، ويتطلب فحصًا فنيًا دوريًا ساريًا، وتعتمد رسوم رخصة القيادة على سنوات الصلاحية."),
    howTo: bi("Choose the renewal period, your car's model year and fuel economy (or engine size for older cars), and whether you also renew your licence.", "اختر مدة التجديد وسنة صنع سيارتك ومعدل استهلاكها (أو سعة المحرك للسيارات الأقدم)، وهل ستجدد رخصتك أيضًا."),
    formula: bi("Total = SAR 100 × years + fuel-efficiency fee × years + inspection + SAR 40 × licence years. Government fees are outside VAT; the inspection includes 15% VAT.", "الإجمالي = ١٠٠ ر.س × السنوات + رسوم كفاءة الوقود × السنوات + الفحص + ٤٠ ر.س × سنوات الرخصة. والرسوم الحكومية خارج نطاق الضريبة، ويشمل سعر الفحص ضريبة ١٥٪."),
    limitations: bi("Private light vehicles only. Fee amounts come from published sources and may change; Absher shows the amount due.", "للمركبات الخاصة الخفيفة فقط، والمبالغ من مصادر منشورة وقد تتغير، ويظهر المبلغ المستحق في أبشر."),
  },
  related: ["car-ownership", "fuel-cost"],
  reviewed: REVIEWED,
};

export const depreciation: Calculator = {
  slug: "depreciation",
  section: "cars-driving",
  title: bi("Car Depreciation Estimator", "مقدّر انخفاض قيمة السيارة"),
  short: bi("What your car could be worth after a number of years, with a yearly rate you choose.", "القيمة المتوقعة لسيارتك بعد عدد من السنوات بنسبة سنوية تختارها."),
  metaDescription: bi("Estimate how much value a car loses each year with a declining-balance depreciation rate you set, and its estimated value after several years.", "قدّر مقدار ما تفقده السيارة من قيمتها سنويًا بنسبة تناقص تحددها، وقيمتها التقديرية بعد عدة سنوات."),
  kind: "estimate",
  ruleIds: [],
  inputs: [
    { id: "price", type: "number", label: bi("Purchase price", "سعر الشراء"), unit: bi("SAR", "ر.س"), min: 0, step: 1000, default: 100000 },
    { id: "rate", type: "number", label: bi("Yearly depreciation (assumption)", "نسبة الانخفاض السنوية (افتراض)"), unit: bi("%", "٪"), min: 0, max: 60, step: 1, default: 15,
      help: bi("An assumption, not market data: compare similar used cars to choose a rate.", "افتراض وليس بيانات سوق؛ قارن بسيارات مستعملة مماثلة لاختيار النسبة.") },
    { id: "years", type: "number", label: bi("After", "بعد"), unit: bi("years", "سنة"), min: 1, max: 20, step: 1, default: 5 },
  ],
  compute(v) {
    const price = n(v, "price", { min: 0 }), rate = n(v, "rate", { min: 0, max: 99 }) / 100, years = n(v, "years", { min: 1, max: 30 });
    const value = price * Math.pow(1 - rate, years);
    return {
      headline: { label: bi("Estimated value", "القيمة التقديرية"), value: sar(value, 0) },
      rows: [
        ...Array.from({ length: Math.min(years, 10) }, (_, i) => ({ label: bi(`After year ${i + 1}`, `بعد السنة ${i + 1}`), value: sar(price * Math.pow(1 - rate, i + 1), 0) })),
        { label: bi("Total value lost", "إجمالي الانخفاض"), value: sar(price - value, 0), strong: true },
      ],
    };
  },
  content: {
    intro: bi("Cars lose value over time. This estimator applies the same percentage each year to the remaining value (declining balance).", "تفقد السيارات قيمتها مع الوقت، ويطبّق هذا المقدّر النسبة نفسها كل سنة على القيمة المتبقية (القسط المتناقص)."),
    howTo: bi("Enter the purchase price, a yearly rate and the number of years.", "أدخل سعر الشراء ونسبة سنوية وعدد السنوات."),
    formula: bi("Value after n years = price × (1 − rate)ⁿ.", "القيمة بعد ن سنوات = السعر × (١ − النسبة)^ن."),
    limitations: bi("Real resale values depend on make, mileage, condition and demand.", "تعتمد قيمة إعادة البيع الفعلية على الطراز والمسافة المقطوعة والحالة والطلب."),
  },
  related: ["car-ownership", "car-loan"],
  reviewed: REVIEWED,
};

export const carOwnership: Calculator = {
  slug: "car-ownership",
  section: "cars-driving",
  title: bi("Car Ownership Cost Calculator", "حاسبة تكلفة امتلاك السيارة"),
  short: bi("The yearly and monthly cost of owning a car: fuel, fees, insurance, maintenance, tyres and depreciation.", "تكلفة امتلاك السيارة سنويًا وشهريًا: الوقود والرسوم والتأمين والصيانة والإطارات وانخفاض القيمة."),
  metaDescription: bi("Work out the full cost of owning a car in Saudi Arabia: fuel, istimara and inspection fees, insurance, maintenance, tyres and depreciation, per year and month.", "احسب التكلفة الكاملة لامتلاك سيارة في السعودية: الوقود ورسوم الاستمارة والفحص والتأمين والصيانة والإطارات وانخفاض القيمة سنويًا وشهريًا."),
  kind: "estimate",
  ruleIds: ["fuel_prices", "vehicle_registration", "vehicle_inspection"],
  inputs: [
    { id: "km", type: "number", label: bi("Distance per year", "المسافة سنويًا"), unit: bi("km", "كم"), min: 0, step: 500, default: 24000 },
    { id: "kmpl", type: "number", label: bi("Fuel economy", "معدل الاستهلاك"), unit: bi("km/L", "كم/لتر"), min: 1, step: 0.1, default: 12 },
    { id: "insurance", type: "number", label: bi("Insurance per year (your quote)", "التأمين سنويًا (عرض السعر)"), unit: bi("SAR", "ر.س"), min: 0, step: 100, default: 0 },
    { id: "maintenance", type: "number", label: bi("Servicing per year", "الصيانة الدورية سنويًا"), unit: bi("SAR", "ر.س"), min: 0, step: 100, default: 0, help: bi("From your service schedule or garage quotes.", "من جدول الصيانة أو عروض الورش.") },
    { id: "tyres", type: "number", label: bi("Tyres per year", "الإطارات سنويًا"), unit: bi("SAR", "ر.س"), min: 0, step: 100, default: 0, help: bi("A set's price ÷ the years it lasts.", "سعر الطقم ÷ عدد سنوات استخدامه.") },
    { id: "value", type: "number", label: bi("Car's current value", "القيمة الحالية للسيارة"), unit: bi("SAR", "ر.س"), min: 0, step: 1000, default: 0 },
    { id: "dep", type: "number", label: bi("Depreciation per year (assumption)", "انخفاض القيمة سنويًا (افتراض)"), unit: bi("%", "٪"), min: 0, max: 60, step: 1, default: 15 },
    { id: "loan", type: "number", label: bi("Loan installments per year", "أقساط التمويل سنويًا"), unit: bi("SAR", "ر.س"), min: 0, step: 100, default: 0 },
    ...fuelInputs,
  ],
  compute(v, rules) {
    const fuel = n(v, "km", { min: 0 }) / n(v, "kmpl", { min: 0.5 }) * litrePrice(v, rules);
    const reg = ruleValue(rules, "vehicle_registration"), insp = ruleValue(rules, "vehicle_inspection");
    const fees = reg.privateRegistrationPerYear + insp.privateCarInspectionInclVat;
    const dep = n(v, "value", { min: 0 }) * n(v, "dep", { min: 0, max: 99 }) / 100;
    const items = [
      [bi("Fuel", "الوقود"), fuel], [bi("Istimara + inspection", "الاستمارة + الفحص"), fees], [bi("Insurance", "التأمين"), n(v, "insurance", { min: 0 })],
      [bi("Servicing", "الصيانة"), n(v, "maintenance", { min: 0 })], [bi("Tyres", "الإطارات"), n(v, "tyres", { min: 0 })],
      [bi("Depreciation", "انخفاض القيمة"), dep], [bi("Loan installments", "أقساط التمويل"), n(v, "loan", { min: 0 })],
    ] as const;
    const total = items.reduce((t, [, x]) => t + (x as number), 0);
    return {
      headline: { label: bi("Cost per month", "التكلفة الشهرية"), value: sar(total / 12) },
      rows: [...items.map(([label, x]) => ({ label, value: sar(x as number) })), { label: bi("Per year", "سنويًا"), value: sar(total), strong: true }],
      warnings: [bi("The fuel-efficiency fee and repairs are not included; enter your own quotes for insurance, servicing and tyres.", "لا تشمل الحسبة رسوم كفاءة الوقود والإصلاحات؛ أدخل عروض الأسعار الخاصة بك للتأمين والصيانة والإطارات.")],
    };
  },
  content: {
    intro: bi("The price of a car is only part of its cost. Add the running costs to see what the car really costs each month.", "سعر السيارة جزء فقط من تكلفتها؛ أضف تكاليف التشغيل لتعرف تكلفتها الحقيقية كل شهر."),
    howTo: bi("Enter your yearly distance and fuel economy, and your own figures for insurance, servicing, tyres and any loan.", "أدخل المسافة السنوية ومعدل الاستهلاك، وأرقامك الخاصة للتأمين والصيانة والإطارات والتمويل إن وجد."),
    formula: bi("Yearly cost = fuel + istimara + inspection + insurance + servicing + tyres + depreciation + loan installments; monthly = yearly ÷ 12.", "التكلفة السنوية = الوقود + الاستمارة + الفحص + التأمين + الصيانة + الإطارات + انخفاض القيمة + الأقساط، والشهرية = السنوية ÷ ١٢."),
  },
  related: ["fuel-cost", "vehicle-fees", "depreciation", "car-loan"],
  reviewed: REVIEWED,
};

export const CARS = [fuelCost, tripCost, carLoanCalc, evCharging, vehicleFees, depreciation, carOwnership];
export { tieredCharge };
