import { Suspense, useEffect, useState, type ComponentType } from "react";
import { country } from "@shared/country";

/*
 * Route-level code splitting that is safe for SSR + hydration.
 *
 * - On the server, renderToPipeableStream waits for every chunk (onAllReady), so
 *   lazy routes are fully server-rendered. Each rendered route id is recorded so
 *   the HTML can tell the browser which chunks the page needs.
 * - In the browser, entry-client preloads exactly those chunks before
 *   hydrateRoot.
 * - A route whose module is already loaded renders WITHOUT a Suspense boundary
 *   (server and client alike). React hydrates Suspense contents at lower
 *   priority, and an auth/query update arriving first makes it discard the
 *   server HTML and client-render the page (React #421). The server makes sure
 *   modules are loaded before its final render pass, so both sides match.
 */
import { lazy, routesLoaded, preloadRoutes } from "@/lib/lazy-route";
export { routesLoaded, preloadRoutes };

const AdminApprovals = lazy(() => import("@/pages/admin-approvals"), "pages/admin-approvals");
const MyProfileContent = lazy(() => import("@/pages/my-profile"), "pages/my-profile");
const TopRanked = lazy(() => import("@/pages/top-ranked"), "pages/top-ranked");
const MyPlan = lazy(() => import("@/pages/my-plan"), "pages/my-plan");
const AdminSponsorships = lazy(() => import("@/pages/admin-sponsorships"), "pages/admin-sponsorships");
const MyVerification = lazy(() => import("@/pages/my-verification"), "pages/my-verification");
const MyLeads = lazy(() => import("@/pages/my-leads"), "pages/my-leads");
const AdminVerifications = lazy(() => import("@/pages/admin-verifications"), "pages/admin-verifications");
const AdminReviews = lazy(() => import("@/pages/admin-reviews"), "pages/admin-reviews");
const AdminLeads = lazy(() => import("@/pages/admin-leads"), "pages/admin-leads");
import { RequireAuth } from "@/components/require-auth";
import { ErrorBoundary } from "@/components/error-boundary";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useMobile } from "@/hooks/use-mobile";
import { initGA } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";
import { MobileNavigation } from "@/components/mobile-navigation";
import { MobileAppBanner } from "@/components/mobile-app-banner";
// import { FaviconCacheManager } from "@/components/favicon-cache-manager"; // Disabled favicon cache
// import { MobileSplashScreen } from "@/components/mobile-splash-screen"; // Removed splash screen
import { MobileFloatingSearch } from "@/components/mobile-floating-search";
import { MobileOfflineIndicator } from "@/components/mobile-offline-indicator";
import Home from "@/pages/home";
const Categories = lazy(() => import("@/pages/categories"), "pages/categories");
const CategoriesImproved = lazy(() => import("@/pages/categories-improved"), "pages/categories-improved");
const CategoryDetail = lazy(() => import("@/pages/category-detail"), "pages/category-detail");
const CategoryEnhancedSEO = lazy(() => import("@/pages/category-enhanced-seo"), "pages/category-enhanced-seo");
const Provinces = lazy(() => import("@/pages/provinces"), "pages/provinces");
const BusinessProfile = lazy(() => import("@/pages/business-profile"), "pages/business-profile");
const BusinessDetailEnhanced = lazy(() => import("@/pages/business-detail-enhanced"), "pages/business-detail-enhanced");
const SearchResults = lazy(() => import("@/pages/search-results"), "pages/search-results");
const SearchPage = lazy(() => import("@/pages/search"), "pages/search");
// Admin panels consolidated to SuperAdminDashboard only
const Dashboard = lazy(() => import("@/pages/dashboard"), "pages/dashboard");
const UserDashboard = lazy(() => import("@/pages/user-dashboard"), "pages/user-dashboard");
const News = lazy(() => import("@/pages/news"), "pages/news");
const NewsDetail = lazy(() => import("@/pages/news-detail"), "pages/news-detail");
const Blogs = lazy(() => import("@/pages/blogs"), "pages/blogs");
const BlogArticle = lazy(() => import("@/pages/blog-article"), "pages/blog-article");
const AdminBlogPost = lazy(() => import("@/pages/admin-blog-post"), "pages/admin-blog-post");
const AddBusinessEnhanced = lazy(() => import("@/pages/add-business-enhanced"), "pages/add-business-enhanced");
const AddBusinessProfessional = lazy(() => import("@/pages/add-business-professional"), "pages/add-business-professional");
const UpgradePremium = lazy(() => import("@/pages/upgrade-premium"), "pages/upgrade-premium");
const AIRecommendationsPage = lazy(() => import("@/pages/ai-recommendations"), "pages/ai-recommendations");
const AIRecommendationsEnhanced = lazy(() => import("@/pages/ai-recommendations-enhanced"), "pages/ai-recommendations-enhanced");
const AdvancedReporting = lazy(() => import("@/components/advanced-reporting"), "components/advanced-reporting");
import NotFound from "@/pages/not-found";
import { EXTENSION_ROUTES } from "@/extensions";
const Login = lazy(() => import("@/pages/login"), "pages/login");
const Register = lazy(() => import("@/pages/register"), "pages/register");
const ForgotPassword = lazy(() => import("@/pages/forgot-password"), "pages/forgot-password");
const ResetPassword = lazy(() => import("@/pages/reset-password"), "pages/reset-password");
const VerifyEmail = lazy(() => import("@/pages/verify-email"), "pages/verify-email");
const HelpCenter = lazy(() => import("@/pages/help-center"), "pages/help-center");
const ContactUs = lazy(() => import("@/pages/contact-us"), "pages/contact-us");
const PrivacyPolicy = lazy(() => import("@/pages/privacy-policy"), "pages/privacy-policy");
const TermsOfService = lazy(() => import("@/pages/terms-of-service"), "pages/terms-of-service");
const AdvertiseWithUs = lazy(() => import("@/pages/advertise-with-us"), "pages/advertise-with-us");
const BusinessGuidelines = lazy(() => import("@/pages/business-guidelines"), "pages/business-guidelines");
const About = lazy(() => import("@/pages/about"), "pages/about");
const UltraModernProvincePage = lazy(() => import("@/pages/ultra-modern-province"), "pages/ultra-modern-province");
const EmailTest = lazy(() => import("@/pages/email-test"), "pages/email-test");
const Onboarding = lazy(() => import("@/pages/onboarding"), "pages/onboarding");
const BusinessCardScannerPage = lazy(() => import("@/pages/business-card-scanner").then(module => ({ default: module.BusinessCardScannerPage })), "pages/business-card-scanner");
const InteractiveScannerDemoPage = lazy(() => import("@/pages/interactive-scanner-demo").then(module => ({ default: module.InteractiveScannerDemoPage })), "pages/interactive-scanner-demo");
const SuperAdminDashboard = lazy(() => import("@/pages/super-admin-simple"), "pages/super-admin-simple");
const AdminSocialMediaGenerator = lazy(() => import("@/pages/admin-social-media-generator"), "pages/admin-social-media-generator");
const CreateBlogPost = lazy(() => import("@/pages/create-blog-post"), "pages/create-blog-post");
const CreateNewsArticle = lazy(() => import("@/pages/create-news-article"), "pages/create-news-article");
const VideoPitchGeneratorPage = lazy(() => import("@/pages/video-pitch-generator"), "pages/video-pitch-generator");
const BusinessGrowthWizardPage = lazy(() => import("@/pages/business-growth-wizard"), "pages/business-growth-wizard");
import { useScrollToTop } from "@/hooks/use-scroll-to-top";
const TestAdminFeatures = lazy(() => import("@/pages/test-admin-features"), "pages/test-admin-features");
const MascotGuideDemo = lazy(() => import("@/pages/mascot-guide-demo"), "pages/mascot-guide-demo");
const Subscribe = lazy(() => import("@/pages/subscribe"), "pages/subscribe");
const VoiceSearchPage = lazy(() => import("@/pages/voice-search-page"), "pages/voice-search-page");
const Pricing = lazy(() => import("@/pages/pricing"), "pages/pricing");
const AdminLogin = lazy(() => import("@/pages/admin-login"), "pages/admin-login");
const AdminForgotPassword = lazy(() => import("@/pages/admin-forgot-password"), "pages/admin-forgot-password");
const AdminResetPassword = lazy(() => import("@/pages/admin-reset-password"), "pages/admin-reset-password");
const AdminDashboard = lazy(() => import("@/pages/admin-dashboard"), "pages/admin-dashboard");
const ModeratorDashboard = lazy(() => import("@/pages/moderator-dashboard"), "pages/moderator-dashboard");
const ContentDashboard = lazy(() => import("@/pages/content-dashboard"), "pages/content-dashboard");
import { AdminAuthProvider } from "@/hooks/useAdminAuth";
const CacheControl = lazy(() => import("@/pages/cache-control"), "pages/cache-control");
const CategoryHierarchyPage = lazy(() => import("@/pages/category-hierarchy"), "pages/category-hierarchy");
const Localities = lazy(() => import("@/pages/localities"), "pages/localities");
const LocalityDetail = lazy(() => import("@/pages/locality-detail"), "pages/locality-detail");
const Cities = lazy(() => import("@/pages/cities"), "pages/cities");
const CityDetail = lazy(() => import("@/pages/city-detail"), "pages/city-detail");
const IndividualProvincePage = lazy(() => import("@/pages/individual-province"), "pages/individual-province");
const BusinessClaim = lazy(() => import("@/pages/business-claim"), "pages/business-claim");
const BusinessClaimAuth = lazy(() => import("@/pages/business-claim-auth"), "pages/business-claim-auth");
const DashboardBusinessClaims = lazy(() => import("@/pages/dashboard-business-claims"), "pages/dashboard-business-claims");
const AdminBusinessClaims = lazy(() => import("@/pages/admin-business-claims"), "pages/admin-business-claims");
const NewsletterConfirm = lazy(() => import("@/pages/newsletter-confirm"), "pages/newsletter-confirm");
const NewsletterUnsubscribe = lazy(() => import("@/pages/newsletter-unsubscribe"), "pages/newsletter-unsubscribe");
const Events = lazy(() => import("@/pages/Events"), "pages/Events");
const EventDetail = lazy(() => import("@/pages/EventDetail"), "pages/EventDetail");


function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  // Track page views when routes change
  useAnalytics();

  // Scroll to top when route changes
  useScrollToTop();

  return (
    <div className="min-h-screen bg-gray-50">
    <ErrorBoundary key={location}>
    <Switch>
      {/* Always show the new Home component for the main homepage */}
      <Route path="/" component={Home} />
      {/* Country extension sections (client/src/extensions), before the catch-all place routes */}
      {EXTENSION_ROUTES.map((r) => <Route key={r.path} path={r.path} component={r.component} />)}
      
      {/* Authentication-specific routes - using inline conditionals (no fragments) */}
            <Route path="/dashboard">{() => <RequireAuth><Dashboard /></RequireAuth>}</Route>
      <Route path="/user-dashboard">{() => <RequireAuth><Dashboard /></RequireAuth>}</Route>
      <Route path="/reports">{() => <RequireAuth><AdvancedReporting /></RequireAuth>}</Route>
      <Route path="/advanced-reporting">{() => <RequireAuth><AdvancedReporting /></RequireAuth>}</Route>
      <Route path="/upgrade-premium">{() => <RequireAuth><UpgradePremium /></RequireAuth>}</Route>
      <Route path="/admin">{() => <RequireAuth><SuperAdminDashboard /></RequireAuth>}</Route>
      <Route path="/admin-enhanced">{() => <RequireAuth><SuperAdminDashboard /></RequireAuth>}</Route>
      
      {/* Admin Routes */}
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/admin-forgot-password" component={AdminForgotPassword} />
      <Route path="/admin-reset-password" component={AdminResetPassword} />
      <Route path="/super-admin" component={SuperAdminDashboard} />
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/moderator-dashboard" component={ModeratorDashboard} />
      <Route path="/content-dashboard" component={ContentDashboard} />
      <Route path="/business-dashboard" component={AdminDashboard} />
      <Route path="/admin-enhanced">{() => <RequireAuth><SuperAdminDashboard /></RequireAuth>}</Route>
      <Route path="/super-admin-simple" component={SuperAdminDashboard} />
      <Route path="/admin/social-media-generator" component={AdminSocialMediaGenerator} />
      <Route path="/create-blog-post" component={CreateBlogPost} />
      <Route path="/create-news-article" component={CreateNewsArticle} />
      <Route path="/business-growth-wizard" component={BusinessGrowthWizardPage} />
      <Route path="/categories" component={CategoriesImproved} />
      <Route path="/categories/:slug" component={CategoryDetail} />
      <Route path="/categories/:category/:subcategory" component={CategoryDetail} />
      <Route path="/categories/:category/:subcategory/:subsubcategory" component={CategoryDetail} />
      <Route path={country.regionsPath} component={Provinces} />
      <Route path="/cities" component={Cities} />
      <Route path="/cities/:city" component={CityDetail} />
      <Route path="/localities" component={Localities} />
      <Route path="/localities/:province/:locality" component={LocalityDetail} />
      <Route path="/voice-search" component={VoiceSearchPage} />

      {/* Business routes - must come before province/locality routes to avoid conflicts */}
      <Route path="/business/:id/claim-auth" component={BusinessClaimAuth} />
      <Route path="/business/:id/claim" component={BusinessClaim} />
      <Route path="/business/:slug" component={BusinessDetailEnhanced} />
      <Route path="/my-business-claims" component={DashboardBusinessClaims} />
      <Route path="/admin/business-claims" component={AdminBusinessClaims} />
      <Route path="/my-verification">{() => <RequireAuth><MyVerification /></RequireAuth>}</Route>
      <Route path="/my-leads">{() => <RequireAuth><MyLeads /></RequireAuth>}</Route>
      <Route path="/admin/verifications">{() => <RequireAuth><AdminVerifications /></RequireAuth>}</Route>
      <Route path="/admin/reviews">{() => <RequireAuth><AdminReviews /></RequireAuth>}</Route>
      <Route path="/admin/leads">{() => <RequireAuth><AdminLeads /></RequireAuth>}</Route>
      <Route path="/top/:category/:province" component={TopRanked} />
      <Route path="/top/:category" component={TopRanked} />
      <Route path="/my-profile">{() => <RequireAuth><MyProfileContent /></RequireAuth>}</Route>
      <Route path="/my-plan">{() => <RequireAuth><MyPlan /></RequireAuth>}</Route>
      <Route path="/admin/approvals">{() => <RequireAuth><AdminApprovals /></RequireAuth>}</Route>
      <Route path="/admin/sponsorships">{() => <RequireAuth><AdminSponsorships /></RequireAuth>}</Route>

      {/* Blog routes - must come before wildcard routes to avoid conflicts */}
      <Route path="/blogs" component={Blogs} />
      <Route path="/blogs/category/:category" component={Blogs} />
      <Route path="/blogs/tag/:tag" component={Blogs} />
      <Route path="/blogs/:slug" component={BlogArticle} />
      <Route path="/admin-blog/:slug" component={AdminBlogPost} />

      {/* News routes - must come before wildcard routes to avoid conflicts */}
      <Route path="/news" component={News} />
      <Route path="/news/category/:category" component={News} />
      <Route path="/news/tag/:tag" component={News} />
      <Route path="/news/:slug" component={NewsDetail} />

      {/* Newsletter routes - must come before dynamic routes to avoid conflicts */}
      <Route path="/newsletter-confirm/:token" component={NewsletterConfirm} />
      <Route path="/newsletter-unsubscribe/:token" component={NewsletterUnsubscribe} />

      {/* Events routes - must come before wildcard routes to avoid conflicts */}
      <Route path="/events" component={Events} />
      <Route path="/events/:slug" component={EventDetail} />

      {/* Subscription routes - must come before wildcard routes to avoid conflicts */}
      <Route path="/subscribe/:planId" component={Subscribe} />

      {/* Province pages (/punjab, /sindh ...) from the site's config */}
      {country.regions.map((r) => (
        <Route key={r.slug} path={`/${r.slug}`} component={UltraModernProvincePage} />
      ))}
      <Route path={`${country.regionsPath}/:province`} component={UltraModernProvincePage} />
      
      {/* Province/locality route - must come after specific routes to avoid conflicts */}
      <Route path="/business-profile/:slug" component={BusinessProfile} />
      <Route path="/search-results" component={SearchResults} />
      <Route path="/businesses" component={SearchResults} />
      <Route path="/search" component={SearchPage} />
      <Route path="/add-business" component={AddBusinessProfessional} />
      <Route path="/add-business-enhanced" component={AddBusinessEnhanced} />
      <Route path="/add-business-professional" component={AddBusinessProfessional} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/business-card-scanner" component={BusinessCardScannerPage} />
      <Route path="/interactive-scanner-demo" component={InteractiveScannerDemoPage} />
      <Route path="/cache-control" component={CacheControl} />
      <Route path="/test-admin-features" component={TestAdminFeatures} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/email-test" component={EmailTest} />
      <Route path="/help-center" component={HelpCenter} />
      <Route path="/contact-us" component={ContactUs} />
      <Route path="/pages/privacy-policy" component={PrivacyPolicy} />
      <Route path="/pages/terms-of-service" component={TermsOfService} />
      <Route path="/advertise-with-us" component={AdvertiseWithUs} />
      <Route path="/business-guidelines" component={BusinessGuidelines} />
      <Route path="/about" component={About} />
      <Route path="/ai-recommendations" component={AIRecommendationsEnhanced} />
      <Route path="/ai-recommendations-old" component={AIRecommendationsPage} />
      <Route path="/video-pitch-generator" component={VideoPitchGeneratorPage} />
      <Route path="/mascot-guide-demo" component={MascotGuideDemo} />
      <Route path="/category-hierarchy" component={CategoryHierarchyPage} />
      <Route path="/:province/:locality" component={LocalityDetail} />
      <Route component={NotFound} />
    </Switch>
      </ErrorBoundary>

    {/* Mobile-specific components */}
    <MobileNavigation />
    <MobileAppBanner />
  </div>
  );
}

import { LanguageGuard } from "@/components/language-switch";
import { DirectionProvider } from "@radix-ui/react-direction";
import { langDir } from "@shared/i18n";

function App() {
  const isMobile = useMobile();

  // Initialize Google Analytics when app loads
  useEffect(() => {
    // Server-injected gtag is reused; otherwise load it from the build-time id
    {
      initGA();

    // Add keyboard shortcut to clear cache (Ctrl+Shift+C)
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'C') {
        event.preventDefault();
        queryClient.clear();
      }
    };

    // Add cache clearing on focus (when returning to tab)
    const handleFocus = () => {
      // Clear cache if URL has ?clearCache=true
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('clearCache') === 'true') {
        queryClient.clear();
        // Remove the parameter from URL
        urlParams.delete('clearCache');
        const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
        window.history.replaceState({}, '', newUrl);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('focus', handleFocus);

    // Check on initial load
    handleFocus();

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('focus', handleFocus);
    };
    }
  }, []);

  useAnalytics();

  return (
    <>
        <DirectionProvider dir={langDir()}>
        <AdminAuthProvider>
          <TooltipProvider>
            {/* <FaviconCacheManager /> Disabled favicon cache */}
            <LanguageGuard />
            <Router />
            {isMobile && <MobileFloatingSearch />}
            <MobileOfflineIndicator />
            <Toaster />
          </TooltipProvider>
        </AdminAuthProvider>
        </DirectionProvider>
      </>
  );
}

export default App;