# 0003 — Streak 在前端实时计算，不持久化到数据库

## 状态

已采纳

## 背景

Streak 依赖「今天」的日期，需要在每次访问个人主页时反映最新状态。可行方案：

1. **前端实时计算**：从 `results` 全量拉取并在 `streak.js` 计算
2. **数据库持久化**：专用 `user_streak` 表，每次插入 result 后更新
3. **Edge Function**：定时或触发式更新 streak 字段

## 决策

选择方案 1（前端实时计算）。

Streak 计算逻辑封装在 `src/lib/streak.js`，接受 `results[]`（含 `created_at` UTC 时间戳），输出 `currentStreak / bestStreak / calendarData`。日期归属固定使用 UTC+8（+8h 偏移）。

## 代价

**优点**
- 无额外表和触发器，数据源唯一（`results` 表），不存在数据一致性问题
- Streak 的 UTC+8 日期计算逻辑在 JS 中更自然；PL/pgSQL 时区处理繁琐且难测试
- `streak.js` 是纯函数，跨日边界等边界情况可用 Vitest 充分覆盖

**缺点**
- 每次访问个人主页需拉取用户全部历史 results（当前用户数据量预计数百条，可接受）
- 若未来单用户数据量激增，需补加 `created_at >= NOW() - INTERVAL '366 days'` 过滤

## 后续

如需降低数据库读取量，可在 Pinia `streak store` 中缓存计算结果，并在新成绩保存后失效缓存重算，无需修改 `streak.js` 本身。
