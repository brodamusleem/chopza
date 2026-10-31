-- Public storefront needs the active service-area labels and customer-facing
-- delivery/branding settings before a customer signs in. These rows contain
-- display configuration only; writes remain admin-only.
drop policy if exists "Anyone authenticated can view service areas" on public.service_areas;
create policy "Public can view active service areas"
  on public.service_areas for select
  using (is_active);

drop policy if exists "Anyone authenticated can read platform settings" on public.platform_settings;
create policy "Public can read storefront settings"
  on public.platform_settings for select
  using (true);
