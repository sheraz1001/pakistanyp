// Production entry for hosts that expect server.js (e.g. Hostinger Web Apps).
// Build first with: npm run build
// No top-level await here: Hostinger's LiteSpeed runner loads this file with require(),
// which fails on ESM modules that use top-level await (ERR_REQUIRE_ASYNC_MODULE).
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
import('./dist/index.js').catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
