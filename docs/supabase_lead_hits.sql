-- Rate-limit log for the send-lead function. Only the function (service role) can touch it.
create table if not exists public.lead_hits (
  id bigint generated always as identity primary key,
  ip text not null,
  at timestamptz not null default now()
);
alter table public.lead_hits enable row level security;
revoke all on public.lead_hits from anon, authenticated;
create index if not exists lead_hits_ip_at on public.lead_hits (ip, at);
create index if not exists lead_hits_at on public.lead_hits (at);
