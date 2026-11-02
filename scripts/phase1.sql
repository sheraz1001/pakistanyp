-- Phase 1: verification requests, structured reviews, leads. Idempotent; run at every startup by ensureSchema.

create table if not exists verification_requests (
  id serial primary key,
  business_id integer not null references businesses(id) on delete cascade,
  user_id varchar not null,
  licence_number varchar(100),
  licence_authority varchar(120),
  licence_expiry date,
  licence_document_url text,
  business_email varchar(255),
  email_token varchar(64),
  email_verified_at timestamp,
  phone varchar(40),
  phone_otp varchar(10),
  phone_otp_expires timestamp,
  phone_verified_at timestamp,
  status varchar(20) not null default 'pending',
  admin_notes text,
  processed_by varchar,
  processed_at timestamp,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
create index if not exists verification_requests_business_idx on verification_requests (business_id);
create index if not exists verification_requests_status_idx on verification_requests (status);

alter table business_reviews add column if not exists project_type varchar(120);
alter table business_reviews add column if not exists budget_band varchar(40);
alter table business_reviews add column if not exists duration varchar(40);
alter table business_reviews add column if not exists score_quality integer;
alter table business_reviews add column if not exists score_cost integer;
alter table business_reviews add column if not exists score_schedule integer;
alter table business_reviews add column if not exists score_refer integer;
alter table business_reviews add column if not exists reviewer_name varchar(120);
alter table business_reviews add column if not exists reviewer_company varchar(160);
alter table business_reviews add column if not exists reviewer_role varchar(120);
alter table business_reviews add column if not exists reviewer_email varchar(255);
alter table business_reviews add column if not exists reviewer_linkedin varchar(255);
alter table business_reviews add column if not exists status varchar(20);
alter table business_reviews add column if not exists ip_hash varchar(64);
alter table business_reviews add column if not exists fraud_flags jsonb default '[]'::jsonb;
alter table business_reviews add column if not exists moderated_by varchar;
alter table business_reviews add column if not exists moderated_at timestamp;
alter table business_reviews alter column user_id drop not null;
-- reviews that existed before moderation keep their visibility; anything newer without a status waits for moderation
update business_reviews set status = case when coalesce(is_visible, true) then 'approved' else 'rejected' end where status is null and created_at < timestamp '2026-10-30';
update business_reviews set status = 'pending', is_visible = false where status is null;
create index if not exists business_reviews_status_idx on business_reviews (status);

create table if not exists leads (
  id serial primary key,
  business_id integer references businesses(id) on delete set null,
  category_id integer,
  province_id integer,
  name varchar(120) not null,
  email varchar(255) not null,
  phone varchar(40),
  company varchar(160),
  service_needed varchar(200),
  budget_band varchar(40),
  timeline varchar(40),
  message text,
  source varchar(40) default 'profile',
  status varchar(20) default 'new',
  ip_hash varchar(64),
  created_at timestamp default now(),
  updated_at timestamp default now()
);
create index if not exists leads_created_idx on leads (created_at desc);

create table if not exists lead_assignments (
  id serial primary key,
  lead_id integer not null references leads(id) on delete cascade,
  business_id integer not null references businesses(id) on delete cascade,
  status varchar(20) default 'new',
  notes text,
  viewed_at timestamp,
  updated_at timestamp default now(),
  unique (lead_id, business_id)
);
create index if not exists lead_assignments_business_idx on lead_assignments (business_id);
