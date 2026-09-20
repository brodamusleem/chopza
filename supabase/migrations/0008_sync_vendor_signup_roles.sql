-- Repair profiles created from vendor signup metadata when the auth trigger
-- was missing or previously created the profile with the customer default.
update public.profiles as profiles
set role = 'vendor'
from auth.users as users
where users.id = profiles.id
  and profiles.role = 'customer'
  and users.raw_user_meta_data ->> 'role' = 'vendor';

-- Keep the signup trigger available and idempotent for future accounts.
create or replace function public.handle_new_auth_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'New User'),
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'customer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();
