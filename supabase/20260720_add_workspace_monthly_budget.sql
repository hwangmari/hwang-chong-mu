-- 가계부 워크스페이스에 월 예산(monthly_budget) 추가
-- 1) 컬럼 추가  2) get_store가 monthlyBudget을 반환하도록 교체
-- 3) 파일 끝 조회로 account_book_upsert_workspace 정의 확인 → p_monthly_budget 파라미터 패치는 2차로 진행

alter table account_book_workspaces
  add column if not exists monthly_budget integer;

-- 2) get_store 교체: workspaces 반환에 'monthlyBudget' 키 추가
--    (2026-07-14 현금영수증 패치본 기준 — entries의 cashReceipt/benefitExcluded 포함 유지)
CREATE OR REPLACE FUNCTION public.account_book_get_store()
 RETURNS jsonb
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select jsonb_build_object(
    'version', 1,
    'users', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', u.id,
            'name', u.name,
            'password', u.password,
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
            'password', w.password,
            'annualSavingGoal', w.annual_saving_goal,
            'monthlyBudget', w.monthly_budget,
            'assetGoalMap', coalesce(w.asset_goal_map, '{}'::jsonb),
            'ownerUserId', w.owner_user_id,
            'memberIds', to_jsonb(w.member_ids),
            'inviteCode', w.invite_code
          )
          order by w.id
        )
        from account_book_workspaces w
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
        from account_book_entries e
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
        from account_book_share_links s
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
        from account_book_monthly_memos m
      ),
      '[]'::jsonb
    )
  );
$function$;

-- 3) upsert_workspace 교체: p_monthly_budget 파라미터 추가
--    시그니처가 바뀌므로 기존 8-파라미터 버전을 먼저 제거하고,
--    p_monthly_budget에 default를 두어 구버전 클라이언트(8인자 호출)도 계속 동작하게 한다.
drop function if exists public.account_book_upsert_workspace(text, text, text, text, integer, jsonb, text, text[]);

CREATE OR REPLACE FUNCTION public.account_book_upsert_workspace(p_id text, p_name text, p_type text, p_password text, p_annual_saving_goal integer, p_asset_goal_map jsonb, p_owner_user_id text, p_member_ids text[], p_monthly_budget integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_existing_invite_code text;
begin
  select invite_code
    into v_existing_invite_code
  from account_book_workspaces
  where id = p_id;

  insert into account_book_workspaces (
    id,
    name,
    type,
    password,
    annual_saving_goal,
    monthly_budget,
    asset_goal_map,
    owner_user_id,
    member_ids,
    invite_code
  )
  values (
    p_id,
    trim(p_name),
    p_type,
    trim(p_password),
    greatest(coalesce(p_annual_saving_goal, 1200000), 0),
    greatest(coalesce(p_monthly_budget, 0), 0),
    coalesce(p_asset_goal_map, '{}'::jsonb),
    nullif(p_owner_user_id, ''),
    coalesce(p_member_ids, array[]::text[]),
    case
      when p_type = 'shared'
        then coalesce(nullif(v_existing_invite_code, ''), account_book_generate_invite_code())
      else null
    end
  )
  on conflict (id) do update
  set
    name = excluded.name,
    type = excluded.type,
    password = excluded.password,
    annual_saving_goal = excluded.annual_saving_goal,
    monthly_budget = excluded.monthly_budget,
    asset_goal_map = excluded.asset_goal_map,
    owner_user_id = excluded.owner_user_id,
    member_ids = excluded.member_ids,
    invite_code = case
      when excluded.type = 'shared'
        then coalesce(account_book_workspaces.invite_code, excluded.invite_code, account_book_generate_invite_code())
      else null
    end,
    updated_at = now();

  return account_book_get_store();
end;
$function$;
