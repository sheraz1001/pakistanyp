/**
 * Start-up tasks. The schema check always runs (cheap). The catalog, guide and content syncs read and compare
 * thousands of rows (about 2 MB of database transfer), so they run only when this build is new: the hash of
 * the server bundle is stored and a plain restart of the same build skips them. FORCE_STARTUP_SYNC=1 forces them.
 */
import crypto from "crypto";
import fs from "fs";
import { fileURLToPath } from "url";
import { pool } from "./db";
import { ensureSchema } from "./ensureSchema";
import { syncCatalog } from "./catalogSync";
import { syncPlaceGuides } from "./placeGuides";
import { publishContent } from "./contentPublisher";
import { startExtensions } from "./extensions";
import { meterAs } from "./dbMetrics";
import { clearApiCache } from "./apiCache";

function buildHash(): string {
  try { return crypto.createHash("sha1").update(fs.readFileSync(fileURLToPath(import.meta.url))).digest("hex"); }
  catch { return `t${Date.now()}`; }
}

export async function runStartupTasks(): Promise<void> {
  await meterAs("startup", async () => {
    try {
      await ensureSchema();
      await pool.query("create table if not exists catalog_sync_state (key text primary key, value text not null)");
      const hash = buildHash();
      const prev = (await pool.query("select value from catalog_sync_state where key = 'startup_build'")).rows[0]?.value;
      if (prev === hash && process.env.FORCE_STARTUP_SYNC !== "1") {
        console.log("[startup] same build as last start: catalog, guide and content sync skipped");
      } else {
        await syncCatalog();
        await syncPlaceGuides();
        await publishContent();
        await pool.query(`insert into catalog_sync_state (key, value) values ('startup_build', $1)
          on conflict (key) do update set value = excluded.value`, [hash]);
      }
      await startExtensions();
    } catch (e: any) {
      console.error("[startup] failed:", e?.message || e);
    } finally {
      clearApiCache(); // data may have changed
    }
  });
}
