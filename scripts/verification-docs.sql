-- Uploaded verification documents (stored in the DB so they persist across Autoscale instances)
create table if not exists verification_documents (
  id serial primary key,
  request_id integer not null references verification_requests(id) on delete cascade,
  business_id integer not null,
  user_id varchar not null,
  doc_type varchar(40) not null default 'trade_licence',
  file_name varchar(255) not null,
  mime_type varchar(100) not null,
  size_bytes integer not null,
  data bytea not null,
  created_at timestamp default now()
);
create index if not exists verification_documents_request_idx on verification_documents (request_id);
alter table verification_requests add column if not exists rejection_reason text;
alter table verification_requests add column if not exists review_started_at timestamp;
