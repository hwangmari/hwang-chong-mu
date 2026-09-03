-- 경조사비 장부: 민감한 자유 입력 3칸(상대방 이름·관계 세부·메모)을 표에 암호문으로도 같이 저장한다.
-- 왜: Supabase 표 편집기를 열면 "누가 얼마" 가 그대로 읽힌다. 사람 이름과 메모만이라도 가려둔다.
-- 날짜·금액·경조사 종류·주고받음·관계·냈음 표시는 그대로 둔다(통계·정렬에 쓰이고 그 자체로는 덜 민감).
--
-- 이 단계에서는 "원문과 암호문을 둘 다" 저장한다(이중 쓰기).
--   → 예전 코드가 돌아도 깨지지 않고, 문제가 생기면 즉시 되돌릴 수 있다.
--   → 원문을 실제로 지우는 것은 며칠 뒤 20260907_gift_log_null_plaintext.sql 에서 한다.
--
-- 검색은 브라우저(app/gift-log/aggregate.ts)에서 하므로 DB 검색용 색인은 필요 없다.
--
-- 적용: Supabase 대시보드 > SQL Editor에서 실행.
--       (20260906_create_hwang_crypto.sql 이후, 그 전에 Vault 열쇠 생성이 끝나 있어야 한다)

-- 1) 암호문을 담을 칸 3개 추가
alter table gift_log_entries
  add column if not exists person_name_enc bytea;

alter table gift_log_entries
  add column if not exists relation_detail_enc bytea;

alter table gift_log_entries
  add column if not exists memo_enc bytea;

-- 2) 목록: 암호문이 있으면 풀어서 주고, 없으면(예전 기록) 원문을 그대로 준다.
--    바깥으로 나가는 모양(키 이름·순서)은 이전과 완전히 같다.
create or replace function gift_log_list(p_user_id uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', g.id,
        'date', to_char(g.date, 'YYYY-MM-DD'),
        'eventType', g.event_type,
        'direction', g.direction,
        'personName', coalesce(hwang_dec(g.person_name_enc), g.person_name),
        'relation', g.relation,
        'relationDetail', coalesce(hwang_dec(g.relation_detail_enc), g.relation_detail, ''),
        'amount', g.amount,
        'memo', coalesce(hwang_dec(g.memo_enc), g.memo, ''),
        'returned', g.returned,
        'createdAt', to_char(g.created_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      )
      order by g.date desc, g.created_at desc
    ),
    '[]'::jsonb
  )
  from gift_log_entries g
  where g.user_id = p_user_id;
$$;

-- 3) 저장: 원문과 암호문을 함께 쓴다(이중 쓰기). 인자·반환값은 이전과 동일.
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
       v_name, hwang_enc(v_name),
       coalesce(p_relation, 'etc'), v_detail, hwang_enc(v_detail),
       p_amount, v_memo, hwang_enc(v_memo));
  else
    update gift_log_entries
       set date                = p_date,
           event_type          = p_event_type,
           direction           = p_direction,
           person_name         = v_name,
           person_name_enc     = hwang_enc(v_name),
           relation            = coalesce(p_relation, 'etc'),
           relation_detail     = v_detail,
           relation_detail_enc = hwang_enc(v_detail),
           amount              = p_amount,
           memo                = v_memo,
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

-- 4) 이미 쌓여 있는 기록을 암호문으로 채운다(원문은 건드리지 않는다).
--    여러 번 실행해도 안전하다: 이미 채워진 줄은 건너뛴다.
do $$
begin
  update gift_log_entries
     set person_name_enc = hwang_enc(person_name)
   where person_name is not null
     and person_name_enc is null;

  update gift_log_entries
     set relation_detail_enc = hwang_enc(relation_detail)
   where relation_detail is not null
     and relation_detail_enc is null;

  update gift_log_entries
     set memo_enc = hwang_enc(memo)
   where memo is not null
     and memo_enc is null;
end;
$$;

-- 5) 이름 검색용 색인은 이제 쓸모가 없다(검색은 브라우저에서 한다).
--    원문을 지운 뒤에도 색인이 이름 조각을 들고 있으면 곤란하므로 여기서 없앤다.
drop index if exists idx_gift_log_user_person;

-- 권한은 이전과 같다(시그니처가 동일하므로 grant는 유지되지만, 재실행 안전하게 다시 준다).
grant execute on function gift_log_list(uuid) to anon, authenticated;
grant execute on function gift_log_upsert(uuid, uuid, date, text, text, text, text, text, integer, text) to anon, authenticated;
