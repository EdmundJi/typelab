# keylab — 任务清单 v3

> 本文依据 `docs/00_proposal.md`、`docs/01_requirements.md`、`docs/02_architecture.md` 更新。  
> v1 / v2 已完成的历史任务见 `docs/04_progress.md`；本文只列出新一轮 v3 升级任务。  
> 每个任务建议控制在 30–90 分钟。验收标准全部通过 + PR 合并到 `dev` 视为完成。

---

## 执行顺序

产品优先顺序：

```text
1. 修复社区课程不出现在首页
2. 新增 404 页面
3. 首页分游客 / 登录用户两路重构
4. 成绩页升级
5. Footer
6. 登录页、排行榜、打字页、课程卡片、Loading 等打磨
7. TypeScript 基础设施
8. db adapter 重构
9. 补全测试
10. CI workflow
11. CHANGELOG + 1.0.0
```

工程线如单独推进，可按：

```text
TypeScript 基础设施 → db adapter 重构 → 补全测试 → CI workflow → CHANGELOG + 语义版本
```

---

## Module: product/home-discovery

- [ ] T030 首页课程列表改用 application/listLessons
  - Files: `src/components/LessonSelect/index.vue`, `src/lib/application/lessons.js` / `.ts`
  - Steps:
    - `LessonSelect` 不再直接依赖静态 `lessonMetas`
    - 调用 `listLessons()` 合并内置课程与 approved 社区课程
    - 加入 loading / error / empty 状态
  - Acceptance:
    - 内置课程展示正常
    - 审核通过的社区课程展示在首页
    - pending / rejected 社区课程不展示
    - 查询社区课程失败时降级展示内置课程，不导致页面崩溃

- [ ] T031 新增 404 页面与 catch-all 路由
  - Files: `src/views/NotFoundView.vue`, `src/router/index.js` / `.ts`
  - Acceptance:
    - 访问未知路径进入 404 页面
    - 页面显示 `// 404`、`页面不存在`、`← 返回首页`
    - 返回首页链接可用

- [ ] T032 首页游客视图重构
  - Files: `src/views/HomeView.vue`
  - Acceptance:
    - 未登录用户看到 Hero：`为程序员设计的打字练习`
    - 副标题为：`通过打出真实算法代码，同时训练手速和算法记忆`
    - CTA：`开始练习 →` 跳到课程列表锚点；`注册账号` 跳转 `/login`
    - 展示三个卖点：真实代码、多语言变体、算法记忆
    - 下方保留课程列表入口

- [ ] T033 首页登录用户 Dashboard
  - Files: `src/views/HomeView.vue`, `src/stores/streak.js` / `.ts`
  - Acceptance:
    - 登录用户看到 Streak、今日是否已练、总练习次数、本周练习次数、个人最佳 WPM
    - 有历史记录时显示上次练习课程与「继续」按钮
    - 无历史记录时显示推荐入门课程
    - 展示 `学习路径 →`，跳转 `/paths`

- [ ] T034 课程筛选增强：搜索 + 分类 + 语言
  - Files: `src/components/LessonSelect/LessonFilter.vue`, `src/components/LessonSelect/index.vue`
  - Acceptance:
    - 搜索框按课程标题实时过滤
    - 分类 Tabs 保留并可与搜索组合
    - 语言下拉支持全部 / Python / JavaScript / Go / 其他出现过的语言
    - 搜索、分类、语言三者可组合生效

- [ ] T035 课程卡片展示语言标签与个人 PB
  - Files: `src/components/LessonSelect/LessonCard.vue`, `src/components/LessonSelect/index.vue`
  - Acceptance:
    - 卡片展示 category/topic、标题、难度、可用语言标签、开始练习入口
    - `LessonCard` 支持可选 `bestWpm` prop
    - 登录用户可看到 `pb: 87 wpm`
    - PB 来源为一次性 `listUserResults(userId)` 后前端 Map 聚合，不允许每张卡片发起 DB 查询

---

## Module: product/result-flow

- [ ] T036 成绩摘要增强
  - Files: `src/components/Result/ResultSummary.vue`, `src/views/ResultView.vue`
  - Acceptance:
    - 显示 WPM、准确率、用时、错误数
    - 首次完成显示 `首次完成`
    - 新纪录时 WPM 高亮并显示 `↑ 新纪录`
    - 未破纪录时显示 `距最佳 -X wpm`

- [ ] T037 结果页推荐下一课
  - Files: `src/views/ResultView.vue`
  - Acceptance:
    - 按同 category 推荐下一课
    - 优先推荐未完成课程；无法判断未完成时同 category 随机
    - 显示课程标题、语言、难度与 `→ 去练习`
    - 推荐失败时不影响结果页展示

- [ ] T038 结果页复制成绩
  - Files: `src/views/ResultView.vue`, `src/components/Result/ResultSummary.vue`
  - Acceptance:
    - 数字区域右上角有复制按钮
    - 使用 `navigator.clipboard.writeText()`
    - 复制格式符合需求文档 R04.4
    - 点击后显示勾选状态，2 秒后恢复

---

## Module: product/layout-polish

- [ ] T039 新增 AppFooter 并接入 Layout
  - Files: `src/components/Layout/AppFooter.vue`, `src/components/Layout/AppLayout.vue`
  - Acceptance:
    - Footer 在 `<main>` 下方渲染
    - 内容包含 KEYLAB、品牌说明、练习 / 路径 / 排行榜 / GitHub 链接、© 2026、v1.0.0
    - 高度不超过 60px，风格与 Navbar 一致

- [ ] T040 登录页价值说明
  - Files: `src/views/LoginView.vue`
  - Acceptance:
    - Header 显示 `登录 / 注册`
    - 显示三行价值说明：成绩自动保存、Streak 日历、解锁成就与排行榜

- [ ] T041 排行榜当前用户排名与空状态
  - Files: `src/views/LeaderboardView.vue`
  - Acceptance:
    - 已登录且当前用户在榜单中时显示 `你的排名：第 X 名`
    - 无记录时显示 `还没有人上榜，成为第一个吧`
    - 空状态提供 CTA 去练习

- [ ] T042 打字界面 Esc reset 与行进度
  - Files: `src/components/TypingEngine/TypingEngine.vue`, `src/views/TypingView.vue`
  - Acceptance:
    - `Escape` 触发 `emit('reset')`
    - `TypingView` 接收 reset 并重新加载当前课程 / 变体
    - 重置后清空输入、计时、错误和进度
    - 底部提示包含 `Esc 重置 · Backspace 删除 · Tab/Enter 输入对应字符`
    - stats bar 显示 `行 current/total`

- [ ] T043 统一 Skeleton loading 组件
  - Files: `src/components/ui/SkeletonCard.vue`, `src/components/ui/SkeletonRow.vue`
  - Acceptance:
    - 课程列表 loading 显示 3 个 SkeletonCard
    - 排行榜 loading 显示 5 行 SkeletonRow
    - 个人主页 loading 显示大矩形占位
    - 使用 `animate-pulse` 或等效动画

---

## Module: engineering/typescript

- [ ] T044 安装 TypeScript 与 vue-tsc
  - Files: `package.json`, `package-lock.json`
  - Steps:
    - `npm install -D typescript vue-tsc`
    - 新增 script：`"typecheck": "vue-tsc --noEmit"`
  - Acceptance:
    - `npm run typecheck` 可执行
    - 不新增不必要的 `@types/*`

- [ ] T045 新增 TypeScript 配置
  - Files: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
  - Acceptance:
    - 配置与 `plan.md` Phase 1.2 保持一致
    - Vue SFC、Vite、Vitest 路径别名可被类型系统识别

- [ ] T046 新增中心类型声明
  - Files: `src/types/index.ts`
  - Acceptance:
    - 包含需求文档 R09.5 所列接口
    - `Variant` 字段使用 `variant_id: string`
    - 不使用错误的 `id` 字段替代 `variant_id`

- [ ] T047 修正 SPEC Variant 字段勘误
  - Files: `SPEC.md`
  - Acceptance:
    - SPEC 中 Variant 字段同步为 `variant_id`
    - 文档说明保留与现有 JSON / 代码兼容的原因

- [ ] T048 按顺序迁移 JS 到 TS
  - Files:
    - `src/lib/domain/*.js` → `.ts`
    - `src/lib/application/*.js` → `.ts`
    - `src/lib/avatar.js` → `.ts`
    - `src/stores/*.js` → `.ts`
    - `src/router/index.js` → `.ts`
    - `src/lessons/index.js` → `.ts`
    - `src/main.js` → `.ts`
    - `vite.config.js` → `.ts`
  - Acceptance:
    - 按 domain → application → adapters → stores/router → composables → main 顺序迁移
    - 每次迁移只改扩展名和类型注解，不改业务逻辑
    - `npm run typecheck` 通过

- [ ] T049 Vue SFC script setup 迁移为 TypeScript
  - Files: `src/**/*.vue`
  - Acceptance:
    - 所有 `<script setup>` 改为 `<script setup lang="ts">`
    - `defineProps` / `defineEmits` 有类型声明
    - 重点检查 `TypingEngine`、`TypingView`
    - `npm run typecheck` 通过

---

## Module: engineering/db-adapter

- [ ] T050 定义 DbAdapter 接口
  - Files: `src/lib/adapters/types.ts`
  - Acceptance:
    - 定义 `DbAdapter` 与 `Subscription`
    - 覆盖 Auth、Results、Achievements、Community、Collections、Paths 所有方法
    - 方法签名与 `docs/01_requirements.md` R10.2 / `plan.md` Phase 2 一致

- [ ] T051 拆分 Supabase client
  - Files: `src/lib/adapters/supabase.ts`
  - Acceptance:
    - 只有该文件创建 Supabase client
    - 导出 `isSupabaseConfigured`
    - 业务代码不直接 import Supabase client

- [ ] T052 实现 MemoryAdapter
  - Files: `src/lib/adapters/MemoryAdapter.ts`, `tests/fixtures/paths.ts`
  - Acceptance:
    - 完整实现 `DbAdapter`
    - 使用 Map + 数组保存实例状态
    - 无模块级可变状态导致测试泄漏
    - 提供 `reset()`
    - 默认不内置 mock paths；paths fixture 移到 `tests/fixtures/paths.ts`

- [ ] T053 实现 SupabaseAdapter
  - Files: `src/lib/adapters/SupabaseAdapter.ts`
  - Acceptance:
    - 完整实现 `DbAdapter`
    - 构造函数接受 Supabase client 实例
    - 所有 `supabase.from(...)` 调用只存在于该 adapter 内
    - 便于测试注入 mock client

- [ ] T054 实现 db.ts 兼容门面
  - Files: `src/lib/adapters/db.ts`
  - Acceptance:
    - 根据 `isSupabaseConfigured` 选择 `SupabaseAdapter` 或 `MemoryAdapter`
    - 导出 `db: DbAdapter`
    - 继续导出旧具名函数，现有 View / Store 不需要大规模改 import

- [ ] T055 application 层支持 adapter 注入
  - Files: `src/lib/application/lessons.ts`, `src/lib/application/achievementEvaluator.ts`
  - Acceptance:
    - `listLessons(filters = {}, adapter = db)`
    - `getLessonById(ref, adapter = db)`
    - `evaluateAndUnlock(..., adapter = db)`
    - 单元测试可直接传入 `new MemoryAdapter()`

---

## Module: engineering/tests

- [ ] T056 现有测试迁移为 TypeScript
  - Files: `tests/unit/**/*.test.js` → `.test.ts`
  - Acceptance:
    - 所有现有测试通过
    - import 路径适配 TS 迁移后的文件

- [ ] T057 application 测试改为注入 MemoryAdapter
  - Files: `tests/unit/application/lessons.test.ts`, `tests/unit/application/achievementEvaluator.test.ts`
  - Acceptance:
    - 删除模块级 `vi.mock('@/lib/adapters/db')`
    - 每个测试创建独立 `new MemoryAdapter()`
    - 覆盖 approved 社区课程、未审核不展示、解锁幂等等行为

- [ ] T058 新增 MemoryAdapter 单元测试
  - Files: `tests/unit/adapters/MemoryAdapter.test.ts`
  - Acceptance:
    - 覆盖 Auth、results、leaderboard、achievements、community、collections、paths、reset
    - 用例数约 25 个

- [ ] T059 新增 avatar / stores / router 测试
  - Files:
    - `tests/unit/lib/avatar.test.ts`
    - `tests/unit/stores/streak.test.ts`
    - `tests/unit/stores/user.test.ts`
    - `tests/unit/router/guards.test.ts`
  - Acceptance:
    - `getAvatar` 覆盖空字符串、单字符、颜色一致性、哈希稳定性
    - streak store 支持注入 MemoryAdapter 并正确更新 state
    - user store 覆盖 `setSession` / `clearSession` / 派生字段
    - router guards 覆盖 `requiresAuth`、`requiresAdmin`、无 meta、catch-all

- [ ] T060 记录不纳入单测范围
  - Files: `tests/README.md`
  - Acceptance:
    - 说明 `useCursor.ts` 不测原因：依赖 `getBoundingClientRect`
    - 说明完整 `TypingEngine.vue` layout 不测原因
    - 说明 `SupabaseAdapter.ts` 不纳入单元覆盖率，未来用集成测试覆盖

- [ ] T061 配置覆盖率阈值
  - Files: `vite.config.ts`
  - Acceptance:
    - coverage provider 使用 `v8`
    - include：`src/lib/**`, `src/stores/**`, `src/router/**`
    - exclude：`src/lib/adapters/supabase.ts`, `src/lib/adapters/SupabaseAdapter.ts`
    - thresholds：lines 80、functions 80
    - `npm run test` 覆盖率通过

---

## Module: engineering/release

- [ ] T062 新增 GitHub Actions CI
  - Files: `.github/workflows/ci.yml`
  - Acceptance:
    - push / PR 到 `main`、`dev` 触发
    - Node.js 20 + npm cache
    - 步骤顺序：`npm ci` → `npm run typecheck` → `npm run check` → `npm run test` → `npm run build`
    - 保留现有 `leaderboard.yml`

- [ ] T063 更新版本号到 1.0.0
  - Files: `package.json`, `package-lock.json`
  - Acceptance:
    - `name` 保持 `typelab` 不变
    - `version` 从 `0.0.0` 改为 `1.0.0`

- [ ] T064 新增 CHANGELOG
  - Files: `CHANGELOG.md`
  - Acceptance:
    - 采用 Keep a Changelog 格式
    - 包含 `[Unreleased]`
    - 包含 `[1.0.0] - 2026-06-20`
    - Added / Changed / Fixed 覆盖本轮功能与修复

---

## 任务依赖关系

```text
T030 → T034 → T035
T031 → T033
T032 → T033
T036 → T037 → T038
T039 ─┐
T040 ├→ 产品体验完整性验收
T041 ┤
T042 ┤
T043 ┘

T044 → T045 → T046 → T048 → T049
T046 → T047
T050 → T051 → T052 → T054 → T055
T050 → T053 → T054
T052 → T057 → T058
T056 → T057
T056 → T059
T060 → T061
T044 → T062
T063 → T064

最终发布门禁：
npm run typecheck && npm run check && npm run test && npm run build
```
