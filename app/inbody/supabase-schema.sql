-- 인바디 측정 기록
-- 운동 일지(workout)와 동일한 방을 공유한다.
-- workout_rooms.id 를 그대로 room_id로 사용해서 운동방 로그인 = 인바디방 로그인.

-- 측정 기록
create table if not exists public.inbody_records (
  id text primary key,
  room_id uuid not null references public.workout_rooms(id) on delete cascade,
  date text not null,
  weight numeric,
  skeletal_muscle numeric,
  body_fat_mass numeric,
  bmr integer,
  bmi numeric,
  body_fat_pct numeric,
  abdominal_fat_ratio numeric,
  visceral_fat_level integer,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inbody_records_room_date_idx
  on public.inbody_records (room_id, date desc);

-- updated_at 자동 갱신 트리거
create or replace function public.set_inbody_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_inbody_updated_at on public.inbody_records;
create trigger trg_inbody_updated_at
before update on public.inbody_records
for each row
execute function public.set_inbody_updated_at();

-- RLS는 비활성화 (운동 일지와 동일하게 방 비밀번호로 접근 통제).
alter table public.inbody_records disable row level security;
