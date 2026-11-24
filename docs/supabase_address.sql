-- Red Apple Distribution: shop address on retailer accounts. Already run once in Supabase. Safe to run again.
alter table public.profiles add column if not exists address text;
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path to 'public' as $function$
begin
  insert into public.profiles(id, email, name, shop, phone, whatsapp, state, requirements, payment_pref, address, status)
  values (new.id, new.email, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'shop', new.raw_user_meta_data->>'phone', new.raw_user_meta_data->>'whatsapp', new.raw_user_meta_data->>'state', new.raw_user_meta_data->>'requirements', new.raw_user_meta_data->>'payment_pref', new.raw_user_meta_data->>'address', 'pending');
  return new;
end $function$;
