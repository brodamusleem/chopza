-- =========================================================
-- 0007_vendor_onboarding_and_status_lockdown.sql
-- 1. Prevents vendors from changing their own `status` column
--    directly (closes a privilege-escalation gap: previously a
--    vendor could self-approve by updating their own row).
-- 2. Adds a safe resubmission path for rejected vendors.
-- 3. Links vendors to a service_area for onboarding.
-- =========================================================

-- ---------- 1. Link vendors to a service area ----------
alter type vendor_status add value if not exists 'rejected';

alter table vendors
  add column if not exists service_area_id uuid references service_areas(id);

drop policy if exists "Authenticated vendor-role users can create a vendor profile" on vendors;
create policy "Authenticated vendor-role users can create a vendor profile"
  on vendors for insert
  with check (
    auth.uid() = owner_id
    and status = 'pending'
    and exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'vendor')
  );

-- ---------- 2. Lock down status changes to admins only ----------
create or replace function prevent_non_admin_status_change()
returns trigger as $$
begin
  if coalesce(current_setting('app.resubmitting_vendor', true), '') <> 'true'
    and not is_admin()
    and new.status is distinct from old.status then
    new.status := old.status; -- silently ignore any status change attempt by a non-admin
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists enforce_vendor_status_change on vendors;
create trigger enforce_vendor_status_change
  before update on vendors
  for each row execute function prevent_non_admin_status_change();

-- ---------- 3. Safe resubmission path for rejected vendors ----------
-- A rejected vendor can call this (via RPC) to move themselves back
-- to 'pending' for re-review — the ONLY status change a non-admin
-- is ever allowed to trigger, and only from 'rejected'.
create or replace function resubmit_vendor_application(target_vendor_id uuid)
returns void as $$
begin
  perform set_config('app.resubmitting_vendor', 'true', true);
  update vendors
  set status = 'pending'
  where id = target_vendor_id
    and owner_id = auth.uid()
    and status = 'rejected';
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function resubmit_vendor_application(uuid) to authenticated;

insert into storage.buckets (id, name, public)
values ('vendor-logos', 'vendor-logos', true)
on conflict (id) do nothing;

create policy "Anyone can view vendor logos"
  on storage.objects for select
  using (bucket_id = 'vendor-logos');

create policy "Authenticated users can upload vendor logos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'vendor-logos' and (storage.foldername(name))[1] = auth.uid()::text);
