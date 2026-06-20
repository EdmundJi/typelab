-- Canonical mirror of src/lessons JSON files. JSON remains the authoring source;
-- scripts/sync-lessons-to-supabase.mjs keeps this table in sync for server use.

create table if not exists public.builtin_lessons (
  id text primary key,
  title text not null,
  topic text not null,
  difficulty smallint not null,
  variants jsonb not null,
  source_file text not null,
  content_hash text not null,
  synced_at timestamptz not null default now()
);

alter table public.builtin_lessons
  add column if not exists title text,
  add column if not exists topic text,
  add column if not exists difficulty smallint,
  add column if not exists variants jsonb,
  add column if not exists source_file text,
  add column if not exists content_hash text,
  add column if not exists synced_at timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'builtin_lessons_id_format') then
    alter table public.builtin_lessons add constraint builtin_lessons_id_format
      check (id ~ '^[a-z0-9][a-z0-9-]{1,79}$') not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'builtin_lessons_title_size') then
    alter table public.builtin_lessons add constraint builtin_lessons_title_size
      check (length(btrim(title)) between 1 and 120) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'builtin_lessons_topic_format') then
    alter table public.builtin_lessons add constraint builtin_lessons_topic_format
      check (topic ~ '^[a-z][a-z0-9-]{1,39}$') not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'builtin_lessons_difficulty_range') then
    alter table public.builtin_lessons add constraint builtin_lessons_difficulty_range
      check (difficulty between 1 and 5) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'builtin_lessons_variants_array') then
    alter table public.builtin_lessons add constraint builtin_lessons_variants_array
      check (jsonb_typeof(variants) = 'array' and jsonb_array_length(variants) > 0) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'builtin_lessons_content_hash_format') then
    alter table public.builtin_lessons add constraint builtin_lessons_content_hash_format
      check (content_hash ~ '^[0-9a-f]{64}$') not valid;
  end if;
end $$;

create index if not exists builtin_lessons_topic_difficulty_idx
  on public.builtin_lessons (topic, difficulty, id);

alter table public.builtin_lessons enable row level security;
alter table public.builtin_lessons force row level security;

drop policy if exists "builtin_lessons_public_read" on public.builtin_lessons;
drop policy if exists "builtin_lessons_admin_write" on public.builtin_lessons;
create policy "builtin_lessons_public_read"
  on public.builtin_lessons for select
  using (true);
create policy "builtin_lessons_admin_write"
  on public.builtin_lessons for all
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.builtin_lessons to anon, authenticated;
grant all on public.builtin_lessons to service_role;
