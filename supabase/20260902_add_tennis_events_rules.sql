-- 테니스 교류전: 대진표 규칙(rules) 저장 칸 추가.
-- 만들 때 켠 규칙(전원 고른 출전·짝 중복 없음·연속 휴식 제한·구력 균형·연속 출전 없음·팀 대항)을 배지로 보여주기 위해 저장한다.
-- 20260902_create_tennis_events.sql을 이미 실행한 경우에만 필요 (새로 실행하면 이미 포함돼 있음).
-- 적용: Supabase 대시보드 > SQL Editor에서 실행.

alter table tennis_events
  add column if not exists rules jsonb not null default '{}'::jsonb;
