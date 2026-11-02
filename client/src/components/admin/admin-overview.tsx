import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/components/phase1/api";
import { AdminPageHeader } from "@/components/admin/admin-shell";

type Stats = {
  totalBusinesses?: number; totalUsers?: number; totalCategories?: number; pendingBusinesses?: number;
  verifiedUsers?: number; pendingReviews?: number; totalReviews?: number; growthRate?: number;
  verifiedBusinesses?: number; featuredBusinesses?: number;
};
type Daily = { date: string; businessesCreated: number; usersRegistered: number; reviewsPosted: number };

const PERIODS = [
  { value: "7", label: "Last 7 days" },
  { value: "3", label: "Last 3 days" },
  { value: "1", label: "Today" },
];

const nf = (n?: number | null) => (typeof n === "number" ? n.toLocaleString("en-US") : "0");

function timeAgo(d?: string | null): string {
  if (!d) return "";
  const t = new Date(d).getTime();
  if (Number.isNaN(t)) return "";
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) { const h = Math.floor(s / 3600); return `${h} hour${h === 1 ? "" : "s"} ago`; }
  if (s < 172800) return "Yesterday";
  return new Date(t).toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" });
}

function mono(name?: string): string {
  const w = (name || "").replace(/[^A-Za-z0-9 ]/g, " ").trim().split(/\s+/).filter(Boolean);
  return ((w[0]?.[0] || "") + (w[1]?.[0] || "")).toUpperCase() || "•";
}

const TINTS = [
  { bg: "#E6F6F1", fg: "#047857" }, { bg: "#FFF4E0", fg: "#B45309" }, { bg: "#F1F2F6", fg: "#334155" },
  { bg: "#E8F4EC", fg: "#0B6B2E" }, { bg: "#FDECEC", fg: "#B91C1C" },
];
const TYPE_PILL: Record<string, { bg: string; fg: string; label: string }> = {
  listing: { bg: "#E8F4EC", fg: "#05501F", label: "New listing" },
  claim: { bg: "#FFF4E0", fg: "#7C4A03", label: "Claim" },
  review: { bg: "#FDECEC", fg: "#991B1B", label: "Review" },
};

type QueueItem = { key: string; id: number; kind: "listing" | "claim" | "review"; name: string; meta: string; when?: string; href: string };

function Kpi({ label, value, sub, warm }: { label: string; value: React.ReactNode; sub?: React.ReactNode; warm?: boolean }) {
  return (
    <div
      className={`flex flex-col gap-2.5 rounded-[20px] border p-[22px] ${warm ? "border-[#FBE3B5] bg-[#FFF8EB]" : "border-[#E7E9EE] bg-white"}`}
    >
      <span className={`text-sm ${warm ? "text-[#7C4A03]" : "text-[#5B6475]"}`}>{label}</span>
      <span className="text-[34px] font-bold leading-none tracking-[-0.04em] text-[#0A0A0A]">{value}</span>
      {sub ? <span className={`text-[13px] ${warm ? "text-[#7C4A03]" : "text-[#5B6475]"}`}>{sub}</span> : null}
    </div>
  );
}

/** Admin overview ("Dashboard"): KPIs, review queue, recent activity, listings by province, content. */
export function AdminOverview({ onNavigate }: { onNavigate?: (section: string) => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [period, setPeriod] = useState("7");
  const [filter, setFilter] = useState<"all" | "listing" | "claim" | "review">("all");

  // Real statistics from database - NO DEMO DATA
  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/admin/real-stats"],
    queryFn: async () => {
      const response = await fetch("/api/admin/real-stats", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch real statistics");
      return response.json();
    },
  });

  // Real daily analytics (last 7 days) - NO DEMO DATA
  const { data: dailyData, isLoading: dailyLoading } = useQuery<Daily[]>({
    queryKey: ["/api/admin/daily-analytics"],
    queryFn: async () => {
      const response = await fetch("/api/admin/daily-analytics", { credentials: "include" });
      if (!response.ok) return [];
      return response.json();
    },
  });

  const { data: approvals } = useQuery<{ items: any[]; counts: Record<string, number> }>({
    queryKey: ["/api/admin/approvals", "pending", ""],
    queryFn: () => api(`/api/admin/approvals?status=pending&q=`),
    retry: false,
  });
  const { data: claims = [] } = useQuery<any[]>({ queryKey: ["/api/admin/business-claims"], retry: false });
  const { data: reviews } = useQuery<{ items: any[]; counts: Record<string, number> }>({
    queryKey: ["/api/admin/reviews", "pending"],
    queryFn: () => api(`/api/admin/reviews?status=pending`),
    retry: false,
  });
  const { data: auditLogs = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/audit-logs"],
    queryFn: async () => {
      const response = await fetch("/api/admin/audit-logs?limit=20", { credentials: "include" });
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    retry: false,
  });
  const { data: provinces = [] } = useQuery<any[]>({ queryKey: ["/api/provinces", { with_stats: "true" }], retry: false });
  const { data: blogPosts = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/blog-posts"],
    queryFn: async () => {
      const response = await fetch("/api/admin/blog-posts", { credentials: "include" });
      if (!response.ok) return [];
      return response.json();
    },
    retry: false,
  });

  const approveListing = useMutation({
    mutationFn: (id: number) => api("/api/admin/approvals/bulk", { method: "POST", json: { ids: [id], action: "approve", notify: true } }),
    onSuccess: () => {
      toast({ title: "Listing approved", description: "The owner has been notified." });
      qc.invalidateQueries({ queryKey: ["/api/admin/approvals"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/real-stats"] });
    },
    onError: (e: any) => toast({ title: "Could not approve", description: e.message, variant: "destructive" }),
  });
  const moderateReview = useMutation({
    mutationFn: ({ id, action }: { id: number; action: "approve" | "reject" }) => api(`/api/admin/reviews/${id}`, { method: "PATCH", json: { action } }),
    onSuccess: (_r, v) => {
      toast({ title: v.action === "approve" ? "Review approved" : "Review rejected" });
      qc.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
    },
    onError: (e: any) => toast({ title: "Could not update review", description: e.message, variant: "destructive" }),
  });

  const daily = Array.isArray(dailyData) ? dailyData : [];
  const periodRows = daily.slice(-Number(period));
  const newBusinesses = periodRows.reduce((s, r) => s + (Number(r.businessesCreated) || 0), 0);
  const newUsers = periodRows.reduce((s, r) => s + (Number(r.usersRegistered) || 0), 0);
  const periodLabel = PERIODS.find((p) => p.value === period)?.label.toLowerCase() || "";

  const pendingClaims = Array.isArray(claims) ? claims.filter((c) => (c?.status || "pending") === "pending") : [];
  const pendingListings = approvals?.items || [];
  const pendingReviews = reviews?.items || [];
  const listingCount = approvals?.counts?.pending ?? stats?.pendingBusinesses ?? 0;
  const reviewCount = reviews?.counts?.pending ?? stats?.pendingReviews ?? 0;
  const needsReview = listingCount + pendingClaims.length;

  const queue: QueueItem[] = useMemo(() => {
    const rows: QueueItem[] = [
      ...pendingListings.map((b: any) => ({
        key: `l${b.id}`, id: b.id, kind: "listing" as const, name: b.name,
        meta: [b.category_name, [b.locality_name, b.province_name].filter(Boolean).join(", ")].filter(Boolean).join(" · "),
        when: b.created_at, href: "/admin/approvals",
      })),
      ...pendingClaims.map((c: any) => ({
        key: `c${c.id}`, id: c.id, kind: "claim" as const, name: c.businessName || `Business #${c.businessId}`,
        meta: [c.userName || c.userEmail, c.relationshipToBusiness].filter(Boolean).join(" · "),
        when: c.createdAt, href: "/admin/business-claims",
      })),
      ...pendingReviews.map((r: any) => ({
        key: `r${r.id}`, id: r.id, kind: "review" as const, name: `Review on ${r.business_name || "a business"}`,
        meta: r.title || (r.comment ? `“${String(r.comment).slice(0, 80)}${String(r.comment).length > 80 ? "…" : ""}”` : ""),
        when: r.created_at, href: "/admin/reviews",
      })),
    ];
    return rows
      .filter((r) => filter === "all" || r.kind === filter)
      .sort((a, b) => new Date(b.when || 0).getTime() - new Date(a.when || 0).getTime())
      .slice(0, 8);
  }, [pendingListings, pendingClaims, pendingReviews, filter]);

  const provinceRows = (Array.isArray(provinces) ? provinces : [])
    .map((e: any) => ({ name: e.name, n: Number(e.businessCount) || 0 }))
    .sort((a, b) => b.n - a.n);
  const provinceMax = Math.max(1, ...provinceRows.map((e) => e.n));
  const localities = (Array.isArray(provinces) ? provinces : []).reduce((s: number, e: any) => s + (Number(e.localityCount) || 0), 0);

  const posts = (Array.isArray(blogPosts) ? blogPosts : []).slice(0, 4);

  const activityColour = (action?: string) => {
    const a = (action || "").toLowerCase();
    if (/(reject|delete|remove|ban|suspend)/.test(a)) return "#B91C1C";
    if (/(approve|verify|activate)/.test(a)) return "#047857";
    if (/(create|publish|add)/.test(a)) return "#0B6B2E";
    return "#5B6475";
  };

  const segBtn = (value: typeof filter, label: string) => (
    <button
      key={value}
      type="button"
      onClick={() => setFilter(value)}
      aria-pressed={filter === value}
      className={`min-h-[34px] rounded-[9px] px-3 text-sm font-semibold ${filter === value ? "bg-white text-[#0A0A0A] shadow-[0_1px_2px_rgba(10,10,10,.06)]" : "bg-transparent text-[#5B6475] hover:text-[#0A0A0A]"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Dashboard"
        subtitle="Directory health and items waiting for you."
        actions={
          <label className="flex items-center gap-2 text-sm text-[#3A4354]">
            Period
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="min-h-[44px] rounded-xl border border-[#E3E6EC] bg-white px-3 text-sm"
            >
              {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </label>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Totals">
        <Kpi
          label="Businesses"
          value={statsLoading ? "…" : nf(stats?.totalBusinesses)}
          sub={daily.length ? `+${nf(newBusinesses)} ${periodLabel}` : `${nf(stats?.verifiedBusinesses)} verified`}
        />
        <Kpi
          label="Registered users"
          value={statsLoading ? "…" : nf(stats?.totalUsers)}
          sub={daily.length ? `+${nf(newUsers)} ${periodLabel}` : `${nf(stats?.verifiedUsers)} verified`}
        />
        <Kpi
          label="Categories"
          value={statsLoading ? "…" : nf(stats?.totalCategories)}
          sub={localities ? `${nf(localities)} localities` : "Main categories"}
        />
        <Kpi warm label="Needs review" value={statsLoading ? "…" : nf(needsReview)} sub={`Approvals + claims${reviewCount ? ` · ${nf(reviewCount)} reviews` : ""}`} />
      </section>

      <div className="flex flex-wrap gap-6">
        <section className="yp-card min-w-0 flex-[2_1_560px] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
            <h2 className="m-0 text-lg font-semibold tracking-[-0.02em]">Review queue</h2>
            <div className="flex flex-wrap gap-1 rounded-xl bg-[#F1F2F6] p-1" role="group" aria-label="Filter review queue">
              {segBtn("all", "All")}
              {segBtn("listing", "New listings")}
              {segBtn("claim", "Claims")}
              {segBtn("review", "Reviews")}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="yp-table min-w-[680px]">
              <thead>
                <tr><th>Item</th><th>Type</th><th>Submitted</th><th className="!text-right">Actions</th></tr>
              </thead>
              <tbody>
                {queue.length === 0 ? (
                  <tr><td colSpan={4} className="py-10 text-center text-[#5B6475]">Nothing waiting for review.</td></tr>
                ) : queue.map((q, i) => {
                  const tint = TINTS[i % TINTS.length];
                  const pill = TYPE_PILL[q.kind];
                  return (
                    <tr key={q.key}>
                      <td>
                        <span className="flex items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] text-[13px] font-bold" style={{ background: tint.bg, color: tint.fg }}>{mono(q.name)}</span>
                          <span className="min-w-0">
                            <span className="block font-semibold text-[#0A0A0A]">{q.name}</span>
                            {q.meta ? <span className="block truncate text-[13px] text-[#5B6475]">{q.meta}</span> : null}
                          </span>
                        </span>
                      </td>
                      <td><span className="yp-pill" style={{ background: pill.bg, color: pill.fg }}>{pill.label}</span></td>
                      <td className="text-[#5B6475]">{timeAgo(q.when)}</td>
                      <td className="whitespace-nowrap text-right">
                        {q.kind === "listing" ? (
                          <span className="inline-flex gap-2">
                            <Link href={q.href} className="yp-btn yp-btn-ghost !min-h-[36px] !px-3">Review</Link>
                            <button type="button" className="yp-btn yp-btn-primary !min-h-[36px] !px-3" disabled={approveListing.isPending} onClick={() => approveListing.mutate(q.id)}>Approve</button>
                          </span>
                        ) : q.kind === "review" ? (
                          <span className="inline-flex gap-2">
                            <button type="button" className="yp-btn yp-btn-ghost !min-h-[36px] !px-3" disabled={moderateReview.isPending} onClick={() => moderateReview.mutate({ id: q.id, action: "reject" })}>Reject</button>
                            <button type="button" className="yp-btn yp-btn-primary !min-h-[36px] !px-3" disabled={moderateReview.isPending} onClick={() => moderateReview.mutate({ id: q.id, action: "approve" })}>Approve</button>
                          </span>
                        ) : (
                          <Link href={q.href} className="yp-btn yp-btn-ghost !min-h-[36px] !px-3">Open claim</Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="yp-card flex min-w-0 flex-[1_1_300px] flex-col gap-1 p-6">
          <h2 className="mb-3 text-lg font-semibold tracking-[-0.02em]">Recent activity</h2>
          {auditLogs.length === 0 ? (
            <p className="py-6 text-sm text-[#5B6475]">No admin activity recorded yet.</p>
          ) : auditLogs.slice(0, 6).map((log: any) => (
            <div key={log.id} className="flex gap-3 border-b border-[#EEF0F4] py-2.5 last:border-b-0">
              <span className="mt-[7px] h-2 w-2 shrink-0 rounded-full" style={{ background: activityColour(log.action) }} />
              <span className="text-sm leading-normal text-[#3A4354]">
                <strong className="font-semibold text-[#0A0A0A]">{log.adminEmail || log.adminId || "Admin"}</strong>{" "}
                {log.description || [log.action, log.targetType].filter(Boolean).join(" ")}
                <span className="block text-xs text-[#5B6475]">{timeAgo(log.createdAt)}</span>
              </span>
            </div>
          ))}
          {onNavigate ? (
            <button type="button" onClick={() => onNavigate("user-list")} className="mt-3 self-start text-sm font-semibold text-[#0B6B2E] hover:text-[#05501F]">
              Open audit log →
            </button>
          ) : null}
        </section>
      </div>

      <div className="flex flex-wrap gap-6">
        <section className="yp-card min-w-0 flex-[1_1_420px] p-6">
          <h2 className="mb-5 text-lg font-semibold tracking-[-0.02em]">Listings by province</h2>
          {provinceRows.length === 0 ? (
            <p className="text-sm text-[#5B6475]">No province data yet.</p>
          ) : (
            <div className="flex flex-col gap-3.5">
              {provinceRows.map((e) => (
                <div key={e.name} className="grid grid-cols-[minmax(90px,130px)_1fr_44px] items-center gap-3 text-sm">
                  <span className="truncate">{e.name}</span>
                  <span className="h-2.5 overflow-hidden rounded-full bg-[#EEF0F4]">
                    <span className="block h-full rounded-full bg-[#0B6B2E]" style={{ width: `${Math.round((e.n / provinceMax) * 100)}%` }} />
                  </span>
                  <span className="text-right text-[#5B6475]">{nf(e.n)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="yp-card flex min-w-0 flex-[1_1_420px] flex-col gap-3.5 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="m-0 text-lg font-semibold tracking-[-0.02em]">Content</h2>
            <Link href="/create-blog-post" className="yp-btn yp-btn-ghost !min-h-[38px]">+ New post</Link>
          </div>
          {posts.length === 0 ? (
            <p className="text-sm text-[#5B6475]">No posts yet.</p>
          ) : posts.map((p: any, i: number) => {
            const st = String(p.status || "draft").toLowerCase();
            const pill = st === "published" ? { bg: "#E6F6F1", fg: "#065F46" } : st === "scheduled" ? { bg: "#E8F4EC", fg: "#05501F" } : { bg: "#F1F2F6", fg: "#334155" };
            return (
              <div key={p.id ?? i} className="flex justify-between gap-3 border-b border-[#EEF0F4] py-3 text-sm last:border-b-0">
                <span className="min-w-0">
                  <strong className="block truncate font-semibold text-[#0A0A0A]">{p.title || "Untitled"}</strong>
                  <span className="text-[#5B6475]">{["Blog", p.authorName || p.author, timeAgo(p.publishedAt || p.updatedAt || p.createdAt)].filter(Boolean).join(" · ")}</span>
                </span>
                <span className="yp-pill self-center capitalize" style={{ background: pill.bg, color: pill.fg }}>{st}</span>
              </div>
            );
          })}
          {onNavigate ? (
            <button type="button" onClick={() => onNavigate("blog-posts")} className="self-start text-sm font-semibold text-[#0B6B2E] hover:text-[#05501F]">
              Manage blog posts →
            </button>
          ) : null}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="yp-card p-6">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="m-0 text-lg font-semibold tracking-[-0.02em]">Business registrations</h2>
            <span className="text-[13px] text-[#5B6475]">Growth {nf(stats?.growthRate)}% this month</span>
          </div>
          {dailyLoading ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-[#5B6475]">Loading analytics…</div>
          ) : daily.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={daily}>
                <CartesianGrid stroke="#EEF0F4" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#5B6475" }} tickLine={false} axisLine={{ stroke: "#E7E9EE" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#5B6475" }} tickLine={false} axisLine={false} width={32} />
                <Tooltip />
                <Line type="monotone" dataKey="businessesCreated" stroke="#0B6B2E" strokeWidth={2} dot={false} name="Businesses created" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[260px] items-center justify-center text-sm text-[#5B6475]">No business registration data available yet</div>
          )}
        </section>
        <section className="yp-card p-6">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="m-0 text-lg font-semibold tracking-[-0.02em]">User registrations</h2>
            <span className="text-[13px] text-[#5B6475]">{nf(stats?.verifiedUsers)} verified accounts</span>
          </div>
          {dailyLoading ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-[#5B6475]">Loading analytics…</div>
          ) : daily.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={daily}>
                <CartesianGrid stroke="#EEF0F4" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#5B6475" }} tickLine={false} axisLine={{ stroke: "#E7E9EE" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#5B6475" }} tickLine={false} axisLine={false} width={32} />
                <Tooltip cursor={{ fill: "#F2F9F4" }} />
                <Bar dataKey="usersRegistered" fill="#0B6B2E" radius={[6, 6, 0, 0]} name="Users registered" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[260px] items-center justify-center text-sm text-[#5B6475]">No user registration data available yet</div>
          )}
        </section>
      </div>
    </div>
  );
}

export default AdminOverview;
