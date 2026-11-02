/**
 * Load PakistanYP reference data into a database that already has the tables.
 *
 *   DATABASE_URL=<db> npx tsx scripts/seed.ts
 *
 * Seeds (idempotent, safe to re-run; businesses are never touched):
 *   - provinces & territories -> "provinces" table
 *   - cities and localities   -> "localities" table (slug "<province>/<place>")
 *   - categories              -> from shared/countries/pakistan-categories.ts (only if the table is empty)
 *
 * A brand-new empty database does not need this: the app loads server/sql/init.sql
 * on its first start (server/bootstrapDatabase.ts).
 */
import pg from "pg";
import { country, regionSlug } from "../shared/country";
import { parseCategoryTree } from "../shared/countries/pakistan-categories";

const slug = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");

function client(url: string | undefined) {
  if (!url) throw new Error("DATABASE_URL is not set");
  const local = /localhost|127\.0\.0\.1|host=\//.test(url);
  return new pg.Client({ connectionString: url, ssl: local ? undefined : { rejectUnauthorized: false } });
}

async function main() {
  const db = client(process.env.DATABASE_URL);
  await db.connect();
  try {
    const tables = await db.query("select to_regclass('public.provinces') as p, to_regclass('public.localities') as l, to_regclass('public.categories') as c");
    if (!tables.rows[0].p || !tables.rows[0].l || !tables.rows[0].c) {
      throw new Error("Tables missing. Start the app once against this database (it creates them), or load server/sql/init.sql.");
    }

    // ---- provinces & territories
    let provincesAdded = 0;
    const provinceIds = new Map<string, number>();
    for (const [i, r] of country.regions.entries()) {
      const found = await db.query("select id from provinces where lower(name) = lower($1)", [r.name]);
      let id = found.rows[0]?.id;
      if (!id) {
        const ins = await db.query(
          `insert into provinces (name, arabic_name, code, is_capital, description, is_active, is_published, sort_order, meta_title, meta_description)
           values ($1,$2,$3,$4,$5,true,true,$6,$7,$8) returning id`,
          [
            r.name, r.nameAr, r.code || r.slug.toUpperCase().slice(0, 10), !!r.capital,
            `Businesses and services in ${r.name}, Pakistan.`,
            i,
            `Businesses in ${r.name}, Pakistan | ${country.brand}`,
            `Find companies and services in ${r.name}, Pakistan: contact details, locations and reviews on ${country.brand}.`,
          ],
        );
        id = ins.rows[0].id;
        provincesAdded++;
      }
      provinceIds.set(r.slug, id);
    }
    console.log(`Provinces & territories: ${country.regions.length} total, ${provincesAdded} added`);

    // ---- cities and localities
    let placesAdded = 0;
    for (const r of country.regions) {
      for (const c of r.cities || []) {
        const s = `${regionSlug(r.name)}/${slug(c.name)}`;
        const found = await db.query("select id from localities where slug = $1", [s]);
        if (found.rows[0]) continue;
        await db.query(
          `insert into localities (name, arabic_name, province_id, is_main_area, slug, description, is_active)
           values ($1,$2,$3,$4,$5,$6,true)`,
          [c.name, c.nameAr || null, provinceIds.get(r.slug), !c.locality, s, `Businesses and services in ${c.name}, ${r.name}.`],
        );
        placesAdded++;
      }
    }
    console.log(`Cities & localities: ${placesAdded} added`);

    // ---- categories
    const have = await db.query("select count(*)::int as n from categories");
    if (have.rows[0].n > 0) {
      console.log(`Categories: database already has ${have.rows[0].n}, skipped`);
    } else {
      const rows = parseCategoryTree();
      const ids = new Map<string, number>();
      await db.query("begin");
      try {
        for (const c of rows) {
          const lower = c.name.charAt(0).toLowerCase() + c.name.slice(1);
          const description = c.level === 1
            ? `${c.name} in Pakistan: find and compare businesses by city and area, with contact details and reviews on ${country.brand}.`
            : `Find ${lower} near you in Pakistan. Compare listings, contact details and reviews on ${country.brand}.`;
          const ins = await db.query(
            `insert into categories (name, slug, parent_id, description, is_active, level, sort_order, "order", business_count)
             values ($1,$2,$3,$4,true,$5,$6,$6,0) returning id`,
            [c.name, c.slug, c.parentSlug ? ids.get(c.parentSlug) : null, description, c.level, c.sortOrder],
          );
          ids.set(c.slug, ins.rows[0].id);
        }
        await db.query("commit");
      } catch (e) {
        await db.query("rollback").catch(() => {});
        throw e;
      }
      console.log(`Categories: ${rows.length} created`);
    }
    console.log(`Done. ${country.brand} reference data is ready.`);
  } finally {
    await db.end();
  }
}

main().catch((e) => {
  console.error("Seed failed:", e.message);
  process.exit(1);
});
