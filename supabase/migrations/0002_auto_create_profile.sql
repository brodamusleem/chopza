-- =========================================================
-- 0002_auto_create_profile.sql
-- Automatically creates a `profiles` row whenever a new user
-- signs up through Supabase Auth, using metadata passed at
-- signup time (full_name, role) if provided.
-- =========================================================

create or replace function handle_new_auth_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'New User'),
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'customer')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- =========================================================
-- USAGE NOTE:
-- When you call supabase.auth.signUp() from the frontend,
-- pass the role and name like this so the trigger picks them up:
--
--   supabase.auth.signUp({
--     email, password,
--     options: { data: { full_name: 'Amina Yusuf', role: 'vendor' } }
--   })
--
-- For your very first admin account specifically, sign up as a
-- normal user first, then manually update that one row's `role`
-- to 'admin' in the Table Editor — don't let random signups
-- self-assign the admin role from the client.
-- =========================================================