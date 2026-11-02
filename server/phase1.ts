import { isValidPhone, PHONE_HELP } from "@shared/countries/locale";
import { country } from "@shared/country";
/**
 * Phase 1 features: business verification (licence + email + phone), structured reviews with
 * moderation, and quote requests (leads) with owner/admin dashboards.
 *
 * Everything here uses plain SQL through the shared pool so it does not depend on the Drizzle
 * schema; tables and columns are created by scripts/phase1.sql at startup (ensureSchema).
 */
import type { Express, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { pool } from "./db";
import { storage } from "./storage";
import { isAdminRequest } from "./middleware/adminGuard";
import { simpleEmailService } from "./simpleEmailService";
import { effectiveTier } from "./phase2";

const SITE = process.env.SITE_ORIGIN || country.origin;

// ---------- helpers ----------
const q = async (text: string, params: any[] = []) => (await pool.query(text, params)).rows;
const one = async (text: string, params: any[] = []) => (await q(text, params))[0];
const sessionUser = (req: Request): { id: string; email?: string; role?: string } | undefined =>
  (req as any).session?.user || ((req as any).isAuthenticated?.() ? (req as any).user : undefined);
const ipHash = (req: Request) =>
  crypto.createHash("sha256").update(String(req.headers["x-forwarded-for"] || req.ip || "")).digest("hex").slice(0, 32);
const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const int = (v: unknown) => { const n = Number(v); return Number.isInteger(n) && n > 0 ? n : undefined; };
const score = (v: unknown) => { const n = Number(v); return Number.isInteger(n) && n >= 1 && n <= 5 ? n : undefined; };
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const FREE_MAIL = /(gmail|yahoo|hotmail|outlook|live|icloud|proton|mail)\.(com|net|org|me|ae)$/i;
const domainOf = (s?: string | null) => {
  if (!s) return "";
  const m = String(s).toLowerCase().match(/@([^\s>]+)$/) || String(s).toLowerCase().match(/^(?:https?:\/\/)?(?:www\.)?([^/\s]+)/);
  return m ? m[1] : "";
};

function requireLogin(req: Request, res: Response, next: NextFunction) {
  if (!sessionUser(req)) return res.status(401).json({ message: "Please log in to continue." });
  next();
}
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!isAdminRequest(req)) return res.status(403).json({ message: "Admin access required." });
  next();
}
async function ownsBusiness(req: Request, businessId: number) {
  if (isAdminRequest(req)) return true;
  const u = sessionUser(req);
  if (!u) return false;
  const b = await one("select owner_id from businesses where id = $1", [businessId]);
  return !!b && String(b.owner_id) === String(u.id);
}
/** Simple per-ip, per-action throttle backed by the DB tables themselves. */
async function tooMany(table: string, hash: string, perDay: number, extraWhere = "", params: any[] = []) {
  const r = await one(`select count(*)::int as n from ${table} where ip_hash = $1 and created_at > now() - interval '1 day' ${extraWhere}`, [hash, ...params]);
  return r.n >= perDay;
}
async function sendMail(to: string, subject: string, html: string) {
  try {
    const svc: any = simpleEmailService;
    if (typeof svc.sendMail === "function") return await svc.sendMail(to, subject, html);
  } catch (e) { console.error("[phase1] mail failed", e); }
  return false;
}
async function notifyAdmin(subject: string, html: string) {
  try { await simpleEmailService.sendEmailToAdmin(subject, html); } catch (e) { console.error("[phase1] admin mail failed", e); }
}
async function refreshRating(businessId: number) {
  await q(`update businesses b set rating_average = s.avg, rating_count = s.n, rating = s.avg
           from (select coalesce(round(avg(rating)::numeric, 2), 0) as avg, count(*)::int as n
                 from business_reviews where business_id = $1 and status = 'approved' and coalesce(is_visible, true)) s
           where b.id = $1`, [businessId]);
}

export function registerPhase1Routes(app: Express) {
  // =====================================================================
  // 1. Verification: licence + business email + phone, approved by admin
  // =====================================================================

  /** Businesses owned by the logged-in user (for dashboards). */
  app.get("/api/my/businesses", requireLogin, async (req, res) => {
    const u = sessionUser(req)!;
    const rows = await q(
      `select b.id, b.name, b.slug, b.is_verified, b.is_claimed, b.is_premium, b.rating_average, b.rating_count, b.email, b.phone, b.trade_license,
              c.name as category_name, e.name as province_name,
              (select count(*)::int from lead_assignments la where la.business_id = b.id and la.status = 'new') as new_leads,
              (select status from verification_requests v where v.business_id = b.id order by id desc limit 1) as verification_status
       from businesses b
       left join categories c on c.id = b.category_id
       left join provinces e on e.id = b.province_id
       where b.owner_id = $1 order by b.name`, [String(u.id)]);
    res.json(rows);
  });

  app.get("/api/businesses/:id/verification", requireLogin, async (req, res) => {
    const id = int(req.params.id);
    if (!id || !(await ownsBusiness(req, id))) return res.status(403).json({ message: "Not your business." });
    const v = await one("select * from verification_requests where business_id = $1 order by id desc limit 1", [id]);
    if (v) { delete v.email_token; delete v.phone_otp; }
    res.json(v || null);
  });

  app.post("/api/businesses/:id/verification", requireLogin, async (req, res) => {
    const id = int(req.params.id);
    if (!id || !(await ownsBusiness(req, id))) return res.status(403).json({ message: "Not your business." });
    const u = sessionUser(req)!;
    const licenceNumber = str(req.body.licenceNumber, 100).toUpperCase();
    const licenceAuthority = str(req.body.licenceAuthority, 120);
    const licenceExpiry = str(req.body.licenceExpiry, 10) || null;
    const licenceDocumentUrl = str(req.body.licenceDocumentUrl, 500) || null;
    const businessEmail = str(req.body.businessEmail, 255).toLowerCase();
    const phone = str(req.body.phone, 40).replace(/[^\d+]/g, "");
    if (!/^[A-Z0-9\-\/ ]{4,40}$/.test(licenceNumber)) return res.status(400).json({ message: "Enter the trade licence number as printed on the licence (4–40 letters/digits)." });
    if (!licenceAuthority) return res.status(400).json({ message: "Select the licensing authority." });
    if (!EMAIL_RE.test(businessEmail)) return res.status(400).json({ message: "Enter a valid business email address." });
    if (FREE_MAIL.test(businessEmail)) return res.status(400).json({ message: "Use an email on your company domain (not Gmail/Hotmail/Yahoo) so we can verify the business." });
    if (!isValidPhone(phone)) return res.status(400).json({ message: PHONE_HELP });
    const emailToken = crypto.randomBytes(24).toString("hex");
    const existing = await one("select id, status from verification_requests where business_id = $1 order by id desc limit 1", [id]);
    let row;
    if (existing && existing.status === "pending") {
      row = await one(
        `update verification_requests set licence_number=$2, licence_authority=$3, licence_expiry=$4, licence_document_url=$5, business_email=$6,
           email_token=$7, email_verified_at=null, phone=$8, phone_verified_at=null, updated_at=now() where id=$1 returning id`,
        [existing.id, licenceNumber, licenceAuthority, licenceExpiry, licenceDocumentUrl, businessEmail, emailToken, phone]);
    } else {
      row = await one(
        `insert into verification_requests (business_id, user_id, licence_number, licence_authority, licence_expiry, licence_document_url, business_email, email_token, phone)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id`,
        [id, String(u.id), licenceNumber, licenceAuthority, licenceExpiry, licenceDocumentUrl, businessEmail, emailToken, phone]);
    }
    await q("update businesses set trade_license = coalesce(nullif(trade_license, ''), $2) where id = $1", [id, licenceNumber]);
    const biz = await storage.getBusinessById(id);
    const link = `${SITE}/api/verification/email/confirm?token=${emailToken}`;
    const sent = await sendMail(businessEmail, `Confirm ${biz?.name || "your business"} on Pakistan Yellow Pages`,
      `<p>Hello,</p><p>Someone asked to verify <b>${esc(biz?.name)}</b> on Pakistan Yellow Pages using this email address.</p>
       <p><a href="${link}" style="background:#1e3a8a;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Confirm this email</a></p>
       <p>If you did not request this, ignore this message.</p>`);
    await notifyAdmin(`Verification request: ${biz?.name}`,
      `<p><b>${esc(biz?.name)}</b> (#${id}) requested verification.</p><p>Licence ${esc(licenceNumber)} (${esc(licenceAuthority)}), email ${esc(businessEmail)}, phone ${esc(phone)}.</p><p><a href="${SITE}/admin/verifications">Open the verification queue</a></p>`);
    res.json({ id: row.id, status: "pending", emailSent: sent, message: sent ? "Check the business inbox to confirm the email, then our team will review the licence." : "Request saved. Our team will review the licence and contact you on the business email." });
  });

  app.get("/api/verification/email/confirm", async (req, res) => {
    const token = str(req.query.token, 64);
    const row = token ? await one("update verification_requests set email_verified_at = now(), updated_at = now() where email_token = $1 and email_verified_at is null returning business_id", [token]) : null;
    res.redirect(row ? "/my-verification?email=confirmed" : "/my-verification?email=invalid");
  });

  app.post("/api/businesses/:id/verification/phone/send", requireLogin, async (req, res) => {
    const id = int(req.params.id);
    if (!id || !(await ownsBusiness(req, id))) return res.status(403).json({ message: "Not your business." });
    const v = await one("select id, phone from verification_requests where business_id = $1 and status = 'pending' order by id desc limit 1", [id]);
    if (!v) return res.status(404).json({ message: "Submit the verification form first." });
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    await q("update verification_requests set phone_otp = $2, phone_otp_expires = now() + interval '15 minutes' where id = $1", [v.id, otp]);
    const sid = process.env.TWILIO_ACCOUNT_SID, tok = process.env.TWILIO_AUTH_TOKEN, from = process.env.TWILIO_FROM;
    if (sid && tok && from) {
      try {
        const to = v.phone.startsWith("+") ? v.phone : "+92" + v.phone.replace(/^0/, "");
        const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
          method: "POST",
          headers: { Authorization: "Basic " + Buffer.from(`${sid}:${tok}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ To: to, From: from, Body: `Your Pakistan Yellow Pages verification code is ${otp}` }),
        });
        return res.json({ sent: r.ok, channel: "sms" });
      } catch (e) { console.error("[phase1] sms failed", e); }
    }
    console.log(`[phase1] SMS not configured; OTP for verification #${v.id} is ${otp}`);
    res.json({ sent: false, channel: "none", message: "SMS is not enabled yet – our team will confirm the number by phone during review." });
  });

  app.post("/api/businesses/:id/verification/phone/confirm", requireLogin, async (req, res) => {
    const id = int(req.params.id);
    if (!id || !(await ownsBusiness(req, id))) return res.status(403).json({ message: "Not your business." });
    const code = str(req.body.code, 10);
    const row = await one("update verification_requests set phone_verified_at = now(), phone_otp = null where business_id = $1 and status = 'pending' and phone_otp = $2 and phone_otp_expires > now() returning id", [id, code]);
    if (!row) return res.status(400).json({ message: "Wrong or expired code." });
    res.json({ ok: true });
  });

  app.get("/api/admin/verifications", requireAdmin, async (req, res) => {
    const status = str(req.query.status, 20) || "pending";
    const rows = await q(
      `select v.*, b.name as business_name, b.slug as business_slug, b.website, b.email as listed_email, b.phone as listed_phone, u.email as requester_email
       from verification_requests v join businesses b on b.id = v.business_id left join users u on u.id::text = v.user_id
       where ($1 = 'all' or v.status = $1) order by v.created_at desc limit 200`, [status]);
    rows.forEach((r: any) => { delete r.email_token; delete r.phone_otp; r.email_domain_matches = domainOf(r.business_email) && (domainOf(r.business_email) === domainOf(r.website) || domainOf(r.business_email) === domainOf(r.listed_email)); });
    const counts = await one("select count(*) filter (where status='pending')::int as pending, count(*) filter (where status='approved')::int as approved, count(*) filter (where status='rejected')::int as rejected from verification_requests");
    res.json({ items: rows, counts });
  });

  app.patch("/api/admin/verifications/:id", requireAdmin, async (req, res) => {
    const id = int(req.params.id);
    const action = str(req.body.action, 10);
    const notes = str(req.body.notes, 1000);
    if (!id || !["approve", "reject"].includes(action)) return res.status(400).json({ message: "action must be approve or reject" });
    const admin = sessionUser(req);
    const v = await one(`update verification_requests set status = $2, admin_notes = $3, rejection_reason = case when $2 = 'rejected' then $3 end, processed_by = $4, processed_at = now(), updated_at = now(), phone_verified_at = coalesce(phone_verified_at, case when $2 = 'approved' then now() end)
                         where id = $1 returning *`, [id, action === "approve" ? "approved" : "rejected", notes, String(admin?.id || "admin")]);
    if (!v) return res.status(404).json({ message: "Not found" });
    if (action === "approve") {
      await q("update businesses set is_verified = true, verified_at = now(), is_claimed = true, owner_id = coalesce(owner_id, $2), trade_license = coalesce(nullif(trade_license,''), $3), updated_at = now() where id = $1", [v.business_id, v.user_id, v.licence_number]);
    }
    const biz = await storage.getBusinessById(v.business_id);
    if (v.business_email) {
      await sendMail(v.business_email, action === "approve" ? `${biz?.name} is now verified on Pakistan Yellow Pages` : `Verification of ${biz?.name} needs attention`,
        action === "approve"
          ? `<p>Good news – <b>${esc(biz?.name)}</b> now carries the Verified badge on <a href="${SITE}/business/${biz?.slug}">its PakistanYP profile</a>.</p>`
          : `<p>We could not verify <b>${esc(biz?.name)}</b> yet.</p><p>${esc(notes || "Please check the licence details and submit again.")}</p><p><a href="${SITE}/my-verification">Update your request</a></p>`);
    }
    res.json({ ok: true, status: v.status });
  });

  // =====================================================================
  // 2. Structured reviews (Clutch-style) with moderation and owner replies
  // =====================================================================

  app.get("/api/businesses/:id/structured-reviews", async (req, res) => {
    const id = int(req.params.id);
    if (!id) return res.status(400).json({ message: "bad id" });
    const items = await q(
      `select id, rating, title, content, project_type, budget_band, duration, score_quality, score_cost, score_schedule, score_refer,
              reviewer_name, reviewer_company, reviewer_role, is_verified, response, responded_at, created_at
       from business_reviews where business_id = $1 and status = 'approved' and coalesce(is_visible, true) order by created_at desc limit 50`, [id]);
    const agg = await one(
      `select count(*)::int as count, round(avg(rating)::numeric, 1) as overall, round(avg(score_quality)::numeric, 1) as quality,
              round(avg(score_cost)::numeric, 1) as cost, round(avg(score_schedule)::numeric, 1) as schedule, round(avg(score_refer)::numeric, 1) as refer,
              count(*) filter (where is_verified)::int as verified
       from business_reviews where business_id = $1 and status = 'approved' and coalesce(is_visible, true)`, [id]);
    const budgets = await q(`select budget_band, count(*)::int as n from business_reviews where business_id = $1 and status = 'approved' and budget_band is not null group by 1 order by 2 desc`, [id]);
    res.json({ items, summary: { ...agg, budgets } });
  });

  app.post("/api/businesses/:id/structured-reviews", async (req, res) => {
    const id = int(req.params.id);
    if (!id) return res.status(400).json({ message: "bad id" });
    const biz = await storage.getBusinessById(id);
    if (!biz) return res.status(404).json({ message: "Business not found" });
    const b = req.body || {};
    const scores = { score_quality: score(b.quality), score_cost: score(b.cost), score_schedule: score(b.schedule), score_refer: score(b.refer) };
    if (Object.values(scores).some((s) => !s)) return res.status(400).json({ message: "Rate quality, cost, schedule and willingness to refer from 1 to 5." });
    const content = str(b.content, 4000), title = str(b.title, 160), reviewerName = str(b.reviewerName, 120), reviewerEmail = str(b.reviewerEmail, 255).toLowerCase();
    if (content.length < 80) return res.status(400).json({ message: "Please write at least 80 characters about the work that was done." });
    if (!reviewerName) return res.status(400).json({ message: "Your name is required." });
    if (!EMAIL_RE.test(reviewerEmail)) return res.status(400).json({ message: "A valid email is required (it is never shown publicly)." });
    const hash = ipHash(req);
    if (await tooMany("business_reviews", hash, 3, "and business_id = $2", [id])) return res.status(429).json({ message: "Too many reviews from this connection today." });
    const flags: string[] = [];
    const rd = domainOf(reviewerEmail);
    if (rd && !FREE_MAIL.test(reviewerEmail) && (rd === domainOf(biz.website) || rd === domainOf(biz.email))) flags.push("reviewer email on the business's own domain");
    const prev = await one("select count(*)::int as n from business_reviews where business_id = $1 and ip_hash = $2 and created_at > now() - interval '30 days'", [id, hash]);
    if (prev.n > 0) flags.push("same connection reviewed this business in the last 30 days");
    const burst = await one("select count(*)::int as n from business_reviews where business_id = $1 and created_at > now() - interval '1 day'", [id]);
    if (burst.n >= 3) flags.push("burst: 3+ reviews for this business in 24h");
    const avg = Math.round((scores.score_quality! + scores.score_cost! + scores.score_schedule! + scores.score_refer!) / 4);
    const u = sessionUser(req);
    const row = await one(
      `insert into business_reviews (business_id, user_id, rating, title, content, is_verified, is_visible, status, project_type, budget_band, duration,
         score_quality, score_cost, score_schedule, score_refer, reviewer_name, reviewer_company, reviewer_role, reviewer_email, reviewer_linkedin, ip_hash, fraud_flags)
       values ($1,$2,$3,$4,$5,false,false,'pending',$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) returning id`,
      [id, u ? String(u.id) : null, avg, title || null, content, str(b.projectType, 120) || null, str(b.budgetBand, 40) || null, str(b.duration, 40) || null,
       scores.score_quality, scores.score_cost, scores.score_schedule, scores.score_refer, reviewerName, str(b.reviewerCompany, 160) || null, str(b.reviewerRole, 120) || null,
       reviewerEmail, str(b.reviewerLinkedin, 255) || null, hash, JSON.stringify(flags)]);
    await notifyAdmin(`New review for ${biz.name} (pending)`,
      `<p><b>${esc(reviewerName)}</b> (${esc(b.reviewerCompany || "")}) rated <b>${esc(biz.name)}</b> ${avg}/5.</p><p>${esc(content).slice(0, 600)}</p>${flags.length ? `<p style="color:#b91c1c">Flags: ${esc(flags.join("; "))}</p>` : ""}<p><a href="${SITE}/admin/reviews">Moderate</a></p>`);
    res.status(201).json({ id: row.id, status: "pending", message: "Thank you. Your review will appear after our team checks it (usually within 2 working days)." });
  });

  /** Legacy star-only form (older pages/apps): stored as a pending structured review so moderation still applies. */
  app.post("/api/businesses/:id/reviews", async (req, res) => {
    const id = int(req.params.id);
    const u = sessionUser(req);
    if (!id) return res.status(400).json({ message: "bad id" });
    if (!u) return res.status(401).json({ message: "Please log in to write a review." });
    const rating = score(req.body?.rating);
    const content = str(req.body?.content, 4000);
    if (!rating || content.length < 20) return res.status(400).json({ message: "Give a rating and at least 20 characters." });
    const hash = ipHash(req);
    if (await tooMany("business_reviews", hash, 3, "and business_id = $2", [id])) return res.status(429).json({ message: "Too many reviews from this connection today." });
    const row = await one(
      `insert into business_reviews (business_id, user_id, rating, title, content, is_verified, is_visible, status, score_quality, score_cost, score_schedule, score_refer, reviewer_name, reviewer_email, ip_hash, fraud_flags)
       values ($1,$2,$3,$4,$5,false,false,'pending',$3,$3,$3,$3,$6,$7,$8,'[]') returning id`,
      [id, String(u.id), rating, str(req.body?.title, 160) || null, content, str((u as any).firstName || (u as any).name || u.email || "Member", 120), u.email || null, hash]);
    res.status(201).json({ id: row.id, status: "pending", message: "Thanks – your review will appear once our team has checked it." });
  });

  app.post("/api/reviews/:id/reply", requireLogin, async (req, res) => {
    const id = int(req.params.id);
    const r = id ? await one("select business_id from business_reviews where id = $1", [id]) : null;
    if (!r || !(await ownsBusiness(req, r.business_id))) return res.status(403).json({ message: "Only the business owner can reply." });
    const text = str(req.body.response, 2000);
    if (text.length < 5) return res.status(400).json({ message: "Reply is too short." });
    await q("update business_reviews set response = $2, responded_at = now(), updated_at = now() where id = $1", [id, text]);
    res.json({ ok: true });
  });

  app.get("/api/admin/reviews", requireAdmin, async (req, res) => {
    const status = str(req.query.status, 20) || "pending";
    const rows = await q(
      `select r.*, b.name as business_name, b.slug as business_slug from business_reviews r join businesses b on b.id = r.business_id
       where ($1 = 'all' or r.status = $1) order by r.created_at desc limit 200`, [status]);
    const counts = await one("select count(*) filter (where status='pending')::int as pending, count(*) filter (where status='approved')::int as approved, count(*) filter (where status='rejected')::int as rejected from business_reviews");
    res.json({ items: rows, counts });
  });

  app.patch("/api/admin/reviews/:id", requireAdmin, async (req, res) => {
    const id = int(req.params.id);
    const action = str(req.body.action, 10);
    if (!id || !["approve", "reject", "verify"].includes(action)) return res.status(400).json({ message: "action must be approve, reject or verify" });
    const admin = sessionUser(req);
    const row = action === "verify"
      ? await one("update business_reviews set is_verified = true, updated_at = now() where id = $1 returning business_id", [id])
      : await one("update business_reviews set status = $2, is_visible = $3, moderated_by = $4, moderated_at = now(), updated_at = now() where id = $1 returning business_id",
          [id, action === "approve" ? "approved" : "rejected", action === "approve", String(admin?.id || "admin")]);
    if (!row) return res.status(404).json({ message: "Not found" });
    await refreshRating(row.business_id);
    res.json({ ok: true });
  });

  // =====================================================================
  // 3. Quote requests → leads → owner & admin dashboards
  // =====================================================================

  app.post("/api/leads", async (req, res) => {
    const b = req.body || {};
    const name = str(b.name, 120), email = str(b.email, 255).toLowerCase(), phone = str(b.phone, 40), message = str(b.message, 3000);
    if (!name || !EMAIL_RE.test(email)) return res.status(400).json({ message: "Name and a valid email are required." });
    if (message.length < 20) return res.status(400).json({ message: "Describe what you need in a few sentences (20+ characters)." });
    const hash = ipHash(req);
    if (await tooMany("leads", hash, 5)) return res.status(429).json({ message: "Too many requests from this connection today." });
    const businessId = int(b.businessId), categoryId = int(b.categoryId), provinceId = int(b.provinceId);
    let targets: any[] = [];
    if (businessId) {
      const biz = await one("select id, name, email, owner_id, tier, tier_expires_at from businesses where id = $1 and is_active", [businessId]);
      if (!biz) return res.status(404).json({ message: "Business not found" });
      targets = [biz];
    } else if (categoryId) {
      targets = await q(
        `select id, name, email, owner_id, tier, tier_expires_at from businesses
         where is_active and (category_id = $1 or additional_category_ids::text like '%' || $1::text || '%') and ($2::int is null or province_id = $2)
         order by is_premium desc nulls last, is_verified desc nulls last, is_claimed desc nulls last, rating_average desc nulls last, view_count desc nulls last limit 5`,
        [categoryId, provinceId || null]);
      if (!targets.length) return res.status(404).json({ message: "No businesses in this category and province yet. Try another province." });
    } else return res.status(400).json({ message: "businessId or categoryId is required" });
    const lead = await one(
      `insert into leads (business_id, category_id, province_id, name, email, phone, company, service_needed, budget_band, timeline, message, source, ip_hash)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) returning id`,
      [businessId || null, categoryId || null, provinceId || null, name, email, phone || null, str(b.company, 160) || null, str(b.serviceNeeded, 200) || null,
       str(b.budgetBand, 40) || null, str(b.timeline, 40) || null, message, str(b.source, 40) || (businessId ? "profile" : "category"), hash]);
    for (const t of targets) {
      await q("insert into lead_assignments (lead_id, business_id) values ($1, $2) on conflict do nothing", [lead.id, t.id]);
      if (t.email && EMAIL_RE.test(t.email)) {
        const locked = !businessId && effectiveTier(t) === "free";
        await sendMail(t.email, `New quote request on Pakistan Yellow Pages: ${str(b.serviceNeeded, 80) || name}`,
          `<p>Hello ${esc(t.name)},</p><p>A customer asked for a quote ${businessId ? "through your PakistanYP listing" : "in your category on PakistanYP"}.</p>
           ${locked
             ? `<p><b>${esc(name.split(" ")[0])}</b> · contact details are available to Pro members – <a href="${SITE}/my-plan">upgrade to see them and reply</a>.</p>`
             : `<p><b>${esc(name)}</b>${b.company ? ` – ${esc(b.company)}` : ""}<br>${esc(email)}${phone ? ` · ${esc(phone)}` : ""}</p>`}
           <p>${esc(message)}</p><p>Budget: ${esc(b.budgetBand || "not stated")} · Timeline: ${esc(b.timeline || "not stated")}</p>
           <p><a href="${SITE}/my-leads" style="background:#1e3a8a;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Open your leads</a></p>`);
      }
    }
    await sendMail(email, "We received your quote request – Pakistan Yellow Pages",
      `<p>Hi ${esc(name)},</p><p>Your request was sent to ${targets.length === 1 ? `<b>${esc(targets[0].name)}</b>` : `${targets.length} businesses: ${targets.map((t) => esc(t.name)).join(", ")}`}. They will contact you directly.</p><p><i>${esc(message)}</i></p><p>Pakistan Yellow Pages – pakistanyp.com</p>`);
    await notifyAdmin(`New lead #${lead.id} (${targets.length} business${targets.length === 1 ? "" : "es"})`, `<p>${esc(name)} – ${esc(email)}</p><p>${esc(message)}</p><p><a href="${SITE}/admin/leads">Lead manager</a></p>`);
    res.status(201).json({ id: lead.id, matched: targets.length, message: businessId ? "Your request was sent to the business." : `Your request was sent to ${targets.length} matching business${targets.length === 1 ? "" : "es"}.` });
  });

  app.get("/api/my/leads", requireLogin, async (req, res) => {
    const u = sessionUser(req)!;
    const rows = await q(
      `select la.id, la.status, la.notes, la.viewed_at, la.updated_at, l.id as lead_id, l.name, l.email, l.phone, l.company, l.service_needed, l.budget_band, l.timeline, l.message, l.source, l.created_at,
              b.id as business_id, b.name as business_name, b.is_premium, b.tier, b.tier_expires_at
       from lead_assignments la join leads l on l.id = la.lead_id join businesses b on b.id = la.business_id
       where b.owner_id = $1 order by l.created_at desc limit 300`, [String(u.id)]);
    // Category leads (sent to several businesses) show contact details to Pro/Premium members only
    const masked = rows.map((r: any) => {
      const locked = r.source === "category" && effectiveTier(r) === "free";
      const { tier, tier_expires_at, ...rest } = r;
      return locked ? { ...rest, email: null, phone: null, company: rest.company ? rest.company.slice(0, 1) + "…" : null, contactLocked: true } : { ...rest, contactLocked: false };
    });
    res.json(masked);
  });

  app.patch("/api/my/leads/:id", requireLogin, async (req, res) => {
    const id = int(req.params.id);
    const la = id ? await one("select business_id from lead_assignments where id = $1", [id]) : null;
    if (!la || !(await ownsBusiness(req, la.business_id))) return res.status(403).json({ message: "Not your lead." });
    const status = str(req.body.status, 20);
    const allowed = ["new", "contacted", "quoted", "won", "lost"];
    if (status && !allowed.includes(status)) return res.status(400).json({ message: "Bad status" });
    await q("update lead_assignments set status = coalesce(nullif($2,''), status), notes = coalesce($3, notes), viewed_at = coalesce(viewed_at, now()), updated_at = now() where id = $1",
      [id, status, typeof req.body.notes === "string" ? str(req.body.notes, 2000) : null]);
    res.json({ ok: true });
  });

  app.get("/api/admin/leads", requireAdmin, async (req, res) => {
    const rows = await q(
      `select l.*, coalesce(json_agg(json_build_object('id', la.id, 'businessId', b.id, 'businessName', b.name, 'status', la.status, 'viewedAt', la.viewed_at)) filter (where la.id is not null), '[]') as assignments
       from leads l left join lead_assignments la on la.lead_id = l.id left join businesses b on b.id = la.business_id
       group by l.id order by l.created_at desc limit 300`);
    const stats = await one(
      `select count(*)::int as total, count(*) filter (where created_at > now() - interval '7 days')::int as this_week,
              (select count(*)::int from lead_assignments where status = 'won') as won, (select count(*)::int from lead_assignments where status = 'new') as untouched from leads`);
    res.json({ items: rows, stats });
  });

  app.patch("/api/admin/leads/:id", requireAdmin, async (req, res) => {
    const id = int(req.params.id);
    const status = str(req.body.status, 20);
    if (!id || !["new", "qualified", "spam", "closed"].includes(status)) return res.status(400).json({ message: "status must be new, qualified, spam or closed" });
    await q("update leads set status = $2, updated_at = now() where id = $1", [id, status]);
    res.json({ ok: true });
  });

  /** Small public summary used by profile pages (verification + review stats). */
  app.get("/api/businesses/:id/trust", async (req, res) => {
    const id = int(req.params.id);
    if (!id) return res.status(400).json({ message: "bad id" });
    const b = await one("select is_verified, verified_at, is_claimed, trade_license, rating_average, rating_count from businesses where id = $1", [id]);
    if (!b) return res.status(404).json({ message: "Not found" });
    const v = await one("select licence_authority, email_verified_at, phone_verified_at from verification_requests where business_id = $1 and status = 'approved' order by id desc limit 1", [id]);
    res.set("Cache-Control", "public, max-age=300");
    res.json({ isVerified: !!b.is_verified, verifiedAt: b.verified_at, isClaimed: !!b.is_claimed, licenceAuthority: v?.licence_authority || null,
      emailVerified: !!v?.email_verified_at, phoneVerified: !!v?.phone_verified_at, ratingAverage: Number(b.rating_average || 0), ratingCount: Number(b.rating_count || 0) });
  });
}
