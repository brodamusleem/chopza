-- In-app order alerts and admin escalation. Email outbox from 0021 is retired.
alter table public.orders
  add column if not exists vendor_response_alerted_at timestamptz,
  add column if not exists vendor_response_started_at timestamptz;

create table if not exists public.app_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  notification_type text not null,
  title text not null,
  body text not null,
  order_id uuid references public.orders(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_app_notifications_recipient_unread
  on public.app_notifications(recipient_id, created_at desc) where read_at is null;
alter table public.app_notifications enable row level security;
drop policy if exists "Users read their notifications" on public.app_notifications;
create policy "Users read their notifications" on public.app_notifications
  for select to authenticated using (recipient_id = auth.uid());
drop policy if exists "Users mark their notifications read" on public.app_notifications;
create policy "Users mark their notifications read" on public.app_notifications
  for update to authenticated using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

do $$ begin
  alter publication supabase_realtime add table public.app_notifications;
exception when duplicate_object then null;
end $$;

create or replace function public.notify_user(
  target_user uuid, notification_kind text, notification_title text,
  notification_body text, target_order uuid, notification_data jsonb default '{}'::jsonb
) returns void language sql security definer set search_path = public as $$
  insert into public.app_notifications(recipient_id, notification_type, title, body, order_id, data)
  values (target_user, notification_kind, notification_title, notification_body, target_order,
    coalesce(notification_data, '{}'::jsonb));
$$;

drop trigger if exists on_order_paid_vendor_email on public.orders;
create or replace function public.notify_vendor_paid_order()
returns trigger language plpgsql security definer set search_path = public as $$
declare vendor_owner uuid;
begin
  if new.payment_status is distinct from 'paid' or old.payment_status is not distinct from 'paid'
    then return new; end if;
  select owner_id into vendor_owner from public.vendors where id = new.vendor_id;
  update public.orders set vendor_response_started_at = now(), vendor_response_alerted_at = null
    where id = new.id;
  if vendor_owner is not null then
    perform public.notify_user(vendor_owner, 'vendor_new_paid_order', 'New paid order',
      'A customer has paid for a new order. Review it within five minutes.', new.id,
      jsonb_build_object('vendor_id', new.vendor_id));
  end if;
  return new;
end;
$$;
create trigger on_order_paid_vendor_notification after update of payment_status on public.orders
  for each row execute function public.notify_vendor_paid_order();

drop function if exists public.claim_delivery_notifications(integer);
drop table if exists public.delivery_notification_outbox;

create or replace function public.assign_next_rider(target_order_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  target_order public.orders%rowtype;
  selected_owner_id uuid;
  selected_name text;
  vendor_name text;
  next_attempt integer;
begin
  select * into target_order from public.orders where id = target_order_id for update;
  if not found or target_order.status <> 'ready_for_pickup' or target_order.rider_id is not null
    or target_order.payment_status <> 'paid' then return null; end if;
  select r.owner_id, p.full_name into selected_owner_id, selected_name
    from public.riders r join public.profiles p on p.id = r.owner_id
    left join public.vendor_riders vr on vr.vendor_id = target_order.vendor_id and vr.rider_id = r.id
    where r.status = 'approved' and r.is_online
      and not exists (select 1 from public.orders active where active.rider_id = r.owner_id
        and active.id <> target_order.id and active.status in ('rider_assigned', 'picked_up', 'in_transit'))
      and not exists (select 1 from public.rider_assignment_attempts tried
        where tried.order_id = target_order.id and tried.rider_id = r.owner_id)
    order by case when vr.rider_id is null then 1 else 0 end, vr.priority nulls last, r.created_at, r.id
    limit 1 for update of r skip locked;
  if selected_owner_id is null then
    if target_order.rider_search_alerted_at is null then
      select owner_id into selected_owner_id from public.vendors where id = target_order.vendor_id;
      if selected_owner_id is not null then
        perform public.notify_user(selected_owner_id, 'vendor_no_rider_available', 'No rider available yet',
          'The order is ready, but no online rider is available. It remains in the dispatch queue.', target_order.id);
      end if;
      update public.orders set rider_search_alerted_at = now() where id = target_order.id;
    end if;
    return null;
  end if;
  select coalesce(max(attempt_number), 0) + 1 into next_attempt
    from public.rider_assignment_attempts where order_id = target_order.id;
  update public.orders set rider_id = selected_owner_id, rider_assigned_at = now(),
    rider_accepted_at = null, rider_search_alerted_at = null,
    status = 'rider_assigned', updated_at = now() where id = target_order.id;
  insert into public.rider_assignment_attempts(order_id, rider_id, attempt_number)
    values (target_order.id, selected_owner_id, next_attempt);
  insert into public.order_status_events(order_id, status, note)
    values (target_order.id, 'rider_assigned', 'Delivery offer sent to rider');
  select name into vendor_name from public.vendors where id = target_order.vendor_id;
  perform public.notify_user(selected_owner_id, 'rider_delivery_offer', 'New delivery offer',
    'A delivery from ' || coalesce(vendor_name, 'a restaurant') || ' is waiting. Accept or decline within five minutes.',
    target_order.id, jsonb_build_object('vendor_name', vendor_name, 'rider_name', selected_name));
  return selected_owner_id;
end;
$$;

create or replace function public.process_expired_rider_assignments()
returns integer language plpgsql security definer set search_path = public as $$
declare expired public.orders%rowtype; processed integer := 0; vendor_label text;
begin
  for expired in select * from public.orders where status = 'rider_assigned' and rider_accepted_at is null
      and rider_assigned_at <= now() - interval '5 minutes'
      order by rider_assigned_at limit 100 for update skip locked
  loop
    update public.rider_assignment_attempts set status = 'expired', responded_at = now()
      where order_id = expired.id and rider_id = expired.rider_id and status = 'offered';
    select name into vendor_label from public.vendors where id = expired.vendor_id;
    insert into public.app_notifications(recipient_id, notification_type, title, body, order_id, data)
      select p.id, 'rider_offer_expired', 'Rider did not accept an order',
        'Order #' || left(expired.id::text, 8) || ' was not accepted by the assigned rider within five minutes. A new rider will be tried.',
        expired.id, jsonb_build_object('vendor_name', vendor_label, 'rider_id', expired.rider_id)
      from public.profiles p where p.role = 'admin';
    update public.orders set rider_id = null, rider_assigned_at = null, rider_accepted_at = null,
      status = 'ready_for_pickup', updated_at = now() where id = expired.id;
    insert into public.order_status_events(order_id, status, note)
      values (expired.id, 'ready_for_pickup', 'Offer expired; searching for next rider');
    processed := processed + 1;
  end loop;
  return processed;
end;
$$;

create or replace function public.process_dispatch_timeouts()
returns integer language plpgsql security definer set search_path = public as $$
declare overdue public.orders%rowtype; processed integer := 0; vendor_label text;
begin
  for overdue in select * from public.orders
    where status = 'pending' and payment_status = 'paid'
      and vendor_response_alerted_at is null
      and coalesce(vendor_response_started_at, created_at) <= now() - interval '5 minutes'
    order by created_at limit 100 for update skip locked
  loop
    select name into vendor_label from public.vendors where id = overdue.vendor_id;
    update public.orders set vendor_response_alerted_at = now() where id = overdue.id;
    insert into public.app_notifications(recipient_id, notification_type, title, body, order_id, data)
      select p.id, 'vendor_order_unaccepted', 'Restaurant did not accept an order',
        coalesce(vendor_label, 'The assigned restaurant') || ' did not accept order #' || left(overdue.id::text, 8) || ' within five minutes. Review it and reassign it if needed.',
        overdue.id, jsonb_build_object('vendor_id', overdue.vendor_id, 'vendor_name', vendor_label)
      from public.profiles p where p.role = 'admin';
    processed := processed + 1;
  end loop;
  return processed;
end;
$$;

create or replace function public.admin_reassign_order(target_order_id uuid, target_vendor_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare current_order public.orders%rowtype; next_vendor_owner uuid; previous_vendor_name text; next_vendor_name text;
begin
  if not public.is_admin() then raise exception 'Only an admin can reassign an order'; end if;
  select * into current_order from public.orders where id = target_order_id for update;
  if not found or current_order.status not in ('pending', 'cancelled') or current_order.payment_status <> 'paid'
    then raise exception 'Only paid orders not accepted by a restaurant can be reassigned'; end if;
  if current_order.vendor_id = target_vendor_id then raise exception 'Choose a different restaurant'; end if;
  select name into previous_vendor_name from public.vendors where id = current_order.vendor_id;
  select owner_id, name into next_vendor_owner, next_vendor_name from public.vendors
    where id = target_vendor_id and status = 'approved';
  if next_vendor_owner is null then raise exception 'Choose an approved restaurant'; end if;
  update public.orders set vendor_id = target_vendor_id, vendor_response_started_at = now(),
    vendor_response_alerted_at = null, updated_at = now()
    where id = target_order_id;
  perform public.notify_user(next_vendor_owner, 'vendor_reassigned_order', 'Order transferred to your restaurant',
    'Order #' || left(target_order_id::text, 8) || ' was transferred from ' || coalesce(previous_vendor_name, 'another restaurant') || '. Review the order details and accept it within five minutes.',
    target_order_id, jsonb_build_object('vendor_id', target_vendor_id, 'previous_vendor', previous_vendor_name));
  insert into public.order_status_events(order_id, status, note)
    values (target_order_id, 'pending', 'Admin reassigned order to ' || next_vendor_name);
end;
$$;

create or replace function public.handle_new_order_status_event()
returns trigger language plpgsql security definer set search_path = public as $$
declare current_order public.orders%rowtype;
begin
  select * into current_order from public.orders where id = new.order_id for update;
  if new.status = 'accepted' and current_order.status = 'pending'
    and coalesce(current_order.vendor_response_started_at, current_order.created_at) <= now() - interval '5 minutes'
    and not public.is_admin() then
    raise exception 'The five-minute response window has passed. Contact the marketplace admin.';
  end if;
  if new.status = 'cancelled' and current_order.status = 'pending' then
    insert into public.app_notifications(recipient_id, notification_type, title, body, order_id, data)
      select p.id, 'vendor_declined_order', 'Restaurant declined an order',
        'The restaurant declined paid order #' || left(new.order_id::text, 8) || '. Review it and transfer it if another restaurant can fulfill it.',
        new.order_id, jsonb_build_object('vendor_id', current_order.vendor_id)
      from public.profiles p where p.role = 'admin';
    update public.orders set vendor_response_alerted_at = coalesce(vendor_response_alerted_at, now())
      where id = new.order_id;
  end if;
  update public.orders set status = new.status, updated_at = now() where id = new.order_id;
  perform realtime.broadcast_changes('order-status-' || new.order_id::text,
    'status_update', 'INSERT', 'order_status_events', 'public', new, null);
  if new.status = 'ready_for_pickup' then perform public.assign_next_rider(new.order_id); end if;
  return new;
end;
$$;

create or replace function public.decline_delivery(target_order_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare current_order public.orders%rowtype;
begin
  select * into current_order from public.orders where id = target_order_id for update;
  if not found or current_order.rider_id <> auth.uid() or current_order.status <> 'rider_assigned'
    or current_order.rider_accepted_at is not null then raise exception 'This offer is no longer available'; end if;
  update public.rider_assignment_attempts set status = 'declined', responded_at = now()
    where order_id = target_order_id and rider_id = auth.uid() and status = 'offered';
  insert into public.app_notifications(recipient_id, notification_type, title, body, order_id, data)
    select p.id, 'rider_offer_declined', 'Rider declined an order',
      'The assigned rider declined order #' || left(target_order_id::text, 8) || '. The system will offer it to the next available rider.',
      target_order_id, jsonb_build_object('rider_id', auth.uid())
    from public.profiles p where p.role = 'admin';
  update public.orders set rider_id = null, rider_assigned_at = null, rider_accepted_at = null,
    status = 'ready_for_pickup', updated_at = now() where id = target_order_id;
  insert into public.order_status_events(order_id, status, note)
    values (target_order_id, 'ready_for_pickup', 'Rider declined; searching for next rider');
end;
$$;

revoke all on function public.process_dispatch_timeouts() from public;
revoke all on function public.admin_reassign_order(uuid, uuid) from public;
revoke all on function public.notify_vendor_paid_order() from public;
revoke all on function public.handle_new_order_status_event() from public;
revoke all on function public.notify_user(uuid, text, text, text, uuid, jsonb) from public;
grant execute on function public.process_dispatch_timeouts() to service_role;
grant execute on function public.admin_reassign_order(uuid, uuid) to authenticated;
