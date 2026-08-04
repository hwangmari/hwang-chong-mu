-- 통합 계정 서비스 연결에 "약속잡기(meeting)"와 "엔빵 계산기(calc)"를 추가한다.
-- hwang_user_links.service 체크 제약을 확장.
--
-- 적용: Supabase 대시보드 > SQL Editor에서 실행.

alter table hwang_user_links
  drop constraint if exists hwang_user_links_service_check;

alter table hwang_user_links
  add constraint hwang_user_links_service_check
  check (
    service in (
      'account-book', 'workout', 'habit', 'diet', 'schedule', 'meeting', 'calc'
    )
  );
