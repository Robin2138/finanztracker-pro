-- FinanzTracker: minimal cloud schema for Supabase/Postgres.
-- Run this in Supabase SQL Editor after creating a project.

create table if not exists public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free',
  stripe_customer_id text,
  stripe_subscription_id text,
  status text,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;
alter table public.entitlements enable row level security;

drop policy if exists "user_data_self" on public.user_data;
create policy "user_data_self" on public.user_data
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "entitlement_read_self" on public.entitlements;
create policy "entitlement_read_self" on public.entitlements
for select using (auth.uid() = user_id);

-- No client-side insert/update/delete policy is granted for entitlements.
-- Stripe webhook should use the service role key on the server.
