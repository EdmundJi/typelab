# keylab — 系统架构文档 v2

> 本文件由需求文档 `01_requirements.md` 导出，与 `SPEC.md` 保持一致。有冲突以 `SPEC.md` 为准。

---

## 1. 架构总览

keylab v2 是纯前端 SPA（Vue 3 + Vite），后端由 Supabase 托管。没有自定义服务器进程。

```
浏览器 (Vue 3 SPA)
  ├── View 层            路由级组件，协调数据和子组件
  ├── Component 层       可复用 UI 单元（TypingEngine / Leaderboard / …）
  ├── Store 层           Pinia 全局状态（user, streak）
  └── Lib 层             分三层封装
        ├── domain/      纯业务规则（streak / achievements / lessonRef）
        ├── application/ 用例编排（lessons / achievementEvaluator）
        └── adapters/    外部系统（supabase client / db）

Supabase (BaaS)
  ├── Auth              邮箱/密码认证、session 管理
  ├── PostgreSQL        results / community_lessons / achievements / paths / collections
  └── RLS               行级别权限，见 SPEC.md
```

所有组件只能通过 `@/lib/application/` 和 `@/lib/adapters/db` 访问数据，**禁止直接导入 `@/lib/adapters/supabase`**。

---

## 2. 模块定义

### M01 — LessonLoader (`src/lib/lessons.js`)

**职责**
- 加载内置 JSON 课程文件（`src/lessons/*.json`）
- 从 Supabase 查询 `status='approved'` 的社区课程
- 将 v1 旧格式自动标准化为 v2 多变体格式（见 SPEC.md）
- 按 `lesson_ref` 格式（`builtin:<id>` / `community:<uuid>`）解析单条课程
- 提供按 topic / language 筛选的列表接口

**输入**

| 函数 | 参数 |
|---|---|
| `listLessons(filters?)` | `{ topic?: string, language?: string }` |
| `getLessonById(lessonRef)` | `"builtin:py-bfs-01"` 或 `"community:<uuid>"` |
| `getVariantById(lessonRef, variantId)` | 同上 + `"py-bfs-01-v2"` |

**输出**

| 函数 | 返回值 |
|---|---|
| `listLessons` | `NormalizedLesson[]`（含 `variants[]`） |
| `getLessonById` | `NormalizedLesson \| null` |
| `getVariantById` | `Variant \| null` |

**依赖**
- `src/lib/db.js` → `queryCommunityLessons()`
- builtin JSON files（构建时静态导入）

**错误处理**
- `community:<uuid>` 不存在或未审核 → 返回 `null`，调用方负责灰显/跳过
- v1 格式中 `language` 缺失 → 默认推断规则：`warmup`/`concepts` → `"text"`，其余 → `"python"`
- Supabase 查询失败 → 降级为纯内置课程，不抛出

---

### M02 — TypingEngine (`src/components/TypingEngine/`)

**职责**
- 接受目标代码文本和语言，渲染带行号 + 语法高亮的打字区域
- 追踪用户每次按键：字符匹配、错误计数、光标位置
- 实现自动缩进（Enter 跳过前置空白）和智能 Tab（跳过一个缩进块）
- 用 `getBoundingClientRect()` 定位浮动光标元素（见 ADR-0006）
- 完成时 emit `complete`，每次按键 emit `update`
- **不感知**用户登录、变体信息、路由、Supabase（见 SPEC.md）

**输入 (props)**

```
text: string       — 要打的完整代码文本
language: string   — Prism.js 语言名，如 'python'、'javascript'
```

**输出 (emits)**

```
complete: { wpm, accuracy, duration, errors }
update:   { progress, liveWpm, liveAccuracy }
```

**内部拆分**（推荐 Composable 形式）

| 文件 | 职责 |
|---|---|
| `useTypingState.js` | 字符状态数组、光标 index、错误追踪 |
| `useWpm.js` | 计时器、WPM / 准确率计算，排除自动跳过字符 |
| `useCursor.js` | `getBoundingClientRect` 浮动光标定位 |
| `TypingEngine.vue` | 组合以上 composable，渲染 token 层 + gutter |

**依赖**
- Prism.js（语法 token 解析）
- DOM API（`getBoundingClientRect`）

**错误处理**
- Prism 不支持的语言 → fallback `'plaintext'`，不抛出
- `text` 为空字符串 → 禁用键盘监听，显示占位提示

---

### M03 — DB Layer (`src/lib/db.js`)

**职责**
- 封装所有 Supabase 表操作，对上层暴露业务语义接口
- 开发模式（未配置 `VITE_SUPABASE_URL`）自动切换为内存 mock
- 不做业务逻辑，只做数据读写和类型转换

**接口分组**

| 分组 | 函数 |
|---|---|
| 成绩 | `saveResult(payload)`, `listUserResults(userId)`, `getBestResultPerLesson(userId)` |
| 排行榜 | `getLeaderboard(lessonRef)` → 每人最高分，含 username |
| 成就 | `listUserAchievements(userId)`, `unlockAchievement(userId, achievementId)` |
| 社区 | `queryCommunityLessons(filters?)`, `submitLesson(payload)`, `reviewLesson(id, action, reason?)` |
| 路径 | `listPaths()`, `getPathItems(pathId)` |
| 收藏 | `listCollections(userId)`, `upsertCollection(...)`, `deleteCollection(id)`, `setCollectionItems(collectionId, items[])` |
| 用户 | `getProfile(userId)`, `updateUsername(userId, username)` |

**输出约定**
- 成功：返回数据对象（不包 `{ data, error }`）
- 失败：`throw Error`，调用方用 `try/catch`，不静默吞掉

**依赖**
- `src/lib/supabase.js`（仅此文件可以 import supabase client）

**错误处理**
- RLS 拒绝（401/403）→ throw，调用方处理重定向或提示
- 网络超时 → throw，调用方在 UI 层显示 toast，不阻塞结果展示

---

### M04 — Auth Store (`src/stores/user.js`)

**职责**
- 持有 `session` 和 `user`（含 username）
- 监听 Supabase `onAuthStateChange`，自动同步状态
- 提供 `login / logout / updateUsername` action

**状态**

```javascript
{
  session: null | SupabaseSession,
  user: null | { id, email, username }
}
```

**计算属性**
- `isLoggedIn: boolean`
- `isAdmin: boolean`（通过 Supabase user metadata 判断）

**依赖**
- `src/lib/supabase.js`（Auth 监听必须直接访问 client）
- `src/lib/db.js`（getProfile 读取 username）

**错误处理**
- Auth 状态监听异常 → 清空 session，不崩溃
- `updateUsername` 失败 → throw，调用方显示错误提示

---

### M05 — AchievementEvaluator (`src/lib/achievements.js`)

**职责**
- 在每次成绩保存完成后，基于全量历史数据评估应解锁哪些成就
- 写入 `user_achievements`（通过 db.js）
- 返回本次新解锁的成就 id 列表供 UI 展示气泡

**函数签名**

```javascript
evaluateAndUnlock(userId, { latestResult, allResults, currentStreak, alreadyUnlocked })
  → Promise<string[]>   // 新解锁的 achievement id 列表
```

**解锁规则表**（对应 SPEC.md）

| id | 判断依据 |
|---|---|
| `first-finish` | `allResults.length === 1` |
| `wpm-100` | `latestResult.wpm >= 100` |
| `perfect-accuracy` | `latestResult.accuracy === 100` |
| `streak-7` | `currentStreak >= 7` |
| `multilingual` | distinct languages in allResults `>= 3` |
| `contributor` | 不在此处判断，由审核流程写入 |
| `practice-50` | `allResults.length >= 50` |

**依赖**
- `src/lib/db.js` → `unlockAchievement`
- 调用方传入所有所需数据（无自行发起网络请求）

**错误处理**
- `unlockAchievement` 失败（如重复解锁被 PK 约束拒绝）→ 静默忽略，不影响结果页
- 评估函数内部不抛出，catch 后记录 console.warn

---

### M06 — StreakCalculator (`src/lib/streak.js`)

**职责**
- 接受 `results[]`（含 `created_at` UTC 时间戳），输出 Streak 指标
- 日期归属按 **UTC+8** 换算（固定偏移 +8h）
- 纯函数，无副作用，不发起网络请求

**函数签名**

```javascript
calcStreak(results: { created_at: string }[])
  → { currentStreak: number, bestStreak: number, calendarData: Record<string, number> }
```

`calendarData` key 格式：`"YYYY-MM-DD"`（UTC+8 日期），value 为当天完成次数。

**依赖**
- 无外部依赖

**错误处理**
- `results` 为空 → 返回 `{ 0, 0, {} }`
- 无效时间戳 → 跳过该条记录，不崩溃

---

### M07 — Leaderboard Module (`src/components/Leaderboard/`)

**职责**
- 接收 `lessonRef`，展示该题目下每人历史最高 WPM 排行
- 当前登录用户行高亮
- 数据按需加载（进入题目页时拉取，不全局轮询）

**组件接口**

```
props: { lessonRef: string }
```

**依赖**
- `src/lib/db.js` → `getLeaderboard(lessonRef)`
- `src/stores/user.js` → `user.id`（用于高亮自己）

**错误处理**
- 查询失败 → 显示「暂无数据」，不崩溃
- `lessonRef` 为空 → 不发起请求

---

### M08 — Community Module (`src/views/SubmitView.vue` + `AdminReviewView.vue`)

**职责**
- 投稿：表单收集 + 校验 + 提交（状态 `pending`）
- 审核：管理员列表 + 预览（含 Prism 高亮）+ 通过/拒绝操作
- 投稿者在个人主页「我的投稿」标签查看状态 + 拒绝原因

**安全**
- 代码预览通过 Prism.js 渲染（生成安全 token span），**不使用 `v-html` 直接注入原始文本**
- RLS 保证用户只能读自己的 pending/rejected 投稿
- 管理员角色通过 Supabase user metadata `role: 'admin'` 判断，路由守卫验证

**依赖**
- `src/lib/db.js` → `submitLesson`, `queryCommunityLessons`, `reviewLesson`

**错误处理**
- 提交失败 → toast 提示「提交失败，请稍后重试」，保留表单内容
- 审核操作失败 → inline 错误，不跳转

---

### M09 — LearningPath Module (`src/views/PathsView.vue`)

**职责**
- 列出系统预置路径及进度（已完成 N / 总计 M）
- 展示路径内题目序列，已完成打勾
- 按顺序进入题目练习（路由携带 `pathId + position`，完成后自动推进）

**进度计算**
- 对 `path_items[]` 中每个 `lesson_ref`，检查用户 `results` 是否有记录
- 不要求特定 `variant_id`，只要打过该 lesson 即视为完成

**依赖**
- `src/lib/db.js` → `listPaths`, `getPathItems`
- `src/lib/lessons.js` → `getLessonById`（解析 lesson_ref 获取标题）
- `src/lib/db.js` → `getBestResultPerLesson`（判断是否已完成）

**错误处理**
- `lesson_ref` 指向不存在课程 → 展示「题目已下架」，跳过该项
- 用户未登录 → 路径列表可浏览，进度均为 0，无法记录

---

### M10 — Collections Module (`src/components/Profile/`)

**职责**
- 收藏夹 CRUD（新建/重命名/删除）
- 添加/移除题目，支持拖拽排序（position 字段）
- 按收藏夹顺序依次练习（类似路径，但用户自定义）

**依赖**
- `src/lib/db.js` → collections / collection_items 操作
- `src/lib/lessons.js` → 解析 lesson_ref 渲染标题

**错误处理**
- 重复添加同一 lesson_ref → 提示「已在收藏夹中」，不重复插入
- 拖拽排序写入失败 → 乐观更新回滚，toast 提示

---

## 3. 推荐目录结构

```
src/
├── lib/
│   ├── domain/              ← 纯业务规则，不碰 DB / HTTP / 文件系统
│   │   ├── streak.js        ← Streak 计算（纯函数）
│   │   ├── achievements.js  ← 成就解锁规则（纯函数）
│   │   └── lessonRef.js     ← lesson_ref 解析/构建工具函数
│   ├── application/         ← 业务用例编排，调用 domain 和 adapters
│   │   ├── lessons.js       ← 课程加载器 + v1→v2 标准化
│   │   └── achievementEvaluator.js  ← 触发解锁流程（写 db）
│   └── adapters/            ← 外部系统实现，仅此层碰 Supabase
│       ├── supabase.js      ← Supabase client 单例，仅供 db.js 导入
│       └── db.js            ← 所有 DB 操作 + 开发 mock
│
├── components/
│   ├── TypingEngine/
│   │   ├── TypingEngine.vue
│   │   ├── useTypingState.js
│   │   ├── useWpm.js
│   │   └── useCursor.js
│   ├── Layout/
│   │   ├── AppHeader.vue
│   │   └── AppNav.vue
│   ├── Auth/
│   │   └── AuthGuard.vue
│   ├── LessonSelect/
│   │   ├── LessonCard.vue
│   │   ├── LessonFilters.vue
│   │   └── VariantSelector.vue
│   ├── Leaderboard/
│   │   └── LeaderboardTable.vue
│   ├── Profile/
│   │   ├── StreakCalendar.vue
│   │   ├── AchievementBadge.vue
│   │   ├── ResultHistoryTable.vue
│   │   ├── WpmChart.vue           ← ECharts 折线图
│   │   ├── CollectionManager.vue
│   │   └── MySubmissions.vue
│   └── Result/
│       ├── ResultStats.vue
│       └── ErrorReplay.vue
│
├── views/
│   ├── HomeView.vue
│   ├── TypingView.vue           ← 变体选择 + TypingEngine 组合
│   ├── ResultView.vue
│   ├── LeaderboardView.vue
│   ├── ProfileView.vue
│   ├── PathsView.vue
│   ├── SubmitView.vue
│   ├── AdminReviewView.vue
│   └── LoginView.vue
│
├── stores/
│   ├── user.js                  ← session + user + isAdmin
│   └── streak.js                ← streak 缓存（避免重复计算）
│
├── lessons/                     ← 内置 JSON 课程文件
│   ├── sorting.json
│   ├── trees.json
│   └── …
│
├── router/
│   └── index.js                 ← 路由定义 + meta 守卫
│
├── assets/
└── main.js
```

---

## 4. 测试策略

### 4.1 单元测试（Vitest）

优先覆盖纯函数层，无 DOM 依赖，执行快。

| 目标 | 场景 |
|---|---|
| `streak.js` | 空数据、连续 7 天、跨月、UTC+8 跨日边界（如 UTC 15:59 归前一天）|
| `achievements.js` | 每个 id 的解锁条件、重复解锁不重复写入、多语言计数去重 |
| `lessons.js` | v1→v2 标准化、lesson_ref 解析、language 推断规则、filters 组合 |
| `lessonRef.js` | parse / build 往返一致性 |
| `useWpm.js` | WPM 分母排除自动跳过字符、计时器启动/停止逻辑 |

### 4.2 组件测试（Vitest + Vue Test Utils）

| 目标 | 场景 |
|---|---|
| `TypingEngine` | 正确输入 emit complete、错误字符标红、Enter 自动缩进、Tab 跳过缩进、Prism fallback |
| `VariantSelector` | 切换变体触发 reset 事件、不存在变体灰显 |
| `LeaderboardTable` | 当前用户行高亮、空数据展示占位 |
| `StreakCalendar` | 格子颜色与 calendarData 对应、今日格子高亮 |

### 4.3 集成测试（Vitest + Supabase 测试环境）

仅覆盖 `db.js`，使用 Supabase 本地实例（`supabase start`）或测试项目。

| 场景 |
|---|
| `saveResult` 后 RLS 限制其他用户读取 |
| `getLeaderboard` 每人只取最高分 |
| `unlockAchievement` PK 冲突时幂等（不 throw） |
| `reviewLesson` 通过后查询列表可见 |

### 4.4 E2E 测试（Playwright）

覆盖核心链路，CI 上运行。

| 路径 | 步骤 |
|---|---|
| 打字核心流程 | 首页 → 选题 → 选变体 → 打字 → 结果页 |
| 登录保存成绩 | 注册 → 打字 → 结果页显示历史最佳 |
| 社区投稿 | 登录 → /submit 填表 → 提交 → 「等待审核」 |
| 管理员审核 | admin 账号 → /admin/review → 通过 → 题库可见 |
| 访客流程 | 不登录 → 打字 → 结果提示「登录后保存」 |

### 4.5 性能基准

- 打字引擎输入延迟：用 `PerformanceObserver` 在 CI 中测量 keydown → DOM 更新时间，目标 < 16ms（见非功能需求）
- 课程列表初始渲染：Lighthouse CI，FCP < 1.5s

---

## 5. 技术选型表

| 关注点 | 选择 | 备选 | 取舍说明 |
|---|---|---|---|
| 前端框架 | **Vue 3 (Composition API)** | React | v1 已采用，团队熟悉，不引入迁移成本 |
| 状态管理 | **Pinia** | Vuex 4 | Vue 官方推荐，API 更简洁，DevTools 支持好 |
| 路由 | **Vue Router 4** | TanStack Router | Vue 生态标准 |
| 构建工具 | **Vite** | Webpack | 热更新极快，打字 UI 迭代频繁时体验关键 |
| CSS | **Tailwind CSS v3** | Vanilla CSS | 工具类加速迭代；缺点：类名冗长，已被项目接受 |
| BaaS | **Supabase** | 自建 Express + PostgreSQL | 见 ADR-0001：零成本、Auth + DB 一体、RLS 替代后端鉴权 |
| 语法高亮 | **Prism.js** | highlight.js, CodeMirror | 见 ADR-0005：轻量、可访问 token 级 DOM 节点（光标定位依赖），不需要完整编辑器 |
| 图表 | **ECharts** | Chart.js | 折线图需支持大量数据点，ECharts canvas 渲染性能更优 |
| 代码执行 | **无** | Node.js sandbox / Vercel Sandbox | 见 ADR-0002：打字练习不需要运行代码 |
| 部署 | **Vercel** | Netlify | PR 预览链接、Supabase 官方集成、免费 tier 满足需求 |
| E2E 测试 | **Playwright** | Cypress | 更快、更稳定的无头模式；Cypress 免费 tier 有录制限制 |
| 组件/单元测试 | **Vitest + Vue Test Utils** | Jest | 与 Vite 共享配置，速度更快 |

---

## 6. ADR 草稿

> 编号续接已有 ADR-0001 ~ 0006。

---

### ADR-0007 — 成就解锁在客户端触发，而非数据库触发器

**状态**：提案

**背景**

成就解锁需要综合多个数据维度（历史成绩数、WPM、Streak 长度、语言种类），在用户每次完成练习后判断。可行方案：

1. **客户端触发**：结果保存成功后，前端用已有数据评估并调用 `unlockAchievement`
2. **Supabase DB Trigger**：在 `results` 表的 INSERT 触发器中运行 PL/pgSQL 评估逻辑
3. **Edge Function**：Supabase Edge Function 在插入后异步评估

**决策**

选择方案 1（客户端触发）。

**代价**

优点：
- 零服务端代码，不引入 PL/pgSQL 或 Edge Function 的维护负担
- 评估逻辑与 `achievements.js` 单元测试共存，易验证
- 解锁失败不阻塞结果展示

缺点：
- 理论上可被客户端篡改触发解锁（刷成就），但本项目无竞技价值，可接受
- 需要在前端拿到完整历史数据才能评估（已通过 `listUserResults` 拉取）

---

### ADR-0008 — Streak 在前端实时计算，不持久化到数据库

**状态**：提案

**背景**

Streak 依赖「今天」的日期，需要在每次访问个人主页时反映最新状态。可行方案：

1. **前端实时计算**：从 `results` 全量拉取并在 `streak.js` 计算
2. **数据库持久化**：专用 `user_streak` 表，每次插入 result 后更新
3. **Edge Function**：定时或触发式更新 streak 字段

**决策**

选择方案 1（前端实时计算）。

**代价**

优点：
- 无额外表和触发器，数据源唯一（`results` 表），无一致性问题
- Streak 的 UTC+8 日期计算逻辑在前端（JS）更自然，PL/pgSQL 时区处理繁琐
- `streak.js` 可单元测试，边界情况（跨日）易验证

缺点：
- 每次访问个人主页拉取 365 天的 results（最多 ~365 条，可接受）
- 若未来用户数据量暴增，需加 `created_at` 范围过滤

---

### ADR-0009 — WPM 分母仅计用户实际手动输入的字符，自动跳过字符不计

**状态**：提案

**背景**

TypingEngine 有两个快捷键：
- **自动缩进**（Enter 后自动跳过前置空白）
- **智能 Tab**（Tab/空格 跳过整个缩进块）

这些字符虽被「跳过」，但用户无需逐个按键。如果计入 WPM 分母，开启快捷键用户 WPM 会人为偏高，与关闭快捷键用户不可比较。

**决策**

WPM 分母 = 用户实际触发按键次数所对应的字符数（跳过字符不计入分母，也不计入分子）。

同一题目、相同代码长度下，关闭快捷键的用户 WPM 会更低——这是**预期行为**，在需求文档中明确标注为「不视为 bug」。

**代价**

优点：
- WPM 真实反映打字速度，不受快捷键策略影响
- 计算口径与 `useWpm.js` 单元测试预期一致

缺点：
- 不同快捷键配置下同一题目的 WPM 不可直接横向比较（排行榜变体字段已记录 `variant_id`，足以说明差异）
- 实现时 `typedCharCount`（分母）需要独立于 `cursorIndex`（位置），增加一个状态变量
