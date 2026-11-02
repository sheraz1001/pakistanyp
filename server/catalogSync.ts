import { pool } from "./db";
import { country } from "@shared/country";
import { parseCategoryTree } from "@shared/countries/categories";

/**
 * Keeps the database's reference data in step with the data files, on every start:
 *   shared/countries/places.ts      -> provinces, cities and localities (localities linked to their city)
 *   shared/countries/categories.ts  -> main categories, sub-categories and specialised categories
 *
 * Adds what is missing and fixes structure (parent, level, order). It never deletes a place,
 * never touches business data, and never removes a category that has businesses. Categories an
 * admin adds later are left alone: only categories that a previous sync wrote and that were later
 * removed from the file are cleaned up. On the very first sync of an older database, categories that
 * are not in the file and have no businesses are removed (they came from a previous country's tree).
 */

const placeSlug = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");
const regionPart = (name: string) => name.toLowerCase().trim().replace(/\s+/g, "-");

async function syncPlaces(): Promise<{ provinces: number; places: number; linked: number }> {
  let provincesAdded = 0, placesAdded = 0;
  const provinces = (await pool.query("select id, name from provinces")).rows as { id: number; name: string }[];
  const existing = new Map<string, { id: number; parent_id: number | null }>(
    (await pool.query("select id, slug, parent_id from localities")).rows.map((r: any) => [r.slug, { id: r.id, parent_id: r.parent_id }]),
  );
  for (const [i, r] of country.regions.entries()) {
    let province = provinces.find((p) => p.name.toLowerCase() === r.name.toLowerCase());
    if (!province) {
      const ins = await pool.query(
        `insert into provinces (name, arabic_name, code, is_capital, description, is_active, is_published, sort_order, meta_title, meta_description)
         values ($1,$2,$3,$4,$5,true,true,$6,$7,$8) returning id, name`,
        [r.name, r.nameAr || null, r.code || r.slug.toUpperCase().slice(0, 10), !!r.capital, `Businesses and services in ${r.name}, ${country.name}.`, i,
         `Businesses in ${r.name}, ${country.name} | ${country.brand}`, `Find companies and services in ${r.name}, ${country.name}: contact details, locations and reviews on ${country.brand}.`],
      );
      province = ins.rows[0];
      provinces.push(province!);
      provincesAdded++;
    }
    const cityIds = new Map<string, number>();
    const ordered = [...(r.cities || [])].sort((a, b) => Number(!!a.locality) - Number(!!b.locality));
    for (const c of ordered) {
      const slug = `${regionPart(r.name)}/${placeSlug(c.name)}`;
      const cityName = c.locality ? c.name.slice(c.name.lastIndexOf(", ") + 2) : null;
      const parentId = cityName ? cityIds.get(cityName) ?? null : null;
      const found = existing.get(slug);
      if (found) {
        if (!c.locality) cityIds.set(c.name, found.id);
        else if (parentId && !found.parent_id) await pool.query("update localities set parent_id = $2 where id = $1", [found.id, parentId]);
        continue;
      }
      const ins = await pool.query(
        `insert into localities (name, arabic_name, province_id, parent_id, is_main_area, slug, description, is_active)
         values ($1,$2,$3,$4,$5,$6,$7,true) returning id`,
        [c.name, c.nameAr || null, province!.id, parentId, !c.locality, slug, `Businesses and services in ${c.name}, ${r.name}.`],
      );
      existing.set(slug, { id: ins.rows[0].id, parent_id: parentId });
      if (!c.locality) cityIds.set(c.name, ins.rows[0].id);
      placesAdded++;
    }
  }
  // Link any localities still without a city ("<Locality>, <City>" in the same province)
  const linked = await pool.query(`update localities l set parent_id = c.id from localities c
    where l.parent_id is null and coalesce(l.is_main_area, false) = false and c.is_main_area = true and c.parent_id is null
      and c.province_id = l.province_id and c.id <> l.id and right(l.name, length(c.name) + 2) = ', ' || c.name`);
  return { provinces: provincesAdded, places: placesAdded, linked: linked.rowCount || 0 };
}

async function syncCategories(): Promise<{ added: number; updated: number; removed: number; hidden: number }> {
  const rows = parseCategoryTree();
  if (!rows.length) return { added: 0, updated: 0, removed: 0, hidden: 0 };
  await pool.query("create table if not exists catalog_sync_state (key text primary key, value text not null)");
  const prevRaw = (await pool.query("select value from catalog_sync_state where key = 'category_slugs'")).rows[0]?.value;
  const previous = new Set<string>(prevRaw ? JSON.parse(prevRaw) : []);
  const firstSync = !prevRaw;

  const existing = new Map<string, any>((await pool.query("select id, slug, parent_id, level, sort_order, is_active from categories")).rows.map((r: any) => [r.slug, r]));
  const ids = new Map<string, number>();
  let added = 0, updated = 0;
  for (const c of rows) {
    const parentId = c.parentSlug ? ids.get(c.parentSlug) ?? null : null;
    const row = existing.get(c.slug);
    if (row) {
      ids.set(c.slug, row.id);
      if (row.parent_id !== parentId || Number(row.level) !== c.level || Number(row.sort_order) !== c.sortOrder || row.is_active === false) {
        await pool.query(`update categories set parent_id = $2, level = $3, sort_order = $4, "order" = $4, is_active = true where id = $1`, [row.id, parentId, c.level, c.sortOrder]);
        updated++;
      }
      continue;
    }
    const lower = c.name.charAt(0).toLowerCase() + c.name.slice(1);
    const description = c.level === 1
      ? `${c.name} in ${country.name}: find and compare businesses by city and area, with contact details and reviews on ${country.brand}.`
      : `Find ${lower} near you in ${country.name}. Compare listings, contact details and reviews on ${country.brand}.`;
    const ins = await pool.query(
      `insert into categories (name, slug, parent_id, description, is_active, level, sort_order, "order", business_count)
       values ($1,$2,$3,$4,true,$5,$6,$6,0) returning id`,
      [c.name, c.slug, parentId, description, c.level, c.sortOrder],
    );
    ids.set(c.slug, ins.rows[0].id);
    added++;
  }

  // Categories no longer in the file: on the first sync every non-file category, later only ones a sync wrote before
  const inFile = new Set(rows.map((r) => r.slug));
  const candidates = [...existing.values()].filter((r) => !inFile.has(r.slug) && (firstSync || previous.has(r.slug)));
  let removed = 0, hidden = 0;
  // deepest first, so children go before their parents
  const depth = (r: any) => Number(r.level) || 1;
  for (const r of candidates.sort((a, b) => depth(b) - depth(a))) {
    const used = await pool.query(
      `select 1 from businesses where category_id = $1 or $1::text = any (coalesce(additional_category_ids, '{}')::text[])
       union all select 1 from categories where parent_id = $1 limit 1`, [r.id]).catch(() => ({ rows: [{}] }));
    if (!used.rows.length) {
      await pool.query("delete from categories where id = $1", [r.id]).then(() => removed++).catch(async () => {
        await pool.query("update categories set is_active = false where id = $1", [r.id]); hidden++;
      });
    }
  }
  await pool.query(`insert into catalog_sync_state (key, value) values ('category_slugs', $1)
                    on conflict (key) do update set value = excluded.value`, [JSON.stringify([...inFile])]);
  return { added, updated, removed, hidden };
}

export async function syncCatalog(): Promise<void> {
  try {
    const places = await syncPlaces();
    const cats = await syncCategories();
    if (places.provinces || places.places || places.linked || cats.added || cats.updated || cats.removed || cats.hidden) {
      console.log(`[catalog] places: +${places.provinces} provinces, +${places.places} cities/localities, ${places.linked} linked; ` +
        `categories: +${cats.added}, ${cats.updated} updated, ${cats.removed} removed, ${cats.hidden} hidden`);
    }
  } catch (error: any) {
    console.error("[catalog] sync failed:", error?.message || error);
  }
}
