import { country } from "@shared/country";
/**
 * Phase 2: ranked "Top N {category} in {province}" pages with sponsored slots, membership tiers
 * (Free / Pro / Premium) paid through Stripe Checkout, and tier-based gating of category leads.
 */
import type { Express, Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import { pool } from "./db";
import { isAdminRequest } from "./middleware/adminGuard";
import { registerProfileExtras } from "./profileExtras";
import { registerApprovalRoutes } from "./approvals";
import { registerVerificationAdmin } from "./verificationAdmin";

const SITE = process.env.SITE_ORIGIN || country.origin;
const q = async (text: string, params: any[] = []) => (await pool.query(text, params)).rows;
const one = async (text: string, params: any[] = []) => (await q(text, params))[0];
const sessionUser = (req: Request): { id: string; email?: string; role?: string } | undefined =>
  (req as any).session?.user || ((req as any).isAuthenticated?.() ? (req as any).user : undefined);
const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const int = (v: unknown) => { const n = Number(v); return Number.isInteger(n) && n > 0 ? n : undefined; };
const slugify = (s: string) => String(s || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

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

// ---------------------------------------------------------------------------
// Tiers
// ---------------------------------------------------------------------------
export const TIERS = {
  free: { name: "Free", monthly: 0, yearly: 0, features: ["Business listing with contact details", "Claim and verify your business", "Reply to client reviews", "Quote requests sent directly to you from your profile"] },
  pro: { name: "Pro", monthly: 199, yearly: 1990, features: ["Everything in Free", "Full contact details on category quote requests (leads)", "Higher position in category rankings", "Portfolio, services with prices and team on your profile", "Lead and profile analytics"] },
  premium: { name: "Premium", monthly: 599, yearly: 5990, features: ["Everything in Pro", "Sponsored placement at the top of your category and province pages", "Featured in the province directory pages", "Priority verification and support"] },
} as const;
export type Tier = keyof typeof TIERS;
const CURRENCY = "pkr";

let stripeClient: Stripe | null = null;
function stripe(): Stripe | null {
  if (stripeClient) return stripeClient;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  stripeClient = new Stripe(key, { apiVersion: "2024-06-20" as any });
  return stripeClient;
}

async function setTier(businessId: number, tier: Tier, interval: "monthly" | "yearly" | null, extra: Record<string, any> = {}) {
  const expires = tier === "free" ? null : interval === "yearly" ? "now() + interval '1 year 3 days'" : "now() + interval '1 month 3 days'";
  await q(
    `update businesses set tier = $2, tier_interval = $3, tier_expires_at = ${expires ?? "null"}, is_premium = $4,
       premium_expires_at = ${expires ?? "null"}, stripe_customer_id = coalesce($5, stripe_customer_id), stripe_subscription_id = coalesce($6, stripe_subscription_id), updated_at = now()
     where id = $1`,
    [businessId, tier, interval, tier !== "free", extra.customerId || null, extra.subscriptionId || null]);
}

/** Tier that is actually in force (expired paid tiers fall back to free). */
export function effectiveTier(b: { tier?: string | null; tier_expires_at?: string | Date | null }): Tier {
  const t = (b?.tier || "free") as Tier;
  if (t === "free" || !(t in TIERS)) return "free";
  if (b.tier_expires_at && new Date(b.tier_expires_at).getTime() < Date.now()) return "free";
  return t;
}

// ---------------------------------------------------------------------------
// Rankings
// ---------------------------------------------------------------------------
async function categoryBySlug(slug: string) {
  return one("select id, name, slug, parent_id, description, meta_description from categories where slug = $1 and coalesce(is_active, true)", [slug]);
}
async function provinceBySlug(slug?: string) {
  if (!slug) return null;
  const rows = await q("select id, name from provinces where is_active");
  return rows.find((e: any) => slugify(e.name) === slug) || null;
}

async function rankCategory(categoryId: number, provinceId?: number, limit = 20) {
  const rows = await q(
    `with cats as (select id from categories where id = $1 or parent_id = $1),
     biz as (
       select b.id, b.name, b.slug, coalesce(nullif(b.logo_url,''), nullif(b.logo,'')) as logo, b.short_description, b.description, b.is_verified, b.is_claimed, b.tier, b.tier_expires_at,
              b.rating_average, b.rating_count, b.phone, b.whatsapp, b.website, b.address, b.established_year, b.employee_count, b.view_count, b.province_id, b.category_id,
              e.name as province_name, l.name as locality_name, c.name as category_name,
              (select count(*)::int from business_reviews r where r.business_id = b.id and r.status = 'approved') as reviews,
              (select round(avg(r.rating)::numeric, 1) from business_reviews r where r.business_id = b.id and r.status = 'approved') as review_avg,
              ((case when nullif(b.description,'') is not null then 1 else 0 end) + (case when nullif(b.phone,'') is not null then 1 else 0 end) + (case when nullif(b.email,'') is not null then 1 else 0 end)
               + (case when nullif(b.website,'') is not null then 1 else 0 end) + (case when nullif(b.address,'') is not null then 1 else 0 end) + (case when coalesce(nullif(b.logo_url,''), nullif(b.logo,'')) is not null then 1 else 0 end)
               + (case when b.working_hours is not null then 1 else 0 end) + (case when b.services is not null then 1 else 0 end)) as completeness
       from businesses b
       join provinces e on e.id = b.province_id
       left join localities l on l.id = b.locality_id
       left join categories c on c.id = b.category_id
       where b.is_active and coalesce(b.status, 'active') not in ('rejected', 'suspended')
         and (b.category_id in (select id from cats) or exists (select 1 from cats where b.additional_category_ids::text like '%' || cats.id::text || '%'))
         and ($2::int is null or b.province_id = $2)
     )
     select * from biz`, [categoryId, provinceId || null]);
  const scored = rows.map((b: any) => {
    const tier = effectiveTier(b);
    const breakdown = {
      verified: b.is_verified ? 30 : 0,
      claimed: b.is_claimed ? 10 : 0,
      reviews: Math.min(25, Number(b.reviews || 0) * 5),
      rating: Math.round(Number(b.review_avg || b.rating_average || 0) * 4),
      completeness: Math.round((Number(b.completeness || 0) / 8) * 15),
      tier: tier === "premium" ? 10 : tier === "pro" ? 5 : 0,
    };
    const score = Object.values(breakdown).reduce((a, v) => a + v, 0);
    return { ...b, tier, score, breakdown };
  });
  scored.sort((a: any, b: any) => b.score - a.score || Number(b.view_count || 0) - Number(a.view_count || 0) || a.name.localeCompare(b.name));
  return { items: scored.slice(0, limit), total: scored.length };
}

async function sponsoredFor(categoryId: number, provinceId?: number) {
  const slots = await q(
    `select s.id as slot_id, s.position, b.id, b.name, b.slug, coalesce(nullif(b.logo_url,''), nullif(b.logo,'')) as logo, b.short_description, b.description, b.is_verified, b.rating_average, b.rating_count, b.phone, b.whatsapp, b.website, e.name as province_name
     from sponsored_slots s join businesses b on b.id = s.business_id join provinces e on e.id = b.province_id
     where s.category_id = $1 and (s.province_id is null or $2::int is null or s.province_id = $2) and s.starts_at <= now() and (s.ends_at is null or s.ends_at > now()) and b.is_active
     order by s.position, s.id limit 3`, [categoryId, provinceId || null]);
  if (slots.length >= 3) return slots;
  // Premium members are sponsored in their own category/province automatically
  const premium = await q(
    `with cats as (select id from categories where id = $1 or parent_id = $1)
     select b.id, b.name, b.slug, coalesce(nullif(b.logo_url,''), nullif(b.logo,'')) as logo, b.short_description, b.description, b.is_verified, b.rating_average, b.rating_count, b.phone, b.whatsapp, b.website, e.name as province_name
     from businesses b join provinces e on e.id = b.province_id
     where b.tier = 'premium' and (b.tier_expires_at is null or b.tier_expires_at > now()) and b.is_active
       and b.category_id in (select id from cats) and ($2::int is null or b.province_id = $2)
       and b.id <> all($3::int[])
     order by b.rating_average desc nulls last limit $4`, [categoryId, provinceId || null, slots.map((s: any) => s.id), 3 - slots.length]);
  return [...slots, ...premium];
}

export function registerPhase2Routes(app: Express) {
  registerProfileExtras(app);
  registerApprovalRoutes(app);
  registerVerificationAdmin(app);
  // ---------------- rankings ----------------
  app.get("/api/rankings/:category", async (req, res) => {
    const cat = await categoryBySlug(str(req.params.category, 150));
    if (!cat) return res.status(404).json({ message: "Category not found" });
    const emSlug = str(req.query.province, 60);
    const em = emSlug ? await provinceBySlug(emSlug) : null;
    if (emSlug && !em) return res.status(404).json({ message: "Province not found" });
    const [{ items, total }, sponsored, provinces] = await Promise.all([
      rankCategory(cat.id, em?.id, Number(req.query.limit) > 0 ? Math.min(50, Number(req.query.limit)) : 20),
      sponsoredFor(cat.id, em?.id),
      q(`with cats as (select id from categories where id = $1 or parent_id = $1)
         select e.id, e.name, count(b.id)::int as n from provinces e left join businesses b on b.province_id = e.id and b.is_active and b.category_id in (select id from cats)
         where e.is_active group by e.id, e.name order by n desc, e.name`, [cat.id]),
    ]);
    res.set("Cache-Control", "public, max-age=600, stale-while-revalidate=3600");
    res.json({
      category: { id: cat.id, name: cat.name, slug: cat.slug, description: cat.description },
      province: em ? { id: em.id, name: em.name, slug: slugify(em.name) } : null,
      provinces: provinces.map((e: any) => ({ ...e, slug: slugify(e.name) })),
      sponsored, items, total, updatedAt: new Date().toISOString().slice(0, 10),
    });
  });

  /** Category+province combinations worth a ranked page (≥ 3 businesses) – also used by the sitemap. */
  app.get("/api/rankings", async (_req, res) => {
    const rows = await q(
      `select c.slug as category_slug, c.name as category_name, e.name as province_name, count(b.id)::int as n
       from businesses b join categories c on c.id = coalesce((select parent_id from categories p where p.id = b.category_id), b.category_id) join provinces e on e.id = b.province_id
       where b.is_active and coalesce(c.is_active, true) group by c.slug, c.name, e.name having count(b.id) >= 3 order by n desc limit 3000`);
    res.set("Cache-Control", "public, max-age=3600");
    res.json(rows.map((r: any) => ({ ...r, province_slug: slugify(r.province_name), path: `/top/${r.category_slug}/${slugify(r.province_name)}` })));
  });

  app.get("/sitemap-top.xml", async (_req, res) => {
    const rows = await q(
      `select c.slug as category_slug, e.name as province_name, count(b.id)::int as n, max(b.updated_at) as updated
       from businesses b join categories c on c.id = coalesce((select parent_id from categories p where p.id = b.category_id), b.category_id) join provinces e on e.id = b.province_id
       where b.is_active and coalesce(c.is_active, true) group by c.slug, e.name having count(b.id) >= 3 order by n desc limit 5000`);
    const urls = rows.map((r: any) => `  <url><loc>${SITE}/top/${esc(r.category_slug)}/${slugify(r.province_name)}</loc><lastmod>${new Date(r.updated || Date.now()).toISOString().slice(0, 10)}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`);
    res.set("Content-Type", "application/xml").set("Cache-Control", "public, max-age=3600");
    res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`);
  });

  // ---------------- sponsored slots (admin) ----------------
  app.get("/api/admin/sponsorships", requireAdmin, async (_req, res) => {
    const rows = await q(
      `select s.*, b.name as business_name, b.slug as business_slug, c.name as category_name, e.name as province_name
       from sponsored_slots s join businesses b on b.id = s.business_id left join categories c on c.id = s.category_id left join provinces e on e.id = s.province_id
       order by (s.ends_at is null or s.ends_at > now()) desc, s.created_at desc limit 300`);
    res.json(rows);
  });
  app.post("/api/admin/sponsorships", requireAdmin, async (req, res) => {
    const businessId = int(req.body.businessId), categoryId = int(req.body.categoryId), provinceId = int(req.body.provinceId);
    if (!businessId || !categoryId) return res.status(400).json({ message: "businessId and categoryId are required" });
    const row = await one(
      `insert into sponsored_slots (business_id, category_id, province_id, position, starts_at, ends_at, note, created_by) values ($1,$2,$3,$4, coalesce($5::timestamp, now()), $6, $7, $8) returning *`,
      [businessId, categoryId, provinceId || null, int(req.body.position) || 1, str(req.body.startsAt, 30) || null, str(req.body.endsAt, 30) || null, str(req.body.note, 500) || null, String(sessionUser(req)?.id || "admin")]);
    res.status(201).json(row);
  });
  app.delete("/api/admin/sponsorships/:id", requireAdmin, async (req, res) => {
    await q("delete from sponsored_slots where id = $1", [int(req.params.id) || 0]);
    res.json({ ok: true });
  });
  /** Admin helper: search businesses / categories by name for the sponsorship form. */
  app.get("/api/admin/lookup", requireAdmin, async (req, res) => {
    const term = `%${str(req.query.q, 80)}%`;
    const [businesses, categories, provinces] = await Promise.all([
      q("select id, name, slug from businesses where is_active and name ilike $1 order by view_count desc nulls last limit 10", [term]),
      q("select id, name, slug from categories where name ilike $1 order by business_count desc nulls last limit 10", [term]),
      q("select id, name from provinces where is_active order by id"),
    ]);
    res.json({ businesses, categories, provinces });
  });

  // ---------------- billing ----------------
  app.get("/api/billing/tiers", (_req, res) => res.json({ tiers: TIERS, currency: CURRENCY.toUpperCase(), stripeEnabled: !!stripe() }));

  app.get("/api/my/plan", requireLogin, async (req, res) => {
    const u = sessionUser(req)!;
    const rows = await q("select id, name, slug, tier, tier_interval, tier_expires_at, stripe_subscription_id from businesses where owner_id = $1 order by name", [String(u.id)]);
    res.json(rows.map((b: any) => ({ ...b, effectiveTier: effectiveTier(b) })));
  });

  app.post("/api/billing/checkout", requireLogin, async (req, res) => {
    const s = stripe();
    const businessId = int(req.body.businessId);
    const tier = str(req.body.tier, 10) as Tier;
    const interval = str(req.body.interval, 10) === "yearly" ? "yearly" : "monthly";
    if (!businessId || !(tier in TIERS) || tier === "free") return res.status(400).json({ message: "Choose Pro or Premium." });
    if (!(await ownsBusiness(req, businessId))) return res.status(403).json({ message: "Not your business." });
    if (!s) return res.status(503).json({ message: "Online payment is not enabled yet. Contact us to activate your plan manually." });
    const biz = await one("select id, name, stripe_customer_id from businesses where id = $1", [businessId]);
    const u = sessionUser(req)!;
    const amount = TIERS[tier][interval];
    const session = await s.checkout.sessions.create({
      mode: "subscription",
      customer: biz.stripe_customer_id || undefined,
      customer_email: biz.stripe_customer_id ? undefined : u.email,
      line_items: [{ quantity: 1, price_data: { currency: CURRENCY, unit_amount: amount * 100, recurring: { interval: interval === "yearly" ? "year" : "month" }, product_data: { name: `PakistanYP ${TIERS[tier].name} – ${biz.name}`, description: `${TIERS[tier].name} membership for ${biz.name} on Pakistan Yellow Pages` } } }],
      success_url: `${SITE}/my-plan?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE}/my-plan?cancelled=1`,
      metadata: { businessId: String(businessId), tier, interval, userId: String(u.id) },
      subscription_data: { metadata: { businessId: String(businessId), tier, interval } },
      allow_promotion_codes: true,
    });
    await q("insert into billing_events (business_id, user_id, tier, interval, amount, currency, stripe_session_id, event_type) values ($1,$2,$3,$4,$5,$6,$7,'checkout.created') on conflict do nothing",
      [businessId, String(u.id), tier, interval, amount, CURRENCY, session.id]);
    res.json({ url: session.url });
  });

  /** Called by the success page: confirms the Checkout session with Stripe and activates the tier. */
  app.post("/api/billing/confirm", requireLogin, async (req, res) => {
    const s = stripe();
    const sessionId = str(req.body.sessionId, 120);
    if (!s || !sessionId) return res.status(400).json({ message: "Missing session" });
    const session = await s.checkout.sessions.retrieve(sessionId);
    const businessId = int(session.metadata?.businessId), tier = session.metadata?.tier as Tier, interval = (session.metadata?.interval as any) || "monthly";
    if (!businessId || !(tier in TIERS)) return res.status(400).json({ message: "Unknown session" });
    if (!(await ownsBusiness(req, businessId))) return res.status(403).json({ message: "Not your business." });
    if (session.payment_status !== "paid" && session.status !== "complete") return res.status(402).json({ message: "Payment not completed yet." });
    await setTier(businessId, tier, interval, { customerId: typeof session.customer === "string" ? session.customer : session.customer?.id, subscriptionId: typeof session.subscription === "string" ? session.subscription : session.subscription?.id });
    await q("insert into billing_events (business_id, user_id, tier, interval, amount, currency, stripe_session_id, stripe_subscription_id, event_type) values ($1,$2,$3,$4,$5,$6,$7,$8,'activated') on conflict do nothing",
      [businessId, String(sessionUser(req)!.id), tier, interval, (session.amount_total || 0) / 100, session.currency, session.id, typeof session.subscription === "string" ? session.subscription : null]);
    res.json({ ok: true, tier, interval });
  });

  /** Stripe webhook: renewals keep the tier alive, cancellations downgrade. Needs STRIPE_WEBHOOK_SECRET and rawBody. */
  app.post("/api/billing/webhook", async (req, res) => {
    const s = stripe();
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    const raw = (req as any).rawBody;
    if (!s || !secret || !raw) return res.status(400).send("webhook not configured");
    let event: Stripe.Event;
    try { event = s.webhooks.constructEvent(raw, req.headers["stripe-signature"] as string, secret); }
    catch (e: any) { return res.status(400).send(`signature: ${e.message}`); }
    try {
      if (event.type === "checkout.session.completed") {
        const cs = event.data.object as Stripe.Checkout.Session;
        const businessId = int(cs.metadata?.businessId), tier = cs.metadata?.tier as Tier, interval = (cs.metadata?.interval as any) || "monthly";
        if (businessId && tier in TIERS) await setTier(businessId, tier, interval, { customerId: cs.customer as string, subscriptionId: cs.subscription as string });
      } else if (event.type === "invoice.paid") {
        const inv = event.data.object as any;
        const subId = typeof inv.subscription === "string" ? inv.subscription : inv.subscription?.id;
        const b = subId ? await one("select id, tier, tier_interval from businesses where stripe_subscription_id = $1", [subId]) : null;
        if (b && b.tier !== "free") await setTier(b.id, b.tier, b.tier_interval || "monthly");
      } else if (event.type === "customer.subscription.deleted") {
        const sub = event.data.object as Stripe.Subscription;
        const b = await one("select id from businesses where stripe_subscription_id = $1", [sub.id]);
        if (b) await q("update businesses set tier = 'free', is_premium = false, tier_expires_at = null, premium_expires_at = null, stripe_subscription_id = null, updated_at = now() where id = $1", [b.id]);
      }
      await q("insert into billing_events (business_id, tier, event_type, payload) values ($1, $2, $3, $4)",
        [int((event.data.object as any)?.metadata?.businessId) || null, (event.data.object as any)?.metadata?.tier || null, event.type, JSON.stringify({ id: event.id })]);
    } catch (e) { console.error("[billing] webhook handling failed", e); }
    res.json({ received: true });
  });

  /** Owner: open the Stripe customer portal to change card / cancel. */
  app.post("/api/billing/portal", requireLogin, async (req, res) => {
    const s = stripe();
    const businessId = int(req.body.businessId);
    if (!s || !businessId || !(await ownsBusiness(req, businessId))) return res.status(400).json({ message: "Not available" });
    const b = await one("select stripe_customer_id from businesses where id = $1", [businessId]);
    if (!b?.stripe_customer_id) return res.status(400).json({ message: "No subscription on file for this business." });
    const portal = await s.billingPortal.sessions.create({ customer: b.stripe_customer_id, return_url: `${SITE}/my-plan` });
    res.json({ url: portal.url });
  });

  /** Admin: set a tier manually (bank transfer, comp, support cases). */
  app.patch("/api/admin/businesses/:id/tier", requireAdmin, async (req, res) => {
    const id = int(req.params.id);
    const tier = str(req.body.tier, 10) as Tier;
    const interval = str(req.body.interval, 10) === "yearly" ? "yearly" : "monthly";
    if (!id || !(tier in TIERS)) return res.status(400).json({ message: "tier must be free, pro or premium" });
    await setTier(id, tier, tier === "free" ? null : interval);
    await q("insert into billing_events (business_id, user_id, tier, interval, event_type) values ($1,$2,$3,$4,'admin.set')", [id, String(sessionUser(req)?.id || "admin"), tier, interval]);
    res.json({ ok: true });
  });
  app.get("/api/admin/billing", requireAdmin, async (_req, res) => {
    const members = await q("select id, name, slug, tier, tier_interval, tier_expires_at, stripe_subscription_id from businesses where tier <> 'free' order by tier_expires_at desc nulls last limit 300");
    const events = await q("select e.*, b.name as business_name from billing_events e left join businesses b on b.id = e.business_id order by e.created_at desc limit 100");
    res.json({ members: members.map((b: any) => ({ ...b, effectiveTier: effectiveTier(b) })), events });
  });
}

/** Used by phase 1 lead endpoints: category leads show contact details only to paid tiers. */
export async function leadContactLocked(businessId: number, source: string): Promise<boolean> {
  if (source !== "category") return false;
  const b = await one("select tier, tier_expires_at from businesses where id = $1", [businessId]);
  return effectiveTier(b || {}) === "free";
}
