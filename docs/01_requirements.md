# keylab — 需求文档 v3

> 本文严格依据 `plan.md` 与 `plan_ui.md` 更新，覆盖工程化升级与 UI / 产品完善需求。

## 背景

见 `docs/00_proposal.md`。

当前目标不是新增一个孤立功能，而是完成两类升级：

1. **工程化升级**：TypeScript、db adapter、测试、CI、CHANGELOG 与 1.0.0 发布基础。
2. **产品体验升级**：让网站从「课程列表工具」变成有完整叙事的打字练习产品。

---

## 用户角色

| 角色 | 描述 |
|---|---|
| 游客 | 未登录用户；可以浏览首页、查看课程列表、开始练习；成绩不保存，无法使用 Streak、成就、投稿、收藏等登录功能 |
| 登录用户 | 可以保存成绩、查看个人状态、使用 Streak / 成就 / 收藏 / 路径 / 投稿等功能 |
| 管理员 | 具备管理员角色；可审核社区投稿 |

---

## R01 — 首页重构

### R01.1 按登录状态分两路渲染

`HomeView.vue` 必须根据登录状态展示不同首页内容。

#### 游客视图

游客首页必须包含：

- Hero Section
  - 大标题：`为程序员设计的打字练习`
  - 副标题：`通过打出真实算法代码，同时训练手速和算法记忆`
  - CTA 1：`开始练习 →`，跳转到课程列表锚点
  - CTA 2：`注册账号`，跳转 `/login`
- 三个核心卖点，横排三格展示：
  - `真实代码`：不是随机单词，而是 BFS、快排、DP
  - `多语言变体`：同一道题可选 Python / JavaScript / Go
  - `算法记忆`：打完一道题等于过了一遍实现
- 课程列表区域，下方展示并保留分类筛选能力

#### 登录用户视图

登录用户首页必须包含：

- 顶部 Dashboard 三格：
  - Streak 卡片：当前连续天数大数字 + 今天是否已练习（已练 / 去练习）
  - 总练习次数 + 本周练习次数
  - 个人最佳 WPM
- 继续上次 / 推荐课程：
  - 有历史记录时显示上次练习课程与「继续」按钮
  - 无历史记录时显示一道推荐入门课程
- 学习路径入口：在推荐课程区域附近展示 `学习路径 →`，链接 `/paths`
- 课程列表区域

---

## R02 — 课程选择与课程发现

### R02.1 社区课程必须出现在首页

`LessonSelect/index.vue` 不得只使用 `src/lessons/index.js` 的静态 `lessonMetas`。

必须改为调用 `src/lib/application/lessons` 中的 `listLessons()`：

- 内置 JSON 课程必须展示
- 审核通过的社区课程必须展示
- 未审核 / 被拒绝社区课程不得展示在首页课程列表
- 列表加载期间必须有 loading 状态

### R02.2 搜索、分类、语言筛选

`LessonFilter.vue` 必须在现有分类 Tabs 基础上扩展为：

```text
[ 搜索框 ]  [ 分类 Tabs ]  [ 语言下拉 ]
```

要求：

- 搜索框按 `lesson.title` 前端实时过滤
- 分类 Tabs 保留现有分类筛选
- 语言下拉支持：全部 / Python / JavaScript / Go / 其他从课程变体中出现的语言
- 搜索、分类、语言筛选可以组合生效

### R02.3 课程卡片信息

`LessonCard` 必须展示：

- 分类 / topic 标签
- 标题
- 难度
- 可用语言标签
- 开始练习入口

语言标签来源：

```ts
uniqueLangs = [...new Set(lesson.variants.map(v => v.language))]
```

### R02.4 登录用户课程 PB

登录用户看到课程卡片时，可显示该课程的个人最佳 WPM：

- `LessonCard` 接收可选 `bestWpm` prop
- 卡片右下角显示：`pb: 87 wpm`
- 从未练过时不显示或显示空状态
- 不允许对每张卡片单独发起一次 DB 查询
- 必须一次性读取用户所有 results，再在前端用 Map 聚合每课最佳 WPM

---

## R03 — 打字界面

### R03.1 Esc 快捷键重置

`TypingEngine.vue` 必须支持 Esc 重置：

- 在 `handleKeyDown` 中处理 `Escape`
- 触发 `emit('reset')`
- `TypingView.vue` 接收 reset 事件并重新加载当前课程 / 变体
- 重置后清空当前输入、计时、错误与进度

### R03.2 底部提示文案

打字界面底部快捷键提示必须同步更新为包含：

```text
Esc 重置 · Backspace 删除 · Tab/Enter 输入对应字符
```

### R03.3 当前行 / 总行数

打字界面 stats bar 右侧必须显示当前行进度：

```text
行 3/12
```

实现应复用已有 `currentLine` computed，并根据目标代码总行数计算总数。

---

## R04 — 成绩结果页

### R04.1 成绩基础信息

`ResultView.vue` 必须显示：

- WPM
- 准确率
- 用时
- 错误数
- 再来一次按钮
- 选其他课程按钮

### R04.2 个人最佳视觉反馈

`ResultSummary.vue` 必须增强个人最佳反馈：

- 新纪录时：
  - WPM 数字加高亮背景
  - 显示 `↑ 新纪录` 标签
  - 使用 accent 色
- 比最佳差时：
  - 显示 `距最佳 -X wpm`
  - 使用小字、淡色
- 首次完成时：
  - 显示 `首次完成` 标签

### R04.3 推荐下一课

`ResultView.vue` 按钮区下方必须增加「推荐下一课」区域：

```text
推荐下一课
BFS 广度优先遍历   Python · 难度 ★★☆   → 去练习
```

推荐逻辑：

- 优先从同 category 课程中随机选一道未完成课程
- 若无法判断未完成，则从同 category 随机选
- 可使用 `lessonMetas` 按 category 过滤

### R04.4 复制成绩

结果页数字区域右上角必须提供复制按钮。

复制格式：

```text
keylab — BFS 广度优先遍历
WPM: 87 | 准确率: 96.2% | 时间: 1m 23s
```

要求：

- 使用 `navigator.clipboard.writeText()`
- 点击后按钮变为勾选状态
- 勾选状态 2 秒后恢复

---

## R05 — Footer 与基础页面结构

### R05.1 AppFooter

必须新建 `src/components/Layout/AppFooter.vue`。

Footer 在 `AppLayout.vue` 的 `<main>` 下方渲染，内容结构：

```text
[ KEYLAB ]                    [ 练习 ][ 路径 ][ 排行榜 ]
为程序员设计的打字练习           [ GitHub ]
© 2026                        v1.0.0
```

要求：

- 高度不超过 60px
- 与 Navbar 风格一致
- 保持极简 monospace 风格

### R05.2 404 页面

必须新建 `src/views/NotFoundView.vue`。

页面内容：

```text
// 404

页面不存在

← 返回首页
```

路由要求：

- 在 `router/index.js` / `router/index.ts` 增加 catch-all：

```ts
{ path: '/:pathMatch(.*)*', component: NotFoundView }
```

---

## R06 — 登录页

`LoginView.vue` Header 区域必须从单句说明改为三行价值说明：

```text
登录 / 注册

✓ 成绩自动保存，追踪个人进步
✓ Streak 日历 — 保持每日练习习惯
✓ 解锁成就，参与全球排行榜
```

---

## R07 — 排行榜

### R07.1 当前用户排名提示

`LeaderboardView.vue` 已有当前用户行高亮时，必须在表格上方增加：

```text
你的排名：第 X 名
```

显示条件：

- 用户已登录
- 当前用户存在于榜单中

### R07.2 空状态

排行榜无记录时，必须显示：

```text
还没有人上榜，成为第一个吧
```

并提供 CTA，引导用户去练习。

---

## R08 — Loading 状态统一

所有简单 `加载中...` 文案应替换为 skeleton 占位。

必须新增：

- `src/components/ui/SkeletonCard.vue`
- `src/components/ui/SkeletonRow.vue`

使用要求：

- 课程列表：显示 3 个灰色卡片占位
- 排行榜：显示 5 行灰色行占位
- 个人主页：显示一个大的灰色矩形占位
- 使用 CSS `animate-pulse` 或等效动画

---

## R09 — TypeScript 迁移

### R09.1 依赖

必须安装：

```bash
npm install -D typescript vue-tsc
```

不得新增 `@types/*`，因为 Supabase SDK 与 Vue 3 均自带类型。

### R09.2 配置文件

必须新增：

- `tsconfig.json`
- `tsconfig.app.json`
- `tsconfig.node.json`

配置内容必须与 `plan.md` 中 Phase 1.2 保持一致。

### R09.3 Vite 配置迁移

`vite.config.js` 必须重命名为：

```text
vite.config.ts
```

仅改扩展名，内容不做逻辑变化。

### R09.4 typecheck 脚本

`package.json` 必须新增：

```json
"typecheck": "vue-tsc --noEmit"
```

### R09.5 中心类型声明

必须新建：

```text
src/types/index.ts
```

并包含 `plan.md` Phase 1.4 中列出的接口：

- `Variant`
- `NormalizedLesson`
- `V1Lesson`
- `V2Lesson`
- `RawLesson`
- `TypingResult`
- `UserResult`
- `LeaderboardEntry`
- `Collection`
- `CollectionItem`
- `CommunityLesson`
- `SubmitLessonInput`
- `Path`
- `PathItem`
- `CheckContext`
- `Achievement`
- `Session`
- `AuthResponse`

### R09.6 Variant 字段勘误

`Variant` 字段名必须使用：

```ts
variant_id: string
```

不得改为 `id`。

原因：JSON 文件与现有代码均使用 `variant_id`。`SPEC.md` 中写成 `id` 是文档错误，必须同步修正 `SPEC.md`。

### R09.7 逐文件迁移顺序

迁移顺序必须是：

```text
domain → application → adapters → stores/router → composables → main
```

每次迁移只允许：

- 改扩展名
- 增加类型注解
- 不改业务逻辑

必须迁移文件：

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

所有 `.vue` 文件的 `<script setup>` 必须改为：

```vue
<script setup lang="ts">
```

复杂组件（尤其 `TypingEngine`、`TypingView`）必须重点检查 `defineProps` / `defineEmits` 类型。

---

## R10 — db 适配器重构

### R10.1 目标结构

必须将当前 `db.js` 拆为：

```text
src/lib/adapters/
  types.ts
  supabase.ts
  SupabaseAdapter.ts
  MemoryAdapter.ts
  db.ts
```

### R10.2 DbAdapter 接口

`src/lib/adapters/types.ts` 必须定义 `DbAdapter` 与 `Subscription` 接口。

接口必须覆盖以下能力：

- Auth
  - `getCurrentSession`
  - `onAuthStateChange`
  - `signInWithPassword`
  - `signUp`
  - `signOut`
- Results
  - `saveResult`
  - `listUserResults`
  - `getBestLessonWpm`
  - `listLeaderboard`
- Achievements
  - `listUserAchievements`
  - `unlockAchievement`
- Community
  - `queryCommunityLessons`
  - `submitLesson`
  - `listMySubmissions`
  - `listPendingSubmissions`
  - `reviewLesson`
- Collections
  - `createCollection`
  - `listCollections`
  - `addToCollection`
  - `removeFromCollection`
  - `deleteCollection`
  - `getCollectionStatus`
- Paths
  - `listPaths`
  - `getPathById`

类型签名必须与 `plan.md` Phase 2 的 `DbAdapter` 定义一致。

### R10.3 MemoryAdapter

`MemoryAdapter.ts` 必须：

- 实现 `DbAdapter`
- 从旧 `db.js` 中提取所有 `if (isUsingMockData())` 分支逻辑
- 使用 `Map` + 数组保存内存状态
- 避免模块级变量导致测试间状态泄漏
- 提供 `reset()` 方法供测试使用
- 不在默认状态中内置 mock paths 数据
- mock paths 数据必须移动到 `tests/fixtures/paths.ts`

### R10.4 SupabaseAdapter

`SupabaseAdapter.ts` 必须：

- 实现 `DbAdapter`
- 从旧 `db.js` 中提取所有 `supabase.from(...)` 分支逻辑
- 构造函数接受 Supabase client 实例
- 便于测试时注入 mock client

### R10.5 db.ts 兼容导出

`db.ts` 必须：

- 根据 `isSupabaseConfigured` 选择 `SupabaseAdapter` 或 `MemoryAdapter`
- 导出 `db: DbAdapter`
- 继续导出所有旧的具名函数，保证现有组件和 store 不需要大规模改 import

### R10.6 application 层 adapter 注入

`achievementEvaluator.ts` 与 `lessons.ts` 必须接受可选 adapter 参数，默认使用 `db`。

必须支持：

- `evaluateAndUnlock(..., adapter = db)`
- `listLessons(filters = {}, adapter = db)`
- `getLessonById(ref, adapter = db)`

测试必须可以直接传入 `new MemoryAdapter()`。

---

## R11 — 测试要求

### R11.1 现有测试迁移

所有：

```text
tests/unit/**/*.test.js
```

必须迁移为：

```text
tests/unit/**/*.test.ts
```

### R11.2 去除模块级 vi.mock

- `achievementEvaluator.test.ts` 必须删除 `vi.mock('@/lib/adapters/db')`
- `lessons.test.ts` 必须删除 `vi.mock('@/lib/adapters/db')`
- 两者改为传入 `MemoryAdapter` 实例

### R11.3 新增测试文件

必须新增：

| 文件 | 测试内容 | 预计用例数 |
|---|---|---:|
| `tests/unit/adapters/MemoryAdapter.test.ts` | 验证 MemoryAdapter 所有方法行为 | ~25 |
| `tests/unit/lib/avatar.test.ts` | `getAvatar`：空字符串、单字符、颜色一致性、哈希稳定性 | ~6 |
| `tests/unit/stores/streak.test.ts` | `useStreakStore.refresh` 注入 MemoryAdapter 后 state 更新 | ~5 |
| `tests/unit/stores/user.test.ts` | `setSession` / `clearSession` 与 `user` 派生字段 | ~4 |
| `tests/unit/router/guards.test.ts` | `requiresAuth`、`requiresAdmin`、无 meta 正常放行 | ~6 |

### R11.4 不纳入测试范围

以下内容不做单元测试，但必须记录在 `tests/README.md`：

- `useCursor.ts`：依赖 `getBoundingClientRect`，jsdom 无法可靠模拟
- `TypingEngine.vue` 整体组件测试：依赖 DOM layout；核心逻辑由 `useTypingState` + `useWpm` 覆盖

### R11.5 覆盖率

`vite.config.ts` 必须添加 coverage 配置：

```ts
test: {
  coverage: {
    provider: 'v8',
    include: ['src/lib/**', 'src/stores/**', 'src/router/**'],
    exclude: ['src/lib/adapters/supabase.ts', 'src/lib/adapters/SupabaseAdapter.ts'],
    thresholds: { lines: 80, functions: 80 }
  }
}
```

`SupabaseAdapter` 不纳入单元测试覆盖率。

---

## R12 — CI Workflow

必须新增：

```text
.github/workflows/ci.yml
```

触发条件：

- push 到 `main` / `dev`
- PR 到 `main` / `dev`

运行环境：

- `ubuntu-latest`
- Node.js 20
- npm cache

步骤顺序必须为：

```text
npm ci
npm run typecheck
npm run check
npm run test
npm run build
```

要求：

- typecheck 失败时立即停止后续步骤
- build 放在最后
- 现有 `leaderboard.yml` 保持不变

---

## R13 — CHANGELOG 与版本

### R13.1 package.json

`package.json` 必须：

- 保持 `"name": "typelab"` 不变
- 将 `"version": "0.0.0"` 改为 `"1.0.0"`

### R13.2 CHANGELOG

必须新增根目录：

```text
CHANGELOG.md
```

格式必须采用 Keep a Changelog，并包含：

- `[Unreleased]`
- `[1.0.0] - 2026-06-20`
- Added / Changed / Fixed 分组

内容必须覆盖 `plan.md` Phase 5 中列出的功能与修复。

---

## R14 — 非功能需求

### R14.1 性能

- 打字输入不得出现明显卡顿
- 课程 PB 聚合不得产生 N 个课程对应 N 次 DB 查询
- Loading 状态使用 skeleton 反馈，避免页面空白

### R14.2 兼容性

- Chrome 110+
- Edge 110+
- 桌面端键盘优先

### R14.3 部署与成本

- Vercel 免费层
- Supabase 免费层
- GitHub Actions CI
- 每个 PR 应可通过 CI 验证

### R14.4 可维护性

- 新增业务类型统一放在 `src/types/index.ts`
- 数据访问必须经 `DbAdapter`
- 测试应优先注入 `MemoryAdapter`，避免 mock 整个 db 模块
- Vue SFC 使用 TypeScript 后必须通过 `vue-tsc --noEmit`

---

## R15 — 不做的事

本轮明确不做：

- Landing Page 动画 / 视频背景
- 好友、动态流、社交分享给他人等社交功能
- 移动端打字优化
- 复杂推荐算法
- 真实代码执行 / OJ 判题
- 单元测试覆盖真实 Supabase 网络交互
- `useCursor.ts` 与完整 `TypingEngine.vue` DOM layout 测试
- 大规模补充课程内容

内容补充作为后续独立任务：UI 改动落地后，目标为每个 category ≥ 5 道，总数 ≥ 30 道。

---

## R16 — 执行优先级

必须按以下顺序执行：

```text
1. Phase 1.2：修复社区课程不出现在首页
2. Phase 3.2：新增 404 页
3. Phase 1.1：首页分游客 / 登录用户两路渲染
4. Phase 2：成绩页升级
5. Phase 3.1：Footer
6. Phase 3.3 + 4.2~4.5：登录页、排行榜、打字页、课程卡片、Loading 等打磨
7. TypeScript 基础设施
8. db 适配器重构
9. 补全测试
10. CI workflow
11. CHANGELOG + 语义版本
```

若按 `plan.md` 的工程执行顺序单独推进工程化任务，则顺序为：

```text
TypeScript 基础设施 → db 适配器重构 → 补全测试 → CI workflow → CHANGELOG + 语义版本
```
