alter table public.rooms
add column if not exists calc_room_id text;

create index if not exists rooms_calc_room_id_idx
on public.rooms (calc_room_id);
