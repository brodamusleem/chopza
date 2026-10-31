-- Private live rider location broadcasts, scoped to each active order.
-- The rider sender, customer tracker, and admin dispatch map use the
-- order-tracking-<orderId> topic and private channels. Clients must call
-- supabase.realtime.setAuth() before subscribing.

-- Postgres Changes (order status) needs the orders table in the realtime publication.
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

-- The assigned rider may publish; admins may publish for the dispatch simulator.
drop policy if exists "Assigned riders can broadcast order locations" on realtime.messages;
create policy "Assigned riders can broadcast order locations"
  on realtime.messages for insert to authenticated
  with check (
    exists (
      select 1
      from public.orders o
      where realtime.topic() = 'order-tracking-' || o.id::text
        and (o.rider_id = auth.uid() or public.is_admin())
        and o.status in ('rider_assigned', 'picked_up', 'in_transit')
    )
  );

-- The customer, assigned rider, and admins may receive locations during delivery.
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
          or public.is_admin()
        )
        and o.status in ('rider_assigned', 'picked_up', 'in_transit')
    )
  );

-- The admin map also listens for Postgres order changes on its private feed topic.
drop policy if exists "Admins can receive dispatch order changes" on realtime.messages;
create policy "Admins can receive dispatch order changes"
  on realtime.messages for select to authenticated
  using (realtime.topic() = 'admin:dispatch-orders' and public.is_admin());

-- Vendors are not authorized to receive live rider locations.
