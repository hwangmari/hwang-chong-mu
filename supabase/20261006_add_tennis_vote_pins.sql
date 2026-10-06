-- 대회 투표: 본인 확인용 4자리 비번.
-- 적용: Supabase 대시보드 > SQL Editor 에서 실행.
--
-- 왜 필요한가 — 이름만 고르면 남의 이름을 골라 그 사람이 무엇을 찍었는지 볼 수 있다.
-- 베스트드레서를 익명으로 두기로 한 약속이 깨진다. 그래서 사람마다 4자리 비번을 둔다.
-- 처음 투표할 때 넣은 비번이 그 사람 것이 되고, 다음부터는 같은 비번을 넣어야 열린다.
--
-- 비번 자체는 저장하지 않는다. 대회·이름·비번을 섞어 되돌릴 수 없게 만든 값(해시)만 넣는다.

create table if not exists tennis_vote_pins (
  event_id text not null references tennis_events(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  pin_hash text not null check (char_length(pin_hash) = 64),
  created_at timestamptz not null default now(),
  primary key (event_id, name)
);

alter table tennis_vote_pins enable row level security;

drop policy if exists "tennis_vote_pins anon all" on tennis_vote_pins;
create policy "tennis_vote_pins anon all"
  on tennis_vote_pins for all
  using (true) with check (true);
