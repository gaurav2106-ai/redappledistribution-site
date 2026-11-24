-- Red Apple Distribution: let staff save a quote on behalf of a retailer (Admin > New quote).
-- Run once in Supabase > SQL Editor. Safe to run again.
-- Needs the is_admin() function and admin_emails table from the original setup.

drop policy if exists "Admins can insert quotes for any retailer" on public.quotes;
create policy "Admins can insert quotes for any retailer"
  on public.quotes for insert to authenticated
  with check (public.is_admin());

-- Check: should list the new policy.
select policyname, cmd from pg_policies where schemaname = 'public' and tablename = 'quotes' order by policyname;

-- Staff can cancel a quote (stored on the quote itself, nothing is deleted).
-- If staff can already mark quotes as replied, this policy is already in place; running it again is harmless.
drop policy if exists "Admins can update quotes" on public.quotes;
create policy "Admins can update quotes"
  on public.quotes for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Owners only (Gaurav, Sapna, sales@) can approve/revoke accounts and read every profile.
-- Other staff (agents) can read approved retailers only, which is what the New quote picker needs.
create or replace function public.is_owner() returns boolean language sql stable security definer set search_path = public as $$
  select lower(coalesce(auth.jwt() ->> 'email','')) in ('gaurav@redappledistro.com','sapnameena@redappledistro.com','sales@redappledistro.com') $$;
drop policy if exists profiles_admin_select on public.profiles;
drop policy if exists profiles_owner_select on public.profiles;
create policy profiles_owner_select on public.profiles for select to authenticated using (public.is_admin() and public.is_owner());
drop policy if exists profiles_agent_select_approved on public.profiles;
create policy profiles_agent_select_approved on public.profiles for select to authenticated using (public.is_admin() and status = 'approved');
drop policy if exists profiles_admin_update on public.profiles;
drop policy if exists profiles_owner_update on public.profiles;
create policy profiles_owner_update on public.profiles for update to authenticated using (public.is_admin() and public.is_owner()) with check (public.is_admin() and public.is_owner());

-- Security hardening (run once; safe to repeat): retailers cannot edit saved quotes or insert pre-replied ones;
-- the public (anon) role gets no direct table access and cannot call internal helper functions.
drop policy if exists quotes_update_own on public.quotes;
drop policy if exists quotes_insert_own on public.quotes;
create policy quotes_insert_own on public.quotes for insert to authenticated with check (user_id = auth.uid() and replied_at is null);
revoke all on public.admin_emails, public.carts, public.profiles, public.quotes from anon;
revoke execute on function public.is_admin(), public.is_owner(), public.guard_profile_status(), public.guard_quote_fields(), public.handle_new_user() from anon, public;
grant execute on function public.is_admin(), public.is_owner() to authenticated;
