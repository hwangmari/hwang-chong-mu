-- 경조사비 장부: 관계 세부(relation_detail) 추가.
-- "회사"만으로는 현 직장·전 직장·거래처가 섞이므로 자유 입력 세부 항목을 둔다. 비워도 된다.
-- 적용: Supabase 대시보드 > SQL Editor에서 실행. (20260901_create_gift_log.sql 이후)

alter table gift_log_entries
  add column if not exists relation_detail text not null default '';

-- 목록: relationDetail 포함
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
        'personName', g.person_name,
        'relation', g.relation,
        'relationDetail', g.relation_detail,
        'amount', g.amount,
        'memo', g.memo,
        'createdAt', to_char(g.created_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      )
      order by g.date desc, g.created_at desc
    ),
    '[]'::jsonb
  )
  from gift_log_entries g
  where g.user_id = p_user_id;
$$;

-- 저장: 인자가 늘어나므로 예전 시그니처는 지우고 새로 만든다
drop function if exists gift_log_upsert(uuid, uuid, date, text, text, text, text, integer, text);

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
begin
  if v_name = '' then
    raise exception 'INVALID_PERSON';
  end if;
  if coalesce(p_amount, 0) <= 0 then
    raise exception 'INVALID_AMOUNT';
  end if;

  if p_id is null then
    insert into gift_log_entries
      (user_id, date, event_type, direction, person_name, relation, relation_detail, amount, memo)
    values
      (p_user_id, p_date, p_event_type, p_direction, v_name,
       coalesce(p_relation, 'etc'), v_detail, p_amount, coalesce(p_memo, ''));
  else
    update gift_log_entries
       set date            = p_date,
           event_type      = p_event_type,
           direction       = p_direction,
           person_name     = v_name,
           relation        = coalesce(p_relation, 'etc'),
           relation_detail = v_detail,
           amount          = p_amount,
           memo            = coalesce(p_memo, ''),
           updated_at      = now()
     where id = p_id
       and user_id = p_user_id;

    if not found then
      raise exception 'NOT_FOUND';
    end if;
  end if;

  return gift_log_list(p_user_id);
end;
$$;

grant execute on function gift_log_upsert(uuid, uuid, date, text, text, text, text, text, integer, text) to anon, authenticated;
