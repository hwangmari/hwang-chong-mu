-- 테니스: 세 번째 방식 "일반 대회"(2인 복식 팀 · 풀리그/조별/토너먼트) 지원.
-- tennis_events.kind에 'general'을 허용하는 것이 전부다.
-- 팀·대진·설정은 이미 있는 teams / matches / config 칼럼에 담으므로 새 칼럼이 없다.
-- tennis_scores는 그대로 쓴다 (event_id + match_no로 점수를 잡는 구조가 그대로 맞음).
-- 적용: Supabase 대시보드 > SQL Editor에서 실행.

alter table tennis_events drop constraint if exists tennis_events_kind_check;
alter table tennis_events
  add constraint tennis_events_kind_check
  check (kind in ('exchange', 'tournament', 'general'));
