-- 베스트드레서를 남성부·여성부로 나누지 않고 하나로 합친다 (주인 결정 2026-10-06).
-- 한 사람이 세 명까지 고르고, 최다 득표 두 명이 수상한다.
-- 적용: Supabase 대시보드 > SQL Editor 에서 실행.
--
-- 고른 사람 여럿을 한 줄에 담는다(choice 에 "|" 로 이어 붙임).
-- 줄을 여러 개로 두면 "한 사람 한 표"를 지키는 유일 제약이 무너진다.

-- 남/여로 나뉘어 들어간 예전 표는 더 쓸 수 없다 (지금 0건)
delete from tennis_votes where kind in ('dresser_m', 'dresser_f');

alter table tennis_votes drop constraint if exists tennis_votes_kind_check;
alter table tennis_votes add constraint tennis_votes_kind_check
  check (kind in ('champion', 'dresser'));

-- 세 명이면 "황혜경|조현서|이선민" 처럼 길어진다
alter table tennis_votes drop constraint if exists tennis_votes_choice_check;
alter table tennis_votes add constraint tennis_votes_choice_check
  check (char_length(choice) between 1 and 120);
