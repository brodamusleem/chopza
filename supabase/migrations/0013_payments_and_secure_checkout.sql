-- =========================================================
-- 0013_payments_and_secure_checkout.sql
-- Adds payments, makes order creation server-priced and secure,
-- and protects financial fields from client tampering.
--
-- Apply this migration in order with the rest of supabase/migrations.
-- =========================================================

-- ---------------------------------------------------------
-- Payment enum types
-- ---------------------------------------------------------
create type payment_method as enum ('online', 'cash_on_delivery');
create type payment_status as enum ('unpaid', 'paid', 'failed', 'refund_pending', 'refunded');

-- ---------------------------------------------------------
-- Payment schema, checkout RPC, and triggers
-- ---------------------------------------------------------

-- 1. Financial columns on orders
alter table orders
  add column if not exists payment_method payment_method not null default 'cash_on_delivery',
  add column if not exists payment_status payment_status not null default 'unpaid',
  add column if not exists subtotal numeric(10, 2) not null default 0 check (subtotal >= 0),
  add column if not exists delivery_fee numeric(10, 2) not null default 0 check (delivery_fee >= 0),
  add column if not exists service_fee numeric(10, 2) not null default 0 check (service_fee >= 0);

-- 2. Payments table (one row per payment ATTEMPT for a cart group).
--    Written only by Edge Functions using the service role, never by the browser.
create table payments (
  id uuid primary key default gen_random_uuid(),
  cart_group_id uuid not null,
  customer_id uuid not null references profiles(id),
  provider text not null default 'paystack',
  reference text not null unique,
  amount numeric(10, 2) not null check (amount > 0),
  currency text not null default 'NGN',
  status payment_status not null default 'unpaid',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_payments_cart_group on payments(cart_group_id);
-- A cart group can only ever have ONE successful payment:
create unique index uniq_payments_one_paid_per_group on payments(cart_group_id) where status = 'paid';

alter table payments enable row level security;

create policy "Customers can view their own payments"
  on payments for select
  using (auth.uid() = customer_id);

create policy "Admins can view all payments"
  on payments for select
  using (is_admin());
-- No insert/update/delete policies on purpose: only the service role may write.

-- 3. Remove the ability for clients to insert orders/items directly
drop policy if exists "Customers can create their own orders" on orders;
drop policy if exists "Customers can insert items for their own new order" on order_items;

-- 4. Vendors only see online orders AFTER they are paid (COD orders are visible immediately)
drop policy if exists "Vendor owners can view orders placed on their vendor" on orders;
create policy "Vendor owners can view payable orders for their vendor"
  on orders for select
  using (
    (payment_method = 'cash_on_delivery' or payment_status in ('paid', 'refund_pending', 'refunded'))
    and exists (select 1 from vendors v where v.id = vendor_id and v.owner_id = auth.uid())
  );

-- 5. Secure, server-priced checkout. The client sends ONLY item ids + quantities.
create or replace function create_checkout(
  p_items jsonb,
  p_delivery_address text,
  p_delivery_lat double precision,
  p_delivery_lng double precision,
  p_payment_method payment_method
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

  -- Every item must exist, be available, and belong to an approved, open vendor.
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

  -- One order per vendor, all tied together by cart_group_id.
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
      subtotal, delivery_fee, service_fee, total_amount, payment_method
    ) values (
      v_group, v_customer, v_vendor.vendor_id,
      p_delivery_address, p_delivery_lat, p_delivery_lng,
      v_vendor.subtotal, v_settings.base_delivery_fee, v_service, v_order_total, p_payment_method
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

revoke execute on function create_checkout(jsonb, text, double precision, double precision, payment_method) from public;
grant execute on function create_checkout(jsonb, text, double precision, double precision, payment_method) to authenticated;

-- 6. Stop vendors/riders/customers from tampering with money fields via the
--    existing "update their own orders" policies. Allowed only for admins,
--    the service role (auth.uid() is null), or updates fired by other triggers
--    (pg_trigger_depth() > 1), e.g. the status-event trigger.
create or replace function protect_order_financial_fields()
returns trigger as $$
begin
  if pg_trigger_depth() = 1 and auth.uid() is not null and not is_admin() then
    new.payment_method := old.payment_method;
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

drop trigger if exists protect_order_financial_fields_trg on orders;
create trigger protect_order_financial_fields_trg
  before update on orders
  for each row execute function protect_order_financial_fields();

-- 7. Payment state transitions driven by order status:
--    - cash on delivery becomes 'paid' when the order is delivered (cash collected)
--    - a cancelled, already-paid online order is flagged 'refund_pending'
create or replace function handle_order_payment_transitions()
returns trigger as $$
begin
  if new.status = 'delivered' and old.status is distinct from 'delivered'
     and new.payment_method = 'cash_on_delivery' and new.payment_status = 'unpaid' then
    update orders set payment_status = 'paid' where id = new.id;
  end if;

  if new.status = 'cancelled' and old.status is distinct from 'cancelled'
     and new.payment_method = 'online' and new.payment_status = 'paid' then
    update orders set payment_status = 'refund_pending' where id = new.id;
  end if;

  return null;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_order_status_payment_transitions on orders;
create trigger on_order_status_payment_transitions
  after update of status on orders
  for each row execute function handle_order_payment_transitions();

-- =========================================================
-- VERIFY AFTER RUNNING (paste each into the SQL editor):
--
-- 1) The old permissive policies must be gone:
--    select policyname, cmd from pg_policies where tablename = 'orders' order by cmd;
--    -> there must be NO INSERT policy on orders, and the only vendor SELECT
--       policy must be "Vendor owners can view payable orders for their vendor".
--
-- 2) The new objects exist:
--    select proname from pg_proc where proname in
--      ('create_checkout','protect_order_financial_fields','handle_order_payment_transitions');
-- =========================================================
