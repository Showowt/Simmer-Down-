-- ============================================================
-- SimmerLovers loyalty — owner-editable welcome points
-- Makes the signup bonus a value in the settings table so the owner can
-- change it from /admin/premios (was hardcoded to 50 in the trigger).
-- ============================================================

insert into public.settings (key, value)
select 'loyalty_welcome_points', '50'::jsonb
where not exists (select 1 from public.settings where key = 'loyalty_welcome_points');

create or replace function public.handle_new_auth_user()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  fn text := btrim(coalesce(new.raw_user_meta_data->>'full_name', ''));
  welcome int;
begin
  welcome := coalesce(
    (select nullif(value::text, 'null')::numeric::int
       from public.settings where key = 'loyalty_welcome_points'),
    50
  );
  if welcome is null or welcome < 0 then
    welcome := 50;
  end if;

  insert into public.customers (
    auth_user_id, email, phone, first_name, last_name,
    loyalty_tier, loyalty_points_balance, lifetime_points_earned
  ) values (
    new.id,
    new.email,
    nullif(btrim(coalesce(new.raw_user_meta_data->>'phone', '')), ''),
    nullif(split_part(fn, ' ', 1), ''),
    nullif(btrim(substr(fn, length(split_part(fn, ' ', 1)) + 1)), ''),
    'bronze', welcome, welcome
  )
  on conflict (auth_user_id) do nothing;
  return new;
exception when others then
  raise warning '[handle_new_auth_user] customers insert failed for %: %', new.id, sqlerrm;
  return new;
end;
$function$;
