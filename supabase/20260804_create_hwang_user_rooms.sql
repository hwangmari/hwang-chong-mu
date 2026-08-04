-- 통합 계정의 "내 방": 약속(meeting)·정산(calc)처럼 여러 개일 수 있는 방을 계정에 등록.
-- (hwang_user_links는 서비스당 1개 신원용. 이건 서비스당 여러 방을 담는다.)
-- 패턴: hwang_user_links.sql (RLS + revoke + SECURITY DEFINER + grant, 변경 후 목록 반환)
--
-- 적용: Supabase 대시보드 > SQL Editor에서 실행.

create table if not exists hwang_user_rooms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references hwang_users(id) on delete cascade,
  service text not null check (service in ('meeting', 'calc')),
  room_id text not null,
  label text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, service, room_id)
);

create index if not exists idx_hwang_user_rooms_user on hwang_user_rooms(user_id);

alter table hwang_user_rooms enable row level security;
revoke all on hwang_user_rooms from anon, authenticated;

-- 내 방 목록 (최신순)
create or replace function hwang_rooms_list(p_user_id uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', r.id,
        'service', r.service,
        'roomId', r.room_id,
        'label', r.label,
        'createdAt', to_char(r.created_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      )
      order by r.created_at desc
    ),
    '[]'::jsonb
  )
  from hwang_user_rooms r
  where r.user_id = p_user_id;
$$;

-- 방 등록 (같은 방이면 라벨만 갱신) → 목록 반환
create or replace function hwang_rooms_add(
  p_user_id uuid,
  p_service text,
  p_room_id text,
  p_label text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_service not in ('meeting', 'calc') then
    raise exception 'INVALID_SERVICE';
  end if;
  if coalesce(trim(p_room_id), '') = '' then
    raise exception 'INVALID_ROOM';
  end if;

  insert into hwang_user_rooms (user_id, service, room_id, label)
  values (p_user_id, p_service, trim(p_room_id), coalesce(p_label, ''))
  on conflict (user_id, service, room_id)
  do update set label = excluded.label;

  return hwang_rooms_list(p_user_id);
end;
$$;

-- 방 제거 → 목록 반환
create or replace function hwang_rooms_delete(
  p_user_id uuid,
  p_service text,
  p_room_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from hwang_user_rooms
  where user_id = p_user_id
    and service = p_service
    and room_id = trim(p_room_id);

  return hwang_rooms_list(p_user_id);
end;
$$;

grant execute on function hwang_rooms_list(uuid) to anon, authenticated;
grant execute on function hwang_rooms_add(uuid, text, text, text) to anon, authenticated;
grant execute on function hwang_rooms_delete(uuid, text, text) to anon, authenticated;
