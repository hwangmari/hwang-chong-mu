-- 테니스 교류전: 경기 진행 기록(실제 코트·시작 시각·종료 시각) 추가.
-- "지금 시작"을 누르면 started_at·court만 있는 행(진행 중)이 생기고, 점수를 저장하면 finished_at이 붙는다(완료).
-- 20260902_create_tennis_scores.sql을 이미 실행한 경우에만 필요 (새로 실행하면 이미 포함돼 있음).
-- (이전의 add_tennis_scores_finished_at.sql은 이 파일로 대체됨 — 이미 실행했어도 이 파일을 그대로 실행하면 된다)
-- 적용: Supabase 대시보드 > SQL Editor에서 실행.

alter table tennis_scores
  add column if not exists court text check (court in ('A', 'B')),
  add column if not exists started_at timestamptz,
  add column if not exists finished_at timestamptz;

-- finished_at은 "완료된 경기"에만 있어야 하므로 기본값·not null을 없앤다
alter table tennis_scores alter column finished_at drop default;
alter table tennis_scores alter column finished_at drop not null;
