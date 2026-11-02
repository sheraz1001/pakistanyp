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
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Eye,
  Edit,
  Plus,
  MessageSquare,
  Calendar,
  Globe,
  DollarSign,
  TrendingUp,
  UserCheck,
  Bell
} from "lucide-react";

export default function AdminDashboard() {
  return (
    <AdminProtectedRoute>
      <AdminDashboardContent />
    </AdminProtectedRoute>
  );
}

function AdminDashboardContent() {
  const { user, logout } = useAdminAuth();
  const [, setLocation] = useLocation();

  const dashboardCards = [
    {
      title: "User Management",
      description: "Manage users, roles, and permissions",
      icon: Users,
      permission: "users_read",
      route: "/admin/users",
      color: "bg-blue-500"
    },
    {
      title: "Business Management",
      description: "Review and manage business listings",
      icon: Building2,
      permission: "businesses_read",
      route: "/admin/businesses",
      color: "bg-green-500"
    },
    {
      title: "Content Management",
      description: "Manage blogs, news, and articles",
      icon: FileText,
      permission: "content_read",
      route: "/admin/content",
      color: "bg-purple-500"
    },
    {
      title: "Analytics & Reports",
      description: "View platform analytics and reports",
      icon: BarChart3,
      permission: "analytics_read",
      route: "/admin/analytics",
      color: "bg-[#B45309]"
    },
    {
      title: "Categories",
      description: "Manage business categories",
      icon: Eye,
      permission: "categories_read",
      route: "/admin/categories",
      color: "bg-indigo-500"
    },
    {
      title: "Reviews & Ratings",
      description: "Moderate reviews and ratings",
      icon: MessageSquare,
      permission: "reviews_read",
      route: "/admin/reviews",
      color: "bg-pink-500"
    },
    {
      title: "Social Media",
      description: "Generate social media content",
      icon: Globe,
      permission: "content_create",
      route: "/admin-social-media-generator",
      color: "bg-cyan-500"
    },
    {
      title: "System Settings",
      description: "Configure system settings",
      icon: Settings,
      permission: "system_admin",
      route: "/admin/settings",
      color: "bg-gray-500"
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
  const nf = (n?: number) => (statsLoading ? "…" : (n || 0).toLocaleString("en-US"));
  const TILES = [
    "bg-[#E8F4EC] text-[#0B6B2E]", "bg-[#FFF4E0] text-[#B45309]", "bg-[#E6F6F1] text-[#047857]",
    "bg-[#FDECEC] text-[#B91C1C]", "bg-[#F1F2F6] text-[#334155]",
  ];

  return (
    <AdminShell>
      <AdminPageHeader
        title={`Welcome back${user?.firstName ? `, ${user.firstName}` : ""}`}
        subtitle="Your administrative control panel. Select a section to get started."
        actions={
          <>
            {user?.role ? <span className="yp-tag">{user.role.replace('_', ' ')}</span> : null}
            <Button variant="outline" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </>
        }
      />

      {/* Quick Stats */}
      <PermissionGate permissions={["analytics_read"]}>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: "Registered users", value: nf(stats?.totalUsers), sub: `${nf(stats?.verifiedUsers)} verified` },
            { label: "Businesses", value: nf(stats?.totalBusinesses), sub: `${nf(stats?.verifiedBusinesses)} verified` },
            { label: "Reviews", value: nf(stats?.totalReviews), sub: `${nf(stats?.pendingReviews)} pending` },
          ].map((k) => (
            <div key={k.label} className="yp-card flex flex-col gap-2.5 p-[22px]">
              <span className="text-sm text-[#5B6475]">{k.label}</span>
              <span className="text-[34px] font-bold leading-none tracking-[-0.04em]">{k.value}</span>
              <span className="text-[13px] text-[#5B6475]">{k.sub}</span>
            </div>
          ))}
          <div className="flex flex-col gap-2.5 rounded-[20px] border border-[#FBE3B5] bg-[#FFF8EB] p-[22px]">
            <span className="text-sm text-[#7C4A03]">Needs review</span>
            <span className="text-[34px] font-bold leading-none tracking-[-0.04em]">{nf(stats?.pendingBusinesses)}</span>
            <span className="text-[13px] text-[#7C4A03]">Pending listings</span>
          </div>
        </div>
      </PermissionGate>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dashboardCards.map((card, i) => (
          <PermissionGate key={card.title} permissions={[card.permission]}>
            <div className="yp-card yp-card-link flex h-full flex-col gap-4 p-6">
              <div className="flex items-center gap-3">
                <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-[14px] ${TILES[i % TILES.length]}`}>
                  <card.icon className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-semibold tracking-[-0.02em]">{card.title}</h2>
              </div>
              <p className="text-[#4B5565]">{card.description}</p>
              <Button onClick={() => setLocation(card.route)} className="mt-auto w-full" variant="outline">
                Access {card.title}
              </Button>
            </div>
          </PermissionGate>
        ))}
      </div>

      {/* Recent Activity */}
      <PermissionGate permissions={["analytics_read"]}>
        <section className="yp-card p-6">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold tracking-[-0.02em]">
            <Bell className="w-5 h-5 text-[#5B6475]" />
            Recent activity
          </h2>
          {auditLogs.length === 0 ? (
            <p className="py-4 text-sm text-[#5B6475]">No admin activity recorded yet.</p>
          ) : auditLogs.slice(0, 6).map((log: any) => (
            <div key={log.id} className="flex gap-3 border-b border-[#EEF0F4] py-2.5 last:border-b-0">
              <span className="mt-[7px] h-2 w-2 shrink-0 rounded-full bg-[#0B6B2E]" />
              <p className="text-sm text-[#3A4354]">
                <span className="font-semibold text-[#0A0A0A]">{log.adminEmail || log.adminId || "Admin"}</span>{" "}
                {log.description || [log.action, log.targetType].filter(Boolean).join(" ")}
              </p>
              <span className="ml-auto shrink-0 text-xs text-[#5B6475]">
                {log.createdAt ? new Date(log.createdAt).toLocaleDateString("en-AE", { day: "numeric", month: "short" }) : ""}
              </span>
            </div>
          ))}
        </section>
      </PermissionGate>
    </AdminShell>
  );
}
