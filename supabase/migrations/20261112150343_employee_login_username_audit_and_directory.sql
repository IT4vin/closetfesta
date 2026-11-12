-- Applied in Supabase project roqcwdlsuawrdbmnwbvv
-- Version 20261112150343. No secrets or password values are persisted here.
create table if not exists public.closet_employee_login_audit (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id),
  target_id uuid not null references auth.users(id),
  previous_username text,
  new_username text not null,
  changed_at timestamptz not null default clock_timestamp()
);
alter table public.closet_employee_login_audit enable row level security;
revoke all on table public.closet_employee_login_audit from anon, authenticated;

create or replace function public.closet_employee_directory()
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $function$
declare v_result jsonb;
begin
  if auth.uid() is null or not public.has_role(auth.uid(), 'admin'::public.app_role) then
    raise exception 'Somente o administrador pode consultar funcionários' using errcode='42501';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', u.id,
    'full_name', coalesce(p.full_name,u.raw_user_meta_data->>'full_name',u.email),
    'email', coalesce(nullif(p.email,''),u.email),
    'login_email', u.email,
    'username', case when u.email like '%@closetmanager.local'
         then split_part(u.email,'@',1) else null end,
    'phone',p.phone,
    'role',coalesce(roles.role,'inactive'),
    'email_confirmed',u.email_confirmed_at is not null,
    'created_at',u.created_at,
    'department',e.department,
    'job_title',e.job_title,
    'hired_on',e.hired_on
  ) order by u.created_at desc),'[]'::jsonb)
  into v_result
  from auth.users u
  left join public.profiles p on p.id=u.id
  left join public.closet_employee_details e on e.user_id=u.id
  left join lateral (
    select r.role::text as role from public.user_roles r where r.user_id=u.id
    order by case r.role
      when 'admin'::public.app_role then 1
      when 'manager'::public.app_role then 2
      when 'staff'::public.app_role then 3
      else 4 end limit 1
  ) roles on true;
  return v_result;
end;
$function$;
revoke all on function public.closet_employee_directory() from public, anon;
grant execute on function public.closet_employee_directory() to authenticated;
