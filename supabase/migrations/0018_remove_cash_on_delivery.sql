-- =========================================================
-- 0018_remove_cash_on_delivery.sql
-- This migration follows 0013 in the normal ordered migration sequence.
-- Apply it after 0013 whether setting up a fresh database or upgrading one.
--
-- Result: online payment only. Vendors see an order only once it is paid.
-- =========================================================

-- 1. Vendors see only paid orders (and refund history)
drop policy if exists "Vendor owners can view payable orders for their vendor" on orders;
drop policy if exists "Vendor owners can view paid orders for their vendor" on orders;
create policy "Vendor owners can view paid orders for their vendor"
  on orders for select
  using (
    payment_status in ('paid', 'refund_pending', 'refunded')
    and exists (select 1 from vendors v where v.id = vendor_id and v.owner_id = auth.uid())
  );

-- 2. Replace the checkout function: it no longer takes a payment method
drop function if exists create_checkout(jsonb, text, double precision, double precision, payment_method);

create or replace function create_checkout(
  p_items jsonb,
  p_delivery_address text,
  p_delivery_lat double precision,
  p_delivery_lng double precision
)
returns table (out_cart_group_id uuid, out_total numeric) as $$
declare
  v_customer uuid := auth.uid();
  v_group uuid := gen_random_uuid();
  v_settings platform_settings%rowtype;
  v_vendor record;
  v_order_id uuid;
  v_service numeric;
  v_order_total numeric;
  v_grand numeric := 0;
begin
  if v_customer is null then
    raise exception 'Not authenticated';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty';
  end if;
  if p_delivery_address is null or length(trim(p_delivery_address)) < 5 then
    raise exception 'A delivery address is required';
  end if;

  select * into v_settings from platform_settings where id = 1;
  if not found then
    raise exception 'Platform settings are missing';
  end if;
  if v_settings.maintenance_mode then
    raise exception '%', v_settings.maintenance_message;
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_items) as i(menu_item_id uuid, quantity int)
    left join menu_items m on m.id = i.menu_item_id
    left join vendors v on v.id = m.vendor_id
    where m.id is null
       or i.quantity is null or i.quantity < 1 or i.quantity > 50
       or not m.is_available
       or v.status <> 'approved'
       or not v.is_open
  ) then
    raise exception 'One or more items are no longer available';
  end if;

  for v_vendor in
    select m.vendor_id, sum(m.price * i.quantity) as subtotal
    from jsonb_to_recordset(p_items) as i(menu_item_id uuid, quantity int)
    join menu_items m on m.id = i.menu_item_id
    group by m.vendor_id
  loop
    if v_vendor.subtotal < v_settings.min_order_amount then
      raise exception 'The minimum order per restaurant is %', v_settings.min_order_amount;
    end if;

    v_service := round(v_vendor.subtotal * v_settings.service_fee_percentage / 100, 2);
    v_order_total := v_vendor.subtotal + v_service + v_settings.base_delivery_fee;

    insert into orders (
      cart_group_id, customer_id, vendor_id,
      delivery_address, delivery_latitude, delivery_longitude,
      subtotal, delivery_fee, service_fee, total_amount
    ) values (
      v_group, v_customer, v_vendor.vendor_id,
      p_delivery_address, p_delivery_lat, p_delivery_lng,
      v_vendor.subtotal, v_settings.base_delivery_fee, v_service, v_order_total
    )
    returning id into v_order_id;

    insert into order_items (order_id, menu_item_id, quantity, unit_price)
    select v_order_id, m.id, i.quantity, m.price
    from jsonb_to_recordset(p_items) as i(menu_item_id uuid, quantity int)
    join menu_items m on m.id = i.menu_item_id
    where m.vendor_id = v_vendor.vendor_id;

    v_grand := v_grand + v_order_total;
  end loop;

  return query select v_group, v_grand;
end;
$$ language plpgsql security definer set search_path = public;

revoke execute on function create_checkout(jsonb, text, double precision, double precision) from public;
grant execute on function create_checkout(jsonb, text, double precision, double precision) to authenticated;

-- 3. Trigger functions no longer mention payment_method
create or replace function protect_order_financial_fields()
returns trigger as $$
begin
  if pg_trigger_depth() = 1 and auth.uid() is not null and not is_admin() then
    new.payment_status := old.payment_status;
    new.subtotal := old.subtotal;
    new.delivery_fee := old.delivery_fee;
    new.service_fee := old.service_fee;
    new.total_amount := old.total_amount;
    new.customer_id := old.customer_id;
    new.vendor_id := old.vendor_id;
    new.cart_group_id := old.cart_group_id;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function handle_order_payment_transitions()
returns trigger as $$
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled'
     and new.payment_status = 'paid' then
    update orders set payment_status = 'refund_pending' where id = new.id;
  end if;
  return null;
end;
$$ language plpgsql security definer set search_path = public;

-- Existing orders remain unpaid. Reconcile any historical orders explicitly
-- after reviewing them; do not infer payment from the absence of a payment row.

-- 5. Remove the payment method column and type
alter table orders drop column if exists payment_method;
drop type if exists payment_method;

-- =========================================================
-- VERIFY AFTER RUNNING:
--   select column_name from information_schema.columns
--     where table_name = 'orders' and column_name = 'payment_method';   -- must return 0 rows
--   select proname, pronargs from pg_proc where proname = 'create_checkout';  -- pronargs must be 4
-- =========================================================
