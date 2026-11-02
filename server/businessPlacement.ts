import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * Rules for where a business is listed:
 *  - category: a sub-category (level 2 or 3); a main (top-level) category can't be chosen on its own
 *  - location: province, city and locality are all required. A city that has localities needs one of
 *    its localities; a city without separate localities stands for itself.
 *
 * Returns an error message, or null when the placement is valid.
 * With `current` (an update), only fields that change are checked.
 */
export async function checkBusinessPlacement(
  input: { categoryId?: unknown; additionalCategoryIds?: unknown; provinceId?: unknown; localityId?: unknown },
  current?: { categoryId?: number | null; additionalCategoryIds?: unknown; provinceId?: number | null; localityId?: number | null } | null,
): Promise<string | null> {
  const toId = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number(v));
  const isUpdate = !!current;
  const changed = (key: "categoryId" | "provinceId" | "localityId") =>
    input[key] !== undefined && (!isUpdate || toId(input[key]) !== toId(current?.[key]));

  // ---- category
  const categoryIds: number[] = [];
  if (changed("categoryId") || (!isUpdate)) {
    const id = toId(input.categoryId);
    if (!id || !Number.isFinite(id)) return "Please choose a business category.";
    categoryIds.push(id);
  }
  if (Array.isArray(input.additionalCategoryIds)) {
    const before = new Set((Array.isArray(current?.additionalCategoryIds) ? current!.additionalCategoryIds as unknown[] : []).map(Number));
    for (const v of input.additionalCategoryIds) {
      const id = toId(v);
      if (id && Number.isFinite(id) && !before.has(id)) categoryIds.push(id);
    }
  }
  if (categoryIds.length) {
    const result: any = await db.execute(sql`select id, parent_id from categories where id in (${sql.join(categoryIds.map((id) => sql`${id}`), sql`, `)})`);
    const rows: Array<{ id: number; parent_id: number | null }> = result.rows ?? result;
    if (rows.length !== new Set(categoryIds).size) return "One of the selected categories doesn't exist.";
    if (rows.some((r) => r.parent_id === null)) {
      return "Please choose a sub-category. Main categories can't be selected on their own.";
    }
  }

  // ---- location
  if (changed("provinceId") || changed("localityId") || !isUpdate) {
    const provinceId = toId(input.provinceId ?? current?.provinceId);
    const localityId = toId(input.localityId ?? current?.localityId);
    if (!provinceId || !Number.isFinite(provinceId)) return "Please select a province.";
    if (!localityId || !Number.isFinite(localityId)) return "Please select a city and locality.";
    const result: any = await db.execute(sql`
      select l.id, l.name, l.province_id, l.parent_id, coalesce(l.is_main_area, false) as is_main_area,
             (select count(*)::int from localities c where c.parent_id = l.id) as children
      from localities l where l.id = ${localityId}`);
    const loc = (result.rows ?? result)[0];
    if (!loc) return "The selected locality doesn't exist.";
    if (Number(loc.province_id) !== provinceId) return "The selected locality is not in the selected province.";
    if (!loc.parent_id && loc.children > 0) return `Please select a locality in ${loc.name}.`;
    if (!loc.parent_id && !loc.is_main_area) return "Please select a city and locality.";
  }
  return null;
}
