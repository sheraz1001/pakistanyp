/**
 * Phase 2c: richer profiles – services with price ranges, portfolio / case studies, team, FAQs.
 * Stored as JSON on the business row; edited by the owner at /my-profile; shown on the profile page.
 */
import type { Express, Request, Response, NextFunction } from "express";
import { pool } from "./db";
import { isAdminRequest } from "./middleware/adminGuard";
import { effectiveTier } from "./phase2";

const q = async (text: string, params: any[] = []) => (await pool.query(text, params)).rows;
const one = async (text: string, params: any[] = []) => (await q(text, params))[0];
const sessionUser = (req: Request): { id: string } | undefined => (req as any).session?.user || ((req as any).isAuthenticated?.() ? (req as any).user : undefined);
const str = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const int = (v: unknown) => { const n = Number(v); return Number.isInteger(n) && n > 0 ? n : undefined; };
const url = (v: unknown) => { const s = str(v, 500); return /^(https?:\/\/|\/uploads\/)/i.test(s) ? s : ""; };

export const EXTRA_LIMITS = { servicePrices: 30, portfolio: 12, team: 10, faqs: 15 };

function requireLogin(req: Request, res: Response, next: NextFunction) {
  if (!sessionUser(req)) return res.status(401).json({ message: "Please log in to continue." });
  next();
}
async function ownsBusiness(req: Request, businessId: number) {
  if (isAdminRequest(req)) return true;
  const u = sessionUser(req);
  if (!u) return false;
  const b = await one("select owner_id from businesses where id = $1", [businessId]);
  return !!b && String(b.owner_id) === String(u.id);
}

const clean = {
  servicePrices: (items: any[]) => items.slice(0, EXTRA_LIMITS.servicePrices).map((i) => ({ name: str(i?.name, 120), priceFrom: Number(i?.priceFrom) > 0 ? Math.round(Number(i.priceFrom)) : null, priceTo: Number(i?.priceTo) > 0 ? Math.round(Number(i.priceTo)) : null, unit: str(i?.unit, 40), description: str(i?.description, 300) })).filter((i) => i.name),
  portfolio: (items: any[]) => items.slice(0, EXTRA_LIMITS.portfolio).map((i) => ({ title: str(i?.title, 140), client: str(i?.client, 120), year: int(i?.year) && Number(i.year) > 1950 && Number(i.year) < 2100 ? Number(i.year) : null, description: str(i?.description, 800), image: url(i?.image), link: url(i?.link) })).filter((i) => i.title),
  team: (items: any[]) => items.slice(0, EXTRA_LIMITS.team).map((i) => ({ name: str(i?.name, 100), role: str(i?.role, 100), photo: url(i?.photo), linkedin: url(i?.linkedin), bio: str(i?.bio, 300) })).filter((i) => i.name),
  faqs: (items: any[]) => items.slice(0, EXTRA_LIMITS.faqs).map((i) => ({ question: str(i?.question, 200), answer: str(i?.answer, 1200) })).filter((i) => i.question && i.answer),
};

export function registerProfileExtras(app: Express) {
  // image uploads were open to anyone; require a session (owners/admins use them)
  app.post("/api/upload/image", (req, res, next) => (sessionUser(req) ? next() : res.status(401).json({ message: "Please log in to upload images." })));

  app.get("/api/businesses/:id/extras", async (req, res) => {
    const id = int(req.params.id);
    if (!id) return res.status(400).json({ message: "bad id" });
    const b = await one("select portfolio, team, service_prices, faqs, tier, tier_expires_at from businesses where id = $1", [id]);
    if (!b) return res.status(404).json({ message: "Not found" });
    const tier = effectiveTier(b);
    res.set("Cache-Control", "public, max-age=300");
    // portfolio and team are Pro/Premium features: hidden on the public page when the plan lapsed
    res.json({ tier, servicePrices: b.service_prices || [], faqs: b.faqs || [], portfolio: tier === "free" ? [] : b.portfolio || [], team: tier === "free" ? [] : b.team || [] });
  });

  /** Owner view includes everything regardless of tier so nothing is lost on downgrade. */
  app.get("/api/my/businesses/:id/extras", requireLogin, async (req, res) => {
    const id = int(req.params.id);
    if (!id || !(await ownsBusiness(req, id))) return res.status(403).json({ message: "Not your business." });
    const b = await one("select name, slug, portfolio, team, service_prices, faqs, tier, tier_expires_at from businesses where id = $1", [id]);
    res.json({ name: b.name, slug: b.slug, tier: effectiveTier(b), limits: EXTRA_LIMITS, servicePrices: b.service_prices || [], faqs: b.faqs || [], portfolio: b.portfolio || [], team: b.team || [] });
  });

  app.put("/api/my/businesses/:id/extras", requireLogin, async (req, res) => {
    const id = int(req.params.id);
    if (!id || !(await ownsBusiness(req, id))) return res.status(403).json({ message: "Not your business." });
    const b = req.body || {};
    const data = {
      service_prices: clean.servicePrices(Array.isArray(b.servicePrices) ? b.servicePrices : []),
      portfolio: clean.portfolio(Array.isArray(b.portfolio) ? b.portfolio : []),
      team: clean.team(Array.isArray(b.team) ? b.team : []),
      faqs: clean.faqs(Array.isArray(b.faqs) ? b.faqs : []),
    };
    await q("update businesses set service_prices = $2, portfolio = $3, team = $4, faqs = $5, updated_at = now() where id = $1",
      [id, JSON.stringify(data.service_prices), JSON.stringify(data.portfolio), JSON.stringify(data.team), JSON.stringify(data.faqs)]);
    res.json({ ok: true, counts: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length])) });
  });
}
