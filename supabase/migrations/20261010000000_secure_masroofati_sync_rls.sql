-- Lock down masroofati_sync: each signed-in user can only access their own
-- row (id = auth user id). Admins (listed in masroofati_admins, which the
-- client cannot read or write) can read and delete every row.

create table if not exists public.masroofati_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);
alter table public.masroofati_admins enable row level security;

create or replace function public.is_masroofati_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.masroofati_admins a where a.user_id = auth.uid());
$$;
revoke all on function public.is_masroofati_admin() from public, anon;
grant execute on function public.is_masroofati_admin() to authenticated;

alter table public.masroofati_sync enable row level security;
drop policy if exists "Allow public access" on public.masroofati_sync;
drop policy if exists "own_or_admin_select" on public.masroofati_sync;
drop policy if exists "own_insert" on public.masroofati_sync;
drop policy if exists "own_update" on public.masroofati_sync;
drop policy if exists "own_or_admin_delete" on public.masroofati_sync;

create policy "own_or_admin_select" on public.masroofati_sync
  for select to authenticated
  using (id = (select auth.uid())::text or (select public.is_masroofati_admin()));

create policy "own_insert" on public.masroofati_sync
  for insert to authenticated
  with check (id = (select auth.uid())::text);

create policy "own_update" on public.masroofati_sync
  for update to authenticated
  using (id = (select auth.uid())::text)
  with check (id = (select auth.uid())::text);

create policy "own_or_admin_delete" on public.masroofati_sync
  for delete to authenticated
  using (id = (select auth.uid())::text or (select public.is_masroofati_admin()));
