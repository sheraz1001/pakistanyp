/**
 * Bring a database's provinces, cities, localities and categories in line with the data files
 * (shared/countries/places.ts and categories.ts). The app does this automatically on every start
 * (server/catalogSync.ts); this script runs the same sync by hand:
 *
 *   DATABASE_URL=<db> npx tsx scripts/seed.ts
 *
 * Safe to repeat. Never touches businesses. A brand-new empty database does not need it:
 * the app loads server/sql/init.sql on its first start.
 */
import { syncCatalog } from "../server/catalogSync";

syncCatalog().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
