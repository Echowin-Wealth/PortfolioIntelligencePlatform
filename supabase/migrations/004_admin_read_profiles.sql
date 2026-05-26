-- AlphaGen — Admins can read all profiles
-- The Report History console joins each report to its owner's profile. Until
-- now profiles RLS only allowed `auth.uid() = id` (self), so an admin could not
-- see other users' name / email / phone. Add an admin read policy.
--
-- A policy that determined admin status by selecting from profiles *inside* a
-- profiles policy would recurse infinitely, so gate it through a SECURITY
-- DEFINER helper that bypasses RLS.
-- Run this in the Supabase SQL Editor.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- Permissive SELECT policies are OR-ed together, so this stacks with the
-- existing self-select policy: a user sees their own row, an admin sees all.
drop policy if exists "profiles_admin_select" on public.profiles;
create policy "profiles_admin_select" on public.profiles
  for select using (public.is_admin());
