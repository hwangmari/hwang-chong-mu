-- 메일 발송 없는 비밀번호 복구.
-- 닉네임 + 가입 때 등록한 이메일이 일치하면 즉시 새 비밀번호로 교체한다.
-- (개인 앱 수준: 이메일은 비밀이 아니므로 닉네임+이메일을 아는 사람은 재설정 가능 — 수용된 트레이드오프)
--
-- 적용: 이 파일 내용을 Supabase 대시보드 > SQL Editor에 붙여넣고 실행.

create extension if not exists pgcrypto;

create or replace function hwang_reset_by_email(
  p_nickname text,
  p_email text,
  p_new_password text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_key text := lower(trim(p_nickname));
  v_email text := lower(trim(p_email));
  v_id uuid;
begin
  if char_length(p_new_password) < 4 then
    raise exception 'INVALID_PASSWORD';
  end if;

  select id into v_id
  from hwang_users
  where nickname_key = v_key and email is not null and email = v_email
  limit 1;

  if not found then
    return false; -- 닉네임+이메일 불일치
  end if;

  update hwang_users
  set password_hash = crypt(p_new_password, gen_salt('bf'))
  where id = v_id;

  return true;
end;
$$;

grant execute on function hwang_reset_by_email(text, text, text) to anon, authenticated;
