-- ============================================================
-- Signeo MVP Schema
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Organizations ----------
create table organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

-- ---------- Profiles ----------
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  org_id      uuid not null references organizations(id),
  full_name   text not null,
  email       text not null unique,
  created_at  timestamptz not null default now()
);

-- ---------- Documents ----------
create table documents (
  id                      uuid primary key default gen_random_uuid(),
  org_id                  uuid not null references organizations(id),
  sender_id               uuid not null references profiles(id),
  title                   text not null,
  status                  text not null default 'draft'
    check (status in (
      'draft','sent','viewed','partially_signed','completed','voided','expired'
    )),
  original_storage_path   text,
  signed_storage_path     text,
  signed_pdf_hash         text,
  page_count              int,
  signing_order_enabled   boolean not null default false,
  expires_at              timestamptz,
  sent_at                 timestamptz,
  completed_at            timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index idx_documents_sender on documents(sender_id);
create index idx_documents_status on documents(status);

-- ---------- Recipients ----------
create table recipients (
  id              uuid primary key default gen_random_uuid(),
  document_id     uuid not null references documents(id) on delete cascade,
  name            text not null,
  email           text not null,
  role            text not null default 'signer'
    check (role in ('signer','viewer')),
  signing_order   int not null default 1,
  status          text not null default 'pending'
    check (status in ('pending','notified','viewed','signed','declined')),
  signed_at       timestamptz,
  ip_address      inet,
  user_agent      text,
  created_at      timestamptz not null default now()
);

create index idx_recipients_doc on recipients(document_id);

-- ---------- Signing Tokens ----------
create table signing_tokens (
  id              uuid primary key default gen_random_uuid(),
  recipient_id    uuid not null references recipients(id) on delete cascade,
  token_hash      text not null unique,
  expires_at      timestamptz not null,
  revoked         boolean not null default false,
  created_at      timestamptz not null default now()
);

create index idx_tokens_hash on signing_tokens(token_hash);

-- ---------- Fields ----------
create table fields (
  id              uuid primary key default gen_random_uuid(),
  document_id     uuid not null references documents(id) on delete cascade,
  recipient_id    uuid not null references recipients(id) on delete cascade,
  type            text not null
    check (type in ('signature','initials','date','full_name','text','checkbox')),
  page            int not null,
  x               numeric not null,
  y               numeric not null,
  width           numeric not null,
  height          numeric not null,
  required        boolean not null default true,
  label           text,
  value           text,
  filled_at       timestamptz,
  created_at      timestamptz not null default now()
);

create index idx_fields_doc on fields(document_id);
create index idx_fields_recipient on fields(recipient_id);

-- ---------- Audit Events ----------
create table audit_events (
  id              uuid primary key default gen_random_uuid(),
  document_id     uuid not null references documents(id),
  recipient_id    uuid references recipients(id),
  actor_id        uuid,
  event_type      text not null,
  ip_address      inet,
  user_agent      text,
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now()
);

create index idx_audit_doc on audit_events(document_id);
create index idx_audit_time on audit_events(created_at);

-- ---------- Auto-create org + profile on signup ----------
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_org_id uuid;
  display_name text;
begin
  display_name := coalesce(
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'name', ''),
    nullif(new.raw_user_meta_data->>'user_name', ''),
    nullif(new.raw_user_meta_data->>'preferred_username', ''),
    split_part(new.email, '@', 1)
  );

  insert into organizations (name) values (
    display_name || '''s Org'
  ) returning id into new_org_id;

  insert into profiles (id, org_id, full_name, email) values (
    new.id,
    new_org_id,
    display_name,
    new.email
  );

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Auto-update updated_at ----------
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger documents_updated_at
  before update on documents
  for each row execute function update_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

-- Organizations
alter table organizations enable row level security;

create policy "users read own org"
  on organizations for select
  using (id in (select org_id from profiles where id = auth.uid()));

-- Profiles
alter table profiles enable row level security;

create policy "read own profile"
  on profiles for select
  using (id = auth.uid());

-- Documents
alter table documents enable row level security;

create policy "select org documents"
  on documents for select
  using (org_id = (select org_id from profiles where id = auth.uid()));

create policy "insert own documents"
  on documents for insert
  with check (sender_id = auth.uid());

create policy "update own documents"
  on documents for update
  using (sender_id = auth.uid());

create policy "delete own draft documents"
  on documents for delete
  using (sender_id = auth.uid() and status = 'draft');

-- Recipients
alter table recipients enable row level security;

create policy "sender selects recipients"
  on recipients for select
  using (document_id in (select id from documents where sender_id = auth.uid()));

create policy "sender inserts recipients"
  on recipients for insert
  with check (document_id in (select id from documents where sender_id = auth.uid()));

create policy "sender updates recipients"
  on recipients for update
  using (document_id in (select id from documents where sender_id = auth.uid()));

create policy "sender deletes recipients"
  on recipients for delete
  using (document_id in (select id from documents where sender_id = auth.uid()));

-- Fields
alter table fields enable row level security;

create policy "sender selects fields"
  on fields for select
  using (document_id in (select id from documents where sender_id = auth.uid()));

create policy "sender inserts fields"
  on fields for insert
  with check (document_id in (select id from documents where sender_id = auth.uid()));

create policy "sender updates fields"
  on fields for update
  using (document_id in (select id from documents where sender_id = auth.uid()));

create policy "sender deletes fields"
  on fields for delete
  using (document_id in (select id from documents where sender_id = auth.uid()));

-- Audit Events (append-only)
alter table audit_events enable row level security;

create policy "sender reads audit"
  on audit_events for select
  using (document_id in (select id from documents where sender_id = auth.uid()));

-- Signing Tokens
alter table signing_tokens enable row level security;

create policy "sender manages tokens"
  on signing_tokens for all
  using (
    recipient_id in (
      select r.id from recipients r
      join documents d on r.document_id = d.id
      where d.sender_id = auth.uid()
    )
  );

-- ============================================================
-- Storage Buckets (run via Supabase dashboard or CLI)
-- ============================================================
-- create policy on storage.objects for bucket 'documents'
-- create policy on storage.objects for bucket 'signatures'
