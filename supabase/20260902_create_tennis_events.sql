-- 테니스 교류전(tennis): 화면에서 만든 교류전(선수·라운드·대진표)을 저장한다.
-- 코드에 든 한화 교류전(app/tennis/data.ts)은 처음 편집하는 순간 같은 id로 여기 저장되고, 그 뒤로는 이 표의 내용을 쓴다.
-- 점수는 tennis_scores(event_id = 이 표의 id 문자열)에 따로 저장된다.
-- 로그인 없이 링크로 공유하는 방 공유형 서비스라 anon permissive 정책을 둔다.
--
-- 적용: Supabase 대시보드 > SQL Editor에서 실행. (20260902_create_tennis_scores.sql과 순서 무관)

create table if not exists tennis_events (
  -- 화면에서 만든 교류전은 uuid 문자열, 코드에 든 교류전(예: hanwha-2026-09-19)은 그 id 그대로 저장한다
  id text primary key default gen_random_uuid()::text,
  title text not null,
  date text not null,            -- YYYY-MM-DD
  start_time text not null,      -- HH:mm
  place text not null default '',
  courts integer not null default 2 check (courts between 1 and 2),
  minutes_per_match integer not null default 45 check (minutes_per_match between 10 and 180),
  after_note text not null default '',
  players jsonb not null default '[]'::jsonb,   -- [{name, gender, years}]
  rounds jsonb not null default '[]'::jsonb,    -- [{no, label, time}]
  matches jsonb not null default '[]'::jsonb,   -- [{no, type, teamA, teamB, round?, court?}] 배열 순서 = 진행 순서
  rules jsonb not null default '{}'::jsonb,     -- 대진표 규칙 {balanced, noRepeatPair, maxRest, balancedYears, noBackToBack, teamMatch}
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table tennis_events enable row level security;

drop policy if exists "tennis_events anon all" on tennis_events;
create policy "tennis_events anon all"
  on tennis_events for all
  using (true) with check (true);
