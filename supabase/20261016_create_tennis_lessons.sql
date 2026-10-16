-- 테니스 레슨 일지 (/lesson). 주인 요청 2026-10-16.
-- 적용: Supabase 대시보드 > SQL Editor 에서 실행. 여러 번 실행해도 안전하다.
--
-- 운동 기록과 같은 운동방(workout_rooms)에 묶는다.
-- 일지를 저장하면 화면이 workout_activity_records 에 "테니스 N분" 한 줄을 함께 저장하고,
-- 그 줄의 id 를 activity_id 에 남긴다 → 일지를 고치면 같은 줄이 고쳐지고, 지우면 함께 지워진다.
-- 운동 기록 쪽에서 그 줄을 먼저 지우면 activity_id 만 비고(set null) 일지는 남는다.
--
-- tips 는 화면에서 쓰지 않는다. 클로드가 raw 를 읽고 scripts/lesson-tips.mjs 로 채운다.
-- 접근 방식은 운동 기록 표들과 같다 (room_id 로만 접근, 표는 anon 에 열려 있음).

create table if not exists public.tennis_lessons (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.workout_rooms(id) on delete cascade,
  date date not null,
  -- [{ "name": "레슨", "minutes": 20 }, { "name": "볼머신", "minutes": 20 }]
  parts jsonb not null default '[]'::jsonb,
  -- 그날 적은 날것 그대로의 메모
  raw text not null default '',
  -- [{ "topic": "...", "points": ["..."] }] — 정리 전이면 빈 배열
  tips jsonb not null default '[]'::jsonb,
  -- 팁을 마지막으로 채운 때. raw 를 그 뒤에 고치면 "다시 정리 필요"로 본다
  tips_at timestamptz,
  activity_id uuid references public.workout_activity_records(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- raw 가 바뀔 때만 움직이는 시각 (팁만 채울 때는 그대로)
  raw_at timestamptz not null default now()
);

create index if not exists tennis_lessons_room_date_idx
  on public.tennis_lessons (room_id, date desc);

alter table public.tennis_lessons enable row level security;

drop policy if exists "tennis_lessons anon all" on public.tennis_lessons;
create policy "tennis_lessons anon all"
  on public.tennis_lessons for all
  using (true) with check (true);

-- updated_at 은 언제나, raw_at 은 raw 가 바뀐 경우에만 갱신
create or replace function public.tennis_lessons_touch()
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

drop trigger if exists tennis_lessons_touch on public.tennis_lessons;
create trigger tennis_lessons_touch
  before update on public.tennis_lessons
  for each row execute function public.tennis_lessons_touch();
