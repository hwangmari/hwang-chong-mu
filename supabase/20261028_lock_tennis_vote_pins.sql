-- 대회 투표 비번(tennis_vote_pins) 잠그기 — 2단계 (2026-10-28)
-- 먼저 할 것: 1단계(20261028_tennis_vote_pins_rpc.sql) 실행 + 함수를 부르는 화면 코드 배포.
-- 적용: Supabase 대시보드 > SQL Editor 에 이 파일 내용을 붙여 넣고 실행.
--
-- 표에 직접 읽기·쓰기·지우기하던 길("anon all")을 없앤다. RLS 는 켜진 채 정책이 없으니
-- 공개 키로는 아무것도 못 하고, tennis_pin_check / verify / reset 함수만 표를 다룬다.
--
-- 되돌리기(문제가 생기면): 아래 두 줄을 실행하면 예전처럼 열린다.
--   create policy "tennis_vote_pins anon all" on tennis_vote_pins for all using (true) with check (true);
--   grant select, insert, update, delete on tennis_vote_pins to anon, authenticated;

drop policy if exists "tennis_vote_pins anon all" on tennis_vote_pins;
revoke all on tennis_vote_pins from anon, authenticated;
