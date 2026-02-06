alter table public.rooms
add column if not exists short_code text,
add column if not exists slug text;

create unique index if not exists rooms_short_code_key
on public.rooms (short_code);

create index if not exists rooms_slug_idx
on public.rooms (slug);
