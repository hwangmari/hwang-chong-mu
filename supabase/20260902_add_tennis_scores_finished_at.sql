-- 테니스 교류전: 경기 끝난 시각(finished_at) 추가.
-- 점수를 처음 저장한 시각을 기록해, 먼저 끝난 코트가 있으면 남은 경기의 예상 시각을 다시 계산한다.
-- 20260902_create_tennis_scores.sql을 이미 실행한 경우에만 필요 (새로 실행하면 이미 포함돼 있음).
-- 적용: Supabase 대시보드 > SQL Editor에서 실행.

alter table tennis_scores
  add column if not exists finished_at timestamptz not null default now();
