-- AlphaGen — Profiles, admin gating, and per-user report persistence
-- Adds:
--   * public.profiles (name/email/phone/phone_verified/is_admin) keyed to auth.users
--   * trigger to auto-create a profile row on signup
--   * report_history.user_id + report_history.funds_json for per-user history + PDF re-render
--   * RLS so a user reads only their own report_history, admins read all
-- Removes:
--   * public.rate_limits (replaced by per-user counting on report_history)

-- ── profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  name            text not null default '',
  email           text not null default '',
  phone           text,
  phone_verified  boolean not null default false,
  is_admin        boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_self_insert" on public.profiles;
create policy "profiles_self_insert" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Keep updated_at fresh.
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Auto-create a profile row whenever a new auth.users row is inserted.
-- Pulls name from Google's raw_user_meta_data when present.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      ''
    ),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profile rows for any users that pre-date this migration
-- (e.g. existing email/password admin).
insert into public.profiles (id, name, email)
select u.id, coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''), coalesce(u.email, '')
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- ── report_history extensions ──────────────────────────────────────────────
alter table public.report_history
  add column if not exists user_id    uuid references auth.users(id) on delete set null,
  add column if not exists funds_json jsonb;

create index if not exists report_history_user_id_created_at_idx
  on public.report_history (user_id, created_at desc);

-- Replace the broad "any authenticated user reads everything" policy with
-- self-or-admin. Admin status comes from profiles.is_admin.
drop policy if exists "Auth read report_history" on public.report_history;
drop policy if exists "report_history_self_or_admin_read" on public.report_history;
create policy "report_history_self_or_admin_read" on public.report_history
  for select using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- Users can patch their own rows (used by the client to write alpha metrics
-- back after the edge function has inserted the skeleton row).
drop policy if exists "report_history_self_update" on public.report_history;
create policy "report_history_self_update" on public.report_history
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── drop the IP rate-limits table ──────────────────────────────────────────
drop table if exists public.rate_limits;
