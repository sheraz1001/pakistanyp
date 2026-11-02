import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  uuid,
  primaryKey
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  username: varchar("username"), // Added username field
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("user"), // user, business_owner, admin, super_admin
  claims: jsonb("claims"), // OAuth claims object
  password: varchar("password"), // For email/password auth
  isEmailVerified: boolean("is_email_verified").default(false),
  emailVerificationToken: varchar("email_verification_token"),
  emailVerificationExpiry: timestamp("email_verification_expiry"),
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpiry: timestamp("password_reset_expiry"),
  authProvider: varchar("auth_provider").default("email"), // 'email' or 'google'
  // Enhanced user management fields
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  lastLoginIp: varchar("last_login_ip"),
  registrationIp: varchar("registration_ip"),
  subscriptionPlan: varchar("subscription_plan").default("free"), // free, basic, premium, enterprise
  subscriptionStatus: varchar("subscription_status").default("active"), // active, suspended, expired, cancelled
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  permissions: jsonb("permissions"), // Array of permission strings
  // Onboarding fields
  onboardingCompleted: boolean("onboarding_completed").default(false),
  businessRole: varchar("business_role"), // consumer, business_owner, employee, investor
  preferredProvinces: jsonb("preferred_provinces"), // Array of province IDs
  interestedCategories: jsonb("interested_categories"), // Array of category IDs
  goals: jsonb("goals"), // Array of goal strings
  notificationPreferences: jsonb("notification_preferences"), // Email, SMS, recommendations settings
  // User statistics
  totalLogins: integer("total_logins").default(0), // Added total logins tracking
  // Admin tracking
  lastModifiedBy: varchar("last_modified_by"), // admin user ID who last modified
  lastModifiedAt: timestamp("last_modified_at"),
  themePreference: varchar("theme_preference", { length: 100 }).default("default"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System settings table for admin configuration
export const systemSettings = pgTable("system_settings", {
  key: varchar("key", { length: 100 }).notNull().primaryKey(),
  value: text("value"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Theme settings table for regional color palettes
export const themeSettings = pgTable("theme_settings", {
  id: varchar("id", { length: 100 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  province: varchar("province", { length: 100 }).notNull(),
  description: text("description"),
  colors: jsonb("colors").notNull(),
  gradients: jsonb("gradients").notNull(),
  culturalElements: jsonb("cultural_elements").notNull(),
  isActive: boolean("is_active").default(true),
  isSystemDefault: boolean("is_system_default").default(false),
  createdBy: varchar("created_by"),
  updatedBy: varchar("updated_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscription plans table
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  yearlyPrice: decimal("yearly_price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("PKR"),
  features: jsonb("features").notNull(), // Array of feature objects
  limits: jsonb("limits").notNull(), // Object with usage limits
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  stripeMonthlyPriceId: varchar("stripe_monthly_price_id"),
  stripeYearlyPriceId: varchar("stripe_yearly_price_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User subscriptions table
export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  planId: integer("plan_id").references(() => subscriptionPlans.id),
  status: varchar("status").default("active"), // active, canceled, expired, past_due
  billingInterval: varchar("billing_interval").default("monthly"), // monthly, yearly
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  stripeCustomerId: varchar("stripe_customer_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Feature flags table for enabling/disabling features
export const featureFlags = pgTable("feature_flags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  description: text("description"),
  isEnabled: boolean("is_enabled").default(false),
  category: varchar("category", { length: 50 }).default("general"), // general, ai, demo, experimental
  demoUrl: varchar("demo_url"),
  implementationStatus: varchar("implementation_status").default("completed"), // completed, in_progress, planned
  dependencies: jsonb("dependencies"), // Array of other feature keys this depends on
  metadata: jsonb("metadata"), // Additional configuration options
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Menu management tables
export const menus = pgTable("menus", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // e.g., "Header Menu", "Footer Menu"
  location: varchar("location", { length: 50 }).notNull(), // header, footer, sidebar
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const menuItems: any = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  menuId: integer("menu_id").references(() => menus.id, { onDelete: "cascade" }),
  parentId: integer("parent_id"), // for nested menus - self-reference handled by constraint
  title: varchar("title", { length: 200 }).notNull(),
  url: varchar("url", { length: 500 }),
  linkType: varchar("link_type", { length: 50 }).default("internal"), // internal, external, custom
  targetPage: varchar("target_page", { length: 100 }), // route for internal links
  icon: varchar("icon", { length: 100 }), // lucide icon name
  description: text("description"),
  isVisible: boolean("is_visible").default(true),
  sortOrder: integer("sort_order").default(0),
  cssClass: varchar("css_class", { length: 200 }), // custom CSS classes
  attributes: jsonb("attributes"), // additional HTML attributes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email templates table for admin-managed email content
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  subject: varchar("subject", { length: 255 }).notNull(),
  htmlContent: text("html_content").notNull(),
  placeholders: text("placeholders").notNull(), // JSON string of available placeholders
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin Audit Log for tracking admin actions
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  adminId: varchar("admin_id").references(() => users.id).notNull(),
  action: varchar("action").notNull(), // created_user, updated_user, deleted_user, changed_password, etc.
  targetType: varchar("target_type").notNull(), // user, business, category, etc.
  targetId: varchar("target_id"), // ID of the target entity
  oldValues: jsonb("old_values"), // Previous values before change
  newValues: jsonb("new_values"), // New values after change
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});



// Advanced Admin Dashboard Tables

// Content Management System
export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  content: text("content").notNull(),
  metaTitle: varchar("meta_title", { length: 255 }),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  featuredImage: text("featured_image"),
  template: varchar("template").default("default"),
  status: varchar("status").default("draft"), // draft, published, archived
  authorId: varchar("author_id").references(() => users.id),
  viewCount: integer("view_count").default(0),
  isHomepage: boolean("is_homepage").default(false),
  customCSS: text("custom_css"),
  customJS: text("custom_js"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Blog Categories System
export const blogCategories = pgTable("blog_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#3b82f6"), // hex color
  icon: varchar("icon", { length: 50 }), // lucide icon name
  isActive: boolean("is_active").default(true),
  postCount: integer("post_count").default(0),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Blog System with Auto-Blogging
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  featuredImage: text("featured_image"),
  metaTitle: varchar("meta_title", { length: 255 }),
  metaDescription: text("meta_description"),
  tags: jsonb("tags"), // Array of tag strings
  categoryId: integer("category_id").references(() => blogCategories.id),
  authorId: varchar("author_id").references(() => users.id),
  status: varchar("status").default("draft"), // draft, published, scheduled, archived
  isAutoGenerated: boolean("is_auto_generated").default(false),
  aiPrompt: text("ai_prompt"),
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  viewCount: integer("view_count").default(0),
  likesCount: integer("likes_count").default(0),
  commentsCount: integer("comments_count").default(0),
  seoScore: integer("seo_score").default(0),
  readingTime: integer("reading_time"), // in minutes
  customCSS: text("custom_css"),
  customJS: text("custom_js"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Auto-Blogging Scheduler
export const blogScheduler = pgTable("blog_scheduler", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  prompt: text("prompt").notNull(),
  frequency: varchar("frequency").notNull(), // daily, weekly, monthly
  categoryId: integer("category_id").references(() => blogCategories.id),
  tags: jsonb("tags"),
  isActive: boolean("is_active").default(true),
  lastRun: timestamp("last_run"),
  nextRun: timestamp("next_run"),
  totalPosts: integer("total_posts").default(0),
  successRate: decimal("success_rate", { precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// File Manager
export const mediaFiles = pgTable("media_files", {
  id: serial("id").primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  size: integer("size"), // in bytes
  path: varchar("path", { length: 500 }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  alt: varchar("alt", { length: 255 }),
  description: text("description"),
  folder: varchar("folder", { length: 255 }).default("uploads"),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  isPublic: boolean("is_public").default(true),
  downloadCount: integer("download_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Advertisement Management
export const advertisements = pgTable("advertisements", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  type: varchar("type").notNull(), // banner, popup, sidebar, footer, header
  position: varchar("position"), // top, middle, bottom, left, right
  content: text("content"), // HTML content
  imageUrl: varchar("image_url"),
  linkUrl: varchar("link_url"),
  targetAudience: jsonb("target_audience"), // Array of criteria
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  costPerClick: decimal("cost_per_click", { precision: 5, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Security & Audit Logs (keeping this version and removing the duplicate above)

// API Management
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  keyHash: varchar("key_hash", { length: 255 }).notNull().unique(),
  userId: varchar("user_id").references(() => users.id),
  permissions: jsonb("permissions"), // Array of allowed endpoints/actions
  rateLimit: integer("rate_limit").default(1000), // requests per hour
  isActive: boolean("is_active").default(true),
  lastUsed: timestamp("last_used"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscription Plans (keeping this version and removing the duplicate above)

// User Subscriptions (keeping this version and removing the duplicate above)

// Billing & Invoices
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  subscriptionId: integer("subscription_id").references(() => userSubscriptions.id),
  stripeInvoiceId: varchar("stripe_invoice_id"),
  number: varchar("number", { length: 50 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("PKR"),
  status: varchar("status").notNull(), // paid, pending, failed, cancelled
  paidAt: timestamp("paid_at"),
  dueDate: timestamp("due_date"),
  items: jsonb("items"), // Array of invoice items
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SEO Management
export const seoSettings = pgTable("seo_settings", {
  id: serial("id").primaryKey(),
  pageType: varchar("page_type", { length: 100 }).notNull(), // homepage, category, business, blog, etc.
  pageId: varchar("page_id"), // ID of the specific page/item
  title: varchar("title", { length: 255 }),
  description: text("description"),
  keywords: text("keywords"),
  canonicalUrl: varchar("canonical_url"),
  ogTitle: varchar("og_title", { length: 255 }),
  ogDescription: text("og_description"),
  ogImage: varchar("og_image"),
  twitterTitle: varchar("twitter_title", { length: 255 }),
  twitterDescription: text("twitter_description"),
  twitterImage: varchar("twitter_image"),
  schemaMarkup: jsonb("schema_markup"),
  robots: varchar("robots").default("index,follow"),
  customMeta: jsonb("custom_meta"), // Array of custom meta tags
  priority: decimal("priority", { precision: 3, scale: 2 }).default("0.5"),
  changeFreq: varchar("change_freq").default("weekly"),
  // Global SEO settings
  robotsTxt: text("robots_txt"), // Custom robots.txt content
  sitemapConfig: jsonb("sitemap_config"), // Sitemap generation settings
  sitemapEnabled: boolean("sitemap_enabled").default(true),
  baseUrl: varchar("base_url").default("https://pakistanyp.com"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Analytics & Reports
export const analyticsData = pgTable("analytics_data", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  pageViews: integer("page_views").default(0),
  uniqueVisitors: integer("unique_visitors").default(0),
  bounceRate: decimal("bounce_rate", { precision: 5, scale: 2 }).default("0"),
  avgSessionDuration: integer("avg_session_duration").default(0), // in seconds
  topPages: jsonb("top_pages"),
  topCountries: jsonb("top_countries"),
  topDevices: jsonb("top_devices"),
  topBrowsers: jsonb("top_browsers"),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }).default("0"),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Page Builder Components
export const pageComponents = pgTable("page_components", {
  id: serial("id").primaryKey(),
  pageId: integer("page_id").references(() => pages.id).notNull(),
  type: varchar("type", { length: 100 }).notNull(), // hero, text, image, gallery, form, etc.
  name: varchar("name", { length: 255 }),
  content: jsonb("content").notNull(), // Component configuration and content
  styles: jsonb("styles"), // CSS styles and layout
  position: integer("position").default(0),
  isVisible: boolean("is_visible").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Provinces table - Enhanced for admin management
export const provinces = pgTable("provinces", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  arabicName: varchar("arabic_name", { length: 100 }),
  code: varchar("code", { length: 10 }).notNull().unique(), // ABD, DXB, SHJ, etc.
  description: text("description"),
  detailedDescription: text("detailed_description"), // For individual province pages
  isCapital: boolean("is_capital").default(false),
  area: decimal("area", { precision: 10, scale: 2 }), // in sq km
  population: integer("population"),
  
  // Image management for admin control
  homepageImage: varchar("homepage_image", { length: 500 }), // Image shown on homepage cards
  headerImage: varchar("header_image", { length: 500 }), // Image shown in individual page headers
  galleryImages: jsonb("gallery_images"), // Array of additional images
  
  // Content management for admin control
  highlights: jsonb("highlights"), // Array of key highlights/features
  keyFacts: jsonb("key_facts"), // Array of important facts and statistics
  attractions: jsonb("attractions"), // Array of main attractions
  economicSectors: jsonb("economic_sectors"), // Array of main economic sectors
  
  // SEO Fields for individual province pages
  metaTitle: varchar("meta_title", { length: 255 }),
  metaDescription: text("meta_description"),
  keywords: text("keywords"),
  canonicalUrl: varchar("canonical_url", { length: 500 }),
  ogTitle: varchar("og_title", { length: 255 }),
  ogDescription: text("og_description"),
  ogImage: varchar("og_image", { length: 500 }),
  twitterTitle: varchar("twitter_title", { length: 255 }),
  twitterDescription: text("twitter_description"),
  twitterImage: varchar("twitter_image", { length: 500 }),
  robotsMeta: varchar("robots_meta", { length: 100 }).default("index,follow"),
  schemaMarkup: jsonb("schema_markup"),
  priority: decimal("priority", { precision: 3, scale: 2 }).default("0.8"),
  changeFreq: varchar("change_freq", { length: 20 }).default("monthly"),
  
  // Admin management
  isActive: boolean("is_active").default(true),
  isPublished: boolean("is_published").default(true),
  sortOrder: integer("sort_order").default(0),
  viewCount: integer("view_count").default(0),
  
  // Admin tracking
  lastModifiedBy: varchar("last_modified_by"), // admin user ID who last modified
  lastModifiedAt: timestamp("last_modified_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Localities table (areas within each province)
export const localities = pgTable("localities", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  arabicName: varchar("arabic_name", { length: 200 }),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  provinceId: integer("province_id").references(() => provinces.id).notNull(),
  isMainArea: boolean("is_main_area").default(false), // Main area of the province
  description: text("description"),
  population: integer("population"),
  coordinates: jsonb("coordinates"), // {lat, lng}
  businessCount: integer("business_count").default(0),
  
  // SEO Fields for locality pages
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  keywords: text("keywords"),
  canonicalUrl: varchar("canonical_url", { length: 500 }),
  ogTitle: varchar("og_title", { length: 255 }),
  ogDescription: text("og_description"),
  ogImage: varchar("og_image", { length: 500 }),
  twitterTitle: varchar("twitter_title", { length: 255 }),
  twitterDescription: text("twitter_description"),
  twitterImage: varchar("twitter_image", { length: 500 }),
  robotsMeta: varchar("robots_meta", { length: 100 }).default("index,follow"),
  schemaMarkup: jsonb("schema_markup"),
  priority: decimal("priority", { precision: 3, scale: 2 }).default("0.7"),
  changeFreq: varchar("change_freq", { length: 20 }).default("weekly"),
  
  isActive: boolean("is_active").default(true),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Business Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  arabicName: varchar("arabic_name", { length: 200 }),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  parentId: integer("parent_id"),
  description: text("description"),
  icon: varchar("icon", { length: 100 }), // Font awesome icon class
  dedCode: varchar("ded_code", { length: 50 }), // Trade licence activity code
  isActive: boolean("is_active").default(true),
  businessCount: integer("business_count").default(0),
  level: integer("level").default(1), // 1=main category, 2=subcategory, 3=sub-subcategory
  sortOrder: integer("sort_order").default(0),
  order: integer("order").default(0), // Alias for sortOrder
  
  // SEO Fields
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  keywords: text("keywords"),
  canonicalUrl: varchar("canonical_url", { length: 500 }),
  ogTitle: varchar("og_title", { length: 255 }),
  ogDescription: text("og_description"),
  ogImage: varchar("og_image", { length: 500 }),
  twitterTitle: varchar("twitter_title", { length: 255 }),
  twitterDescription: text("twitter_description"),
  twitterImage: varchar("twitter_image", { length: 500 }),
  robotsMeta: varchar("robots_meta", { length: 100 }).default("index,follow"),
  schemaMarkup: jsonb("schema_markup"),
  priority: decimal("priority", { precision: 3, scale: 2 }).default("0.5"),
  changeFreq: varchar("change_freq", { length: 20 }).default("weekly"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Businesses table
export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  arabicName: varchar("arabic_name", { length: 200 }),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  description: text("description"),
  shortDescription: varchar("short_description", { length: 500 }),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  additionalCategoryIds: integer("additional_category_ids").array(), // Array of additional category IDs for premium users
  provinceId: integer("province_id").references(() => provinces.id).notNull(),
  localityId: integer("locality_id").references(() => localities.id).notNull(),
  
  // Contact Information
  email: varchar("email", { length: 200 }),
  phone: varchar("phone", { length: 50 }),
  whatsapp: varchar("whatsapp", { length: 50 }),
  website: varchar("website", { length: 500 }),
  logoUrl: varchar("logo_url", { length: 1000 }),
  
  // Address
  address: text("address").notNull(),
  locality: varchar("locality", { length: 200 }), // Specific area/neighborhood
  poBox: varchar("po_box", { length: 100 }),
  coordinates: jsonb("coordinates"), // {lat, lng}
  
  // Business Details
  tradeLicense: varchar("trade_license", { length: 100 }),
  establishedYear: integer("established_year"),
  employeeCount: varchar("employee_count", { length: 50 }), // "1-10", "11-50", etc.
  workingHours: jsonb("working_hours"), // {monday: {open, close}, ...}
  services: text("services").array(),
  specialties: text("specialties").array(),
  
  // Enhanced Profile Fields
  logo: varchar("logo", { length: 500 }),
  socialMediaUrls: jsonb("social_media_urls"), // {facebook, twitter, instagram, linkedin, youtube, tiktok}
  googleMapsUrl: varchar("google_maps_url", { length: 500 }),
  products: text("products").array(),
  certifications: text("certifications").array(),
  awards: text("awards").array(),
  languages: text("languages").array(),
  paymentMethods: text("payment_methods").array(),
  deliveryAreas: text("delivery_areas").array(),
  companySize: varchar("company_size", { length: 50 }),
  yearlyRevenue: varchar("yearly_revenue", { length: 50 }),
  legalForm: varchar("legal_form", { length: 100 }),
  vatNumber: varchar("vat_number", { length: 50 }),
  priceRange: varchar("price_range", { length: 50 }), // Added price range
  businessType: varchar("business_type", { length: 100 }), // Added business type
  images: jsonb("images"), // Added images array
  subcategories: jsonb("subcategories"), // Added subcategories
  features: jsonb("features"), // Added features
  socialMedia: jsonb("social_media"), // Alias for compatibility
  
  // Status and Verification
  isVerified: boolean("is_verified").default(false),
  isClaimed: boolean("is_claimed").default(false),
  isPremium: boolean("is_premium").default(false),
  premiumExpiresAt: timestamp("premium_expires_at"),
  isFeatured: boolean("is_featured").default(false),
  featuredAt: timestamp("featured_at"), // Added featuredAt field  
  isActive: boolean("is_active").default(true),
  status: varchar("status", { length: 50 }).default("active"), // Added status field
  adminApproved: boolean("admin_approved").default(false),
  
  // SEO and Marketing
  metaTitle: varchar("meta_title", { length: 200 }),
  metaDescription: varchar("meta_description", { length: 500 }),
  keywords: text("keywords").array(),
  tagline: varchar("tagline", { length: 150 }), // AI-generated short catchy tagline
  socialPreview: text("social_preview"), // AI-generated social media preview text
  contentGenerationStatus: varchar("content_generation_status", { length: 50 }).default("pending"), // pending, generated, failed
  contentGeneratedAt: timestamp("content_generated_at"), // When AI content was last generated
  
  // Statistics
  viewCount: integer("view_count").default(0),
  ratingAverage: decimal("rating_average", { precision: 3, scale: 2 }).default("0"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"), // Alias for ratingAverage
  ratingCount: integer("rating_count").default(0),
  
  // Ownership
  ownerId: varchar("owner_id").references(() => users.id),
  claimedAt: timestamp("claimed_at"),
  verifiedAt: timestamp("verified_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Business Images table
export const businessImages = pgTable("business_images", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => businesses.id).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  alt: varchar("alt", { length: 200 }),
  type: varchar("type", { length: 50 }).default("gallery"), // logo, cover, gallery
  isMain: boolean("is_main").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Business Reviews table
export const businessReviews = pgTable("business_reviews", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => businesses.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(), // 1-5
  title: varchar("title", { length: 200 }),
  content: text("content"),
  isVerified: boolean("is_verified").default(false),
  isVisible: boolean("is_visible").default(true),
  response: text("response"), // Business owner response
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Business Claims table
export const businessClaims = pgTable("business_claims", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => businesses.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  status: varchar("status", { length: 50 }).default("pending"), // pending, approved, rejected
  // Enhanced claim form fields
  relationshipToBusiness: varchar("relationship_to_business", { length: 100 }).notNull(), // owner, manager, authorized_representative
  businessEmail: varchar("business_email", { length: 255 }),
  businessPhone: varchar("business_phone", { length: 50 }),
  position: varchar("position", { length: 100 }), // job title/position
  verificationMethod: varchar("verification_method", { length: 100 }), // trade_license, business_card, email_verification
  documents: jsonb("documents"), // Array of document URLs with metadata
  additionalInfo: text("additional_info"), // Any additional information
  notes: text("notes"),
  adminNotes: text("admin_notes"),
  processedBy: varchar("processed_by").references(() => users.id),
  processedAt: timestamp("processed_at"),
  rejectionReason: text("rejection_reason"), // Reason for rejection
  emailSent: boolean("email_sent").default(false), // Track if confirmation email was sent
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// News Categories table for professional news management
export const newsCategories = pgTable("news_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  color: varchar("color", { length: 50 }).default("#3B82F6"), // Brand color for category
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// News Articles table
export const newsArticles = pgTable("news_articles", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  slug: varchar("slug", { length: 300 }).notNull().unique(),
  summary: varchar("summary", { length: 500 }),
  content: text("content"),
  source: varchar("source", { length: 200 }),
  sourceUrl: varchar("source_url", { length: 500 }),
  author: varchar("author", { length: 200 }),
  imageUrl: varchar("image_url", { length: 500 }),
  categoryId: integer("category_id").references(() => newsCategories.id),
  category: varchar("category", { length: 100 }), // Legacy field for backward compatibility
  tags: jsonb("tags"), // Changed from array to JSONB for better compatibility
  publishedAt: timestamp("published_at").defaultNow(),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  isPinned: boolean("is_pinned").default(false),
  viewCount: integer("view_count").default(0),
  shareCount: integer("share_count").default(0),
  likeCount: integer("like_count").default(0),
  priority: varchar("priority", { length: 20 }).default("normal"), // breaking, high, normal, low
  status: varchar("status", { length: 20 }).default("published"), // draft, published, archived
  metaTitle: varchar("meta_title", { length: 200 }),
  metaDescription: varchar("meta_description", { length: 300 }),
  customCSS: text("custom_css"),
  customJS: text("custom_js"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});



// Search Analytics table
export const searchAnalytics = pgTable("search_analytics", {
  id: serial("id").primaryKey(),
  query: varchar("query", { length: 500 }).notNull(),
  category: varchar("category", { length: 200 }),
  province: varchar("province", { length: 100 }),
  locality: varchar("locality", { length: 100 }),
  resultsCount: integer("results_count").default(0),
  userId: varchar("user_id").references(() => users.id),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Business Enquiries table
export const businessEnquiries = pgTable("business_enquiries", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => businesses.id).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  subject: varchar("subject", { length: 300 }),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  isReplied: boolean("is_replied").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Newsletter Subscriptions table
export const newsletterSubscriptions = pgTable("newsletter_subscriptions", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 200 }).notNull().unique(),
  name: varchar("name", { length: 200 }),
  isActive: boolean("is_active").default(true),
  isConfirmed: boolean("is_confirmed").default(false),
  confirmationToken: varchar("confirmation_token", { length: 255 }),
  unsubscribeToken: varchar("unsubscribe_token", { length: 255 }).notNull(),
  subscribedAt: timestamp("subscribed_at").defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
  unsubscribedAt: timestamp("unsubscribed_at"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  source: varchar("source", { length: 100 }).default("footer"), // footer, popup, landing_page
  preferences: jsonb("preferences"), // Email frequency, topics, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Events Category table
export const eventCategories = pgTable("event_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  icon: varchar("icon", { length: 50 }), // lucide-react icon name
  color: varchar("color", { length: 50 }), // tailwind color class
  description: text("description"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Events table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  slug: varchar("slug", { length: 300 }).notNull().unique(),
  description: text("description").notNull(),
  shortDescription: text("short_description"),
  categoryId: integer("category_id").references(() => eventCategories.id).notNull(),
  provinceId: integer("province_id").references(() => provinces.id).notNull(),
  localityId: integer("locality_id").references(() => localities.id),
  
  // Event details
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  startTime: varchar("start_time", { length: 10 }), // e.g., "19:00"
  endTime: varchar("end_time", { length: 10 }),
  timezone: varchar("timezone", { length: 50 }).default("Asia/Karachi"),
  isAllDay: boolean("is_all_day").default(false),
  isRecurring: boolean("is_recurring").default(false),
  recurrencePattern: jsonb("recurrence_pattern"), // For recurring events
  
  // Venue information
  venueName: varchar("venue_name", { length: 300 }),
  venueAddress: text("venue_address"),
  venueMapUrl: text("venue_map_url"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  
  // Pricing
  isFree: boolean("is_free").default(false),
  priceMin: decimal("price_min", { precision: 10, scale: 2 }),
  priceMax: decimal("price_max", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("PKR"),
  ticketUrl: text("ticket_url"),
  
  // Media
  featuredImage: text("featured_image"),
  imageGallery: jsonb("image_gallery"), // Array of image URLs
  videoUrl: text("video_url"),
  
  // Organizer information
  organizerName: varchar("organizer_name", { length: 300 }),
  organizerEmail: varchar("organizer_email", { length: 200 }),
  organizerPhone: varchar("organizer_phone", { length: 50 }),
  organizerWebsite: text("organizer_website"),
  
  // Additional details
  ageRestriction: varchar("age_restriction", { length: 50 }), // e.g., "All Ages", "18+", "Family Friendly"
  dressCode: varchar("dress_code", { length: 100 }),
  languages: jsonb("languages"), // Array of languages: ["English", "Arabic"]
  amenities: jsonb("amenities"), // ["Parking", "Wheelchair Access", "Food Available"]
  tags: jsonb("tags"), // SEO and filtering tags
  
  // Status and visibility
  status: varchar("status", { length: 50 }).default("draft"), // draft, published, cancelled, sold_out, completed
  isFeature: boolean("is_featured").default(false),
  isFeatured: boolean("is_featured").default(false),
  viewCount: integer("view_count").default(0),
  attendeeCount: integer("attendee_count").default(0),
  maxCapacity: integer("max_capacity"),
  
  // SEO
  metaTitle: varchar("meta_title", { length: 150 }),
  metaDescription: text("meta_description"),
  
  // Admin
  createdBy: varchar("created_by").references(() => users.id),
  updatedBy: varchar("updated_by").references(() => users.id),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Event Bookmarks/Saves table (for users to save events)
export const eventBookmarks = pgTable("event_bookmarks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("event_bookmarks_user_idx").on(table.userId),
  index("event_bookmarks_event_idx").on(table.eventId),
]);

// Relations
export const provincesRelations = relations(provinces, ({ many }) => ({
  localities: many(localities),
  businesses: many(businesses),
}));

export const localitiesRelations = relations(localities, ({ one, many }) => ({
  province: one(provinces, {
    fields: [localities.provinceId],
    references: [provinces.id],
  }),
  businesses: many(businesses),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "categoryParent",
  }),
  children: many(categories, {
    relationName: "categoryParent",
  }),
  businesses: many(businesses),
}));

export const businessesRelations = relations(businesses, ({ one, many }) => ({
  category: one(categories, {
    fields: [businesses.categoryId],
    references: [categories.id],
  }),
  province: one(provinces, {
    fields: [businesses.provinceId],
    references: [provinces.id],
  }),
  locality: one(localities, {
    fields: [businesses.localityId],
    references: [localities.id],
  }),
  owner: one(users, {
    fields: [businesses.ownerId],
    references: [users.id],
  }),
  images: many(businessImages),
  reviews: many(businessReviews),
  claims: many(businessClaims),
  enquiries: many(businessEnquiries),
}));

export const businessReviewsRelations = relations(businessReviews, ({ one }) => ({
  business: one(businesses, {
    fields: [businessReviews.businessId],
    references: [businesses.id],
  }),
  user: one(users, {
    fields: [businessReviews.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  ownedBusinesses: many(businesses),
  reviews: many(businessReviews),
  blogPosts: many(blogPosts),
  claims: many(businessClaims),
}));

// Menu relations
export const menusRelations = relations(menus, ({ many }) => ({
  items: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  menu: one(menus, {
    fields: [menuItems.menuId],
    references: [menus.id],
  }),
  parent: one(menuItems, {
    fields: [menuItems.parentId],
    references: [menuItems.id],
    relationName: "menuItemParent",
  }),
  children: many(menuItems, {
    relationName: "menuItemParent",
  }),
}));

// Insert Schemas
export const insertProvinceSchema = createInsertSchema(provinces).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  viewCount: true 
});
export const insertLocalitySchema = createInsertSchema(localities).omit({ id: true, createdAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true });
export const insertBusinessSchema = createInsertSchema(businesses).omit({ 
  id: true, 
  slug: true,
  createdAt: true, 
  updatedAt: true,
  viewCount: true,
  ratingAverage: true,
  ratingCount: true
});
export const insertBusinessReviewSchema = createInsertSchema(businessReviews).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const insertBusinessClaimSchema = createInsertSchema(businessClaims).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  emailSent: true,
  processedBy: true,
  processedAt: true
});
export const insertNewsCategorySchema = createInsertSchema(newsCategories).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertNewsArticleSchema = createInsertSchema(newsArticles).omit({ 
  id: true, 
  slug: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
  shareCount: true,
  likeCount: true
});
export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertBlogCategorySchema = createInsertSchema(blogCategories).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const insertBusinessEnquirySchema = createInsertSchema(businessEnquiries).omit({ 
  id: true, 
  createdAt: true 
});

export const insertNewsletterSubscriptionSchema = createInsertSchema(newsletterSubscriptions).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true,
  unsubscribeToken: true
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Provinces types are defined in the insert schemas section above

// Email template types
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;
export const insertEmailTemplateSchema = createInsertSchema(emailTemplates);

// System settings types
export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;

// Theme settings types
export type ThemeSettings = typeof themeSettings.$inferSelect;
export type InsertThemeSettings = typeof themeSettings.$inferInsert;

// Feature flags schema and types  
export const insertFeatureFlagSchema = createInsertSchema(featureFlags).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export type FeatureFlag = typeof featureFlags.$inferSelect;
export type InsertFeatureFlag = z.infer<typeof insertFeatureFlagSchema>;
export type Province = typeof provinces.$inferSelect;
export type Locality = typeof localities.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Business = typeof businesses.$inferSelect;
export type BusinessImage = typeof businessImages.$inferSelect;
export type BusinessReview = typeof businessReviews.$inferSelect;
export type BusinessClaim = typeof businessClaims.$inferSelect;
export type NewsCategory = typeof newsCategories.$inferSelect;
export type NewsArticle = typeof newsArticles.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
export type BlogCategory = typeof blogCategories.$inferSelect;
export type NewsletterSubscription = typeof newsletterSubscriptions.$inferSelect;
export type InsertNewsletterSubscription = z.infer<typeof insertNewsletterSubscriptionSchema>;
export type BusinessEnquiry = typeof businessEnquiries.$inferSelect;

export type InsertProvince = z.infer<typeof insertProvinceSchema>;
export type InsertLocality = z.infer<typeof insertLocalitySchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type InsertBusinessReview = z.infer<typeof insertBusinessReviewSchema>;
export type InsertBusinessClaim = z.infer<typeof insertBusinessClaimSchema>;
export type InsertNewsCategory = z.infer<typeof insertNewsCategorySchema>;
export type InsertNewsArticle = z.infer<typeof insertNewsArticleSchema>;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type InsertBlogCategory = z.infer<typeof insertBlogCategorySchema>;
export type InsertBusinessEnquiry = z.infer<typeof insertBusinessEnquirySchema>;

// Menu insert schemas
export const insertMenuSchema = createInsertSchema(menus).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertMenuItemSchema = createInsertSchema(menuItems).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Menu types
export type Menu = typeof menus.$inferSelect;
export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenu = z.infer<typeof insertMenuSchema>;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;

// Business Growth Metrics table
export const businessGrowthMetrics = pgTable("business_growth_metrics", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => businesses.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  metricType: varchar("metric_type", { length: 50 }).notNull(), // revenue, customers, orders, views, ratings
  metricValue: decimal("metric_value", { precision: 15, scale: 2 }).notNull(),
  targetValue: decimal("target_value", { precision: 15, scale: 2 }),
  period: varchar("period", { length: 20 }).notNull(), // daily, weekly, monthly, yearly
  date: timestamp("date").notNull(),
  currency: varchar("currency", { length: 3 }).default("PKR"),
  metadata: jsonb("metadata"), // Additional context like source, category, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Business Growth Goals table
export const businessGrowthGoals = pgTable("business_growth_goals", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => businesses.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  goalName: varchar("goal_name", { length: 255 }).notNull(),
  goalType: varchar("goal_type", { length: 50 }).notNull(), // revenue, customers, market_share, expansion
  targetValue: decimal("target_value", { precision: 15, scale: 2 }).notNull(),
  currentValue: decimal("current_value", { precision: 15, scale: 2 }).default("0"),
  targetDate: timestamp("target_date").notNull(),
  priority: varchar("priority", { length: 20 }).notNull(), // low, medium, high, critical
  status: varchar("status", { length: 20 }).default("active"), // active, completed, paused, cancelled
  description: text("description"),
  milestones: jsonb("milestones"), // JSON array of milestone objects
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Business Growth Visualizations table
export const businessGrowthVisualizations = pgTable("business_growth_visualizations", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => businesses.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  visualizationType: varchar("visualization_type", { length: 50 }).notNull(), // line_chart, bar_chart, pie_chart, dashboard
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  configuration: jsonb("configuration").notNull(), // Chart config, data sources, styling
  dataFilter: jsonb("data_filter"), // Filter criteria for data
  isPublic: boolean("is_public").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Business Growth Insights table
export const businessGrowthInsights = pgTable("business_growth_insights", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => businesses.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  insightType: varchar("insight_type", { length: 50 }).notNull(), // trend, anomaly, recommendation, milestone
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  severity: varchar("severity", { length: 20 }).default("medium"), // low, medium, high, critical
  actionable: boolean("actionable").default(true),
  data: jsonb("data"), // Supporting data for the insight
  isRead: boolean("is_read").default(false),
  generatedAt: timestamp("generated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Business Growth Metrics insert schemas
export const insertBusinessGrowthMetricSchema = createInsertSchema(businessGrowthMetrics).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertBusinessGrowthGoalSchema = createInsertSchema(businessGrowthGoals).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertBusinessGrowthVisualizationSchema = createInsertSchema(businessGrowthVisualizations).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertBusinessGrowthInsightSchema = createInsertSchema(businessGrowthInsights).omit({ 
  id: true, 
  createdAt: true, 
  generatedAt: true 
});

// Business Growth types
export type BusinessGrowthMetric = typeof businessGrowthMetrics.$inferSelect;
export type BusinessGrowthGoal = typeof businessGrowthGoals.$inferSelect;
export type BusinessGrowthVisualization = typeof businessGrowthVisualizations.$inferSelect;
export type BusinessGrowthInsight = typeof businessGrowthInsights.$inferSelect;

export type InsertBusinessGrowthMetric = z.infer<typeof insertBusinessGrowthMetricSchema>;
export type InsertBusinessGrowthGoal = z.infer<typeof insertBusinessGrowthGoalSchema>;
export type InsertBusinessGrowthVisualization = z.infer<typeof insertBusinessGrowthVisualizationSchema>;
export type InsertBusinessGrowthInsight = z.infer<typeof insertBusinessGrowthInsightSchema>;

// Premium Payments table
export const premiumPayments = pgTable("premium_payments", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => businesses.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }).unique().notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("PKR"),
  status: varchar("status", { length: 50 }).notNull(), // pending, succeeded, failed, canceled
  planType: varchar("plan_type", { length: 50 }).notNull(), // monthly, yearly
  planDuration: integer("plan_duration").notNull(), // in months
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPremiumPaymentSchema = createInsertSchema(premiumPayments).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export type PremiumPayment = typeof premiumPayments.$inferSelect;
export type InsertPremiumPayment = z.infer<typeof insertPremiumPaymentSchema>;



// System settings schema and types  
export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({ 
  createdAt: true, 
  updatedAt: true 
});

// Static Pages
export const staticPages = pgTable("static_pages", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  metaTitle: varchar("meta_title", { length: 60 }),
  metaDescription: varchar("meta_description", { length: 160 }),
  metaKeywords: varchar("meta_keywords", { length: 255 }),
  ogTitle: varchar("og_title", { length: 60 }),
  ogDescription: varchar("og_description", { length: 160 }),
  ogImage: varchar("og_image", { length: 500 }),
  schemaMarkup: jsonb("schema_markup"),
  canonicalUrl: varchar("canonical_url", { length: 500 }),
  isPublished: boolean("is_published").default(true),
  publishedAt: timestamp("published_at"), // Added publishedAt field
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Help Center Categories
export const helpCategories = pgTable("help_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Help Center Articles
export const helpArticles = pgTable("help_articles", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => helpCategories.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  content: text("content"),
  summary: text("summary"),
  tags: varchar("tags", { length: 500 }),
  metaTitle: varchar("meta_title", { length: 60 }),
  metaDescription: varchar("meta_description", { length: 160 }),
  metaKeywords: varchar("meta_keywords", { length: 255 }),
  views: integer("views").default(0),
  isPublished: boolean("is_published").default(true),
  isFeatured: boolean("is_featured").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Support Tickets
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  ticketNumber: varchar("ticket_number", { length: 20 }).notNull().unique(),
  userId: varchar("user_id").references(() => users.id),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  priority: varchar("priority", { length: 20 }).default("medium"),
  status: varchar("status", { length: 20 }).default("open"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  resolution: text("resolution"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// Support Ticket Replies
export const supportTicketReplies = pgTable("support_ticket_replies", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").references(() => supportTickets.id).notNull(),
  userId: varchar("user_id").references(() => users.id),
  message: text("message").notNull(),
  isStaffReply: boolean("is_staff_reply").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations for new tables
export const helpCategoriesRelations = relations(helpCategories, ({ many }) => ({
  articles: many(helpArticles),
}));

export const helpArticlesRelations = relations(helpArticles, ({ one }) => ({
  category: one(helpCategories, {
    fields: [helpArticles.categoryId],
    references: [helpCategories.id],
  }),
}));

export const supportTicketsRelations = relations(supportTickets, ({ one, many }) => ({
  user: one(users, {
    fields: [supportTickets.userId],
    references: [users.id],
  }),
  assignedUser: one(users, {
    fields: [supportTickets.assignedTo],
    references: [users.id],
  }),
  replies: many(supportTicketReplies),
}));

export const supportTicketRepliesRelations = relations(supportTicketReplies, ({ one }) => ({
  ticket: one(supportTickets, {
    fields: [supportTicketReplies.ticketId],
    references: [supportTickets.id],
  }),
  user: one(users, {
    fields: [supportTicketReplies.userId],
    references: [users.id],
  }),
}));

// Insert schemas for new tables
export const insertStaticPageSchema = createInsertSchema(staticPages).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertHelpCategorySchema = createInsertSchema(helpCategories).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertHelpArticleSchema = createInsertSchema(helpArticles).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({ 
  id: true,
  ticketNumber: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true
});

export const insertSupportTicketReplySchema = createInsertSchema(supportTicketReplies).omit({ 
  id: true,
  createdAt: true
});

// Types for new tables
export type StaticPage = typeof staticPages.$inferSelect;
export type InsertStaticPage = z.infer<typeof insertStaticPageSchema>;

export type HelpCategory = typeof helpCategories.$inferSelect;
export type InsertHelpCategory = z.infer<typeof insertHelpCategorySchema>;

export type HelpArticle = typeof helpArticles.$inferSelect;
export type InsertHelpArticle = z.infer<typeof insertHelpArticleSchema>;

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;

export type SupportTicketReply = typeof supportTicketReplies.$inferSelect;
export type InsertSupportTicketReply = z.infer<typeof insertSupportTicketReplySchema>;

// Business Growth Analytics Tables
export const businessMetrics = pgTable("business_metrics", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => businesses.id).notNull(),
  metricType: varchar("metric_type").notNull(), // views, inquiries, bookings, revenue, leads, clicks
  value: decimal("value", { precision: 15, scale: 2 }).notNull(),
  period: varchar("period").notNull(), // daily, weekly, monthly, yearly
  date: timestamp("date").notNull(),
  source: varchar("source"), // website, social_media, referral, direct, search
  metadata: jsonb("metadata"), // Additional context data
  createdAt: timestamp("created_at").defaultNow(),
});

export const businessGoals = pgTable("business_goals", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => businesses.id).notNull(),
  goalType: varchar("goal_type").notNull(), // revenue, customers, views, leads, expansion
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  targetValue: decimal("target_value", { precision: 15, scale: 2 }).notNull(),
  currentValue: decimal("current_value", { precision: 15, scale: 2 }).default("0"),
  unit: varchar("unit"), // PKR, customers, views, etc.
  deadline: timestamp("deadline"),
  priority: varchar("priority").default("medium"), // low, medium, high, critical
  status: varchar("status").default("active"), // active, completed, paused, cancelled
  progress: decimal("progress", { precision: 5, scale: 2 }).default("0"), // Percentage 0-100
  milestones: jsonb("milestones"), // Array of milestone objects
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const competitorAnalysis = pgTable("competitor_analysis", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => businesses.id).notNull(),
  competitorName: varchar("competitor_name", { length: 255 }).notNull(),
  competitorWebsite: varchar("competitor_website"),
  competitorId: integer("competitor_id").references(() => businesses.id), // If competitor is also in our system
  strengths: jsonb("strengths"), // Array of competitor strengths
  weaknesses: jsonb("weaknesses"), // Array of competitor weaknesses
  marketShare: decimal("market_share", { precision: 5, scale: 2 }),
  priceRange: varchar("price_range"),
  overallRating: decimal("overall_rating", { precision: 3, scale: 2 }),
  analysisNotes: text("analysis_notes"),
  lastAnalyzed: timestamp("last_analyzed").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const growthRecommendations = pgTable("growth_recommendations", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => businesses.id).notNull(),
  category: varchar("category").notNull(), // marketing, operations, finance, customer_service, expansion
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  priority: varchar("priority").default("medium"), // low, medium, high, critical
  impact: varchar("impact").default("medium"), // low, medium, high
  effort: varchar("effort").default("medium"), // low, medium, high
  timeframe: varchar("timeframe"), // immediate, short_term, medium_term, long_term
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  expectedReturn: decimal("expected_return", { precision: 10, scale: 2 }),
  actionSteps: jsonb("action_steps"), // Array of specific steps
  resources: jsonb("resources"), // Links, tools, contacts needed
  isImplemented: boolean("is_implemented").default(false),
  implementedAt: timestamp("implemented_at"),
  results: text("results"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for business analytics
export const insertBusinessMetricSchema = createInsertSchema(businessMetrics).omit({ 
  id: true,
  createdAt: true
});

export const insertBusinessGoalSchema = createInsertSchema(businessGoals).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCompetitorAnalysisSchema = createInsertSchema(competitorAnalysis).omit({ 
  id: true,
  createdAt: true
});

export const insertGrowthRecommendationSchema = createInsertSchema(growthRecommendations).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
});

// Types for business analytics
export type BusinessMetric = typeof businessMetrics.$inferSelect;
export type InsertBusinessMetric = z.infer<typeof insertBusinessMetricSchema>;

export type BusinessGoal = typeof businessGoals.$inferSelect;
export type InsertBusinessGoal = z.infer<typeof insertBusinessGoalSchema>;

export type CompetitorAnalysis = typeof competitorAnalysis.$inferSelect;
export type InsertCompetitorAnalysis = z.infer<typeof insertCompetitorAnalysisSchema>;

export type GrowthRecommendation = typeof growthRecommendations.$inferSelect;
export type InsertGrowthRecommendation = z.infer<typeof insertGrowthRecommendationSchema>;

// Subscription Plans schemas
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;

// Category Requests - for visitors to request missing categories
export const categoryRequests = pgTable("category_requests", {
  id: serial("id").primaryKey(),
  categoryName: varchar("category_name", { length: 255 }).notNull(),
  description: text("description"),
  parentCategory: varchar("parent_category", { length: 255 }),
  businessType: varchar("business_type", { length: 255 }),
  requesterName: varchar("requester_name", { length: 255 }).notNull(),
  requesterEmail: varchar("requester_email", { length: 255 }).notNull(),
  requesterPhone: varchar("requester_phone", { length: 50 }),
  companyName: varchar("company_name", { length: 255 }),
  justification: text("justification"),
  status: varchar("status", { length: 50 }).default("pending"), // pending, approved, rejected, in_review
  adminNotes: text("admin_notes"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCategoryRequestSchema = createInsertSchema(categoryRequests).omit({ 
  id: true,
  status: true,
  adminNotes: true,
  reviewedBy: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true
});

export type CategoryRequest = typeof categoryRequests.$inferSelect;
export type InsertCategoryRequest = z.infer<typeof insertCategoryRequestSchema>;

// Hotel Booking Tables - RateHawk Integration
export const hotelBookings = pgTable("hotel_bookings", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  hotelId: varchar("hotel_id").notNull(),
  hotelName: varchar("hotel_name").notNull(),
  roomId: varchar("room_id").notNull(),
  roomName: varchar("room_name").notNull(),
  rateId: varchar("rate_id").notNull(),
  
  // Booking details
  checkIn: varchar("check_in").notNull(), // YYYY-MM-DD
  checkOut: varchar("check_out").notNull(), // YYYY-MM-DD
  nights: integer("nights").notNull(),
  adults: integer("adults").notNull(),
  children: integer("children").default(0),
  
  // Pricing
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").default("USD"),
  priceBreakdown: jsonb("price_breakdown"), // { basePrice, taxes, fees }
  
  // Contact information
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone").notNull(),
  
  // Booking status
  status: varchar("status").notNull(), // confirmed, pending, cancelled
  confirmationNumber: varchar("confirmation_number"),
  rateHawkBookingId: varchar("ratehawk_booking_id"),
  
  // Hotel details
  hotelAddress: text("hotel_address"),
  hotelCity: varchar("hotel_city"),
  hotelCountry: varchar("hotel_country").default("Pakistan"),
  hotelRating: decimal("hotel_rating", { precision: 2, scale: 1 }),
  hotelStarRating: integer("hotel_star_rating"),
  
  // Policies and details
  cancellationPolicy: text("cancellation_policy"),
  boardType: varchar("board_type"), // BB, HB, FB, AI
  paymentType: varchar("payment_type"), // now, hotel
  
  // Additional information
  specialRequests: text("special_requests"),
  bookingNotes: text("booking_notes"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const hotelSearchHistory = pgTable("hotel_search_history", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  
  // Search parameters
  destination: varchar("destination").notNull(),
  checkIn: varchar("check_in").notNull(),
  checkOut: varchar("check_out").notNull(),
  adults: integer("adults").notNull(),
  children: integer("children").default(0),
  rooms: integer("rooms").default(1),
  currency: varchar("currency").default("USD"),
  
  // Search results
  resultsCount: integer("results_count").default(0),
  searchSource: varchar("search_source").default("ratehawk"), // ratehawk, fallback
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
});

export const hotelFavorites = pgTable("hotel_favorites", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  hotelId: varchar("hotel_id").notNull(),
  hotelName: varchar("hotel_name").notNull(),
  hotelCity: varchar("hotel_city"),
  hotelCountry: varchar("hotel_country").default("Pakistan"),
  hotelRating: decimal("hotel_rating", { precision: 2, scale: 1 }),
  hotelImage: text("hotel_image"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Hotel booking relations
export const hotelBookingsRelations = relations(hotelBookings, ({ one }) => ({
  user: one(users, {
    fields: [hotelBookings.userId],
    references: [users.id],
  }),
}));

export const hotelSearchHistoryRelations = relations(hotelSearchHistory, ({ one }) => ({
  user: one(users, {
    fields: [hotelSearchHistory.userId],
    references: [users.id],
  }),
}));

export const hotelFavoritesRelations = relations(hotelFavorites, ({ one }) => ({
  user: one(users, {
    fields: [hotelFavorites.userId],
    references: [users.id],
  }),
}));

// Hotel schemas and types
export const hotelSearchSchema = z.object({
  destination: z.string().min(1, "Destination is required"),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Check-in date must be in YYYY-MM-DD format"),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Check-out date must be in YYYY-MM-DD format"),
  adults: z.number().min(1, "At least 1 adult is required").max(10, "Maximum 10 adults allowed"),
  children: z.number().min(0).max(10).optional(),
  rooms: z.number().min(1).max(5).optional(),
  currency: z.string().optional(),
  language: z.string().optional(),
});

export const hotelBookingSchema = z.object({
  hotelId: z.string().min(1, "Hotel ID is required"),
  roomId: z.string().min(1, "Room ID is required"),
  rateId: z.string().min(1, "Rate ID is required"),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Check-in date must be in YYYY-MM-DD format"),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Check-out date must be in YYYY-MM-DD format"),
  adults: z.number().min(1).max(10),
  children: z.number().min(0).max(10).optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  paymentMethod: z.enum(["card", "bank_transfer"]),
  specialRequests: z.string().optional(),
});

export const insertHotelBookingSchema = createInsertSchema(hotelBookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHotelSearchSchema = createInsertSchema(hotelSearchHistory).omit({
  id: true,
  createdAt: true,
});

export const insertHotelFavoriteSchema = createInsertSchema(hotelFavorites).omit({
  id: true,
  createdAt: true,
});

export type HotelBooking = typeof hotelBookings.$inferSelect;
export type InsertHotelBooking = z.infer<typeof insertHotelBookingSchema>;

export type HotelSearchHistory = typeof hotelSearchHistory.$inferSelect;
export type InsertHotelSearch = z.infer<typeof insertHotelSearchSchema>;

export type HotelFavorite = typeof hotelFavorites.$inferSelect;
export type InsertHotelFavorite = z.infer<typeof insertHotelFavoriteSchema>;

export type HotelSearchParams = z.infer<typeof hotelSearchSchema>;
export type HotelBookingRequest = z.infer<typeof hotelBookingSchema>;

// Events relations
export const eventsRelations = relations(events, ({ one, many }) => ({
  category: one(eventCategories, {
    fields: [events.categoryId],
    references: [eventCategories.id],
  }),
  province: one(provinces, {
    fields: [events.provinceId],
    references: [provinces.id],
  }),
  locality: one(localities, {
    fields: [events.localityId],
    references: [localities.id],
  }),
  creator: one(users, {
    fields: [events.createdBy],
    references: [users.id],
  }),
  bookmarks: many(eventBookmarks),
}));

export const eventCategoriesRelations = relations(eventCategories, ({ many }) => ({
  events: many(events),
}));

export const eventBookmarksRelations = relations(eventBookmarks, ({ one }) => ({
  user: one(users, {
    fields: [eventBookmarks.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [eventBookmarks.eventId],
    references: [events.id],
  }),
}));

// Events Zod schemas
export const insertEventCategorySchema = createInsertSchema(eventCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  title: z.string().min(1, "Event title is required").max(300),
  slug: z.string().min(1, "Slug is required").max(300),
  description: z.string().min(1, "Description is required"),
  startDate: z.date().or(z.string()),
  endDate: z.date().or(z.string()),
  priceMin: z.coerce.number().optional(),
  priceMax: z.coerce.number().optional(),
});

export const insertEventBookmarkSchema = createInsertSchema(eventBookmarks).omit({
  id: true,
  createdAt: true,
});

// Events types
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type EventCategory = typeof eventCategories.$inferSelect;
export type InsertEventCategory = z.infer<typeof insertEventCategorySchema>;

export type EventBookmark = typeof eventBookmarks.$inferSelect;
export type InsertEventBookmark = z.infer<typeof insertEventBookmarkSchema>;
