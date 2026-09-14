-- =========================================================
-- 0001_init.sql
-- Multi-Vendor Food Ordering & Live Dispatch Platform (Kano)
-- Initial schema + Row Level Security policies
-- =========================================================

-- ---------- 1. ROLES & PROFILES ----------
-- One profile per auth.users row. Role drives what a user can see/do.
create type user_role as enum ('customer', 'vendor', 'rider', 'admin');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'customer',
  full_name text not null,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on profiles for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- ---------- 2. VENDORS ----------
create type vendor_status as enum ('pending', 'approved', 'suspended');

create table vendors (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  description text,
  logo_url text,
  address text not null,
  latitude double precision,
  longitude double precision,
  status vendor_status not null default 'pending',
  created_at timestamptz not null default now()
);

alter table vendors enable row level security;

create policy "Anyone can view approved vendors"
  on vendors for select
  using (status = 'approved');

create policy "Vendor owners can view their own vendor regardless of status"
  on vendors for select
  using (auth.uid() = owner_id);

create policy "Admins can view all vendors"
  on vendors for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "Vendor owners can update their own vendor"
  on vendors for update
  using (auth.uid() = owner_id);

create policy "Admins can update any vendor (e.g. approve/suspend)"
  on vendors for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "Authenticated vendor-role users can create a vendor profile"
  on vendors for insert
  with check (
    auth.uid() = owner_id
    and exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'vendor')
  );

-- ---------- 3. MENU ITEMS ----------
create table menu_items (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  image_url text,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

alter table menu_items enable row level security;

create policy "Anyone can view menu items of approved vendors"
  on menu_items for select
  using (exists (select 1 from vendors v where v.id = vendor_id and v.status = 'approved'));

create policy "Vendor owners can manage their own menu items"
  on menu_items for all
  using (exists (select 1 from vendors v where v.id = vendor_id and v.owner_id = auth.uid()));

-- ---------- 4. ORDERS (multi-vendor cart -> one order per vendor) ----------
create type order_status as enum (
  'pending', 'accepted', 'preparing', 'rider_assigned',
  'picked_up', 'in_transit', 'delivered', 'cancelled'
);

-- A "cart_group_id" ties multiple per-vendor orders from the same checkout together,
-- since one customer checkout can span several vendors.
create table orders (
  id uuid primary key default gen_random_uuid(),
  cart_group_id uuid not null default gen_random_uuid(),
  customer_id uuid not null references profiles(id),
  vendor_id uuid not null references vendors(id),
  rider_id uuid references profiles(id),
  status order_status not null default 'pending',
  delivery_address text not null,
  delivery_latitude double precision,
  delivery_longitude double precision,
  total_amount numeric(10, 2) not null check (total_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table orders enable row level security;

create policy "Customers can view their own orders"
  on orders for select
  using (auth.uid() = customer_id);

create policy "Vendor owners can view orders placed on their vendor"
  on orders for select
  using (exists (select 1 from vendors v where v.id = vendor_id and v.owner_id = auth.uid()));

create policy "Assigned riders can view their assigned orders"
  on orders for select
  using (auth.uid() = rider_id);

create policy "Admins can view all orders"
  on orders for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "Customers can create their own orders"
  on orders for insert
  with check (auth.uid() = customer_id);

create policy "Vendor owners can update status of their own orders"
  on orders for update
  using (exists (select 1 from vendors v where v.id = vendor_id and v.owner_id = auth.uid()));

create policy "Assigned riders can update status of their assigned orders"
  on orders for update
  using (auth.uid() = rider_id);

create policy "Admins can update any order"
  on orders for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ---------- 5. ORDER ITEMS ----------
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id uuid not null references menu_items(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0)
);

alter table order_items enable row level security;

create policy "Order items visible to anyone who can view the parent order"
  on order_items for select
  using (
    exists (
      select 1 from orders o
      where o.id = order_id
        and (
          o.customer_id = auth.uid()
          or o.rider_id = auth.uid()
          or exists (select 1 from vendors v where v.id = o.vendor_id and v.owner_id = auth.uid())
          or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
        )
    )
  );

create policy "Customers can insert items for their own new order"
  on order_items for insert
  with check (
    exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid())
  );

-- ---------- 6. ORDER STATUS EVENTS (audit trail + drives the live status timeline) ----------
create table order_status_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  status order_status not null,
  note text,
  created_at timestamptz not null default now()
);

alter table order_status_events enable row level security;

create policy "Status events visible to anyone who can view the parent order"
  on order_status_events for select
  using (
    exists (
      select 1 from orders o
      where o.id = order_id
        and (
          o.customer_id = auth.uid()
          or o.rider_id = auth.uid()
          or exists (select 1 from vendors v where v.id = o.vendor_id and v.owner_id = auth.uid())
          or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
        )
    )
  );

-- Automatically keep orders.status and orders.updated_at in sync whenever
-- a new status event is inserted, and broadcast the change over Realtime
-- so the customer's live tracking page updates instantly.
create or replace function handle_new_order_status_event()
returns trigger as $$
begin
  update orders
  set status = new.status, updated_at = now()
  where id = new.order_id;

  perform realtime.broadcast_changes(
    'order-status-' || new.order_id::text,  -- topic: one channel per order
    'status_update',                          -- event name
    'INSERT',
    'order_status_events',
    'public',
    new,
    null
  );

  return new;
end;
$$ language plpgsql security definer;

create trigger on_order_status_event_insert
  after insert on order_status_events
  for each row execute function handle_new_order_status_event();

-- ---------- 7. INDEXES (for the queries the app will run most) ----------
create index idx_orders_customer_id on orders(customer_id);
create index idx_orders_vendor_id on orders(vendor_id);
create index idx_orders_rider_id on orders(rider_id);
create index idx_menu_items_vendor_id on menu_items(vendor_id);
create index idx_order_items_order_id on order_items(order_id);
create index idx_order_status_events_order_id on order_status_events(order_id);

-- =========================================================
-- NOTE on rider GPS location:
-- Live rider lat/lng ticks are NOT stored in a table here.
-- They are sent via Supabase Realtime Broadcast on a
-- per-order channel (e.g. "rider-location-<order_id>"),
-- directly from the rider's device to subscribed clients,
-- since GPS pings are frequent/ephemeral and don't need
-- to be persisted row-by-row. If you later need a location
-- history for analytics, add a `rider_location_pings` table
-- and insert into it at a throttled interval (e.g. every 30s)
-- instead of on every GPS tick.
-- =========================================================