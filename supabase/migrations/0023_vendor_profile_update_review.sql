-- Allow vendors to submit edits to an approved profile for admin review.
-- The profile moves to pending until an admin approves the updated details.
create or replace function public.resubmit_vendor_application(target_vendor_id uuid)
returns void as $$
begin
  perform set_config('app.resubmitting_vendor', 'true', true);
  update public.vendors
  set status = 'pending'
  where id = target_vendor_id
    and owner_id = auth.uid()
    and status in ('rejected', 'approved');
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.resubmit_vendor_application(uuid) to authenticated;
