# Saudi Life — الحياة في السعودية

SaudiYP's consumer portal: calculators, guides and calendars, in English (`/…`) and Arabic (`/ar/…`).
Development branch: `saudi-life`. Nothing reaches production until the branch is merged into `main`
(Hostinger deploys `main`).

## 1. Audit summary (2026-11-03)

| Area | Finding |
|---|---|
| Stack | React 18.3, Vite 5.4, Express 4.21, wouter 3.3, TanStack Query 5, Drizzle 0.39, PostgreSQL (Neon), Tailwind 3.4, Node 22; server-side rendering with a data prepass (`client/src/entry-server.tsx`). |
| Code base | Generated from the shared YP template by the country kit (`tools/country-kit` in the template repository). Country-specific features live in the **extension hooks** (`client/src/extensions`, `server/extensions`), which the Saudi pack supplies, so regeneration keeps them. |
| Localization | English at the main addresses, Arabic under `/ar` (RTL, Arabic-Indic digits, hreflang, both languages in sitemaps). Admin is English only. |
| Directory | Regions → cities → districts, 1,475 categories, business profiles, search, claims, reviews, leads; unchanged by this work. |
| SEO | Canonical per page, hreflang, sitemap index with sections, IndexNow, real 404s, robots.txt. |
| Security | Session auth (express-session + Postgres store), role checks on admin APIs, CSP/HSTS headers. No general API rate limiter: this module adds per-IP limits on its own endpoints. |
| Tests | `node --test tests/` fails on Node 22 (directory argument); `node --test tests/*.mjs` runs: 55/74 pass, with the same 17 failures on `main` (old URLs such as `/provinces`, `/blog` and missing test businesses), so they are pre-existing. |
| Live site | Not reachable from the development sandbox (network policy), so the audit used the repository and a local production build against a copy of the live database schema. |
| Backups | `scripts/backup-db.sh [dev|prod]` writes a gzipped `pg_dump` and keeps the last 20. Neon also keeps point-in-time history. |

## 2. What is included

**Sections** (each has a landing page, breadcrumbs and BreadcrumbList structured data): Saudi Life hub,
Calculators, Education & Schools, Expatriate Guide, Cars & Driving, Home & Utilities, Family & Kids,
Travel & Tourism, Shopping & Prices, Public Holidays & Calendars, Cost of Living. The Business Directory is the
existing `/categories`.

**33 calculators** (`/calculators/<slug>`), each with inputs and validation, instant results with a breakdown,
formula and assumptions, a worked example, sources with confirmation status and check date, last-reviewed date,
print and share (share links carry the inputs), related tools, keyboard-accessible form controls and
server-rendered content:

- Employment: end-of-service, overtime, annual leave, unused leave, GOSI, salary breakdown, notice period,
  contract duration, salary increase.
- Home: electricity bill (current tariff and the 2027 tariff), AC consumption, appliance cost, water bill,
  utility budget, solar savings.
- Cars: fuel cost, trip fuel cost, car loan (flat rate + APR), EV charging, vehicle fees (istimara, fuel-efficiency
  fee, Fahas, licence), depreciation, ownership cost.
- Education: GPA (5 and 4 scales), grade percentage, weighted admission percentage (IAU / KSU health / KFUPM
  presets), school admission age, school budget, education savings.
- Family: household budget, savings goal, rent affordability, cost of living by city, relocation cost;
  plus a two-city comparison page.

**Tools and content:** public holidays page (2026 confirmed, 2027 marked as expected until announced), Hijri ⇄
Gregorian converter (Umm al-Qura via Intl/CLDR), 14 expatriate guides in English and Arabic with official links
and verification dates, a home-page block and a "Saudi Life" menu item.

**Admin:** `/admin/saudi-life` — edit rates, tariffs and dates (values, sources, confidence, verified and
effective dates) without code changes; roles: editors = super_admin, admin, content_manager; reviewers
(read only) = moderator, business_manager. Every change goes to `life_audit_log`. Rules not verified for
180 days are flagged.

**Not included yet (needs verified data or partners):** school directory and comparison with tuition data, family
event listings (needs authorised feeds), live price comparison (needs retailer feeds), advertising/affiliate
integration, saved calculations and newsletters. Event and school features must not be filled with invented
data; the module leaves those areas to the business directory until sources are agreed.

## 3. Data and sources

- `server/extensions/saudi-life/rules.json` — reviewed baseline of 37 rules (labour law, GOSI, Saudi Energy and
  NWC tariffs, Aramco fuel prices, vehicle fees, VAT, holidays, school calendar, admission rules, GPA scales),
  each with sources, `confidence` (confirmed / secondary / unconfirmed), `verifiedOn` and `effectiveFrom`.
- On start the rules are loaded into `life_rules`: new ones are inserted; rules nobody has edited are refreshed
  when the file version changes; admin edits are never overwritten.
- Research could not open official pages directly from the sandbox (network policy); figures were confirmed from
  search-indexed excerpts of the official sites plus press and law-firm summaries. Items marked `secondary` or
  `unconfirmed` should be re-checked on the official pages before launch:
  water tariff (current tier 2 and meter fee), fuel prices after each Aramco review (Gasoline 98 monthly),
  vehicle fees, school calendar break dates, KAU admission weights, government payday weekend rule, EV charging.
- Guides: `server/extensions/saudi-life/guides/expat/<slug>.md` and `<slug>.ar.md` (front matter: title,
  summary, metaTitle, metaDescription, lastVerified, officialLinks).

## 4. URLs and SEO

English `/saudi-life`, `/calculators/…`, `/expat-guide/…`, `/holidays`, …; Arabic the same under `/ar`. This follows
the site's existing convention (English at the root). No existing URL changed. `sitemap-saudi-life.xml` lists
every page in both languages with hreflang alternates and is part of `sitemap.xml`.

## 5. Database changes

Additive only: tables `life_rules` and `life_audit_log` (created if missing). Rollback: deploy the previous
commit; the tables can stay (nothing else reads them) or be dropped:
`drop table life_audit_log; drop table life_rules;`.

## 6. Tests

`npx tsx --test tests/saudi-life.test.ts` — 13 groups, each checked against independently worked examples:
Article 84/85 awards incl. the 5- and 10-year boundaries; MHRSD's overtime example; GOSI legacy, new-law (by
date) and non-Saudi rates and the wage cap; electricity bills on both tariffs; water and wastewater; car loan APR;
SASO fuel-efficiency bands; GPA on both scales; weighted percentage; school-age eligibility; and checks that
every calculator has bilingual content, valid rules and related links, and runs with its defaults.
Browser checks (Playwright, 1366 and 390 px, English and Arabic): no console errors, results update as inputs
change, invalid inputs show errors, Arabic results show Arabic digits.

## 7. Deploying

1. Review the branch (`saudi-life`) and re-check the `secondary`/`unconfirmed` rules in the admin after launch.
2. Back up the database: `scripts/backup-db.sh prod`.
3. Merge `saudi-life` into `main`; Hostinger deploys. Tables are created on start.
4. Submit `https://saudiyp.com/sitemap.xml` again in Search Console.
