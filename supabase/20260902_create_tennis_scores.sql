-- 테니스 교류전(tennis): 경기별 게임 스코어를 저장한다.
-- 대진표(선수·라운드·경기)는 코드(app/tennis/data.ts)에 있고, 여기엔 점수만 쌓인다.
-- 로그인 없이 링크로 공유하는 방 공유형 서비스라 anon permissive 정책을 둔다
-- (장소잡기·인바디와 같은 철학: 링크를 아는 사람만 접근한다는 전제).
--
-- 적용: Supabase 대시보드 > SQL Editor에서 실행.

create table if not exists tennis_scores (
  event_id text not null,
  match_no integer not null check (match_no > 0),
  score_a integer not null default 0 check (score_a >= 0),
  score_b integer not null default 0 check (score_b >= 0),
  finished_at timestamptz not null default now(), -- 처음 점수를 넣은 시각 = 경기 끝난 시각 (수정해도 안 바뀜)
  updated_at timestamptz not null default now(),
  primary key (event_id, match_no)
);

alter table tennis_scores enable row level security;

drop policy if exists "tennis_scores anon all" on tennis_scores;
create policy "tennis_scores anon all"
  on tennis_scores for all
  using (true) with check (true);
