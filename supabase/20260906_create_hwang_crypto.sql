-- 민감한 자유 입력 텍스트를 표에 "암호문"으로만 저장하기 위한 공용 암·복호화 함수.
-- 목적: Supabase 표 편집기(Table Editor)에서 사람 이름·메모 같은 글자가 그대로 보이지 않게 한다.
--       읽기는 기존 SECURITY DEFINER 함수(gift_log_list 등)가 대신 풀어서 내려준다.
--
-- ────────────────────────────────────────────────────────────────
-- ★ 이 파일을 실행하기 "전에" 딱 한 번, 아래 한 줄을 SQL Editor에서 먼저 실행하세요.
--   (암호를 푸는 열쇠를 Supabase Vault 금고에 만드는 작업입니다)
--
--   select vault.create_secret(encode(gen_random_bytes(32),'base64'), 'hwang_enc_key', '황총무 민감 텍스트 암호화 키');
--
-- ★ 그리고 만들어진 열쇠 값을 1password·구글 비밀번호 관리자 같은 곳에 따로 보관하세요.
--   열쇠를 잃어버리면 저장된 글자는 누구도(작성자 본인도) 되살릴 수 없습니다.
--   열쇠 값은 화면 캡처·채팅·커밋 어디에도 남기지 마세요.
--
--   ※ Vault(vault 스키마)는 Supabase 프로젝트에 기본 제공됩니다.
--     혹시 없다는 오류가 나면 Dashboard > Database > Extensions에서 supabase_vault를 켜세요.
-- ────────────────────────────────────────────────────────────────
--
-- 적용: Supabase 대시보드 > SQL Editor에서 실행. (Vault 열쇠 생성 이후)
-- 패턴: 20260212_create_secure_daily_tables.sql (pgcrypto pgp_sym_encrypt/decrypt)

create extension if not exists pgcrypto;

-- 글자 → 암호문(bytea). 열쇠는 Vault에서만 읽는다(코드·인자로 절대 넘기지 않는다).
-- null을 넣으면 null이 나온다(빈 칸은 빈 칸 그대로).
create or replace function hwang_enc(p_text text)
returns bytea
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_key text;
begin
  if p_text is null then
    return null;
  end if;

  select decrypted_secret into v_key
    from vault.decrypted_secrets
   where name = 'hwang_enc_key'
   limit 1;

  if v_key is null then
    raise exception 'ENC_KEY_MISSING';
  end if;

  return pgp_sym_encrypt(p_text, v_key, 'cipher-algo=aes256, s2k-count=1024');
end;
$$;

-- 암호문(bytea) → 글자. null을 넣으면 null이 나온다.
create or replace function hwang_dec(p_data bytea)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_key text;
begin
  if p_data is null then
    return null;
  end if;

  select decrypted_secret into v_key
    from vault.decrypted_secrets
   where name = 'hwang_enc_key'
   limit 1;

  if v_key is null then
    raise exception 'ENC_KEY_MISSING';
  end if;

  return pgp_sym_decrypt(p_data, v_key, 'cipher-algo=aes256, s2k-count=1024');
end;
$$;

-- 이 두 함수는 바깥(브라우저·anon 키)에서 직접 부를 수 없다.
-- 오직 다른 SECURITY DEFINER 함수(gift_log_list 등)가 내부에서만 호출한다.
revoke all on function hwang_enc(text) from public;
revoke all on function hwang_enc(text) from anon, authenticated;
revoke all on function hwang_dec(bytea) from public;
revoke all on function hwang_dec(bytea) from anon, authenticated;
