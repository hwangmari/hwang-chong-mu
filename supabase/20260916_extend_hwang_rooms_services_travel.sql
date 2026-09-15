-- 통합 계정의 "내 방"에 담을 수 있는 서비스에 travel(여행 플랜)을 하나 더 늘린다.
-- 기존 7개: meeting, calc, place, tennis, game, overtime, daily
-- 추가: travel(여행 플랜)
--
-- 고치는 곳이 두 군데인데 반드시 같이 바꿔야 한다. 한쪽만 바꾸면
--   - 체크 제약만 늘리면: 함수가 먼저 막아서 INVALID_SERVICE 가 난다
--   - 함수만 늘리면: 함수는 통과하지만 표에 넣는 순간 체크 제약에 걸린다
-- 그래서 20260903 파일과 같은 방식으로 두 곳을 한 번에 다시 만든다.
--   1) hwang_user_rooms.service 의 허용 목록(체크 제약)을 8개로 교체
--   2) 서비스 이름을 검사하는 함수 hwang_rooms_add 를 같은 8개로 다시 만든다
-- 표(hwang_user_rooms)의 구조나 이미 저장된 방은 그대로 두고, 지우는 것도 없다.
--
-- room_id 에는 "주소에 그대로 드러나는 공개 식별자"만 넣는다.
-- 게임방 비밀번호나 일일 기록 접근 코드 같은 비밀은 절대 저장하지 않는다.
-- (그래서 잠긴 방에 다시 들어갈 때는 코드를 한 번 더 물어본다.)
--
-- 적용: Supabase 대시보드 > SQL Editor에서 이 파일 전체를 붙여넣고 실행.
--       먼저 supabase/20260903_extend_hwang_rooms_services.sql 이 실행돼 있어야 한다.

-- 1) 허용 서비스 목록 교체 (제약 이름은 표를 만들 때 자동으로 붙은 이름)
alter table hwang_user_rooms
  drop constraint if exists hwang_user_rooms_service_check;

alter table hwang_user_rooms
  add constraint hwang_user_rooms_service_check
  check (
    service in (
      'meeting',
      'calc',
      'place',
      'tennis',
      'game',
      'overtime',
      'daily',
      'travel'
    )
  );

-- 2) 방 등록 (같은 방이면 라벨만 갱신) → 목록 반환
--    20260903 파일과 같은 함수를 서비스 목록만 늘려 다시 만든다.
create or replace function hwang_rooms_add(
  p_user_id uuid,
  p_service text,
  p_room_id text,
  p_label text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_service not in (
    'meeting', 'calc', 'place', 'tennis', 'game', 'overtime', 'daily', 'travel'
  ) then
    raise exception 'INVALID_SERVICE';
  end if;
  if coalesce(trim(p_room_id), '') = '' then
    raise exception 'INVALID_ROOM';
  end if;

  insert into hwang_user_rooms (user_id, service, room_id, label)
  values (p_user_id, p_service, trim(p_room_id), coalesce(p_label, ''))
  on conflict (user_id, service, room_id)
  do update set label = excluded.label;

  return hwang_rooms_list(p_user_id);
end;
$$;

-- hwang_rooms_list / hwang_rooms_delete 는 서비스 이름을 검사하지 않아 그대로 둔다.
-- create or replace 로 다시 만들었으므로 실행 권한을 한 번 더 확인해 준다.
grant execute on function hwang_rooms_add(uuid, text, text, text) to anon, authenticated;
