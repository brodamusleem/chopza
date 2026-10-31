-- Keep live GPS broadcasts private and scoped to the order being delivered.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'orders'
    ) then
    execute 'alter publication supabase_realtime add table public.orders';
  end if;
end;
$$;

drop policy if exists "Assigned riders can broadcast order locations" on realtime.messages;
create policy "Assigned riders can broadcast order locations"
  on realtime.messages for insert to authenticated
  with check (
    exists (
      select 1
      from public.orders o
      where realtime.topic() = 'order-tracking-' || o.id::text
        and o.rider_id = auth.uid()
        and o.status in ('rider_assigned', 'picked_up', 'in_transit')
    )
  );

drop policy if exists "Order participants can receive location broadcasts" on realtime.messages;
create policy "Order participants can receive location broadcasts"
  on realtime.messages for select to authenticated
  using (
    exists (
      select 1
      from public.orders o
      where realtime.topic() = 'order-tracking-' || o.id::text
        and (
          o.customer_id = auth.uid()
          or o.rider_id = auth.uid()
          or is_admin()
        )
        and o.status in ('rider_assigned', 'picked_up', 'in_transit')
    )
  );