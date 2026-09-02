-- 경조사비 장부: "냈음(답례 완료)" 표시(returned) 추가.
-- 받은 축의금에 대해 나도 냈는지를, 낸 금액을 따로 기록하지 않아도 체크만으로 남길 수 있게 한다.
-- 적용: Supabase 대시보드 > SQL Editor에서 실행. (20260901_add_gift_log_relation_detail.sql 이후)

alter table gift_log_entries
  add column if not exists returned boolean not null default false;

-- 목록: returned 포함
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

-- "냈음" 표시만 바꾸는 가벼운 함수 (여러 건을 한 번에) → 목록 반환
create or replace function gift_log_set_returned(
  p_user_id uuid,
  p_ids uuid[],
  p_returned boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  update gift_log_entries
     set returned   = coalesce(p_returned, false),
         updated_at = now()
   where user_id = p_user_id
     and id = any(p_ids);

  return gift_log_list(p_user_id);
end;
$$;

grant execute on function gift_log_set_returned(uuid, uuid[], boolean) to anon, authenticated;
