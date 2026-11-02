# Country kit: the standard for every YP country site

PakistanYP (this repository) is the **master template**. SaudiYP, IndiaYP and any future country
site are generated from it, so every improvement made here reaches all of them.

```
pakistanyp (template)  --tools/country-kit/build.py + packs/<code>-->  saudiyp, indiayp, ...
```

Each generated site is a standalone, single-country codebase in its own repository, deployed on its
own (Hostinger + Neon). Nothing is shared at runtime.

## What every country site has (the standard)

- **Places**: Region (province / state / region) > City > Locality. No districts, divisions or tehsils.
  Every region, city and locality has its own page; region pages list their cities with business counts,
  city pages list their localities with counts. A region with a single city (Islamabad, Delhi) shows
  its localities directly.
- **Categories**: main categories > sub-categories (> specialised). Main category pages show
  sub-categories, not businesses. Businesses are always filed under a sub-category.
- **Forms**: adding a business requires a main category, a sub-category, a region, a city and a locality.
- **Home page**: stats (businesses, categories, regions, cities, localities), all clickable, and a news ticker.
- **SEO guides**: hand-written guides for every region and the major cities (content/places), synced into
  the database on start without overwriting admin edits.
- **Sitemaps**: an index with separate sitemaps for static pages, regions, cities, localities, categories,
  businesses, blogs and news; lastmod from the database. Updated automatically, and changed pages are
  sent to IndexNow every 10 minutes.
- **Editorial**: /blogs and /news with a right-hand sidebar (categories with counts and more), professional
  article pages, launch news and four starter blogs (content/news, content/blog).
- **Database start-up**: empty database → schema and reference data from server/sql/init.sql; older database
  (the `emirates` schema) → renamed in place; then missing columns, places and categories are added on every start.

## Repository layout

| Path | What it holds | Per country? |
|---|---|---|
| `shared/country.ts` | site config, between `// <country-config>` markers | the marked block |
| `shared/countries/places.ts` | `REGIONS`, `TERRITORIES` | yes |
| `shared/countries/categories.ts` | `CATEGORY_TREE` (indented text), `parseCategoryTree` | yes |
| `shared/countries/locale.ts` | phone format, legal forms, facts, FAQ sample | yes |
| `content/places/{provinces,cities}/*.md` | SEO guides (front matter: metaTitle, metaDescription, summary) | yes |
| `content/news`, `content/blog` | launch news and starter blogs, published once by slug | yes |
| `client/public/logo/*`, icons, `og-homepage.jpg`, `content/*.jpg` | brand assets | generated |
| `server/sql/init.sql` | schema + the country's reference data | generated |
| everything else | the product | shared |

## A country pack (`tools/country-kit/packs/<code>/`)

| File | Notes |
|---|---|
| `pack.json` | brand, slug, domain, country names, currency, phone prefix, timezone, locale, language + font for local names, region term (`["State","States"]`), region phrase, colour map (template hex → country hex), `placeMap` (template example places → local ones, used in code copy), `replace` pairs, `covers` (cover image texts) |
| `country-config.ts` | the `const SITE: CountryConfig = {...};` block |
| `places.ts`, `categories.ts`, `locale.ts` | data files in the template's format (see briefs/data-brief.md) |
| `content/` | guides, news, blogs. `{{REGIONS}}`, `{{CITIES}}`, `{{LOCALITIES}}`, `{{CATEGORIES}}`, `{{SECTORS}}` are filled in from the data |
| `brand/` | `logo.png` (full lockup), `logo-104.png` (header lockup), `mark.png`, `icon-512.png`, optional `logo-white.png` |
| `root/` (optional) | files copied over the repository root |

## Generating a site

```bash
# 1. clone the country's repository next to this one
git clone https://github.com/sheraz1001/saudiyp ../saudiyp

# 2. generate (an empty local Postgres database is needed for --seed)
createdb kitseed
python3 tools/country-kit/build.py tools/country-kit/packs/sa ../saudiyp --seed postgresql://localhost/kitseed

# 3. build and test
cd ../saudiyp && npm install && npm run build
DATABASE_URL=<empty test db> DATABASE_DRIVER=pg npm start      # and against a copy of the live database
```

The generator:
1. copies the template's tracked files (except data, content, brand assets and init.sql),
2. replaces brand and country wording (PakistanYP → SaudiYP, Pakistani → Saudi, PKR → SAR, +92 → +966,
   Urdu → Arabic, fonts, colours, example places),
3. changes the user-facing "Province" wording to the country's term with `region-terms.cjs`
   (string literals and JSX text only; code identifiers, API paths and SQL stay as they are),
4. writes the config block and the pack's data, locale and content,
5. renders the logo renditions, favicons, app icons, OG image and article covers,
6. scans the code for leftover Pakistan words and writes `.kit-leaks.txt` (must be empty), and
7. with `--seed`, loads the schema into the empty database, runs the catalog sync and appends the
   reference rows to `server/sql/init.sql`.

Then commit and push the country's `main` (Hostinger deploys it). Delete `.kit-leaks.txt` before committing
(it is only written when there are hits).

## Rules for template changes

- Write product code once, here. Use `country.*` (shared/country.ts) for names, terms, phone, currency and
  examples, and `shared/countries/locale.ts` for anything country-specific in logic.
- In code, never hard-code a city, region, regulator or count. If an example is unavoidable, use a name from
  `placeMap` so the generator can map it.
- Keep "Province" wording in string literals or JSX text so `region-terms.cjs` can translate it.
- After a change, regenerate every country site and re-run the leak scan.

## Adding a new country

1. Copy `packs/in` to `packs/<code>` and edit `pack.json` and `country-config.ts`.
2. Write `places.ts` and `categories.ts` (briefs/data-brief.md) and `locale.ts`.
3. Write the guides (briefs/guide-brief.md), the launch news and the four blogs.
4. Put the logo files in `brand/`.
5. Generate, test on an empty database, push to the new repository, then follow its DEPLOY.md.
