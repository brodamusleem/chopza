-- =========================================================
-- 0004_add_order_location_tracking.sql
-- Adds a lightweight "last known rider position" to orders,
-- so the admin dispatch map (and the customer tracking page)
-- has something to show immediately on page load, before the
-- next live Realtime Broadcast tick arrives.
--
-- Pattern: the rider's device broadcasts lat/lng frequently
-- (e.g. every 3-5s) over Supabase Realtime Broadcast for smooth
-- live movement, AND periodically (e.g. every 15-20s) writes
-- to these columns so a fresh page load isn't blank while
-- waiting for the next broadcast tick.
-- =========================================================

alter table orders
  add column if not exists current_lat double precision,
  add column if not exists current_lng double precision,
  add column if not exists location_updated_at timestamptz;

-- No new RLS policy needed: the existing "Assigned riders can update
-- status of their assigned orders" policy already covers full-row
-- updates, which includes these new columns.

create index if not exists idx_orders_active_status on orders(status)
  where status in ('rider_assigned', 'picked_up', 'in_transit');










