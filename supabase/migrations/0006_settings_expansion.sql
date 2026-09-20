-- =========================================================
-- 0006_settings_expansion.sql
-- Adds: platform branding + maintenance mode fields,
-- service_areas table, per-admin notification preferences,
-- and a safe (non-recursive) way for admins to manage
-- other admins' profiles.
-- =========================================================

-- ---------- 1. Branding + Maintenance Mode on platform_settings ----------
alter table platform_settings
  add column if not exists app_name text not null default 'Chopza',
  add column if not exists logo_url text,
  add column if not exists maintenance_mode boolean not null default false,
  add column if not exists maintenance_message text not null default
    'We are currently performing maintenance. Please check back soon.';

-- ---------- 2. Service Areas (Kano LGAs/zones the platform covers) ----------
create table service_areas (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table service_areas enable row level security;

create policy "Anyone authenticated can view service areas"
  on service_areas for select
  using (auth.role() = 'authenticated');

-- (Admin write policies added below, after is_admin() is defined.)

-- ---------- 3. Per-admin notification preferences ----------
alter table profiles
  add column if not exists notification_preferences jsonb not null default
    '{"new_vendor_application": true, "unassigned_order_alert": true}'::jsonb;

-- ---------- 4. Safe admin-role-check helper (avoids RLS recursion) ----------
-- IMPORTANT: a policy on `profiles` that queries `profiles` directly inside
-- itself can cause "infinite recursion detected in policy" errors, because
-- evaluating the subquery re-triggers RLS on profiles again. The fix is a
-- SECURITY DEFINER helper function, which Postgres evaluates without
-- re-applying the calling policy.
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable set search_path = public;

-- Now safe to add admin-wide write policies using is_admin():
create policy "Admins can update any profile"
  on profiles for update
  using (is_admin());

create policy "Admins can manage service areas"
  on service_areas for all
  using (is_admin());

-- Replace the earlier vendor/order admin policies with the helper too,
-- for consistency and to avoid the same recursion risk on those tables:
drop policy if exists "Admins can view all vendors" on vendors;
create policy "Admins can view all vendors"
  on vendors for select
  using (is_admin());

drop policy if exists "Admins can update any vendor (e.g. approve/suspend)" on vendors;
create policy "Admins can update any vendor (e.g. approve/suspend)"
  on vendors for update
  using (is_admin());

drop policy if exists "Admins can view all orders" on orders;
create policy "Admins can view all orders"
  on orders for select
  using (is_admin());

drop policy if exists "Admins can update any order" on orders;
create policy "Admins can update any order"
  on orders for update
  using (is_admin());
