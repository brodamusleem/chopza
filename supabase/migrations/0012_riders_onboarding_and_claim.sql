-- =========================================================
-- 0012_riders_onboarding_and_claim.sql
-- Adds: riders table (mirrors vendors: application + approval),
-- online/offline status, RLS so approved riders can see
-- unassigned ready-for-pickup orders, and an atomic
-- claim_delivery() function preventing two riders from
-- claiming the same order at once.
-- =========================================================

-- ---------- 1. Riders table ----------
create type rider_status as enum ('pending', 'approved', 'rejected', 'suspended');

create table riders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  vehicle_type text not null,
  plate_number text,
  status rider_status not null default 'pending',
  is_online boolean not null default false,
  created_at timestamptz not null default now()
);

alter table riders enable row level security;

create policy "Rider owners can view their own rider row"
  on riders for select
  using (auth.uid() = owner_id);

create policy "Admins can view all riders"
  on riders for select
  using (is_admin());

create policy "Authenticated rider-role users can create their own rider profile"
  on riders for insert
  with check (
    auth.uid() = owner_id
    and exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'rider')
  );

create policy "Rider owners can update their own rider row"
  on riders for update
  using (auth.uid() = owner_id);

create policy "Admins can update any rider"
  on riders for update
  using (is_admin());

-- Reuse the same status-change lockdown pattern used for vendors:
-- a rider cannot change their own application status directly.
create trigger enforce_rider_status_change
  before update on riders
  for each row execute function prevent_non_admin_status_change();

create or replace function resubmit_rider_application(target_rider_id uuid)
returns void as $$
begin
  update riders
  set status = 'pending'
  where id = target_rider_id
    and owner_id = auth.uid()
    and status = 'rejected';
end;
$$ language plpgsql security definer set search_path = public;

-- ---------- 2. Let approved riders see unassigned ready-for-pickup orders ----------
create policy "Approved riders can view unassigned ready-for-pickup orders"
  on orders for select
  using (
    status = 'ready_for_pickup'
    and rider_id is null
    and exists (select 1 from riders r where r.owner_id = auth.uid() and r.status = 'approved')
  );

-- ---------- 3. Atomic claim function (prevents two riders claiming the same order) ----------
create or replace function claim_delivery(target_order_id uuid)
returns void as $$
declare
  v_claimed_id uuid;
begin
  if not exists (
    select 1 from riders where owner_id = auth.uid() and status = 'approved'
  ) then
    raise exception 'Only approved riders can claim deliveries';
  end if;

  -- Atomic: the WHERE rider_id is null clause means only ONE concurrent
  -- transaction can successfully claim a given order — Postgres row
  -- locking on the UPDATE serializes concurrent attempts automatically.
  update orders
  set rider_id = auth.uid()
  where id = target_order_id
    and rider_id is null
    and status = 'ready_for_pickup'
  returning id into v_claimed_id;

  if v_claimed_id is null then
    raise exception 'This delivery has already been claimed by another rider';
  end if;

  insert into order_status_events (order_id, status)
  values (target_order_id, 'rider_assigned');
end;
$$ language plpgsql security definer set search_path = public;

create index if not exists idx_riders_owner_id on riders(owner_id);
create index if not exists idx_orders_unassigned_ready on orders(status, rider_id)
  where status = 'ready_for_pickup' and rider_id is null;
