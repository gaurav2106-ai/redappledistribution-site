-- Red Apple Distribution: add the staff admins in Supabase.
-- Run once in Supabase > SQL Editor. Safe to run again.
-- Run it AGAIN after each agent has signed up and confirmed their email,
-- because the last statement links each address to its real account.

insert into public.admin_emails(email) values
  ('gaurav@redappledistro.com'),
  ('sales@redappledistro.com'),
  ('ayesha@redappledistro.com'),
  ('gurpreet@redappledistro.com'),
  ('kabir@redappledistro.com'),
  ('lisa@redappledistro.com'),
  ('sapnameena@redappledistro.com')
on conflict (email) do nothing;

-- Link each admin email to its confirmed account (only confirmed accounts).
update public.admin_emails a
   set user_id = u.id
  from auth.users u
 where lower(u.email) = a.email
   and u.email_confirmed_at is not null;

-- Check: every signed-up agent should show a user_id.
select email, user_id is not null as linked from public.admin_emails order by email;
