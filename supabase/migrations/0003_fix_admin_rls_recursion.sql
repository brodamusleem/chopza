-- Avoid recursive profiles RLS checks when policies need to identify admins.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

drop policy if exists "Admins can view all vendors" on public.vendors;
create policy "Admins can view all vendors"
  on public.vendors for select
  using (public.is_admin());

drop policy if exists "Admins can update any vendor (e.g. approve/suspend)" on public.vendors;
create policy "Admins can update any vendor (e.g. approve/suspend)"
  on public.vendors for update
  using (public.is_admin());

drop policy if exists "Admins can view all orders" on public.orders;
create policy "Admins can view all orders"
  on public.orders for select
  using (public.is_admin());

drop policy if exists "Admins can update any order" on public.orders;
create policy "Admins can update any order"
  on public.orders for update
  using (public.is_admin());

drop policy if exists "Order items visible to anyone who can view the parent order" on public.order_items;
create policy "Order items visible to anyone who can view the parent order"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (
          o.customer_id = auth.uid()
          or o.rider_id = auth.uid()
          or exists (
            select 1 from public.vendors v
            where v.id = o.vendor_id and v.owner_id = auth.uid()
          )
          or public.is_admin()
        )
    )
  );

drop policy if exists "Status events visible to anyone who can view the parent order" on public.order_status_events;
create policy "Status events visible to anyone who can view the parent order"
  on public.order_status_events for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (
          o.customer_id = auth.uid()
          or o.rider_id = auth.uid()
          or exists (
            select 1 from public.vendors v
            where v.id = o.vendor_id and v.owner_id = auth.uid()
          )
          or public.is_admin()
        )
    )
  );
