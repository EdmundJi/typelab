-- Public metadata view for lesson discovery. It intentionally strips typing
-- bodies and notes so the list page stays light as the lesson bank grows.

create or replace view public.builtin_lesson_metas
with (security_invoker = true)
as
select
  lesson.id,
  lesson.title,
  lesson.topic,
  lesson.difficulty,
  jsonb_agg(
    jsonb_build_object(
      'variant_id', variant.value ->> 'variant_id',
      'language', variant.value ->> 'language',
      'style', variant.value ->> 'style',
      'step', (variant.value ->> 'step')::integer,
      'label', variant.value ->> 'label'
    )
    order by variant.position
  ) as variants
from public.builtin_lessons as lesson
cross join lateral jsonb_array_elements(lesson.variants)
  with ordinality as variant(value, position)
group by lesson.id, lesson.title, lesson.topic, lesson.difficulty;

grant select on public.builtin_lesson_metas to anon, authenticated, service_role;
