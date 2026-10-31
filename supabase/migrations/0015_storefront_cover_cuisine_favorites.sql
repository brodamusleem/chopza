-- =========================================================
-- 0015_storefront_cover_cuisine_favorites.sql
-- Data needed for the customer storefront design:
--   * vendors.cover_url   - big photo on restaurant cards / vendor page banner
--   * vendors.cuisine     - drives the category tab row
--   * favorites           - the heart button + favourites page
-- Safe to run more than once.
-- =========================================================

alter table vendors
  add column if not exists cover_url text,
  add column if not exists cuisine text;

create index if not exists idx_vendors_cuisine on vendors(cuisine) where status = 'approved';
create index if not exists idx_vendors_service_area on vendors(service_area_id) where status = 'approved';

-- ---------- Favourites ----------
create table if not exists favorites (
  customer_id uuid not null references profiles(id) on delete cascade,
  vendor_id uuid not null references vendors(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (customer_id, vendor_id)
);

alter table favorites enable row level security;

drop policy if exists "Customers can view their own favorites" on favorites;
create policy "Customers can view their own favorites"
  on favorites for select
  using (auth.uid() = customer_id);

drop policy if exists "Customers can add their own favorites" on favorites;
create policy "Customers can add their own favorites"
  on favorites for insert
  with check (auth.uid() = customer_id);

drop policy if exists "Customers can remove their own favorites" on favorites;
create policy "Customers can remove their own favorites"
  on favorites for delete
  using (auth.uid() = customer_id);

-- =========================================================
-- NOTES
-- * Cover images reuse the existing 'vendor-logos' bucket, uploaded to
--   "<user id>/cover-<timestamp>.<ext>" (the bucket policy from migration 0007
--   already allows a user to write inside their own folder).
-- * vendors.cuisine is a free-text value chosen from a fixed list in the app.
-- =========================================================
