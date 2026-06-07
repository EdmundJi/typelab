# SPEC.md — 接口约定

> 所有人必读。有冲突以本文件为准。修改本文件需要 Tech Lead 审批。

---

## 数据库表结构

### results 表

```sql
CREATE TABLE results (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id   text NOT NULL,
  wpm         integer NOT NULL,
  accuracy    numeric(5,2) NOT NULL,
  duration    integer NOT NULL,  -- 单位：秒
  errors      integer NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

-- Row Level Security
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- 用户只能读写自己的记录
CREATE POLICY "users can insert own results"
  ON results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can read own results"
  ON results FOR SELECT
  USING (auth.uid() = user_id);

-- 排行榜需要读所有人的记录（只读）
CREATE POLICY "anyone can read results for leaderboard"
  ON results FOR SELECT
  USING (true);
```

---

## 课程 JSON 格式

每个 JSON 文件是一个数组，每条课程格式：

```typescript
{
  id: string,           // 全局唯一，格式：{category}-{name}-{序号}，例如 "py-quicksort-01"
  title: string,        // 显示名称
  category: string,     // warmup | sorting | trees | dp | graph | js | concepts
  difficulty: number,   // 1-5，整数
  text: string,         // 要打的完整文本，换行用 \n 表示
  note: string          // 打完后显示的知识点提示，一句话
}
```

示例：

```json
[
  {
    "id": "py-quicksort-01",
    "title": "快速排序（Python）",
    "category": "sorting",
    "difficulty": 3,
    "text": "def quicksort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quicksort(left) + middle + quicksort(right)",
    "note": "平均时间复杂度 O(n log n)，此实现非原地排序，空间复杂度 O(n)"
  }
]
```

---

## TypingEngine 组件接口

```javascript
// Props（只有一个）
props: {
  text: {
    type: String,
    required: true
  }
}

// Emits（只有一个）
emits: ['complete']

// complete 事件携带的数据
{
  wpm: Number,       // 整数，最终每分钟字数
  accuracy: Number,  // 0-100 的浮点数，保留一位小数
  duration: Number,  // 整数，秒
  errors: Number     // 整数，总错误次数（包括同一位置多次错误）
}
```

**TypingEngine 不做以下任何事**：
- 不调用 Supabase
- 不操作路由
- 不感知用户登录状态

---

## 路由定义

```javascript
// src/router/index.js（已由 Tech Lead 配置，不要修改）

{ path: '/',              name: 'home',        component: HomeView }
{ path: '/lesson/:id',   name: 'lesson',      component: TypingView }
{ path: '/result',       name: 'result',      component: ResultView }
{ path: '/leaderboard',  name: 'leaderboard', component: LeaderboardView }
{ path: '/profile',      name: 'profile',     component: ProfileView, meta: { requiresAuth: true } }
{ path: '/login',        name: 'login',       component: LoginView }
```

---

## 跨组件数据传递

### 打字结果从 TypingView 传到 ResultView

```javascript
// TypingView.vue 里
router.push({
  name: 'result',
  state: {
    result: { wpm, accuracy, duration, errors, lessonId }
  }
})

// ResultView.vue 里
const result = history.state.result
```

---

## Pinia User Store 结构

```javascript
// src/stores/user.js
{
  session: null | SupabaseSession,
  user: null | { id: string, email: string }
}

// 使用
const userStore = useUserStore()
userStore.user?.email   // 获取邮箱
userStore.session       // 判断是否登录
```

---

## 数据访问规范

所有组件、页面和 store 都通过 `@/lib/db` 访问数据，不直接调用 Supabase。

```javascript
// 推荐：从统一数据访问入口导入
import { listUserResults } from '@/lib/db'

const { data, error } = await listUserResults(userId)
```

`@/lib/supabase` 只负责创建 Supabase client，原则上只供 `@/lib/db` 使用。

开发阶段不需要配置 Supabase 环境变量；未配置 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` 时，`@/lib/db` 自动使用 mock 数据。
上线部署或真实后端联调时，再配置 Supabase 环境变量接入真实数据。
