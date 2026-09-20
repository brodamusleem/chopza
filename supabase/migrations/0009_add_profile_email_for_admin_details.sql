alter table public.profiles
  add column if not exists email text;

update public.profiles as profiles
set email = users.email
from auth.users as users
where users.id = profiles.id
  and profiles.email is null;

create or replace function public.handle_new_auth_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'New User'),
    new.email,
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'customer')
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$ language plpgsql security definer set search_path = public;
