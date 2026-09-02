-- 테니스 교류전(tennis): 화면에서 만든 교류전(선수·라운드·대진표)을 저장한다.
-- 코드에 든 한화 교류전(app/tennis/data.ts)은 그대로 두고, 새로 만드는 교류전만 여기 쌓인다.
-- 점수는 tennis_scores(event_id = 이 표의 id 문자열)에 따로 저장된다.
-- 로그인 없이 링크로 공유하는 방 공유형 서비스라 anon permissive 정책을 둔다.
--
-- 적용: Supabase 대시보드 > SQL Editor에서 실행. (20260902_create_tennis_scores.sql과 순서 무관)

create table if not exists tennis_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date text not null,            -- YYYY-MM-DD
  start_time text not null,      -- HH:mm
  place text not null default '',
  courts integer not null default 2 check (courts between 1 and 2),
  minutes_per_match integer not null default 45 check (minutes_per_match between 10 and 180),
  after_note text not null default '',
  players jsonb not null default '[]'::jsonb,   -- [{name, gender, years}]
  rounds jsonb not null default '[]'::jsonb,    -- [{no, label, time}]
  matches jsonb not null default '[]'::jsonb,   -- [{no, round, court, type, teamA, teamB}]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table tennis_events enable row level security;

drop policy if exists "tennis_events anon all" on tennis_events;
create policy "tennis_events anon all"
  on tennis_events for all
  using (true) with check (true);
