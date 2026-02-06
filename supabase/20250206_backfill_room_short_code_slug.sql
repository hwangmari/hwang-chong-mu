do $$
declare
  r record;
  new_code text;
begin
  for r in
    select id, name
    from public.rooms
    where short_code is null
  loop
    loop
      new_code := substring(upper(md5(random()::text)) from 1 for 6);
      exit when not exists (
        select 1 from public.rooms where short_code = new_code
      );
    end loop;

    update public.rooms
    set
      short_code = new_code,
      slug = coalesce(slug, regexp_replace(lower(trim(r.name)), '[^a-z0-9가-힣\\s-]', '', 'g'))
    where id = r.id;
  end loop;
end $$;
