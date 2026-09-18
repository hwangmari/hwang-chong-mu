-- 여행 플랜(travel)에 "여행 준비" 칸을 더한다: 비행 정보 · 준비물 · 살 거 · 여행 경비(계산기) 연결.
-- 날짜별 동선(days)과 달리 이 값들은 한 여행에 하나뿐이라 extras(jsonb) 한 칸에 모아 둔다.
--   { "packing": [...], "shopping": [...], "flights": [...], "calcRoomId": "seoul-ABC234" | null }
--
-- extras 를 통째로 덮어쓰면 두 사람이 동시에 고칠 때(한 명은 준비물, 한 명은 비행) 서로를 지운다.
-- 그래서 열쇠 하나만 바꾸는 travel_plans_set_extra 함수를 둔다. (days 의 travel_plans_set_day 와 같은 뜻)
--
-- 적용: Supabase 대시보드 > SQL Editor에서 실행.

alter table travel_plans add column if not exists extras jsonb not null default '{}'::jsonb;

-- extras 의 정해진 열쇠 하나(p_key)만 바꾸고 나머지는 손대지 않는다.
create or replace function travel_plans_set_extra(p_id text, p_key text, p_value jsonb)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare v jsonb;
begin
  -- 아는 열쇠만 받는다. 모르는 이름으로 부르면 화면이 못 읽는 값이 쌓인다.
  if p_key not in ('packing', 'shopping', 'flights', 'calcRoomId') then
    raise exception 'BAD_KEY';
  end if;

  update travel_plans
     set extras = jsonb_set(coalesce(extras, '{}'::jsonb), array[p_key], coalesce(p_value, 'null'::jsonb), true),
         updated_at = now()
   where id = p_id
  returning extras into v;

  if v is null then raise exception 'NOT_FOUND'; end if;
  return v;
end; $$;

grant execute on function travel_plans_set_extra(text, text, jsonb) to anon, authenticated;
