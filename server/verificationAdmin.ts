import { country } from "@shared/country";
/**
 * Verification queue for Super Admin:
 *  - owners upload licence / ID documents (stored in Postgres so they survive Autoscale restarts)
 *  - admins see real requests with their documents and live stats
 *  - View opens the file inline, Download sends it as an attachment
 *  - Approve / Reject require a super_admin session; the owner is emailed either way
 */
import type { Express, Request, Response, NextFunction } from "express";
import multer from "multer";
import { pool } from "./db";
import { isAdminRequest } from "./middleware/adminGuard";
import { simpleEmailService } from "./simpleEmailService";

const SITE = process.env.SITE_ORIGIN || country.origin;
const MAX_BYTES = 10 * 1024 * 1024;
const MIME_OK = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const DOC_TYPES = new Set(["trade_licence", "owner_id", "establishment_card", "other"]);

const q = async (text: string, params: any[] = []) => (await pool.query(text, params)).rows;
const one = async (text: string, params: any[] = []) => (await q(text, params))[0];
const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const int = (v: unknown) => { const n = Number(v); return Number.isInteger(n) && n > 0 ? n : undefined; };
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const sessionUser = (req: Request): { id: string; email?: string; role?: string } | undefined =>
  (req as any).session?.user || ((req as any).isAuthenticated?.() ? (req as any).user : undefined);
const docUrl = (id: number) => `/api/verification/documents/${id}`;

function requireLogin(req: Request, res: Response, next: NextFunction) {
  if (!sessionUser(req)) return res.status(401).json({ message: "Please log in to continue." });
  next();
}
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!isAdminRequest(req)) return res.status(403).json({ message: "Admin access required." });
  next();
}
function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const u = sessionUser(req);
  if (!u) return res.status(401).json({ message: "Please log in as super admin." });
  if (u.role !== "super_admin") return res.status(403).json({ message: "Only a super admin can approve or reject verifications." });
  next();
}
async function ownsBusiness(req: Request, businessId: number) {
  if (isAdminRequest(req)) return true;
  const u = sessionUser(req);
  if (!u) return false;
  const b = await one("select owner_id from businesses where id = $1", [businessId]);
  return !!b && String(b.owner_id) === String(u.id);
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => (MIME_OK.has(file.mimetype) ? cb(null, true) : cb(new Error("Only PDF, JPG, PNG or WEBP files are allowed."))),
});

function card(title: string, body: string, cta?: { href: string; label: string }) {
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1f2937">
    <h2 style="color:#1e3a8a">${title}</h2>${body}
    ${cta ? `<p style="margin:24px 0"><a href="${cta.href}" style="background:#1e3a8a;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none">${cta.label}</a></p>` : ""}
    <p style="color:#6b7280;font-size:12px;margin-top:32px">Pakistan Yellow Pages · pakistanyp.com</p></div>`;
}

/** Email the requester's account and the business email used for verification (deduplicated). */
async function notifyOwner(v: any, subject: string, html: string) {
  const to = Array.from(new Set([v.requester_email, v.business_email].filter((e) => e && EMAIL_RE.test(e)).map((e: string) => e.toLowerCase())));
  let sent = 0;
  for (const addr of to) {
    try { if (await simpleEmailService.sendMail(addr, subject, html)) sent++; } catch (e) { console.error("[verification] email failed", addr, e); }
  }
  return { sent, to };
}

const REQUEST_SQL = `
  select v.id, v.business_id, v.user_id, v.licence_number, v.licence_authority, v.licence_expiry, v.licence_document_url,
         v.business_email, v.email_verified_at, v.phone, v.phone_verified_at, v.status, v.admin_notes, v.rejection_reason,
         v.processed_by, v.processed_at, v.review_started_at, v.created_at, v.updated_at,
         b.name as business_name, b.slug as business_slug, b.website, b.email as listed_email, b.phone as listed_phone, b.is_verified,
         u.email as requester_email, trim(coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')) as requester_name
  from verification_requests v
  join businesses b on b.id = v.business_id
  left join users u on u.id::text = v.user_id`;

const TAB_SQL: Record<string, string> = {
  pending: "v.status = 'pending'",
  under_review: "v.status = 'under_review'",
  completed: "v.status in ('approved', 'rejected')",
  all: "true",
};

async function withDocuments(rows: any[]) {
  if (!rows.length) return rows;
  const docs = await q(
    `select id, request_id, doc_type, file_name, mime_type, size_bytes, created_at from verification_documents where request_id = any($1::int[]) order by id`,
    [rows.map((r) => r.id)]);
  for (const r of rows) {
    r.documents = docs.filter((d: any) => d.request_id === r.id).map((d: any) => ({ ...d, url: docUrl(d.id), downloadUrl: `${docUrl(d.id)}?download=1` }));
    // older requests only have a pasted link (Google Drive etc.) – show it as an external document
    if (r.licence_document_url && !String(r.licence_document_url).startsWith("/api/verification/documents/")) {
      r.documents.push({ id: null, doc_type: "external_link", file_name: "Linked licence copy", mime_type: null, size_bytes: null, url: r.licence_document_url, downloadUrl: r.licence_document_url, external: true });
    }
  }
  return rows;
}

async function decide(id: number, action: "approve" | "reject", text: string, adminId: string) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const cur = (await client.query("select id, status from verification_requests where id = $1 for update", [id])).rows[0];
    if (!cur) { await client.query("rollback"); return { error: 404, message: "Verification request not found." }; }
    if (cur.status === (action === "approve" ? "approved" : "rejected")) { await client.query("rollback"); return { error: 409, message: `This request is already ${cur.status}.` }; }
    if (action === "approve") {
      const v = (await client.query(
        `update verification_requests set status = 'approved', admin_notes = $2, rejection_reason = null, processed_by = $3, processed_at = now(), updated_at = now(),
           phone_verified_at = coalesce(phone_verified_at, now()) where id = $1 returning business_id, user_id, licence_number`, [id, text || null, adminId])).rows[0];
      await client.query(
        `update businesses set is_verified = true, verified_at = now(), is_claimed = true, owner_id = coalesce(owner_id, $2),
           trade_license = coalesce(nullif(trade_license, ''), $3), updated_at = now() where id = $1`, [v.business_id, v.user_id, v.licence_number]);
    } else {
      await client.query(
        `update verification_requests set status = 'rejected', rejection_reason = $2, admin_notes = coalesce(admin_notes, $2), processed_by = $3, processed_at = now(), updated_at = now()
         where id = $1`, [id, text, adminId]);
    }
    await client.query("commit");
  } catch (e) {
    await client.query("rollback").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
  const v = await one(`${REQUEST_SQL} where v.id = $1`, [id]);
  const mail = action === "approve"
    ? await notifyOwner(v, `${v.business_name} is now verified on Pakistan Yellow Pages`, card("Your business is verified ✅",
        `<p>Hello${v.requester_name ? " " + esc(v.requester_name) : ""},</p><p><b>${esc(v.business_name)}</b> now carries the <b>Verified</b> badge on Pakistan Yellow Pages. Verified businesses rank higher in our Top lists and get more enquiries.</p>`,
        { href: `${SITE}/business/${v.business_slug}`, label: "View your listing" }))
    : await notifyOwner(v, `Verification of ${v.business_name} was not approved`, card("Verification not approved",
        `<p>Hello${v.requester_name ? " " + esc(v.requester_name) : ""},</p><p>We reviewed the verification request for <b>${esc(v.business_name)}</b> and could not approve it.</p>
         <p style="background:#fef2f2;border-left:4px solid #dc2626;padding:10px 12px"><b>Reason:</b> ${esc(text)}</p>
         <p>Please correct the details or upload clearer documents and submit again.</p>`,
        { href: `${SITE}/my-verification`, label: "Update my verification" }));
  return { ok: true, status: v.status, businessId: v.business_id, emailed: mail.sent, emailedTo: mail.to };
}

export function registerVerificationAdmin(app: Express) {
  // ---------- owner: upload / list documents ----------
  app.post("/api/businesses/:id/verification/documents", requireLogin, (req, res) => {
    upload.single("file")(req, res, async (err: any) => {
      if (err) return res.status(400).json({ message: err.code === "LIMIT_FILE_SIZE" ? "File is larger than 10 MB." : err.message || "Upload failed." });
      const id = int(req.params.id);
      if (!id || !(await ownsBusiness(req, id))) return res.status(403).json({ message: "Not your business." });
      const f = (req as any).file as Express.Multer.File | undefined;
      if (!f) return res.status(400).json({ message: "Choose a file to upload." });
      const v = await one("select id, licence_document_url from verification_requests where business_id = $1 and status in ('pending', 'under_review') order by id desc limit 1", [id]);
      if (!v) return res.status(404).json({ message: "Submit the verification form first, then upload your documents." });
      const n = await one("select count(*)::int as n from verification_documents where request_id = $1", [v.id]);
      if (n.n >= 6) return res.status(400).json({ message: "Up to 6 documents per request. Remove one first." });
      const docType = DOC_TYPES.has(str(req.body?.docType, 40)) ? str(req.body.docType, 40) : "trade_licence";
      const fileName = (f.originalname || "document").replace(/[^\w.\- ()]/g, "_").slice(0, 200);
      const doc = await one(
        `insert into verification_documents (request_id, business_id, user_id, doc_type, file_name, mime_type, size_bytes, data)
         values ($1, $2, $3, $4, $5, $6, $7, $8) returning id, doc_type, file_name, mime_type, size_bytes, created_at`,
        [v.id, id, String(sessionUser(req)!.id), docType, fileName, f.mimetype, f.size, f.buffer]);
      // keep the request's main document URL pointing at an uploaded licence
      if (docType === "trade_licence" || !v.licence_document_url) await q("update verification_requests set licence_document_url = $2, updated_at = now() where id = $1", [v.id, docUrl(doc.id)]);
      res.json({ ...doc, url: docUrl(doc.id), downloadUrl: `${docUrl(doc.id)}?download=1` });
    });
  });

  app.get("/api/businesses/:id/verification/documents", requireLogin, async (req, res) => {
    const id = int(req.params.id);
    if (!id || !(await ownsBusiness(req, id))) return res.status(403).json({ message: "Not your business." });
    const rows = await q(
      `select d.id, d.doc_type, d.file_name, d.mime_type, d.size_bytes, d.created_at from verification_documents d
       join verification_requests v on v.id = d.request_id where d.business_id = $1 and v.status in ('pending', 'under_review') order by d.id`, [id]);
    res.json(rows.map((d: any) => ({ ...d, url: docUrl(d.id) })));
  });

  app.delete("/api/businesses/:id/verification/documents/:docId", requireLogin, async (req, res) => {
    const id = int(req.params.id), docId = int(req.params.docId);
    if (!id || !docId || !(await ownsBusiness(req, id))) return res.status(403).json({ message: "Not your business." });
    const d = await one(
      `delete from verification_documents d using verification_requests v where d.id = $1 and d.business_id = $2 and v.id = d.request_id and v.status = 'pending' returning d.id, d.request_id`, [docId, id]);
    if (!d) return res.status(404).json({ message: "Document not found or request already reviewed." });
    await q("update verification_requests set licence_document_url = null where id = $1 and licence_document_url = $2", [d.request_id, docUrl(docId)]);
    res.json({ ok: true });
  });

  // ---------- file: admins or the uploading owner only ----------
  app.get("/api/verification/documents/:docId", requireLogin, async (req, res) => {
    const docId = int(req.params.docId);
    if (!docId) return res.status(400).json({ message: "Bad id" });
    const meta = await one("select id, business_id, user_id, file_name, mime_type, size_bytes from verification_documents where id = $1", [docId]);
    if (!meta) return res.status(404).json({ message: "Document not found." });
    const u = sessionUser(req)!;
    if (!isAdminRequest(req) && String(meta.user_id) !== String(u.id) && !(await ownsBusiness(req, meta.business_id))) return res.status(403).json({ message: "Not allowed." });
    const row = await one("select data from verification_documents where id = $1", [docId]);
    const download = req.query.download === "1" || req.query.download === "true";
    const safe = meta.file_name.replace(/["\\\r\n]/g, "_");
    res.set({
      "Content-Type": meta.mime_type,
      "Content-Length": String(row.data.length),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(meta.file_name)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff", // only PDF/images are accepted, so nothing here can run as HTML
    });
    res.end(row.data);
  });

  // ---------- admin queue ----------
  app.get("/api/admin/verification/queue", requireAdmin, async (req, res) => {
    const tab = str(req.query.tab, 20) || "pending";
    const search = str(req.query.q, 100);
    const params: any[] = [];
    let extra = "";
    if (search) { params.push(`%${search}%`); extra = ` and (b.name ilike $1 or v.business_email ilike $1 or u.email ilike $1 or v.licence_number ilike $1)`; }
    const rows = await q(`${REQUEST_SQL} where ${TAB_SQL[tab] || TAB_SQL.pending}${extra} order by ${tab === "completed" ? "v.processed_at desc nulls last" : "v.created_at asc"} limit 200`, params);
    const stats = await one(`
      select count(*) filter (where status = 'pending')::int as pending,
             count(*) filter (where status = 'under_review')::int as under_review,
             count(*) filter (where status in ('approved', 'rejected'))::int as completed,
             count(*) filter (where status = 'approved' and processed_at >= date_trunc('month', now()))::int as verified_this_month,
             count(*) filter (where status = 'rejected' and processed_at >= date_trunc('month', now()))::int as rejected_this_month,
             round((extract(epoch from avg(processed_at - created_at) filter (where status in ('approved', 'rejected') and processed_at >= now() - interval '90 days')) / 3600)::numeric, 1) as avg_processing_hours
      from verification_requests`);
    const total = await one("select count(*)::int as n from businesses where is_verified = true");
    res.json({ items: await withDocuments(rows), stats: { ...stats, total_verified_businesses: total.n } });
  });

  const review = async (req: Request, res: Response) => {
    const id = int(req.params.id);
    if (!id) return res.status(400).json({ message: "Bad id" });
    const v = await one(`update verification_requests set status = 'under_review', review_started_at = coalesce(review_started_at, now()), processed_by = $2, updated_at = now()
                         where id = $1 and status = 'pending' returning id, status`, [id, String(sessionUser(req)?.id || "admin")]);
    if (!v) return res.status(409).json({ message: "Only pending requests can be moved to review." });
    res.json({ ok: true, status: v.status });
  };
  const approve = async (req: Request, res: Response) => {
    const id = int(req.params.id ?? req.body?.requestId);
    if (!id) return res.status(400).json({ message: "Bad id" });
    try {
      const r: any = await decide(id, "approve", str(req.body?.notes, 2000), String(sessionUser(req)!.id));
      if (r.error) return res.status(r.error).json({ message: r.message });
      res.json({ ...r, message: "Business verified." });
    } catch (e: any) { console.error("[verification] approve failed", e); res.status(500).json({ message: "Could not approve: " + (e?.message || "server error") }); }
  };
  const reject = async (req: Request, res: Response) => {
    const id = int(req.params.id);
    const reason = str(req.body?.reason, 2000);
    if (!id) return res.status(400).json({ message: "Bad id" });
    if (reason.length < 5) return res.status(400).json({ message: "Enter a rejection reason (at least 5 characters) – it is sent to the owner." });
    try {
      const r: any = await decide(id, "reject", reason, String(sessionUser(req)!.id));
      if (r.error) return res.status(r.error).json({ message: r.message });
      res.json({ ...r, message: "Verification rejected." });
    } catch (e: any) { console.error("[verification] reject failed", e); res.status(500).json({ message: "Could not reject: " + (e?.message || "server error") }); }
  };

  app.post("/api/admin/verification/:id/review", requireAdmin, review);
  app.post("/api/admin/verification/:id/approve", requireSuperAdmin, approve);
  app.post("/api/admin/verification/:id/reject", requireSuperAdmin, reject);
  // paths the old Super Admin component used
  app.post("/api/admin/verifications/:id/review", requireAdmin, review);
  app.post("/api/admin/verifications/:id/approve", requireSuperAdmin, approve);
  app.post("/api/admin/verifications/:id/reject", requireSuperAdmin, reject);
}
