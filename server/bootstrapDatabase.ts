import fs from "fs";
import path from "path";
import { pool } from "./db";

/**
 * First-start database setup for a brand-new deploy of this directory.
 *
 * If the database is EMPTY (no "provinces" table — the regions table), apply
 * server/sql/init.sql: the full schema plus reference data (provinces,
 * cities/localities, the category tree). No businesses, users or secrets.
 *
 * Runs once, in a single transaction, guarded by an advisory lock so two app
 * instances cannot both run it. On any non-empty database it does nothing.
 * Set SKIP_DB_BOOTSTRAP=true to disable it.
 */
/**
 * Databases created by the earlier multi-country codebase name the regions table "emirates"
 * (and columns such as emirate_id). Rename every such table, column, sequence, index and
 * constraint to the "province" names this code uses, in one transaction. Data is untouched.
 * Runs only when "emirates" exists and "provinces" does not.
 */
export const LEGACY_RENAME_SQL = `
DO $$
DECLARE r record;
BEGIN
  IF to_regclass('public.emirates') IS NULL OR to_regclass('public.provinces') IS NOT NULL THEN RETURN; END IF;
  FOR r IN SELECT table_name, column_name FROM information_schema.columns
           WHERE table_schema = 'public' AND column_name LIKE '%emirate%' LOOP
    EXECUTE format('ALTER TABLE %I RENAME COLUMN %I TO %I', r.table_name, r.column_name, replace(r.column_name, 'emirate', 'province'));
  END LOOP;
  FOR r IN SELECT con.conname, cl.relname FROM pg_constraint con
           JOIN pg_class cl ON cl.oid = con.conrelid JOIN pg_namespace n ON n.oid = cl.relnamespace
           WHERE n.nspname = 'public' AND con.conname LIKE '%emirate%' LOOP
    EXECUTE format('ALTER TABLE %I RENAME CONSTRAINT %I TO %I', r.relname, r.conname, replace(r.conname, 'emirate', 'province'));
  END LOOP;
  FOR r IN SELECT c.relname, c.relkind FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
           WHERE n.nspname = 'public' AND c.relname LIKE '%emirate%' AND c.relkind IN ('r', 'S', 'v', 'm', 'i')
           ORDER BY CASE c.relkind WHEN 'r' THEN 1 WHEN 'S' THEN 2 ELSE 3 END LOOP
    EXECUTE format('ALTER %s %I RENAME TO %I',
      CASE r.relkind WHEN 'r' THEN 'TABLE' WHEN 'S' THEN 'SEQUENCE' WHEN 'v' THEN 'VIEW' WHEN 'm' THEN 'MATERIALIZED VIEW' ELSE 'INDEX' END,
      r.relname, replace(r.relname, 'emirate', 'province'));
  END LOOP;
  RAISE NOTICE 'Renamed legacy emirate tables and columns to province';
END $$;`;

/** Returns true when it initialised an empty database. */
export async function bootstrapDatabase(): Promise<boolean> {
  if (process.env.SKIP_DB_BOOTSTRAP === "true") return false;
  const client = await pool.connect();
  try {
    // An existing database from the older codebase: rename its tables first, so it is not mistaken for an empty one
    const legacy = await client.query("select to_regclass('public.emirates') as e, to_regclass('public.provinces') as p");
    if (legacy.rows[0]?.e && !legacy.rows[0]?.p) {
      console.log("[bootstrap] Older database detected - renaming emirate tables/columns to province...");
      await client.query("begin");
      try {
        await client.query("select pg_advisory_xact_lock(727202)");
        await client.query(LEGACY_RENAME_SQL);
        await client.query("commit");
        console.log("[bootstrap] Rename done");
      } catch (e) {
        await client.query("rollback").catch(() => {});
        throw e;
      }
    }
    const exists = await client.query("select to_regclass('public.provinces') as t");
    if (exists.rows[0]?.t) return false; // already initialised

    const file = path.resolve(import.meta.dirname, "..", "server", "sql", "init.sql");
    if (!fs.existsSync(file)) {
      console.error(`[bootstrap] ${file} not found - cannot initialise the empty database`);
      return false;
    }
    const sql = fs.readFileSync(file, "utf8");
    console.log("[bootstrap] Empty database detected - creating tables and loading reference data...");
    const started = Date.now();
    await client.query("begin");
    try {
      await client.query("select pg_advisory_xact_lock(727201)");
      // another instance may have finished while we waited for the lock
      const again = await client.query("select to_regclass('public.provinces') as t");
      if (again.rows[0]?.t) {
        await client.query("rollback");
        return false;
      }
      await client.query("set local check_function_bodies = false");
      await client.query(sql);
      await client.query("commit");
    } catch (e) {
      await client.query("rollback").catch(() => {});
      throw e;
    }
    const counts = await client.query(
      "select (select count(*) from provinces)::int as regions, (select count(*) from localities)::int as localities, (select count(*) from categories)::int as categories",
    );
    console.log(`[bootstrap] Done in ${Date.now() - started}ms:`, counts.rows[0]);
    return true;
  } finally {
    client.release();
  }
}
