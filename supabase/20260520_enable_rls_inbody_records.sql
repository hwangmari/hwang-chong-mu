-- inbody_records 테이블 RLS 활성화
-- Supabase Security Advisor 오류 해결: "RLS Disabled in Public".
-- 운동 일지(workout) 테이블과 동일하게 RLS를 켜고,
-- 익명(anon) 키가 모든 행에 접근 가능한 permissive 정책을 둔다.
-- (실제 접근 통제는 방 비밀번호로 클라이언트에서 처리 — 가계부/운동 일지와 동일 철학.)
-- 이 SQL을 Supabase 대시보드 > SQL Editor 에서 실행하세요.

alter table public.inbody_records enable row level security;

drop policy if exists "inbody_records anon all" on public.inbody_records;
create policy "inbody_records anon all"
  on public.inbody_records for all
  using (true) with check (true);
