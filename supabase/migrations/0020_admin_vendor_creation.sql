-- Allow admins to create a vendor listing for an existing vendor account.
-- The vendor must own the listing and must already have the vendor role.
create policy "Admins can create vendor profiles"
  on public.vendors for insert
  to authenticated
  with check (
    public.is_admin()
    and exists (
      select 1
      from public.profiles p
      where p.id = owner_id
        and p.role = 'vendor'
    )
  );
