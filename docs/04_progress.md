# keylab — 进度看板 v2

---

## Current Milestone

**v2.0 — IDE 级打字体验 + 多变体内容 + 进度激励系统 + 社区投稿**

阶段一（打字体验核心）：T000 → T003–T007 → T010–T016 → T017–T018
阶段二（激励系统）：T019–T022
阶段三（内容体系）：T023–T029

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

---

## In Progress

（当前无任何 v2 任务已开始）

---

## Blocked

（无）

---

## Changed Decisions

| 日期 | 决策 | 原因 |
|---|---|---|
| 2026-06-19 | 不引入代码执行沙箱 | 复杂度过高，与「打字训练器」定位不符 |
| 2026-06-19 | 多变体改为「进入题目后选」而非卡片选 | 减少列表页信息密度 |
| 2026-06-19 | 暂不做团队/小组功能 | 留到 v3 |
| 2026-06-19 | 商业化暂定全免费 | 先把产品做好 |
| 2026-06-19 | 项目名统一为 keylab（非 TypeLab） | 与 repo 名对齐 |
| 2026-06-19 | lib/ 改为 domain/application/adapters 三层结构 | 明确边界，纯函数可单独测试，不依赖 Supabase |

---

## Next Tasks

按顺序开始：

1. **T000** — 安装 Vitest + Vue Test Utils（所有测试的前置）
2. **T001 → T002** — 迁移 supabase.js / db.js 到 adapters/（重构起点）
3. **T003 → T005** — 实现三个 domain 纯函数，同步写单元测试
4. **T006 → T007** — application 层编排，此后所有功能可接入
5. **T010–T015** — TypingEngine 重构（可与 T003–T007 并行）
6. **T016 + T017–T018** — VariantSelector + 内容迁移
