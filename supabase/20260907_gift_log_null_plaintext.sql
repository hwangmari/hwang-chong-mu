-- 경조사비 장부: 원문(그대로 읽히는 글자)을 지우고 암호문만 남긴다. ★ 되돌리기 어려운 작업 ★
--
-- ────────────────────────────────────────────────────────────────
-- ★ 이 파일은 "며칠 뒤"에 실행하세요. 지금 바로 실행하지 마세요.
--   순서: Vault 열쇠 만들기 → 20260906_create_hwang_crypto.sql
--         → 20260906_encrypt_gift_log.sql → (며칠 사용하며 확인) → 이 파일
--
-- ★ 실행 전 확인할 것
--   1. 장부 화면에서 이름·관계 세부·메모가 예전처럼 잘 보이는가?
--   2. 새 기록 추가·수정·삭제가 잘 되는가?
--   3. Dashboard > Database > Backups 에서 "방금 만든" 백업이 있는가? (필수)
--   4. Vault 열쇠 값을 비밀번호 관리자에 보관해 두었는가? (열쇠를 잃으면 영영 못 읽는다)
--
-- ★ 아래 확인용 조회를 먼저 돌려서 세 칸 모두 0이 나오는지 보세요.
--   0이 아니면 아직 암호문이 안 채워진 줄이 있다는 뜻이니, 이 파일을 실행하면 안 됩니다.
--   (20260906_encrypt_gift_log.sql 의 4)번 do 블록을 다시 실행하면 채워집니다)
--
--   select
--     count(*) filter (where person_name     is not null and person_name_enc     is null) as person_missing,
--     count(*) filter (where relation_detail is not null and relation_detail_enc is null) as detail_missing,
--     count(*) filter (where memo            is not null and memo_enc            is null) as memo_missing
--   from gift_log_entries;
-- ────────────────────────────────────────────────────────────────
--
-- 적용: Supabase 대시보드 > SQL Editor에서 실행.

-- 1) 원문 칸을 비울 수 있게 "반드시 값이 있어야 함" 제약을 푼다.
alter table gift_log_entries alter column person_name drop not null;
alter table gift_log_entries alter column relation_detail drop not null;
alter table gift_log_entries alter column memo drop not null;

-- 기본값 ''도 없앤다. 값을 안 적은 새 줄에 빈 문자열이 다시 들어오는 걸 막는다.
alter table gift_log_entries alter column relation_detail drop default;
alter table gift_log_entries alter column memo drop default;

-- 2) 저장: 이제부터는 암호문만 쓴다. 원문 칸에는 아무것도 넣지 않는다(null).
--    인자·반환값은 이전과 완전히 동일하다.
create or replace function gift_log_upsert(
  p_user_id uuid,
  p_id uuid,
  p_date date,
  p_event_type text,
  p_direction text,
  p_person_name text,
  p_relation text,
  p_relation_detail text,
  p_amount integer,
  p_memo text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := trim(coalesce(p_person_name, ''));
  v_detail text := trim(coalesce(p_relation_detail, ''));
  v_memo text := coalesce(p_memo, '');
begin
  if v_name = '' then
    raise exception 'INVALID_PERSON';
  end if;
  if coalesce(p_amount, 0) <= 0 then
    raise exception 'INVALID_AMOUNT';
  end if;

  if p_id is null then
    insert into gift_log_entries
      (user_id, date, event_type, direction,
       person_name, person_name_enc,
       relation, relation_detail, relation_detail_enc,
       amount, memo, memo_enc)
    values
      (p_user_id, p_date, p_event_type, p_direction,
       null, hwang_enc(v_name),
       coalesce(p_relation, 'etc'), null, hwang_enc(v_detail),
       p_amount, null, hwang_enc(v_memo));
  else
    update gift_log_entries
       set date                = p_date,
           event_type          = p_event_type,
           direction           = p_direction,
           person_name         = null,
           person_name_enc     = hwang_enc(v_name),
           relation            = coalesce(p_relation, 'etc'),
           relation_detail     = null,
           relation_detail_enc = hwang_enc(v_detail),
           amount              = p_amount,
           memo                = null,
           memo_enc            = hwang_enc(v_memo),
           updated_at          = now()
     where id = p_id
       and user_id = p_user_id;

    if not found then
      raise exception 'NOT_FOUND';
    end if;
  end if;

  return gift_log_list(p_user_id);
end;
$$;

-- 3) 안전장치 + 원문 지우기.
--    암호문이 하나라도 비어 있으면 ENC_BACKFILL_INCOMPLETE 로 멈추고 아무것도 지우지 않는다.
--    (do 블록 전체가 한 트랜잭션이라 예외가 나면 아래 update도 취소된다)
do $$
declare
  v_missing bigint;
begin
  select count(*) into v_missing
    from gift_log_entries
   where person_name is not null and person_name_enc is null;
  if v_missing > 0 then
    raise exception 'ENC_BACKFILL_INCOMPLETE';
  end if;

  select count(*) into v_missing
    from gift_log_entries
   where relation_detail is not null and relation_detail_enc is null;
  if v_missing > 0 then
    raise exception 'ENC_BACKFILL_INCOMPLETE';
  end if;

  select count(*) into v_missing
    from gift_log_entries
   where memo is not null and memo_enc is null;
  if v_missing > 0 then
    raise exception 'ENC_BACKFILL_INCOMPLETE';
  end if;

  update gift_log_entries
     set person_name     = null,
         relation_detail = null,
         memo            = null;
end;
$$;

-- 권한은 이전과 같다(시그니처 동일). 재실행 안전하게 다시 준다.
grant execute on function gift_log_upsert(uuid, uuid, date, text, text, text, text, text, integer, text) to anon, authenticated;
