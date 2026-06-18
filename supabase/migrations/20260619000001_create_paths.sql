-- paths 表：系统学习路径
create table if not exists paths (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz default now()
);

-- path_items 表：路径中的每一课
create table if not exists path_items (
  id uuid primary key default gen_random_uuid(),
  path_id uuid references paths(id) on delete cascade,
  lesson_ref text not null,  -- 格式: 'builtin:py-bfs-01' 或 'community:<uuid>'
  position integer not null, -- 排序，从 1 开始
  created_at timestamptz default now(),
  unique(path_id, position)
);

-- 插入 2 条系统路径
insert into paths (id, name, description) values
  ('00000000-0000-0000-0000-000000000001', 'Python 算法入门', '从排序到图论，掌握 Python 核心算法'),
  ('00000000-0000-0000-0000-000000000002', '数据结构基础', '树、图、DP 全覆盖');

-- 路径 1：Python 算法入门（快速排序 → 归并排序 → BFS → DFS → Dijkstra → 斐波那契 DP）
insert into path_items (path_id, lesson_ref, position) values
  ('00000000-0000-0000-0000-000000000001', 'builtin:py-quicksort-01', 1),
  ('00000000-0000-0000-0000-000000000001', 'builtin:py-mergesort-01', 2),
  ('00000000-0000-0000-0000-000000000001', 'builtin:py-bfs-01', 3),
  ('00000000-0000-0000-0000-000000000001', 'builtin:py-dfs-01', 4),
  ('00000000-0000-0000-0000-000000000001', 'builtin:py-dijkstra-01', 5),
  ('00000000-0000-0000-0000-000000000001', 'builtin:py-fibonacci-01', 6);

-- 路径 2：数据结构基础（BFS → DFS → Dijkstra → 斐波那契 DP）
insert into path_items (path_id, lesson_ref, position) values
  ('00000000-0000-0000-0000-000000000002', 'builtin:py-bfs-01', 1),
  ('00000000-0000-0000-0000-000000000002', 'builtin:py-dfs-01', 2),
  ('00000000-0000-0000-0000-000000000002', 'builtin:py-dijkstra-01', 3),
  ('00000000-0000-0000-0000-000000000002', 'builtin:py-fibonacci-01', 4);
