// Phase 2 smoke tests (rankings, sponsorships, tiers). Read-only against the server; no payments.
import { test } from "node:test";
import assert from "node:assert/strict";

const BASE = (process.env.BASE_URL || "http://localhost:5000").replace(/\/$/, "");
const j = async (path, init = {}) => {
  const res = await fetch(BASE + path, { ...init, headers: { "content-type": "application/json", ...(init.headers || {}) }, body: init.body ? JSON.stringify(init.body) : undefined });
  let data = null; try { data = await res.json(); } catch {}
  return { status: res.status, data, headers: res.headers };
};

test("ranking combinations list and sitemap-top.xml", async () => {
  const r = await j("/api/rankings");
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.data) && r.data.length > 0, "at least one category/province with 3+ businesses");
  assert.ok(r.data[0].path.startsWith("/top/"));
  const xml = await (await fetch(BASE + "/sitemap-top.xml")).text();
  assert.ok(xml.includes("<urlset") && xml.includes("/top/"));
  const idx = await (await fetch(BASE + "/sitemap.xml")).text();
  assert.ok(idx.includes("sitemap-top.xml"), "sitemap index lists sitemap-top.xml");
});

test("ranking API scores and sorts businesses; sponsored block present", async () => {
  const combos = (await j("/api/rankings")).data;
  const c = combos[0];
  const r = await j(`/api/rankings/${c.category_slug}?province=${c.province_slug}`);
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.equal(r.data.category.slug, c.category_slug);
  assert.ok(r.data.items.length >= 3);
  for (let i = 1; i < r.data.items.length; i++) assert.ok(r.data.items[i - 1].score >= r.data.items[i].score, "sorted by score");
  assert.ok(Array.isArray(r.data.sponsored));
  assert.ok(r.data.items[0].breakdown && typeof r.data.items[0].breakdown.verified === "number");
  assert.equal((await j("/api/rankings/no-such-category-xyz")).status, 404);
});

test("/top page renders server-side with title, h1 and ItemList", async () => {
  const c = (await j("/api/rankings")).data[0];
  const res = await fetch(`${BASE}${c.path}`, { headers: { "user-agent": "Googlebot" } });
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.ok(/<title[^>]*>Top \d+ .* in .* \(\d{4}\) – Ranked \| PakistanYP<\/title>/.test(html), "ranked title");
  assert.ok(html.includes("<h1"), "h1");
  assert.ok(html.includes('"@type":"ItemList"'), "ItemList JSON-LD");
  assert.ok(!/name="robots" content="noindex/.test(html), "indexable when 3+ businesses");
});

test("tiers are public; billing and admin endpoints are protected", async () => {
  const t = await j("/api/billing/tiers");
  assert.equal(t.status, 200);
  assert.ok(t.data.tiers.pro && t.data.tiers.premium && t.data.tiers.free);
  assert.equal((await j("/api/my/plan")).status, 401);
  assert.equal((await j("/api/billing/checkout", { method: "POST", body: { businessId: 1, tier: "pro" } })).status, 401);
  for (const p of ["/api/admin/sponsorships", "/api/admin/billing", "/api/admin/lookup?q=ab"]) assert.ok([401, 403].includes((await j(p)).status), p);
  assert.ok([401, 403].includes((await j("/api/admin/businesses/1/tier", { method: "PATCH", body: { tier: "pro" } })).status));
  assert.equal((await j("/api/billing/webhook", { method: "POST", body: {} })).status, 400);
});

test("profile extras: public read, owner endpoints protected, upload requires login", async () => {
  const combos = (await j("/api/rankings")).data;
  const r = await j(`/api/rankings/${combos[0].category_slug}?limit=1`);
  const id = r.data.items[0].id;
  const ex = await j(`/api/businesses/${id}/extras`);
  assert.equal(ex.status, 200);
  for (const k of ["servicePrices", "portfolio", "team", "faqs"]) assert.ok(Array.isArray(ex.data[k]), k);
  assert.equal((await j(`/api/my/businesses/${id}/extras`)).status, 401);
  assert.equal((await j(`/api/my/businesses/${id}/extras`, { method: "PUT", body: { faqs: [] } })).status, 401);
  const up = await fetch(BASE + "/api/upload/image", { method: "POST" });
  assert.equal(up.status, 401);
});
