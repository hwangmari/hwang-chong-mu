alter table public.calc_rooms
add column if not exists short_code text,
add column if not exists slug text;

create unique index if not exists calc_rooms_short_code_key
on public.calc_rooms (short_code);

create index if not exists calc_rooms_slug_idx
on public.calc_rooms (slug);
