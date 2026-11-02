-- Approval workflow: who approved/rejected a listing, when, and why (shown to the owner)
alter table businesses add column if not exists rejection_reason text;
alter table businesses add column if not exists approved_at timestamp;
alter table businesses add column if not exists approved_by varchar;
