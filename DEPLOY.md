# Deploying pakistanyp.com on Hostinger

This repository is the Pakistan directory (pakistanyp.com, brand **PakistanYP**). It is a
standalone, single-site codebase.

- Site settings (brand, domain, phone code +92, PKR, colours, logo files, verification documents): `shared/country.ts`
- Provinces & territories, cities and localities: `shared/countries/places.ts`
- Category tree: `shared/countries/categories.ts`

---

## 1. Database (Neon, about 2 minutes, browser only)

1. In Neon create a project (e.g. `pakistanyp.com`), Postgres 16. Choose a region close to your
   Hostinger server (for example AWS Asia Pacific / Singapore).
2. Click **Connect**, turn on **Connection pooling**, and copy the connection string
   (`postgresql://…-pooler…neon.tech/neondb?sslmode=require`).

That's all. On its **first start against the empty database** the app creates every table and loads
the reference data from `server/sql/init.sql` (no terminal needed):

- every province and territory, with Urdu names
- the cities and towns, and the localities of the big cities
- the full category tree (main categories and sub-categories)

It contains no businesses or users. Later starts skip this step.

To re-sync places and categories later from a terminal: `DATABASE_URL=... npx tsx scripts/seed.ts`
(safe to repeat; it never touches businesses).

## 2. Hostinger web app

Create a **new** Node.js web app connected to the GitHub repository **sheraz1001/pakistanyp**,
branch `main`, with the domain **pakistanyp.com**.

| Setting | Value |
|---|---|
| Node.js version | 20 or 22 |
| Build command | `npm run build` |
| Start command / entry file | `npm start` (entry file `server.js`) |

Environment variables:

| Variable | Value |
|---|---|
| `DATABASE_URL` | the Neon **pooled** connection string |
| `NODE_ENV` | `production` |
| `NPM_CONFIG_INCLUDE` | `dev` |
| `SESSION_SECRET` | a new long random string |
| `GA_MEASUREMENT_ID` | optional: a GA4 property for pakistanyp.com (`G-…`) |
| `GOOGLE_SITE_VERIFICATION` | optional: token from a Search Console property |
| `OPENAI_API_KEY`, `SENDGRID_API_KEY`, Stripe keys … | optional; the site runs without them, those features stay off |

After saving the variables, **redeploy / restart** the app. The first start takes a few seconds
longer while the database is set up.

## 3. Domain (Cloudflare → Hostinger)

- **Cloudflare SSL/TLS mode must be "Full (strict)"** (or "Full"). With "Flexible" the site ends in
  a redirect loop, because the app redirects HTTP to HTTPS.
- Turn on **Always Use HTTPS**.
- `www.pakistanyp.com` redirects to the apex automatically.
- Create the mailboxes used on the site: `info@`, `support@`, `legal@`, `privacy@`, `dpo@` @pakistanyp.com.

## 4. Before going public (owner checklist)

- [ ] **Listings**: add real Pakistani businesses (aim for a few hundred) before submitting the sitemap.
      Category and locality pages without businesses are automatically `noindex` and left out of the sitemap.
- [ ] **Prices**: plan and advertising prices are placeholder numbers labelled PKR (pricing, advertise-with-us,
      upgrade-premium, subscribe, my-plan). Set real Pakistani prices; Stripe is set to PKR.
- [ ] **Legal review** of terms, privacy and guidelines under Pakistani law: governing law and courts, the
      company's registration details and address, and electronic-crime and data-protection law.
- [ ] **Contact details**: real address (now "Islamabad, Pakistan") and phone; social media links in
      `social` in `shared/country.ts` (empty for now, so the icons are hidden).
- [ ] **Verification documents** list (`licenceAuthorities` in `shared/country.ts`): check that the
      registrations and licences listed match what local businesses can provide.
- [ ] Optional: hero images and descriptions per province.

## 5. After launch

**Sitemap and search engines are automatic.** `https://pakistanyp.com/sitemap.xml` is built live from the
database, so new businesses, news, blog posts, categories, cities, localities and provinces appear as soon
as they are saved (admin panel or users). Each section shows the date it last changed. The app also
notifies IndexNow (Bing and others) about new and changed pages every 10 minutes; nothing to set up.
Optional env vars: `INDEXNOW_KEY`, `INDEXNOW_INTERVAL_MINUTES`, `INDEXNOW_DISABLED=true`.
For Google, submit the sitemap once in Search Console; Google re-reads it on its own.


1. Search Console: add `https://pakistanyp.com`, verify (meta tag via `GOOGLE_SITE_VERIFICATION`),
   submit `https://pakistanyp.com/sitemap.xml`.
2. Check a province, a category and a business page with "URL inspection".

## Testing locally

```bash
npm install
DATABASE_URL=<db> npm run dev
```

For a local PostgreSQL instead of Neon, add `DATABASE_DRIVER=pg`.
