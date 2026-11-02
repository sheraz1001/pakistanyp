-- Tables defined in shared/schema.ts that were never created (generated 2026-10-29). Safe to re-run.
BEGIN;
CREATE TABLE IF NOT EXISTS "analytics_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"page_views" integer DEFAULT 0,
	"unique_visitors" integer DEFAULT 0,
	"bounce_rate" numeric(5, 2) DEFAULT '0',
	"avg_session_duration" integer DEFAULT 0,
	"top_pages" jsonb,
	"top_countries" jsonb,
	"top_devices" jsonb,
	"top_browsers" jsonb,
	"conversion_rate" numeric(5, 2) DEFAULT '0',
	"revenue" numeric(10, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now()
);;
CREATE TABLE IF NOT EXISTS "api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"key_hash" varchar(255) NOT NULL,
	"user_id" varchar,
	"permissions" jsonb,
	"rate_limit" integer DEFAULT 1000,
	"is_active" boolean DEFAULT true,
	"last_used" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);;
CREATE TABLE IF NOT EXISTS "business_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_id" integer NOT NULL,
	"goal_type" varchar NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"target_value" numeric(15, 2) NOT NULL,
	"current_value" numeric(15, 2) DEFAULT '0',
	"unit" varchar,
	"deadline" timestamp,
	"priority" varchar DEFAULT 'medium',
	"status" varchar DEFAULT 'active',
	"progress" numeric(5, 2) DEFAULT '0',
	"milestones" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);;
CREATE TABLE IF NOT EXISTS "business_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_id" integer NOT NULL,
	"metric_type" varchar NOT NULL,
	"value" numeric(15, 2) NOT NULL,
	"period" varchar NOT NULL,
	"date" timestamp NOT NULL,
	"source" varchar,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);;
CREATE TABLE IF NOT EXISTS "competitor_analysis" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_id" integer NOT NULL,
	"competitor_name" varchar(255) NOT NULL,
	"competitor_website" varchar,
	"competitor_id" integer,
	"strengths" jsonb,
	"weaknesses" jsonb,
	"market_share" numeric(5, 2),
	"price_range" varchar,
	"overall_rating" numeric(3, 2),
	"analysis_notes" text,
	"last_analyzed" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);;
CREATE TABLE IF NOT EXISTS "growth_recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_id" integer NOT NULL,
	"category" varchar NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"priority" varchar DEFAULT 'medium',
	"impact" varchar DEFAULT 'medium',
	"effort" varchar DEFAULT 'medium',
	"timeframe" varchar,
	"estimated_cost" numeric(10, 2),
	"expected_return" numeric(10, 2),
	"action_steps" jsonb,
	"resources" jsonb,
	"is_implemented" boolean DEFAULT false,
	"implemented_at" timestamp,
	"results" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);;
CREATE TABLE IF NOT EXISTS "hotel_bookings" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"hotel_id" varchar NOT NULL,
	"hotel_name" varchar NOT NULL,
	"room_id" varchar NOT NULL,
	"room_name" varchar NOT NULL,
	"rate_id" varchar NOT NULL,
	"check_in" varchar NOT NULL,
	"check_out" varchar NOT NULL,
	"nights" integer NOT NULL,
	"adults" integer NOT NULL,
	"children" integer DEFAULT 0,
	"total_price" numeric(10, 2) NOT NULL,
	"currency" varchar DEFAULT 'USD',
	"price_breakdown" jsonb,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"phone" varchar NOT NULL,
	"status" varchar NOT NULL,
	"confirmation_number" varchar,
	"ratehawk_booking_id" varchar,
	"hotel_address" text,
	"hotel_city" varchar,
	"hotel_country" varchar DEFAULT 'Pakistani',
	"hotel_rating" numeric(2, 1),
	"hotel_star_rating" integer,
	"cancellation_policy" text,
	"board_type" varchar,
	"payment_type" varchar,
	"special_requests" text,
	"booking_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);;
CREATE TABLE IF NOT EXISTS "hotel_favorites" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"hotel_id" varchar NOT NULL,
	"hotel_name" varchar NOT NULL,
	"hotel_city" varchar,
	"hotel_country" varchar DEFAULT 'Pakistani',
	"hotel_rating" numeric(2, 1),
	"hotel_image" text,
	"created_at" timestamp DEFAULT now()
);;
CREATE TABLE IF NOT EXISTS "hotel_search_history" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"destination" varchar NOT NULL,
	"check_in" varchar NOT NULL,
	"check_out" varchar NOT NULL,
	"adults" integer NOT NULL,
	"children" integer DEFAULT 0,
	"rooms" integer DEFAULT 1,
	"currency" varchar DEFAULT 'USD',
	"results_count" integer DEFAULT 0,
	"search_source" varchar DEFAULT 'ratehawk',
	"created_at" timestamp DEFAULT now()
);;
CREATE TABLE IF NOT EXISTS "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"subscription_id" integer,
	"stripe_invoice_id" varchar,
	"number" varchar(50),
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'PKR',
	"status" varchar NOT NULL,
	"paid_at" timestamp,
	"due_date" timestamp,
	"items" jsonb,
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);;
CREATE TABLE IF NOT EXISTS "media_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"filename" varchar(255) NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"mime_type" varchar(100),
	"size" integer,
	"path" varchar(500) NOT NULL,
	"url" varchar(500) NOT NULL,
	"alt" varchar(255),
	"description" text,
	"folder" varchar(255) DEFAULT 'uploads',
	"uploaded_by" varchar,
	"is_public" boolean DEFAULT true,
	"download_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);;
CREATE TABLE IF NOT EXISTS "news_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(50) DEFAULT '#3B82F6',
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "news_categories_slug_unique" UNIQUE("slug")
);;
CREATE TABLE IF NOT EXISTS "page_components" (
	"id" serial PRIMARY KEY NOT NULL,
	"page_id" integer NOT NULL,
	"type" varchar(100) NOT NULL,
	"name" varchar(255),
	"content" jsonb NOT NULL,
	"styles" jsonb,
	"position" integer DEFAULT 0,
	"is_visible" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);;
CREATE TABLE IF NOT EXISTS "pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"meta_title" varchar(255),
	"meta_description" text,
	"meta_keywords" text,
	"featured_image" text,
	"template" varchar DEFAULT 'default',
	"status" varchar DEFAULT 'draft',
	"author_id" varchar,
	"view_count" integer DEFAULT 0,
	"is_homepage" boolean DEFAULT false,
	"custom_css" text,
	"custom_js" text,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "pages_slug_unique" UNIQUE("slug")
);;
CREATE TABLE IF NOT EXISTS "seo_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"page_type" varchar(100) NOT NULL,
	"page_id" varchar,
	"title" varchar(255),
	"description" text,
	"keywords" text,
	"canonical_url" varchar,
	"og_title" varchar(255),
	"og_description" text,
	"og_image" varchar,
	"twitter_title" varchar(255),
	"twitter_description" text,
	"twitter_image" varchar,
	"schema_markup" jsonb,
	"robots" varchar DEFAULT 'index,follow',
	"custom_meta" jsonb,
	"priority" numeric(3, 2) DEFAULT '0.5',
	"change_freq" varchar DEFAULT 'weekly',
	"robots_txt" text,
	"sitemap_config" jsonb,
	"sitemap_enabled" boolean DEFAULT true,
	"base_url" varchar DEFAULT 'https://pakistanyp.com',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);;
CREATE TABLE IF NOT EXISTS "static_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text,
	"meta_title" varchar(60),
	"meta_description" varchar(160),
	"meta_keywords" varchar(255),
	"og_title" varchar(60),
	"og_description" varchar(160),
	"og_image" varchar(500),
	"schema_markup" jsonb,
	"canonical_url" varchar(500),
	"is_published" boolean DEFAULT true,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "static_pages_slug_unique" UNIQUE("slug")
);;
ALTER TABLE "api_keys" DROP CONSTRAINT IF EXISTS "api_keys_user_id_users_id_fk", ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;;
ALTER TABLE "business_goals" DROP CONSTRAINT IF EXISTS "business_goals_business_id_businesses_id_fk", ADD CONSTRAINT "business_goals_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;;
ALTER TABLE "business_metrics" DROP CONSTRAINT IF EXISTS "business_metrics_business_id_businesses_id_fk", ADD CONSTRAINT "business_metrics_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;;
ALTER TABLE "competitor_analysis" DROP CONSTRAINT IF EXISTS "competitor_analysis_business_id_businesses_id_fk", ADD CONSTRAINT "competitor_analysis_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;;
ALTER TABLE "competitor_analysis" DROP CONSTRAINT IF EXISTS "competitor_analysis_competitor_id_businesses_id_fk", ADD CONSTRAINT "competitor_analysis_competitor_id_businesses_id_fk" FOREIGN KEY ("competitor_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;;
ALTER TABLE "growth_recommendations" DROP CONSTRAINT IF EXISTS "growth_recommendations_business_id_businesses_id_fk", ADD CONSTRAINT "growth_recommendations_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;;
ALTER TABLE "hotel_bookings" DROP CONSTRAINT IF EXISTS "hotel_bookings_user_id_users_id_fk", ADD CONSTRAINT "hotel_bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;;
ALTER TABLE "hotel_favorites" DROP CONSTRAINT IF EXISTS "hotel_favorites_user_id_users_id_fk", ADD CONSTRAINT "hotel_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;;
ALTER TABLE "hotel_search_history" DROP CONSTRAINT IF EXISTS "hotel_search_history_user_id_users_id_fk", ADD CONSTRAINT "hotel_search_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;;
ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "invoices_user_id_users_id_fk", ADD CONSTRAINT "invoices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;;
ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "invoices_subscription_id_user_subscriptions_id_fk", ADD CONSTRAINT "invoices_subscription_id_user_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE no action ON UPDATE no action;;
ALTER TABLE "media_files" DROP CONSTRAINT IF EXISTS "media_files_uploaded_by_users_id_fk", ADD CONSTRAINT "media_files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;;
ALTER TABLE "page_components" DROP CONSTRAINT IF EXISTS "page_components_page_id_pages_id_fk", ADD CONSTRAINT "page_components_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE no action ON UPDATE no action;;
ALTER TABLE "pages" DROP CONSTRAINT IF EXISTS "pages_author_id_users_id_fk", ADD CONSTRAINT "pages_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;;
COMMIT;
