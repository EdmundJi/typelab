# SPEC.md — 接口约定 v2

> 所有人必读。有冲突以本文件为准。修改本文件需要 Tech Lead 审批。

---

## 内置课程 JSON 格式

### 新格式（v2，含变体）

每个 JSON 文件是一个数组，每条课程格式：

```typescript
{
  id: string,           // 题目唯一 id，格式：{topic}-{name}-{序号}，如 "py-bfs-01"
  title: string,        // 题目显示名称
  topic: string,        // 如 basics | arrays | strings | searching | sorting | trees | graph | dp
  difficulty: number,   // 1-5 整数，表示整题难度
  variants: Variant[]   // 至少一个变体
}

Variant {
  variant_id: string,   // 变体唯一 id，格式：{lesson_id}-v{n}，如 "py-bfs-01-v1"
  language: string,     // python | javascript | go | typescript | java | cpp
  style: string,        // verbose（详细注释版） | standard（标准实现） | concise（精简版）
  step: number,         // 1=函数骨架, 2=核心逻辑, 3=完整实现
  label: string,        // 变体选择器显示名，如 "Python · 详细版"
  text: string,         // 要打的完整文本，换行用 \n，缩进用 \t 或空格
  note: string          // 打完后显示的知识点提示，1-2 句
}
```

`topic`、题目级 `difficulty`、`variant_id` 与 `text` 是 v2 唯一规范字段；
新题目不得再使用旧字段 `category`、变体级 `difficulty` 或 `code`。

课程列表读取自动生成的 `src/lessons/manifest.json`，其中不包含 `text` 和 `note`；
进入具体课程后，`src/lessons/index.ts` 才按 `source_file` 动态加载正文。新增或修改课程后运行：

```bash
npm run lessons:manifest
```

构建与测试会执行 `lessons:manifest:check`，阻止格式不合法或 manifest 过期的课程进入仓库。

### 旧格式（v1，自动向前兼容）

`src/lib/application/lessons.ts` 的加载器会自动将旧格式包装为单变体新格式：

```json
{
  "id": "py-quicksort-01",
  "title": "快速排序（Python）",
  "category": "sorting",
  "difficulty": 3,
  "text": "def quicksort(arr): ...",
  "note": "平均时间复杂度 O(n log n)"
}
```

等价于：
```json
{
  "id": "py-quicksort-01",
  "title": "快速排序（Python）",
  "topic": "sorting",
  "difficulty": 3,
  "variants": [{
    "variant_id": "py-quicksort-01-v1",
    "language": "python",
    "style": "standard",
    "step": 3,
    "label": "Python",
    "text": "def quicksort(arr): ...",
    "note": "平均时间复杂度 O(n log n)"
  }]
}
```

> 兼容说明：旧格式的 `category` 字段映射到 `topic`；旧格式无 `language` 时默认 `"python"`（当 category 为代码类）或 `"text"`（当 category 为 warmup/concepts）。

### v2 新格式示例

```json
[
  {
    "id": "py-bfs-01",
    "title": "BFS 广度优先遍历",
    "topic": "trees",
    "difficulty": 2,
    "variants": [
      {
        "variant_id": "py-bfs-01-v1",
        "language": "python",
        "style": "verbose",
        "step": 3,
        "label": "Python · 标准实现",
        "text": "from collections import deque\n\ndef bfs(root):\n    if not root:\n        return []\n    queue = deque([root])\n    result = []\n    while queue:\n        node = queue.popleft()\n        result.append(node.val)\n        if node.left:\n            queue.append(node.left)\n        if node.right:\n            queue.append(node.right)\n    return result",
        "note": "BFS 使用队列逐层遍历，时间复杂度 O(n)，空间复杂度 O(n)。"
      },
      {
        "variant_id": "py-bfs-01-v2",
        "language": "javascript",
        "style": "standard",
        "step": 3,
        "label": "JavaScript",
        "text": "function bfs(root) {\n    if (!root) return [];\n    const queue = [root];\n    const result = [];\n    while (queue.length) {\n        const node = queue.shift();\n        result.push(node.val);\n        if (node.left) queue.push(node.left);\n        if (node.right) queue.push(node.right);\n    }\n    return result;\n}",
        "note": "JS 版本使用数组模拟队列，shift() 时间复杂度 O(n)，大规模数据建议用 deque。"
      }
    ]
  }
]
```

### 同步到 Supabase

JSON 是内置题库的唯一编辑源，`public.builtin_lessons` 是服务端镜像。先应用
`supabase/migrations/20260620000002_create_builtin_lessons.sql`，再使用仅限服务端的
service-role key 执行：

```bash
npm run lessons:sync:dry
npm run lessons:sync
```

同步脚本按 `id` 执行 upsert，并保存来源文件和内容哈希。只有显式传入 `--prune` 时才删除
数据库中已不在 JSON 里的旧题目。`SUPABASE_SERVICE_ROLE_KEY` 禁止使用 `VITE_` 前缀，
也禁止进入前端代码或 Git 仓库。

---

## `lesson_ref` 格式规范

`lesson_ref` 是跨模块统一引用课程的字符串字段，用于 `path_items.lesson_ref`、`collection_items.lesson_ref`、`results.lesson_id`。

| 课程来源 | 格式 | 示例 |
|---|---|---|
| JSON 内置课程 | `builtin:<lesson_id>` | `builtin:py-bfs-01` |
| 社区审核课程 | `community:<uuid>` | `community:d4f2e1a0-...` |

解析和构建由 `@/lib/lessonRef.js` 统一处理：

```javascript
import { parseLessonRef, buildLessonRef } from '@/lib/lessonRef'

parseLessonRef('builtin:py-bfs-01')   // → { source: 'builtin', id: 'py-bfs-01' }
parseLessonRef('community:<uuid>')    // → { source: 'community', id: '<uuid>' }
buildLessonRef('builtin', 'py-bfs-01') // → 'builtin:py-bfs-01'
```

**所有组件和 lib 模块禁止手动拼接或解析 `lesson_ref` 字符串，必须通过 `lessonRef.js`。**

---

## TypingEngine 组件接口

```javascript
// Props
props: {
  text: {
    type: String,
    required: true
  },
  language: {
    type: String,
    default: 'text'    // 用于 Prism.js 语法高亮，如 'python', 'javascript'
  }
}

// Emits
emits: ['complete', 'update']

// complete 事件携带的数据
{
  wpm: Number,       // 整数，最终每分钟字数
  accuracy: Number,  // 0-100 的浮点数，保留一位小数
  duration: Number,  // 整数，秒
  errors: Number     // 整数，总错误次数（包括同一位置多次错误）
}

// update 事件携带的数据（每次按键触发）
{
  progress: Number,      // 0-1，完成比例
  liveWpm: Number,       // 实时 WPM
  liveAccuracy: Number   // 实时准确率
}
```

**TypingEngine 不做以下任何事**：
- 不调用 Supabase
- 不操作路由
- 不感知用户登录状态
- 不感知变体信息（由父组件 TypingView 负责变体选择）

---

## 数据库表结构

### results 表（v1 已有，v2 增加 variant_id）

```sql
CREATE TABLE results (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id   text NOT NULL,          -- 存储 lesson_ref 格式字符串，如 "builtin:py-bfs-01" 或 "community:<uuid>"
  variant_id  text,                  -- v2 新增，记录具体变体
  wpm         integer NOT NULL,
  accuracy    numeric(5,2) NOT NULL,
  duration    integer NOT NULL,      -- 单位：秒
  errors      integer NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can insert own results"
  ON results FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can read own results"
  ON results FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "anyone can read results for leaderboard"
  ON results FOR SELECT USING (true);
```

### community_lessons 表（v2 新增）

```sql
CREATE TABLE community_lessons (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  submitted_by    uuid REFERENCES auth.users(id),
  title           text NOT NULL,
  topic           text NOT NULL,
  language        text NOT NULL,
  style           text DEFAULT 'standard',
  step            integer DEFAULT 3,
  label           text,
  text            text NOT NULL,
  note            text,
  status          text DEFAULT 'pending',   -- pending | approved | rejected
  reject_reason   text,
  reviewed_by     uuid REFERENCES auth.users(id),
  reviewed_at     timestamptz,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE community_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read approved lessons"
  ON community_lessons FOR SELECT USING (status = 'approved');

CREATE POLICY "users can read own submissions"
  ON community_lessons FOR SELECT USING (auth.uid() = submitted_by);

CREATE POLICY "logged in users can submit"
  ON community_lessons FOR INSERT WITH CHECK (auth.uid() = submitted_by);
```

### achievements 表（v2 新增，静态数据）

成就定义为静态内容，不频繁变更。以下 SQL 建表用于 Admin Dashboard 展示；应用代码中以代码常量维护同一份定义（`src/lib/achievements.js`），两者需保持同步。

```sql
CREATE TABLE achievements (
  id          text PRIMARY KEY,   -- 如 "first-finish"
  name        text NOT NULL,
  description text NOT NULL,
  icon        text                -- emoji 或图标标识符
);
```

### user_achievements 表（v2 新增）

```sql
CREATE TABLE user_achievements (
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id  text NOT NULL,
  unlocked_at     timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own achievements"
  ON user_achievements FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "service role can insert achievements"
  ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### paths / path_items 表（v2 新增）

```sql
CREATE TABLE paths (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title       text NOT NULL,
  description text,
  position    integer DEFAULT 0
);

CREATE TABLE path_items (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  path_id      uuid REFERENCES paths(id) ON DELETE CASCADE,
  lesson_ref   text NOT NULL,    -- lesson id（内置或社区）
  variant_hint text,             -- 推荐变体 id（可选）
  position     integer NOT NULL
);

-- paths 和 path_items 公开只读
ALTER TABLE paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can read paths" ON paths FOR SELECT USING (true);

ALTER TABLE path_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can read path_items" ON path_items FOR SELECT USING (true);
```

### collections / collection_items 表（v2 新增）

```sql
CREATE TABLE collections (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE collection_items (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id   uuid REFERENCES collections(id) ON DELETE CASCADE,
  lesson_ref      text NOT NULL,
  variant_hint    text,
  position        integer NOT NULL
);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can manage own collections"
  ON collections FOR ALL USING (auth.uid() = user_id);

ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can manage own collection items"
  ON collection_items FOR ALL
  USING (collection_id IN (
    SELECT id FROM collections WHERE user_id = auth.uid()
  ));
```

---

## 路由定义

```javascript
{ path: '/',                name: 'home',        component: HomeView }
{ path: '/lesson/:id',      name: 'lesson',      component: TypingView }
{ path: '/result',          name: 'result',      component: ResultView }
{ path: '/leaderboard',     name: 'leaderboard', component: LeaderboardView }  // v2 改为按题目排行，该路由入口保留但仅作跳转或废弃页处理
{ path: '/profile',         name: 'profile',     component: ProfileView,       meta: { requiresAuth: true } }
{ path: '/paths',           name: 'paths',       component: PathsView }
{ path: '/paths/:id',       name: 'path',        component: PathsView }
{ path: '/submit',          name: 'submit',      component: SubmitView,        meta: { requiresAuth: true } }
{ path: '/admin/review',    name: 'admin',       component: AdminReviewView,   meta: { requiresAdmin: true } }
{ path: '/login',           name: 'login',       component: LoginView }
```

---

## 成绩传递（TypingView → ResultView）

```javascript
// TypingView.vue
router.push({
  name: 'result',
  state: {
    result: { wpm, accuracy, duration, errors, lessonId, variantId, note }
  }
})

// ResultView.vue
const result = history.state.result
```

---

## Pinia Store 结构

### user store

```javascript
// state
{
  session: null | SupabaseSession,
  user: null | { id: string, email: string, username: string }
}

// computed
isLoggedIn: boolean   // session !== null
isAdmin: boolean      // session.user.user_metadata.role === 'admin'
```

### streak store

```javascript
{
  currentStreak: Number,
  bestStreak: Number,
  calendarData: Object    // { [dateString]: count }，过去 365 天
}
```

---

## 成就 ID 及解锁条件

| id | 名称 | 解锁条件 |
|---|---|---|
| `first-finish` | 起步 | 完成第 1 次练习 |
| `wpm-100` | 百键侠 | 任意一次 WPM ≥ 100 |
| `perfect-accuracy` | 完美主义者 | 任意一次准确率 = 100% |
| `streak-7` | 坚持七天 | Streak 连续 ≥ 7 天 |
| `multilingual` | 多面手 | 完成 3 种不同语言的题目 |
| `contributor` | 内容贡献者 | 投稿被采纳 1 道题目 |
| `practice-50` | 题海战术 | 累计完成 ≥ 50 次练习 |

---

## 数据访问规范

所有组件通过以下 lib 模块访问数据，不直接调用 Supabase。

```javascript
import { saveResult, listUserAchievements } from '@/lib/db'
import { listLessons, getLessonById, getVariantById } from '@/lib/lessons'
import { parseLessonRef, buildLessonRef } from '@/lib/lessonRef'
```

`@/lib/supabase` 只创建 Supabase client，**只供 `db.js` 使用**，`lessons.js` 通过 `db.js` 间接访问社区课程。

开发阶段不配置 Supabase 环境变量时，`db.js` 自动使用 mock 数据。
