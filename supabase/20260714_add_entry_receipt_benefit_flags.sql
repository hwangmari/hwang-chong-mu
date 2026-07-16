-- 가계부 항목에 현금영수증/카드실적제외 플래그 추가
-- 1) 컬럼 추가  2) upsert 함수가 두 필드를 저장하도록 교체
-- (get_store 함수도 두 필드를 반환하도록 별도 패치 필요 — 아래 조회로 정의 확인 후 진행)

alter table account_book_entries
  add column if not exists cash_receipt boolean,
  add column if not exists benefit_excluded boolean;

CREATE OR REPLACE FUNCTION public.account_book_upsert_entry(p_entry jsonb, p_actor_user_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_entry record;
  v_existing_entry account_book_entries%rowtype;
  v_workspace account_book_workspaces%rowtype;
begin
  if coalesce(trim(p_actor_user_id), '') = '' then
    raise exception 'Actor user is required';
  end if;

  select *
    into v_entry
  from jsonb_to_record(p_entry) as x(
    id text,
    date text,
    member text,
    "workspaceId" text,
    "createdByUserId" text,
    type text,
    category text,
    "subCategory" text,
    merchant text,
    item text,
    amount integer,
    "cardCompany" text,
    payment text,
    memo text,
    "rawText" text,
    "cashReceipt" boolean,
    "benefitExcluded" boolean
  );

  if coalesce(trim(v_entry.id), '') = '' then
    raise exception 'Entry id is required';
  end if;

  if coalesce(trim(v_entry."workspaceId"), '') = '' then
    raise exception 'Workspace id is required';
  end if;

  if coalesce(trim(v_entry."createdByUserId"), '') <> p_actor_user_id then
    raise exception 'Only the author can save this entry';
  end if;

  select *
    into v_workspace
  from account_book_workspaces
  where id = v_entry."workspaceId"
  limit 1;

  if not found then
    raise exception 'Workspace not found';
  end if;

  if v_workspace.owner_user_id is distinct from p_actor_user_id
     and not (p_actor_user_id = any(v_workspace.member_ids)) then
    raise exception 'Only workspace members can save entries';
  end if;

  select *
    into v_existing_entry
  from account_book_entries
  where id = v_entry.id
  limit 1;

  if found then
    if v_existing_entry.created_by_user_id <> p_actor_user_id then
      raise exception 'Only the author can update this entry';
    end if;

    if v_existing_entry.workspace_id <> v_entry."workspaceId" then
      raise exception 'Entry workspace cannot be changed';
    end if;
  end if;

  insert into account_book_entries (
    id,
    entry_date,
    member,
    workspace_id,
    created_by_user_id,
    type,
    category,
    sub_category,
    merchant,
    item,
    amount,
    card_company,
    payment,
    memo,
    raw_text,
    cash_receipt,
    benefit_excluded
  )
  values (
    v_entry.id,
    v_entry.date::date,
    v_entry.member,
    v_entry."workspaceId",
    p_actor_user_id,
    v_entry.type,
    v_entry.category,
    coalesce(v_entry."subCategory", ''),
    coalesce(v_entry.merchant, ''),
    v_entry.item,
    coalesce(v_entry.amount, 0),
    coalesce(v_entry."cardCompany", 'KB국민카드'),
    v_entry.payment,
    coalesce(v_entry.memo, ''),
    coalesce(v_entry."rawText", ''),
    v_entry."cashReceipt",
    v_entry."benefitExcluded"
  )
  on conflict (id) do update
  set
    entry_date = excluded.entry_date,
    member = excluded.member,
    workspace_id = excluded.workspace_id,
    created_by_user_id = excluded.created_by_user_id,
    type = excluded.type,
    category = excluded.category,
    sub_category = excluded.sub_category,
    merchant = excluded.merchant,
    item = excluded.item,
    amount = excluded.amount,
    card_company = excluded.card_company,
    payment = excluded.payment,
    memo = excluded.memo,
    raw_text = excluded.raw_text,
    cash_receipt = excluded.cash_receipt,
    benefit_excluded = excluded.benefit_excluded,
    updated_at = now();

  return account_book_get_store();
end;
$function$;

-- 3) get_store가 두 필드를 반환하도록 교체 (entries 빌드에 cashReceipt/benefitExcluded 추가)
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
