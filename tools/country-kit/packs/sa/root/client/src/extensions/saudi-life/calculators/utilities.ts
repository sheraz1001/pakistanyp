/** Household & utilities calculators. Tariffs come from the rules data (current and scheduled versions). */
import { bi, sar, fmt } from "../lib";
import { type Calculator, type Rules, n, s, ruleValue, round2, InputError } from "./types";

const REVIEWED = "2026-11-03";

export type TariffVersion = "current" | "scheduled";
/** Which tariff applies on a date: "scheduled" from its effectiveFrom date. */
export function versionFor(rule: any, date: string): TariffVersion {
  return rule.scheduled?.effectiveFrom && date >= rule.scheduled.effectiveFrom ? "scheduled" : "current";
}

/** Tiered energy charge (halalas per kWh) for a monthly consumption. */
export function tieredCharge(kwh: number, tiers: { fromKWh: number; toKWh: number | null; rate: number }[]): number {
  let halalas = 0;
  for (const t of tiers) {
    const lo = t.fromKWh - 1, hi = t.toKWh ?? Infinity;
    if (kwh > lo) halalas += (Math.min(kwh, hi) - lo) * t.rate;
  }
  return halalas / 100;
}

const ampBand = (amps: number, bands: { fromA: number; toAExclusive: number | null }[]) =>
  bands.findIndex((b) => amps >= b.fromA && (b.toAExclusive === null || amps < b.toAExclusive));

/** Monthly residential electricity bill. */
export function electricityBill(kwh: number, amps: number, version: TariffVersion, rules: Rules, days = 30) {
  const r = ruleValue(rules, "electricity_residential");
  const m = ruleValue(rules, "electricity_meter_fees");
  const vat = ruleValue(rules, "vat").standardRate;
  const energy = tieredCharge(kwh, r[version].tiers);
  let fixed = 0;
  if (version === "current") {
    const i = ampBand(amps, m.current.bandsAmps);
    fixed = i >= 0 ? m.current.bandsAmps[i].fee : 0;
  } else {
    const i = Math.max(0, ampBand(amps, m.scheduled.bandsAmps));
    fixed = m.scheduled.residential[i] * days / 30;
  }
  const beforeVat = energy + fixed;
  return { energy: round2(energy), fixed: round2(fixed), vat: round2(beforeVat * vat), total: round2(beforeVat * (1 + vat)) };
}

const tariffInput = {
  id: "tariff", type: "select" as const, label: bi("Tariff", "التعرفة"), default: "current",
  help: bi("Saudi Energy announced new tariffs from 1 January 2027. Consumption before that date is billed at the current tariff.", "أعلنت الشركة السعودية للطاقة تعرفة جديدة اعتبارًا من ١ يناير ٢٠٢٧، ويُحاسَب الاستهلاك قبل هذا التاريخ بالتعرفة الحالية."),
  options: [
    { value: "current", label: bi("Current tariff (until 31 Dec 2026)", "التعرفة الحالية (حتى ٣١ ديسمبر ٢٠٢٦)") },
    { value: "scheduled", label: bi("New tariff (from 1 Jan 2027)", "التعرفة الجديدة (من ١ يناير ٢٠٢٧)") },
  ],
};
const ampsInput = {
  id: "amps", type: "number" as const, label: bi("Meter breaker capacity", "سعة قاطع العداد"), unit: bi("amperes", "أمبير"), min: 20, max: 2000, step: 10, default: 70,
  help: bi("Shown on your bill or the meter's main breaker. Most homes are 40–200 A.", "تظهر في فاتورتك أو على القاطع الرئيسي للعداد، ومعظم المنازل بين ٤٠ و٢٠٠ أمبير."),
};

export const electricity: Calculator = {
  slug: "electricity-bill",
  section: "home-utilities",
  title: bi("Saudi Electricity Bill Calculator", "حاسبة فاتورة الكهرباء في السعودية"),
  short: bi("Estimate a monthly home electricity bill from your kWh, with the current and the 2027 tariff.", "قدّر فاتورة الكهرباء المنزلية الشهرية من استهلاكك بالكيلوواط ساعة، بالتعرفة الحالية وتعرفة ٢٠٢٧."),
  metaDescription: bi("Calculate your residential electricity bill in Saudi Arabia: tiered kWh rates, meter fee or new fixed charge, and 15% VAT, for the current and 2027 tariffs.", "احسب فاتورة الكهرباء المنزلية في السعودية: شرائح الاستهلاك ورسوم العداد أو التعرفة الثابتة الجديدة وضريبة ١٥٪، بالتعرفة الحالية وتعرفة ٢٠٢٧."),
  kind: "official",
  ruleIds: ["electricity_residential", "electricity_meter_fees", "vat"],
  inputs: [
    { id: "kwh", type: "number", label: bi("Consumption this month", "الاستهلاك هذا الشهر"), unit: bi("kWh", "ك.و.س"), min: 0, max: 200000, step: 10, default: 1800 },
    ampsInput,
    tariffInput,
  ],
  compute(v, rules) {
    const kwh = n(v, "kwh", { min: 0 }), amps = n(v, "amps", { min: 1 });
    const version = s(v, "tariff") === "scheduled" ? "scheduled" : "current";
    const bill = electricityBill(kwh, amps, version, rules);
    const r = ruleValue(rules, "electricity_residential")[version].tiers;
    return {
      headline: { label: bi("Estimated monthly bill", "الفاتورة الشهرية التقديرية"), value: sar(bill.total) },
      rows: [
        { label: bi("Energy charge", "قيمة الاستهلاك"), value: sar(bill.energy), note: bi(`${r[0].rate} halalas/kWh up to ${fmt(r[0].toKWh, 0)} kWh, ${r[1].rate} above`, `${r[0].rate} هللة/ك.و.س حتى ${fmt(r[0].toKWh, 0)} ك.و.س، و${r[1].rate} لما زاد`) },
        { label: version === "current" ? bi("Meter reading & service fee", "رسوم قراءة العداد والخدمة") : bi("Fixed monthly charge", "التعرفة الثابتة الشهرية"), value: sar(bill.fixed) },
        { label: bi("VAT 15%", "ضريبة القيمة المضافة ١٥٪"), value: sar(bill.vat) },
        { label: bi("Total", "الإجمالي"), value: sar(bill.total), strong: true },
      ],
      warnings: [bi("Your actual bill depends on the billing days and the meter reading; use the bill from Saudi Energy as the final amount.", "تعتمد فاتورتك الفعلية على أيام الفوترة وقراءة العداد، والمرجع النهائي فاتورة الشركة السعودية للطاقة.")],
    };
  },
  content: {
    intro: bi("Home electricity in Saudi Arabia is billed monthly by Saudi Energy (formerly the Saudi Electricity Company). The residential energy charge has two tiers per month, a fixed monthly fee is added, and 15% VAT applies to the bill. New tariffs announced in October 2026 take effect on 1 January 2027.",
      "تُصدِر الشركة السعودية للطاقة (الشركة السعودية للكهرباء سابقًا) فاتورة الكهرباء المنزلية شهريًا. وللاستهلاك السكني شريحتان شهريًا، وتضاف رسوم ثابتة شهرية، وتُطبق ضريبة القيمة المضافة ١٥٪ على الفاتورة. وتسري التعرفة الجديدة المعلنة في أكتوبر ٢٠٢٦ اعتبارًا من ١ يناير ٢٠٢٧."),
    howTo: bi("Enter the kWh on your bill (or from the AC and appliance calculators), your meter's breaker size, and the tariff to use.", "أدخل الاستهلاك بالكيلوواط ساعة من فاتورتك (أو من حاسبتي المكيف والأجهزة)، وسعة قاطع العداد، والتعرفة المطلوبة."),
    formula: bi("Bill = (tier 1 kWh × rate 1 + tier 2 kWh × rate 2) + fixed monthly fee, then + 15% VAT. Rates are in halalas (100 halalas = SAR 1).", "الفاتورة = (استهلاك الشريحة الأولى × سعرها + استهلاك الشريحة الثانية × سعرها) + الرسوم الثابتة، ثم + ضريبة ١٥٪. الأسعار بالهللة (١٠٠ هللة = ١ ريال)."),
    example: bi("1,800 kWh at the current tariff with a 70 A breaker: 1,800 × 0.18 = SAR 324 + SAR 10 fee = SAR 334, + 15% VAT = SAR 384.10.", "استهلاك ١٬٨٠٠ ك.و.س بالتعرفة الحالية مع قاطع ٧٠ أمبير: ١٬٨٠٠ × ٠٫١٨ = ٣٢٤ ر.س + ١٠ ر.س رسوم = ٣٣٤ ر.س، + ١٥٪ ضريبة = ٣٨٤٫١٠ ر.س."),
    limitations: bi("Residential tariff only. Commercial, agricultural, government and industrial tariffs are different.", "التعرفة السكنية فقط، وتختلف تعرفة القطاعات التجارية والزراعية والحكومية والصناعية."),
    faq: [
      { q: bi("Why did my bill jump in summer?", "لماذا ترتفع الفاتورة في الصيف؟"), a: bi("Air conditioning drives most summer use. Consumption above 6,000 kWh in a month is billed at the higher tier.", "التكييف هو السبب الرئيسي لاستهلاك الصيف، ويُحاسب ما يزيد على ٦٬٠٠٠ ك.و.س في الشهر بسعر الشريحة الأعلى.") },
    ],
  },
  related: ["ac-consumption", "appliance-cost", "water-bill", "utility-budget"],
  reviewed: REVIEWED,
};

export const acConsumption: Calculator = {
  slug: "ac-consumption",
  section: "home-utilities",
  title: bi("Air Conditioner Electricity Cost Calculator", "حاسبة استهلاك المكيف وتكلفته"),
  short: bi("How many kWh your air conditioners use and what they add to the bill.", "كم يستهلك المكيف من الكيلوواط ساعة وكم يضيف إلى الفاتورة."),
  metaDescription: bi("Estimate AC electricity use in Saudi Arabia from cooling capacity (BTU), efficiency (EER) and hours, and its monthly cost at the home tariff.", "قدّر استهلاك المكيف للكهرباء في السعودية من سعة التبريد (وحدة حرارية) وكفاءة الطاقة وساعات التشغيل، وتكلفته الشهرية بالتعرفة السكنية."),
  kind: "estimate",
  ruleIds: ["electricity_residential", "vat"],
  inputs: [
    { id: "btu", type: "number", label: bi("Cooling capacity per unit", "سعة التبريد لكل مكيف"), unit: bi("BTU/h", "وحدة حرارية/ساعة"), min: 1000, max: 120000, step: 1000, default: 18000 },
    { id: "eer", type: "number", label: bi("Energy efficiency ratio (EER)", "نسبة كفاءة الطاقة (EER)"), min: 4, max: 30, step: 0.1, default: 11.5,
      help: bi("On the SASO energy label. Higher is more efficient.", "تظهر على بطاقة كفاءة الطاقة من الهيئة السعودية للمواصفات، وكلما ارتفعت كان المكيف أكفأ.") },
    { id: "units", type: "number", label: bi("Number of units", "عدد المكيفات"), min: 1, max: 50, step: 1, default: 3 },
    { id: "hours", type: "number", label: bi("Hours a day", "ساعات التشغيل يوميًا"), min: 0, max: 24, step: 0.5, default: 10 },
    { id: "duty", type: "number", label: bi("Compressor running share", "نسبة تشغيل الضاغط"), unit: bi("%", "٪"), min: 10, max: 100, step: 5, default: 70,
      help: bi("A thermostat switches the compressor on and off; 60–80% is typical in hot weather (an assumption you can change).", "يشغّل منظم الحرارة الضاغط ويوقفه، و٦٠–٨٠٪ شائع في الطقس الحار (افتراض يمكنك تعديله).") },
    tariffInput,
  ],
  compute(v, rules) {
    const btu = n(v, "btu", { min: 1 }), eer = n(v, "eer", { min: 1 }), units = n(v, "units", { min: 1 }), hours = n(v, "hours", { min: 0, max: 24 }), duty = n(v, "duty", { min: 1, max: 100 }) / 100;
    const kw = btu / eer / 1000;
    const kwhMonth = kw * hours * duty * 30 * units;
    const version = s(v, "tariff") === "scheduled" ? "scheduled" : "current";
    const tiers = ruleValue(rules, "electricity_residential")[version].tiers;
    const vat = ruleValue(rules, "vat").standardRate;
    const cost = tieredCharge(kwhMonth, tiers) * (1 + vat);
    return {
      headline: { label: bi("Monthly AC cost (energy + VAT)", "تكلفة التكييف الشهرية (الاستهلاك + الضريبة)"), value: sar(cost) },
      rows: [
        { label: bi("Power per unit", "القدرة لكل مكيف"), value: `${fmt(kw, 2)} kW` },
        { label: bi("Monthly consumption", "الاستهلاك الشهري"), value: `${fmt(kwhMonth, 0)} kWh` },
        { label: bi("Cost per day", "التكلفة اليومية"), value: sar(cost / 30) },
        { label: bi("Monthly cost", "التكلفة الشهرية"), value: sar(cost), strong: true },
      ],
      warnings: [bi("Assumes the AC is your only use; if other appliances push the month over 6,000 kWh, the extra kWh cost more. The fixed monthly fee is not included.", "تفترض الحسبة أن المكيف هو الاستهلاك الوحيد؛ فإذا تجاوز الشهر ٦٬٠٠٠ ك.و.س بسبب أجهزة أخرى كانت الزيادة أغلى. ولا تشمل الرسوم الثابتة الشهرية.")],
    };
  },
  content: {
    intro: bi("Air conditioning is the largest electricity use in most Saudi homes. Its power draw is its cooling capacity divided by its efficiency (EER).", "التكييف أكبر استهلاك للكهرباء في معظم المنازل السعودية، وقدرته الكهربائية هي سعة التبريد مقسومة على كفاءة الطاقة (EER)."),
    howTo: bi("Find the BTU and EER on the unit's label, enter how many units and how long they run each day.", "اعرف السعة وكفاءة الطاقة من بطاقة المكيف، وأدخل عدد المكيفات وساعات تشغيلها يوميًا."),
    formula: bi("kW = BTU/h ÷ EER ÷ 1,000. Monthly kWh = kW × hours × running share × 30 × units. Cost uses the residential tiers plus 15% VAT.", "القدرة (ك.و) = الوحدات الحرارية ÷ EER ÷ ١٬٠٠٠. الاستهلاك الشهري = القدرة × الساعات × نسبة التشغيل × ٣٠ × عدد المكيفات. وتُحسب التكلفة بشرائح التعرفة السكنية مع ضريبة ١٥٪."),
    example: bi("Three 18,000 BTU units with EER 11.5, 10 hours a day at 70%: 1.57 kW × 10 × 0.7 × 30 × 3 ≈ 986 kWh ≈ SAR 204 a month at the current tariff.", "ثلاثة مكيفات ١٨٬٠٠٠ وحدة بكفاءة ١١٫٥ تعمل ١٠ ساعات يوميًا بنسبة ٧٠٪: ١٫٥٧ ك.و × ١٠ × ٠٫٧ × ٣٠ × ٣ ≈ ٩٨٦ ك.و.س ≈ ٢٠٤ ر.س شهريًا بالتعرفة الحالية."),
    limitations: bi("An estimate: real use depends on insulation, outdoor temperature, thermostat setting and the unit's condition.", "تقدير فقط؛ يعتمد الاستهلاك الفعلي على العزل ودرجة الحرارة الخارجية وضبط منظم الحرارة وحالة المكيف."),
  },
  related: ["electricity-bill", "appliance-cost", "solar-savings"],
  reviewed: REVIEWED,
};

export const applianceCost: Calculator = {
  slug: "appliance-cost",
  section: "home-utilities",
  title: bi("Appliance Electricity Cost Calculator", "حاسبة تكلفة كهرباء الأجهزة المنزلية"),
  short: bi("Running cost of any appliance from its watts and daily hours.", "تكلفة تشغيل أي جهاز من قدرته بالواط وساعات استخدامه يوميًا."),
  metaDescription: bi("Work out what an appliance costs to run in Saudi Arabia: watts, hours a day and the residential electricity tariff, per day, month and year.", "احسب تكلفة تشغيل جهاز منزلي في السعودية من قدرته بالواط وساعات الاستخدام والتعرفة السكنية، يوميًا وشهريًا وسنويًا."),
  kind: "estimate",
  ruleIds: ["electricity_residential", "vat"],
  inputs: [
    { id: "watts", type: "number", label: bi("Power", "القدرة"), unit: bi("watts", "واط"), min: 1, max: 20000, step: 10, default: 2000 },
    { id: "hours", type: "number", label: bi("Hours a day", "ساعات الاستخدام يوميًا"), min: 0, max: 24, step: 0.25, default: 1 },
    { id: "qty", type: "number", label: bi("Quantity", "العدد"), min: 1, max: 100, step: 1, default: 1 },
    { id: "rate", type: "select", label: bi("Rate", "السعر"), default: "t1", options: [
      { value: "t1", label: bi("First tier (most homes)", "الشريحة الأولى (معظم المنازل)") }, { value: "t2", label: bi("Second tier (above 6,000 kWh a month)", "الشريحة الثانية (أكثر من ٦٬٠٠٠ ك.و.س شهريًا)") }] },
    tariffInput,
  ],
  compute(v, rules) {
    const watts = n(v, "watts", { min: 0 }), hours = n(v, "hours", { min: 0, max: 24 }), qty = n(v, "qty", { min: 1 });
    const version = s(v, "tariff") === "scheduled" ? "scheduled" : "current";
    const tiers = ruleValue(rules, "electricity_residential")[version].tiers;
    const rate = (s(v, "rate") === "t2" ? tiers[1].rate : tiers[0].rate) / 100 * (1 + ruleValue(rules, "vat").standardRate);
    const kwhDay = watts / 1000 * hours * qty;
    return {
      headline: { label: bi("Cost per month", "التكلفة الشهرية"), value: sar(kwhDay * 30 * rate) },
      rows: [
        { label: bi("Energy per day", "الاستهلاك اليومي"), value: `${fmt(kwhDay, 2)} kWh` },
        { label: bi("Cost per day", "التكلفة اليومية"), value: sar(kwhDay * rate) },
        { label: bi("Cost per month (30 days)", "التكلفة الشهرية (٣٠ يومًا)"), value: sar(kwhDay * 30 * rate), strong: true },
        { label: bi("Cost per year", "التكلفة السنوية"), value: sar(kwhDay * 365 * rate) },
      ],
    };
  },
  content: {
    intro: bi("Every appliance's running cost is its power multiplied by the time it runs and the price of a kilowatt-hour.", "تكلفة تشغيل أي جهاز هي قدرته مضروبة في مدة تشغيله وسعر الكيلوواط ساعة."),
    howTo: bi("Find the wattage on the appliance's rating plate, enter the daily hours and choose the rate.", "اعرف القدرة بالواط من لوحة بيانات الجهاز، وأدخل ساعات التشغيل اليومية واختر السعر."),
    formula: bi("kWh = watts ÷ 1,000 × hours × quantity. Cost = kWh × tier rate × 1.15 (VAT).", "الاستهلاك = الواط ÷ ١٬٠٠٠ × الساعات × العدد. التكلفة = الاستهلاك × سعر الشريحة × ١٫١٥ (الضريبة)."),
    example: bi("A 2,000 W water heater for 1 hour a day: 2 kWh × 30 = 60 kWh a month ≈ SAR 12.42 at the first tier.", "سخان ماء ٢٬٠٠٠ واط لمدة ساعة يوميًا: ٢ ك.و.س × ٣٠ = ٦٠ ك.و.س شهريًا ≈ ١٢٫٤٢ ر.س بسعر الشريحة الأولى."),
  },
  related: ["electricity-bill", "ac-consumption"],
  reviewed: REVIEWED,
};

/** Monthly residential water + wastewater bill. */
export function waterBill(m3: number, version: TariffVersion, rules: Rules) {
  const w = ruleValue(rules, "water_residential"), ww = ruleValue(rules, "water_sewage");
  const tiers = w[version].waterTiers as { fromM3: number; toM3: number | null; rate: number }[];
  let water = 0;
  for (const t of tiers) {
    const lo = version === "current" ? t.fromM3 - 1 : t.fromM3, hi = t.toM3 ?? Infinity;
    if (m3 > lo) water += (Math.min(m3, hi) - lo) * t.rate;
  }
  const wastewater = water * ww.ratioOfWaterConsumptionCharge;
  let fixed = 0;
  if (version === "scheduled") fixed = (w.scheduled.fixedMonthlyWaterSAR.meterUpTo20mm || 0) + (ww.scheduled.fixedMonthlyWastewaterSAR.meterUpTo20mm || 0);
  return { water: round2(water), wastewater: round2(wastewater), fixed, total: round2(water + wastewater + fixed) };
}

export const water: Calculator = {
  slug: "water-bill",
  section: "home-utilities",
  title: bi("Saudi Water Bill Calculator", "حاسبة فاتورة المياه في السعودية"),
  short: bi("Monthly water and wastewater charges from your consumption in cubic metres.", "رسوم المياه والصرف الصحي الشهرية من استهلاكك بالمتر المكعب."),
  metaDescription: bi("Estimate a residential water bill in Saudi Arabia: NWC consumption tiers, the wastewater charge at 50% of water, and the 2027 fixed charges.", "قدّر فاتورة المياه المنزلية في السعودية: شرائح شركة المياه الوطنية، ورسوم الصرف الصحي بنسبة ٥٠٪ من قيمة المياه، والرسوم الثابتة لعام ٢٠٢٧."),
  kind: "official",
  ruleIds: ["water_residential", "water_sewage", "vat"],
  inputs: [
    { id: "m3", type: "number", label: bi("Water used this month", "استهلاك المياه هذا الشهر"), unit: bi("m³", "م³"), min: 0, max: 5000, step: 1, default: 25 },
    { ...tariffInput, help: bi("The National Water Company announced new tariffs from 1 January 2027.", "أعلنت شركة المياه الوطنية تعرفة جديدة اعتبارًا من ١ يناير ٢٠٢٧.") },
  ],
  compute(v, rules) {
    const m3 = n(v, "m3", { min: 0 });
    const version = s(v, "tariff") === "scheduled" ? "scheduled" : "current";
    const bill = waterBill(m3, version, rules);
    return {
      headline: { label: bi("Water + wastewater (before VAT)", "المياه + الصرف الصحي (قبل الضريبة)"), value: sar(bill.total) },
      rows: [
        { label: bi("Water consumption charge", "قيمة استهلاك المياه"), value: sar(bill.water) },
        { label: bi("Wastewater (50% of water charge)", "الصرف الصحي (٥٠٪ من قيمة المياه)"), value: sar(bill.wastewater) },
        ...(version === "scheduled" ? [{ label: bi("Fixed monthly charges (meter up to 20 mm)", "الرسوم الثابتة الشهرية (عداد حتى ٢٠ مم)"), value: sar(bill.fixed) }] : []),
        { label: bi("Total before VAT", "الإجمالي قبل الضريبة"), value: sar(bill.total), strong: true },
      ],
      warnings: [
        bi("VAT treatment of water bills could not be confirmed from NWC; check your bill. Meter service fees for the current tariff are not included.", "لم نتمكن من تأكيد معاملة فواتير المياه لضريبة القيمة المضافة من شركة المياه الوطنية؛ راجع فاتورتك. ولا تشمل الحسبة رسوم خدمة العداد للتعرفة الحالية."),
      ],
    };
  },
  content: {
    intro: bi("The National Water Company bills homes monthly for water by consumption tier, plus a wastewater charge equal to half of the water consumption charge where the home is connected to the sewer network. New tariffs with fixed monthly charges take effect on 1 January 2027.",
      "تصدر شركة المياه الوطنية فاتورة المياه المنزلية شهريًا بحسب شرائح الاستهلاك، وتضاف رسوم الصرف الصحي بنصف قيمة استهلاك المياه للمنازل المتصلة بشبكة الصرف. وتسري تعرفة جديدة برسوم ثابتة شهرية اعتبارًا من ١ يناير ٢٠٢٧."),
    howTo: bi("Enter your consumption in cubic metres (m³) from the bill or the meter and choose the tariff.", "أدخل استهلاكك بالمتر المكعب من الفاتورة أو العداد واختر التعرفة."),
    formula: bi("Water = consumption in each tier × tier price. Wastewater = 50% of the water charge. From 2027 a fixed monthly charge by meter size is added.", "المياه = الاستهلاك في كل شريحة × سعرها. الصرف الصحي = ٥٠٪ من قيمة المياه. ومن ٢٠٢٧ تضاف رسوم ثابتة شهرية بحسب قطر العداد."),
    limitations: bi("Residential tariff and a meter up to 20 mm. Some tier prices of the current tariff are reported differently by different sources; confirm with NWC.", "التعرفة السكنية وعداد حتى ٢٠ مم. وتختلف بعض أسعار الشرائح الحالية بين المصادر؛ تأكد من شركة المياه الوطنية."),
  },
  related: ["electricity-bill", "utility-budget"],
  reviewed: REVIEWED,
};

export const utilityBudget: Calculator = {
  slug: "utility-budget",
  section: "home-utilities",
  title: bi("Household Utility Budget Calculator", "حاسبة ميزانية فواتير المنزل"),
  short: bi("Electricity, water, internet and mobile in one monthly and yearly budget.", "الكهرباء والمياه والإنترنت والجوال في ميزانية شهرية وسنوية واحدة."),
  metaDescription: bi("Plan your Saudi household utility budget: electricity from kWh, water from m³, plus internet, mobile and gas you enter, monthly and yearly.", "خطط لميزانية فواتير منزلك في السعودية: الكهرباء من الاستهلاك والمياه بالمتر المكعب، مع الإنترنت والجوال والغاز التي تدخلها، شهريًا وسنويًا."),
  kind: "estimate",
  ruleIds: ["electricity_residential", "electricity_meter_fees", "water_residential", "water_sewage", "vat"],
  inputs: [
    { id: "kwh", type: "number", label: bi("Electricity per month", "الكهرباء شهريًا"), unit: bi("kWh", "ك.و.س"), min: 0, step: 10, default: 1800 },
    ampsInput,
    { id: "m3", type: "number", label: bi("Water per month", "المياه شهريًا"), unit: bi("m³", "م³"), min: 0, step: 1, default: 25 },
    { id: "internet", type: "number", label: bi("Home internet", "إنترنت المنزل"), unit: bi("SAR / month", "ر.س / شهريًا"), min: 0, step: 10, default: 0, help: bi("From your plan", "من باقتك") },
    { id: "mobile", type: "number", label: bi("Mobile plans", "باقات الجوال"), unit: bi("SAR / month", "ر.س / شهريًا"), min: 0, step: 10, default: 0, help: bi("From your plans", "من باقاتك") },
    { id: "gas", type: "number", label: bi("Cooking gas", "غاز الطبخ"), unit: bi("SAR / month", "ر.س / شهريًا"), min: 0, step: 5, default: 0 },
    tariffInput,
  ],
  compute(v, rules) {
    const version = s(v, "tariff") === "scheduled" ? "scheduled" : "current";
    const e = electricityBill(n(v, "kwh", { min: 0 }), n(v, "amps", { min: 1 }), version, rules);
    const w = waterBill(n(v, "m3", { min: 0 }), version, rules);
    const others = n(v, "internet", { min: 0 }) + n(v, "mobile", { min: 0 }) + n(v, "gas", { min: 0 });
    const total = e.total + w.total + others;
    return {
      headline: { label: bi("Monthly utilities", "الفواتير الشهرية"), value: sar(total) },
      rows: [
        { label: bi("Electricity (incl. VAT)", "الكهرباء (شاملة الضريبة)"), value: sar(e.total) },
        { label: bi("Water and wastewater", "المياه والصرف الصحي"), value: sar(w.total) },
        { label: bi("Internet, mobile and gas", "الإنترنت والجوال والغاز"), value: sar(others) },
        { label: bi("Per month", "شهريًا"), value: sar(total), strong: true },
        { label: bi("Per year", "سنويًا"), value: sar(total * 12) },
      ],
    };
  },
  content: {
    intro: bi("Put all the household bills in one place to plan the month. Electricity and water use the official tariffs; enter your own telecom and gas costs.", "اجمع فواتير المنزل في مكان واحد لتخطيط الشهر. تُحسب الكهرباء والمياه بالتعرفة الرسمية، وأدخل تكاليف الاتصالات والغاز بنفسك."),
    howTo: bi("Enter your monthly kWh and m³ and the amounts of your other bills.", "أدخل استهلاكك الشهري من الكهرباء والمياه ومبالغ فواتيرك الأخرى."),
    formula: bi("Total = electricity bill + water bill + other bills you enter.", "الإجمالي = فاتورة الكهرباء + فاتورة المياه + الفواتير الأخرى المدخلة."),
  },
  related: ["electricity-bill", "water-bill", "household-budget"],
  reviewed: REVIEWED,
};

export const solarSavings: Calculator = {
  slug: "solar-savings",
  section: "home-utilities",
  title: bi("Home Solar Panel Savings Estimator", "مقدّر وفر الألواح الشمسية للمنزل"),
  short: bi("How much a rooftop solar system could take off your electricity bill, with your own assumptions.", "كم يمكن أن يخفّض نظام شمسي على السطح من فاتورة الكهرباء، بافتراضاتك أنت."),
  metaDescription: bi("Estimate rooftop solar savings in Saudi Arabia from system size, sun hours and the residential tariff, with editable cost and payback assumptions.", "قدّر وفر الطاقة الشمسية المنزلية في السعودية من حجم النظام وساعات الشمس والتعرفة السكنية، مع افتراضات قابلة للتعديل للتكلفة ومدة الاسترداد."),
  kind: "estimate",
  ruleIds: ["electricity_residential", "vat"],
  inputs: [
    { id: "kw", type: "number", label: bi("System size", "حجم النظام"), unit: bi("kWp", "ك.و ذروة"), min: 0.5, max: 200, step: 0.5, default: 5 },
    { id: "sunHours", type: "number", label: bi("Peak sun hours a day (assumption)", "ساعات الذروة الشمسية يوميًا (افتراض)"), min: 1, max: 9, step: 0.1, default: 5.5,
      help: bi("Average daily equivalent full-sun hours; ask your installer for a site estimate.", "متوسط الساعات اليومية المكافئة للشمس الكاملة؛ اطلب تقديرًا لموقعك من المركّب.") },
    { id: "losses", type: "number", label: bi("System losses (assumption)", "فاقد النظام (افتراض)"), unit: bi("%", "٪"), min: 0, max: 50, step: 1, default: 20 },
    { id: "cost", type: "number", label: bi("Installed cost (your quote)", "تكلفة التركيب (عرض السعر)"), unit: bi("SAR", "ر.س"), min: 0, step: 500, default: 0 },
    { id: "rate", type: "select", label: bi("Electricity price saved", "سعر الكهرباء الموفَّر"), default: "t1", options: [
      { value: "t1", label: bi("First tier", "الشريحة الأولى") }, { value: "t2", label: bi("Second tier", "الشريحة الثانية") }] },
    tariffInput,
  ],
  compute(v, rules) {
    const kw = n(v, "kw", { min: 0 }), sun = n(v, "sunHours", { min: 0 }), loss = n(v, "losses", { min: 0, max: 90 }) / 100, cost = n(v, "cost", { min: 0 });
    const version = s(v, "tariff") === "scheduled" ? "scheduled" : "current";
    const tiers = ruleValue(rules, "electricity_residential")[version].tiers;
    const price = (s(v, "rate") === "t2" ? tiers[1].rate : tiers[0].rate) / 100 * (1 + ruleValue(rules, "vat").standardRate);
    const kwhYear = kw * sun * 365 * (1 - loss);
    const saving = kwhYear * price;
    return {
      headline: { label: bi("Estimated saving per year", "الوفر السنوي التقديري"), value: sar(saving) },
      rows: [
        { label: bi("Energy produced per year", "الطاقة المنتجة سنويًا"), value: `${fmt(kwhYear, 0)} kWh` },
        { label: bi("Saving per month", "الوفر الشهري"), value: sar(saving / 12) },
        { label: bi("Simple payback", "مدة الاسترداد البسيطة"), value: cost > 0 && saving > 0 ? `${fmt(cost / saving, 1)}` : "—", note: bi("years", "سنة") },
      ],
      warnings: [bi("Assumes all solar energy replaces grid electricity at the chosen price. Net-metering, battery and export rules are not modelled.", "تفترض الحسبة أن كل الطاقة الشمسية تحل محل كهرباء الشبكة بالسعر المختار، ولا تشمل أنظمة صافي القياس أو البطاريات أو التصدير.")],
    };
  },
  content: {
    intro: bi("A rough, transparent estimate of what rooftop solar could save. Every assumption is editable; use an installer's site survey and quote for a decision.", "تقدير تقريبي وشفاف للوفر من الطاقة الشمسية على السطح، وجميع الافتراضات قابلة للتعديل. اعتمد على المسح الميداني وعرض سعر المركّب عند اتخاذ القرار."),
    howTo: bi("Enter the system size and your installer's quote; adjust sun hours and losses if you have better figures.", "أدخل حجم النظام وعرض سعر المركّب، وعدّل ساعات الشمس والفاقد إن توفرت لديك أرقام أدق."),
    formula: bi("kWh/year = kWp × sun hours × 365 × (1 − losses). Saving = kWh × tariff × 1.15. Payback = cost ÷ yearly saving.", "الإنتاج السنوي = القدرة × ساعات الشمس × ٣٦٥ × (١ − الفاقد). الوفر = الإنتاج × التعرفة × ١٫١٥. الاسترداد = التكلفة ÷ الوفر السنوي."),
    limitations: bi("Illustrative only. Panel degradation, cleaning, maintenance and financing costs are not included.", "للتوضيح فقط، ولا تشمل الحسبة تراجع كفاءة الألواح والتنظيف والصيانة وتكاليف التمويل."),
  },
  related: ["electricity-bill", "ac-consumption"],
  reviewed: REVIEWED,
};

export const UTILITIES = [electricity, acConsumption, applianceCost, water, utilityBudget, solarSavings];
export { InputError };
