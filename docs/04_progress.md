# keylab — 进度看板 v3

> 本文依据 `docs/00_proposal.md`、`docs/01_requirements.md`、`docs/02_architecture.md`、`docs/03_tasks.md` 更新。  
> v1 / v2 为已完成历史；v3 为当前新一轮工程化升级 + UI / 产品完善。

---

## Current Milestone

**v3.0 — 1.0 发布准备：产品闭环 + 工程化升级**

目标分两条主线：

1. **产品体验升级**：首页叙事、登录用户 Dashboard、课程发现、结果页、Footer、404、Loading、登录页、排行榜、打字页细节。
2. **工程化升级**：TypeScript、DbAdapter / MemoryAdapter、测试覆盖率、CI、CHANGELOG、1.0.0 版本发布。

当前建议执行顺序：

```text
T030 → T031 → T032 → T033 → T036 → T039 → T034/T035/T040/T041/T042/T043
→ T044–T049 → T050–T055 → T056–T061 → T062 → T063–T064
```

---

## Done

### v1 基线

- [x] T01 项目骨架（Vue 3 + Vite + Supabase + Vercel）
- [x] T02 Layout 与导航
- [x] T03 用户认证（邮箱/密码，Pinia session）
- [x] T04 课程选择（列表、筛选、卡片）
- [x] T05 打字引擎 v1（逐字符匹配，WPM / 准确率）
- [x] T06 成绩结果页
- [x] T07 排行榜
- [x] T08 个人主页（历史记录表格 + ECharts 折线图）

### v2 阶段一 — 基础设施 + 打字体验（2026-06-19）

- [x] T000 安装 Vitest + Vue Test Utils（87 tests passing）
- [x] T001 迁移 supabase.js → lib/adapters/supabase.js
- [x] T002 迁移 db.js → lib/adapters/db.js
- [x] T003 domain/lessonRef.js（parse/build，15 tests）
- [x] T004 domain/streak.js（calcStreak 纯函数，UTC+8，10 tests）
- [x] T005 domain/achievements.js（7 成就规则，21 tests）
- [x] T006 application/lessons.js（LessonLoader，v1→v2 格式升级，14 tests）
- [x] T007 application/achievementEvaluator.js（解锁流程，9 tests）
- [x] T010 useCursor.js（getBoundingClientRect 浮动光标，替代 CSS ::before）
- [x] T011 Prism.js 语法高亮（lazy-load，不支持语言降级 plaintext）
- [x] T012 LineNumbers.vue（行号组件，当前行高亮，whitespace-pre 精准对齐）
- [x] T013 useTypingState.js — Enter 自动缩进（13 tests）
- [x] T014 useTypingState.js — 空格 / Tab 自动跳过（同文件）
- [x] T015 useWpm.js — WPM 分母排除自动跳过字符（5 tests）
- [x] T016 VariantSelector.vue + TypingView 接入 v2 格式
- [x] T017 JSON 题目迁移至 v2 多变体格式（13 道题）
- [x] T018 quicksort / dijkstra / fibonacci 新增 JavaScript 变体

### v2 阶段二 — 激励系统（2026-06-19）

- [x] T019 streak Pinia store（接入 domain/streak.js）
- [x] T020 StreakCalendar.vue（GitHub 风格 52 周日历，4 档颜色）
- [x] T021 AchievementBadges.vue（7 成就，已解锁高亮，hover 显示条件）
- [x] T022 TypingView 完成后触发解锁 Toast（CSS 动画，3.5s 自动消失）

### v2 阶段三 — 内容体系（2026-06-19）

- [x] T023 Supabase paths + path_items 表 schema + seed（2 条系统路径）
- [x] T024 PathsView.vue + PathList + PathDetail + 路径进度计算
- [x] T025 collections DB 函数（createCollection / addToCollection 等 6 个）
- [x] T026 CollectionManager.vue + LessonCard 收藏按钮
- [x] T027 SubmitView.vue + db.submitLesson
- [x] T028 AdminReviewView.vue + db.reviewLesson（admin 路由守卫）
- [x] T029 MySubmissions.vue + ProfileView 集成


### v3 系统更新（2026-06-20）

- [x] T030 首页课程列表改用 application/listLessons
- [x] T031 新增 404 页面与 catch-all 路由
- [x] T032 首页游客视图重构
- [x] T033 首页登录用户 Dashboard
- [x] T034 课程筛选增强：搜索 + 分类 + 语言
- [x] T035 课程卡片展示语言标签与个人 PB
- [x] T036 成绩摘要增强：首次完成 / 新纪录 / 距最佳
- [x] T037 结果页推荐下一课
- [x] T038 结果页复制成绩
- [x] T039 新增 AppFooter 并接入 Layout
- [x] T040 登录页价值说明
- [x] T041 排行榜当前用户排名与空状态
- [x] T042 打字界面 Esc reset 与行进度
- [x] T043 统一 Skeleton loading 组件
- [x] T044 安装 TypeScript 与 vue-tsc
- [x] T045 新增 TypeScript 配置
- [x] T046 新增中心类型声明
- [x] T047 修正 SPEC Variant 字段勘误
- [x] T048 按顺序迁移 JS 到 TS
- [x] T049 Vue SFC script setup 迁移为 TypeScript
- [x] T050 定义 DbAdapter 接口
- [x] T051 拆分 Supabase client
- [x] T052 实现 MemoryAdapter
- [x] T053 实现 SupabaseAdapter
- [x] T054 实现 db.ts 兼容门面
- [x] T055 application 层支持 adapter 注入
- [x] T056 现有测试迁移为 TypeScript
- [x] T057 application 测试改为注入 MemoryAdapter
- [x] T058 新增 MemoryAdapter 单元测试
- [x] T059 新增 avatar / stores / router 测试
- [x] T060 记录不纳入单测范围
- [x] T061 配置覆盖率阈值
- [x] T062 新增 GitHub Actions CI
- [x] T063 更新版本号到 1.0.0
- [x] T064 新增 CHANGELOG

### v2 Bug Fixes（2026-06-19）

- [x] 行号与代码行错位 → whitespace-pre + overflow-x-auto，行号严格 1:1 对齐
- [x] 空格强制输入 → skipSpaces() 自动跳过所有空格 / Tab，仅需输入非空白字符
- [x] 准确率恒为 100% → 引入 grossTypedCount，公式改为 `(gross - errors) / gross`

---

## In Progress

（无）

---

## Planned — v3 产品体验升级

### 首页与课程发现

- [x] T030 首页课程列表改用 application/listLessons
- [x] T031 新增 404 页面与 catch-all 路由
- [x] T032 首页游客视图重构
- [x] T033 首页登录用户 Dashboard
- [x] T034 课程筛选增强：搜索 + 分类 + 语言
- [x] T035 课程卡片展示语言标签与个人 PB

### 成绩页

- [x] T036 成绩摘要增强：首次完成 / 新纪录 / 距最佳
- [x] T037 结果页推荐下一课
- [x] T038 结果页复制成绩

### 基础页面与细节打磨

- [x] T039 新增 AppFooter 并接入 Layout
- [x] T040 登录页价值说明
- [x] T041 排行榜当前用户排名与空状态
- [x] T042 打字界面 Esc reset 与行进度
- [x] T043 统一 Skeleton loading 组件

---

## Planned — v3 工程化升级

### TypeScript

- [x] T044 安装 TypeScript 与 vue-tsc
- [x] T045 新增 TypeScript 配置
- [x] T046 新增中心类型声明
- [x] T047 修正 SPEC Variant 字段勘误
- [x] T048 按顺序迁移 JS 到 TS
- [x] T049 Vue SFC script setup 迁移为 TypeScript

### DbAdapter

- [x] T050 定义 DbAdapter 接口
- [x] T051 拆分 Supabase client
- [x] T052 实现 MemoryAdapter
- [x] T053 实现 SupabaseAdapter
- [x] T054 实现 db.ts 兼容门面
- [x] T055 application 层支持 adapter 注入

### Tests

- [x] T056 现有测试迁移为 TypeScript
- [x] T057 application 测试改为注入 MemoryAdapter
- [x] T058 新增 MemoryAdapter 单元测试
- [x] T059 新增 avatar / stores / router 测试
- [x] T060 记录不纳入单测范围
- [x] T061 配置覆盖率阈值

### CI / Release

- [x] T062 新增 GitHub Actions CI
- [x] T063 更新版本号到 1.0.0
- [x] T064 新增 CHANGELOG

---

## Manual Verification Required（历史项，仍需浏览器确认）

以下 v2 项目代码已实现，仍需在浏览器中手动验证：

- T010：浮动光标位置准确（`\n` 处跳行首，blink 动画保留）
- T011：Python `def` / `return` / `for` 有高亮；不支持语言降级 plaintext 不报错
- T020：StreakCalendar 完成练习后今天格子点亮
- T022：首次完成弹出「起步」解锁提示；WPM ≥ 100 弹出「百键侠」
- T024：路径列表显示进度 N/M；完成题目后进度更新；不存在课程显示「题目已下架」
- T026：题目卡片收藏按钮可用；个人主页收藏夹展示正常
- T027：登录后可投稿，提交后显示「等待审核」；未登录跳转 `/login`
- T028：admin 账号可审核；非 admin 重定向首页
- T029：个人主页「我的投稿」显示历史及拒绝原因

---

## v3 Verification Gates

每个产品任务至少执行：

```text
npm run check
npm run build
```

TypeScript 基础设施落地后，所有 PR 必须执行：

```text
npm run typecheck
npm run check
npm run test
npm run build
```

发布前门禁：

- [ ] 游客首页 10 秒内能理解「这是什么、为什么用、怎么开始」
- [ ] 登录用户首页能看到今天该做什么
- [ ] 审核通过的社区课程能出现在首页课程列表
- [ ] 课程可通过搜索、分类、语言快速找到
- [ ] 练习完成后有明确终点感、个人最佳反馈、下一步行动
- [x] TypeScript typecheck 通过（2026-06-20：`npm run typecheck`）
- [x] CI 在 push / PR 上稳定运行（workflow 已新增；本地同序列验证通过）
- [x] `src/lib/**`、`src/stores/**`、`src/router/**` 覆盖率达到 lines 80%、functions 80%（2026-06-20：`npm run test`，96 tests，覆盖率超过门禁）
- [x] Mock 与 Supabase 数据访问经 adapter 隔离
- [x] 生产包不再包含开发 mock 数据

---

## Changed Decisions

| 日期 | 决策 | 原因 |
|---|---|---|
| 2026-06-19 | 不引入代码执行沙箱 | 复杂度过高，与「打字训练器」定位不符 |
| 2026-06-19 | 多变体改为「进入题目后选」而非卡片选 | 减少列表页信息密度 |
| 2026-06-19 | 暂不做团队 / 小组功能 | 留到未来版本 |
| 2026-06-19 | 商业化暂定全免费 | 先把产品做好 |
| 2026-06-19 | 项目名统一为 keylab（非 TypeLab） | 与 repo 名对齐 |
| 2026-06-19 | lib/ 改为 domain / application / adapters 三层结构 | 明确边界，纯函数可单独测试 |
| 2026-06-19 | 空格 / Tab 全部自动跳过 | 程序员打字不应被空白字符阻断节奏 |
| 2026-06-19 | 准确率公式改为 gross/errors 模型 | 修复 backspace 后恒 100% 的 bug |
| 2026-06-20 | v3 拆成产品体验升级与工程化升级两条主线 | 同时补齐产品闭环与 1.0 发布质量门禁 |
| 2026-06-20 | 首页课程发现统一走 `listLessons()` | 确保 approved 社区课程能进入首页，避免静态 lessonMetas 漏数据 |
| 2026-06-20 | TypeScript 类型中心统一放 `src/types/index.ts` | 降低跨层字段漂移，尤其约束 `variant_id` |
| 2026-06-20 | 通过 DbAdapter 隔离 Supabase 与 MemoryAdapter | 避免生产包携带 mock 分支，测试可注入 adapter |
| 2026-06-20 | SupabaseAdapter 不纳入单元覆盖率阈值 | 真实网络 / RLS 行为后续通过集成测试覆盖 |

---

## Deferred / Not Doing in v3

- 不做真实代码执行 / OJ 判题
- 不做自由作答
- 不做团队 / 小组功能
- 不做移动端打字优化
- 不做付费墙
- 不做视频教程或图文课程
- 不做 Landing Page 动画 / 视频背景
- 不做好友、动态流等社交功能
- 不做复杂推荐算法
- 不在单元测试中覆盖真实 Supabase 网络交互
- 不测试依赖 DOM layout 的 `useCursor` 和完整 `TypingEngine` 布局行为
- 不在本轮补充大量课程内容；内容扩充作为 UI 完成后的独立任务


## v3 Residual Risks

- `npm run check` passes but reports 42 Biome warnings for explicit `any`; build/typecheck/test are green.
- MemoryAdapter / db facade tests cover all method groups in grouped cases rather than the originally estimated ~25 individual cases.
- Product UI changes are code-validated; browser/manual UX verification remains required for exact visual behavior.
