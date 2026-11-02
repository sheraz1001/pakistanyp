import fs from "fs";
import path from "path";
import crypto from "crypto";
import { pool } from "./db";
import { regionSlug } from "@shared/country";

/**
 * Province and city guides.
 *
 * Source: content/places/provinces/<province-slug>.md and content/places/cities/<city-slug>.md
 * (front matter: metaTitle, metaDescription, summary; body: Markdown guide).
 *
 * On start-up the guides are copied into the database:
 *   provinces.detailed_description / localities.detailed_description  <- body
 *   meta_title, meta_description, description (summary)                 <- front matter
 * A field is only written when it is empty or still holds the text a previous sync wrote,
 * so anything edited in the admin panel is never overwritten.
 */

interface Guide { slug: string; body: string; meta: Record<string, string> }

const ROOT = path.resolve(import.meta.dirname, "..", "content", "places");
const hash = (s: string | null | undefined) => crypto.createHash("sha1").update(String(s ?? "")).digest("hex");

function readGuides(kind: "provinces" | "cities"): Guide[] {
  const dir = path.join(ROOT, kind);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md")).map((file) => {
    const raw = fs.readFileSync(path.join(dir, file), "utf8").replace(/\r\n/g, "\n");
    const meta: Record<string, string> = {};
    let body = raw;
    const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
    if (m) {
      for (const line of m[1].split("\n")) {
        const i = line.indexOf(":");
        if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
      }
      body = raw.slice(m[0].length);
    }
    return { slug: file.replace(/\.md$/, ""), body: body.trim(), meta };
  });
}

/** Write `value` to table.column for the row, unless someone has edited it since the last sync. */
async function syncField(table: "provinces" | "localities", id: number, column: string, current: string | null, value: string | undefined, state: Map<string, string>) {
  if (!value) return false;
  const key = `${table}:${id}:${column}`;
  // Empty, still the text we wrote last time, or the seed default ("Businesses and services in X, Y.")
  const untouched = !current || !String(current).trim() || state.get(key) === hash(current)
    || (column === "description" && /^Businesses and services in [^.]+\.$/.test(String(current).trim()));
  if (!untouched || current === value) {
    if (current === value) await pool.query("insert into place_guide_sync (key, hash) values ($1, $2) on conflict (key) do update set hash = excluded.hash", [key, hash(value)]);
    return false;
  }
  await pool.query(`update ${table} set ${column} = $2 where id = $1`, [id, value]);
  await pool.query("insert into place_guide_sync (key, hash) values ($1, $2) on conflict (key) do update set hash = excluded.hash", [key, hash(value)]);
  return true;
}

export async function syncPlaceGuides(): Promise<void> {
  try {
    const provinceGuides = readGuides("provinces");
    const cityGuides = readGuides("cities");
    if (!provinceGuides.length && !cityGuides.length) return;
    await pool.query("create table if not exists place_guide_sync (key text primary key, hash text not null)");
    const state = new Map<string, string>((await pool.query("select key, hash from place_guide_sync")).rows.map((r: any) => [r.key, r.hash]));
    let written = 0;

    const provinces = (await pool.query("select id, name, detailed_description, meta_title, meta_description, description from provinces")).rows;
    for (const g of provinceGuides) {
      const row = provinces.find((p: any) => regionSlug(p.name) === g.slug);
      if (!row) { console.warn(`[guides] no province for ${g.slug}.md`); continue; }
      for (const [col, val] of [["detailed_description", g.body], ["meta_title", g.meta.metaTitle], ["meta_description", g.meta.metaDescription], ["description", g.meta.summary]] as const) {
        if (await syncField("provinces", row.id, col, row[col], val, state)) written++;
      }
    }

    for (const g of cityGuides) {
      const { rows } = await pool.query(
        `select id, detailed_description, meta_title, meta_description, description from localities
         where is_main_area = true and parent_id is null and split_part(slug, '/', 2) = $1 order by id limit 1`, [g.slug]);
      const row = rows[0];
      if (!row) { console.warn(`[guides] no city for ${g.slug}.md`); continue; }
      for (const [col, val] of [["detailed_description", g.body], ["meta_title", g.meta.metaTitle], ["meta_description", g.meta.metaDescription], ["description", g.meta.summary]] as const) {
        if (await syncField("localities", row.id, col, row[col], val, state)) written++;
      }
    }
    console.log(`[guides] ${provinceGuides.length} province and ${cityGuides.length} city guides checked, ${written} field(s) updated`);
  } catch (error: any) {
    console.error("[guides] sync failed:", error?.message || error);
  }
}
