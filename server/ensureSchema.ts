import fs from "fs";
import path from "path";
import { pool } from "./db";

/**
 * Applies idempotent schema fixes so every environment (Replit dev, Replit production,
 * Neon/Hostinger) has the tables and columns that the code expects. Runs in the background
 * after the HTTP server is listening (so deploy health checks are never blocked by the
 * database) and retries when a DDL statement cannot get its lock – on a busy production
 * database an ALTER TABLE has to wait for the previous instance's connections to finish.
 * Each one-off data fix is recorded in schema_fixes so it runs exactly once.
 */
// languages.sql first: the code selects its columns on every page, so it must never wait behind another script
const FILES = ["scripts/languages.sql", "scripts/create-missing-tables.sql", "scripts/add-missing-columns.sql", "scripts/phase1.sql", "scripts/phase2.sql", "scripts/approvals.sql", "scripts/verification-docs.sql", "scripts/updated-at-triggers.sql"];

const FIXES: Record<string, string> = {
  // Islamabad (3) and Multan (7) were switched off, so their 57 localities and listings were invisible
  "2026-10-29-activate-all-provinces": "update provinces set is_active = true, is_published = true where is_active = false or is_published = false",
  // Province > City > Locality: link each "<Locality>, <City>" row to its city in the same province
  "2026-11-02-locality-parent-city": `update localities l set parent_id = c.id
    from localities c
    where l.parent_id is null and coalesce(l.is_main_area, false) = false
      and c.is_main_area = true and c.province_id = l.province_id and c.id <> l.id
      and right(l.name, length(c.name) + 2) = ', ' || c.name`,
};

/** Last schema run, for /api/health/schema */
export const schemaStatus: { state: "pending" | "ok" | "failed"; attempts: number; lastError?: string; at?: string } = { state: "pending", attempts: 0 };

async function applyOnce(): Promise<void> {
  const root = path.resolve(import.meta.dirname, "..");
  const client = await pool.connect();
  try {
    // never wait forever for a table lock: fail fast and retry later instead of blocking startup
    await client.query("set lock_timeout = '15s'; set statement_timeout = '120s'");
    await client.query("create table if not exists schema_fixes (name text primary key, applied_at timestamptz default now())");
    // Each script is independent: one failing script must not stop the others (it is retried on the next attempt)
    const failed: string[] = [];
    for (const f of FILES) {
      const p = path.join(root, f);
      if (!fs.existsSync(p)) { console.warn(`[schema] ${f} not found, skipping`); continue; }
      try {
        await client.query(fs.readFileSync(p, "utf8"));
        console.log(`[schema] applied ${f}`);
      } catch (e: any) {
        await client.query("rollback").catch(() => undefined); // scripts use BEGIN/COMMIT: leave no open transaction
        console.error(`[schema] ${f} failed: ${e?.code || ""} ${e?.message || e}`);
        failed.push(f);
      }
    }
    if (failed.length) throw new Error(`scripts failed: ${failed.join(", ")}`);
    for (const [name, sql] of Object.entries(FIXES)) {
      const done = await client.query("select 1 from schema_fixes where name = $1", [name]);
      if (done.rowCount) continue;
      await client.query(sql);
      await client.query("insert into schema_fixes (name) values ($1)", [name]);
      console.log(`[schema] data fix applied: ${name}`);
    }
  } finally {
    client.release();
  }
}

export async function ensureSchema(): Promise<void> {
  const delays = [0, 10_000, 20_000, 30_000, 60_000, 60_000, 120_000, 120_000];
  for (let attempt = 0; attempt < delays.length; attempt++) {
    if (delays[attempt]) await new Promise((r) => setTimeout(r, delays[attempt]));
    try {
      schemaStatus.attempts = attempt + 1;
      await applyOnce();
      Object.assign(schemaStatus, { state: "ok", lastError: undefined, at: new Date().toISOString() });
      console.log("[schema] up to date");
      return;
    } catch (e: any) {
      Object.assign(schemaStatus, { state: "failed", lastError: String(e?.message || e).slice(0, 300), at: new Date().toISOString() });
      console.error(`[schema] attempt ${attempt + 1} failed (${e?.code || ""} ${e?.message || e}); ${attempt + 1 < delays.length ? "retrying" : "giving up"}`);
    }
  }
}


/** GET /api/health/schema: schema state and row counts (no secrets), to check a deployment from a browser. */
export function registerSchemaHealth(app: import("express").Express) {
  app.get("/api/health/schema", async (_req, res) => {
    const count = async (t: string) => { try { return Number((await pool.query(`select count(*)::int as n from ${t}`)).rows[0].n); } catch (e: any) { return `error: ${e?.message}`; } };
    const missing: string[] = [];
    try {
      const want: Record<string, string[]> = { users: ["preferred_language"], categories: ["description_ar"], businesses: ["description_ar"], provinces: ["description_ar"], localities: ["description_ar", "parent_id"] };
      for (const [t, cols] of Object.entries(want)) for (const c of cols) {
        const r = await pool.query("select 1 from information_schema.columns where table_name = $1 and column_name = $2", [t, c]);
        if (!r.rowCount) missing.push(`${t}.${c}`);
      }
    } catch (e: any) { missing.push(`check failed: ${e?.message}`); }
    res.set("Cache-Control", "no-store").json({
      schema: schemaStatus, missingColumns: missing,
      rows: { regions: await count("provinces"), localities: await count("localities"), categories: await count("categories"), businesses: await count("businesses") },
      node: process.version, uptimeSeconds: Math.round(process.uptime()),
    });
  });
}
