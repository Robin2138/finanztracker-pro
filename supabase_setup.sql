-- FinanzTracker – Supabase Production Setup
-- 1) Create a Supabase project.
-- 2) Open SQL Editor.
-- 3) Paste this whole file and click Run.
--
-- The browser uses the publishable key + Supabase Auth token.
-- The secret key is server-only and never belongs in the browser.

create table if not exists public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','pro')),
  stripe_customer_id text,
  stripe_subscription_id text,
  status text,
  updated_at timestamptz not null default now()
);

create index if not exists user_data_updated_at_idx
  on public.user_data (updated_at desc);

create index if not exists entitlements_status_idx
  on public.entitlements (status);

alter table public.user_data enable row level security;
alter table public.entitlements enable row level security;

-- Remove broad client permissions first.
revoke all on public.user_data from anon;
revoke all on public.user_data from authenticated;
revoke all on public.entitlements from anon;
revoke all on public.entitlements from authenticated;

-- Logged-in users can only read/write their own tracker payload.
grant select, insert, update, delete on public.user_data to authenticated;

drop policy if exists "user_data_select_own" on public.user_data;
create policy "user_data_select_own"
  on public.user_data
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_data_insert_own" on public.user_data;
create policy "user_data_insert_own"
  on public.user_data
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_data_update_own" on public.user_data;
create policy "user_data_update_own"
  on public.user_data
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_data_delete_own" on public.user_data;
create policy "user_data_delete_own"
  on public.user_data
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- The browser may only read its own PRO entitlement.
grant select on public.entitlements to authenticated;

drop policy if exists "entitlement_read_self" on public.entitlements;
create policy "entitlement_read_self"
  on public.entitlements
  for select
  to authenticated
  using (auth.uid() = user_id);

-- No client insert/update/delete on entitlements.
-- The Stripe webhook uses the server-side secret key to upsert these rows.

-- Quick verification after running this file:
-- select tablename, rowsecurity
-- from pg_tables
-- where schemaname = 'public'
--   and tablename in ('user_data','entitlements');
