-- Bank SMS -> app. A phone automation posts each bank SMS to the sms-ingest edge
-- function with a per-user secret token; the function parses it and stores the
-- result here. The app imports the 'new' rows into the user's expenses/incomes.

-- Per-user webhook secret. Only the SHA-256 hash is stored. The client can't read
-- or write this table; it goes through create_sms_token() below.
create table if not exists public.masroofati_sms_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now()
);
alter table public.masroofati_sms_tokens enable row level security;

create table if not exists public.masroofati_inbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('expense', 'income', 'unparsed')),
  status text not null default 'new' check (status in ('new', 'imported', 'ignored')),
  amount integer,
  balance integer,
  merchant text not null default '',
  pay text not null default 'other',
  cat text not null default 'other',
  src text not null default 'other',
  occurred_on date not null,
  raw text not null,
  msg_hash text not null,
  created_at timestamptz not null default now(),
  unique (user_id, msg_hash)
);
create index if not exists masroofati_inbox_user_status_idx on public.masroofati_inbox (user_id, status);
alter table public.masroofati_inbox enable row level security;

-- Users can read, mark and delete their own rows. Rows are only ever inserted by the
-- edge function (service role), so there is deliberately no insert policy.
drop policy if exists "inbox_select_own" on public.masroofati_inbox;
drop policy if exists "inbox_update_own" on public.masroofati_inbox;
drop policy if exists "inbox_delete_own" on public.masroofati_inbox;

create policy "inbox_select_own" on public.masroofati_inbox
  for select to authenticated using (user_id = (select auth.uid()));
create policy "inbox_update_own" on public.masroofati_inbox
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "inbox_delete_own" on public.masroofati_inbox
  for delete to authenticated using (user_id = (select auth.uid()));

-- Creates (or replaces) the caller's token and returns it once, in plain text.
create or replace function public.create_sms_token()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  t text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  t := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  insert into public.masroofati_sms_tokens (user_id, token_hash)
  values (auth.uid(), encode(sha256(convert_to(t, 'utf8')), 'hex'))
  on conflict (user_id) do update set token_hash = excluded.token_hash, created_at = now();
  return t;
end;
$$;
revoke all on function public.create_sms_token() from public, anon;
grant execute on function public.create_sms_token() to authenticated;
