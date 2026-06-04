-- 함수 search_path 고정
-- Supabase Security Advisor 경고 해결: "Function Search Path Mutable".
-- search_path가 고정돼 있지 않으면 호출자가 search_path를 조작해
-- 함수가 의도치 않은 객체를 참조하게 만들 수 있다(권한 상승 가능성).
-- 이 SQL을 Supabase 대시보드 > SQL Editor 에서 실행하세요.

-- updated_at 자동 갱신 트리거 함수들 — 본문이 now() 만 호출하므로 빈 search_path 안전.
alter function public.set_updated_at() set search_path = '';
alter function public.set_inbody_updated_at() set search_path = '';
alter function public.overtime_set_updated_at() set search_path = '';
alter function public.workout_touch_updated_at() set search_path = '';

-- event_trigger_fn 은 본문을 알 수 없어 보수적으로 public 으로 고정한다.
-- (public 객체를 정규화 없이 참조해도 깨지지 않으면서 경고는 해소됨)
alter function public.event_trigger_fn() set search_path = public;
