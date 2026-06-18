# keylab — 进度看板 v2

---

## Current Milestone

**v2.0 — IDE 级打字体验 + 多变体内容 + 进度激励系统 + 社区投稿**

阶段一（打字体验核心）：T000 → T003–T007 → T010–T016 → T017–T018 ✅
阶段二（激励系统）：T019–T022 ✅
阶段三（内容体系）：T023–T029 ✅

---

## Done

### v1 基线

- [x] T01 项目骨架（Vue 3 + Vite + Supabase + Vercel）
- [x] T02 Layout 与导航
- [x] T03 用户认证（邮箱/密码，Pinia session）
- [x] T04 课程选择（列表、筛选、卡片）
- [x] T05 打字引擎 v1（逐字符匹配，WPM/准确率）
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
- [x] T014 useTypingState.js — 空格/Tab 自动跳过（同文件）
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

---

## Bug Fixes（2026-06-19）

- [x] 行号与代码行错位 → whitespace-pre + overflow-x-auto，行号严格 1:1 对齐
- [x] 空格强制输入 → skipSpaces() 自动跳过所有空格/Tab，仅需输入非空白字符
- [x] 准确率恒为 100% → 引入 grossTypedCount，公式改为 (gross - errors) / gross

---

## In Progress

（无）

---

## Manual Verification Required（需手动确认）

以下项目代码已实现，需在浏览器中手动验证：
- T010：浮动光标位置准确（\n 处跳行首，blink 动画保留）
- T011：Python def/return/for 有高亮；不支持语言降级 plaintext 不报错
- T020：StreakCalendar 完成练习后今天格子点亮
- T022：首次完成弹出「起步」解锁提示；WPM ≥ 100 弹出「百键侠」
- T024：路径列表显示进度 N/M；完成题目后进度更新；不存在课程显示「题目已下架」
- T026：题目卡片收藏按钮可用；个人主页收藏夹展示正常
- T027：登录后可投稿，提交后显示「等待审核」；未登录跳转 /login
- T028：admin 账号可审核；非 admin 重定向首页
- T029：个人主页「我的投稿」显示历史及拒绝原因

---

## Changed Decisions

| 日期 | 决策 | 原因 |
|---|---|---|
| 2026-06-19 | 不引入代码执行沙箱 | 复杂度过高，与「打字训练器」定位不符 |
| 2026-06-19 | 多变体改为「进入题目后选」而非卡片选 | 减少列表页信息密度 |
| 2026-06-19 | 暂不做团队/小组功能 | 留到 v3 |
| 2026-06-19 | 商业化暂定全免费 | 先把产品做好 |
| 2026-06-19 | 项目名统一为 keylab（非 TypeLab） | 与 repo 名对齐 |
| 2026-06-19 | lib/ 改为 domain/application/adapters 三层结构 | 明确边界，纯函数可单独测试 |
| 2026-06-19 | 空格/Tab 全部自动跳过 | 程序员打字不应被空白字符阻断节奏 |
| 2026-06-19 | 准确率公式改为 gross/errors 模型 | 修复 backspace 后恒 100% 的 bug |
