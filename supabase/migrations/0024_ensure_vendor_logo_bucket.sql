-- Ensure vendor logo uploads work even when the original onboarding
-- migration was not applied to this Supabase project.
insert into storage.buckets (id, name, public)
values ('vendor-logos', 'vendor-logos', true)
on conflict (id) do update set public = true;

drop policy if exists "Anyone can view vendor logos" on storage.objects;
create policy "Anyone can view vendor logos"
  on storage.objects for select
  using (bucket_id = 'vendor-logos');

drop policy if exists "Authenticated users can upload vendor logos" on storage.objects;
create policy "Authenticated users can upload vendor logos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'vendor-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
