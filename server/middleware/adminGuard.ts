import type { Request, Response, NextFunction } from "express";

/**
 * Central access guard (added in the Oct 2026 audit).
 *
 * Many admin/debug routes in routes.ts were registered without any auth check
 * (e.g. GET /api/admin/users leaked every user's email; POST /api/fix-password
 * let anyone reset any account). Rather than patch 150+ handlers one by one,
 * this middleware runs before every route and enforces:
 *   1. /api/admin/** requires an admin-role session (a few public reads excepted)
 *   2. admin-only content/tooling endpoints outside /api/admin require admin
 *   3. debug/test/manual-account endpoints require admin
 */
const ADMIN_ROLES = new Set(["super_admin", "admin", "moderator", "content_manager", "business_manager"]);

// Admin endpoints that must stay reachable without a session
const PUBLIC_ADMIN_ANY_METHOD = [
  /^\/api\/admin\/(login|logout|forgot-password|reset-password|user)\/?$/,
];
// Admin endpoints read by public pages (header/footer menus, site settings)
const PUBLIC_ADMIN_GET = [
  /^\/api\/admin\/settings\/?$/,
  /^\/api\/admin\/menus(\/.*)?$/,
  /^\/api\/admin\/themes\/active\/?$/,
  /^\/api\/admin\/seo-settings\/?$/,
  /^\/api\/admin\/support\/stats\/?$/,
];
// Non-/api/admin endpoints that are admin-only (any method)
const ADMIN_ONLY_ANY = [
  /^\/oauth-debug/,
  /^\/debug(\/|$)/,
  /^\/api\/test-/,
  /^\/api\/fix-password/,
  /^\/api\/verify-user-manual/,
  /^\/api\/create-user-manual/,
  /^\/api\/categories\/test/,
  /^\/api\/travelpayouts\/test/,
  /^\/api\/cache\/clear/,
  /^\/api\/scraper\//,
  /^\/api\/upload\/blog-image/,
];
// Non-/api/admin endpoints that are admin-only for writes (GET stays public)
const ADMIN_ONLY_WRITES = [
  /^\/api\/categories(\/|$)/,
  /^\/api\/news\/?$/,
  /^\/api\/blog\/?$/,
  /^\/api\/seo\/(category|province|locality|bulk-categories)/,
  /^\/api\/ai\/(generate-meta|analyze-seo)/,
];

function sessionRole(req: any): string | undefined {
  return req.session?.user?.role ?? (typeof req.isAuthenticated === "function" && req.isAuthenticated() ? req.user?.role : undefined);
}

export function isAdminRequest(req: any): boolean {
  const role = sessionRole(req);
  return !!role && ADMIN_ROLES.has(role);
}

export function adminGuard(req: Request, res: Response, next: NextFunction) {
  const p = req.path;
  const m = req.method.toUpperCase();
  const isRead = m === "GET" || m === "HEAD" || m === "OPTIONS";

  let needsAdmin = false;
  if (p.startsWith("/api/admin")) {
    const isPublic =
      PUBLIC_ADMIN_ANY_METHOD.some((r) => r.test(p)) ||
      (isRead && PUBLIC_ADMIN_GET.some((r) => r.test(p)));
    needsAdmin = !isPublic;
  } else if (ADMIN_ONLY_ANY.some((r) => r.test(p))) {
    needsAdmin = true;
  } else if (!isRead && ADMIN_ONLY_WRITES.some((r) => r.test(p))) {
    needsAdmin = true;
  }

  if (!needsAdmin || isAdminRequest(req)) return next();
  const loggedIn = !!(req as any).session?.user;
  return res.status(loggedIn ? 403 : 401).json({ message: loggedIn ? "Forbidden" : "Unauthorized" });
}
