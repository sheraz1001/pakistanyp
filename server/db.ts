import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import { createRequire } from "module";
import * as schema from "@shared/schema";

// Configure Neon for WebSocket with better error handling
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;

// Add connection retry and error handling
neonConfig.fetchConnectionCache = true;
neonConfig.pipelineConnect = false;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// DATABASE_DRIVER=pg switches to plain node-postgres for a local PostgreSQL
// (development/testing only). Production uses the Neon serverless driver.
const usePlainPg = process.env.DATABASE_DRIVER === "pg";
const requireCjs = createRequire(import.meta.url);

function createPool(): Pool {
  if (usePlainPg) {
    const pg = requireCjs("pg");
    return new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 }) as unknown as Pool;
  }
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5, // Reduced connection pool size
    idleTimeoutMillis: 60000, // Increased idle timeout
    connectionTimeoutMillis: 10000, // Increased connection timeout
  });
}

export const pool = createPool();

// Add better error handling for pool connections
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

// Add connection event handlers
pool.on('connect', () => {
  console.log('Database pool connection established');
});

export const db = usePlainPg
  ? (requireCjs("drizzle-orm/node-postgres").drizzle({ client: pool, schema }) as ReturnType<typeof drizzle<typeof schema>>)
  : drizzle({ client: pool, schema });
