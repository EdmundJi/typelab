-- Security and data-boundary hardening for application tables used by v2/v3 code paths.
-- This migration is intentionally idempotent so it can be applied after earlier partial schemas.

create extension if not exists pgcrypto;

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'is_admin', '') in ('true', '1')
    or coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin';
$$;

create table if not exists public.results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null,
  variant_id text,
  wpm integer not null,
  accuracy numeric(5, 2) not null,
  duration integer not null,
  errors integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.results
  add column if not exists variant_id text,
  alter column errors set default 0,
  alter column created_at set default now();

create table if not exists public.community_lessons (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references auth.users(id) on delete cascade,
  title text not null,
  topic text,
  language text not null,
  style text not null default 'standard',
  step integer not null default 3,
  label text,
  text text not null,
  note text,
  status text not null default 'pending',
  reject_reason text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.community_lessons
  add column if not exists topic text,
  add column if not exists style text not null default 'standard',
  add column if not exists step integer not null default 3,
  add column if not exists label text,
  add column if not exists note text,
  add column if not exists reject_reason text,
  add column if not exists reviewed_by uuid references auth.users(id),
  add column if not exists reviewed_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  alter column status set default 'pending';

create table if not exists public.user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

alter table public.user_achievements
  add column if not exists unlocked_at timestamptz not null default now();

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.collections
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  lesson_ref text not null,
  variant_hint text,
  added_at timestamptz not null default now(),
  unique (collection_id, lesson_ref)
);

alter table public.collection_items
  add column if not exists variant_hint text,
  add column if not exists added_at timestamptz not null default now();

alter table public.paths
  add column if not exists created_at timestamptz default now();

alter table public.path_items
  add column if not exists variant_hint text,
  add column if not exists created_at timestamptz default now();

-- Integrity constraints are added as NOT VALID to avoid blocking deploys with legacy rows;
-- new and updated rows are still checked immediately by PostgreSQL.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'results_lesson_ref_format') then
    alter table public.results add constraint results_lesson_ref_format
      check (lesson_id ~ '^(builtin|community):[^[:space:]:]+$') not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'results_wpm_plausible') then
    alter table public.results add constraint results_wpm_plausible
      check (wpm between 1 and 400) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'results_accuracy_plausible') then
    alter table public.results add constraint results_accuracy_plausible
      check (accuracy >= 0 and accuracy <= 100) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'results_duration_plausible') then
    alter table public.results add constraint results_duration_plausible
      check (duration between 1 and 86400) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'results_errors_plausible') then
    alter table public.results add constraint results_errors_plausible
      check (errors >= 0 and errors <= 10000) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'community_lessons_status_valid') then
    alter table public.community_lessons add constraint community_lessons_status_valid
      check (status in ('pending', 'approved', 'rejected')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'community_lessons_title_size') then
    alter table public.community_lessons add constraint community_lessons_title_size
      check (length(btrim(title)) between 1 and 120) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'community_lessons_text_size') then
    alter table public.community_lessons add constraint community_lessons_text_size
      check (length(text) between 20 and 20000) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'community_lessons_language_format') then
    alter table public.community_lessons add constraint community_lessons_language_format
      check (language ~ '^[A-Za-z][A-Za-z0-9_+#.-]{0,31}$') not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'community_lessons_step_range') then
    alter table public.community_lessons add constraint community_lessons_step_range
      check (step between 1 and 10) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'community_lessons_review_state') then
    alter table public.community_lessons add constraint community_lessons_review_state
      check (
        (status = 'pending' and reviewed_at is null)
        or (status in ('approved', 'rejected') and reviewed_at is not null)
      ) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'user_achievements_id_size') then
    alter table public.user_achievements add constraint user_achievements_id_size
      check (length(btrim(achievement_id)) between 1 and 80) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'collections_name_size') then
    alter table public.collections add constraint collections_name_size
      check (length(btrim(name)) between 1 and 80) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'collection_items_lesson_ref_format') then
    alter table public.collection_items add constraint collection_items_lesson_ref_format
      check (lesson_ref ~ '^(builtin|community):[^[:space:]:]+$') not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'paths_name_size') then
    alter table public.paths add constraint paths_name_size
      check (length(btrim(name)) between 1 and 120) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'path_items_lesson_ref_format') then
    alter table public.path_items add constraint path_items_lesson_ref_format
      check (lesson_ref ~ '^(builtin|community):[^[:space:]:]+$') not valid;
  end if;
end $$;

create index if not exists results_user_created_idx on public.results (user_id, created_at desc);
create index if not exists results_lesson_wpm_idx on public.results (lesson_id, wpm desc);
create index if not exists community_lessons_status_created_idx on public.community_lessons (status, created_at);
create index if not exists community_lessons_submitter_idx on public.community_lessons (submitted_by, created_at desc);
create index if not exists collections_user_idx on public.collections (user_id, created_at);
create index if not exists collection_items_collection_idx on public.collection_items (collection_id, added_at);
create index if not exists path_items_path_position_idx on public.path_items (path_id, position);

alter table public.results enable row level security;
alter table public.community_lessons enable row level security;
alter table public.user_achievements enable row level security;
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;
alter table public.paths enable row level security;
alter table public.path_items enable row level security;

alter table public.results force row level security;
alter table public.community_lessons force row level security;
alter table public.user_achievements force row level security;
alter table public.collections force row level security;
alter table public.collection_items force row level security;
alter table public.paths force row level security;
alter table public.path_items force row level security;

drop policy if exists "users can insert own results" on public.results;
drop policy if exists "users can read own results" on public.results;
drop policy if exists "anyone can read results for leaderboard" on public.results;
drop policy if exists "results_select_own_or_admin" on public.results;
drop policy if exists "results_insert_own" on public.results;
create policy "results_select_own_or_admin"
  on public.results for select
  using (auth.uid() = user_id or public.is_admin());
create policy "results_insert_own"
  on public.results for insert
  with check (auth.uid() = user_id);

drop policy if exists "anyone can read approved lessons" on public.community_lessons;
drop policy if exists "users can read own submissions" on public.community_lessons;
drop policy if exists "logged in users can submit" on public.community_lessons;
drop policy if exists "community_lessons_select_visible" on public.community_lessons;
drop policy if exists "community_lessons_insert_own_pending" on public.community_lessons;
drop policy if exists "community_lessons_update_admin_review" on public.community_lessons;
create policy "community_lessons_select_visible"
  on public.community_lessons for select
  using (status = 'approved' or auth.uid() = submitted_by or public.is_admin());
create policy "community_lessons_insert_own_pending"
  on public.community_lessons for insert
  with check (auth.uid() = submitted_by and status = 'pending');
create policy "community_lessons_update_admin_review"
  on public.community_lessons for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "users can read own achievements" on public.user_achievements;
drop policy if exists "service role can insert achievements" on public.user_achievements;
drop policy if exists "user_achievements_select_own_or_admin" on public.user_achievements;
drop policy if exists "user_achievements_insert_own_or_admin" on public.user_achievements;
create policy "user_achievements_select_own_or_admin"
  on public.user_achievements for select
  using (auth.uid() = user_id or public.is_admin());
create policy "user_achievements_insert_own_or_admin"
  on public.user_achievements for insert
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "users can manage own collections" on public.collections;
drop policy if exists "collections_select_own" on public.collections;
drop policy if exists "collections_insert_own" on public.collections;
drop policy if exists "collections_update_own" on public.collections;
drop policy if exists "collections_delete_own" on public.collections;
create policy "collections_select_own"
  on public.collections for select
  using (auth.uid() = user_id);
create policy "collections_insert_own"
  on public.collections for insert
  with check (auth.uid() = user_id);
create policy "collections_update_own"
  on public.collections for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "collections_delete_own"
  on public.collections for delete
  using (auth.uid() = user_id);

drop policy if exists "users can manage own collection items" on public.collection_items;
drop policy if exists "collection_items_select_own" on public.collection_items;
drop policy if exists "collection_items_insert_own" on public.collection_items;
drop policy if exists "collection_items_delete_own" on public.collection_items;
create policy "collection_items_select_own"
  on public.collection_items for select
  using (exists (
    select 1 from public.collections
    where collections.id = collection_items.collection_id
      and collections.user_id = auth.uid()
  ));
create policy "collection_items_insert_own"
  on public.collection_items for insert
  with check (exists (
    select 1 from public.collections
    where collections.id = collection_items.collection_id
      and collections.user_id = auth.uid()
  ));
create policy "collection_items_delete_own"
  on public.collection_items for delete
  using (exists (
    select 1 from public.collections
    where collections.id = collection_items.collection_id
      and collections.user_id = auth.uid()
  ));

drop policy if exists "anyone can read paths" on public.paths;
drop policy if exists "paths_public_read" on public.paths;
drop policy if exists "paths_admin_write" on public.paths;
create policy "paths_public_read"
  on public.paths for select
  using (true);
create policy "paths_admin_write"
  on public.paths for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "anyone can read path_items" on public.path_items;
drop policy if exists "path_items_public_read" on public.path_items;
drop policy if exists "path_items_admin_write" on public.path_items;
create policy "path_items_public_read"
  on public.path_items for select
  using (true);
create policy "path_items_admin_write"
  on public.path_items for all
  using (public.is_admin())
  with check (public.is_admin());

drop function if exists public.get_leaderboard();

create function public.get_leaderboard()
returns table (
  user_id uuid,
  email text,
  best_wpm integer,
  accuracy numeric,
  rank bigint
)
language sql
stable
security definer
set search_path = public, auth
as $$
  with ranked_results as (
    select
      r.user_id,
      u.email,
      r.wpm as best_wpm,
      r.accuracy,
      row_number() over (partition by r.user_id order by r.wpm desc, r.accuracy desc, r.created_at asc) as user_rank
    from public.results r
    left join auth.users u on u.id = r.user_id
  ), best_per_user as (
    select user_id, email, best_wpm, accuracy
    from ranked_results
    where user_rank = 1
  )
  select
    best_per_user.user_id,
    best_per_user.email,
    best_per_user.best_wpm,
    best_per_user.accuracy,
    dense_rank() over (order by best_per_user.best_wpm desc, best_per_user.accuracy desc) as rank
  from best_per_user
  order by rank asc, best_wpm desc
  limit 20;
$$;

grant execute on function public.get_leaderboard() to anon, authenticated;
