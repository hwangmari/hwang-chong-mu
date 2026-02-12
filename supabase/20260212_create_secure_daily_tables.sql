create extension if not exists pgcrypto;

create table if not exists daily_notebooks (
  id uuid primary key default gen_random_uuid(),
  title_encrypted bytea not null,
  access_code_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists daily_monthly_checklists (
  notebook_id uuid not null references daily_notebooks(id) on delete cascade,
  month_key text not null,
  checklist_encrypted bytea not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (notebook_id, month_key),
  constraint daily_monthly_checklists_month_key_chk
    check (month_key ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')
);

create table if not exists daily_entries (
  notebook_id uuid not null references daily_notebooks(id) on delete cascade,
  entry_date date not null,
  diary_encrypted bytea not null,
  checks_encrypted bytea not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (notebook_id, entry_date)
);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_daily_notebooks_updated_at on daily_notebooks;
create trigger trg_daily_notebooks_updated_at
before update on daily_notebooks
for each row execute procedure set_updated_at();

drop trigger if exists trg_daily_monthly_checklists_updated_at on daily_monthly_checklists;
create trigger trg_daily_monthly_checklists_updated_at
before update on daily_monthly_checklists
for each row execute procedure set_updated_at();

drop trigger if exists trg_daily_entries_updated_at on daily_entries;
create trigger trg_daily_entries_updated_at
before update on daily_entries
for each row execute procedure set_updated_at();

alter table daily_notebooks enable row level security;
alter table daily_monthly_checklists enable row level security;
alter table daily_entries enable row level security;

revoke all on daily_notebooks from anon, authenticated;
revoke all on daily_monthly_checklists from anon, authenticated;
revoke all on daily_entries from anon, authenticated;

create or replace function daily_assert_access(
  p_notebook_id uuid,
  p_access_code text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
begin
  select access_code_hash
    into v_hash
  from daily_notebooks
  where id = p_notebook_id;

  if v_hash is null then
    raise exception 'Notebook not found';
  end if;

  if v_hash <> crypt(p_access_code, v_hash) then
    raise exception 'Invalid access code';
  end if;
end;
$$;

create or replace function daily_create_notebook(
  p_title text,
  p_access_code text,
  p_initial_month_key text,
  p_initial_checklist jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_notebook_id uuid;
begin
  if coalesce(length(trim(p_title)), 0) = 0 then
    raise exception 'Title is required';
  end if;

  if coalesce(length(trim(p_access_code)), 0) < 4 then
    raise exception 'Access code must be at least 4 characters';
  end if;

  if p_initial_month_key !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' then
    raise exception 'Invalid month key format';
  end if;

  insert into daily_notebooks (
    title_encrypted,
    access_code_hash
  )
  values (
    pgp_sym_encrypt(trim(p_title), trim(p_access_code), 'cipher-algo=aes256'),
    crypt(trim(p_access_code), gen_salt('bf', 12))
  )
  returning id into v_notebook_id;

  insert into daily_monthly_checklists (
    notebook_id,
    month_key,
    checklist_encrypted
  )
  values (
    v_notebook_id,
    p_initial_month_key,
    pgp_sym_encrypt(coalesce(p_initial_checklist, '[]'::jsonb)::text, trim(p_access_code), 'cipher-algo=aes256')
  );

  return v_notebook_id;
end;
$$;

create or replace function daily_get_notebook(
  p_notebook_id uuid,
  p_access_code text
)
returns table (
  id uuid,
  title text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform daily_assert_access(p_notebook_id, trim(p_access_code));

  return query
  select
    n.id,
    pgp_sym_decrypt(n.title_encrypted, trim(p_access_code)) as title,
    n.created_at,
    n.updated_at
  from daily_notebooks n
  where n.id = p_notebook_id;
end;
$$;

create or replace function daily_change_access_code(
  p_notebook_id uuid,
  p_old_access_code text,
  p_new_access_code text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
begin
  if coalesce(length(trim(p_new_access_code)), 0) < 4 then
    raise exception 'New access code must be at least 4 characters';
  end if;

  perform daily_assert_access(p_notebook_id, trim(p_old_access_code));

  select pgp_sym_decrypt(title_encrypted, trim(p_old_access_code))
    into v_title
  from daily_notebooks
  where id = p_notebook_id;

  update daily_notebooks
  set
    title_encrypted = pgp_sym_encrypt(v_title, trim(p_new_access_code), 'cipher-algo=aes256'),
    access_code_hash = crypt(trim(p_new_access_code), gen_salt('bf', 12))
  where id = p_notebook_id;

  update daily_monthly_checklists
  set checklist_encrypted = pgp_sym_encrypt(
    pgp_sym_decrypt(checklist_encrypted, trim(p_old_access_code)),
    trim(p_new_access_code),
    'cipher-algo=aes256'
  )
  where notebook_id = p_notebook_id;

  update daily_entries
  set
    diary_encrypted = pgp_sym_encrypt(
      pgp_sym_decrypt(diary_encrypted, trim(p_old_access_code)),
      trim(p_new_access_code),
      'cipher-algo=aes256'
    ),
    checks_encrypted = pgp_sym_encrypt(
      pgp_sym_decrypt(checks_encrypted, trim(p_old_access_code)),
      trim(p_new_access_code),
      'cipher-algo=aes256'
    )
  where notebook_id = p_notebook_id;
end;
$$;

create or replace function daily_upsert_monthly_checklist(
  p_notebook_id uuid,
  p_month_key text,
  p_checklist jsonb,
  p_access_code text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_month_key !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' then
    raise exception 'Invalid month key format';
  end if;

  perform daily_assert_access(p_notebook_id, trim(p_access_code));

  insert into daily_monthly_checklists (
    notebook_id,
    month_key,
    checklist_encrypted
  )
  values (
    p_notebook_id,
    p_month_key,
    pgp_sym_encrypt(coalesce(p_checklist, '[]'::jsonb)::text, trim(p_access_code), 'cipher-algo=aes256')
  )
  on conflict (notebook_id, month_key)
  do update set
    checklist_encrypted = excluded.checklist_encrypted;
end;
$$;

create or replace function daily_get_monthly_checklist(
  p_notebook_id uuid,
  p_month_key text,
  p_access_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result text;
begin
  perform daily_assert_access(p_notebook_id, trim(p_access_code));

  select pgp_sym_decrypt(c.checklist_encrypted, trim(p_access_code))
    into v_result
  from daily_monthly_checklists c
  where c.notebook_id = p_notebook_id
    and c.month_key = p_month_key;

  return coalesce(v_result, '[]')::jsonb;
end;
$$;

create or replace function daily_upsert_entry(
  p_notebook_id uuid,
  p_entry_date date,
  p_diary text,
  p_checks jsonb,
  p_access_code text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform daily_assert_access(p_notebook_id, trim(p_access_code));

  insert into daily_entries (
    notebook_id,
    entry_date,
    diary_encrypted,
    checks_encrypted
  )
  values (
    p_notebook_id,
    p_entry_date,
    pgp_sym_encrypt(coalesce(p_diary, ''), trim(p_access_code), 'cipher-algo=aes256'),
    pgp_sym_encrypt(coalesce(p_checks, '[]'::jsonb)::text, trim(p_access_code), 'cipher-algo=aes256')
  )
  on conflict (notebook_id, entry_date)
  do update set
    diary_encrypted = excluded.diary_encrypted,
    checks_encrypted = excluded.checks_encrypted;
end;
$$;

create or replace function daily_get_month_entries(
  p_notebook_id uuid,
  p_month_key text,
  p_access_code text
)
returns table (
  entry_date date,
  diary text,
  checks jsonb
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_month_key !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' then
    raise exception 'Invalid month key format';
  end if;

  perform daily_assert_access(p_notebook_id, trim(p_access_code));

  return query
  select
    e.entry_date,
    pgp_sym_decrypt(e.diary_encrypted, trim(p_access_code)) as diary,
    pgp_sym_decrypt(e.checks_encrypted, trim(p_access_code))::jsonb as checks
  from daily_entries e
  where e.notebook_id = p_notebook_id
    and to_char(e.entry_date, 'YYYY-MM') = p_month_key
  order by e.entry_date asc;
end;
$$;

grant execute on function daily_assert_access(uuid, text) to anon, authenticated;
grant execute on function daily_create_notebook(text, text, text, jsonb) to anon, authenticated;
grant execute on function daily_get_notebook(uuid, text) to anon, authenticated;
grant execute on function daily_change_access_code(uuid, text, text) to anon, authenticated;
grant execute on function daily_upsert_monthly_checklist(uuid, text, jsonb, text) to anon, authenticated;
grant execute on function daily_get_monthly_checklist(uuid, text, text) to anon, authenticated;
grant execute on function daily_upsert_entry(uuid, date, text, jsonb, text) to anon, authenticated;
grant execute on function daily_get_month_entries(uuid, text, text) to anon, authenticated;
