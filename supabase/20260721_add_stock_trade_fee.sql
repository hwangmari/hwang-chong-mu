-- 매매 기록에 수수료(fee, 원 단위) 컬럼 추가 — 토스식 "수수료·세금 포함" 투입금 트래킹용
alter table account_book_stock_trades
  add column if not exists fee integer not null default 0 check (fee >= 0);

-- payload에 fee 포함
create or replace function account_book_stock_trades_payload(p_workspace_id text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', t.id,
          'workspace_id', t.workspace_id,
          'account_id', t.account_id,
          'date', to_char(t.trade_date, 'YYYY-MM-DD'),
          'side', t.side,
          'stock_code', t.stock_code,
          'stock_name', t.stock_name,
          'quantity', t.quantity,
          'price', t.price,
          'fee', t.fee,
          'memo', t.memo,
          'created_by_user_id', t.created_by_user_id
        )
        order by t.trade_date desc, t.created_at desc, t.id desc
      )
      from account_book_stock_trades t
      where t.workspace_id = p_workspace_id
    ),
    '[]'::jsonb
  );
$$;

-- upsert가 fee를 저장하도록 교체 (시그니처 동일 — jsonb 내부 필드만 추가라 DROP 불필요)
create or replace function account_book_upsert_stock_trade(p_trade jsonb, p_actor_user_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trade record;
  v_existing account_book_stock_trades%rowtype;
  v_workspace account_book_workspaces%rowtype;
begin
  if coalesce(trim(p_actor_user_id), '') = '' then
    raise exception 'Actor user is required';
  end if;

  select *
    into v_trade
  from jsonb_to_record(p_trade) as x(
    id text,
    "workspaceId" text,
    "accountId" text,
    date text,
    side text,
    "stockCode" text,
    "stockName" text,
    quantity integer,
    price integer,
    fee integer,
    memo text
  );

  if coalesce(trim(v_trade.id), '') = '' then
    raise exception 'Trade id is required';
  end if;
  if coalesce(trim(v_trade."workspaceId"), '') = '' then
    raise exception 'Workspace id is required';
  end if;
  if coalesce(trim(v_trade."accountId"), '') = '' then
    raise exception 'Account id is required';
  end if;

  select *
    into v_workspace
  from account_book_workspaces
  where id = v_trade."workspaceId"
  limit 1;

  if not found then
    raise exception 'Workspace not found';
  end if;

  if v_workspace.owner_user_id is distinct from p_actor_user_id
     and not (p_actor_user_id = any(v_workspace.member_ids)) then
    raise exception 'Only workspace members can save trades';
  end if;

  select *
    into v_existing
  from account_book_stock_trades
  where id = v_trade.id
  limit 1;

  if found and v_existing.created_by_user_id <> p_actor_user_id then
    raise exception 'Only the author can update this trade';
  end if;

  insert into account_book_stock_trades (
    id,
    workspace_id,
    account_id,
    trade_date,
    side,
    stock_code,
    stock_name,
    quantity,
    price,
    fee,
    memo,
    created_by_user_id
  )
  values (
    v_trade.id,
    v_trade."workspaceId",
    v_trade."accountId",
    v_trade.date::date,
    v_trade.side,
    v_trade."stockCode",
    coalesce(v_trade."stockName", ''),
    v_trade.quantity,
    v_trade.price,
    greatest(coalesce(v_trade.fee, 0), 0),
    coalesce(v_trade.memo, ''),
    p_actor_user_id
  )
  on conflict (id) do update
  set
    account_id = excluded.account_id,
    trade_date = excluded.trade_date,
    side = excluded.side,
    stock_code = excluded.stock_code,
    stock_name = excluded.stock_name,
    quantity = excluded.quantity,
    price = excluded.price,
    fee = excluded.fee,
    memo = excluded.memo,
    updated_at = now();

  return account_book_stock_trades_payload(v_trade."workspaceId");
end;
$$;

-- payload 재생성 시 PUBLIC 기본 실행권이 다시 붙으므로 재차 차단
revoke execute on function account_book_stock_trades_payload(text) from public, anon, authenticated;
