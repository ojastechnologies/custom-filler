-- RLS hardening: service role bypasses RLS; admins defined by users.is_admin
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.users enable row level security;

do $$ declare r record;
begin
  for r in select schemaname, tablename from pg_tables where schemaname='public' and tablename in ('orders','order_items','users')
  loop
    execute format('drop policy if exists %I on %I.%I', 'permissive_all', r.schemaname, r.tablename);
  end loop;
end $$;

-- wipe any existing policies on the three tables (fresh start)
do $$ declare r record;
begin
  for r in select policyname, tablename from pg_policies where schemaname='public' and tablename in ('orders','order_items','users')
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, 'public', r.tablename);
  end loop;
end $$;

create policy admin_read_orders on public.orders for select
  to authenticated using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));
create policy anon_create_pending_orders on public.orders for insert
  to anon with check (status = 'pending');
create policy admin_write_orders on public.orders for update
  to authenticated using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));
create policy admin_delete_orders on public.orders for delete
  to authenticated using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

create policy admin_all_order_items on public.order_items for all
  to authenticated using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

create policy admin_read_users on public.users for select
  to authenticated using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));
create policy admin_update_users on public.users for update
  to authenticated using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

-- self-read so a user can resolve their own role at login
create policy users_read_own on public.users for select
  to authenticated using (auth.uid() = id);
