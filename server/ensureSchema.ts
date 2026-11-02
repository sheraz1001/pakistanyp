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
const FILES = ["scripts/create-missing-tables.sql", "scripts/add-missing-columns.sql", "scripts/phase1.sql", "scripts/phase2.sql", "scripts/approvals.sql", "scripts/verification-docs.sql"];

const FIXES: Record<string, string> = {
  // Islamabad (3) and Multan (7) were switched off, so their 57 localities and listings were invisible
  "2026-10-29-activate-all-provinces": "update provinces set is_active = true, is_published = true where is_active = false or is_published = false",
};

async function applyOnce(): Promise<void> {
  const root = path.resolve(import.meta.dirname, "..");
  const client = await pool.connect();
  try {
    // never wait forever for a table lock: fail fast and retry later instead of blocking startup
    await client.query("set lock_timeout = '15s'; set statement_timeout = '120s'");
    await client.query("create table if not exists schema_fixes (name text primary key, applied_at timestamptz default now())");
    for (const f of FILES) {
      const p = path.join(root, f);
      if (!fs.existsSync(p)) { console.warn(`[schema] ${f} not found, skipping`); continue; }
      await client.query(fs.readFileSync(p, "utf8"));
      console.log(`[schema] applied ${f}`);
    }
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
      await applyOnce();
      console.log("[schema] up to date");
      return;
    } catch (e: any) {
      console.error(`[schema] attempt ${attempt + 1} failed (${e?.code || ""} ${e?.message || e}); ${attempt + 1 < delays.length ? "retrying" : "giving up"}`);
    }
  }
}
