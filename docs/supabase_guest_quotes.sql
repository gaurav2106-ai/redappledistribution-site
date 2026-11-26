-- Red Apple Distribution: keep a copy of every guest quote request (visitors who are not signed in).
-- Run once in Supabase > SQL Editor. Safe to run again.
-- Needs the is_admin() function from the original setup.
-- The send-lead function writes rows (service role, bypasses RLS). Staff can read them and mark them contacted.

create table if not exists public.guest_quotes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  ref text,
  total_boxes numeric not null default 0,
  payload jsonb not null,
  replied_at timestamptz,
  replied_by text
);

alter table public.guest_quotes enable row level security;
revoke all on public.guest_quotes from anon;
revoke all on public.guest_quotes from authenticated;
grant select, update (replied_at, replied_by) on public.guest_quotes to authenticated;

drop policy if exists guest_quotes_admin_select on public.guest_quotes;
create policy guest_quotes_admin_select on public.guest_quotes for select to authenticated using (public.is_admin());
drop policy if exists guest_quotes_admin_update on public.guest_quotes;
create policy guest_quotes_admin_update on public.guest_quotes for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Check: should list the two policies.
select policyname, cmd from pg_policies where schemaname = 'public' and tablename = 'guest_quotes' order by policyname;
