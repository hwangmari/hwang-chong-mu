-- 가계부 데이터 전면 노출 차단 (심각도: 높음)
--
-- [무엇이 문제였나]
-- account_book_get_store() 는 인자도 WHERE 도 없이 anon(로그인 없이 누구나) 에게
-- 실행 권한이 열려 있었다. 그래서 사이트 주소만 아는 사람이 브라우저 콘솔에서
-- 이 함수 하나만 호출하면 다음이 전부 그대로 쏟아졌다.
--   - 모든 사용자의 이름과 "평문 비밀번호"
--   - 모든 가계부방의 이름과 "평문 비밀번호"
--   - 모든 사람의 모든 지출/수입 내역, 공유 링크, 월 메모
-- 게다가 화면의 비밀번호 잠금은 이렇게 받아온 평문 비밀번호를 브라우저에서
-- 문자열 비교하는 방식이라 사실상 잠금 역할을 하지 못했다.
--
-- [왜 "사용자 id" 만으로는 부족한가]
-- 처음에는 get_store(p_user_id) 로 범위만 좁혔는데, 사용자 id 는 로그인 화면용
-- 목록(account_book_list_users)에 그대로 실려 나가는 값이라 비밀이 아니다.
-- id 만 넘기면 되는 구조면 남의 id 를 넣어 남의 가계부를 그대로 볼 수 있다.
-- 그래서 "비밀번호를 맞힌 사람에게만 발급되는 임시 출입증(세션 토큰)"을 도입한다.
--
-- [이 파일이 하는 일]
-- 0) account_book_sessions          : 출입증 보관 테이블. RLS 켜고 anon/authenticated 접근 차단.
-- 1) account_book_list_users()      : 로그인 화면용 이름 목록. 비밀번호 없음.
-- 2) account_book_user_login()      : 비밀번호가 맞으면 출입증(token)을 발급. { ok, token }
-- 3) account_book_logout()          : 출입증 폐기.
-- 4) account_book_require_session() : 출입증 검사(내부용). 없거나 만료면 UNAUTHORIZED 에러.
-- 5) account_book_get_store(p_token): 출입증 주인이 볼 수 있는 범위만, 비밀번호 필드 없이.
-- 6) account_book_get_store()       : 기존 무인자 버전을 "빈 껍데기"로 교체.
--                                     → 이 SQL 실행 직후, 아직 새로고침하지 않은 옛 탭은
--                                       데이터가 비어 보인다. 새로고침하면 정상. (의도된 동작)
-- 7) account_book_workspace_unlock(): 방 비밀번호 확인. 출입증 + 그 방 멤버여야 한다.
-- 8) account_book_update_user_profile()      : 이름/비밀번호 수정. 출입증 필요.
-- 9) account_book_update_workspace_profile() : 방 이름/비밀번호 수정. 출입증 + 멤버여야 한다.
-- 10) account_book_set_workspace_settings()  : 예산·목표만 수정. 출입증 + 멤버여야 한다.
--
-- [범위 밖 — 남아 있는 위험]
-- - 비밀번호는 아직 평문으로 저장된다. 이 파일은 "밖으로 새는 것"만 막는다.
--   해시는 로그인/방참여 RPC 를 함께 고쳐야 해서 별도 작업으로 남겨 둔다.
-- - account_book_upsert_entry / delete_entry / toggle_share_link / upsert_monthly_memo /
--   upsert_user / delete_user / create_shared_room / join_shared_room /
--   add_shared_room_member / remove_shared_room_member / delete_shared_workspace 및
--   자산·주식 RPC 들은 이 저장소에 정의가 없어(라이브 DB 에만 존재) 건드리지 않았다.
--   이들은 아직 p_actor_user_id 를 그대로 믿는다. 다음 작업 대상.
--
-- [적용] 이 파일 전체를 Supabase SQL Editor 에 붙여넣고 실행. 여러 번 실행해도 안전하다.
--        실행 후 브라우저에서 가계부 페이지를 강력 새로고침(Cmd+Shift+R) 하고 다시 로그인.

-- 토큰 생성을 위한 확장(이미 깔려 있으면 아무 일도 하지 않는다)
create extension if not exists pgcrypto;

-- 이 파일의 예전 판이 만들었던 헬퍼(방 접근 검사)는 각 함수 안으로 옮겼다.
drop function if exists public.account_book_can_access_workspace(text, text);

-- ────────────────────────────────────────────────────────────────────────────
-- 0) 출입증(세션) 테이블
--    RLS 를 켜고 정책을 하나도 만들지 않는다 + anon/authenticated 권한을 회수한다.
--    → PostgREST 로는 이 표를 아예 읽고 쓸 수 없고, 아래 SECURITY DEFINER 함수만
--      (표 소유자 권한으로) 접근한다.
-- ────────────────────────────────────────────────────────────────────────────
-- ─────────────────────────────────────────────────────────────
-- 사전 보강) 이 스크립트가 참조하는 칸이 실제 표에 없으면 같은 정의로 추가한다.
--   (코드 저장소의 예전 SQL(20260714·20260720·20260724·20260805)이 실제 저장 공간에 적용되지
--    않은 경우가 있어 "column ... does not exist"로 멈추는 것을 막는다. 이미 있으면 아무 일도 안 한다.)
-- ─────────────────────────────────────────────────────────────
alter table account_book_workspaces
  add column if not exists monthly_budget integer;
alter table account_book_workspaces
  add column if not exists monthly_budgets jsonb not null default '{}'::jsonb;
alter table account_book_workspaces
  add column if not exists fixed_templates jsonb not null default '[]'::jsonb;
alter table account_book_workspaces
  add column if not exists asset_goal_map jsonb not null default '{}'::jsonb;
alter table account_book_workspaces
  add column if not exists annual_saving_goal integer;
alter table account_book_entries
  add column if not exists cash_receipt boolean;
alter table account_book_entries
  add column if not exists benefit_excluded boolean;

create table if not exists public.account_book_sessions (
  token text primary key,
  user_id text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists account_book_sessions_user_id_idx
  on public.account_book_sessions (user_id);

alter table public.account_book_sessions enable row level security;

revoke all on table public.account_book_sessions from anon;
revoke all on table public.account_book_sessions from authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- 1) 사용자 목록 (비밀번호 없음)
--    로그인 전 화면에서 "닉네임으로 로그인 / 중복 닉네임 확인 / 방 참여자 이름 표시"에 쓴다.
--    personalWorkspaceId 도 같이 준다. 방 id 는 그 자체로는 아무 것도 열지 못하고
--    (get_store·unlock 모두 출입증을 요구한다), 화면이 로그인 직후 갈 곳을 찾는 데 쓴다.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.account_book_list_users()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', u.id,
          'name', u.name,
          'personalWorkspaceId', u.personal_workspace_id
        )
        order by u.id
      )
      from account_book_users u
    ),
    '[]'::jsonb
  );
$function$;

grant execute on function public.account_book_list_users() to anon;
grant execute on function public.account_book_list_users() to authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- 2) 출입증 검사 (내부 전용)
--    없거나 만료됐으면 UNAUTHORIZED 에러를 던진다. 화면은 이 말을 보고
--    저장해 둔 출입증을 버리고 로그인 화면을 다시 띄운다.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.account_book_require_session(p_token text)
 RETURNS text
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id text;
begin
  select s.user_id
    into v_user_id
  from account_book_sessions s
  where s.token = nullif(trim(coalesce(p_token, '')), '')
    and s.expires_at > now();

  if v_user_id is null then
    raise exception 'UNAUTHORIZED';
  end if;

  return v_user_id;
end;
$function$;

-- 내부 헬퍼라 외부에 열지 않는다 (SECURITY DEFINER 함수 안에서는 소유자 권한으로 호출된다).
revoke all on function public.account_book_require_session(text) from public;
revoke all on function public.account_book_require_session(text) from anon;
revoke all on function public.account_book_require_session(text) from authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- 3) 로그인 — 비밀번호가 맞으면 출입증을 발급한다
--    반환: { "ok": true, "token": "..." }  또는  { "ok": false, "token": null }
--    (예전 boolean 버전은 시그니처가 같아서 먼저 지운다)
-- ────────────────────────────────────────────────────────────────────────────
drop function if exists public.account_book_user_login(text, text);

CREATE OR REPLACE FUNCTION public.account_book_user_login(
  p_user_id text,
  p_password text
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 -- gen_random_bytes(pgcrypto)는 설치 위치가 public 또는 extensions 라서 둘 다 넣어 둔다.
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_user_id text;
  v_token text;
begin
  select u.id
    into v_user_id
  from account_book_users u
  where u.id = nullif(trim(coalesce(p_user_id, '')), '')
    and trim(coalesce(u.password, '')) = nullif(trim(coalesce(p_password, '')), '');

  if v_user_id is null then
    return jsonb_build_object('ok', false, 'token', null);
  end if;

  -- 만료된 출입증은 이 참에 치운다.
  delete from account_book_sessions
   where expires_at <= now();

  v_token := encode(gen_random_bytes(32), 'hex');

  insert into account_book_sessions (token, user_id, expires_at)
  values (v_token, v_user_id, now() + interval '30 days');

  return jsonb_build_object('ok', true, 'token', v_token);
end;
$function$;

grant execute on function public.account_book_user_login(text, text) to anon;
grant execute on function public.account_book_user_login(text, text) to authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- 4) 로그아웃 — 출입증 폐기
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.account_book_logout(p_token text)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  delete from account_book_sessions
   where token = nullif(trim(coalesce(p_token, '')), '');
$function$;

grant execute on function public.account_book_logout(text) to anon;
grant execute on function public.account_book_logout(text) to authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- 5) store 만들기 (내부 전용)
--    반환 모양은 기존과 같고, password 키만 전부 사라진다.
--
--    workspaces  : 내가 주인이거나 멤버인 방만
--    entries     : 그 방들의 내역 + 그 방으로 "공유된" 원본 내역
--                  (공용방에 공유한 내역은 원본이 다른 사람 개인방에 있어서 필요)
--    shareLinks  : 출발지 또는 도착지가 내 방인 링크만
--    monthlyMemos: 내 방들의 월 메모만
--    users       : 전원(비밀번호 제외). 닉네임 로그인/중복 확인/참여자 이름 표시에 필요.
--
--    p_user_id 가 null 이면 users 만 있고 나머지는 빈 배열인 껍데기를 준다.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.account_book_build_store(p_user_id text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with me as (
    select nullif(trim(coalesce(p_user_id, '')), '') as uid
  ),
  ws as (
    select w.*
    from account_book_workspaces w
    cross join me
    where me.uid is not null
      and (
        w.owner_user_id = me.uid
        or me.uid = any (coalesce(w.member_ids, array[]::text[]))
      )
  ),
  shared_source_ids as (
    select distinct s.source_entry_id
    from account_book_share_links s
    where s.target_workspace_id in (select id from ws)
  ),
  ent as (
    select e.*
    from account_book_entries e
    where e.workspace_id in (select id from ws)
       or e.id in (select source_entry_id from shared_source_ids)
  ),
  lnk as (
    select s.*
    from account_book_share_links s
    where s.source_workspace_id in (select id from ws)
       or s.target_workspace_id in (select id from ws)
  ),
  memo as (
    select m.*
    from account_book_monthly_memos m
    where m.workspace_id in (select id from ws)
  )
  select jsonb_build_object(
    'version', 1,
    'users', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', u.id,
            'name', u.name,
            'personalWorkspaceId', u.personal_workspace_id
          )
          order by u.id
        )
        from account_book_users u
      ),
      '[]'::jsonb
    ),
    'workspaces', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', w.id,
            'name', w.name,
            'type', w.type,
            'annualSavingGoal', w.annual_saving_goal,
            'monthlyBudget', w.monthly_budget,
            'monthlyBudgets', coalesce(w.monthly_budgets, '{}'::jsonb),
            'fixedTemplates', coalesce(w.fixed_templates, '[]'::jsonb),
            'assetGoalMap', coalesce(w.asset_goal_map, '{}'::jsonb),
            'ownerUserId', w.owner_user_id,
            'memberIds', to_jsonb(w.member_ids),
            'inviteCode', w.invite_code
          )
          order by w.id
        )
        from ws w
      ),
      '[]'::jsonb
    ),
    'entries', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', e.id,
            'date', to_char(e.entry_date, 'YYYY-MM-DD'),
            'member', e.member,
            'workspaceId', e.workspace_id,
            'createdByUserId', e.created_by_user_id,
            'type', e.type,
            'category', e.category,
            'subCategory', e.sub_category,
            'merchant', e.merchant,
            'item', e.item,
            'amount', e.amount,
            'cardCompany', e.card_company,
            'payment', e.payment,
            'memo', e.memo,
            'rawText', e.raw_text,
            'cashReceipt', e.cash_receipt,
            'benefitExcluded', e.benefit_excluded
          )
          order by e.entry_date desc, e.amount desc, e.id desc
        )
        from ent e
      ),
      '[]'::jsonb
    ),
    'shareLinks', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', s.id,
            'sourceEntryId', s.source_entry_id,
            'sourceWorkspaceId', s.source_workspace_id,
            'targetWorkspaceId', s.target_workspace_id,
            'sharedByUserId', s.shared_by_user_id,
            'createdAt', to_char(s.created_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
          )
          order by s.created_at desc, s.id desc
        )
        from lnk s
      ),
      '[]'::jsonb
    ),
    'monthlyMemos', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', m.id,
            'workspaceId', m.workspace_id,
            'monthKey', m.month_key,
            'memo', m.memo,
            'updatedByUserId', m.updated_by_user_id,
            'updatedAt', to_char(m.updated_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
          )
          order by m.month_key desc, m.updated_at desc, m.id desc
        )
        from memo m
      ),
      '[]'::jsonb
    )
  );
$function$;

revoke all on function public.account_book_build_store(text) from public;
revoke all on function public.account_book_build_store(text) from anon;
revoke all on function public.account_book_build_store(text) from authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- 6) get_store — 출입증 버전
--    사용자 id 만 받던 버전은 id 가 비밀이 아니라서 통째로 지운다(다시 만들지 않는다).
--    - 출입증이 비어 있으면: 로그인 전 화면용 껍데기(users 만).
--    - 출입증이 있는데 틀리거나 만료면: UNAUTHORIZED.
-- ────────────────────────────────────────────────────────────────────────────
drop function if exists public.account_book_get_store(text);

CREATE OR REPLACE FUNCTION public.account_book_get_store(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id text;
begin
  if nullif(trim(coalesce(p_token, '')), '') is null then
    return account_book_build_store(null);
  end if;

  v_user_id := account_book_require_session(p_token);

  return account_book_build_store(v_user_id);
end;
$function$;

grant execute on function public.account_book_get_store(text) to anon;
grant execute on function public.account_book_get_store(text) to authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- 7) 기존 무인자 get_store 를 빈 껍데기로 교체 (여기가 실제 구멍이었다)
--    - 다른 mutation RPC 들이 마지막에 이 함수를 호출해 결과를 돌려주지만,
--      화면은 이제 그 반환값을 쓰지 않고 출입증 버전을 다시 호출해서 받아 간다.
--    - 이 SQL 실행 후 새로고침하지 않은 옛 탭은 잠시 빈 화면처럼 보인다. 정상이다.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.account_book_get_store()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select account_book_build_store(null);
$function$;

grant execute on function public.account_book_get_store() to anon;
grant execute on function public.account_book_get_store() to authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- 8) 가계부방 비밀번호 확인 — 맞다/틀리다만 알려준다
--    출입증이 있어야 하고, 그 방의 주인/참여자여야 한다.
--    (화면의 방 잠금 3곳: 가계부방 / 연간 상세 / 투자 포트폴리오)
-- ────────────────────────────────────────────────────────────────────────────
drop function if exists public.account_book_workspace_unlock(text, text);

CREATE OR REPLACE FUNCTION public.account_book_workspace_unlock(
  p_token text,
  p_workspace_id text,
  p_password text
)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id text := account_book_require_session(p_token);
  v_workspace account_book_workspaces%rowtype;
begin
  select *
    into v_workspace
  from account_book_workspaces
  where id = nullif(trim(coalesce(p_workspace_id, '')), '')
  limit 1;

  if not found then
    raise exception 'Workspace not found';
  end if;

  if v_workspace.owner_user_id is distinct from v_user_id
     and not (v_user_id = any (coalesce(v_workspace.member_ids, array[]::text[]))) then
    raise exception 'UNAUTHORIZED';
  end if;

  -- 빈 비밀번호를 넣으면 비교 결과가 null 이 되므로 coalesce 로 false 를 확실히 돌려준다.
  return coalesce(
    trim(coalesce(v_workspace.password, ''))
      = nullif(trim(coalesce(p_password, '')), ''),
    false
  );
end;
$function$;

grant execute on function public.account_book_workspace_unlock(text, text, text) to anon;
grant execute on function public.account_book_workspace_unlock(text, text, text) to authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- 9) 사용자 이름/비밀번호 수정
--    출입증이 필요하고, 고칠 수 있는 대상은 "나 자신" 또는 "나와 같은 공용방에 있는 사람"뿐이다.
--    (설정 화면이 원래 같은 방 참가자의 이름/비밀번호를 관리하도록 만들어져 있다.)
--    화면이 더 이상 기존 비밀번호를 들고 있지 않으므로, 빈 칸으로 두면 "그대로 유지"한다.
--    이름을 바꾸면 그 사람의 개인 가계부방 이름도 함께 맞춘다(기존 동작과 동일).
-- ────────────────────────────────────────────────────────────────────────────
drop function if exists public.account_book_update_user_profile(text, text, text);

CREATE OR REPLACE FUNCTION public.account_book_update_user_profile(
  p_token text,
  p_user_id text,
  p_name text,
  p_password text
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_actor_id text := account_book_require_session(p_token);
  v_target_id text := nullif(trim(coalesce(p_user_id, '')), '');
  v_name text := nullif(trim(coalesce(p_name, '')), '');
  v_password text := nullif(trim(coalesce(p_password, '')), '');
  v_personal_workspace_id text;
  v_next_name text;
begin
  if v_target_id is null then
    raise exception 'UNAUTHORIZED';
  end if;

  if v_actor_id <> v_target_id
     and not exists (
       select 1
       from account_book_workspaces w
       where w.type = 'shared'
         and v_actor_id = any (coalesce(w.member_ids, array[]::text[]))
         and v_target_id = any (coalesce(w.member_ids, array[]::text[]))
     )
  then
    raise exception 'UNAUTHORIZED';
  end if;

  update account_book_users
     set name = coalesce(v_name, name),
         password = coalesce(v_password, password)
   where id = v_target_id
  returning personal_workspace_id, name
      into v_personal_workspace_id, v_next_name;

  if v_personal_workspace_id is null then
    return;
  end if;

  update account_book_workspaces
     set name = v_next_name || ' 개인 가계부',
         password = coalesce(v_password, password),
         updated_at = now()
   where id = v_personal_workspace_id;
end;
$function$;

grant execute on function public.account_book_update_user_profile(text, text, text, text) to anon;
grant execute on function public.account_book_update_user_profile(text, text, text, text) to authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- 10) 가계부방 이름/비밀번호 수정 (빈 칸이면 그대로 유지)
--     출입증 + 그 방의 주인/참여자여야 한다.
-- ────────────────────────────────────────────────────────────────────────────
drop function if exists public.account_book_update_workspace_profile(text, text, text);

CREATE OR REPLACE FUNCTION public.account_book_update_workspace_profile(
  p_token text,
  p_workspace_id text,
  p_name text,
  p_password text
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id text := account_book_require_session(p_token);
  v_workspace account_book_workspaces%rowtype;
begin
  select *
    into v_workspace
  from account_book_workspaces
  where id = nullif(trim(coalesce(p_workspace_id, '')), '')
  limit 1;

  if not found then
    raise exception 'Workspace not found';
  end if;

  if v_workspace.owner_user_id is distinct from v_user_id
     and not (v_user_id = any (coalesce(v_workspace.member_ids, array[]::text[]))) then
    raise exception 'UNAUTHORIZED';
  end if;

  update account_book_workspaces
     set name = coalesce(nullif(trim(coalesce(p_name, '')), ''), name),
         password = coalesce(nullif(trim(coalesce(p_password, '')), ''), password),
         updated_at = now()
   where id = p_workspace_id;
end;
$function$;

grant execute on function public.account_book_update_workspace_profile(text, text, text, text) to anon;
grant execute on function public.account_book_update_workspace_profile(text, text, text, text) to authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- 11) 예산·목표만 수정 (비밀번호를 건드리지 않는다)
--     출입증 + 그 방의 주인/참여자여야 한다.
--     기존에는 연간목표/월예산을 바꿀 때도 upsert_workspace 에 비밀번호를 같이 실어 보냈다.
--     이제 화면에 비밀번호가 없으므로, 필요한 컬럼만 갱신하는 전용 함수를 쓴다.
-- ────────────────────────────────────────────────────────────────────────────
drop function if exists public.account_book_set_workspace_settings(text, integer, integer, jsonb, jsonb);

CREATE OR REPLACE FUNCTION public.account_book_set_workspace_settings(
  p_token text,
  p_workspace_id text,
  p_annual_saving_goal integer DEFAULT null,
  p_monthly_budget integer DEFAULT null,
  p_monthly_budgets jsonb DEFAULT null,
  p_asset_goal_map jsonb DEFAULT null
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id text := account_book_require_session(p_token);
  v_workspace account_book_workspaces%rowtype;
begin
  select *
    into v_workspace
  from account_book_workspaces
  where id = nullif(trim(coalesce(p_workspace_id, '')), '')
  limit 1;

  if not found then
    raise exception 'Workspace not found';
  end if;

  if v_workspace.owner_user_id is distinct from v_user_id
     and not (v_user_id = any (coalesce(v_workspace.member_ids, array[]::text[]))) then
    raise exception 'UNAUTHORIZED';
  end if;

  update account_book_workspaces
     set annual_saving_goal = greatest(coalesce(p_annual_saving_goal, annual_saving_goal, 1200000), 0),
         monthly_budget = greatest(coalesce(p_monthly_budget, monthly_budget, 0), 0),
         monthly_budgets = coalesce(p_monthly_budgets, monthly_budgets, '{}'::jsonb),
         asset_goal_map = coalesce(p_asset_goal_map, asset_goal_map, '{}'::jsonb),
         updated_at = now()
   where id = p_workspace_id;
end;
$function$;

grant execute on function public.account_book_set_workspace_settings(text, text, integer, integer, jsonb, jsonb) to anon;
grant execute on function public.account_book_set_workspace_settings(text, text, integer, integer, jsonb, jsonb) to authenticated;
