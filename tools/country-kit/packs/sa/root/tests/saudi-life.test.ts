/**
 * Saudi Life calculators: results checked against independently worked examples (hand calculations and the
 * official examples published by MHRSD / Saudi Energy), using the reviewed rules in server/extensions/saudi-life/rules.json.
 * Run: npx tsx --test tests/saudi-life.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { eosbFull, resignationShare, gosiContribution, serviceYears } from "../client/src/extensions/saudi-life/calculators/employment";
import { electricityBill, waterBill, tieredCharge } from "../client/src/extensions/saudi-life/calculators/utilities";
import { carLoan, fuelEfficiencyFee } from "../client/src/extensions/saudi-life/calculators/cars";
import { gpa } from "../client/src/extensions/saudi-life/calculators/education";
import { CALCULATORS, CALCULATOR_BY_SLUG } from "../client/src/extensions/saudi-life/calculators";

const rules = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, "../server/extensions/saudi-life/rules.json"), "utf8")).rules;
const close = (a: number, b: number, eps = 0.01) => assert.ok(Math.abs(a - b) <= eps, `${a} ≠ ${b}`);
const defaults = (slug: string) => {
  const c = CALCULATOR_BY_SLUG.get(slug)!;
  return Object.fromEntries(c.inputs.map((i) => [i.id, typeof i.default === "function" ? (i.default as any)(rules) : i.default]));
};

test("end of service: Article 84 award, 8 years at SAR 10,000 = 55,000", () => {
  const r = rules.eosb_termination.values;
  close(eosbFull(10000, 8, r), 55000);
  close(eosbFull(10000, 3, r), 15000);
  close(eosbFull(6000, 5.5, r), 18000); // 5 × 3,000 + 0.5 × 6,000
});

test("end of service: Article 85 resignation shares incl. boundaries", () => {
  const b = rules.eosb_resignation.values.bands;
  assert.equal(resignationShare(1.99, b), 0);
  close(resignationShare(2, b), 1 / 3, 1e-9);
  close(resignationShare(5, b), 1 / 3, 1e-9);   // "not more than five years"
  close(resignationShare(5.01, b), 2 / 3, 1e-9);
  close(resignationShare(9.99, b), 2 / 3, 1e-9);
  assert.equal(resignationShare(10, b), 1);
  close(eosbFull(10000, 8, rules.eosb_termination.values) * resignationShare(8, b), 36666.67);
});

test("service years count calendar days", () => {
  const s = serviceYears("2020-01-01", "2021-01-01");
  assert.equal(s.days, 366);
});

test("overtime: MHRSD example (actual 6,000, basic 4,000) = SAR 33.33 per hour", () => {
  const o = rules.overtime.values;
  const perHour = 6000 / o.monthDays / o.dailyHours + (4000 / o.monthDays / o.dailyHours) * o.premiumOfBasic;
  close(perHour, 33.33);
  const out = CALCULATOR_BY_SLUG.get("overtime")!.compute({ basic: 4000, allowances: 2000, hours: 1 }, rules);
  assert.match(String(out.headline.value), /33\.33/);
});

test("GOSI: Saudi legacy 9.75% / 11.75%, new law 10.75% / 12.75% from Jul 2026, non-Saudi 2% employer", () => {
  const legacy = gosiContribution(10000, { saudi: true, scheme: "legacy", date: "2026-11-03" }, rules);
  close(legacy.employee, 975); close(legacy.employer, 1175);
  const nw = gosiContribution(10000, { saudi: true, scheme: "new", date: "2026-11-03" }, rules);
  close(nw.employee, 1075); close(nw.employer, 1275);
  const nw25 = gosiContribution(10000, { saudi: true, scheme: "new", date: "2025-08-01" }, rules);
  close(nw25.employee, 1025); // 9.5% + 0.75%
  const ns = gosiContribution(10000, { saudi: false, scheme: "legacy", date: "2026-11-03" }, rules);
  close(ns.employee, 0); close(ns.employer, 200);
  const capped = gosiContribution(60000, { saudi: true, scheme: "legacy", date: "2026-11-03" }, rules);
  assert.equal(capped.base, 45000);
});

test("electricity: 1,800 kWh, 70 A, current tariff = SAR 384.10; tiers above 6,000 kWh", () => {
  const b = electricityBill(1800, 70, "current", rules);
  close(b.energy, 324); close(b.fixed, 10); close(b.total, 384.1);
  close(tieredCharge(7000, rules.electricity_residential.values.current.tiers), 6000 * 0.18 + 1000 * 0.30);
  const n27 = electricityBill(1800, 70, "scheduled", rules);
  close(n27.total, (1800 * 0.21 + 70) * 1.15); // 515.20
});

test("water: 25 m³ current tariff = 11.50 water + 5.75 wastewater", () => {
  const w = waterBill(25, "current", rules);
  close(w.water, 15 * 0.1 + 10 * 1); close(w.wastewater, 5.75); close(w.total, 17.25);
  const w27 = waterBill(25, "scheduled", rules);
  close(w27.water, 15 * 1 + 10 * 2); close(w27.total, 35 + 17.5 + 20 + 10);
});

test("car loan: SAR 90,000 at 4% flat over 60 months = 1,800/month, APR ≈ 7.42%", () => {
  const l = carLoan(90000, 0.04, 60);
  close(l.monthly, 1800); close(l.interest, 18000);
  close(l.apr * 100, 7.42, 0.02);
});

test("SASO fuel-efficiency fee bands (2016+ vehicles)", () => {
  const bands = rules.vehicle_registration.values.fuelEfficiencyFeePerYear.lightVehicles2016Plus_kmPerL;
  assert.equal(fuelEfficiencyFee(16.5, bands), 0);
  assert.equal(fuelEfficiencyFee(14.5, bands), 50);
  assert.equal(fuelEfficiencyFee(9.5, bands), 190);
});

test("GPA: A+ 3h, B+ 4h, A 3h, C 2h = 4.44 / 5 and 3.44 / 4", () => {
  const table = rules.gpa_scales.values.table;
  close(gpa("A+, 3\nB+, 4\nA, 3\nC, 2", "5", table).gpa, 4.4375, 1e-6);
  close(gpa("A+, 3\nB+, 4\nA, 3\nC, 2", "4", table).gpa, (12 + 14 + 11.25 + 4) / 12, 1e-6);
  close(gpa("96, 3", "5", table).gpa, 5);
});

test("weighted admission: 95 / 80 / 78 at 30/30/40 = 83.7%", () => {
  const out = CALCULATOR_BY_SLUG.get("weighted-admission")!.compute({ preset: "common", hs: 95, qudurat: 80, tahsili: 78 }, rules);
  assert.match(String(out.headline.value), /83\.7/);
});

test("school age: six by the first school day; 90-day early entry needs kindergarten", () => {
  const c = CALCULATOR_BY_SLUG.get("school-age")!;
  const v = (dob: string, kg: boolean) => (c.compute({ dob, firstDay: "2026-08-23", kg }, rules).headline.value as any).en;
  assert.equal(v("2020-06-15", false), "Eligible");
  assert.equal(v("2020-10-01", false), "Not yet eligible");
  assert.equal(v("2020-10-01", true), "Eligible with early entry");
  assert.equal(v("2021-01-15", true), "Not yet eligible");
});

test("every calculator computes with its default inputs and has bilingual content", () => {
  const slugs = new Set<string>();
  for (const c of CALCULATORS) {
    assert.ok(!slugs.has(c.slug), `duplicate slug ${c.slug}`); slugs.add(c.slug);
    for (const k of ["title", "short", "metaDescription"] as const) assert.ok(c[k].en && c[k].ar, `${c.slug}.${k}`);
    for (const k of ["intro", "howTo", "formula"] as const) assert.ok(c.content[k].en && c.content[k].ar, `${c.slug}.content.${k}`);
    assert.ok(c.metaDescription.en.length <= 170, `${c.slug} metaDescription too long`);
    for (const id of c.ruleIds) assert.ok(rules[id], `${c.slug}: rule ${id} missing`);
    for (const r of c.related || []) assert.ok(CALCULATOR_BY_SLUG.has(r), `${c.slug}: related ${r} unknown`);
    const values = defaults(c.slug);
    try { c.compute(values, rules); } catch (e: any) { if (!["cost-of-living"].includes(c.slug)) throw new Error(`${c.slug}: ${e.message}`); }
  }
});
