-- 테니스 교류전(tennis): 경기별 진행 기록(실제 코트·시작/종료 시각)과 게임 스코어를 저장한다.
-- 대진표(선수·경기 순서)는 코드(app/tennis/data.ts) 또는 tennis_events에 있고, 여기엔 진행 기록만 쌓인다.
-- "지금 시작" → started_at·court만 있는 행(진행 중). 점수 저장 → finished_at 기록(완료). 점수를 고쳐도 finished_at은 유지.
-- 로그인 없이 링크로 공유하는 방 공유형 서비스라 anon permissive 정책을 둔다
-- (장소잡기·인바디와 같은 철학: 링크를 아는 사람만 접근한다는 전제).
--
-- 적용: Supabase 대시보드 > SQL Editor에서 실행.

create table if not exists tennis_scores (
  event_id text not null,
  match_no integer not null check (match_no > 0),
  score_a integer not null default 0 check (score_a >= 0),
  score_b integer not null default 0 check (score_b >= 0),
  court text check (court in ('A', 'B')),   -- 실제로 뛴 코트
  started_at timestamptz,                    -- "지금 시작" 누른 시각
  finished_at timestamptz,                   -- 처음 점수를 넣은 시각 = 경기 끝난 시각
  updated_at timestamptz not null default now(),
  primary key (event_id, match_no)
);

alter table tennis_scores enable row level security;

drop policy if exists "tennis_scores anon all" on tennis_scores;
create policy "tennis_scores anon all"
  on tennis_scores for all
  using (true) with check (true);
