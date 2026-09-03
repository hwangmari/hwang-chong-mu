-- =============================================
-- ⚠️ 맨 마지막에 실행하는 "잠금" 파일입니다. 지금 바로 실행하지 마세요.
-- =============================================
--
-- 실행해도 되는 시점
--   1) supabase/20260904_hash_workout_room_password.sql 실행 완료
--   2) supabase/20260905_hash_game_participant_password.sql 실행 완료
--   3) 새 코드가 실제 서비스에 배포됨
--   4) 아래가 모두 잘 되는 것을 눈으로 확인함
--        · /workout 에서 방 만들기 / 방 들어가기
--        · /inbody 진입 (운동방 로그인 정보를 그대로 씀)
--        · /game 에서 방 만들기 → 다른 사람 참가 → 깍두기 추가
--          → 참가자 목록 실시간 갱신 → 방장이 참가자 내보내기
--          → 게임 시작(점수 초기화) → 광클 대전 점수 오름 → 텔레파시 선택
--        · /account 에서 운동 연결 등록·해제
--   → 이 4개가 다 확인된 다음에 이 파일을 실행합니다.
--
-- 이 파일은 "되돌리기 어려운" 작업입니다.
--   컬럼을 지우면 그 안에 있던 평문 비밀번호는 복구되지 않습니다.
--   (암호화된 password_hash 는 그대로 남으므로 로그인에는 지장이 없습니다.)
--   실행 전 Supabase 대시보드에서 백업/스냅샷을 한 번 떠두시길 권합니다.
--
-- ⚠️ 반드시 파일 전체를 한 번에 붙여넣고 한 번에 실행하세요.
--    Supabase SQL Editor 는 이걸 한 덩어리(트랜잭션)로 처리하므로,
--    중간에 실패하면 아무것도 바뀌지 않은 상태로 되돌아갑니다.
--    한 줄씩 나눠 실행하면 "컬럼은 지웠는데 함수는 아직 옛날 것"인 상태가 생겨
--    방 만들기·참가가 잠깐 멈출 수 있습니다.
--
-- 이 파일이 하는 일
--   1) workout_rooms 를 브라우저에서 아예 못 보게 막는다
--   2) workout_rooms.password 평문 컬럼 삭제
--   3) game_participants.password 평문 컬럼 삭제
--   4) game_participants 를 브라우저가 마음대로 못 고치게 막는다
--   5) 평문 컬럼을 쓰던 함수 4개를 평문 없이 다시 만든다
--        workout_room_create / workout_room_login / game_join / game_add_guest
--      (함수 이름과 인자는 그대로라서 화면 코드는 하나도 안 고쳐도 된다)
--   6) 계정에 저장돼 있던 운동방 비밀번호를 지운다
--
-- 적용: Supabase 대시보드 > SQL Editor 에 이 파일 전체를 붙여넣고 실행.

-- ---------------------------------------------
-- 1) 운동방 표를 브라우저에서 못 읽게 막기
--    정책 이름은 app/workout/supabase-schema.sql 의 이름 그대로다.
--    이 정책이 사라지면 RLS가 켜져 있는 상태라 anon/authenticated 는 어떤 행도 볼 수 없다.
--    SECURITY DEFINER 함수(workout_room_create / workout_room_login)는 표의 주인 권한으로
--    돌기 때문에 영향을 받지 않는다.
-- ---------------------------------------------
drop policy if exists "workout_rooms anon all" on public.workout_rooms;

revoke select on public.workout_rooms from anon, authenticated;

-- ---------------------------------------------
-- 2) 운동방 평문 비밀번호 컬럼 삭제
--    이 시점에는 password_hash 만 있으면 로그인이 된다.
-- ---------------------------------------------
alter table public.workout_rooms
  drop column if exists password;

-- ---------------------------------------------
-- 3) 게임 참가자 평문 비밀번호 컬럼 삭제
-- ---------------------------------------------
alter table public.game_participants
  drop column if exists password;

-- ---------------------------------------------
-- 4) 게임 참가자 표를 브라우저가 마음대로 못 고치게 막기
--
--    지금까지는 브라우저가 이 표를 통째로 고칠 수 있었다.
--    그래서 마음만 먹으면 남의 비밀번호(password_hash)를 바꿔치기하거나
--    자기를 방장(is_host)으로 만들 수 있었다.
--
--    이제 브라우저가 직접 고칠 수 있는 건 게임 진행에 필요한 두 칸뿐이다.
--      · score           (광클 대전 점수 — app/game/components/ClickerGame.tsx)
--      · selected_answer (텔레파시 선택 — app/game/components/TelepathyGame.tsx,
--                         게임 시작 시 초기화 — hooks/useGameRoom.ts)
--    코드 전체를 확인한 결과 game_participants 를 고치는 곳은 위 세 군데뿐이고,
--    모두 이 두 칸만 건드린다. 참가·깍두기·내보내기는 서버 함수로 옮겼다.
--
--    ⚠️ select 권한은 절대 회수하지 않는다.
--       hooks/useGameRoom.ts 의 Realtime 구독이 game_participants 변경을
--       실시간으로 받아보는데, 그 테이블을 읽을 권한이 있어야 이벤트가 흘러온다.
--       select 권한을 뺏으면 참가자가 들어와도 화면이 갱신되지 않는다.
--       비밀번호 컬럼이 사라졌으므로 목록을 통째로 받아가도 새어나갈 비밀이 없다.
-- ---------------------------------------------
revoke insert, update, delete on public.game_participants from anon, authenticated;

grant update (score, selected_answer) on public.game_participants to anon, authenticated;

-- ---------------------------------------------
-- 5-1) 운동방 만들기 — 평문 저장을 뺀 최종본
-- ---------------------------------------------
create or replace function public.workout_room_create(
  p_name text,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_name text := trim(coalesce(p_name, ''));
  v_password text := trim(coalesce(p_password, ''));
  v_row public.workout_rooms%rowtype;
begin
  if v_name = '' or v_password = '' then
    raise exception 'INVALID_INPUT';
  end if;

  insert into public.workout_rooms (name, password_hash)
  values (
    v_name,
    crypt(v_password, gen_salt('bf', 12))
  )
  returning * into v_row;

  return jsonb_build_object(
    'roomId', v_row.id,
    'roomName', v_row.name
  );
end;
$$;

-- ---------------------------------------------
-- 5-2) 운동방 들어가기 — 평문 예비 통로를 뺀 최종본
--      넘어가는 동안 쓰던 "평문으로 한 번 더 확인" 은 여기서 사라진다.
--      이 시점에는 모든 방이 password_hash 를 갖고 있어야 한다.
--      (혹시 남았는지 확인: select count(*) from workout_rooms where password_hash is null;)
-- ---------------------------------------------
create or replace function public.workout_room_login(
  p_name text,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_name text := trim(coalesce(p_name, ''));
  v_password text := trim(coalesce(p_password, ''));
  v_row public.workout_rooms%rowtype;
begin
  if v_name = '' or v_password = '' then
    raise exception 'INVALID_INPUT';
  end if;

  select *
    into v_row
    from public.workout_rooms r
   where r.name = v_name
     and r.password_hash is not null
     and r.password_hash = crypt(v_password, r.password_hash)
   order by r.created_at asc
   limit 1;

  if v_row.id is null then
    raise exception 'INVALID_ROOM';
  end if;

  return jsonb_build_object(
    'roomId', v_row.id,
    'roomName', v_row.name
  );
end;
$$;

-- ---------------------------------------------
-- 5-3) 게임 참가 — 평문 저장과 평문 예비 통로를 뺀 최종본
--      (혹시 남았는지 확인: select count(*) from game_participants where password_hash is null;)
-- ---------------------------------------------
create or replace function public.game_join(
  p_room_id uuid,
  p_nickname text,
  p_password text,
  p_message text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_nickname text := trim(coalesce(p_nickname, ''));
  v_password text := coalesce(p_password, '');
  v_message text := coalesce(p_message, '');
  v_hash text;
  v_row public.game_participants%rowtype;
  v_is_first boolean;
begin
  if p_room_id is null or v_nickname = '' or v_password = '' then
    raise exception 'INVALID_INPUT';
  end if;

  perform 1 from public.game_rooms r where r.id = p_room_id for update;
  if not found then
    raise exception 'INVALID_ROOM';
  end if;

  select *
    into v_row
    from public.game_participants p
   where p.room_id = p_room_id
     and p.nickname = v_nickname
   order by p.joined_at asc
   limit 1;

  if v_row.id is not null then
    if v_row.password_hash is null
       or v_row.password_hash <> crypt(v_password, v_row.password_hash) then
      raise exception 'WRONG_PASSWORD';
    end if;
    return public.game_participant_public(v_row);
  end if;

  select not exists (
    select 1 from public.game_participants p where p.room_id = p_room_id
  ) into v_is_first;

  v_hash := crypt(v_password, gen_salt('bf', 12));

  -- "한 방에 방장 한 명" 은 부분 유니크 인덱스(game_participants_one_host_uidx)가 보증한다.
  -- 방장으로 넣다가 걸리면 이미 방장이 있다는 뜻이므로 일반 참가자로 다시 넣는다.
  begin
    insert into public.game_participants (
      room_id, nickname, password_hash, message, is_host
    )
    values (
      p_room_id, v_nickname, v_hash, v_message, v_is_first
    )
    returning * into v_row;
  exception
    when unique_violation then
      if not v_is_first then
        raise exception 'DUPLICATE_NICKNAME';
      end if;
      insert into public.game_participants (
        room_id, nickname, password_hash, message, is_host
      )
      values (
        p_room_id, v_nickname, v_hash, v_message, false
      )
      returning * into v_row;
  end;

  return public.game_participant_public(v_row);
end;
$$;

-- ---------------------------------------------
-- 5-4) 깍두기 추가 — 평문 저장을 뺀 최종본
-- ---------------------------------------------
create or replace function public.game_add_guest(
  p_room_id uuid,
  p_nickname text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_nickname text := trim(coalesce(p_nickname, ''));
  v_secret text := encode(gen_random_bytes(24), 'hex');
  v_row public.game_participants%rowtype;
  v_is_first boolean;
begin
  if p_room_id is null or v_nickname = '' then
    raise exception 'INVALID_INPUT';
  end if;

  perform 1 from public.game_rooms r where r.id = p_room_id for update;
  if not found then
    raise exception 'INVALID_ROOM';
  end if;

  if exists (
    select 1 from public.game_participants p
     where p.room_id = p_room_id and p.nickname = v_nickname
  ) then
    raise exception 'DUPLICATE_NICKNAME';
  end if;

  select not exists (
    select 1 from public.game_participants p where p.room_id = p_room_id
  ) into v_is_first;

  insert into public.game_participants (
    room_id, nickname, password_hash, message, is_host
  )
  values (
    p_room_id,
    v_nickname,
    crypt(v_secret, gen_salt('bf', 12)),
    '깍두기 🎲',
    v_is_first
  )
  returning * into v_row;

  return public.game_participant_public(v_row);
exception
  -- 같은 순간에 같은 이름이 들어온 경우(유니크 인덱스가 잡아준다)
  when unique_violation then
    raise exception 'DUPLICATE_NICKNAME';
end;
$$;

-- 다시 만든 함수들의 실행 권한을 한 번 더 확인해 준다.
grant execute on function public.workout_room_create(text, text) to anon, authenticated;
grant execute on function public.workout_room_login(text, text) to anon, authenticated;
grant execute on function public.game_join(uuid, text, text, text) to anon, authenticated;
grant execute on function public.game_add_guest(uuid, text) to anon, authenticated;

-- ---------------------------------------------
-- 6) 계정에 저장돼 있던 운동방 비밀번호 지우기
--    통합 계정의 "연결" 정보(hwang_user_links.resource_ref) 안에
--    운동방 비밀번호가 그대로 들어가 있었다. 그 키만 빼낸다.
--    roomId / roomName 은 그대로 남으므로 자동 진입은 계속 동작한다.
-- ---------------------------------------------
update hwang_user_links
   set resource_ref = resource_ref - 'password'
 where service = 'workout'
   and resource_ref ? 'password';

-- ---------------------------------------------
-- 확인용 (실행 후 아래를 돌려보면 평문 컬럼이 사라졌는지 볼 수 있다)
-- ---------------------------------------------
-- select table_name, column_name
--   from information_schema.columns
--  where table_schema = 'public'
--    and table_name in ('workout_rooms', 'game_participants')
--  order by table_name, ordinal_position;
--
-- 브라우저에게 남은 권한 확인
-- select grantee, privilege_type, column_name
--   from information_schema.column_privileges
--  where table_schema = 'public'
--    and table_name = 'game_participants'
--    and grantee in ('anon', 'authenticated')
--  order by grantee, privilege_type;
