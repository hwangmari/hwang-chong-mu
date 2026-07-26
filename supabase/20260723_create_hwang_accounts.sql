-- 황총무 통합 계정 (닉네임 + 비밀번호)
-- 패턴: 20260212_create_secure_daily_tables.sql (pgcrypto + RLS + revoke + SECURITY DEFINER + grant)
-- 비밀번호는 DB 내부에서 crypt()로 해시/검증하며, 해시가 DB 밖으로 나가지 않는다.

create extension if not exists pgcrypto;

create table if not exists hwang_users (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  nickname_key text not null unique, -- 소문자·trim 정규화 키 (대소문자 무시 유니크)
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_hwang_users_updated_at on hwang_users;
create trigger trg_hwang_users_updated_at
before update on hwang_users
for each row execute procedure set_updated_at();

alter table hwang_users enable row level security;
revoke all on hwang_users from anon, authenticated;

-- 회원가입: 닉네임 중복(대소문자 무시) 시 예외, 성공 시 {id, nickname}
create or replace function hwang_signup(p_nickname text, p_password text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_nickname text := trim(p_nickname);
  v_key text := lower(trim(p_nickname));
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

  insert into hwang_users (nickname, nickname_key, password_hash)
  values (v_nickname, v_key, crypt(p_password, gen_salt('bf')))
  returning id into v_id;

  return jsonb_build_object('id', v_id, 'nickname', v_nickname);
end;
$$;

-- 로그인: 성공 시 {id, nickname}, 실패 시 null (닉네임 존재 여부를 구분해 노출하지 않음)
create or replace function hwang_login(p_nickname text, p_password text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_key text := lower(trim(p_nickname));
  v_row hwang_users%rowtype;
begin
  select * into v_row from hwang_users where nickname_key = v_key limit 1;
  if not found then
    return null;
  end if;
  if v_row.password_hash <> crypt(p_password, v_row.password_hash) then
    return null;
  end if;
  return jsonb_build_object('id', v_row.id, 'nickname', v_row.nickname);
end;
$$;

-- 세션 유저 조회 (헤더/me용) — 비번 정보 없음
create or replace function hwang_get_user(p_user_id uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object('id', u.id, 'nickname', u.nickname)
  from hwang_users u
  where u.id = p_user_id;
$$;

grant execute on function hwang_signup(text, text) to anon, authenticated;
grant execute on function hwang_login(text, text) to anon, authenticated;
grant execute on function hwang_get_user(uuid) to anon, authenticated;
