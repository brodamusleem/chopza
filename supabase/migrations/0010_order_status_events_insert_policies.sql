-- =========================================================
-- 0010_order_status_events_insert_policies.sql
-- 1. Adds 'ready_for_pickup' between 'preparing' and 'rider_assigned'.
-- 2. Adds the missing INSERT policies on order_status_events —
--    without these, nobody (vendor, rider, or admin) could actually
--    record a status change, since only a SELECT policy existed.
--
-- Run the enum addition (step 1) as its own query first, then the
-- rest, since new enum values must be committed before use.
-- =========================================================

-- Step 1 — run this alone first:
alter type order_status add value if not exists 'ready_for_pickup' after 'preparing';

-- Step 2 — run this after step 1 has succeeded:
create policy "Vendor owners can add status events for their own orders"
  on order_status_events for insert
  with check (
    exists (
      select 1 from orders o
      join vendors v on v.id = o.vendor_id
      where o.id = order_id and v.owner_id = auth.uid()
    )
  );

create policy "Assigned riders can add status events for their orders"
  on order_status_events for insert
  with check (
    exists (select 1 from orders o where o.id = order_id and o.rider_id = auth.uid())
  );

create policy "Admins can add any status event"
  on order_status_events for insert
  with check (is_admin());

-- =========================================================
-- IMPORTANT PATTERN NOTE for the agent implementing order actions:
-- To change an order's status, INSERT a row into order_status_events
-- (order_id, status, note) — do NOT call .update() directly on
-- orders.status. The existing trigger (handle_new_order_status_event,
-- from migration 0001) automatically syncs orders.status and
-- broadcasts the change over Realtime when a new event is inserted.
-- Bypassing this by updating orders.status directly would skip the
-- audit trail and the live broadcast that the tracking map depends on.
-- =========================================================
