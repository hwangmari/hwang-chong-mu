-- 테니스 레슨 일지(/lesson)를 운동방이 아니라 황총무 통합 계정(hwang_users)에 쌓는다. 주인 결정 2026-10-16.
-- 경조사비 장부(20260901_create_gift_log.sql)와 같은 방식:
--   표는 anon 에서 완전히 잠그고(RLS + revoke), SECURITY DEFINER 함수로만 접근한다.
--   user_id 는 서버 라우트(app/api/lesson)가 세션 쿠키로 확정해서 넘긴다.
--
-- 예전 표 tennis_lessons(운동방 기준, 20261016_create_tennis_lessons.sql)는 지우거나 고치지 않는다.
-- 화면에서 "내 계정으로 옮기기"를 누르면 tennis_lesson_import_room 이 그 방의 일지를 이 표로 복사하고,
-- 어느 줄에서 왔는지 source_id 에 남겨 두 번 옮기지 않는다.
--
-- activity_id 는 운동 기록(workout_activity_records)의 "테니스 N분" 한 줄. 운동방을 계정에 이어 둔 경우에만 채워진다.
-- tips 는 화면에서 쓰지 않는다. 클로드가 raw 를 읽고 scripts/lesson-tips.mjs 로 채운다(tennis_lesson_set_tips).
--
-- 적용: Supabase 대시보드 > SQL Editor에서 실행. 여러 번 실행해도 안전하다.

create table if not exists public.tennis_lesson_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.hwang_users(id) on delete cascade,
  date date not null,
  -- [{ "name": "레슨", "minutes": 20 }, { "name": "게임", "minutes": 30 }]
  parts jsonb not null default '[]'::jsonb,
  -- 그날 적은 날것 그대로의 메모
  raw text not null default '',
  -- [{ "topic": "...", "points": ["..."] }] — 정리 전이면 빈 배열
  tips jsonb not null default '[]'::jsonb,
  -- 팁을 마지막으로 채운 때. raw 를 그 뒤에 고치면 "다시 정리 필요"로 본다
  tips_at timestamptz,
  activity_id uuid references public.workout_activity_records(id) on delete set null,
  -- 예전 표(tennis_lessons)에서 옮겨 온 경우 그 줄의 id
  source_id uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- raw 가 바뀔 때만 움직이는 시각 (팁만 채울 때는 그대로)
  raw_at timestamptz not null default now()
);

create index if not exists tennis_lesson_entries_user_date_idx
  on public.tennis_lesson_entries (user_id, date desc);

alter table public.tennis_lesson_entries enable row level security;
revoke all on public.tennis_lesson_entries from anon, authenticated;

-- updated_at 은 언제나, raw_at 은 raw 가 바뀐 경우에만 갱신
create or replace function public.tennis_lesson_entries_touch()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  if new.raw is distinct from old.raw then
    new.raw_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists tennis_lesson_entries_touch on public.tennis_lesson_entries;
create trigger tennis_lesson_entries_touch
  before update on public.tennis_lesson_entries
  for each row execute function public.tennis_lesson_entries_touch();

-- 한 줄 → 화면이 쓰는 모양
create or replace function public.tennis_lesson_json(e public.tennis_lesson_entries)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'id', e.id,
    'date', to_char(e.date, 'YYYY-MM-DD'),
    'parts', e.parts,
    'raw', e.raw,
    'tips', e.tips,
    'tipsAt', case when e.tips_at is null then null
                   else to_char(e.tips_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') end,
    'activityId', e.activity_id,
    'rawAt', to_char(e.raw_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'sourceId', e.source_id
  );
$$;

-- 내 일지 전체 (날짜 내림차순 → 같은 날이면 최근 등록순)
create or replace function public.tennis_lesson_list(p_user_id uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(tennis_lesson_json(e) order by e.date desc, e.created_at desc),
    '[]'::jsonb
  )
  from tennis_lesson_entries e
  where e.user_id = p_user_id;
$$;

-- 일지 저장. p_id 가 null 이면 새로 추가, 있으면 수정(내 일지만).
-- p_tips 가 null 이면 팁은 건드리지 않는다. 비어 있지 않은 팁을 넘기면 tips_at 도 지금으로.
create or replace function public.tennis_lesson_upsert(
  p_user_id uuid,
  p_id uuid,
  p_date date,
  p_parts jsonb,
  p_raw text,
  p_tips jsonb,
  p_activity_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row tennis_lesson_entries;
begin
  if p_id is null then
    insert into tennis_lesson_entries (user_id, date, parts, raw, tips, tips_at, activity_id)
    values (
      p_user_id,
      p_date,
      coalesce(p_parts, '[]'::jsonb),
      coalesce(p_raw, ''),
      coalesce(p_tips, '[]'::jsonb),
      case when p_tips is not null and jsonb_array_length(p_tips) > 0 then now() else null end,
      p_activity_id
    )
    returning * into v_row;
  else
    update tennis_lesson_entries
       set date        = p_date,
           parts       = coalesce(p_parts, '[]'::jsonb),
           raw         = coalesce(p_raw, ''),
           tips        = coalesce(p_tips, tips),
           tips_at     = case when p_tips is not null and jsonb_array_length(p_tips) > 0
                              then now() else tips_at end,
           activity_id = p_activity_id
     where id = p_id
       and user_id = p_user_id
    returning * into v_row;

    if not found then
      raise exception 'NOT_FOUND';
    end if;
  end if;

  return tennis_lesson_json(v_row);
end;
$$;

-- 일지 삭제 (내 일지만)
create or replace function public.tennis_lesson_delete(p_user_id uuid, p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from tennis_lesson_entries
   where id = p_id
     and user_id = p_user_id;
$$;

-- 팁 채우기 (scripts/lesson-tips.mjs). raw 는 그대로라 raw_at 도 그대로다.
create or replace function public.tennis_lesson_set_tips(p_user_id uuid, p_id uuid, p_tips jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row tennis_lesson_entries;
begin
  update tennis_lesson_entries
     set tips    = coalesce(p_tips, '[]'::jsonb),
         tips_at = now()
   where id = p_id
     and user_id = p_user_id
  returning * into v_row;

  if not found then
    raise exception 'NOT_FOUND';
  end if;

  return tennis_lesson_json(v_row);
end;
$$;

-- 운동방에 적어 둔 예전 일지를 내 계정으로 복사. 이미 옮긴 줄(source_id)은 건너뛴다 → 옮긴 개수
create or replace function public.tennis_lesson_import_room(p_user_id uuid, p_room_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into tennis_lesson_entries
    (user_id, date, parts, raw, tips, tips_at, activity_id, raw_at, source_id, created_at)
  select p_user_id, t.date, t.parts, t.raw, t.tips, t.tips_at, t.activity_id, t.raw_at, t.id, t.created_at
    from tennis_lessons t
   where t.room_id = p_room_id
     and not exists (
       select 1 from tennis_lesson_entries e where e.source_id = t.id
     )
  -- 두 번 연달아 눌러도 같은 일지가 두 번 들어가지 않게
  on conflict (source_id) do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.tennis_lesson_json(public.tennis_lesson_entries) from public, anon, authenticated;
grant execute on function public.tennis_lesson_list(uuid) to anon, authenticated;
grant execute on function public.tennis_lesson_upsert(uuid, uuid, date, jsonb, text, jsonb, uuid) to anon, authenticated;
grant execute on function public.tennis_lesson_delete(uuid, uuid) to anon, authenticated;
grant execute on function public.tennis_lesson_set_tips(uuid, uuid, jsonb) to anon, authenticated;
grant execute on function public.tennis_lesson_import_room(uuid, uuid) to anon, authenticated;
