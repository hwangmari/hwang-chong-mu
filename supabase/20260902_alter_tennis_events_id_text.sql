-- 테니스 교류전: tennis_events.id를 uuid → text로 바꾼다.
-- 코드에 든 교류전(예: hanwha-2026-09-19)을 편집하면 같은 id로 이 표에 저장하기 위해서다.
-- 20260902_create_tennis_events.sql을 이미 실행한 경우에만 필요 (새로 실행하면 이미 text).
-- 적용: Supabase 대시보드 > SQL Editor에서 실행.

alter table tennis_events
  alter column id drop default,
  alter column id type text using id::text,
  alter column id set default gen_random_uuid()::text;
