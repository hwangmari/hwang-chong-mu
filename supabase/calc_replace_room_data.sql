-- Atomic replace for calc room data
-- Params:
--  p_room_id  : room id as text
--  p_members  : text[]
--  p_expenses : jsonb (array of { payer, description, amount, type })

create or replace function public.calc_replace_room_data(
  p_room_id text,
  p_members text[],
  p_expenses jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Clear existing rows
  delete from calc_members where room_id::text = p_room_id;
  delete from calc_expenses where room_id::text = p_room_id;

  -- Insert members
  insert into calc_members (room_id, name)
  select r.id, m
  from calc_rooms r
  cross join unnest(p_members) as m
  where r.id::text = p_room_id;

  -- Insert expenses
  insert into calc_expenses (room_id, payer, description, amount, type)
  select r.id,
         (e->>'payer')::text,
         (e->>'description')::text,
         (e->>'amount')::int,
         (e->>'type')::text
  from calc_rooms r
  cross join jsonb_array_elements(p_expenses) as e
  where r.id::text = p_room_id;
end;
$$;

-- Allow anon/authenticated to execute (client uses anon key)
grant execute on function public.calc_replace_room_data(text, text[], jsonb) to anon;
grant execute on function public.calc_replace_room_data(text, text[], jsonb) to authenticated;
