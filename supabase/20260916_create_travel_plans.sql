-- 여행 플랜(travel): 화면에서 만든 여행 일정(날짜별 동선·후보 장소)을 저장한다.
-- 주소에 그대로 쓰는 공개 식별자 id("<slug>-<short_code>")만 알면 누구나 같이 고칠 수 있는 방 공유형 서비스라
-- anon permissive 정책을 둔다. (실제 통제는 "링크를 아는 사람만"이라는 전제)
--
-- days 는 날짜 하나당 한 칸인 배열이라 통째로 덮어쓰면 두 사람이 동시에 고칠 때 서로를 지운다.
-- 그래서 하루만 바꾸는 travel_plans_set_day 함수를 따로 둔다.
--
-- 적용: Supabase 대시보드 > SQL Editor에서 실행.

create table if not exists travel_plans (
  id text primary key,                 -- "<slug>-<short_code>" 주소에 그대로 쓰는 공개 식별자
  slug text not null,
  short_code text not null,
  title text not null,
  start_date text not null,            -- YYYY-MM-DD
  end_date text not null,
  region text not null default 'KR',   -- 구글 장소/길찾기 regionCode. 언어는 항상 ko
  days jsonb not null default '[]'::jsonb,
  pool jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists travel_plans_short_code_key on travel_plans (short_code);
create index if not exists travel_plans_slug_idx on travel_plans (slug);

alter table travel_plans enable row level security;

drop policy if exists "travel_plans anon all" on travel_plans;
create policy "travel_plans anon all" on travel_plans for all using (true) with check (true);

-- 하루치(days[p_index])만 바꾸고 나머지 날은 손대지 않는다.
create or replace function travel_plans_set_day(p_id text, p_index int, p_day jsonb)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare v_days jsonb;
begin
  update travel_plans set days = jsonb_set(days, array[p_index::text], p_day, true), updated_at = now()
   where id = p_id returning days into v_days;
  if v_days is null then raise exception 'NOT_FOUND'; end if;
  return v_days;
end; $$;

grant execute on function travel_plans_set_day(text, int, jsonb) to anon, authenticated;
