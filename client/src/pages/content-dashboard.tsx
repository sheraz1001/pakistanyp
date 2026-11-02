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
  FileText,
  PenTool,
  Calendar,
  Globe,
  LogOut,
  Plus,
  Edit,
  Eye,
  Share2,
  TrendingUp,
  Clock,
  CheckCircle
} from "lucide-react";

export default function ContentDashboard() {
  return (
    <AdminProtectedRoute requiredRole="content_manager">
      <ContentDashboardContent />
    </AdminProtectedRoute>
  );
}

function ContentDashboardContent() {
  const { user, logout } = useAdminAuth();
  const [, setLocation] = useLocation();

  const contentSections = [
    {
      title: "Blog Management",
      description: "Create, edit, and manage blog posts",
      icon: PenTool,
      route: "/content/blogs",
      color: "bg-blue-500"
    },
    {
      title: "News Articles",
      description: "Manage news articles and updates",
      icon: FileText,
      route: "/content/news",
      color: "bg-green-500"
    },
    {
      title: "Social Media Content",
      description: "Generate social media posts and content",
      icon: Share2,
      route: "/admin-social-media-generator",
      color: "bg-purple-500"
    },
    {
      title: "Content Calendar",
      description: "Plan and schedule content releases",
      icon: Calendar,
      route: "/content/calendar",
      color: "bg-[#B45309]"
    },
    {
      title: "Categories",
      description: "Manage content categories and tags",
      icon: Globe,
      route: "/content/categories",
      color: "bg-indigo-500"
    },
    {
      title: "Analytics",
      description: "View content performance metrics",
      icon: TrendingUp,
      route: "/content/analytics",
      color: "bg-red-500"
    }
  ];

  const { data: blogPosts = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/blog-posts'],
    queryFn: async () => {
      const response = await fetch('/api/admin/blog-posts', { credentials: 'include' });
      if (!response.ok) return [];
      return response.json();
    },
    retry: false,
  });
  const posts = Array.isArray(blogPosts) ? blogPosts : [];
  const published = posts.filter((p: any) => String(p.status).toLowerCase() === 'published').length;
  const drafts = posts.filter((p: any) => String(p.status || 'draft').toLowerCase() === 'draft').length;
  const scheduled = posts.filter((p: any) => String(p.status).toLowerCase() === 'scheduled').length;
  const TILES = ["bg-[#E8F4EC] text-[#0B6B2E]", "bg-[#E6F6F1] text-[#047857]", "bg-[#FFF4E0] text-[#B45309]", "bg-[#F1F2F6] text-[#334155]", "bg-[#FDECEC] text-[#B91C1C]"];

  return (
    <AdminShell tag="CONTENT">
      <AdminPageHeader
        title={`Welcome${user?.firstName ? `, ${user.firstName}` : ""}`}
        subtitle="Manage all your content creation and publishing from this dashboard."
        actions={
          <>
            <Button onClick={() => setLocation("/create-blog-post")}>
              <Plus className="w-4 h-4 mr-2" />
              New content
            </Button>
            <Button variant="outline" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </>
        }
      />

      {/* Quick Actions */}
      <section className="yp-tint rounded-[24px] p-6">
        <span className="yp-label">Quick actions</span>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button onClick={() => setLocation("/create-blog-post")} variant="outline" className="justify-start">
            <PenTool className="w-4 h-4 mr-2 text-[#0B6B2E]" />
            Write blog post
          </Button>
          <Button onClick={() => setLocation("/create-news-article")} variant="outline" className="justify-start">
            <FileText className="w-4 h-4 mr-2 text-[#0B6B2E]" />
            Create news article
          </Button>
          <Button onClick={() => setLocation("/admin-social-media-generator")} variant="outline" className="justify-start">
            <Share2 className="w-4 h-4 mr-2 text-[#0B6B2E]" />
            Social media post
          </Button>
        </div>
      </section>

      {/* Content Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Blog posts", value: posts.length, icon: FileText },
          { label: "Published", value: published, icon: CheckCircle },
          { label: "Drafts", value: drafts, icon: Clock },
          { label: "Scheduled", value: scheduled, icon: Calendar },
        ].map((k) => (
          <div key={k.label} className="yp-card flex flex-col gap-2.5 p-[22px]">
            <span className="flex items-center gap-2 text-sm text-[#5B6475]"><k.icon className="h-4 w-4" />{k.label}</span>
            <span className="text-[34px] font-bold leading-none tracking-[-0.04em]">{k.value.toLocaleString("en-US")}</span>
          </div>
        ))}
      </div>

      {/* Content Management Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contentSections.map((section, i) => (
          <div key={section.title} className="yp-card yp-card-link flex flex-col gap-4 p-6">
            <div className="flex items-center gap-3">
              <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-[14px] ${TILES[i % TILES.length]}`}>
                <section.icon className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-semibold tracking-[-0.02em]">{section.title}</h2>
            </div>
            <p className="text-[#4B5565]">{section.description}</p>
            <Button onClick={() => setLocation(section.route)} className="mt-auto w-full" variant="outline">
              Manage {section.title}
            </Button>
          </div>
        ))}
      </div>

      {/* Recent Content */}
      <section className="yp-card p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-[-0.02em]">Recent content</h2>
          <Button variant="outline" size="sm" onClick={() => setLocation("/admin")}>
            <Eye className="w-4 h-4 mr-2" />
            View all
          </Button>
        </div>
        {posts.length === 0 ? (
          <p className="py-4 text-sm text-[#5B6475]">No content yet.</p>
        ) : posts.slice(0, 5).map((p: any, i: number) => {
          const st = String(p.status || "draft").toLowerCase();
          return (
            <div key={p.id ?? i} className="flex items-center justify-between gap-3 border-b border-[#EEF0F4] py-3 text-sm last:border-b-0">
              <span className="flex min-w-0 items-center gap-3">
                {st === "published" ? <CheckCircle className="h-5 w-5 shrink-0 text-[#047857]" /> : <Edit className="h-5 w-5 shrink-0 text-[#5B6475]" />}
                <strong className="truncate font-semibold text-[#0A0A0A]">{p.title || "Untitled"}</strong>
              </span>
              <span className={`yp-pill capitalize ${st === "published" ? "bg-[#E6F6F1] text-[#065F46]" : "bg-[#F1F2F6] text-[#334155]"}`}>{st}</span>
            </div>
          );
        })}
      </section>
    </AdminShell>
  );
}
