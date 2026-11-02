-- Phase 2: membership tiers, sponsored slots, rankings support. Idempotent.

alter table businesses add column if not exists tier varchar(20) default 'free';
alter table businesses add column if not exists tier_expires_at timestamp;
alter table businesses add column if not exists tier_interval varchar(10);
alter table businesses add column if not exists stripe_customer_id varchar(80);
alter table businesses add column if not exists stripe_subscription_id varchar(80);
update businesses set tier = 'pro' where coalesce(tier, 'free') = 'free' and is_premium = true and (premium_expires_at is null or premium_expires_at > now());
create index if not exists businesses_tier_idx on businesses (tier);

create table if not exists sponsored_slots (
  id serial primary key,
  business_id integer not null references businesses(id) on delete cascade,
  category_id integer references categories(id) on delete cascade,
  province_id integer references provinces(id) on delete cascade,
  position integer default 1,
  starts_at timestamp default now(),
  ends_at timestamp,
  note text,
  created_by varchar,
  created_at timestamp default now()
);
create index if not exists sponsored_slots_lookup_idx on sponsored_slots (category_id, province_id, ends_at);

create table if not exists billing_events (
  id serial primary key,
  business_id integer,
  user_id varchar,
  tier varchar(20),
  interval varchar(10),
  amount numeric(10,2),
  currency varchar(10),
  stripe_session_id varchar(120),
  stripe_subscription_id varchar(80),
  event_type varchar(40),
  payload jsonb,
  created_at timestamp default now()
);
create unique index if not exists billing_events_session_idx on billing_events (stripe_session_id, event_type);

-- Phase 2c: richer profiles
alter table businesses add column if not exists service_prices jsonb default '[]'::jsonb;
alter table businesses add column if not exists portfolio jsonb default '[]'::jsonb;
alter table businesses add column if not exists team jsonb default '[]'::jsonb;
alter table businesses add column if not exists faqs jsonb default '[]'::jsonb;
