import { dateLocale } from "@shared/i18n";
import { LanguagePreference } from "@/components/language-switch";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import SEO from "@/components/seo";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { PersonalizedDashboard } from "@/components/personalized-dashboard";
import BusinessMentorChatbot from "@/components/business-mentor-chatbot";
import { useLocation } from "wouter";
import { SubscriptionChecker } from "@/components/subscription-checker";
import { SubscriptionUpgradeModal } from "@/components/subscription-upgrade-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DashboardStatsSkeleton, PageTransitionLoader } from "@/components/loading";
import { usePageTransition } from "@/hooks/use-loading";
import { 
  Building, 
  Plus, 
  Eye, 
  Star, 
  MapPin, 
  Phone, 
  Globe,
  Calendar,
  Users,
  MessageCircle,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Crown,
  LayoutDashboard,
  BarChart3,
  FileText,
  Menu,
  X,
  Home,
  Settings,
  Bell,
  Shield,
  BookOpen,
  Target,
  CreditCard,
  UserPlus,
  Search,
  ChevronRight,
  ChevronDown,
  Gift,
  Video,
  Download,
  Zap,
  Inbox,
  ShieldCheck
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { OwnerSidebar, OwnerTopBar, CountBadge, OwnerPill, useOwnerLeads } from "@/components/owner-shell";
import { fmtDate } from "@/components/phase1/api";
import { country, localize } from "@shared/country";
import { t as tx } from "@shared/i18n";
import { tj } from "@/i18n-jsx/tj";


const businessSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  shortDescription: z.string().min(10, "Short description must be at least 10 characters"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  categoryId: z.number().min(1, "Category is required"),
  provinceId: z.number().min(1, `${country.regionTerm.singular} is required`),
  localityId: z.number().min(1, "Locality is required"),
  email: z.string().email("Valid email is required").optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().url("Valid website URL required").optional().or(z.literal("")),
  address: z.string().min(1, "Address is required"),
  locality: z.string().min(1, "Locality is required"),
  establishedYear: z.number().optional(),
  employeeCount: z.string().optional(),
});

const claimSchema = z.object({
  businessId: z.number().min(1, "Business selection is required"),
  notes: z.string().min(10, "Please provide details about your claim"),
});

export default function Dashboard() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [showPersonalizedDashboard, setShowPersonalizedDashboard] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const { isTransitioning, startTransition } = usePageTransition();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<string>("limit");
  const [greeting, setGreeting] = useState("Welcome back");
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
  }, []);
  const { data: ownerLeads, isSuccess: leadsLoaded } = useOwnerLeads(isAuthenticated);

  // Sidebar menu configuration
  const sidebarMenus = [
    {
      id: 'overview',
      title: 'Overview',
      icon: Home,
      action: () => setActiveTab('overview')
    },
    {
      id: 'business',
      title: 'Business Management',
      icon: Building,
      submenu: [
        {
          id: 'businesses',
          title: 'My Businesses',
          icon: Building,
          action: () => setActiveTab('businesses')
        },
        {
          id: 'add-business',
          title: 'Add New Business',
          icon: Plus,
          action: () => setLocation('/pricing')
        },
        {
          id: 'claims',
          title: 'Business Claims',
          icon: MessageCircle,
          action: () => setActiveTab('claims')
        }
      ]
    },
    {
      id: 'free-resources',
      title: 'Free Resources',
      icon: Gift,
      submenu: [
        {
          id: 'video-pitch',
          title: '60s Pitch Generator',
          icon: Video,
          action: () => setLocation('/video-pitch-generator')
        },
        {
          id: 'business-templates',
          title: 'Business Templates',
          icon: FileText,
          action: () => setActiveTab('templates')
        },
        {
          id: 'marketing-tools',
          title: 'Marketing Tools',
          icon: Zap,
          action: () => setActiveTab('marketing-tools')
        }
      ]
    },
    {
      id: 'analytics',
      title: 'Analytics & Reports',
      icon: BarChart3,
      submenu: [
        {
          id: 'business-insights',
          title: 'Business Insights',
          icon: TrendingUp,
          action: () => setActiveTab('business-insights')
        },
        {
          id: 'performance',
          title: 'Performance Metrics',
          icon: Target,
          action: () => setActiveTab('performance')
        },
        {
          id: 'reports',
          title: 'Advanced Reports',
          icon: FileText,
          action: () => setActiveTab('reports')
        }
      ]
    },
    {
      id: 'premium',
      title: 'Premium Services',
      icon: Crown,
      submenu: [
        {
          id: 'upgrade',
          title: 'Upgrade to Premium',
          icon: CreditCard,
          action: () => setActiveTab('upgrade')
        },
        {
          id: 'billing',
          title: 'Billing & Invoices',
          icon: FileText,
          action: () => setActiveTab('billing')
        }
      ]
    },
    {
      id: 'account',
      title: 'Account Settings',
      icon: Settings,
      submenu: [
        {
          id: 'preferences',
          title: 'User Preferences',
          icon: Users,
          action: () => setActiveTab('preferences')
        },
        {
          id: 'notifications',
          title: 'Notifications',
          icon: Bell,
          action: () => setActiveTab('notifications')
        },
        {
          id: 'security',
          title: 'Security & Privacy',
          icon: Shield,
          action: () => setActiveTab('security')
        }
      ]
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: BookOpen,
      submenu: [
        {
          id: 'help-center',
          title: 'Help Center',
          icon: BookOpen,
          action: () => setLocation('/help-center')
        },
        {
          id: 'contact-support',
          title: 'Contact Support',
          icon: MessageCircle,
          action: () => setLocation('/contact-us')
        }
      ]
    }
  ];

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access your dashboard.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  // Check onboarding status and redirect new users only once
  useEffect(() => {
    if (user && !authLoading && isAuthenticated) {
      // Only redirect to onboarding if user hasn't completed it AND it's their first time
      if (!user.onboardingCompleted) {
        setLocation('/onboarding');
      }
    }
  }, [user, authLoading, isAuthenticated, setLocation]);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/dashboard-fresh'],
    retry: false,
    staleTime: 0,
    gcTime: 0, // Updated from cacheTime in TanStack Query v5
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  const { data: provinces = [] } = useQuery({
    queryKey: ['/api/provinces'],
  });

  const [selectedProvince, setSelectedProvince] = useState<number | null>(null);

  const { data: localities = [] } = useQuery({
    queryKey: ['/api/localities', selectedProvince],
    enabled: !!selectedProvince,
  });

  const { data: unclaimedBusinesses = [] } = useQuery({
    queryKey: ['/api/businesses', { isClaimed: false, limit: 50 }],
  });

  const businessForm = useForm({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      name: "",
      shortDescription: "",
      description: "",
      categoryId: 0,
      provinceId: 0,
      localityId: 0,
      email: "",
      phone: "",
      website: "",
      address: "",
      locality: "",
      establishedYear: new Date().getFullYear(),
      employeeCount: "",
    },
  });

  const claimForm = useForm({
    resolver: zodResolver(claimSchema),
    defaultValues: {
      businessId: 0,
      notes: "",
    },
  });

  const createBusinessMutation = useMutation({
    mutationFn: async (data: z.infer<typeof businessSchema>) => {
      await apiRequest('/api/businesses', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      businessForm.reset();
      toast({
        title: "Business created",
        description: "Your business has been added successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create business. Please try again.",
        variant: "destructive",
      });
    },
  });

  const claimBusinessMutation = useMutation({
    mutationFn: async (data: z.infer<typeof claimSchema>) => {
      await apiRequest('/api/business-claims', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      claimForm.reset();
      toast({
        title: "Claim submitted",
        description: "Your business claim has been submitted for review.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to submit claim. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F3]">
        <Header />
        <div className="yp-wrap py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-[#EEF0F4] rounded-xl w-1/3 mb-6"></div>
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-[#EEF0F4] rounded-[20px]"></div>
              ))}
            </div>
            <div className="h-96 bg-[#EEF0F4] rounded-[20px]"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const businesses = dashboardData?.businesses || [];
  const claims = dashboardData?.claims || [];
  const stats = dashboardData?.stats || {};

  // ---- Derived, real-data-only figures for the overview ----
  const primary: any = businesses[0];
  const leadList: any[] = Array.isArray(ownerLeads) ? ownerLeads : [];
  const newLeads = leadList.filter((l) => l.status === "new").length;
  const totalViews = businesses.reduce((s: number, b: any) => s + (Number(b.viewCount) || 0), 0);
  const ratingCount = businesses.reduce((s: number, b: any) => s + (Number(b.ratingCount) || 0), 0);
  const ratingAvg = ratingCount
    ? businesses.reduce((s: number, b: any) => s + (Number(b.ratingAverage) || 0) * (Number(b.ratingCount) || 0), 0) / ratingCount
    : 0;
  const verifiedCount = businesses.filter((b: any) => b.isVerified).length;
  const allPremium = businesses.length > 0 && businesses.every((b: any) => b.isPremium);

  const completeness = primary
    ? [
        { ok: !!primary.description && String(primary.description).length >= 50, label: "a full description" },
        { ok: !!primary.phone, label: "a phone number" },
        { ok: !!primary.email, label: "an email address" },
        { ok: !!primary.website, label: "your website" },
        { ok: !!(primary.logoUrl || primary.logo), label: "a logo" },
        { ok: Array.isArray(primary.images) && primary.images.length > 0, label: "photos" },
        { ok: !!primary.workingHours && Object.keys(primary.workingHours || {}).length > 0, label: "opening hours" },
        { ok: !!primary.address, label: "your address" },
      ]
    : [];
  const completePct = completeness.length ? Math.round((completeness.filter((c) => c.ok).length / completeness.length) * 100) : 0;
  const missing = completeness.filter((c) => !c.ok).map((c) => c.label);

  const kpis: { label: string; value: string; delta?: string }[] = [];
  if (businesses.length > 0) kpis.push({ label: "Profile views", value: totalViews.toLocaleString(), delta: `across ${businesses.length} listing${businesses.length === 1 ? "" : "s"}` });
  if (leadsLoaded) kpis.push({ label: "Quote requests", value: leadList.length.toLocaleString(), delta: newLeads ? `${newLeads} new` : undefined });
  if (ratingCount > 0) kpis.push({ label: "Average rating", value: ratingAvg.toFixed(1), delta: `${ratingCount} review${ratingCount === 1 ? "" : "s"}` });
  kpis.push({ label: "Businesses", value: String(stats.totalBusinesses || 0), delta: businesses.length ? `${verifiedCount} verified` : undefined });
  kpis.push({ label: "Claims", value: String(stats.totalClaims || 0), delta: stats.pendingClaims ? `${stats.pendingClaims} pending` : undefined });

  const viewsChart = businesses.map((b: any) => ({ name: b.name, views: Number(b.viewCount) || 0 }));

  const ownerLinks = [
    { href: "/my-leads", title: "Quote requests", icon: Inbox, badge: newLeads },
    { href: "/my-profile", title: "Profile content", icon: FileText },
    { href: "/my-verification", title: "Verification", icon: ShieldCheck },
    { href: "/my-plan", title: "Plan & billing", icon: CreditCard },
  ];

  const tile = "grid h-10 w-10 shrink-0 place-items-center rounded-xl";

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#0A0A0A]">
      <SEO
        title="Business Dashboard - Manage Your Pakistani Business Listings | PakistanYP"
        description="Manage your business listings, track performance, view analytics, and handle customer reviews from your PakistanYP business dashboard. Monitor your Pakistani business presence."
        keywords="business dashboard Pakistan, manage business listings, business analytics Pakistan, PakistanYP dashboard"
        canonical="https://pakistanyp.com/dashboard"
        ogTitle="Business Dashboard - Manage Your Pakistani Business Listings"
        schemaType="WebPage"
      />

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <OwnerSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} showUpgrade={!allPremium} label="Dashboard sections">
          {sidebarMenus.map((menu) => (
            <div key={menu.id} className="contents">
              {menu.submenu ? (
                <div>
                  <button
                    type="button"
                    className="yp-side-link"
                    aria-expanded={expandedMenus.includes(menu.id)}
                    data-active={menu.submenu.some((s) => s.id === activeTab) ? "true" : undefined}
                    onClick={() => toggleMenu(menu.id)}
                  >
                    <menu.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                    <span className="flex-1 truncate">{menu.title}</span>
                    {expandedMenus.includes(menu.id) ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-[#5B6475]" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-[#5B6475]" />
                    )}
                  </button>

                  {expandedMenus.includes(menu.id) && (
                    <div className="mt-1 ms-4 flex flex-col gap-1 border-s border-[#E7E9EE] ps-2">
                      {menu.submenu.map((subitem) => (
                        <button
                          key={subitem.id}
                          type="button"
                          className="yp-side-link !min-h-[40px] !text-[13.5px]"
                          data-active={activeTab === subitem.id && !showPersonalizedDashboard ? "true" : undefined}
                          onClick={() => {
                            subitem.action();
                            setShowPersonalizedDashboard(false);
                            setSidebarOpen(false);
                          }}
                        >
                          <subitem.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                          <span className="truncate">{subitem.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  className="yp-side-link"
                  data-active={activeTab === menu.id && !showPersonalizedDashboard ? "true" : undefined}
                  onClick={() => {
                    menu.action();
                    setShowPersonalizedDashboard(false);
                    setSidebarOpen(false);
                  }}
                >
                  <menu.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                  <span>{menu.title}</span>
                </button>
              )}
              {menu.id === "overview" && ownerLinks.map((l) => (
                <a key={l.href} href={l.href}>
                  <l.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                  <span className="truncate">{l.title}</span>
                  {l.badge ? <CountBadge n={l.badge} /> : null}
                </a>
              ))}
            </div>
          ))}
        </OwnerSidebar>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <OwnerTopBar onMenu={() => setSidebarOpen(true)} newLeads={newLeads} />

          <main className="flex flex-col gap-6 px-4 pb-14 pt-8 sm:px-[clamp(20px,3vw,40px)]">
            {/* Greeting */}
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-[28px] font-bold leading-tight tracking-[-0.04em] sm:text-[32px]">
                  {greeting}{user?.firstName ? `, ${user.firstName}` : ""}
                </h1>
                <p className="mt-1.5 text-[15px] text-[#5B6475]">
                  {primary
                    ? tx("Here’s how {0} doing on {1}.", businesses.length > 1 ? "your listings are" : `${primary.name} is`, country.brand)
                    : "Manage your business listings and track performance."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {primary?.slug && <a className="yp-btn yp-btn-ghost" href={`/business/${primary.slug}`}>View public profile</a>}
                {primary ? (
                  <button type="button" className="yp-btn yp-btn-primary" onClick={() => setLocation(`/add-business-enhanced?edit=${primary.id}`)}>
                    <Edit className="h-4 w-4" /> Edit listing
                  </button>
                ) : (
                  <button type="button" className="yp-btn yp-btn-primary" onClick={() => setLocation("/pricing")}>
                    <Plus className="h-4 w-4" /> Add your business
                  </button>
                )}
              </div>
            </div>

            {/* View switch */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex gap-1 rounded-xl bg-[#F1F2F6] p-1" role="group" aria-label="Dashboard view">
                <button
                  type="button"
                  onClick={() => setShowPersonalizedDashboard(false)}
                  aria-pressed={!showPersonalizedDashboard}
                  className={`inline-flex min-h-[36px] items-center gap-2 rounded-[9px] px-3 text-sm font-semibold ${!showPersonalizedDashboard ? "bg-white text-[#0A0A0A] shadow-sm" : "text-[#5B6475] hover:text-[#0A0A0A]"}`}
                >
                  <Building className="h-4 w-4" /> Standard View
                </button>
                <button
                  type="button"
                  onClick={() => setShowPersonalizedDashboard(true)}
                  aria-pressed={showPersonalizedDashboard}
                  className={`inline-flex min-h-[36px] items-center gap-2 rounded-[9px] px-3 text-sm font-semibold ${showPersonalizedDashboard ? "bg-white text-[#0A0A0A] shadow-sm" : "text-[#5B6475] hover:text-[#0A0A0A]"}`}
                >
                  <BarChart3 className="h-4 w-4" /> Analytics Dashboard
                </button>
              </div>
              <button type="button" onClick={() => window.location.href = '/advanced-reporting'} className="yp-btn yp-btn-ghost !min-h-[44px]">
                <FileText className="h-4 w-4" /> Advanced Reports
              </button>
            </div>

            {showPersonalizedDashboard ? (
              <PersonalizedDashboard />
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="hidden">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="businesses">My Businesses</TabsTrigger>

                    <TabsTrigger value="claims">Claims</TabsTrigger>
                    <TabsTrigger value="preferences">Preferences</TabsTrigger>
                  </TabsList>
                </div>

          <TabsContent value="overview" className="mt-0 flex flex-col gap-6">
            {/* Profile completeness */}
            {primary && completePct < 100 && (
              <section className="flex flex-wrap items-center gap-6 rounded-[20px] border border-[#CFE8D8] bg-[#F2F9F4] px-6 py-5">
                <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-2.5">
                  <span className="font-semibold">{tj("Your profile is {0}% complete", completePct)}</span>
                  <div className="h-2 rounded-full bg-[#CFE8D8]" role="progressbar" aria-valuenow={completePct} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completeness">
                    <div className="h-full rounded-full bg-[#0B6B2E]" style={{ width: `${completePct}%` }} />
                  </div>
                  <span className="text-sm text-[#3A4354]">{tj("Add {0}{1} to {2} to rank higher.", missing.slice(0, 3).join(", "), missing.length > 3 ? " and more" : "", primary.name)}</span>
                </div>
                <button type="button" className="yp-btn yp-btn-ghost" onClick={() => setLocation(`/add-business-enhanced?edit=${primary.id}`)}>Finish profile</button>
              </section>
            )}

            {/* KPI cards */}
            {authLoading || isTransitioning ? (
              <DashboardStatsSkeleton />
            ) : (
              <section className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]" aria-label="Key numbers">
                {kpis.map((k) => (
                  <div key={k.label} className="yp-card flex flex-col gap-2.5 p-[22px]">
                    <span className="text-sm text-[#5B6475]">{k.label}</span>
                    <span className="text-[34px] font-bold leading-none tracking-[-0.04em]">{k.value}</span>
                    {k.delta && <span className="text-[13px] font-semibold text-[#047857]">{k.delta}</span>}
                  </div>
                ))}
              </section>
            )}

            {/* Chart + verification */}
            {businesses.length > 0 && (
              <div className="flex flex-wrap gap-6">
                <section className="yp-card min-w-0 flex-[2_1_520px] p-6">
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold tracking-[-0.02em]">Profile views by listing</h2>
                    <span className="yp-label">All time</span>
                  </div>
                  <div className="h-[220px]" role="img" aria-label={tx("Profile views per listing, {0} in total", totalViews.toLocaleString())}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={viewsChart} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                        <CartesianGrid vertical={false} stroke="#EEF0F4" />
                        <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: "#E7E9EE" }} tick={{ fill: "#5B6475", fontSize: 12 }} interval={0} tickFormatter={(v: string) => (v.length > 14 ? v.slice(0, 13) + "…" : v)} />
                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#5B6475", fontSize: 12 }} />
                        <Tooltip cursor={{ fill: "#F2F9F4" }} contentStyle={{ borderRadius: 12, border: "1px solid #E7E9EE", fontSize: 13 }} />
                        <Bar dataKey="views" name="Views" fill="#0B6B2E" radius={[6, 6, 0, 0]} maxBarSize={56} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>
                <section className="yp-card flex flex-[1_1_300px] flex-col gap-4 p-6">
                  <h2 className="text-lg font-semibold tracking-[-0.02em]">Verification</h2>
                  {businesses.slice(0, 4).map((b: any) => (
                    <div key={b.id} className="flex items-center gap-3">
                      <span className={`${tile} ${b.isVerified ? "bg-[#E6F6F1] text-[#047857]" : "bg-[#FFF4E0] text-[#B45309]"}`} aria-hidden="true">
                        {b.isVerified ? <ShieldCheck className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{b.name}</span>
                        <span className={`block text-[13px] ${b.isVerified ? "text-[#5B6475]" : "text-[#B45309]"}`}>{b.isVerified ? "Verified" : "Not verified yet"}</span>
                      </span>
                      {!b.isVerified && <a href={`/my-verification?business=${b.id}`} className="text-sm font-semibold text-[#0B6B2E] hover:text-[#05501F]">Get verified</a>}
                    </div>
                  ))}
                  {stats.pendingClaims > 0 && (
                    <div className="flex items-center gap-3">
                      <span className={`${tile} bg-[#FFF4E0] text-[#B45309]`} aria-hidden="true"><MessageCircle className="h-5 w-5" /></span>
                      <span>
                        <span className="block font-semibold">Business claims</span>
                        <span className="block text-[13px] text-[#B45309]">{tj("{0} in review", stats.pendingClaims)}</span>
                      </span>
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* Latest quote requests */}
            {leadList.length > 0 && (
              <section className="yp-card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
                  <h2 className="text-lg font-semibold tracking-[-0.02em]">Latest quote requests</h2>
                  <a href="/my-leads" className="text-sm font-semibold text-[#0B6B2E] hover:text-[#05501F]">View all leads →</a>
                </div>
                <div className="overflow-x-auto">
                  <table className="yp-table min-w-[640px]">
                    <thead><tr><th>Customer</th><th>Service</th><th>Received</th><th>Status</th><th><span className="sr-only">Action</span></th></tr></thead>
                    <tbody>
                      {leadList.slice(0, 5).map((l: any) => (
                        <tr key={l.id}>
                          <td className="font-semibold">{l.contactLocked ? `${String(l.name || "").split(" ")[0]} …` : l.name}</td>
                          <td>{l.service_needed || "Quote request"}</td>
                          <td className="text-[#5B6475]">{fmtDate(l.created_at)}</td>
                          <td><OwnerPill value={l.status} /></td>
                          <td className="text-end"><a className="yp-btn yp-btn-ghost !min-h-[36px]" href="/my-leads">Reply</a></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Subscription Checker */}
            <SubscriptionChecker
              checkType="business"
              onUpgrade={() => {
                setUpgradeReason("limit");
                setShowUpgradeModal(true);
              }}
            />

            <div className="grid md:grid-cols-2 gap-6">
              <section className="yp-card p-6">
                <h2 className="mb-4 text-lg font-semibold tracking-[-0.02em]">Recent Activity</h2>
                {businesses.length > 0 ? (
                  <div>
                    {businesses.slice(0, 5).map((business: any) => (
                      <div key={business.id} className="flex items-center justify-between gap-3 border-b border-[#EEF0F4] py-3 last:border-b-0">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{business.name}</p>
                          <p className="text-sm text-[#5B6475]">{tj("{0} views", business.viewCount)}</p>
                        </div>
                        <OwnerPill value={business.isVerified ? "verified" : "pending"} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-[14px] bg-[#E8F4EC] text-[#0B6B2E]"><Building className="h-6 w-6" /></span>
                    <p className="text-[#5B6475]">No businesses yet</p>
                  </div>
                )}
              </section>

              <section className="yp-card flex flex-col gap-3 p-6">
                <h2 className="mb-1 text-lg font-semibold tracking-[-0.02em]">Quick Actions</h2>
                <a className="yp-btn yp-btn-ghost w-full" href="/my-leads">Quote requests (leads)</a>
                <a className="yp-btn yp-btn-ghost w-full" href="/my-verification">Get verified badge</a>
                <a className="yp-btn yp-btn-ghost w-full" href="/my-plan">Membership &amp; upgrades</a>
                <a className="yp-btn yp-btn-ghost w-full" href="/my-profile">Prices, portfolio, team &amp; FAQs</a>
                <button type="button" onClick={() => setActiveTab("add-business")} className="yp-btn yp-btn-primary w-full">
                  <Plus className="w-4 h-4" />
                  Add New Business
                </button>
                <button type="button" onClick={() => setActiveTab("claims")} className="yp-btn yp-btn-ghost w-full">
                  <MessageCircle className="w-4 h-4" />
                  Claim Existing Business
                </button>
              </section>
            </div>
          </TabsContent>

          <TabsContent value="businesses" className="mt-0 space-y-6">
            <h2 className="text-xl font-bold tracking-[-0.03em]">My Businesses</h2>
            {businesses.length > 0 ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {businesses.map((business: any) => (
                  <div key={business.id} className="yp-card yp-card-link flex flex-col p-6">
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                      <h3 className="text-lg font-semibold tracking-[-0.02em]">{business.name}</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {business.isPremium && (
                          <span className="yp-pill bg-[#FDECEC] text-[#B3141B]"><Crown className="me-1 h-3 w-3" />Premium</span>
                        )}
                        {business.isVerified && <span className="yp-verified"><ShieldCheck className="h-3 w-3" />Verified</span>}
                        {business.isFeatured && <span className="yp-pill bg-[#E8F4EC] text-[#05501F]">Featured</span>}
                      </div>
                    </div>

                    <div className="mb-3 flex items-center">
                      <div className="me-2 flex text-sm">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < Math.floor(business.ratingAverage) ? "fill-[#F59E0B] text-[#F59E0B]" : "text-[#DDE1E8]"}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-[#5B6475]">{tj("{0} ({1} reviews)", business.ratingAverage, business.ratingCount)}</span>
                    </div>

                    <div className="mb-4 flex items-center text-sm text-[#5B6475]">
                      <MapPin className="me-1 h-4 w-4" />
                      <span>{business.locality}</span>
                    </div>

                    <div className="mt-auto space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-[#5B6475]">
                          <Eye className="me-1 h-4 w-4" />
                          <span>{tj("{0} views", business.viewCount)}</span>
                        </div>
                        <button
                          type="button"
                          className="yp-btn yp-btn-ghost !min-h-[38px] !px-3"
                          onClick={() => setLocation(`/add-business-enhanced?edit=${business.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                          Manage
                        </button>
                      </div>

                      {!business.isPremium && (
                        <button
                          type="button"
                          className="yp-btn yp-btn-red w-full"
                          onClick={() => setLocation(`/upgrade-premium?businessId=${business.id}`)}
                        >
                          <Crown className="h-4 w-4" />
                          Upgrade to Premium
                        </button>
                      )}

                      {business.isPremium && business.premiumExpiresAt && (
                        <div className="rounded-xl bg-[#F2F9F4] p-2 text-center text-xs text-[#05501F]">
                          <Crown className="me-1 inline h-3 w-3" />{tj("Premium until {0}", new Date(business.premiumExpiresAt).toLocaleDateString(dateLocale()))}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="yp-card px-6 py-12 text-center">
                <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-[14px] bg-[#E8F4EC] text-[#0B6B2E]"><Building className="h-6 w-6" /></span>
                <h3 className="mb-2 text-xl font-semibold tracking-[-0.02em]">No businesses yet</h3>
                <p className="mb-6 text-[#5B6475]">{localize("Start building your business presence on Pakistani Directory")}</p>
                <button type="button" onClick={() => setLocation("/pricing")} className="yp-btn yp-btn-primary">
                  <Plus className="h-4 w-4" />
                  Add Your First Business
                </button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="claims" className="mt-0 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <section className="yp-card p-6">
                <h2 className="mb-5 text-lg font-semibold tracking-[-0.02em]">Claim Existing Business</h2>
                  <Form {...claimForm}>
                    <form onSubmit={claimForm.handleSubmit((data) => claimBusinessMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={claimForm.control}
                        name="businessId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Select Business</FormLabel>
                            <FormControl>
                              <Select value={field.value.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Search for your business" />
                                </SelectTrigger>
                                <SelectContent>
                                  {unclaimedBusinesses.businesses?.slice(0, 20).map((business: any) => (
                                    <SelectItem key={business.id} value={business.id.toString()}>
                                      {business.name} - {business.locality}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={claimForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Claim Details</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Explain why you're claiming this business and provide any supporting information"
                                rows={4}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <button
                        type="submit"
                        className="yp-btn yp-btn-primary"
                        disabled={claimBusinessMutation.isPending}
                      >
                        {claimBusinessMutation.isPending ? 'Submitting...' : 'Submit Claim'}
                      </button>
                    </form>
                  </Form>
              </section>

              <section className="yp-card p-6">
                <h2 className="mb-5 text-lg font-semibold tracking-[-0.02em]">My Claims</h2>
                  {claims.length > 0 ? (
                    <div className="space-y-3">
                      {claims.map((claim: any) => (
                        <div key={claim.id} className="yp-panel p-4">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="font-medium">{tj("Business Claim #{0}", claim.id)}</p>
                            <span className="inline-flex items-center gap-1">
                              {claim.status === 'approved' && <CheckCircle className="h-3.5 w-3.5 text-[#047857]" />}
                              {claim.status === 'rejected' && <XCircle className="h-3.5 w-3.5 text-[#B91C1C]" />}
                              {claim.status === 'pending' && <AlertCircle className="h-3.5 w-3.5 text-[#B45309]" />}
                              <OwnerPill value={claim.status} />
                            </span>
                          </div>
                          <p className="mb-2 text-sm text-[#3A4354]">{claim.notes}</p>
                          <p className="text-xs text-[#5B6475]">{tj("Submitted: {0}", new Date(claim.createdAt).toLocaleDateString(dateLocale()))}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-[14px] bg-[#F1F2F6] text-[#334155]"><MessageCircle className="h-6 w-6" /></span>
                      <p className="text-[#5B6475]">No claims submitted yet</p>
                    </div>
                  )}
              </section>
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="mt-0 space-y-6">
            <section className="yp-card p-6 sm:p-8">
              <h2 className="text-xl font-bold tracking-[-0.03em]">Account Preferences</h2>
              <p className="mt-1 text-sm text-[#5B6475]">Update your profile and preferences</p>
              <div className="mt-6 space-y-8">
                <div className="space-y-4">
                  <h3 className="yp-label">Profile Information</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="yp-field">
                      First Name
                      <Input value={user?.firstName || ''} disabled />
                    </label>
                    <label className="yp-field">
                      Last Name
                      <Input value={user?.lastName || ''} disabled />
                    </label>
                    <label className="yp-field sm:col-span-2">
                      Email
                      <Input value={user?.email || ''} disabled />
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="yp-label">Business Preferences</h3>
                  <div className="space-y-4">
                    <div className="yp-field">
                      <Label>Business Role</Label>
                      <Select disabled value="consumer">
                        <SelectTrigger>
                          <SelectValue placeholder="Your role..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="consumer">Consumer</SelectItem>
                          <SelectItem value="business_owner">Business Owner</SelectItem>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="investor">Investor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="yp-field">
                      <Label>{localize("Preferred Provinces")}</Label>
                      <div className="flex flex-wrap gap-2">
                        {provinces.slice(0, 3).map((province: any) => (
                          <span key={province.id} className="yp-tag">{province.name}</span>
                        ))}
                      </div>
                    </div>

                    <div className="yp-field">
                      <Label>Interested Categories</Label>
                      <div className="flex flex-wrap gap-2">
                        {categories.slice(0, 4).map((category: any) => (
                          <span key={category.id} className="yp-tag yp-tag-green">{category.name}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <LanguagePreference />

                <div className="space-y-4">
                  <h3 className="yp-label">Notification Settings</h3>
                  <div className="space-y-3">
                    <div className="yp-panel flex items-center justify-between gap-4 p-4">
                      <div>
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-[#5B6475]">Receive updates via email</p>
                      </div>
                      <input type="checkbox" defaultChecked className="toggle h-4 w-4 accent-[#0B6B2E]" disabled />
                    </div>
                    <div className="yp-panel flex items-center justify-between gap-4 p-4">
                      <div>
                        <Label>Business Recommendations</Label>
                        <p className="text-sm text-[#5B6475]">Get personalized business suggestions</p>
                      </div>
                      <input type="checkbox" defaultChecked className="toggle h-4 w-4 accent-[#0B6B2E]" disabled />
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#EEF0F4] pt-5">
                  <button
                    type="button"
                    onClick={() => setLocation('/onboarding')}
                    className="yp-btn yp-btn-ghost"
                  >
                    Update Preferences
                  </button>
                  <p className="mt-2 text-xs text-[#5B6475]">
                    Click "Update Preferences" to modify your settings through the setup wizard
                  </p>
                </div>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="templates" className="mt-0 space-y-6">
            <section className="yp-card p-6 sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-bold tracking-[-0.03em]">Business Templates</h2>
              <p className="mt-1 text-sm text-[#5B6475]">Free templates to help grow your business</p>
              <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { t: "Business Plan Template", d: localize("Professional business plan template for Pakistan businesses") },
                  { t: "Marketing Proposal", d: "Ready-to-use marketing proposal template" },
                  { t: "Invoice Template", d: localize("Professional invoice template for Pakistan businesses") },
                ].map((x) => (
                  <div key={x.t} className="yp-panel flex flex-col items-start gap-3 p-6">
                    <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-[#E8F4EC] text-[#0B6B2E]"><FileText className="h-6 w-6" /></span>
                    <h3 className="font-semibold">{x.t}</h3>
                    <p className="text-sm text-[#5B6475]">{x.d}</p>
                    <button type="button" className="yp-btn yp-btn-ghost !min-h-[40px]" disabled>
                      <Download className="h-4 w-4" />
                      Coming Soon
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="marketing-tools" className="mt-0 space-y-6">
            <section className="yp-card p-6 sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-bold tracking-[-0.03em]">Marketing Tools</h2>
              <p className="mt-1 text-sm text-[#5B6475]">Free marketing tools to promote your business</p>
              <div className="mt-6 grid md:grid-cols-2 gap-4">
                <div className="yp-panel p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-[#E8F4EC] text-[#0B6B2E]"><Video className="h-6 w-6" /></span>
                    <div>
                      <h3 className="font-semibold">60-Second Pitch Generator</h3>
                      <p className="text-sm text-[#5B6475]">Create compelling video pitch scripts</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setLocation('/video-pitch-generator')} className="yp-btn yp-btn-primary w-full">
                    <Video className="h-4 w-4" />
                    Create Pitch Script
                  </button>
                </div>
                {[
                  { t: "Social Media Kit", d: "Ready-to-use social media content", I: Target, c: "bg-[#E6F6F1] text-[#047857]", B: Download },
                  { t: "SEO Checker", d: "Analyze your business SEO performance", I: Search, c: "bg-[#FFF4E0] text-[#B45309]", B: BarChart3 },
                  { t: "Customer Reviews Kit", d: "Tools to collect and manage reviews", I: Users, c: "bg-[#F1F2F6] text-[#334155]", B: MessageCircle },
                ].map((x) => (
                  <div key={x.t} className="yp-panel p-6">
                    <div className="mb-4 flex items-center gap-3">
                      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-[14px] ${x.c}`}><x.I className="h-6 w-6" /></span>
                      <div>
                        <h3 className="font-semibold">{x.t}</h3>
                        <p className="text-sm text-[#5B6475]">{x.d}</p>
                      </div>
                    </div>
                    <button type="button" className="yp-btn yp-btn-ghost w-full" disabled>
                      <x.B className="h-4 w-4" />
                      Coming Soon
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </TabsContent>
                </Tabs>
            )}
          </main>
        </div>
      </div>

      {/* Subscription Upgrade Modal */}
      <SubscriptionUpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        reason={upgradeReason}
      />

      {/* Business Mentor Chatbot */}
      <BusinessMentorChatbot />
    </div>
  );
}
