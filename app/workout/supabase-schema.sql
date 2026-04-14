-- =============================================
-- 황총무 운동 기록 (workout) 스키마
-- 이 SQL을 Supabase 대시보드 > SQL Editor 에서 실행하세요.
-- =============================================

-- 운동 방 (room) : 방 이름 + 비밀번호로 식별
create table if not exists public.workout_rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  password text not null,
  created_at timestamptz not null default now()
);

-- 러닝 기록
create table if not exists public.workout_running_records (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.workout_rooms(id) on delete cascade,
  date date not null,
  run_type text not null,                    -- zone2 | interval | lsd | tempo | easy | race | other
  environment text not null default 'outdoor', -- outdoor | indoor
  distance_km numeric(6,2) not null,          -- 총 거리
  duration_sec integer not null,              -- 총 소요 시간(초)
  avg_pace_sec integer,                       -- km당 페이스(초) - 자동 계산 가능
  avg_heart_rate integer,
  avg_cadence integer,
  calories integer,
  intervals jsonb,                            -- 실외:[{distanceKm,durationSec,paceSec,heartRate}] / 실내:[{speedKmh,durationSec,heartRate}]
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 기존 테이블에 environment 컬럼이 없다면 추가 (멱등)
alter table public.workout_running_records
  add column if not exists environment text not null default 'outdoor';

create index if not exists workout_running_records_room_date_idx
  on public.workout_running_records (room_id, date desc);

-- 헬스(웨이트) 기록 : 하루치 전체 운동 세션 1건
create table if not exists public.workout_gym_records (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.workout_rooms(id) on delete cascade,
  date date not null,
  body_part text,                             -- 가슴/등/어깨/하체/팔/복근/전신/기타
  duration_min integer,                       -- 전체 운동 시간(분)
  calories integer,                           -- 총 킬로칼로리
  avg_heart_rate integer,                     -- 평균 심박수
  exercises jsonb not null,                   -- [{name, sets: [{weight, reps, type, dropSets?, note}]}]
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workout_gym_records_room_date_idx
  on public.workout_gym_records (room_id, date desc);

-- 기존 테이블에 칼로리·심박 컬럼이 없다면 추가 (멱등)
alter table public.workout_gym_records
  add column if not exists calories integer,
  add column if not exists avg_heart_rate integer;

-- 저장한 웨이트 루틴 (자주 쓰는 세트 묶음)
create table if not exists public.workout_routines (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.workout_rooms(id) on delete cascade,
  name text not null,
  body_part text,
  exercises jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workout_routines_room_idx
  on public.workout_routines (room_id, created_at desc);

alter table public.workout_routines enable row level security;

drop policy if exists "workout_routines anon all" on public.workout_routines;
create policy "workout_routines anon all"
  on public.workout_routines for all
  using (true) with check (true);

drop trigger if exists workout_routines_touch on public.workout_routines;
create trigger workout_routines_touch
  before update on public.workout_routines
  for each row execute function public.workout_touch_updated_at();

-- RLS : 익명 키로 접근하되 room_id 와 password 를 같이 확인하는 클라이언트 로직에 의존
-- (가계부와 동일 철학 — 서버 RPC 없이 단순화)
alter table public.workout_rooms enable row level security;
alter table public.workout_running_records enable row level security;
alter table public.workout_gym_records enable row level security;

-- 익명 anon 키가 모든 행에 접근 가능 (가계부 방식과 동일)
drop policy if exists "workout_rooms anon all" on public.workout_rooms;
create policy "workout_rooms anon all"
  on public.workout_rooms for all
  using (true) with check (true);

drop policy if exists "workout_running anon all" on public.workout_running_records;
create policy "workout_running anon all"
  on public.workout_running_records for all
  using (true) with check (true);

drop policy if exists "workout_gym anon all" on public.workout_gym_records;
create policy "workout_gym anon all"
  on public.workout_gym_records for all
  using (true) with check (true);

-- updated_at 자동 갱신 트리거
create or replace function public.workout_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists workout_running_touch on public.workout_running_records;
create trigger workout_running_touch
  before update on public.workout_running_records
  for each row execute function public.workout_touch_updated_at();

drop trigger if exists workout_gym_touch on public.workout_gym_records;
create trigger workout_gym_touch
  before update on public.workout_gym_records
  for each row execute function public.workout_touch_updated_at();
