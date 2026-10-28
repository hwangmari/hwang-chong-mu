-- 대회 투표 비번(tennis_vote_pins)을 함수로만 다루기 — 1단계: 함수 추가 (2026-10-28)
-- 적용: Supabase 대시보드 > SQL Editor 에 이 파일 내용을 붙여 넣고 실행. 여러 번 실행해도 안전하다.
--
-- 왜: 지금 표 규칙이 "anon all"이라 공개 키만 있으면 누구나 비번 기록을 읽고·쓰고·지울 수 있다.
--     남의 비번 기록을 지우고 그 이름(진행 요원 포함)으로 새 비번을 정하거나, 4자리 해시를 읽어 맞혀 볼 수 있다.
-- 어떻게: 화면은 아래 세 함수만 부른다. 함수는 표 주인 권한(security definer)으로 돌고,
--     2단계(20261028_lock_tennis_vote_pins.sql)에서 표에 직접 들어가는 길을 막는다.
-- 비번 해시는 지금처럼 화면에서 만든다(대회·이름·비번의 SHA-256) — 이미 등록된 비번이 그대로 맞는다.

-- 비번 확인. 이 이름으로 처음이면 넣은 해시를 그 사람 비번으로 정한다.
-- 돌려주는 값: 'created' 처음 정함 / 'ok' 맞음 / 'wrong' 다름
create or replace function tennis_pin_check(p_event text, p_name text, p_hash text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
begin
  if p_hash is null or char_length(p_hash) <> 64 then
    raise exception 'INVALID_HASH';
  end if;
  if p_name is null or char_length(p_name) not between 1 and 40 then
    raise exception 'INVALID_NAME';
  end if;

  select pin_hash into v_hash from tennis_vote_pins where event_id = p_event and name = p_name;
  if found then
    return case when v_hash = p_hash then 'ok' else 'wrong' end;
  end if;

  -- 두 기기에서 동시에 처음 넣으면 한쪽만 들어간다 — 그다음 다시 읽어 비교
  insert into tennis_vote_pins (event_id, name, pin_hash)
  values (p_event, p_name, p_hash)
  on conflict (event_id, name) do nothing;

  select pin_hash into v_hash from tennis_vote_pins where event_id = p_event and name = p_name;
  return case when v_hash = p_hash then 'created' else 'wrong' end;
end;
$$;

-- 비번이 맞는지만 본다(진행 요원 들어가기). 없으면 새로 만들지 않고 'none'.
create or replace function tennis_pin_verify(p_event text, p_name text, p_hash text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
begin
  select pin_hash into v_hash from tennis_vote_pins where event_id = p_event and name = p_name;
  if not found then
    return 'none';
  end if;
  return case when v_hash = p_hash then 'ok' else 'wrong' end;
end;
$$;

-- 진행 요원이 비번 잊은 참가자의 비번 기록을 지운다.
-- 진행 요원 이름이 그 대회 config.admins 에 있고 진행 요원 비번이 맞아야 한다. 진행 요원 이름은 지울 수 없다.
create or replace function tennis_pin_reset(
  p_event text,
  p_target text,
  p_staff text,
  p_staff_hash text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admins jsonb;
  v_hash text;
begin
  select config -> 'admins' into v_admins from tennis_events where id = p_event;
  if v_admins is null or jsonb_typeof(v_admins) <> 'array' or not (v_admins ? p_staff) then
    raise exception 'NOT_STAFF';
  end if;

  select pin_hash into v_hash from tennis_vote_pins where event_id = p_event and name = p_staff;
  if not found or v_hash <> p_staff_hash then
    raise exception 'NOT_STAFF';
  end if;

  if v_admins ? p_target then
    raise exception 'TARGET_IS_STAFF';
  end if;

  delete from tennis_vote_pins where event_id = p_event and name = p_target;
  return true;
end;
$$;

grant execute on function tennis_pin_check(text, text, text) to anon, authenticated;
grant execute on function tennis_pin_verify(text, text, text) to anon, authenticated;
grant execute on function tennis_pin_reset(text, text, text, text) to anon, authenticated;
