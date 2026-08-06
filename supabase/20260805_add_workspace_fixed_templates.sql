-- 가계부 "정기 반복 템플릿"을 기기별 localStorage → DB(워크스페이스)로 이관.
-- 기존: hwang-account-book-fixed-expense-{workspaceId} 키로 브라우저마다 따로 저장돼
--       기기/브라우저를 바꾸면 반복 설정이 사라졌다. 이를 워크스페이스에 귀속시켜
--       같은 계정이면 어디서든 동일한 반복 템플릿을 쓰게 한다.
--
-- 저장 형태: account_book_workspaces.fixed_templates jsonb (FixedExpenseTemplate[] 배열)
--   [{ id, workspaceId, createdByUserId, member, merchant, item, amount, payment,
--      cardCompany, memo, category, subCategory, dayOfMonth, startDate }, ...]
--
-- 적용: 이 파일 전체를 Supabase SQL Editor에 붙여넣고 실행.
-- 1) 컬럼 추가  2) get_store가 workspaces[].fixedTemplates 반환하도록 교체
-- 3) 템플릿 전용 setter RPC 추가(항목 반복 지정/해제 시 이 컬럼만 갱신)

-- 1) 컬럼 추가
alter table account_book_workspaces
  add column if not exists fixed_templates jsonb not null default '[]'::jsonb;

-- 2) get_store 교체: workspaces 반환에 'fixedTemplates' 키 추가 (기존 키 전부 유지)
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
            'monthlyBudgets', coalesce(w.monthly_budgets, '{}'::jsonb),
            'fixedTemplates', coalesce(w.fixed_templates, '[]'::jsonb),
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

-- 3) 템플릿 전용 setter: 항목을 반복으로 지정/해제할 때 해당 워크스페이스의
--    fixed_templates 배열 전체를 교체(클라이언트가 최신 배열을 통째로 넘김).
--    upsert_workspace(이름/비번/예산 편집 흐름)와 분리해 반복 설정이 독립적으로 저장되게 한다.
CREATE OR REPLACE FUNCTION public.account_book_set_fixed_templates(
  p_workspace_id text,
  p_templates jsonb
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  update account_book_workspaces
    set fixed_templates = coalesce(p_templates, '[]'::jsonb),
        updated_at = now()
  where id = p_workspace_id;

  return account_book_get_store();
end;
$function$;

grant execute on function public.account_book_set_fixed_templates(text, jsonb) to anon;
grant execute on function public.account_book_set_fixed_templates(text, jsonb) to authenticated;
