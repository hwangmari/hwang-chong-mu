-- 경조사비 장부(gift-log): 축의금·부조금을 사람별로 기록한다.
-- 방(room) 모델이 아니라 통합 계정(hwang_users) 소유 데이터다.
-- 금액 + 인간관계라 민감도가 높아 표를 anon에서 완전히 잠그고
-- SECURITY DEFINER 함수로만 접근한다. user_id는 서버 라우트가 세션 쿠키로 확정한다.
-- 패턴: 20260804_create_hwang_user_rooms.sql (RLS + revoke + SECURITY DEFINER + grant, 변경 후 목록 반환)
--
-- 적용: Supabase 대시보드 > SQL Editor에서 실행.

create table if not exists gift_log_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references hwang_users(id) on delete cascade,
  date date not null,
  event_type text not null
    check (event_type in ('wedding', 'funeral', 'firstBirthday', 'birthday', 'etc')),
  direction text not null
    check (direction in ('given', 'received')),
  person_name text not null,
  relation text not null default 'etc'
    check (relation in ('company', 'friend', 'relative', 'school', 'neighbor', 'etc')),
  amount integer not null default 0 check (amount >= 0),
  memo text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 목록/요약: 계정 + 날짜 내림차순
create index if not exists idx_gift_log_user_date
  on gift_log_entries(user_id, date desc);

-- 사람 검색: 계정 + 이름
create index if not exists idx_gift_log_user_person
  on gift_log_entries(user_id, person_name);

alter table gift_log_entries enable row level security;
revoke all on gift_log_entries from anon, authenticated;

-- 내 경조사비 기록 전체 (날짜 내림차순 → 같은 날이면 최근 등록순)
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

-- 기록 저장. p_id가 null이면 새로 추가, 있으면 수정(내 기록만) → 목록 반환
create or replace function gift_log_upsert(
  p_user_id uuid,
  p_id uuid,
  p_date date,
  p_event_type text,
  p_direction text,
  p_person_name text,
  p_relation text,
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
begin
  if v_name = '' then
    raise exception 'INVALID_PERSON';
  end if;
  if coalesce(p_amount, 0) <= 0 then
    raise exception 'INVALID_AMOUNT';
  end if;

  if p_id is null then
    insert into gift_log_entries
      (user_id, date, event_type, direction, person_name, relation, amount, memo)
    values
      (p_user_id, p_date, p_event_type, p_direction, v_name,
       coalesce(p_relation, 'etc'), p_amount, coalesce(p_memo, ''));
  else
    update gift_log_entries
       set date        = p_date,
           event_type  = p_event_type,
           direction   = p_direction,
           person_name = v_name,
           relation    = coalesce(p_relation, 'etc'),
           amount      = p_amount,
           memo        = coalesce(p_memo, ''),
           updated_at  = now()
     where id = p_id
       and user_id = p_user_id;

    if not found then
      raise exception 'NOT_FOUND';
    end if;
  end if;

  return gift_log_list(p_user_id);
end;
$$;

-- 기록 삭제 (내 기록만) → 목록 반환
create or replace function gift_log_delete(p_user_id uuid, p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from gift_log_entries
   where id = p_id
     and user_id = p_user_id;

  return gift_log_list(p_user_id);
end;
$$;

grant execute on function gift_log_list(uuid) to anon, authenticated;
grant execute on function gift_log_upsert(uuid, uuid, date, text, text, text, text, integer, text) to anon, authenticated;
grant execute on function gift_log_delete(uuid, uuid) to anon, authenticated;
