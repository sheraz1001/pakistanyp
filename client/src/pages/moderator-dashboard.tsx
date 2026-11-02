import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminProtectedRoute, PermissionGate } from "@/components/admin-protected-route";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AdminShell, AdminPageHeader } from "@/components/admin/admin-shell";
import {
  Shield,
  Users,
  Building2,
  MessageSquare,
  Eye,
  LogOut,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  TrendingUp
} from "lucide-react";

export default function ModeratorDashboard() {
  return (
    <AdminProtectedRoute requiredRole="moderator">
      <ModeratorDashboardContent />
    </AdminProtectedRoute>
  );
}

function ModeratorDashboardContent() {
  const { user, logout } = useAdminAuth();
  const [, setLocation] = useLocation();

  const moderatorTasks = [
    {
      title: "Business Reviews",
      description: "Review and approve pending business listings",
      icon: Building2,
      count: undefined as number | undefined,
      urgent: true,
      route: "/moderator/businesses"
    },
    {
      title: "User Reports",
      description: "Handle user reports and complaints",
      icon: AlertTriangle,
      count: undefined as number | undefined,
      urgent: true,
      route: "/moderator/reports"
    },
    {
      title: "Review Moderation",
      description: "Moderate user reviews and ratings",
      icon: MessageSquare,
      count: undefined as number | undefined,
      urgent: false,
      route: "/moderator/reviews"
    },
    {
      title: "Content Approval",
      description: "Review and approve user-submitted content",
      icon: Eye,
      count: undefined as number | undefined,
      urgent: false,
      route: "/moderator/content"
    }
  ];

  const { data: stats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/admin/real-stats"],
    queryFn: async () => {
      const response = await fetch("/api/admin/real-stats", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch real statistics");
      return response.json();
    },
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
  // Real pending counts where the platform tracks them
  moderatorTasks[0].count = stats?.pendingBusinesses;
  moderatorTasks[2].count = stats?.pendingReviews;
  const urgentTotal = moderatorTasks.filter((t) => t.urgent).reduce((sum, t) => sum + (t.count || 0), 0);
  const nf = (n?: number) => (statsLoading ? "…" : (n || 0).toLocaleString("en-US"));
  const TILES = ["bg-[#FDECEC] text-[#B91C1C]", "bg-[#FFF4E0] text-[#B45309]", "bg-[#E8F4EC] text-[#0B6B2E]", "bg-[#F1F2F6] text-[#334155]"];

  return (
    <AdminShell tag="MODERATOR">
      <AdminPageHeader
        title={`Welcome${user?.firstName ? `, ${user.firstName}` : ""}`}
        subtitle="Your moderation tasks and pending items that need your attention."
        actions={
          <Button variant="outline" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        }
      />

      {/* Priority Alerts */}
      {urgentTotal > 0 && (
        <div className="flex items-start gap-3 rounded-[20px] border border-[#FBE3B5] bg-[#FFF8EB] p-5">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#B45309]" />
          <div>
            <h3 className="font-semibold text-[#0A0A0A]">Priority items</h3>
            <p className="text-sm text-[#7C4A03]">
              {urgentTotal.toLocaleString("en-US")} urgent items need attention across business reviews and user reports.
            </p>
          </div>
        </div>
      )}

      {/* Task Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {moderatorTasks.map((task, i) => (
          <div key={task.title} className="yp-card yp-card-link flex flex-col gap-4 p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-[14px] ${TILES[i % TILES.length]}`}>
                  <task.icon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold tracking-[-0.02em]">{task.title}</h2>
                  {task.urgent && <span className="yp-pill mt-1 bg-[#FDECEC] text-[#991B1B]">Urgent</span>}
                </div>
              </div>
              {typeof task.count === "number" && (
                <div className="text-right">
                  <div className="text-2xl font-bold tracking-[-0.03em] text-[#0A0A0A]">{task.count.toLocaleString("en-US")}</div>
                  <div className="text-xs text-[#5B6475]">pending</div>
                </div>
              )}
            </div>
            <p className="text-[#4B5565]">{task.description}</p>
            <Button onClick={() => setLocation(task.route)} className="mt-auto w-full" variant={task.urgent ? "default" : "outline"}>
              Review {task.title}
            </Button>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Pending listings", value: nf(stats?.pendingBusinesses), icon: Clock },
          { label: "Pending reviews", value: nf(stats?.pendingReviews), icon: MessageSquare },
          { label: "Total reviews", value: nf(stats?.totalReviews), icon: CheckCircle },
          { label: "Verified businesses", value: nf(stats?.verifiedBusinesses), icon: TrendingUp },
        ].map((k) => (
          <div key={k.label} className="yp-card flex flex-col gap-2.5 p-[22px]">
            <span className="flex items-center gap-2 text-sm text-[#5B6475]"><k.icon className="h-4 w-4" />{k.label}</span>
            <span className="text-[34px] font-bold leading-none tracking-[-0.04em]">{k.value}</span>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <section className="yp-card p-6">
        <h2 className="mb-3 text-lg font-semibold tracking-[-0.02em]">Recent moderation activity</h2>
        {auditLogs.length === 0 ? (
          <p className="py-4 text-sm text-[#5B6475]">No moderation activity recorded yet.</p>
        ) : auditLogs.slice(0, 6).map((log: any) => {
          const bad = /(reject|delete|remove|ban)/i.test(log.action || "");
          return (
            <div key={log.id} className="flex items-start gap-3 border-b border-[#EEF0F4] py-2.5 last:border-b-0">
              {bad ? <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#B91C1C]" /> : <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#047857]" />}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#0A0A0A]">{log.action || "Update"}</p>
                <p className="text-xs text-[#5B6475]">{log.description || [log.targetType, log.targetId].filter(Boolean).join(" ")}</p>
              </div>
              <span className="shrink-0 text-xs text-[#5B6475]">
                {log.createdAt ? new Date(log.createdAt).toLocaleDateString("en-AE", { day: "numeric", month: "short" }) : ""}
              </span>
            </div>
          );
        })}
      </section>
    </AdminShell>
  );
}
