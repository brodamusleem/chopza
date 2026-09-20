-- =========================================================
-- 0005_add_platform_settings.sql
-- A single-row table holding platform-wide configuration that
-- admins can edit from the Settings page (delivery fee, service
-- fee percentage, minimum order amount). Enforced as single-row
-- via a check constraint on a fixed id.
-- =========================================================

create table platform_settings (
  id integer primary key default 1 check (id = 1),
  base_delivery_fee numeric(10, 2) not null default 500.00,
  service_fee_percentage numeric(5, 2) not null default 5.00 check (service_fee_percentage >= 0 and service_fee_percentage <= 100),
  min_order_amount numeric(10, 2) not null default 1000.00,
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles(id)
);

-- Seed the single row so the app can always assume it exists.
insert into platform_settings (id) values (1)
  on conflict (id) do nothing;

alter table platform_settings enable row level security;

create policy "Anyone authenticated can read platform settings"
  on platform_settings for select
  using (auth.role() = 'authenticated');

create policy "Only admins can update platform settings"
  on platform_settings for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
