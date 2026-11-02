// Approval workflow: every endpoint must refuse anonymous callers (the old approve/reject had no check).
import { test } from "node:test";
import assert from "node:assert/strict";

const BASE = (process.env.BASE_URL || "http://localhost:5000").replace(/\/$/, "");
const call = async (path, method = "GET", body) => (await fetch(BASE + path, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined })).status;

test("approval endpoints are admin-only", async () => {
  for (const [p, m, b] of [
    ["/api/admin/approvals?status=pending", "GET"],
    ["/api/admin/category-tree", "GET"],
    ["/api/admin/businesses/1/category", "PATCH", { categoryId: 1 }],
    ["/api/admin/approvals/bulk", "POST", { ids: [1], action: "approve" }],
    ["/api/admin/businesses/1/approve", "POST", {}],
    ["/api/admin/businesses/1/reject", "POST", {}],
    ["/api/admin/businesses/1/approve", "PATCH", { status: "approved" }],
  ]) assert.ok([401, 403].includes(await call(p, m, b)), `${m} ${p}`);
});

test("admin approvals page is served", async () => {
  const res = await fetch(BASE + "/admin/approvals");
  assert.equal(res.status, 200);
});
