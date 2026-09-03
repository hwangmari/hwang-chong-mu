-- =============================================
-- 게임방 참가자(game_participants) 비밀번호를 "암호화된 형태"로 저장하도록 바꾼다.
-- =============================================
--
-- 지금 무엇이 문제인가
--   게임방은 참가자 한 명 한 명이 자기 비밀번호를 가진다.
--   그런데 그 비밀번호가 글자 그대로 표에 들어 있고,
--   게임방 화면은 참가자 목록을 `select *` 로 통째로 받아온다.
--   즉 같은 방에 들어온 사람의 브라우저에 "모두의 비밀번호"가 그대로 내려간다.
--   비밀번호 확인도 브라우저에서 `existing.password === 입력값` 으로 한다.
--
-- 이 파일이 하는 일 (표를 지우거나 컬럼을 없애지 않는다 — 더하기만 한다)
--   1) 암호화 도구(pgcrypto) 준비
--   2) game_participants 에 password_hash 컬럼 추가 (없을 때만)
--   3) 기존 비밀번호를 암호화해서 password_hash 에 채워 넣기
--   4) 표에 규칙 두 개 새기기 (한 방에 같은 닉네임 한 명 / 방장 한 명)
--   5) 서버 함수(RPC) 네 개 추가
--        - game_join(방, 닉네임, 비밀번호, 한마디)  … 참가 또는 재입장
--        - game_add_guest(방, 닉네임)               … 깍두기 추가
--        - game_list_participants(방)               … 비밀 없는 참가자 목록
--        - game_kick(방, 내보낼사람, 방장)          … 방장만 참가자 내보내기
--      모두 SECURITY DEFINER 라서 브라우저가 비밀번호 컬럼을 볼 필요가 없다.
--      반환값에는 password / password_hash 가 절대 들어가지 않는다.
--
-- 주의: 게임방 표(game_rooms, game_participants)를 만드는 DDL은 이 저장소에 없다.
--       실제 운영 DB에만 있어서, 아래 함수들은 코드가 실제로 쓰는 컬럼 이름만 사용한다.
--         game_participants: id, room_id, nickname, password, message, is_host,
--                            score, selected_answer, joined_at
--       (출처: hooks/useGameRoom.ts, app/game/page.tsx, app/game/components/*)
--       혹시 컬럼 이름이 다르면 이 파일 실행 시 에러가 나므로, 그때 이름만 고치면 된다.
--
-- 이번 단계에서는 평문 password 컬럼을 "일부러 남겨둔다"
--   아직 새 코드를 못 받은 옛날 화면(예전에 열어둔 탭)이 password 컬럼을 그대로 쓰기 때문이다.
--   그래서 game_join 은 password_hash 와 함께 평문 password 도 같이 저장한다.
--   (컬럼이 not null 일 수도 있어서 값이 반드시 필요하기도 하다.)
--
-- 실행 순서
--   supabase/20260904_hash_workout_room_password.sql → 이 파일 → 코드 배포
--   → 화면이 잘 되는 걸 확인한 다음에야 supabase/20260905_lock_room_password_columns.sql
--
-- 나중에 실행할 잠금 파일(20260905_lock_room_password_columns.sql)이 할 일
--   - game_participants.password 컬럼 삭제
--   - 평문 컬럼을 쓰던 game_join / game_add_guest 를 평문 없이 다시 만들기
--   - game_participants 의 insert/update/delete 권한 회수
--     (점수·선택지 두 컬럼만 update 를 열어둔다)
--   - (game_participants 의 select 권한은 그대로 둔다 — Realtime 구독이 쓰기 때문)
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
alter table public.game_participants
  add column if not exists password_hash text;

-- ---------------------------------------------
-- 3) 기존 비밀번호 암호화해서 채우기
-- ---------------------------------------------
update public.game_participants
   set password_hash = crypt(password, gen_salt('bf', 12))
 where password_hash is null
   and password is not null;

-- ---------------------------------------------
-- 3-2) 표 자체에 규칙 두 개 새기기
--
--      규칙 1. 한 방에 같은 닉네임은 한 명뿐
--        지금 코드는 "이미 있는 이름인가"를 브라우저에서만 확인해서,
--        두 사람이 같은 순간에 같은 이름으로 들어오면 둘 다 들어와 버린다.
--
--      규칙 2. 한 방에 방장은 한 명뿐
--        is_host 가 true 인 줄만 골라서 방 하나당 하나만 허용한다(부분 인덱스).
--        방장이 없는 방은 이 규칙에 걸리지 않는다.
--
--      이미 겹쳐 있는 데이터가 있으면 규칙을 새길 수 없다.
--      그래서 먼저 세어보고, 겹치는 게 없을 때만 만든다.
--      겹치면 몇 건인지 안내만 남기고 그냥 넘어간다(파일 실행은 실패하지 않는다).
--      → 안내가 보이면 그 방들을 정리한 뒤 이 파일을 다시 실행하면 규칙이 붙는다.
-- ---------------------------------------------
do $$
declare
  v_dupe_nick integer;
  v_dupe_host integer;
begin
  -- 규칙 1 : 방 + 닉네임 중복 확인
  select count(*) into v_dupe_nick
    from (
      select p.room_id, p.nickname
        from public.game_participants p
       group by p.room_id, p.nickname
      having count(*) > 1
    ) d;

  if v_dupe_nick > 0 then
    raise notice
      '같은 방에 같은 닉네임인 경우가 %건 있어 닉네임 중복 방지 규칙을 걸지 않았습니다. 정리한 뒤 이 파일을 다시 실행하세요.',
      v_dupe_nick;
    -- 규칙을 못 걸었으니 조회 속도를 위한 보통 인덱스만이라도 만들어 둔다.
    create index if not exists game_participants_room_nickname_idx
      on public.game_participants (room_id, nickname);
  else
    create unique index if not exists game_participants_room_nick_uidx
      on public.game_participants (room_id, nickname);
  end if;

  -- 규칙 2 : 한 방에 방장이 두 명 이상인 경우 확인
  select count(*) into v_dupe_host
    from (
      select p.room_id
        from public.game_participants p
       where p.is_host
       group by p.room_id
      having count(*) > 1
    ) d;

  if v_dupe_host > 0 then
    raise notice
      '방장이 두 명 이상인 방이 %개 있어 방장 중복 방지 규칙을 걸지 않았습니다. 정리한 뒤 이 파일을 다시 실행하세요.',
      v_dupe_host;
  else
    create unique index if not exists game_participants_one_host_uidx
      on public.game_participants (room_id) where is_host;
  end if;
end;
$$;

-- ---------------------------------------------
-- 공통: 참가자 한 줄을 "비밀 없는 형태"로 바꾸는 도우미
--       화면(app/game/types.ts GameParticipant)이 쓰는 필드만 담는다.
-- ---------------------------------------------
create or replace function public.game_participant_public(
  p_row public.game_participants
)
returns jsonb
language sql
immutable
set search_path = public
as $$
  select jsonb_build_object(
    'id', p_row.id,
    'room_id', p_row.room_id,
    'nickname', p_row.nickname,
    'is_host', p_row.is_host,
    'message', p_row.message,
    'score', p_row.score,
    'selected_answer', p_row.selected_answer,
    'joined_at', p_row.joined_at
  );
$$;

-- ---------------------------------------------
-- 4-1) 참가 또는 재입장
--      · 방에 같은 닉네임이 이미 있으면 → 비밀번호를 서버에서 대조하고,
--        맞으면 그 참가자를 돌려준다. 틀리면 WRONG_PASSWORD 를 던진다.
--      · 없으면 새로 넣는다. 이때 방에 아무도 없었다면 그 사람이 방장이 된다.
--        (지금 app/game/page.tsx 가 방을 만든 직후 is_host: true 로 넣는 것과 같은 결과)
--
--      두 사람이 같은 순간에 들어와도 안전하도록 방(game_rooms) 한 줄을 먼저 잠근다.
--      이 잠금이 없으면 "방에 아무도 없네" 를 둘이 동시에 보고 방장이 두 명이 될 수 있다.
--
--      ⚠️ 넘어가는 동안의 빈틈 메우기
--      새 코드가 배포되기 전까지는 옛날 화면이 평문 password 만 채워 참가자를 넣을 수 있다.
--      그런 참가자는 암호화된 값이 비어 있어 영영 재입장을 못 하게 된다.
--      그래서 password_hash 가 비어 있으면 평문으로 한 번 더 확인하고,
--      맞았으면 그 자리에서 password_hash 를 채워 넣는다(자동 이사).
--      이 예비 통로는 잠금 파일에서 사라진다.
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

  -- 이 방에 대한 참가 처리를 한 번에 한 명씩만 하도록 방 줄을 잠근다.
  perform 1 from public.game_rooms r where r.id = p_room_id for update;
  if not found then
    raise exception 'INVALID_ROOM';
  end if;

  -- 이미 있는 닉네임인가?
  select *
    into v_row
    from public.game_participants p
   where p.room_id = p_room_id
     and p.nickname = v_nickname
   order by p.joined_at asc
   limit 1;

  if v_row.id is not null then
    if v_row.password_hash is not null then
      if v_row.password_hash <> crypt(v_password, v_row.password_hash) then
        raise exception 'WRONG_PASSWORD';
      end if;
    elsif v_row.password is not null and v_row.password = v_password then
      -- 아직 암호화 전인 참가자 → 지금 암호화해서 채워 넣는다
      update public.game_participants
         set password_hash = crypt(v_password, gen_salt('bf', 12))
       where id = v_row.id
         and password_hash is null;
    else
      raise exception 'WRONG_PASSWORD';
    end if;
    return public.game_participant_public(v_row);
  end if;

  -- 방에 아무도 없으면 이 사람이 방장
  select not exists (
    select 1 from public.game_participants p where p.room_id = p_room_id
  ) into v_is_first;

  -- 비밀번호 암호화는 한 번만 계산한다(느린 작업이라 재입장 때는 하지 않는다).
  v_hash := crypt(v_password, gen_salt('bf', 12));

  -- "한 방에 방장 한 명" 은 결국 부분 유니크 인덱스(game_participants_one_host_uidx)가 보증한다.
  -- 위 잠금은 이 함수끼리만 막아주고, 아직 새 코드를 못 받은 옛날 화면은
  -- 표에 직접 is_host: true 를 넣을 수 있기 때문이다.
  -- 방장으로 넣다가 인덱스에 걸리면 "이미 방장이 있다"는 뜻이므로 일반 참가자로 다시 넣는다.
  begin
    insert into public.game_participants (
      room_id, nickname, password, password_hash, message, is_host
    )
    values (
      p_room_id,
      v_nickname,
      -- 이번 단계 한정: 옛날 화면 호환을 위해 평문도 같이 저장한다.
      -- 잠금 파일(20260905_lock_room_password_columns.sql)에서 이 컬럼은 사라진다.
      v_password,
      v_hash,
      v_message,
      v_is_first
    )
    returning * into v_row;
  exception
    when unique_violation then
      -- 방장 자리를 노린 게 아니었다면 닉네임이 겹친 것이다. 그대로 알린다.
      if not v_is_first then
        raise exception 'DUPLICATE_NICKNAME';
      end if;
      insert into public.game_participants (
        room_id, nickname, password, password_hash, message, is_host
      )
      values (
        p_room_id, v_nickname, v_password, v_hash, v_message, false
      )
      returning * into v_row;
  end;

  return public.game_participant_public(v_row);
end;
$$;

-- ---------------------------------------------
-- 4-2) 깍두기(게스트) 추가
--      방장이 사람 없이 이름만 하나 더 넣는 기능이다.
--      비밀번호는 아무도 모르는 임의의 값으로 넣는다. 이 이름으로는 로그인할 수 없다.
--      (지금은 'guest' 라는 뻔한 값이라 아무나 그 이름을 가로챌 수 있었다.)
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

  -- 참가 처리와 같은 잠금을 쓴다(같은 순간에 두 명이 들어오는 경우 대비)
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
    room_id, nickname, password, password_hash, message, is_host
  )
  values (
    p_room_id,
    v_nickname,
    -- 평문 컬럼에도 같은 임의값을 넣는다(이번 단계 한정).
    -- 옛날 화면과 새 화면 모두 "깍두기는 로그인 불가"로 동작이 같아진다.
    v_secret,
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

-- ---------------------------------------------
-- 4-3) 참가자 목록 (비밀 없는 컬럼만)
-- ---------------------------------------------
create or replace function public.game_list_participants(
  p_room_id uuid
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (
      select jsonb_agg(public.game_participant_public(p) order by p.joined_at asc)
        from public.game_participants p
       where p.room_id = p_room_id
    ),
    '[]'::jsonb
  );
$$;

-- ---------------------------------------------
-- 4-4) 참가자 내보내기 (방장만)
--      지금은 브라우저가 game_participants 를 직접 delete 한다.
--      그래서 방장이 아닌 사람도 아무나 지울 수 있었다.
--      이제 "부탁한 사람이 정말 그 방의 방장인지"를 서버가 확인한다.
--      p_host_id 는 방장 본인의 참가자 id (브라우저 localStorage 의 my_id).
--      방장은 서로를 내보낼 수 없다(지금 화면에서도 방장에게는 삭제 버튼이 안 보인다).
-- ---------------------------------------------
create or replace function public.game_kick(
  p_room_id uuid,
  p_participant_id uuid,
  p_host_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  if p_room_id is null or p_participant_id is null or p_host_id is null then
    raise exception 'INVALID_INPUT';
  end if;

  if not exists (
    select 1 from public.game_participants p
     where p.id = p_host_id
       and p.room_id = p_room_id
       and p.is_host is true
  ) then
    raise exception 'NOT_HOST';
  end if;

  if exists (
    select 1 from public.game_participants p
     where p.id = p_participant_id
       and p.room_id = p_room_id
       and p.is_host is true
  ) then
    raise exception 'CANNOT_KICK_HOST';
  end if;

  delete from public.game_participants p
   where p.id = p_participant_id
     and p.room_id = p_room_id;

  get diagnostics v_deleted = row_count;

  return jsonb_build_object('deleted', v_deleted);
end;
$$;

-- ---------------------------------------------
-- 5) 실행 권한
-- ---------------------------------------------
-- 이 헬퍼는 SECURITY DEFINER 함수 내부에서만 호출된다.
-- 주의: Postgres는 함수 생성 시 PUBLIC에 기본 실행권을 부여하므로 public까지 revoke해야 실제로 차단된다.
revoke execute on function public.game_participant_public(public.game_participants) from public, anon, authenticated;
grant execute on function public.game_join(uuid, text, text, text) to anon, authenticated;
grant execute on function public.game_add_guest(uuid, text) to anon, authenticated;
grant execute on function public.game_list_participants(uuid) to anon, authenticated;
grant execute on function public.game_kick(uuid, uuid, uuid) to anon, authenticated;
