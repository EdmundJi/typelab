# keylab — 系统架构文档 v3

> 本文由 `docs/01_requirements.md`、`PLAN.md`、`PLAN_UI.md` 汇总生成。
> 目标：在不实现代码的前提下，为后续迭代提供低耦合模块划分、目录结构、测试策略、技术取舍与 ADR 草稿。
> 若本文与 `docs/01_requirements.md` 冲突，以需求文档为准；若需求文档与 `SPEC.md` 的 `Variant.id` 冲突，以现有代码/JSON 的 `variant_id` 为准，并同步修正 `SPEC.md`。

---

## 1. 架构目标与原则

### 1.1 本轮目标

keylab 本轮不是新增单点功能，而是完成两条主线：

1. **产品体验升级**：首页按登录状态分流、课程发现增强、打字页与结果页补足、Footer/404/Loading 等基础体验完善。
2. **工程化升级**：TypeScript、DbAdapter、MemoryAdapter、测试、CI、CHANGELOG、1.0.0 发布基础。

### 1.2 架构原则

| 原则 | 说明 |
|---|---|
| 低耦合 | View 只编排状态与 UI；业务规则放 `domain`；用例放 `application`；外部系统放 `adapters`。 |
| 可替换数据层 | 所有数据访问经 `DbAdapter`，Supabase 与内存实现可替换，测试不 mock 整个 db 模块。 |
| 类型集中 | 跨层共享业务类型统一放 `src/types/index.ts`。 |
| 向后兼容 | `adapters/db.ts` 继续导出旧具名函数，避免一次性大规模改动 View/Store import。 |
| UI 可组合 | Skeleton、课程卡片、结果摘要、Layout 等拆成小组件，页面只做组合。 |
| 渐进迁移 | TypeScript 迁移按 domain → application → adapters → stores/router → composables → main；只改扩展名与类型，不改业务逻辑。 |
| 性能优先 | 课程 PB 一次性读取 results 后前端聚合，禁止每张卡片单独 DB 查询；打字输入路径避免无关响应式重算。 |

---

## 2. 系统总览

keylab 是基于 Vue 3 + Vite 的纯前端 SPA，后端能力由 Supabase 托管；本地开发和单元测试通过 MemoryAdapter 替代 Supabase。

```text
Browser / Vue SPA
  ├─ Router + Guards
  ├─ Views                         路由级页面，编排用例、store、UI 组件
  ├─ Components                    低状态 UI 与交互组件
  ├─ Stores / Pinia                user、streak、theme 等跨页面状态
  ├─ Composables                   打字状态、WPM、光标等可复用逻辑
  ├─ lib/domain                    纯业务规则，无 IO
  ├─ lib/application               用例编排，依赖 domain + DbAdapter
  ├─ lib/adapters                  SupabaseAdapter / MemoryAdapter / db 兼容层
  └─ types                         跨层业务类型

External Services
  ├─ Supabase Auth                 邮箱密码登录、Session、Admin metadata
  ├─ Supabase Postgres + RLS        results、community_lessons、achievements、collections、paths
  ├─ Vercel                         静态部署 / PR Preview
  └─ GitHub Actions                 typecheck → check → test → build
```

### 2.1 依赖方向

```text
views/components/stores
        ↓
application services
        ↓
domain pure rules      adapters DbAdapter interface
        ↓                       ↓
      types               SupabaseAdapter / MemoryAdapter
```

约束：

- `domain` 不允许 import Vue、Pinia、Router、Supabase、DB adapter。
- `application` 可 import `domain`、`types`、`adapters/db`，并允许通过参数注入 adapter。
- `components/views/stores` 不直接 import `SupabaseAdapter` 或 Supabase client。
- 只有 `src/lib/adapters/supabase.ts` 创建 Supabase client；只有 `SupabaseAdapter.ts` 发起 `supabase.from(...)`。

---

## 3. 核心数据与边界

### 3.1 核心实体

| 实体 | 说明 | 类型来源 |
|---|---|---|
| `Variant` | 单个课程变体，字段必须为 `variant_id`。 | `src/types/index.ts` |
| `NormalizedLesson` | 统一后的课程结构，内置课程与社区课程都转为此结构。 | `src/types/index.ts` |
| `TypingResult` / `UserResult` | 打字结果与已保存结果。 | `src/types/index.ts` |
| `LeaderboardEntry` | 排行榜条目。 | `src/types/index.ts` |
| `CommunityLesson` | 社区投稿及审核状态。 | `src/types/index.ts` |
| `Collection` / `CollectionItem` | 收藏夹与收藏项。 | `src/types/index.ts` |
| `Path` / `PathItem` | 学习路径与路径内课程。 | `src/types/index.ts` |
| `Achievement` / `CheckContext` | 成就规则与评估上下文。 | `src/types/index.ts` |
| `Session` / `AuthResponse` | 简化后的认证类型。 | `src/types/index.ts` |

### 3.2 课程引用格式

课程引用统一使用 `lesson_ref`：

```text
builtin:<lessonId>
community:<communityLessonId>
```

由 `src/lib/domain/lessonRef.ts` 负责 parse/build/validate，避免 View 里拼接字符串。

---

## 4. 模块拆分

### M01 — 类型中心模块

| 项目 | 内容 |
|---|---|
| 位置 | `src/types/index.ts` |
| 职责 | 定义跨层共享类型：课程、结果、排行榜、收藏、社区投稿、路径、成就、Session、AuthResponse。 |
| 输入 | 无运行时输入；由开发者维护 TypeScript interface/type。 |
| 输出 | 可被 `domain`、`application`、`adapters`、`stores`、组件引用的类型。 |
| 依赖 | 无运行时依赖；不依赖 Vue/Supabase。 |
| 错误处理 | 编译期通过 `vue-tsc --noEmit` 捕获字段不一致；`Variant` 必须保留 `variant_id`。 |

---

### M02 — Domain / LessonRef 模块

| 项目 | 内容 |
|---|---|
| 位置 | `src/lib/domain/lessonRef.ts` |
| 职责 | 构造、解析、校验 `builtin:*` / `community:*` 课程引用。 |
| 输入 | `type`、`id` 或完整 `lessonRef` 字符串。 |
| 输出 | `{ type, id }`、合法字符串、布尔校验结果。 |
| 依赖 | 仅依赖 TypeScript 标准能力。 |
| 错误处理 | 非法格式返回 `null` 或抛出受控错误；调用方不得假设任意字符串都合法。 |

---

### M03 — Domain / Streak 模块

| 项目 | 内容 |
|---|---|
| 位置 | `src/lib/domain/streak.ts` |
| 职责 | 根据 results 计算当前连续天数、最佳连续天数、日历热力数据；日期归属按 UTC+8。 |
| 输入 | `Array<{ created_at: string }>` 或等价结果数组。 |
| 输出 | `{ currentStreak, bestStreak, calendarData, practicedToday? }`。 |
| 依赖 | 无 DB / Vue 依赖。 |
| 错误处理 | 空数组返回 0；无效时间戳跳过；不因单条坏数据中断计算。 |

---

### M04 — Domain / Achievements 模块

| 项目 | 内容 |
|---|---|
| 位置 | `src/lib/domain/achievements.ts` |
| 职责 | 维护成就定义和纯判断规则。 |
| 输入 | `CheckContext`：全量结果、最新结果、当前 streak、已解锁 ID。 |
| 输出 | 应解锁的 achievement id 列表。 |
| 依赖 | `src/types/index.ts`。 |
| 错误处理 | 已解锁成就不重复返回；缺失可选字段按安全默认值处理。 |

---

### M05 — Application / Lessons 用例模块

| 项目 | 内容 |
|---|---|
| 位置 | `src/lib/application/lessons.ts` |
| 职责 | 合并内置 JSON 课程与审核通过的社区课程；v1/v2 标准化；按搜索/分类/语言支持上层过滤；按 lesson_ref 获取课程。 |
| 输入 | `listLessons(filters = {}, adapter = db)`、`getLessonById(ref, adapter = db)`；过滤条件可含 `category/topic/language/search/status`。 |
| 输出 | `Promise<NormalizedLesson[]>` 或 `Promise<NormalizedLesson | null>`。 |
| 依赖 | `src/lessons/index.ts`、`DbAdapter.queryCommunityLessons`、`lessonRef`、共享类型。 |
| 错误处理 | 社区查询失败时降级为只返回内置课程并记录警告；未审核/拒绝社区课程不得进入首页；未知 ref 返回 `null`。 |

关键要求：

- `LessonSelect/index.vue` 必须调用本模块 `listLessons()`，不能只读静态 `lessonMetas`。
- 加载期间向 UI 暴露 loading 状态。
- 语言列表来自 `lesson.variants.map(v => v.language)` 聚合。

---

### M06 — Application / AchievementEvaluator 用例模块

| 项目 | 内容 |
|---|---|
| 位置 | `src/lib/application/achievementEvaluator.ts` |
| 职责 | 在保存成绩后，根据 domain 规则和 adapter 写入新解锁成就。 |
| 输入 | `userId`、`latestResult`、`allResults`、`currentStreak`、可选 adapter。 |
| 输出 | `Promise<string[]>`：本次新解锁成就 ID。 |
| 依赖 | `domain/achievements`、`DbAdapter.listUserAchievements`、`DbAdapter.unlockAchievement`。 |
| 错误处理 | 单个成就写入失败不阻塞结果页；重复解锁视为幂等；捕获错误并返回已成功解锁列表。 |

---

### M07 — Adapters / DbAdapter 接口模块

| 项目 | 内容 |
|---|---|
| 位置 | `src/lib/adapters/types.ts` |
| 职责 | 定义 `DbAdapter` 与 `Subscription` 接口，覆盖 Auth、Results、Achievements、Community、Collections、Paths。 |
| 输入 | 方法参数：登录凭据、result payload、userId、lessonId、投稿/审核/收藏/路径参数。 |
| 输出 | 与 Supabase 风格兼容的 `{ data, error }` 或明确的数组/void。 |
| 依赖 | `src/types/index.ts`。 |
| 错误处理 | 接口层不吞错；实现层将外部错误统一转为 `Error | null`，方便 UI 显示。 |

接口必须覆盖：

- Auth：`getCurrentSession`、`onAuthStateChange`、`signInWithPassword`、`signUp`、`signOut`
- Results：`saveResult`、`listUserResults`、`getBestLessonWpm`、`listLeaderboard`
- Achievements：`listUserAchievements`、`unlockAchievement`
- Community：`queryCommunityLessons`、`submitLesson`、`listMySubmissions`、`listPendingSubmissions`、`reviewLesson`
- Collections：`createCollection`、`listCollections`、`addToCollection`、`removeFromCollection`、`deleteCollection`、`getCollectionStatus`
- Paths：`listPaths`、`getPathById`

---

### M08 — Adapters / MemoryAdapter 模块

| 项目 | 内容 |
|---|---|
| 位置 | `src/lib/adapters/MemoryAdapter.ts` |
| 职责 | 用 Map + 数组实现完整 `DbAdapter`，用于无 Supabase 环境、本地开发和单元测试。 |
| 输入 | 与 `DbAdapter` 一致；构造函数可接受 fixture seed。 |
| 输出 | 与 `DbAdapter` 一致。 |
| 依赖 | `src/types/index.ts`、`adapters/types.ts`；不依赖 Supabase。 |
| 错误处理 | 模拟唯一约束/不存在数据/权限不足等业务错误；提供 `reset()` 清空状态，避免测试间泄漏。 |

约束：

- 不使用模块级可变数组保存状态。
- 默认状态不内置 mock paths；paths fixture 放 `tests/fixtures/paths.ts`。
- 测试通过创建 `new MemoryAdapter()` 注入，而不是 `vi.mock('@/lib/adapters/db')`。

---

### M09 — Adapters / SupabaseAdapter 模块

| 项目 | 内容 |
|---|---|
| 位置 | `src/lib/adapters/SupabaseAdapter.ts` |
| 职责 | 封装所有 `supabase.auth.*` 与 `supabase.from(...)` 调用，实现 `DbAdapter`。 |
| 输入 | 构造函数接收 Supabase client；方法参数与 `DbAdapter` 一致。 |
| 输出 | 与 `DbAdapter` 一致，负责 Supabase row 与应用类型之间的映射。 |
| 依赖 | `@supabase/supabase-js` client、共享类型、adapter 接口。 |
| 错误处理 | Supabase error 转为 `{ error }`；RLS/网络错误不在 adapter 内直接触发 UI 跳转。 |

约束：

- 便于测试时注入 mock client。
- 不纳入单元测试覆盖率阈值，未来通过集成测试覆盖。

---

### M10 — Adapters / db 兼容门面模块

| 项目 | 内容 |
|---|---|
| 位置 | `src/lib/adapters/db.ts` |
| 职责 | 根据 `isSupabaseConfigured` 选择 `SupabaseAdapter` 或 `MemoryAdapter`；导出 `db: DbAdapter`；兼容导出旧具名函数。 |
| 输入 | 环境变量、Supabase client、业务方法参数。 |
| 输出 | `db` 实例和具名函数，如 `listUserResults`、`saveResult` 等。 |
| 依赖 | `supabase.ts`、`MemoryAdapter`、`SupabaseAdapter`、`DbAdapter`。 |
| 错误处理 | 环境未配置时自动走 MemoryAdapter；配置异常时应暴露可诊断错误，不让 View 直接崩溃。 |

---

### M11 — Auth / User Store 模块

| 项目 | 内容 |
|---|---|
| 位置 | `src/stores/user.ts` |
| 职责 | 持有 session、user 派生字段、登录状态、管理员状态；封装登录/注册/退出。 |
| 输入 | adapter auth 响应、用户输入凭据、auth state change 事件。 |
| 输出 | `session`、`user`、`isLoggedIn`、`isAdmin`、actions。 |
| 依赖 | `adapters/db.ts`、Pinia、共享类型。 |
| 错误处理 | 登录/注册错误返回给调用方显示；session 失效时清空状态；管理员判断兼容 `role` 与 `user_metadata.role`。 |

---

### M12 — Streak Store / Dashboard 数据模块

| 项目 | 内容 |
|---|---|
| 位置 | `src/stores/streak.ts` |
| 职责 | 为首页登录用户 Dashboard 和个人页缓存 streak、练习次数、本周次数、个人最佳 WPM 等聚合数据。 |
| 输入 | `userId`、可选 adapter。 |
| 输出 | dashboard state：`currentStreak`、`practicedToday`、`totalCount`、`weekCount`、`bestWpm`、loading/error。 |
| 依赖 | `DbAdapter.listUserResults`、`domain/streak`、Pinia。 |
| 错误处理 | 未登录时 state 归零；查询失败保留空状态并暴露 error；刷新过程提供 skeleton loading。 |

---

### M13 — Router / Guard 模块

| 项目 | 内容 |
|---|---|
| 位置 | `src/router/index.ts` |
| 职责 | 定义路由、meta 权限、404 catch-all、登录/管理员守卫。 |
| 输入 | URL、route meta、user store 状态。 |
| 输出 | 目标组件或重定向 `/login`、`/`、`NotFoundView`。 |
| 依赖 | Vue Router、user store。 |
| 错误处理 | 无 meta 正常放行；未登录访问 `requiresAuth` 转 `/login`；非管理员访问 `requiresAdmin` 转首页；未知路由进入 404。 |

---

### M14 — Home / Lesson Discovery UI 模块

| 项目 | 内容 |
|---|---|
| 位置 | `src/views/HomeView.vue`、`src/components/LessonSelect/*` |
| 职责 | 首页按游客/登录用户两路渲染；展示课程列表、搜索、分类、语言筛选、课程卡片、PB WPM。 |
| 输入 | 登录状态、dashboard 数据、`listLessons()` 返回课程、用户 results 聚合 Map、筛选条件。 |
| 输出 | Hero/卖点/CTA、Dashboard、继续上次/推荐课程、学习路径入口、课程列表。 |
| 依赖 | user store、streak/dashboard store、Lessons application、DbAdapter.listUserResults、Skeleton 组件。 |
| 错误处理 | 课程加载失败显示内置课程或空状态；loading 显示 3 个 SkeletonCard；PB 查询失败不影响课程列表。 |

性能约束：

- 登录用户课程 PB 必须一次性 `listUserResults(userId)` 后用 Map 聚合；禁止每张卡片调用 `getBestLessonWpm`。

---

### M15 — Typing Engine 模块

| 项目 | 内容 |
|---|---|
| 位置 | `src/components/TypingEngine/`、相关 composables |
| 职责 | 渲染目标代码、处理键盘输入、错误计数、WPM、准确率、自动跳过字符、Esc reset、当前行/总行数。 |
| 输入 | props：目标 `text/code`、`language`、可选 reset key；用户 keydown 事件。 |
| 输出 | emits：`update`、`complete`、`reset`；UI stats：WPM、准确率、错误数、行 `current/total`。 |
| 依赖 | Prism.js、DOM API、`useTypingState`、`useWpm`、`useCursor`。 |
| 错误处理 | 未知语言 fallback plaintext；空代码禁用输入；Esc 只发 reset，不直接改路由；DOM layout 失败时光标退化为默认位置。 |

---

### M16 — Typing View / Result Flow 模块

| 项目 | 内容 |
|---|---|
| 位置 | `src/views/TypingView.vue`、`src/views/ResultView.vue`、`src/components/Result/*` |
| 职责 | 加载课程/变体、接收打字完成、保存成绩、触发成就、展示结果、个人最佳反馈、推荐下一课、复制成绩。 |
| 输入 | route params/query、TypingEngine complete payload、用户 session、课程列表/历史 results。 |
| 输出 | 保存结果、结果页状态、`首次完成` / `新纪录` / `距最佳 -X wpm`、推荐下一课、复制文本。 |
| 依赖 | Lessons application、DbAdapter、AchievementEvaluator、user/streak store、Clipboard API。 |
| 错误处理 | 游客完成不保存但可看结果；保存失败仍展示本次成绩并提示；clipboard 失败显示可恢复错误；推荐失败隐藏推荐区。 |

---

### M17 — Leaderboard 模块

| 项目 | 内容 |
|---|---|
| 位置 | `src/views/LeaderboardView.vue`、可选 `src/components/Leaderboard/*` |
| 职责 | 展示全局/课程排行榜、当前用户高亮与“你的排名：第 X 名”、空状态 CTA。 |
| 输入 | `listLeaderboard()` 数据、当前 userId。 |
| 输出 | 排行榜表格、当前排名提示、空状态“还没有人上榜，成为第一个吧”。 |
| 依赖 | DbAdapter、user store、SkeletonRow。 |
| 错误处理 | loading 显示 5 行 SkeletonRow；查询失败显示错误/重试；无记录显示 CTA 去练习。 |

---

### M18 — Community Submission / Admin Review 模块

| 项目 | 内容 |
|---|---|
| 位置 | `src/views/SubmitView.vue`、`src/views/AdminReviewView.vue`、Profile 中“我的投稿”区域 |
| 职责 | 登录用户投稿、查看投稿状态；管理员审核 pending 投稿，批准后进入课程发现。 |
| 输入 | 投稿表单、管理员审核动作、当前 user/admin 状态。 |
| 输出 | `CommunityLesson`、审核状态、拒绝原因、课程列表中的 approved 课程。 |
| 依赖 | DbAdapter community 方法、router guard、Prism 预览。 |
| 错误处理 | 未登录投稿转登录；非管理员访问审核页转首页；提交/审核失败保留表单状态并提示。 |

---

### M19 — Collections 模块

| 项目 | 内容 |
|---|---|
| 位置 | `src/components/Profile/Collection*`、课程卡片收藏入口（如已有） |
| 职责 | 收藏夹创建、列表、添加/移除课程、删除收藏夹、查询课程收藏状态。 |
| 输入 | userId、collectionId、lessonRef、收藏夹名称。 |
| 输出 | 收藏夹列表、收藏状态、CollectionItem。 |
| 依赖 | DbAdapter collections 方法、lessonRef、Lessons application。 |
| 错误处理 | 重复添加提示“已在收藏夹中”；删除失败回滚 UI；未登录隐藏或引导登录。 |

---

### M20 — Learning Paths 模块

| 项目 | 内容 |
|---|---|
| 位置 | `src/views/PathsView.vue`、首页“学习路径 →”入口 |
| 职责 | 展示路径列表/详情，根据 results 计算路径进度，引导下一题。 |
| 输入 | `listPaths()`、`getPathById()`、用户 results、pathId。 |
| 输出 | 路径卡片、路径详情、完成进度、下一题入口。 |
| 依赖 | DbAdapter paths/results 方法、Lessons application。 |
| 错误处理 | 未登录可浏览但进度为 0；路径不存在显示 404/空状态；lesson_ref 失效时标记“题目已下架”。 |

---

### M21 — Layout / 基础 UI 模块

| 项目 | 内容 |
|---|---|
| 位置 | `src/components/Layout/AppLayout.vue`、`AppFooter.vue`、`src/views/NotFoundView.vue`、`src/components/ui/SkeletonCard.vue`、`SkeletonRow.vue` |
| 职责 | 全局布局、Footer、404、统一 skeleton loading。 |
| 输入 | 路由内容、loading 状态。 |
| 输出 | Navbar + main + Footer；404 页面；卡片/行 skeleton。 |
| 依赖 | Vue Router、Tailwind/主题变量。 |
| 错误处理 | Layout 不处理业务错误；404 提供返回首页链接；Skeleton 无业务逻辑。 |

---

### M22 — Theme / Avatar / 辅助模块

| 项目 | 内容 |
|---|---|
| 位置 | `src/stores/theme.ts`、`src/lib/avatar.ts` |
| 职责 | 主题切换；根据邮箱/用户名生成稳定头像标识与颜色。 |
| 输入 | 用户偏好、localStorage、email/name 字符串。 |
| 输出 | theme state、class 切换、avatar 文本/颜色。 |
| 依赖 | Pinia、浏览器 localStorage；avatar 为纯函数。 |
| 错误处理 | localStorage 不可用时使用默认主题；空字符串头像使用安全默认值。 |

---

## 5. 关键业务流

### 5.1 游客首页到完成练习

```text
HomeView(游客 Hero + 课程列表)
  → LessonSelect 调 listLessons()
  → TypingView 调 getLessonById(ref)
  → TypingEngine complete
  → ResultView 展示本次成绩
  → 不调用 saveResult，提示登录后保存
```

### 5.2 登录用户首页 Dashboard

```text
UserStore 初始化 session
  → HomeView 进入登录用户分支
  → Streak/Dashboard store 调 listUserResults(userId)
  → domain/streak 计算 streak
  → 前端聚合总次数、本周次数、bestWpm、lastLesson、PB Map
  → 渲染 Dashboard + 继续上次/推荐课程 + 学习路径入口
```

### 5.3 课程发现与 PB 聚合

```text
LessonSelect loading
  → application/listLessons(adapter)
      → builtin lessons + approved community lessons
  → 若已登录：listUserResults(userId) 一次
      → Map<lesson_id, bestWpm>
  → LessonFilter 组合 search/category/language
  → LessonCard 展示 tags/languages/pb
```

### 5.4 成绩保存与成就解锁

```text
TypingEngine complete
  → TypingView/Result flow 构造 TypingResult
  → db.saveResult(result)
  → db.listUserResults(userId)
  → domain/streak 计算 currentStreak
  → achievementEvaluator.evaluateAndUnlock(..., adapter)
  → ResultSummary 展示首次/新纪录/距最佳
  → Streak store refresh
```

### 5.5 社区课程审核进入首页

```text
SubmitView submitLesson(status=pending)
  → AdminReviewView listPendingSubmissions()
  → reviewLesson(approved=true)
  → Home/LessonSelect listLessons()
  → queryCommunityLessons({ status: 'approved' })
  → 标准化为 NormalizedLesson 后展示
```

---

## 6. 推荐目录结构

```text
src/
├── main.ts
├── types/
│   └── index.ts
├── router/
│   └── index.ts
├── stores/
│   ├── user.ts
│   ├── streak.ts
│   └── theme.ts
├── lib/
│   ├── avatar.ts
│   ├── domain/
│   │   ├── lessonRef.ts
│   │   ├── achievements.ts
│   │   └── streak.ts
│   ├── application/
│   │   ├── lessons.ts
│   │   └── achievementEvaluator.ts
│   └── adapters/
│       ├── types.ts
│       ├── supabase.ts
│       ├── SupabaseAdapter.ts
│       ├── MemoryAdapter.ts
│       └── db.ts
├── lessons/
│   ├── index.ts
│   └── *.json
├── composables/
│   └── ...
├── components/
│   ├── Layout/
│   │   ├── AppLayout.vue
│   │   ├── AppHeader.vue
│   │   ├── AppNav.vue
│   │   └── AppFooter.vue
│   ├── LessonSelect/
│   │   ├── index.vue
│   │   ├── LessonFilter.vue
│   │   └── LessonCard.vue
│   ├── TypingEngine/
│   │   ├── TypingEngine.vue
│   │   ├── useTypingState.ts
│   │   ├── useWpm.ts
│   │   └── useCursor.ts
│   ├── Result/
│   │   └── ResultSummary.vue
│   ├── Leaderboard/
│   │   └── LeaderboardTable.vue
│   ├── Profile/
│   │   ├── StreakCalendar.vue
│   │   ├── AchievementBadge.vue
│   │   ├── ResultHistoryTable.vue
│   │   ├── CollectionManager.vue
│   │   └── MySubmissions.vue
│   └── ui/
│       ├── SkeletonCard.vue
│       └── SkeletonRow.vue
├── views/
│   ├── HomeView.vue
│   ├── TypingView.vue
│   ├── ResultView.vue
│   ├── LoginView.vue
│   ├── LeaderboardView.vue
│   ├── ProfileView.vue
│   ├── PathsView.vue
│   ├── SubmitView.vue
│   ├── AdminReviewView.vue
│   └── NotFoundView.vue
└── assets/

tests/
├── README.md
├── fixtures/
│   └── paths.ts
└── unit/
    ├── adapters/
    │   └── MemoryAdapter.test.ts
    ├── application/
    │   ├── achievementEvaluator.test.ts
    │   └── lessons.test.ts
    ├── domain/
    │   ├── lessonRef.test.ts
    │   ├── achievements.test.ts
    │   └── streak.test.ts
    ├── lib/
    │   └── avatar.test.ts
    ├── router/
    │   └── guards.test.ts
    └── stores/
        ├── streak.test.ts
        └── user.test.ts
```

工程根目录新增/调整：

```text
tsconfig.json
tsconfig.app.json
tsconfig.node.json
vite.config.ts
.github/workflows/ci.yml
CHANGELOG.md
```

---

## 7. TypeScript 迁移架构

### 7.1 迁移顺序

```text
domain → application → adapters → stores/router → composables → main → Vue SFC script setup lang="ts"
```

### 7.2 迁移约束

- 每次迁移只允许改扩展名和补类型注解，不改业务逻辑。
- `vite.config.js` 仅重命名为 `vite.config.ts`，不做逻辑变化。
- 所有 `.vue` 的 `<script setup>` 改为 `<script setup lang="ts">`。
- `TypingEngine`、`TypingView` 必须重点检查 `defineProps` / `defineEmits` 类型。
- `package.json` 新增 `typecheck: vue-tsc --noEmit`。

### 7.3 必迁移文件

| 旧路径 | 新路径 |
|---|---|
| `src/lib/domain/lessonRef.js` | `src/lib/domain/lessonRef.ts` |
| `src/lib/domain/achievements.js` | `src/lib/domain/achievements.ts` |
| `src/lib/domain/streak.js` | `src/lib/domain/streak.ts` |
| `src/lib/avatar.js` | `src/lib/avatar.ts` |
| `src/lib/application/achievementEvaluator.js` | `src/lib/application/achievementEvaluator.ts` |
| `src/lib/application/lessons.js` | `src/lib/application/lessons.ts` |
| `src/stores/user.js` | `src/stores/user.ts` |
| `src/stores/streak.js` | `src/stores/streak.ts` |
| `src/stores/theme.js` | `src/stores/theme.ts` |
| `src/router/index.js` | `src/router/index.ts` |
| `src/lessons/index.js` | `src/lessons/index.ts` |
| `src/main.js` | `src/main.ts` |
| `vite.config.js` | `vite.config.ts` |

---

## 8. 测试策略

### 8.1 测试分层

| 层级 | 工具 | 覆盖对象 | 目标 |
|---|---|---|---|
| 纯函数单元测试 | Vitest | `domain/*`、`avatar`、`useWpm`、`useTypingState` | 快速覆盖边界条件。 |
| Application 单元测试 | Vitest + MemoryAdapter | `lessons`、`achievementEvaluator` | 验证用例编排与 adapter 注入。 |
| Adapter 单元测试 | Vitest | `MemoryAdapter` | 验证内存实现等价于预期 db 行为。 |
| Store 单元测试 | Vitest + Pinia | `user`、`streak`、`theme` | 验证状态派生和 refresh。 |
| Router 单元测试 | Vitest | guards | 验证权限和 404。 |
| 组件轻量测试 | Vue Test Utils | ResultSummary、LessonFilter、LessonCard、Skeleton | 测 UI 分支和事件，不测复杂 layout。 |
| 构建/类型检查 | vue-tsc、Vite | 全项目 | CI 阶段阻断类型和构建错误。 |

### 8.2 必测范围

| 文件 | 重点用例 |
|---|---|
| `tests/unit/adapters/MemoryAdapter.test.ts` | Auth、results、leaderboard、achievements、community、collections、paths、reset，共约 25 例。 |
| `tests/unit/application/lessons.test.ts` | 内置课程 + approved 社区课程、过滤组合、v1/v2 标准化、未审核不展示、adapter 注入。 |
| `tests/unit/application/achievementEvaluator.test.ts` | 删除模块级 `vi.mock`，注入 MemoryAdapter；重复解锁幂等。 |
| `tests/unit/lib/avatar.test.ts` | 空字符串、单字符、颜色一致性、哈希稳定性。 |
| `tests/unit/stores/streak.test.ts` | refresh 注入 MemoryAdapter 后 state 更新、未登录归零、错误状态。 |
| `tests/unit/stores/user.test.ts` | `setSession`、`clearSession`、`user` 派生字段、管理员判断。 |
| `tests/unit/router/guards.test.ts` | `requiresAuth`、`requiresAdmin`、无 meta 放行、catch-all。 |
| `tests/unit/domain/streak.test.ts` | UTC+8 跨日、连续天数、断档、无效时间戳。 |
| `tests/unit/components/ResultSummary.test.ts` | 首次完成、新纪录、距最佳三种视觉状态。 |
| `tests/unit/components/LessonFilter.test.ts` | 搜索、分类、语言筛选组合。 |

### 8.3 不纳入单元测试范围

必须记录在 `tests/README.md`：

- `useCursor.ts`：依赖 `getBoundingClientRect`，jsdom 无法可靠模拟。
- `TypingEngine.vue` 整体组件测试：依赖 DOM layout；核心逻辑由 `useTypingState` + `useWpm` 覆盖。
- `SupabaseAdapter.ts`：真实 Supabase/RLS/网络行为不纳入单元测试覆盖率；后续可做集成测试。

### 8.4 覆盖率策略

`vite.config.ts` 配置：

- provider：`v8`
- include：`src/lib/**`、`src/stores/**`、`src/router/**`
- exclude：`src/lib/adapters/supabase.ts`、`src/lib/adapters/SupabaseAdapter.ts`
- thresholds：lines 80、functions 80

### 8.5 CI 策略

GitHub Actions `ci.yml`：

```text
npm ci
npm run typecheck
npm run check
npm run test
npm run build
```

要求：

- push / PR 到 `main`、`dev` 触发。
- Node.js 20 + npm cache。
- `typecheck` 失败立即停止。
- `build` 放最后。
- 现有 `leaderboard.yml` 保持不变。

---

## 9. 技术选型表

| 关注点 | 推荐选择 | 备选 | 取舍说明 |
|---|---|---|---|
| 前端框架 | Vue 3 Composition API | React | 项目既有技术栈，迁移成本最低；组合式 API 适合拆分打字逻辑。 |
| 构建工具 | Vite 5 | Webpack / Rspack | 已使用；开发启动快，Vitest 可复用配置。 |
| 语言 | TypeScript strict | JavaScript + JSDoc | 本轮工程化重点；能约束课程格式、adapter、store。 |
| 类型检查 | vue-tsc | tsc only | Vue SFC 需要 vue-tsc 才能检查模板和 props/emits。 |
| 状态管理 | Pinia | Vuex | 已使用；API 简洁，适合 user/streak/theme。 |
| 路由 | Vue Router 4 | TanStack Router | Vue 官方生态；meta guard 满足 auth/admin/404。 |
| 样式 | Tailwind CSS + 现有主题变量 | CSS Modules | 已使用；快速实现 skeleton、monospace 极简风。 |
| 代码格式/检查 | Biome | ESLint + Prettier | 项目已配置；CI 继续使用 `npm run check`。 |
| 后端/BaaS | Supabase | 自建 Node/Express + PostgreSQL | Auth、Postgres、RLS 免费层足够；无需维护后端服务。 |
| 数据访问抽象 | DbAdapter + SupabaseAdapter/MemoryAdapter | 直接 import db 函数 / vi.mock | 降低耦合，测试可注入，避免 mock 与真实逻辑漂移。 |
| 本地/测试数据 | MemoryAdapter | MSW / Supabase local | 单元测试最快；Supabase local 可留给未来集成测试。 |
| 语法高亮 | Prism.js | highlight.js / CodeMirror | 已使用且轻量；只需展示 token，不需要完整编辑器。 |
| 图表 | ECharts | Chart.js | 已使用；个人趋势图/热力图扩展能力强。 |
| 单元测试 | Vitest | Jest | 与 Vite 生态一致，启动快。 |
| Vue 组件测试 | Vue Test Utils | Testing Library | 项目已有依赖；适合断言 props/emits/渲染分支。 |
| 覆盖率 | @vitest/coverage-v8 | Istanbul only | 已有依赖；V8 原生覆盖率快。 |
| CI | GitHub Actions | Vercel build only | PR 阶段提前阻断 typecheck/check/test/build。 |
| 部署 | Vercel 免费层 | Netlify | 静态 SPA 部署简单；PR Preview 友好。 |
| 剪贴板 | `navigator.clipboard.writeText` | execCommand | 现代浏览器支持；目标 Chrome/Edge 110+。 |
| 推荐算法 | 简单同 category 随机 | 个性化推荐模型 | 课程量小，复杂算法无意义；满足“推荐下一课”即可。 |

---

## 10. 重要架构决策 ADR 草稿

> 以下为草稿，可后续拆分到 `docs/adr/`。已有 ADR 不必重复改写；新编号建议从当前目录已有编号之后续接。

### ADR-0005 — 保留 `variant_id`，修正 SPEC 文档错误

**状态**：提案
**背景**：`SPEC.md` 曾将 Variant 字段写为 `id`，但 JSON 文件与现有代码均使用 `variant_id`。
**决策**：TypeScript 类型、业务代码、测试都使用 `variant_id`；同步修正 `SPEC.md`。
**后果**：避免批量迁移 JSON 与旧代码；类型系统可防止再次误用 `id`。

### ADR-0006 — 通过 DbAdapter 隔离 Supabase 与业务代码

**状态**：提案
**背景**：旧 `db.js` 同时包含 Supabase 逻辑和 mock 分支，导致测试依赖 `vi.mock`，真实与 mock 容易漂移。
**决策**：定义 `DbAdapter`；实现 `SupabaseAdapter` 与 `MemoryAdapter`；`db.ts` 作为兼容门面。
**后果**：业务层可注入 adapter，测试无需 mock 整个模块；代价是短期拆分文件和补类型成本增加。

### ADR-0007 — `db.ts` 保持旧具名函数兼容导出

**状态**：提案
**背景**：现有组件和 store 可能大量从 `db.js` 具名导入函数。若一次性改为 `db.method()`，会引发大范围 UI 文件变更。
**决策**：`db.ts` 导出 `db: DbAdapter`，同时重新导出所有旧具名函数。
**后果**：降低迁移风险；后续可逐步收敛为注入式调用。

### ADR-0008 — MemoryAdapter 不内置 paths mock 数据

**状态**：提案
**背景**：旧 mock 数据进入生产包会造成语义混乱，也让测试 fixture 与运行时状态耦合。
**决策**：MemoryAdapter 默认空状态；测试需要 paths 时从 `tests/fixtures/paths.ts` seed。
**后果**：测试更显式，生产构建不携带无关 mock paths；开发环境需要显式 seed 才有路径演示数据。

### ADR-0009 — 登录用户课程 PB 在前端批量聚合

**状态**：提案
**背景**：课程卡片要展示个人最佳 WPM；逐卡调用 DB 会产生 N+1 查询。
**决策**：进入课程列表时一次性 `listUserResults(userId)`，在前端用 `Map<lessonId, bestWpm>` 聚合。
**后果**：显著减少请求；用户历史非常大时可后续增加分页或服务端聚合接口。

### ADR-0010 — 社区课程统一走 `listLessons()` 进入首页

**状态**：提案
**背景**：直接使用静态 `lessonMetas` 会遗漏审核通过的社区课程。
**决策**：课程列表 UI 只调用 application 层 `listLessons()`；静态课程索引只作为 application 的输入之一。
**后果**：首页课程发现与课程详情逻辑一致；需要 loading/skeleton 处理异步加载。

### ADR-0011 — TypingEngine 只发 reset 事件，不直接重载课程

**状态**：提案
**背景**：Esc reset 需要清空输入、计时、错误与进度；课程/变体加载属于 View 责任。
**决策**：`TypingEngine` 在 Escape 时 `emit('reset')`；`TypingView` 负责重新加载当前课程/变体或刷新 reset key。
**后果**：TypingEngine 保持无路由/无数据依赖；测试 focus 在事件而非页面行为。

### ADR-0012 — Skeleton 作为统一 Loading 反馈

**状态**：提案
**背景**：简单“加载中...”容易造成页面空白感，需求要求统一 skeleton。
**决策**：新增 `SkeletonCard`、`SkeletonRow`，课程列表/排行榜/个人主页复用。
**后果**：视觉一致；组件本身保持无业务逻辑。

### ADR-0013 — 不对 `useCursor` 与完整 TypingEngine 做 jsdom layout 单测

**状态**：提案
**背景**：光标定位依赖 `getBoundingClientRect`，jsdom 无真实 layout。
**决策**：`useCursor` 与完整 `TypingEngine.vue` DOM layout 测试不纳入单元测试范围；核心逻辑由 `useTypingState`、`useWpm` 覆盖，并在 `tests/README.md` 记录。
**后果**：避免脆弱测试；若未来需要，可用 Playwright 做浏览器级回归。

### ADR-0014 — SupabaseAdapter 排除在单元覆盖率阈值外

**状态**：提案
**背景**：SupabaseAdapter 的价值在真实 Supabase/RLS 交互，mock client 单测收益低。
**决策**：coverage exclude `supabase.ts` 与 `SupabaseAdapter.ts`；单测集中覆盖 MemoryAdapter 和 application 注入。
**后果**：覆盖率更真实；未来可补 Supabase local 集成测试。

### ADR-0015 — 结果页推荐下一课使用轻量同分类随机策略

**状态**：提案
**背景**：内容库规模小，复杂推荐算法维护成本高。
**决策**：优先同 category 未完成课程；无法判断未完成时从同 category 随机。
**后果**：实现简单、可解释；个性化推荐留待课程量增长后再设计。

---

## 11. 非功能需求落点

| 需求 | 架构落点 |
|---|---|
| 打字输入不卡顿 | TypingEngine 内部状态最小化；WPM/光标逻辑拆 composable；避免每次 keydown 触发全页状态更新。 |
| PB 聚合无 N+1 | Home/LessonSelect 一次性读取 results，前端 Map 聚合。 |
| Loading 不空白 | SkeletonCard/SkeletonRow 统一占位。 |
| Chrome/Edge 110+ | 可使用 Clipboard API、现代 ES2022、CSS 动画。 |
| 免费层部署 | Vercel 静态托管 + Supabase 免费层 + GitHub Actions。 |
| 可维护性 | `types`、`domain`、`application`、`adapters` 分层；CI 运行 typecheck/check/test/build。 |

---

## 12. 执行优先级建议

按需求文档的产品优先级：

```text
1. 修复社区课程不出现在首页：LessonSelect → listLessons()
2. 新增 404 页与 catch-all route
3. 首页分游客 / 登录用户两路渲染
4. 成绩页升级：PB 反馈、推荐下一课、复制成绩
5. Footer
6. 登录页、排行榜、打字页、课程卡片、Loading 打磨
7. TypeScript 基础设施
8. DbAdapter 重构
9. 补全测试
10. CI workflow
11. CHANGELOG + 1.0.0
```

若单独推进工程化任务：

```text
TypeScript 基础设施 → DbAdapter 重构 → 补全测试 → CI workflow → CHANGELOG + 语义版本
```

---

## 13. 明确不做

本轮不设计或实现：

- Landing Page 动画 / 视频背景。
- 好友、动态流、社交分享给他人。
- 移动端打字优化。
- 复杂推荐算法。
- 真实代码执行 / OJ 判题。
- 真实 Supabase 网络交互的单元测试。
- `useCursor.ts` 与完整 `TypingEngine.vue` DOM layout 单元测试。
- 大规模补充课程内容；内容扩充作为后续独立任务。
