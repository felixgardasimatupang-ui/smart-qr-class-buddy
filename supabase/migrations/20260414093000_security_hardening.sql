create extension if not exists pgcrypto;

alter table public.attendance
  add column if not exists geo_lat double precision,
  add column if not exists geo_lng double precision;

alter table public.sessions
  add column if not exists qr_expires_at timestamptz;

create unique index if not exists sessions_qr_code_unique_idx
  on public.sessions (qr_code)
  where qr_code is not null;

create or replace function public.is_admin_user(_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = coalesce(_user_id, auth.uid())
      and role = 'admin'
  );
$$;

create or replace function public.update_user_role(
  _target_user_id uuid,
  _new_role public.app_role
)
returns public.user_roles
language plpgsql
security definer
set search_path = public
as $$
declare
  _updated_role public.user_roles;
begin
  if not public.is_admin_user(auth.uid()) then
    raise exception 'Only admins can update roles';
  end if;

  delete from public.user_roles where user_id = _target_user_id;

  insert into public.user_roles (user_id, role)
  values (_target_user_id, _new_role)
  returning * into _updated_role;

  return _updated_role;
end;
$$;

grant execute on function public.update_user_role(uuid, public.app_role) to authenticated;

create or replace function public.revoke_user_role(_target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin_user(auth.uid()) then
    raise exception 'Only admins can revoke roles';
  end if;

  delete from public.user_roles where user_id = _target_user_id;
end;
$$;

grant execute on function public.revoke_user_role(uuid) to authenticated;

create or replace function public.rotate_session_qr(
  _session_id uuid,
  _expiry_minutes integer default 1
)
returns table(qr_code text, qr_expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  _new_qr_code text;
  _new_expiry timestamptz;
begin
  if not public.is_admin_user(auth.uid()) then
    raise exception 'Only admins can rotate QR codes';
  end if;

  _new_qr_code := encode(gen_random_bytes(18), 'hex');
  _new_expiry := now() + make_interval(mins => greatest(_expiry_minutes, 1));

  update public.sessions
  set qr_code = _new_qr_code,
      qr_expires_at = _new_expiry,
      updated_at = now(),
      status = case when status = 'scheduled' then 'active' else status end
  where id = _session_id;

  return query
  select s.qr_code, s.qr_expires_at
  from public.sessions s
  where s.id = _session_id;
end;
$$;

grant execute on function public.rotate_session_qr(uuid, integer) to authenticated;

create or replace function public.validate_attendance_qr(
  _qr_code text,
  _student_user_id uuid,
  _geo_lat double precision default null,
  _geo_lng double precision default null
)
returns public.attendance
language plpgsql
security definer
set search_path = public
as $$
declare
  _session public.sessions;
  _student public.students;
  _attendance public.attendance;
begin
  select *
  into _session
  from public.sessions
  where qr_code = _qr_code
    and status = 'active'
  limit 1;

  if _session.id is null then
    raise exception 'Session not found or inactive';
  end if;

  if _session.qr_expires_at is not null and now() > _session.qr_expires_at then
    raise exception 'QR code expired';
  end if;

  select *
  into _student
  from public.students
  where user_id = _student_user_id
  limit 1;

  if _student.id is null then
    raise exception 'Student not found';
  end if;

  insert into public.attendance (
    session_id,
    student_id,
    status,
    scanned_at,
    geo_lat,
    geo_lng
  )
  values (
    _session.id,
    _student.id,
    'hadir',
    now(),
    _geo_lat,
    _geo_lng
  )
  on conflict (session_id, student_id)
  do update set
    status = excluded.status,
    scanned_at = excluded.scanned_at,
    geo_lat = excluded.geo_lat,
    geo_lng = excluded.geo_lng,
    updated_at = now()
  returning * into _attendance;

  return _attendance;
end;
$$;

grant execute on function public.validate_attendance_qr(text, uuid, double precision, double precision) to authenticated;
