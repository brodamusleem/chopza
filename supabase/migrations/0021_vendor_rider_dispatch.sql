-- Vendor-preferred rider dispatch with a shared-pool fallback and five-minute offers.
alter table public.orders
  add column if not exists rider_assigned_at timestamptz,
  add column if not exists rider_accepted_at timestamptz,
  add column if not exists rider_search_alerted_at timestamptz;

create table public.vendor_riders (
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  rider_id uuid not null references public.riders(id) on delete cascade,
  priority integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (vendor_id, rider_id)
);
alter table public.vendor_riders enable row level security;
create policy "Vendor owners manage their rider pool" on public.vendor_riders
  for all to authenticated
  using (exists (select 1 from public.vendors v where v.id = vendor_id and v.owner_id = auth.uid()))
  with check (exists (select 1 from public.vendors v where v.id = vendor_id and v.owner_id = auth.uid()));
create policy "Riders view their vendor links" on public.vendor_riders
  for select to authenticated
  using (exists (select 1 from public.riders r where r.id = rider_id and r.owner_id = auth.uid()));
create policy "Admins manage vendor rider links" on public.vendor_riders
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.rider_assignment_attempts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  rider_id uuid not null references public.profiles(id) on delete cascade,
  attempt_number integer not null,
  status text not null default 'offered'
    check (status in ('offered', 'accepted', 'declined', 'expired', 'claimed')),
  assigned_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (order_id, attempt_number)
);
create index idx_rider_assignment_attempts_order
  on public.rider_assignment_attempts(order_id, assigned_at desc);
alter table public.rider_assignment_attempts enable row level security;
create policy "Participants view rider assignment attempts"
  on public.rider_assignment_attempts for select to authenticated
  using (
    rider_id = auth.uid() or public.is_admin() or exists (
      select 1 from public.orders o join public.vendors v on v.id = o.vendor_id
      where o.id = order_id and v.owner_id = auth.uid()
    )
  );

create table public.delivery_notification_outbox (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references public.profiles(id) on delete set null,
  recipient_email text not null,
  notification_type text not null check (notification_type in ('vendor_new_paid_order', 'rider_delivery_offer', 'vendor_no_rider_available')),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed')),
  attempts integer not null default 0,
  locked_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index idx_delivery_notification_outbox_pending
  on public.delivery_notification_outbox(created_at) where status = 'pending';
alter table public.delivery_notification_outbox enable row level security;

create or replace function public.get_vendor_rider_options(target_vendor_id uuid)
returns table (rider_id uuid, rider_owner_id uuid, full_name text, is_online boolean, assigned_to_vendor boolean)
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from vendors v where v.id = target_vendor_id and v.owner_id = auth.uid())
    and not public.is_admin() then raise exception 'You cannot manage this vendor rider pool'; end if;
  return query
    select r.id, r.owner_id, p.full_name, r.is_online,
      exists (select 1 from vendor_riders vr where vr.vendor_id = target_vendor_id and vr.rider_id = r.id)
    from riders r join profiles p on p.id = r.owner_id
    where r.status = 'approved'
    order by 5 desc, r.is_online desc, p.full_name;
end;
$$;

create or replace function public.set_vendor_riders(target_vendor_id uuid, target_rider_ids uuid[])
returns void language plpgsql security definer set search_path = public as $$
declare requested_count integer; approved_count integer;
begin
  if not exists (select 1 from vendors v where v.id = target_vendor_id and v.owner_id = auth.uid())
    then raise exception 'You cannot manage this vendor rider pool'; end if;
  requested_count := coalesce(cardinality(target_rider_ids), 0);
  select count(*) into approved_count from riders r
    where r.id = any(coalesce(target_rider_ids, '{}'::uuid[])) and r.status = 'approved';
  if requested_count <> approved_count then raise exception 'Choose only approved riders'; end if;
  delete from vendor_riders where vendor_id = target_vendor_id;
  insert into vendor_riders(vendor_id, rider_id, priority)
    select target_vendor_id, picked.id, picked.ordinality::integer
    from unnest(coalesce(target_rider_ids, '{}'::uuid[])) with ordinality as picked(id, ordinality);
end;
$$;

create or replace function public.assign_next_rider(target_order_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  target_order orders%rowtype;
  selected_owner_id uuid;
  selected_email text;
  selected_name text;
  vendor_name text;
  next_attempt integer;
begin
  select * into target_order from orders where id = target_order_id for update;
  if not found or target_order.status <> 'ready_for_pickup' or target_order.rider_id is not null
    or target_order.payment_status <> 'paid' then return null; end if;
  select r.owner_id, p.email, p.full_name into selected_owner_id, selected_email, selected_name
    from riders r join profiles p on p.id = r.owner_id
    left join vendor_riders vr on vr.vendor_id = target_order.vendor_id and vr.rider_id = r.id
    where r.status = 'approved' and r.is_online
      and not exists (select 1 from orders active where active.rider_id = r.owner_id
        and active.id <> target_order.id and active.status in ('rider_assigned', 'picked_up', 'in_transit'))
      and not exists (select 1 from rider_assignment_attempts tried
        where tried.order_id = target_order.id and tried.rider_id = r.owner_id)
    order by case when vr.rider_id is null then 1 else 0 end, vr.priority nulls last, r.created_at, r.id
    limit 1 for update of r skip locked;
  if selected_owner_id is null then
    if target_order.rider_search_alerted_at is null then
      select v.owner_id, v.name, p.email into selected_owner_id, vendor_name, selected_email
        from vendors v join profiles p on p.id = v.owner_id where v.id = target_order.vendor_id;
      if selected_email is not null then
        insert into delivery_notification_outbox(recipient_id, recipient_email, notification_type, payload)
          values (selected_owner_id, selected_email, 'vendor_no_rider_available', jsonb_build_object(
            'order_id', target_order.id, 'vendor_name', vendor_name,
            'delivery_address', target_order.delivery_address));
      end if;
      update orders set rider_search_alerted_at = now() where id = target_order.id;
    end if;
    return null;
  end if;
  select coalesce(max(attempt_number), 0) + 1 into next_attempt
    from rider_assignment_attempts where order_id = target_order.id;
  update orders set rider_id = selected_owner_id, rider_assigned_at = now(),
    rider_accepted_at = null, rider_search_alerted_at = null,
    status = 'rider_assigned', updated_at = now() where id = target_order.id;
  insert into rider_assignment_attempts(order_id, rider_id, attempt_number)
    values (target_order.id, selected_owner_id, next_attempt);
  insert into order_status_events(order_id, status, note)
    values (target_order.id, 'rider_assigned', 'Delivery offer sent to rider');
  select name into vendor_name from vendors where id = target_order.vendor_id;
  if selected_email is not null then
    insert into delivery_notification_outbox(recipient_id, recipient_email, notification_type, payload)
    values (selected_owner_id, selected_email, 'rider_delivery_offer', jsonb_build_object(
      'rider_name', selected_name, 'order_id', target_order.id, 'vendor_name', vendor_name,
      'delivery_address', target_order.delivery_address,
      'respond_by', now() + interval '5 minutes'));
  end if;
  return selected_owner_id;
end;
$$;

create or replace function public.accept_delivery(target_order_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare current_order orders%rowtype;
begin
  select * into current_order from orders where id = target_order_id for update;
  if not found or current_order.rider_id <> auth.uid() or current_order.status <> 'rider_assigned'
    or current_order.rider_accepted_at is not null
    or current_order.rider_assigned_at < now() - interval '5 minutes' then
    raise exception 'This delivery offer expired or is no longer assigned to you'; end if;
  update orders set rider_accepted_at = now(), updated_at = now() where id = target_order_id;
  update rider_assignment_attempts set status = 'accepted', responded_at = now()
    where order_id = target_order_id and rider_id = auth.uid() and status = 'offered';
end;
$$;

create or replace function public.decline_delivery(target_order_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare current_order orders%rowtype;
begin
  select * into current_order from orders where id = target_order_id for update;
  if not found or current_order.rider_id <> auth.uid() or current_order.status <> 'rider_assigned'
    or current_order.rider_accepted_at is not null then raise exception 'This offer is no longer available'; end if;
  update rider_assignment_attempts set status = 'declined', responded_at = now()
    where order_id = target_order_id and rider_id = auth.uid() and status = 'offered';
  update orders set rider_id = null, rider_assigned_at = null, rider_accepted_at = null,
    status = 'ready_for_pickup', updated_at = now() where id = target_order_id;
  insert into order_status_events(order_id, status, note)
    values (target_order_id, 'ready_for_pickup', 'Rider declined; searching for next rider');
end;
$$;

create or replace function public.process_expired_rider_assignments()
returns integer language plpgsql security definer set search_path = public as $$
declare expired orders%rowtype; processed integer := 0;
begin
  for expired in select * from orders where status = 'rider_assigned' and rider_accepted_at is null
      and rider_assigned_at <= now() - interval '5 minutes'
      order by rider_assigned_at limit 100 for update skip locked
  loop
    update rider_assignment_attempts set status = 'expired', responded_at = now()
      where order_id = expired.id and rider_id = expired.rider_id and status = 'offered';
    update orders set rider_id = null, rider_assigned_at = null, rider_accepted_at = null,
      status = 'ready_for_pickup', updated_at = now() where id = expired.id;
    insert into order_status_events(order_id, status, note)
      values (expired.id, 'ready_for_pickup', 'Offer expired; searching for next rider');
    processed := processed + 1;
  end loop;
  return processed;
end;
$$;

create or replace function public.dispatch_unassigned_ready_orders()
returns integer language plpgsql security definer set search_path = public as $$
declare waiting_order record; assigned_count integer := 0;
begin
  for waiting_order in select id from orders
    where status = 'ready_for_pickup' and rider_id is null and payment_status = 'paid'
    order by created_at limit 100 for update skip locked
  loop
    if public.assign_next_rider(waiting_order.id) is not null then
      assigned_count := assigned_count + 1;
    end if;
  end loop;
  return assigned_count;
end;
$$;

create or replace function public.claim_delivery(target_order_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare current_order orders%rowtype; rider_record riders%rowtype; next_attempt integer;
begin
  select * into rider_record from riders where owner_id = auth.uid() and status = 'approved'
    and is_online for update;
  if not found then raise exception 'Go online to claim deliveries'; end if;
  select * into current_order from orders where id = target_order_id for update;
  if not found or current_order.status <> 'ready_for_pickup' or current_order.rider_id is not null
    or current_order.payment_status <> 'paid' then raise exception 'This delivery is no longer available'; end if;
  if exists (select 1 from orders active where active.rider_id = auth.uid()
    and active.status in ('rider_assigned', 'picked_up', 'in_transit'))
    then raise exception 'Complete your active delivery before claiming another'; end if;
  select coalesce(max(attempt_number), 0) + 1 into next_attempt
    from rider_assignment_attempts where order_id = target_order_id;
  update orders set rider_id = auth.uid(), rider_assigned_at = now(), rider_accepted_at = now(),
    status = 'rider_assigned', updated_at = now() where id = target_order_id;
  insert into rider_assignment_attempts(order_id, rider_id, attempt_number, status, responded_at)
    values (target_order_id, auth.uid(), next_attempt, 'claimed', now());
  insert into order_status_events(order_id, status, note)
    values (target_order_id, 'rider_assigned', 'Rider claimed the delivery');
end;
$$;

create or replace function public.claim_delivery_notifications(batch_size integer default 50)
returns setof delivery_notification_outbox
language plpgsql security definer set search_path = public as $$
begin
  return query with batch as (
    select id from delivery_notification_outbox
      where status = 'pending' or (status = 'sending' and locked_at < now() - interval '5 minutes')
      order by created_at limit greatest(1, least(batch_size, 100)) for update skip locked
  )
  update delivery_notification_outbox o set status = 'sending', attempts = attempts + 1, locked_at = now()
    from batch where o.id = batch.id returning o.*;
end;
$$;

create or replace function public.enqueue_vendor_paid_order_email()
returns trigger language plpgsql security definer set search_path = public as $$
declare vendor_owner uuid; vendor_name text; vendor_email text; customer_name text;
begin
  if new.payment_status is distinct from 'paid' or old.payment_status is not distinct from 'paid'
    then return new; end if;
  select v.owner_id, v.name, p.email, cp.full_name into vendor_owner, vendor_name, vendor_email, customer_name
    from vendors v join profiles p on p.id = v.owner_id join profiles cp on cp.id = new.customer_id
    where v.id = new.vendor_id;
  if vendor_email is not null then
    insert into delivery_notification_outbox(recipient_id, recipient_email, notification_type, payload)
    values (vendor_owner, vendor_email, 'vendor_new_paid_order', jsonb_build_object(
      'order_id', new.id, 'vendor_name', vendor_name, 'customer_name', customer_name,
      'delivery_address', new.delivery_address, 'total_amount', new.total_amount));
  end if;
  return new;
end;
$$;
drop trigger if exists on_order_paid_vendor_email on public.orders;
create trigger on_order_paid_vendor_email after update of payment_status on public.orders
  for each row execute function public.enqueue_vendor_paid_order_email();

create or replace function public.handle_new_order_status_event()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.orders set status = new.status, updated_at = now() where id = new.order_id;
  perform realtime.broadcast_changes('order-status-' || new.order_id::text,
    'status_update', 'INSERT', 'order_status_events', 'public', new, null);
  if new.status = 'ready_for_pickup' then perform public.assign_next_rider(new.order_id); end if;
  return new;
end;
$$;

create or replace function public.dispatch_ready_orders_when_rider_online()
returns trigger language plpgsql security definer set search_path = public as $$
declare ready_order record;
begin
  if new.is_online and old.is_online is distinct from true and new.status = 'approved' then
    for ready_order in select id from orders where status = 'ready_for_pickup'
      and rider_id is null and payment_status = 'paid' order by created_at limit 50
    loop perform public.assign_next_rider(ready_order.id); end loop;
  end if;
  return new;
end;
$$;
drop trigger if exists on_rider_online_dispatch_ready_orders on public.riders;
create trigger on_rider_online_dispatch_ready_orders after update of is_online on public.riders
  for each row execute function public.dispatch_ready_orders_when_rider_online();

revoke all on function public.get_vendor_rider_options(uuid) from public;
revoke all on function public.set_vendor_riders(uuid, uuid[]) from public;
revoke all on function public.assign_next_rider(uuid) from public;
revoke all on function public.accept_delivery(uuid) from public;
revoke all on function public.decline_delivery(uuid) from public;
revoke all on function public.process_expired_rider_assignments() from public;
revoke all on function public.dispatch_unassigned_ready_orders() from public;
revoke all on function public.claim_delivery_notifications(integer) from public;
grant execute on function public.get_vendor_rider_options(uuid) to authenticated;
grant execute on function public.set_vendor_riders(uuid, uuid[]) to authenticated;
grant execute on function public.accept_delivery(uuid) to authenticated;
grant execute on function public.decline_delivery(uuid) to authenticated;
grant execute on function public.claim_delivery(uuid) to authenticated;
grant execute on function public.process_expired_rider_assignments() to service_role;
grant execute on function public.dispatch_unassigned_ready_orders() to service_role;
grant execute on function public.claim_delivery_notifications(integer) to service_role;
