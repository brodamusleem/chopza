-- Let customers cancel paid orders that are still waiting for a rider.
-- Orders are placed in the existing refund_pending workflow for admin processing.
create or replace function public.cancel_unassigned_order(target_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare current_order public.orders%rowtype;
begin
  select * into current_order
  from public.orders
  where id = target_order_id
  for update;

  if not found or current_order.customer_id <> auth.uid() then
    raise exception 'Order not found';
  end if;
  if current_order.status <> 'ready_for_pickup'
     or current_order.rider_id is not null
     or current_order.payment_status <> 'paid' then
    raise exception 'This order can no longer be cancelled here';
  end if;

  insert into public.order_status_events(order_id, status, note)
  values (target_order_id, 'cancelled', 'Customer cancelled while waiting for rider');

  insert into public.app_notifications(
    recipient_id, notification_type, title, body, order_id, data
  )
  select p.id, 'refund_review', 'Customer cancellation needs a refund',
    'Order #' || left(target_order_id::text, 8) ||
      ' was cancelled while waiting for a rider. Review it in Payments & Refunds.',
    target_order_id, jsonb_build_object('reason', 'no_rider_available')
  from public.profiles p
  where p.role = 'admin';
end;
$$;

revoke all on function public.cancel_unassigned_order(uuid) from public;
grant execute on function public.cancel_unassigned_order(uuid) to authenticated;

-- Admins may manually assign a previously contacted rider, including one who
-- is offline in the app. The rider must still be approved and free of another job.
create or replace function public.admin_assign_rider(
  target_order_id uuid,
  target_rider_owner_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_order public.orders%rowtype;
  rider_record public.riders%rowtype;
  attempt_no integer;
begin
  if not public.is_admin() then
    raise exception 'Only an admin can assign a rider';
  end if;

  select * into current_order
  from public.orders
  where id = target_order_id
  for update;
  if not found
     or current_order.status <> 'ready_for_pickup'
     or current_order.rider_id is not null
     or current_order.payment_status <> 'paid' then
    raise exception 'This order is no longer waiting for a rider';
  end if;

  select * into rider_record
  from public.riders
  where owner_id = target_rider_owner_id
    and status = 'approved'
  for update;
  if not found then
    raise exception 'Choose an approved rider';
  end if;
  if exists (
    select 1 from public.orders active
    where active.rider_id = target_rider_owner_id
      and active.status in ('rider_assigned', 'picked_up', 'in_transit')
  ) then
    raise exception 'This rider already has an active delivery';
  end if;

  select coalesce(max(attempt_number), 0) + 1 into attempt_no
  from public.rider_assignment_attempts
  where order_id = target_order_id;

  update public.orders
  set rider_id = target_rider_owner_id,
      rider_assigned_at = now(),
      rider_accepted_at = now(),
      updated_at = now()
  where id = target_order_id;

  insert into public.rider_assignment_attempts(
    order_id, rider_id, attempt_number, status, responded_at
  ) values (
    target_order_id, target_rider_owner_id, attempt_no, 'accepted', now()
  );

  insert into public.order_status_events(order_id, status, note)
  values (target_order_id, 'rider_assigned', 'Admin manually assigned a rider');

  insert into public.app_notifications(
    recipient_id, notification_type, title, body, order_id, data
  ) values (
    target_rider_owner_id, 'rider_delivery_offer', 'Delivery assigned to you',
    'An administrator assigned you a delivery. Open your rider dashboard to view the pickup and customer details.',
    target_order_id, jsonb_build_object('order_id', target_order_id)
  );
end;
$$;

revoke all on function public.admin_assign_rider(uuid, uuid) from public;
grant execute on function public.admin_assign_rider(uuid, uuid) to authenticated;
