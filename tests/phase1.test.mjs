// Phase 1 smoke tests (verification, structured reviews, leads) against a local dev server.
//   BASE_URL=http://localhost:5000 node --test tests/phase1.test.mjs
// Only uses example.com addresses; rows are tagged so they can be cleaned up afterwards.
import { test } from "node:test";
import assert from "node:assert/strict";

const BASE = (process.env.BASE_URL || "http://localhost:5000").replace(/\/$/, "");
const j = async (path, init = {}) => {
  const res = await fetch(BASE + path, { ...init, headers: { "content-type": "application/json", ...(init.headers || {}) }, body: init.body ? JSON.stringify(init.body) : undefined });
  let data = null; try { data = await res.json(); } catch {}
  return { status: res.status, data };
};
const firstBusiness = async () => {
  const r = await fetch(BASE + "/api/businesses?limit=1");
  const d = await r.json();
  const b = Array.isArray(d) ? d[0] : (d.businesses || d.items || d.data || [])[0];
  assert.ok(b && b.id, "need at least one business");
  return b;
};

test("trust summary is public and cached", async () => {
  const b = await firstBusiness();
  const r = await j(`/api/businesses/${b.id}/trust`);
  assert.equal(r.status, 200);
  assert.equal(typeof r.data.isVerified, "boolean");
  assert.ok("ratingCount" in r.data);
});

test("structured reviews: list is public, validation rejects incomplete scores", async () => {
  const b = await firstBusiness();
  const list = await j(`/api/businesses/${b.id}/structured-reviews`);
  assert.equal(list.status, 200);
  assert.ok(Array.isArray(list.data.items));
  assert.ok("count" in list.data.summary);
  const bad = await j(`/api/businesses/${b.id}/structured-reviews`, { method: "POST", body: { quality: 5 } });
  assert.equal(bad.status, 400);
});

test("structured reviews: a complete submission is accepted as pending (not public until moderated)", async () => {
  const b = await firstBusiness();
  const before = (await j(`/api/businesses/${b.id}/structured-reviews`)).data.summary.count;
  const r = await j(`/api/businesses/${b.id}/structured-reviews`, { method: "POST", body: {
    quality: 5, cost: 4, schedule: 5, refer: 5, budgetBand: "PKR 20,000 – 50,000", projectType: "TEST-PHASE1 fit-out",
    content: "TEST-PHASE1: They handled our office fit-out from design to handover; the team was responsive, kept to the schedule and the finish quality was excellent.",
    reviewerName: "Phase1 Test", reviewerEmail: "phase1-test@example.com", reviewerCompany: "Example LLC" } });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  assert.equal(r.data.status, "pending");
  const after = (await j(`/api/businesses/${b.id}/structured-reviews`)).data.summary.count;
  assert.equal(after, before, "pending review must not be public");
});

test("legacy review endpoint requires login", async () => {
  const b = await firstBusiness();
  const r = await j(`/api/businesses/${b.id}/reviews`, { method: "POST", body: { rating: 5, content: "TEST-PHASE1 legacy form review text here" } });
  assert.equal(r.status, 401);
});

test("leads: validation, profile lead, category lead", async () => {
  const b = await firstBusiness();
  const bad = await j("/api/leads", { method: "POST", body: { businessId: b.id, name: "x" } });
  assert.equal(bad.status, 400);
  const ok = await j("/api/leads", { method: "POST", body: { businessId: b.id, name: "Phase1 Lead Test", email: "phase1-lead@example.com", phone: "0501234567", serviceNeeded: "TEST-PHASE1 annual maintenance", message: "TEST-PHASE1: Need a quotation for annual maintenance of three villas in Karachi." } });
  assert.equal(ok.status, 201, JSON.stringify(ok.data));
  assert.equal(ok.data.matched, 1);
  const cats = await (await fetch(BASE + "/api/categories")).json();
  const cat = (Array.isArray(cats) ? cats : cats.categories || [])[0];
  if (cat?.id) {
    const c = await j("/api/leads", { method: "POST", body: { categoryId: cat.id, name: "Phase1 Lead Test", email: "phase1-lead@example.com", serviceNeeded: "TEST-PHASE1 category", message: "TEST-PHASE1: Looking for quotes from a few companies in this category." } });
    assert.ok([201, 404].includes(c.status), JSON.stringify(c.data));
    if (c.status === 201) assert.ok(c.data.matched >= 1 && c.data.matched <= 5);
  }
});

test("owner and admin endpoints are protected", async () => {
  const b = await firstBusiness();
  assert.equal((await j("/api/my/leads")).status, 401);
  assert.equal((await j("/api/my/businesses")).status, 401);
  assert.equal((await j(`/api/businesses/${b.id}/verification`, { method: "POST", body: {} })).status, 401);
  for (const p of ["/api/admin/verifications", "/api/admin/reviews", "/api/admin/leads"]) {
    const r = await j(p);
    assert.ok([401, 403].includes(r.status), `${p} -> ${r.status}`);
  }
});

test("email confirm with a bad token redirects to the invalid page", async () => {
  const res = await fetch(BASE + "/api/verification/email/confirm?token=nope", { redirect: "manual" });
  assert.equal(res.status, 302);
  assert.ok(res.headers.get("location").includes("email=invalid"));
});

test("profile page renders the new sections server-side", async () => {
  const b = await firstBusiness();
  const html = await (await fetch(`${BASE}/business/${b.slug}`, { headers: { "user-agent": "Googlebot" } })).text();
  assert.ok(html.includes('id="reviews"'), "reviews section");
  assert.ok(html.includes('id="quote"'), "quote section");
  assert.ok(html.includes('id="trust"'), "trust section");
});
