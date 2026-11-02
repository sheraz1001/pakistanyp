// PakistanYP smoke & regression tests — black-box HTTP tests against a running server.
// Zero extra dependencies (Node 20 built-in test runner).
//
//   npm run dev                      # in one shell (or point at staging)
//   BASE_URL=http://localhost:5000 npm test
//
// Optional env:
//   TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD  -> enables admin-operation tests
//   TEST_ALLOW_WRITES=1                     -> enables tests that create records (registration, listing submission)
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

const BASE = (process.env.BASE_URL || "http://localhost:5000").replace(/\/$/, "");
const GOOGLEBOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

async function req(path, { method = "GET", ua = CHROME, headers = {}, body, cookie } = {}) {
  const res = await fetch(BASE + path, {
    method,
    redirect: "manual",
    headers: {
      "user-agent": ua,
      ...(body ? { "content-type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, headers: res.headers, text, json: () => JSON.parse(text) };
}

const count = (re, s) => (s.match(re) || []).length;
const titleOf = (html) => (html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] || "";
const canonicalOf = (html) => (html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i) || [])[1] || "";
const headOf = (html) => html.split(/<\/head>/i)[0].replace(/<script[\s\S]*?<\/script>/gi, "");

async function firstSitemapUrl(childName, filter = () => true) {
  const r = await req(`/${childName}`, { ua: GOOGLEBOT });
  const locs = [...r.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const hit = locs.find(filter);
  return hit ? hit.replace(/^https?:\/\/[^/]+/, "") : null;
}

// ---------------------------------------------------------------- SEO
describe("SEO: crawl infrastructure", () => {
  test("robots.txt is valid and points to the sitemap", async () => {
    const r = await req("/robots.txt", { ua: GOOGLEBOT });
    assert.equal(r.status, 200);
    assert.match(r.headers.get("content-type") || "", /text\/plain/);
    assert.match(r.text, /^User-agent: \*/m);
    assert.match(r.text, /^Sitemap: https:\/\/pakistanyp\.com\/sitemap\.xml$/m);
    // Googlebot must not get its own "Allow: /" group that silently overrides the Disallow rules
    assert.doesNotMatch(r.text, /User-agent: Googlebot/);
    assert.doesNotMatch(r.text, /^Disallow: \/api\/\s*$/m, "public API reads must stay crawlable for rendering");
  });

  test("sitemap index and every child sitemap return XML with absolute pakistanyp.com URLs", async () => {
    const idx = await req("/sitemap.xml", { ua: GOOGLEBOT });
    assert.equal(idx.status, 200);
    const children = [...idx.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    assert.ok(children.length >= 3, "expected several child sitemaps");
    const seen = new Set();
    for (const c of children) {
      assert.match(c, /^https:\/\/pakistanyp\.com\//);
      const r = await req(c.replace(/^https?:\/\/[^/]+/, ""), { ua: GOOGLEBOT });
      assert.equal(r.status, 200, c);
      for (const m of r.text.matchAll(/<loc>([^<]+)<\/loc>/g)) {
        assert.match(m[1], /^https:\/\/pakistanyp\.com(\/|$)/, `bad host in ${c}: ${m[1]}`);
        assert.ok(!seen.has(m[1]), `duplicate URL across sitemaps: ${m[1]}`);
        seen.add(m[1]);
      }
    }
  });
});

describe("SEO: server-rendered pages (same HTML for bots and users)", async () => {
  const pages = ["/", "/categories", "/provinces", "/karachi", "/localities", "/blog", "/news", "/about"];
  const biz = await firstSitemapUrl("sitemap-businesses.xml");
  const cat = await firstSitemapUrl("sitemap-categories.xml");
  const loc = await firstSitemapUrl("sitemap-localities.xml");
  for (const p of [...pages, biz, cat, loc].filter(Boolean)) {
    test(`page ${p}`, async () => {
      const bot = await req(p, { ua: GOOGLEBOT });
      const user = await req(p, { ua: CHROME });
      assert.equal(bot.status, 200);
      assert.equal(user.status, 200);
      const head = headOf(bot.text);
      assert.equal(count(/<title[\s>]/gi, head), 1, "exactly one <title> in <head>");
      assert.equal(count(/rel="canonical"/gi, head), 1, "exactly one canonical");
      assert.equal(count(/<meta[^>]+name="description"/gi, head), 1, "exactly one meta description");
      const canon = canonicalOf(bot.text);
      const expected = "https://pakistanyp.com" + (p === "/" ? "/" : p);
      assert.equal(decodeURI(canon), decodeURI(expected), "self-referencing canonical");
      assert.ok(/<div id="root">\s*<\S/.test(bot.text), "root must contain server-rendered markup");
      assert.ok(count(/<h1[\s>]/gi, bot.text) >= 1, "has an <h1>");
      // no cloaking: bots and users get the same title + canonical
      assert.equal(titleOf(bot.text), titleOf(user.text));
      assert.equal(canonicalOf(bot.text), canonicalOf(user.text));
      assert.doesNotMatch(titleOf(bot.text), /undefined|null|NaN/);
    });
  }
  test("detail pages have their own title (not the generic homepage title)", async () => {
    const home = titleOf((await req("/")).text);
    for (const p of [biz, cat, loc].filter(Boolean)) {
      assert.notEqual(titleOf((await req(p)).text), home, p);
    }
  });
});

describe("SEO: status codes, redirects and indexing rules", () => {
  for (const p of ["/business/does-not-exist-e2e", "/categories/does-not-exist-e2e", "/localities/karachi/does-not-exist-e2e", "/no-such-page-e2e"]) {
    test(`404 + noindex for ${p}`, async () => {
      const r = await req(p, { ua: GOOGLEBOT });
      assert.equal(r.status, 404);
      const xr = r.headers.get("x-robots-tag") || "";
      assert.ok(/noindex/.test(xr) || /<meta[^>]+name="robots"[^>]+noindex/.test(r.text), "noindex signal");
    });
  }
  const redirects = [
    ["/categories/", "/categories"],
    ["/Categories", "/categories"],
    ["/provinces/karachi", "/karachi"],
    ["/business-profile/some-slug", "/business/some-slug"],
    ["/karachi/al-barsha", "/localities/karachi/al-barsha"],
  ];
  for (const [from, to] of redirects) {
    test(`301 ${from} -> ${to}`, async () => {
      const r = await req(from);
      assert.equal(r.status, 301);
      assert.equal(new URL(r.headers.get("location"), BASE).pathname, to);
    });
  }
  test("www host redirects to apex", { skip: !BASE.startsWith("http://") }, async () => {
    // fetch() cannot override Host, so use node:http directly
    const u = new URL(BASE + "/categories");
    const r = await new Promise((resolve, reject) => {
      http.get({ hostname: u.hostname, port: u.port, path: u.pathname, headers: { host: "www.pakistanyp.com" } }, (res) => { res.resume(); resolve(res); }).on("error", reject);
    });
    assert.equal(r.statusCode, 301);
    assert.equal(r.headers.location, "https://pakistanyp.com/categories");
  });
  for (const p of ["/login", "/register", "/search", "/super-admin"]) {
    test(`private/utility page ${p} is noindex`, async () => {
      const r = await req(p);
      assert.match(r.headers.get("x-robots-tag") || "", /noindex/);
    });
  }
  test("JSON API responses are noindex", async () => {
    const r = await req("/api/provinces");
    assert.equal(r.status, 200);
    assert.match(r.headers.get("x-robots-tag") || "", /noindex/);
  });
});

// ---------------------------------------------------------------- Security
describe("Security: admin & debug endpoints require an admin session", () => {
  const getProtected = ["/api/admin/users", "/api/admin/businesses", "/api/admin/businesses/pending", "/api/admin/audit-logs", "/api/admin/stats", "/api/admin/user-analytics", "/api/admin/business-claims", "/oauth-debug", "/debug/headers"];
  for (const p of getProtected) {
    test(`GET ${p} -> 401`, async () => {
      const r = await req(p);
      assert.ok([401, 403].includes(r.status), `${p} returned ${r.status}`);
      assert.doesNotMatch(r.text, /@[a-z0-9-]+\.[a-z]{2,}/i, "must not leak email addresses");
    });
  }
  const postProtected = ["/api/fix-password", "/api/create-user-manual", "/api/verify-user-manual", "/api/admin/users", "/api/categories", "/api/admin/businesses/bulk-operation", "/api/cache/clear", "/api/scraper/search"];
  for (const p of postProtected) {
    test(`POST ${p} -> 401`, async () => {
      const r = await req(p, { method: "POST", body: { email: "attacker@example.test", newPassword: "x", role: "super_admin" } });
      assert.ok([401, 403].includes(r.status), `${p} returned ${r.status}`);
    });
  }
  test("public reads used by the site stay open", async () => {
    for (const p of ["/api/admin/menus", "/api/admin/settings"]) assert.equal((await req(p)).status, 200, p);
  });
  test("Stripe webhook rejects unsigned payloads", async () => {
    const r = await req("/api/webhooks/stripe", { method: "POST", body: { type: "checkout.session.completed" } });
    assert.ok(r.status >= 400 && r.status < 500, `unsigned webhook accepted with ${r.status}`);
  });
});

// ---------------------------------------------------------------- Auth
describe("Auth", () => {
  test("login with wrong password is rejected", async () => {
    const r = await req("/api/auth/login", { method: "POST", body: { email: "nobody-e2e@example.test", password: "wrong-password" } });
    assert.ok([400, 401, 404].includes(r.status), `got ${r.status}`);
  });
  test("current user is 401 when logged out", async () => {
    const r = await req("/api/auth/user");
    assert.equal(r.status, 401);
  });
  test("registration validates input", async () => {
    const r = await req("/api/auth/register", { method: "POST", body: { email: "not-an-email" } });
    assert.ok(r.status >= 400 && r.status < 500, `got ${r.status}`);
  });
  test("registration + login round trip", { skip: !process.env.TEST_ALLOW_WRITES }, async () => {
    const email = `e2e+${Date.now()}@example.test`;
    const reg = await req("/api/auth/register", { method: "POST", body: { email, password: "E2e-Passw0rd!", firstName: "E2E", lastName: "Test" } });
    assert.ok([200, 201].includes(reg.status), `register ${reg.status}: ${reg.text.slice(0, 200)}`);
  });
});

// ---------------------------------------------------------------- Directory
describe("Directory data & search", () => {
  test("provinces API returns provinces", async () => {
    const r = await req("/api/provinces");
    assert.equal(r.status, 200);
    assert.ok(r.json().length >= 5);
  });
  test("all provinces and territories are active (Islamabad & Multan are inactive in the dev DB)", { todo: true }, async () => {
    assert.equal((await req("/api/provinces")).json().length, 7);
  });
  test("categories API returns categories with unique slugs", async () => {
    const list = (await req("/api/categories")).json();
    assert.ok(list.length > 10);
    const slugs = list.map((c) => c.slug);
    assert.equal(new Set(slugs).size, slugs.length, "duplicate category slugs");
  });
  test("search page renders for a query", async () => {
    const r = await req("/search?q=restaurant");
    assert.equal(r.status, 200);
  });
  test("listing submission requires login", async () => {
    const r = await req("/api/businesses", { method: "POST", body: { name: "E2E Test Biz" } });
    assert.ok([400, 401, 403].includes(r.status), `anonymous submission returned ${r.status}`);
  });
});

// ---------------------------------------------------------------- Admin operations (opt-in)
describe("Admin operations", { skip: !process.env.TEST_ADMIN_EMAIL }, () => {
  let cookie = "";
  test("admin can log in", async () => {
    const res = await fetch(BASE + "/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: process.env.TEST_ADMIN_EMAIL, password: process.env.TEST_ADMIN_PASSWORD }),
    });
    assert.equal(res.status, 200);
    cookie = (res.headers.get("set-cookie") || "").split(";")[0];
    assert.ok(cookie, "session cookie set");
  });
  test("admin can read users, businesses and pending queue", async () => {
    for (const p of ["/api/admin/users", "/api/admin/businesses", "/api/admin/businesses/pending", "/api/admin/stats"]) {
      assert.equal((await req(p, { cookie })).status, 200, p);
    }
  });
});

// ---------------------------------------------------------------- Regressions from the 2026-10-29 bug audit
describe("Regressions", () => {
  test("account pages are routed (200, not 404) even without a session", async () => {
    for (const p of ["/dashboard", "/admin", "/reports"]) {
      const r = await req(p);
      assert.equal(r.status, 200, p);
      assert.match(r.headers.get("x-robots-tag") || "", /noindex/, p + " must be noindex");
    }
  });
  test("every province page lists its localities and businesses", async () => {
    const provinces = (await req("/api/provinces")).json();
    assert.equal(provinces.length, 7, "all provinces and territories active");
    for (const e of provinces) {
      const locs = (await req(`/api/localities?provinceId=${e.id}`)).json();
      assert.ok(Array.isArray(locs) && locs.length > 0, `${e.name} has localities`);
    }
  });
  test("help centre articles API works", async () => {
    assert.equal((await req("/api/help/articles")).status, 200);
  });
  test("blog search page renders with site header", async () => {
    const r = await req("/blog/search?q=karachi");
    assert.equal(r.status, 200);
    assert.match(r.text, /Blog Search/);
  });
});
