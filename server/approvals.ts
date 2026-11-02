import { country } from "@shared/country";
/**
 * Business approval workflow for admins:
 *  - list pending / approved / rejected listings with category, location and owner contact
 *  - change a listing's category (and extra categories) before approving
 *  - approve or reject one or many listings at once
 *  - email the owner on approval / rejection (reason included)
 */
import type { Express, Request, Response, NextFunction } from "express";
import { pool } from "./db";
import { isAdminRequest } from "./middleware/adminGuard";
import { simpleEmailService } from "./simpleEmailService";

const SITE = process.env.SITE_ORIGIN || country.origin;
const q = async (text: string, params: any[] = []) => (await pool.query(text, params)).rows;
const one = async (text: string, params: any[] = []) => (await q(text, params))[0];
const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const int = (v: unknown) => { const n = Number(v); return Number.isInteger(n) && n > 0 ? n : undefined; };
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const sessionUser = (req: Request): { id: string; email?: string } | undefined => (req as any).session?.user || ((req as any).isAuthenticated?.() ? (req as any).user : undefined);

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!isAdminRequest(req)) return res.status(403).json({ message: "Admin access required." });
  next();
}

// pending  = not approved yet and still active
// rejected = explicitly rejected, or switched off without approval (older rejections)
// approved = admin_approved
const STATUS_SQL: Record<string, string> = {
  pending: "b.admin_approved is not true and coalesce(b.is_active, true) and coalesce(b.status, '') <> 'rejected'",
  rejected: "b.admin_approved is not true and (coalesce(b.status, '') = 'rejected' or b.is_active = false)",
  approved: "b.admin_approved = true",
};

function card(title: string, body: string, cta?: { href: string; label: string }) {
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1f2937">
    <h2 style="color:#1e3a8a">${title}</h2>${body}
    ${cta ? `<p style="margin:24px 0"><a href="${cta.href}" style="background:#1e3a8a;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none">${cta.label}</a></p>` : ""}
    <p style="color:#6b7280;font-size:12px;margin-top:32px">Pakistan Yellow Pages · pakistanyp.com</p></div>`;
}

/** Owner email: the account that submitted the listing, otherwise the listing's own email. */
async function recipient(b: any): Promise<{ email: string; name: string } | null> {
  if (b.owner_email && EMAIL_RE.test(b.owner_email)) return { email: b.owner_email, name: b.owner_first_name || b.name };
  if (b.email && EMAIL_RE.test(b.email)) return { email: b.email, name: b.name };
  return null;
}

async function notify(b: any, action: "approve" | "reject", reason: string): Promise<{ emailed: boolean; to?: string }> {
  const r = await recipient(b);
  if (!r) return { emailed: false };
  const ok = action === "approve"
    ? await simpleEmailService.sendMail(r.email, `Your listing "${b.name}" is now live on Pakistan Yellow Pages`, card(
        "Your business is approved 🎉",
        `<p>Hello ${esc(r.name)},</p><p>Good news – <b>${esc(b.name)}</b> has been reviewed and is now published on Pakistan Yellow Pages${b.category_name ? ` under <b>${esc(b.category_name)}</b>` : ""}.</p>
         <p>Next steps to get more enquiries:</p><ul><li>Get the <b>Verified</b> badge (free) – licence, email and phone check</li><li>Add your prices, portfolio and FAQs</li><li>Reply quickly to quote requests</li></ul>`,
        { href: `${SITE}/business/${b.slug}`, label: "View your listing" }))
    : await simpleEmailService.sendMail(r.email, `Your listing "${b.name}" needs changes – Pakistan Yellow Pages`, card(
        "Your listing was not approved",
        `<p>Hello ${esc(r.name)},</p><p>We reviewed <b>${esc(b.name)}</b> and could not publish it yet.</p>
         ${reason ? `<p style="background:#fef2f2;border-left:4px solid #dc2626;padding:10px 12px"><b>Reason:</b> ${esc(reason)}</p>` : ""}
         <p>Please update the details and submit again, or reply to this email if you think this is a mistake.</p>`,
        { href: `${SITE}/dashboard`, label: "Update my listing" }));
  return { emailed: !!ok, to: r.email };
}

const SELECT = `
  select b.id, b.name, b.slug, b.description, b.short_description, b.email, b.phone, b.website, b.address, b.trade_license,
         b.category_id, b.additional_category_ids, b.created_at, b.updated_at, b.admin_approved, b.is_active, b.status, b.rejection_reason,
         b.approved_at, c.name as category_name, pc.id as parent_category_id, pc.name as parent_category_name,
         e.name as province_name, l.name as locality_name,
         u.email as owner_email, u.first_name as owner_first_name, u.last_name as owner_last_name
  from businesses b
  left join categories c on c.id = b.category_id
  left join categories pc on pc.id = c.parent_id
  left join provinces e on e.id = b.province_id
  left join localities l on l.id = b.locality_id
  left join users u on u.id::text = b.owner_id::text`;

export async function applyDecision(ids: number[], action: "approve" | "reject", reason: string, adminId: string, sendEmail: boolean) {
  const results: any[] = [];
  for (const id of ids) {
    const b = await one(`${SELECT} where b.id = $1`, [id]);
    if (!b) { results.push({ id, ok: false, error: "not found" }); continue; }
    if (action === "approve") {
      await q(`update businesses set admin_approved = true, is_active = true, status = 'active', rejection_reason = null,
                 approved_at = now(), approved_by = $2, updated_at = now() where id = $1`, [id, adminId]);
    } else {
      await q(`update businesses set admin_approved = false, is_active = false, status = 'rejected', rejection_reason = $2,
                 approved_at = null, approved_by = $3, updated_at = now() where id = $1`, [id, reason || null, adminId]);
    }
    let mail: { emailed: boolean; to?: string } = { emailed: false };
    if (sendEmail) {
      try { mail = await notify(b, action, reason); } catch (e) { console.error("[approvals] email failed", id, e); }
    }
    results.push({ id, name: b.name, ok: true, ...mail });
  }
  return results;
}

export function registerApprovalRoutes(app: Express) {
  app.get("/api/admin/approvals", requireAdmin, async (req, res) => {
    const status = (str(req.query.status, 20) || "pending") as keyof typeof STATUS_SQL;
    const where = STATUS_SQL[status] || STATUS_SQL.pending;
    const search = str(req.query.q, 100);
    const params: any[] = [];
    let extra = "";
    if (search) { params.push(`%${search}%`); extra = ` and (b.name ilike $1 or b.email ilike $1 or u.email ilike $1)`; }
    const items = await q(`${SELECT} where ${where}${extra} order by b.created_at desc nulls last limit 300`, params);
    const counts = await one(`select
        count(*) filter (where ${STATUS_SQL.pending.replace(/b\./g, "")})::int as pending,
        count(*) filter (where ${STATUS_SQL.approved.replace(/b\./g, "")})::int as approved,
        count(*) filter (where ${STATUS_SQL.rejected.replace(/b\./g, "")})::int as rejected
      from businesses`);
    res.json({ items, counts });
  });

  /** Categories as a two-level tree (main category → subcategories) for the category picker. */
  app.get("/api/admin/category-tree", requireAdmin, async (_req, res) => {
    const rows = await q("select id, name, parent_id from categories where coalesce(is_active, true) order by name");
    const parents = rows.filter((r: any) => !r.parent_id);
    res.json(parents.map((p: any) => ({ id: p.id, name: p.name, children: rows.filter((c: any) => c.parent_id === p.id).map((c: any) => ({ id: c.id, name: c.name })) })));
  });

  app.patch("/api/admin/businesses/:id/category", requireAdmin, async (req, res) => {
    const id = int(req.params.id), categoryId = int(req.body?.categoryId);
    if (!id || !categoryId) return res.status(400).json({ message: "categoryId is required" });
    const cat = await one("select id, name from categories where id = $1", [categoryId]);
    if (!cat) return res.status(404).json({ message: "Category not found" });
    const extraIds = Array.isArray(req.body?.additionalCategoryIds) ? req.body.additionalCategoryIds.map(int).filter(Boolean).slice(0, 5) : undefined;
    await q(`update businesses set category_id = $2 ${extraIds ? ", additional_category_ids = $3" : ""}, updated_at = now() where id = $1`,
      extraIds ? [id, categoryId, extraIds] : [id, categoryId]);
    res.json({ ok: true, categoryId, categoryName: cat.name });
  });

  // Older single-listing endpoints used by the existing admin screens. These are registered before the
  // originals in routes.ts (which had no admin check and sent no email), so they take over.
  const single = (action: "approve" | "reject") => async (req: Request, res: Response) => {
    const id = int(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    const [r] = await applyDecision([id], action, str(req.body?.reason, 1000), String(sessionUser(req)?.id || "admin"), req.body?.notify !== false);
    if (!r?.ok) return res.status(404).json({ message: "Business not found" });
    res.json({ message: `Business ${action === "approve" ? "approved" : "rejected"} successfully`, emailed: !!r.emailed, to: r.to });
  };
  app.post("/api/admin/businesses/:id/approve", requireAdmin, single("approve"));
  app.post("/api/admin/businesses/:id/reject", requireAdmin, single("reject"));
  app.patch("/api/admin/businesses/:id/approve", requireAdmin, (req, res, next) => {
    const s = str(req.body?.status, 20).toLowerCase();
    if (["approved", "active", "approve"].includes(s)) return single("approve")(req, res);
    if (["rejected", "reject"].includes(s)) return single("reject")(req, res);
    next();
  });

  app.post("/api/admin/approvals/bulk", requireAdmin, async (req, res) => {
    const ids: number[] = Array.isArray(req.body?.ids) ? Array.from(new Set(req.body.ids.map(int).filter(Boolean) as number[])).slice(0, 200) : [];
    const action = str(req.body?.action, 10);
    if (!ids.length || !["approve", "reject"].includes(action)) return res.status(400).json({ message: "ids and action (approve|reject) are required" });
    const reason = str(req.body?.reason, 1000);
    const sendEmail = req.body?.notify !== false;
    const results = await applyDecision(ids, action as any, reason, String(sessionUser(req)?.id || "admin"), sendEmail);
    res.json({
      action, total: results.length, updated: results.filter((r) => r.ok).length,
      emailed: results.filter((r) => r.emailed).length, noEmail: results.filter((r) => r.ok && !r.emailed).map((r) => r.name), results,
    });
  });
}
