-- =========================================================
-- 0014_security_hardening_and_storage.sql
-- 1. Users can no longer change their own role (privilege escalation fix).
-- 2. Signup can no longer create an admin through client-controlled metadata.
-- 3. Creates the storage buckets the app uses and secures them.
-- Safe to run more than once.
-- =========================================================

-- ---------- 1. Protect profiles.role ----------
-- auth.uid() is null for the service role / SQL editor, so you (and Edge
-- Functions using the service role) can still set roles. Admins can too.
create or replace function protect_profile_role()
returns trigger as $$
begin
  if auth.uid() is not null and not is_admin() and new.role is distinct from old.role then
    new.role := old.role;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists protect_profile_role_trg on profiles;
create trigger protect_profile_role_trg
  before update on profiles
  for each row execute function protect_profile_role();

-- ---------- 2. Signup may only ever create customer / vendor / rider ----------
-- Metadata sent from the browser is untrusted. 'admin' is never accepted here.
-- New admins are promoted server-side (service role), e.g. by the invite-admin function.
create or replace function public.handle_new_auth_user()
returns trigger as $$
declare
  v_requested text := new.raw_user_meta_data ->> 'role';
  v_role user_role := 'customer';
begin
  if v_requested in ('customer', 'vendor', 'rider') then
    v_role := v_requested::user_role;
  end if;

  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'New User'),
    new.email,
    v_role
  )
  on conflict (id) do update set email = excluded.email;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ---------- 3. Storage buckets + policies ----------
insert into storage.buckets (id, name, public) values
  ('menu-item-images', 'menu-item-images', true),
  ('avatars', 'avatars', true),
  ('branding', 'branding', true)
on conflict (id) do nothing;

-- Public read (images are shown on public pages)
drop policy if exists "Public read menu item images" on storage.objects;
create policy "Public read menu item images" on storage.objects
  for select using (bucket_id = 'menu-item-images');

drop policy if exists "Public read avatars" on storage.objects;
create policy "Public read avatars" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "Public read branding" on storage.objects;
create policy "Public read branding" on storage.objects
  for select using (bucket_id = 'branding');

-- Menu images: only people who own a vendor may write
drop policy if exists "Vendors manage menu item images" on storage.objects;
create policy "Vendors manage menu item images" on storage.objects
  for all to authenticated
  using (bucket_id = 'menu-item-images'
         and exists (select 1 from vendors v where v.owner_id = auth.uid()))
  with check (bucket_id = 'menu-item-images'
         and exists (select 1 from vendors v where v.owner_id = auth.uid()));

-- Avatars: a user may only write inside their OWN folder: <user id>/<filename>
drop policy if exists "Users manage their own avatar" on storage.objects;
create policy "Users manage their own avatar" on storage.objects
  for all to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Branding (platform logo): admins only
drop policy if exists "Admins manage branding" on storage.objects;
create policy "Admins manage branding" on storage.objects
  for all to authenticated
  using (bucket_id = 'branding' and is_admin())
  with check (bucket_id = 'branding' and is_admin());

-- =========================================================
-- VERIFY AFTER RUNNING (paste each separately):
--
-- A) Who is an admin right now? Every row must be someone you trust:
--    select id, email, role from profiles where role = 'admin';
--
-- B) Only ONE profile-creating trigger should exist on auth.users:
--    select tgname from pg_trigger where tgrelid = 'auth.users'::regclass and not tgisinternal;
--
-- C) Buckets exist:
--    select id, public from storage.buckets order by id;
--
-- TESTS TO RUN AS A NORMAL (non-admin) LOGGED-IN USER, in the browser console:
--  1) supabase.from('profiles').update({ role: 'admin' }).eq('id', '<your id>')
--     then re-read your profile: role must be unchanged.
--  2) Register a new account with options.data.role = 'admin':
--     the new profile must come out as 'customer'.
--
-- NOTE FOR UPLOAD CODE: avatars must be uploaded to "<user id>/<filename>"
-- (first folder = the user's id), or the avatar policy will reject them.
-- =========================================================
