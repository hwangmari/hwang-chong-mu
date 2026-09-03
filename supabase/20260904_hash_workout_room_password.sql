-- =============================================
-- 운동방(workout_rooms) 비밀번호를 "암호화된 형태"로 저장하도록 바꾼다.
-- =============================================
--
-- 지금 무엇이 문제인가
--   운동방 표(workout_rooms)에는 비밀번호가 그냥 글자 그대로 들어 있다.
--   게다가 RLS 정책이 "누구나 다 볼 수 있음(using true)"이라서,
--   브라우저 키(anon key)만 있으면 누구나 모든 방의 비밀번호를 그대로 읽어갈 수 있다.
--   실제 로그인도 브라우저가 `where name = ? and password = ?` 로 직접 조회한다.
--
-- 이 파일이 하는 일 (표를 지우거나 컬럼을 없애지 않는다 — 더하기만 한다)
--   1) 암호화 도구(pgcrypto) 준비
--   2) workout_rooms 에 password_hash 컬럼 추가 (없을 때만)
--   3) 기존 비밀번호를 암호화해서 password_hash 에 채워 넣기
--   4) 방 만들기 / 방 들어가기를 서버 함수(RPC) 두 개로 옮기기
--        - workout_room_create(방이름, 비밀번호)
--        - workout_room_login(방이름, 비밀번호)
--      두 함수는 SECURITY DEFINER 라서 브라우저가 표를 직접 안 봐도 된다.
--      반환값에는 비밀번호가 절대 들어가지 않는다. {roomId, roomName} 만 준다.
--
-- 이번 단계에서는 평문 password 컬럼을 "일부러 남겨둔다"
--   아직 배포되지 않은 옛날 화면(예전에 열어둔 탭)이 password 컬럼을 그대로 쓰기 때문이다.
--   그래서 workout_room_create 는 password_hash 와 함께 평문 password 도 같이 저장한다.
--   (workout_rooms.password 가 not null 이라 값이 반드시 필요하기도 하다.)
--
-- 실행 순서
--   이 파일 → supabase/20260905_hash_game_participant_password.sql → 코드 배포
--   → 화면이 잘 되는 걸 확인한 다음에야 supabase/20260905_lock_room_password_columns.sql
--
-- 나중에 실행할 잠금 파일(20260905_lock_room_password_columns.sql)이 할 일
--   - "workout_rooms anon all" 정책 삭제
--   - anon/authenticated 의 workout_rooms select 권한 회수
--   - workout_rooms.password 컬럼 삭제
--   - game_participants.password 컬럼 삭제
--   - game_participants 의 insert/update/delete 권한 회수 (점수 컬럼만 열어둠)
--   - hwang_user_links 의 운동 연결에서 password 키 제거
--   - 위 컬럼을 지우기 전에, 평문 컬럼을 쓰던 함수 3개를 평문 없이 다시 만든다
--     (workout_room_create / game_join / game_add_guest)
--
-- 적용: Supabase 대시보드 > SQL Editor 에 이 파일 전체를 붙여넣고 실행.
--       여러 번 실행해도 안전하다(멱등).

-- ---------------------------------------------
-- 1) 암호화 도구 준비
-- ---------------------------------------------
create extension if not exists pgcrypto;

-- ---------------------------------------------
-- 2) password_hash 컬럼 추가
-- ---------------------------------------------
alter table public.workout_rooms
  add column if not exists password_hash text;

-- ---------------------------------------------
-- 3) 기존 비밀번호 암호화해서 채우기
--    bf(bcrypt) 12라운드. 이미 채워진 행은 건드리지 않는다.
-- ---------------------------------------------
update public.workout_rooms
   set password_hash = crypt(password, gen_salt('bf', 12))
 where password_hash is null
   and password is not null;

-- 이름으로 방을 찾는 조회가 잦으므로 인덱스를 하나 둔다.
create index if not exists workout_rooms_name_idx
  on public.workout_rooms (name);

-- ---------------------------------------------
-- 4-1) 방 만들기
--      기존 코드(app/workout/repository.ts createWorkoutRoom)는
--      `insert into workout_rooms (name, password)` 한 줄이 전부였고
--      방 이름 중복을 막는 제약이 표에 없다. 그래서 여기서도 중복을 막지 않는다.
--      (없던 제약을 지금 넣으면 이미 같은 이름으로 만들어진 방이 깨질 수 있다.)
--      → 같은 이름의 방이 여러 개면 로그인은 "비밀번호까지 맞는 가장 먼저 만들어진 방"으로 들어간다.
--        이건 지금과 똑같은 동작이다.
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

  insert into public.workout_rooms (name, password, password_hash)
  values (
    v_name,
    -- 이번 단계 한정: 옛날 화면 호환을 위해 평문도 같이 저장한다.
    -- 잠금 파일(20260905_lock_room_password_columns.sql)에서 이 컬럼은 사라진다.
    v_password,
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
-- 4-2) 방 들어가기 (비밀번호 확인)
--      비밀번호가 틀리거나 없는 방이면 INVALID_ROOM 을 던진다.
--      화면에서는 이걸 "방 이름 또는 비밀번호가 맞지 않아요." 로 바꿔 보여준다.
--
--      ⚠️ 넘어가는 동안의 빈틈 메우기
--      이 파일을 실행한 뒤 새 코드가 배포되기 전까지는, 아직 옛날 화면을 열어둔 사람이
--      평문 password 만 채워진 방을 새로 만들 수 있다(password_hash 가 비어 있는 방).
--      암호화된 값만 보면 그런 방은 영영 못 들어가게 된다.
--      그래서 password_hash 가 비어 있으면 평문으로 한 번 더 확인해 주고,
--      맞았으면 그 자리에서 password_hash 를 채워 넣는다(자동 이사).
--      이 예비 통로는 잠금 파일에서 사라진다.
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

  -- 1순위: 암호화된 비밀번호가 맞는 방
  select *
    into v_row
    from public.workout_rooms r
   where r.name = v_name
     and r.password_hash is not null
     and r.password_hash = crypt(v_password, r.password_hash)
   order by r.created_at asc
   limit 1;

  -- 2순위(넘어가는 동안만): 아직 암호화 전인 방을 평문으로 확인
  if v_row.id is null then
    select *
      into v_row
      from public.workout_rooms r
     where r.name = v_name
       and r.password_hash is null
       and r.password = v_password
     order by r.created_at asc
     limit 1;

    if v_row.id is not null then
      update public.workout_rooms
         set password_hash = crypt(v_password, gen_salt('bf', 12))
       where id = v_row.id
         and password_hash is null;
    end if;
  end if;

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
-- 5) 실행 권한
--    브라우저(anon)와 로그인 사용자(authenticated) 모두 이 두 함수를 부를 수 있어야 한다.
-- ---------------------------------------------
grant execute on function public.workout_room_create(text, text) to anon, authenticated;
grant execute on function public.workout_room_login(text, text) to anon, authenticated;
