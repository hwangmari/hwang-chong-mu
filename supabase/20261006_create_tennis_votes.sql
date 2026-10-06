-- 테니스 대회 익명 투표: 베스트드레서(남성부·여성부)와 우승팀 토토.
-- 적용: Supabase 대시보드 > SQL Editor 에서 실행.
--
-- 익명이면서 중복을 막는 방법:
--   이름을 받지 않고, 폰(브라우저)마다 한 번 만들어 보관하는 임의 문자열(voter_key)만 받는다.
--   (event_id, kind, voter_key) 를 유일하게 묶어 두면 한 폰은 분야마다 한 표가 된다.
--   마음이 바뀌면 같은 줄을 덮어쓴다(upsert). 누가 찍었는지는 아무 데도 남지 않는다.

create table if not exists tennis_votes (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references tennis_events(id) on delete cascade,
  -- dresser_m: 베스트드레서 남성부 / dresser_f: 여성부 / champion: 우승팀 토토
  kind text not null check (kind in ('dresser_m', 'dresser_f', 'champion')),
  -- 폰마다 만든 임의 문자열. 사람을 알아내는 데 쓸 수 없다
  voter_key text not null check (char_length(voter_key) between 8 and 64),
  -- 베스트드레서는 선수 이름, 토토는 팀 시드 번호를 글자로
  choice text not null check (char_length(choice) between 1 and 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, kind, voter_key)
);

create index if not exists tennis_votes_event_kind_idx on tennis_votes (event_id, kind);

alter table tennis_votes enable row level security;

-- 다른 테니스 표와 같은 방식: 링크를 아는 사람이면 읽고 쓸 수 있다.
-- (점수 입력도 같은 수준이라 여기만 더 잠그면 앞뒤가 안 맞는다)
drop policy if exists "tennis_votes anon all" on tennis_votes;
create policy "tennis_votes anon all"
  on tennis_votes for all
  using (true) with check (true);
