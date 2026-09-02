-- 테니스: 팀 토너먼트(더블 엘리미네이션) 지원.
-- tennis_events에 kind·teams·config를 더하고, tennis_scores에 코트 C·D 허용과 타이브레이크 점수 칸을 더한다.
-- 두 표를 이미 만든 경우에만 필요 (새로 실행하면 create 파일에 이미 포함돼 있음).
-- 적용: Supabase 대시보드 > SQL Editor에서 실행.

alter table tennis_events
  add column if not exists kind text not null default 'exchange',
  add column if not exists teams jsonb not null default '[]'::jsonb,
  add column if not exists config jsonb not null default '{}'::jsonb;

-- 코트 4면 허용 (기존 제약은 자동 생성 이름이라 찾아서 지운다)
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'tennis_events'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%courts%'
  loop
    execute format('alter table tennis_events drop constraint %I', c.conname);
  end loop;
end $$;
alter table tennis_events add constraint tennis_events_courts_check check (courts between 1 and 4);

alter table tennis_events drop constraint if exists tennis_events_kind_check;
alter table tennis_events add constraint tennis_events_kind_check check (kind in ('exchange', 'tournament'));

alter table tennis_scores
  add column if not exists tiebreak_a integer check (tiebreak_a >= 0),
  add column if not exists tiebreak_b integer check (tiebreak_b >= 0);

-- 코트 C·D 허용 (기존 제약 이름은 자동 생성이라 찾아서 지운다)
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'tennis_scores'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%court%'
  loop
    execute format('alter table tennis_scores drop constraint %I', c.conname);
  end loop;
end $$;
alter table tennis_scores add constraint tennis_scores_court_check check (court in ('A', 'B', 'C', 'D'));
