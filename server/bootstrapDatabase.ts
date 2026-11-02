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
/** Returns true when it initialised an empty database. */
export async function bootstrapDatabase(): Promise<boolean> {
  if (process.env.SKIP_DB_BOOTSTRAP === "true") return false;
  const client = await pool.connect();
  try {
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
