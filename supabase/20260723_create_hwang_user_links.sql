-- 통합 계정 ↔ 각 서비스 리소스 연결.
-- 로그인 상태에서 각 서비스의 진입 정보(가계부 참여자·운동 방 등)를 계정에 연결해두면
-- AuthLinkBootstrap이 이를 각 서비스의 기존 localStorage 키로 미리 채워 자동 진입시킨다.

create table if not exists hwang_user_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references hwang_users(id) on delete cascade,
  service text not null check (
    service in ('account-book', 'workout', 'habit', 'diet', 'schedule')
  ),
  resource_ref jsonb not null default '{}'::jsonb,
  label text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, service)
);

drop trigger if exists trg_hwang_user_links_updated_at on hwang_user_links;
create trigger trg_hwang_user_links_updated_at
before update on hwang_user_links
for each row execute procedure set_updated_at();

alter table hwang_user_links enable row level security;
revoke all on hwang_user_links from anon, authenticated;

-- 내 연결 목록 (서버 라우트가 세션에서 확정한 user_id를 넘김)
create or replace function hwang_links_list(p_user_id uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', l.id,
          'service', l.service,
          'resourceRef', l.resource_ref,
          'label', l.label
        )
        order by l.service
      )
      from hwang_user_links l
      where l.user_id = p_user_id
    ),
    '[]'::jsonb
  );
$$;

-- 연결 등록/갱신 (서비스당 1개, 재등록 시 덮어씀)
create or replace function hwang_links_upsert(
  p_user_id uuid,
  p_service text,
  p_resource_ref jsonb,
  p_label text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  insert into hwang_user_links (user_id, service, resource_ref, label)
  values (p_user_id, p_service, coalesce(p_resource_ref, '{}'::jsonb), coalesce(p_label, ''))
  on conflict (user_id, service) do update
  set resource_ref = excluded.resource_ref,
      label = excluded.label,
      updated_at = now();
  return hwang_links_list(p_user_id);
end;
$$;

-- 연결 해제
create or replace function hwang_links_delete(p_user_id uuid, p_service text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from hwang_user_links where user_id = p_user_id and service = p_service;
  return hwang_links_list(p_user_id);
end;
$$;

grant execute on function hwang_links_list(uuid) to anon, authenticated;
grant execute on function hwang_links_upsert(uuid, text, jsonb, text) to anon, authenticated;
grant execute on function hwang_links_delete(uuid, text) to anon, authenticated;
