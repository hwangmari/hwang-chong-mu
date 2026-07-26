-- 황총무 통합 계정: 이메일 기반 비밀번호 재설정(복구) 추가
-- 이메일은 *인증 없음* — 가입 시 선택 입력이며, 오직 비밀번호 찾기에만 사용한다.
-- 재설정 토큰은 평문을 DB에 저장하지 않고 sha256 해시만 저장(1시간 만료·1회용).
--
-- 적용 방법: 이 파일 내용을 Supabase 대시보드 > SQL Editor에 붙여넣고 실행한다.
-- 주의: 기존 계정에는 email 컬럼이 비어 있으므로, 재설정 기능을 쓰려면
--       해당 계정을 재가입하거나(권장) DB에서 hwang_users.email을 수동으로 채워야 한다.

create extension if not exists pgcrypto;

-- 1) 이메일 컬럼 추가 (선택 입력, 인증 없음)
alter table hwang_users add column if not exists email text;

-- 2) 비밀번호 재설정 토큰 테이블 (평문 미저장, 해시만 저장)
create table if not exists hwang_password_resets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references hwang_users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_hwang_password_resets_token
  on hwang_password_resets(token_hash);

alter table hwang_password_resets enable row level security;
revoke all on hwang_password_resets from anon, authenticated;

-- 3) 회원가입: email(선택) 인자 추가 — 인자 수가 달라 오버로드가 생기므로 기존 2-arg 버전을 먼저 제거
drop function if exists hwang_signup(text, text);

create function hwang_signup(
  p_nickname text,
  p_password text,
  p_email text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_nickname text := trim(p_nickname);
  v_key text := lower(trim(p_nickname));
  v_email text := nullif(lower(trim(p_email)), '');
  v_id uuid;
begin
  if char_length(v_nickname) < 2 or char_length(v_nickname) > 20 then
    raise exception 'INVALID_NICKNAME';
  end if;
  if char_length(p_password) < 4 then
    raise exception 'INVALID_PASSWORD';
  end if;
  if exists (select 1 from hwang_users where nickname_key = v_key) then
    raise exception 'NICKNAME_TAKEN';
  end if;

  insert into hwang_users (nickname, nickname_key, password_hash, email)
  values (v_nickname, v_key, crypt(p_password, gen_salt('bf')), v_email)
  returning id into v_id;

  return jsonb_build_object('id', v_id, 'nickname', v_nickname);
end;
$$;

-- 4) 재설정 요청: 닉네임+이메일이 일치하는 계정에 새 토큰 해시를 저장.
--    존재 여부 노출 방지를 위해 매치 실패 시 예외 없이 false만 반환.
create or replace function hwang_request_reset(
  p_nickname text,
  p_email text,
  p_token_hash text,
  p_expires_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text := lower(trim(p_nickname));
  v_email text := lower(trim(p_email));
  v_id uuid;
begin
  select id into v_id
  from hwang_users
  where nickname_key = v_key and email is not null and email = v_email
  limit 1;

  if not found then
    return false;
  end if;

  -- 기존 미사용·미만료 리셋을 모두 무효화한 뒤 새 리셋 발급(항상 최신 1건만 유효)
  update hwang_password_resets
  set used_at = now()
  where user_id = v_id and used_at is null and expires_at > now();

  insert into hwang_password_resets (user_id, token_hash, expires_at)
  values (v_id, p_token_hash, p_expires_at);

  return true;
end;
$$;

-- 5) 재설정 확정: 유효한(미사용·미만료) 토큰 해시로 비밀번호 교체 후 토큰 소모(1회용)
create or replace function hwang_reset_password(
  p_token_hash text,
  p_new_password text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid;
  v_reset_id uuid;
begin
  if char_length(p_new_password) < 4 then
    raise exception 'INVALID_PASSWORD';
  end if;

  select id, user_id into v_reset_id, v_user_id
  from hwang_password_resets
  where token_hash = p_token_hash and used_at is null and expires_at > now()
  limit 1;

  if not found then
    return false;
  end if;

  update hwang_users
  set password_hash = crypt(p_new_password, gen_salt('bf'))
  where id = v_user_id;

  update hwang_password_resets
  set used_at = now()
  where id = v_reset_id;

  return true;
end;
$$;

grant execute on function hwang_signup(text, text, text) to anon, authenticated;
grant execute on function hwang_request_reset(text, text, text, timestamptz) to anon, authenticated;
grant execute on function hwang_reset_password(text, text) to anon, authenticated;
