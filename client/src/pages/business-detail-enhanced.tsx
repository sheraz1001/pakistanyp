import { ProfileExtras } from "@/components/phase1/profile-extras";
import { StructuredReviews } from "@/components/phase1/structured-reviews";
import { QuoteRequestCard } from "@/components/phase1/quote-request";
import { TrustPanel } from "@/components/phase1/trust-panel";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Star, 
  MapPin, 
  Phone, 
  Globe, 
  Clock, 
  Mail, 
  MessageCircle,
  Camera,
  User,
  Award,
  Languages,
  CreditCard,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Building2,
  Users,
  ShieldCheck,
  CheckCircle,
  MapIcon,
  Check,
  ArrowRight
} from "lucide-react";
import Header from "@/components/header";
import SEO, { SEOConfigs } from "@/components/seo";
import Footer from "@/components/footer";
import QuickShareQRCode from "@/components/quick-share-qr-code";
import { breadcrumbLd } from "@/lib/structured-data";
import { Business, BusinessReview, insertBusinessReviewSchema, insertBusinessEnquirySchema } from "@shared/schema";
import { localLang, localDir, country } from "@shared/country";
import { normalizeBusinessPhone, formatBusinessPhone } from "@/components/business-card";

// E.164 tel: link (e.g. tel:+919876543210); falls back to the stored value.
const telHref = (phone: string) => { const d = normalizeBusinessPhone(phone); return /^92\d{9,10}$/.test(d) ? `tel:+${d}` : `tel:${phone}`; };

function formatHours(hours: unknown): string {
  if (typeof hours === "string") return hours || "Not provided";
  if (!hours || typeof hours !== "object") return "Not provided";
  const value = hours as { open?: string; close?: string; closed?: boolean };
  if (value.closed) return "Closed";
  return value.open && value.close ? `${value.open} – ${value.close}` : "Not provided";
}


type HoursValue = { open?: string; close?: string; closed?: boolean };

/** "09:00", "9:00 AM", "21:30" → minutes after midnight (null when unreadable). */
function toMinutes(value?: string): number | null {
  if (!value) return null;
  const m = String(value).trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const ap = m[3]?.toLowerCase();
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  return h > 24 || min > 59 ? null : h * 60 + min;
}

/** Open/closed label in Pakistan time; client-only so SSR and hydration stay identical. */
function openStatus(hours: unknown): { label: string; open: boolean } | null {
  if (!hours || typeof hours !== "object") return null;
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: country.timezone, weekday: "long", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
    const get = (t: string) => parts.find(p => p.type === t)?.value || "";
    const day = get("weekday").toLowerCase();
    const now = parseInt(get("hour"), 10) * 60 + parseInt(get("minute"), 10);
    const entry = Object.entries(hours as Record<string, unknown>).find(([k]) => k.toLowerCase() === day || k.toLowerCase() === day.slice(0, 3))?.[1];
    if (typeof entry === "string") return null;
    const v = entry as HoursValue | undefined;
    if (!v) return null;
    if (v.closed) return { label: "Closed today", open: false };
    const o = toMinutes(v.open), c = toMinutes(v.close);
    if (o == null || c == null) return null;
    const isOpen = c > o ? now >= o && now < c : now >= o || now < c;
    return isOpen ? { label: `Open until ${v.close}`, open: true } : { label: "Closed now", open: false };
  } catch { return null; }
}

function safeImageUrl(value: unknown): string {
  return typeof value === "string" && (/^\/(?!\/)/.test(value) || /^https?:\/\//i.test(value)) ? value : "";
}

/** Photos from the listing's images JSON (strings or {url,type}); logos are left out. */
function listingPhotos(images: unknown, cover?: unknown): string[] {
  const list = Array.isArray(images) ? images : [];
  const urls = list.map((img: any) => {
    if (typeof img === "string") return safeImageUrl(img);
    if (img && typeof img === "object" && img.type !== "logo") return safeImageUrl(img.url || img.src);
    return "";
  });
  return Array.from(new Set([safeImageUrl(cover), ...urls].filter(Boolean)));
}

const reviewSchema = insertBusinessReviewSchema.pick({ title: true, content: true, rating: true }).extend({
  rating: z.string().regex(/^[1-5]$/, "Select a rating").transform((val) => parseInt(val)),
  content: z.string().min(10, "Please share at least 10 characters about your experience."),
});

const enquirySchema = insertBusinessEnquirySchema.omit({ 
  businessId: true, 
  userId: true, 
  createdAt: true 
});

const claimSchema = z.object({
  businessId: z.number(),
  claimType: z.string().min(1, "Please select claim type"),
  contactName: z.string().min(2, "Name must be at least 2 characters"),
  contactEmail: z.string().email("Invalid email address"),
  contactPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  businessRole: z.string().min(1, "Please select your role"),
  additionalInfo: z.string().optional(),
  verificationDocument: z.string().optional()
});

export default function BusinessDetailEnhanced() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showEnquiryDialog, setShowEnquiryDialog] = useState(false);
  const [showClaimDialog, setShowClaimDialog] = useState(false);

  // Check if slug is a number (business ID) or actual slug
  const isBusinessId = !isNaN(Number(slug));
  
  const { data: business, isLoading, isError, refetch } = useQuery<Business>({
    queryKey: ["/api/businesses", slug],
    queryFn: () => {
      if (isBusinessId) {
        return apiRequest('GET', `/api/businesses/${slug}`);
      } else {
        return apiRequest('GET', `/api/businesses/slug/${slug}`);
      }
    },
    enabled: !!slug,
  });

  const { data: reviews = [], isLoading: reviewsLoading, isError: reviewsError, refetch: refetchReviews } = useQuery<BusinessReview[]>({
    queryKey: ["/api/businesses", business?.id, "reviews"],
    queryFn: () => apiRequest("GET", `/api/businesses/${business?.id}/reviews`),
    enabled: !!business?.id,
  });

  // Forms
  const reviewForm = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: "5",
      content: "",
      title: "",
    },
  });

  const enquiryForm = useForm({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  const claimForm = useForm({
    resolver: zodResolver(claimSchema),
    defaultValues: {
      businessId: business?.id || 0,
      claimType: "ownership",
      contactName: user?.username || "",
      contactEmail: user?.email || "",
      contactPhone: "",
      businessRole: "",
      additionalInfo: "",
      verificationDocument: ""
    },
  });

  // Mutations
  const addReviewMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", `/api/businesses/${business?.id}/reviews`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses", business?.id, "reviews"] });
      toast({ title: "Review submitted successfully!" });
      reviewForm.reset();
      setShowReviewDialog(false);
    },
    onError: (error: Error) => {
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
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addEnquiryMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", `/api/businesses/${business?.id}/enquiries`, data);
    },
    onSuccess: () => {
      toast({ title: "Enquiry sent successfully! We'll get back to you soon." });
      enquiryForm.reset();
      setShowEnquiryDialog(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send enquiry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const claimBusinessMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', `/api/business-claims`, data);
    },
    onSuccess: () => {
      toast({ title: "Business claim submitted successfully!", description: "Your claim has been submitted for review." });
      claimForm.reset();
      setShowClaimDialog(false);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You need to be logged in to claim a business.",
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

  const [status, setStatus] = useState<{ label: string; open: boolean } | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  useEffect(() => {
    setStatus(openStatus(business?.workingHours));
  }, [business?.workingHours]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F3]">
        <Header />
        <div className="yp-wrap py-8" role="status" aria-label="Loading business">
          <div className="animate-pulse space-y-6">
            <div className="h-5 bg-[#EEF0F4] rounded-lg w-1/3"></div>
            <div className="h-[220px] bg-[#E8F4EC] rounded-[24px]"></div>
            <div className="h-10 bg-[#EEF0F4] rounded-xl w-1/2"></div>
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6">
              <div className="space-y-4">
                <div className="h-40 bg-white border border-[#E7E9EE] rounded-[20px]"></div>
                <div className="h-56 bg-white border border-[#E7E9EE] rounded-[20px]"></div>
              </div>
              <div className="h-72 bg-white border border-[#E7E9EE] rounded-[20px]"></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isError || !business) {
    return (
      <div className="min-h-screen bg-[#FAF8F3]">
        <Header />
        <div className="yp-wrap py-16">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>{isError ? "We couldn’t load this business" : "Business Not Found"}</CardTitle>
              <CardDescription>
                {isError ? "Please try again. Your connection may have been interrupted." : "The business you're looking for doesn't exist or has been removed."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isError && <Button variant="outline" onClick={() => refetch()} className="w-full">Try again</Button>}
              <Button onClick={() => window.location.href = "/"} className="w-full">
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const socialMedia = (business.socialMediaUrls as any) || {};
  const hasLocation = business.googleMapsUrl || (business.coordinates && (business.coordinates as any)?.lat);
  const extra = business as any;
  const logoSrc = business.logoUrl || business.logo;
  const initials = String(business.name || "").trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const photos = listingPhotos(business.images, extra.coverImage || extra.coverImageUrl);
  const ratingValue = parseFloat(business.ratingAverage || "0");
  const ratingCount = Number(business.ratingCount || 0);
  const placeLabel = [extra.localityName || business.locality, extra.provinceName].filter(Boolean).filter((v, i, arr) => arr.indexOf(v) === i).join(", ");
  const whatsappDigits = business.whatsapp ? business.whatsapp.replace(/[^0-9]/g, '') : "";
  const websiteLabel = business.website ? business.website.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "") : "";
  const facts = [
    business.establishedYear && { label: "Established", value: String(business.establishedYear) },
    business.languages && business.languages.length > 0 && { label: "Languages", value: business.languages.join(", ") },
    business.employeeCount && { label: "Team size", value: business.employeeCount },
    business.legalForm && { label: "Legal form", value: business.legalForm },
    business.vatNumber && { label: "VAT number", value: business.vatNumber },
    business.priceRange && { label: "Price range", value: business.priceRange },
    business.isVerified && { label: "Licence", value: `Verified by ${country.brand}` },
  ].filter(Boolean) as { label: string; value: string }[];
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "services", label: "Services" },
    { id: "products", label: "Products" },
    { id: "gallery", label: "Photos" },
    { id: "reviews", label: ratingCount > 0 ? `Reviews (${ratingCount})` : "Reviews" },
    { id: "contact", label: "Location" },
  ];
  const cardTitle = "text-[22px] font-semibold tracking-[-0.02em] text-[#0A0A0A]";
  const pill = "rounded-xl border border-[#E3E6EC] bg-white px-3.5 py-2.5 text-sm font-medium text-[#0A0A0A]";
  const row = "flex items-start gap-3 text-sm leading-[1.5] text-[#3A4354]";
  const rowIcon = "mt-0.5 h-[18px] w-[18px] shrink-0 text-[#5B6475]";
  const hoursEntries = business.workingHours && typeof business.workingHours === 'object' ? Object.entries(business.workingHours as Record<string, unknown>) : [];

  return (
    <div className="business-detail-page min-h-[100dvh] bg-[#FAF8F3]">
      <SEO
        {...SEOConfigs.businessListing(business)}
        structuredData={[
          breadcrumbLd([
            { name: "Home", path: "/" },
            extra.categoryName && extra.categorySlug ? { name: extra.categoryName, path: `/categories/${extra.categorySlug}` } : { name: "Businesses", path: "/businesses" },
            extra.provinceName && extra.provinceSlug ? { name: extra.provinceName, path: `/${extra.provinceSlug}` } : null,
            { name: business.name, path: `/business/${business.slug}` },
          ].filter(Boolean) as any),
        ]}
      />
      <Header />
      
      {/* Hero Section */}
      <section className="business-profile-hero border-b border-[#E7E9EE] bg-white">
        <div className="yp-wrap pt-6">
          <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-sm text-[#5B6475]">
            <a href="/" className="text-[#0B6B2E] hover:text-[#05501F]">Home</a>
            <span aria-hidden="true">/</span>
            {extra.categoryName && extra.categorySlug ? (
              <a href={`/categories/${extra.categorySlug}`} className="text-[#0B6B2E] hover:text-[#05501F]">{extra.categoryName}</a>
            ) : (
              <a href="/businesses" className="text-[#0B6B2E] hover:text-[#05501F]">Businesses</a>
            )}
            {extra.provinceName && extra.provinceSlug && (
              <>
                <span aria-hidden="true">/</span>
                <a href={`/${extra.provinceSlug}`} className="text-[#0B6B2E] hover:text-[#05501F]">{placeLabel || extra.provinceName}</a>
              </>
            )}
            <span aria-hidden="true">/</span>
            <span className="text-[#3A4354]">{business.name}</span>
          </nav>

          {/* Cover / photo strip */}
          {photos.length > 0 ? (
            <div className={`grid h-[180px] gap-1.5 overflow-hidden rounded-[24px] bg-[#E8F4EC] sm:h-[220px] ${photos.length >= 3 ? "grid-cols-[2fr_1fr_1fr]" : photos.length === 2 ? "grid-cols-[2fr_1fr]" : "grid-cols-1"}`}>
              {photos.slice(0, 3).map((src, i) => (
                <a key={src} href="#gallery" className={`relative block min-w-0 ${i > 0 ? "hidden sm:block" : ""}`}>
                  <img src={src} alt={i === 0 ? `${business.name}` : ""} className="h-full w-full object-cover" loading={i === 0 ? "eager" : "lazy"} />
                  {i === 2 && photos.length > 3 && (
                    <span className="absolute inset-0 grid place-items-center bg-[#E8F4EC]/85 font-mono text-xs font-medium uppercase tracking-[.06em] text-[#05501F]">+ {photos.length - 3} photos</span>
                  )}
                </a>
              ))}
            </div>
          ) : (
            <div className="h-[140px] rounded-[24px] bg-[#E8F4EC] sm:h-[180px]" aria-hidden="true" />
          )}

          <div className="-mt-11 flex flex-wrap items-end gap-6 px-2 sm:px-6">
            {/* Business Logo */}
            <div className="relative grid h-[112px] w-[112px] shrink-0 place-items-center overflow-hidden rounded-[28px] border-[5px] border-white bg-[#0B6B2E] text-[36px] font-bold tracking-[-0.04em] text-white">
              <span aria-hidden="true">{initials || <Building2 className="h-12 w-12" />}</span>
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt={`${business.name} logo`}
                  className="absolute inset-0 h-full w-full bg-white object-contain p-2"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : null}
            </div>

            {/* Business Info */}
            <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-2 sm:pt-[52px]">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-[clamp(28px,3.4vw,40px)] font-bold leading-[1.1] tracking-[-0.04em] text-[#0A0A0A] break-words">{business.name}</h1>
                {business.isVerified && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F4EC] px-2.5 py-1 text-[13px] font-semibold text-[#05501F]">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                    Verified business
                  </span>
                )}
                {business.isPremium && (
                  <span className="yp-pill bg-[#FDECEC] text-[#B3141B]">Premium</span>
                )}
              </div>
              
              {business.arabicName && (
                <p className="font-arabic text-lg text-[#4B5565]" dir={localDir} lang={localLang}>{business.arabicName}</p>
              )}
              
              {/* Rating and Reviews */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] text-[#4B5565]">
                {ratingCount > 0 ? (
                  <>
                    <Star className="h-[18px] w-[18px] fill-[#F59E0B] text-[#F59E0B]" aria-hidden="true" />
                    <strong className="text-[#0A0A0A]">{ratingValue.toFixed(1)}</strong>
                    <a href="#reviews" className="text-[#4B5565] hover:text-[#0B6B2E]">{ratingCount} {ratingCount === 1 ? "review" : "reviews"}</a>
                  </>
                ) : (
                  <a href="#reviews" className="text-[#4B5565] hover:text-[#0B6B2E]">No reviews yet</a>
                )}
                {extra.categoryName && <><span aria-hidden="true">·</span><span>{extra.categoryName}</span></>}
                {placeLabel && <><span aria-hidden="true">·</span><span>{placeLabel}</span></>}
                {status && <><span aria-hidden="true">·</span><span className={status.open ? "font-semibold text-[#047857]" : "font-medium text-[#B3141B]"}>{status.label}</span></>}
                {Number(business.viewCount) > 0 && <><span aria-hidden="true">·</span><span className="inline-flex items-center gap-1"><Users className="h-4 w-4" aria-hidden="true" />{business.viewCount} views</span></>}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 pb-1">
              <a href="#quote" className="yp-btn yp-btn-primary min-h-[48px] px-[22px]">Request a quote</a>
              {business.phone && (
                <a href={telHref(business.phone)} className="yp-btn yp-btn-ghost min-h-[48px]">
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  Call
                </a>
              )}
              {whatsappDigits && (
                <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noopener noreferrer" className="yp-btn yp-btn-ghost min-h-[48px]">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  WhatsApp
                </a>
              )}
              <button type="button" onClick={() => setShowEnquiryDialog(true)} className="yp-btn yp-btn-ghost min-h-[48px]">
                <Mail className="h-4 w-4" aria-hidden="true" />
                Contact Business
              </button>
              <QuickShareQRCode business={business as any} size="lg" />
              {isAuthenticated && (
                <button type="button" onClick={() => setShowReviewDialog(true)} className="yp-btn yp-btn-ghost min-h-[48px]">
                  <Star className="h-4 w-4" aria-hidden="true" />
                  Write Review
                </button>
              )}
            </div>
          </div>

          {/* Section tabs */}
          <nav aria-label="On this page" className="business-section-index mt-7 flex gap-6 overflow-x-auto">
            {tabs.map(tab => (
              <a
                key={tab.id}
                href={`#${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                aria-current={activeTab === tab.id ? "true" : undefined}
                className={`inline-flex min-h-[48px] shrink-0 items-center border-b-2 px-1 text-[15px] font-medium ${activeTab === tab.id ? "border-[#0B6B2E] text-[#0A0A0A]" : "border-transparent text-[#5B6475] hover:text-[#0A0A0A]"}`}
              >
                {tab.label}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {/* Main Content */}
      <div className="yp-wrap pb-20 pt-8">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
          {/* Main Content Area */}
          <main className="business-sections flex min-w-0 flex-col gap-6">
              {/* Overview */}
              <section id="overview" aria-label="Business overview" className="yp-card scroll-mt-24 p-6 md:p-7">
                <h2 role="heading" aria-level={2} className={`${cardTitle} mb-3`}>About {business.name}</h2>
                {business.description ? (
                  <p className="whitespace-pre-line text-base leading-[1.7] text-[#3A4354]">{business.description}</p>
                ) : (
                  <p className="text-base leading-[1.7] text-[#5B6475]">This business hasn’t added a description yet.</p>
                )}

                {facts.length > 0 && (
                  <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
                    {facts.map(f => (
                      <div key={f.label} className="yp-panel p-4">
                        <div className="yp-label">{f.label}</div>
                        <div className="mt-1.5 font-semibold text-[#0A0A0A] break-words">{f.value}</div>
                      </div>
                    ))}
                  </div>
                )}

                {business.specialties && business.specialties.length > 0 && (
                  <div className="mt-6">
                    <h3 className="yp-label mb-3">Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {business.specialties.map((specialty, index) => (
                        <span key={index} className="yp-tag">{specialty}</span>
                      ))}
                    </div>
                  </div>
                )}

                {business.certifications && business.certifications.length > 0 && (
                  <div className="mt-6">
                    <h3 className="yp-label mb-3 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                      Certifications
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {business.certifications.map((cert, index) => (
                        <span key={index} className="yp-tag yp-tag-green">{cert}</span>
                      ))}
                    </div>
                  </div>
                )}

                {business.awards && business.awards.length > 0 && (
                  <div className="mt-6">
                    <h3 className="yp-label mb-3 flex items-center gap-2">
                      <Award className="h-4 w-4" aria-hidden="true" />
                      Awards & Recognition
                    </h3>
                    <ul className="flex flex-col gap-1.5 text-[15px] text-[#3A4354]">
                      {business.awards.map((award, index) => (
                        <li key={index} className="flex items-start gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-[#0B6B2E]" aria-hidden="true" />{award}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>

              {/* Services */}
              <section id="services" aria-label="Services" className="yp-card scroll-mt-24 p-6 md:p-7">
                <h2 role="heading" aria-level={2} className={`${cardTitle} mb-4`}>Services</h2>
                {business.services && business.services.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {business.services.map((service, index) => (
                      <span key={index} className={pill}>{service}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#5B6475]">No services listed yet.</p>
                )}
              </section>

              {/* Products */}
              <section id="products" aria-label="Products" className="yp-card scroll-mt-24 p-6 md:p-7">
                <h2 role="heading" aria-level={2} className={`${cardTitle} mb-4`}>Products</h2>
                {business.products && business.products.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {business.products.map((product, index) => (
                      <span key={index} className={pill}>{product}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#5B6475]">No products listed yet.</p>
                )}
              </section>

              {/* Gallery */}
              <section id="gallery" aria-label="Photo gallery" className="yp-card scroll-mt-24 p-6 md:p-7">
                <h2 role="heading" aria-level={2} className={`${cardTitle} mb-4`}>Photos</h2>
                {photos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {photos.map((src, i) => (
                      <a key={src} href={src} target="_blank" rel="noopener noreferrer" className="block aspect-[4/3] overflow-hidden rounded-[14px] bg-[#F7F8FA]">
                        <img src={src} alt={`${business.name} photo ${i + 1}`} loading="lazy" className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="yp-panel flex flex-col items-center justify-center px-6 py-12 text-center">
                    <span className="mb-3 grid h-12 w-12 place-items-center rounded-[14px] bg-[#F1F2F6] text-[#334155]">
                      <Camera className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <p className="text-[#5B6475]">No photos have been added to this listing yet.</p>
                  </div>
                )}
              </section>

              <ProfileExtras businessId={business.id} businessName={business.name} />

              {/* Reviews */}
              <section id="reviews" aria-label="Client reviews" className="scroll-mt-24">
                <StructuredReviews businessId={business.id} businessName={business.name} ownerId={(business as any).ownerId} />
              </section>

              <section id="trust" aria-label="Verification status" className="scroll-mt-24">
                <TrustPanel businessId={business.id} businessName={business.name} ownerId={(business as any).ownerId} isClaimed={(business as any).isClaimed} />
              </section>
          </main>

          {/* Sidebar */}
          <aside aria-label="Business contact and listing information" className="business-sidebar flex min-w-0 flex-col gap-6">
            {/* Contact */}
            <section id="contact" aria-label="Contact information and location" className="yp-card flex scroll-mt-24 flex-col gap-4 p-6">
              <h2 role="heading" aria-level={2} className="text-lg font-semibold text-[#0A0A0A]">Contact</h2>
              {(business.address || business.locality || business.poBox) && (
                <div className={row}>
                  <MapPin className={rowIcon} aria-hidden="true" />
                  <span className="min-w-0">
                    {business.address && <span className="block">{business.address}</span>}
                    {business.locality && <span className="block text-[#5B6475]">{business.locality}</span>}
                    {business.poBox && <span className="block text-[#5B6475]">{business.poBox}</span>}
                  </span>
                </div>
              )}
              {business.phone && (
                <div className={row}>
                  <Phone className={rowIcon} aria-hidden="true" />
                  <a href={telHref(business.phone)} dir="ltr" className="font-medium text-[#0B6B2E] hover:text-[#05501F]">{formatBusinessPhone(business.phone)}</a>
                </div>
              )}
              {business.whatsapp && (
                <div className={row}>
                  <MessageCircle className={rowIcon} aria-hidden="true" />
                  <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noopener noreferrer" dir="ltr" className="font-medium text-[#0B6B2E] hover:text-[#05501F]">{business.whatsapp}</a>
                </div>
              )}
              {business.email && (
                <div className={row}>
                  <Mail className={rowIcon} aria-hidden="true" />
                  <a href={`mailto:${business.email}`} className="min-w-0 break-all font-medium text-[#0B6B2E] hover:text-[#05501F]">{business.email}</a>
                </div>
              )}
              {business.website && (
                <div className={row}>
                  <Globe className={rowIcon} aria-hidden="true" />
                  <a href={business.website} target="_blank" rel="noopener noreferrer" className="min-w-0 break-all font-medium text-[#0B6B2E] hover:text-[#05501F]">{websiteLabel || "Visit Website"}</a>
                </div>
              )}

              {/* Working Hours */}
              {business.workingHours && (
                <div className="border-t border-[#EEF0F4] pt-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#5B6475]" aria-hidden="true" />
                    <span className="text-sm font-medium text-[#0A0A0A]">Working Hours</span>
                    {status && <span className={`ml-auto text-xs font-semibold ${status.open ? "text-[#047857]" : "text-[#B3141B]"}`}>{status.label}</span>}
                  </div>
                  {typeof business.workingHours === 'string' ? (
                    <p className="text-sm text-[#3A4354]">{business.workingHours}</p>
                  ) : hoursEntries.length > 0 ? (
                    <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 text-sm text-[#3A4354]">
                      {hoursEntries.map(([day, hours]) => (
                        <div key={day} className="contents">
                          <span className="capitalize">{day}</span>
                          <span className="text-right">{formatHours(hours)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#5B6475]">Hours not available</p>
                  )}
                </div>
              )}

              {business.paymentMethods && business.paymentMethods.length > 0 && (
                <div className="border-t border-[#EEF0F4] pt-4">
                  <div className="mb-2 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-[#5B6475]" aria-hidden="true" />
                    <span className="text-sm font-medium text-[#0A0A0A]">Payment Methods</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {business.paymentMethods.map((method, index) => (
                      <span key={index} className="yp-tag">{method}</span>
                    ))}
                  </div>
                </div>
              )}

              {hasLocation && (
                <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-[14px] bg-[#EEF0F4] p-5 text-center">
                  <MapPin className="h-8 w-8 text-[#5B6475]" aria-hidden="true" />
                  <p className="text-sm text-[#3A4354]">{business.address || "See this business’s location on Maps."}</p>
                  {business.googleMapsUrl && (
                    <a href={business.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="yp-btn yp-btn-ghost">
                      <MapIcon className="h-4 w-4" aria-hidden="true" />
                      View on Maps
                    </a>
                  )}
                </div>
              )}
            </section>

            {/* Request a quote */}
            <section id="quote" aria-label="Request a quote" className="scroll-mt-24">
              <QuoteRequestCard businessId={business.id} businessName={business.name} stacked />
            </section>

            {/* Social Media */}
            {(socialMedia.facebook || socialMedia.instagram || socialMedia.twitter || socialMedia.linkedin || socialMedia.youtube) && (
              <section className="yp-card p-6" aria-label="Social media">
                <h2 className="mb-3 text-lg font-semibold text-[#0A0A0A]">Follow Us</h2>
                <div className="flex flex-wrap gap-2">
                  {socialMedia.facebook && (
                    <a href={socialMedia.facebook} aria-label="Facebook" target="_blank" rel="noopener noreferrer" className="yp-btn yp-btn-ghost w-11 px-0">
                      <Facebook className="h-4 w-4" />
                    </a>
                  )}
                  {socialMedia.instagram && (
                    <a href={socialMedia.instagram} aria-label="Instagram" target="_blank" rel="noopener noreferrer" className="yp-btn yp-btn-ghost w-11 px-0">
                      <Instagram className="h-4 w-4" />
                    </a>
                  )}
                  {socialMedia.twitter && (
                    <a href={socialMedia.twitter} aria-label="X / Twitter" target="_blank" rel="noopener noreferrer" className="yp-btn yp-btn-ghost w-11 px-0">
                      <Twitter className="h-4 w-4" />
                    </a>
                  )}
                  {socialMedia.linkedin && (
                    <a href={socialMedia.linkedin} aria-label="LinkedIn" target="_blank" rel="noopener noreferrer" className="yp-btn yp-btn-ghost w-11 px-0">
                      <Linkedin className="h-4 w-4" />
                    </a>
                  )}
                  {socialMedia.youtube && (
                    <a href={socialMedia.youtube} aria-label="YouTube" target="_blank" rel="noopener noreferrer" className="yp-btn yp-btn-ghost w-11 px-0">
                      <Youtube className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </section>
            )}

            {/* Service Areas */}
            {business.deliveryAreas && business.deliveryAreas.length > 0 && (
              <section className="yp-card p-6" aria-label="Service areas">
                <h2 className="mb-3 text-lg font-semibold text-[#0A0A0A]">Service Areas</h2>
                <div className="flex flex-wrap gap-1.5">
                  {business.deliveryAreas.map((area, index) => (
                    <span key={index} className="yp-tag gap-1"><MapPin className="h-3 w-3" aria-hidden="true" />{area}</span>
                  ))}
                </div>
              </section>
            )}

            {/* Claim Business */}
            {!(business as any).isClaimed && (
              <div className="flex flex-wrap items-center gap-3.5 rounded-[20px] border border-[#E7E9EE] bg-[#F7F8FA] p-5">
                <span className="flex-1 text-sm text-[#3A4354]">Is this your business?</span>
                <a
                  href={`/business/${business.id}/claim`}
                  onClick={(e) => { e.preventDefault(); navigate(`/business/${business.id}/claim`); }}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[#0B6B2E] hover:text-[#05501F]"
                >
                  Claim it free <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Contact Enquiry Dialog */}
      <Dialog open={showEnquiryDialog} onOpenChange={setShowEnquiryDialog}>
        <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contact {business.name}</DialogTitle>
          </DialogHeader>
          <Form {...enquiryForm}>
            <form onSubmit={enquiryForm.handleSubmit((data) => addEnquiryMutation.mutate(data))} className="space-y-4">
              <FormField
                control={enquiryForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={enquiryForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={enquiryForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder={`${country.phonePrefix}-50-123-4567`} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={enquiryForm.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject *</FormLabel>
                    <FormControl>
                      <Input placeholder="Service inquiry" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={enquiryForm.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message *</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell us about your requirements..." className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={addEnquiryMutation.isPending}>
                {addEnquiryMutation.isPending ? "Sending..." : "Send Enquiry"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
          </DialogHeader>
          <Form {...reviewForm}>
            <form onSubmit={reviewForm.handleSubmit((data) => addReviewMutation.mutate(data))} className="space-y-4">
              <FormField
                control={reviewForm.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating *</FormLabel>
                    <FormControl>
                      <select {...field} className="min-h-[44px] w-full rounded-xl border border-[#DDE1E8] bg-white px-3 text-sm">
                        <option value="5">5 - Excellent</option>
                        <option value="4">4 - Very Good</option>
                        <option value="3">3 - Good</option>
                        <option value="2">2 - Fair</option>
                        <option value="1">1 - Poor</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={reviewForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Review Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Great service!" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={reviewForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Review *</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Share your experience..." className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={addReviewMutation.isPending}>
                {addReviewMutation.isPending ? "Submitting..." : "Submit Review"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Claim Business Dialog */}
      <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
        <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Claim Business: {business.name}</DialogTitle>
          </DialogHeader>
          <Form {...claimForm}>
            <form onSubmit={claimForm.handleSubmit((data) => claimBusinessMutation.mutate({...data, businessId: business.id}))} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={claimForm.control}
                  name="claimType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Claim Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select claim type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ownership">Business Owner</SelectItem>
                          <SelectItem value="manager">Business Manager</SelectItem>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="authorized">Authorized Representative</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={claimForm.control}
                  name="businessRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Role *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="ceo">CEO</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="marketing">Marketing Manager</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={claimForm.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={claimForm.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={claimForm.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input placeholder={`${country.phonePrefix}-50-123-4567`} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={claimForm.control}
                name="additionalInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Information</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any additional details to support your claim..." className="min-h-[80px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="yp-tint p-4 rounded-[14px]">
                <h4 className="font-semibold text-[#05501F] mb-2">Next Steps:</h4>
                <ul className="text-sm text-[#05501F] space-y-1">
                  <li>• Your claim will be reviewed by our team</li>
                  <li>• We may contact you for verification</li>
                  <li>• Approved claims get full business management access</li>
                  <li>• Review process typically takes 1-3 business days</li>
                </ul>
              </div>

              <Button type="submit" className="w-full" disabled={claimBusinessMutation.isPending}>
                {claimBusinessMutation.isPending ? "Submitting Claim..." : "Submit Business Claim"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}