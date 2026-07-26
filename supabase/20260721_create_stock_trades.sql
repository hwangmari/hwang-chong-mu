-- 가계부 투자 계좌용 주식 매매일지 테이블 + RPC 3종
-- 패턴: 20260212_create_secure_daily_tables.sql (RLS + revoke + SECURITY DEFINER + grant)
-- 권한 검증: account_book_upsert_entry와 동일하게 워크스페이스 owner/member 확인

create table if not exists account_book_stock_trades (
  id text primary key,
  workspace_id text not null,
  account_id text not null,
  trade_date date not null,
  side text not null check (side in ('buy', 'sell')),
  stock_code text not null check (stock_code ~ '^[0-9A-Z]{6}$'),
  stock_name text not null default '',
  quantity integer not null check (quantity > 0),
  price integer not null check (price >= 0),
  memo text not null default '',
  created_by_user_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_stock_trades_workspace
  on account_book_stock_trades (workspace_id, trade_date desc);

drop trigger if exists trg_stock_trades_updated_at on account_book_stock_trades;
create trigger trg_stock_trades_updated_at
before update on account_book_stock_trades
for each row execute procedure set_updated_at();

alter table account_book_stock_trades enable row level security;
revoke all on account_book_stock_trades from anon, authenticated;

-- 워크스페이스의 매매일지 전체를 snake_case JSON 배열로 반환 (클라이언트가 camelCase로 매핑)
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

create or replace function account_book_get_stock_trades(p_workspace_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(trim(p_workspace_id), '') = '' then
    raise exception 'Workspace id is required';
  end if;
  return account_book_stock_trades_payload(p_workspace_id);
end;
$$;

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
    memo = excluded.memo,
    updated_at = now();

  return account_book_stock_trades_payload(v_trade."workspaceId");
end;
$$;

create or replace function account_book_delete_stock_trade(p_trade_id text, p_actor_user_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing account_book_stock_trades%rowtype;
begin
  if coalesce(trim(p_actor_user_id), '') = '' then
    raise exception 'Actor user is required';
  end if;

  select *
    into v_existing
  from account_book_stock_trades
  where id = p_trade_id
  limit 1;

  if not found then
    -- 이미 없는 항목 삭제는 무해하므로 빈 컨텍스트로 성공 처리 불가 → 워크스페이스를 모르니 예외 대신 빈 배열 반환
    return '[]'::jsonb;
  end if;

  if v_existing.created_by_user_id <> p_actor_user_id then
    raise exception 'Only the author can delete this trade';
  end if;

  delete from account_book_stock_trades where id = p_trade_id;

  return account_book_stock_trades_payload(v_existing.workspace_id);
end;
$$;

-- payload 헬퍼는 SECURITY DEFINER 함수 내부에서만 호출된다.
-- 주의: Postgres는 함수 생성 시 PUBLIC에 기본 실행권을 부여하므로 public까지 revoke해야 실제로 차단된다.
revoke execute on function account_book_stock_trades_payload(text) from public, anon, authenticated;
grant execute on function account_book_get_stock_trades(text) to anon, authenticated;
grant execute on function account_book_upsert_stock_trade(jsonb, text) to anon, authenticated;
grant execute on function account_book_delete_stock_trade(text, text) to anon, authenticated;
