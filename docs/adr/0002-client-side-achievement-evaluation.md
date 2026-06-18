# 0007 — 成就解锁在客户端触发，而非数据库触发器

## 状态

已采纳

## 背景

成就解锁需要综合多个数据维度（历史成绩数、WPM、Streak 长度、语言种类），在用户每次完成练习后判断。可行方案：

1. **客户端触发**：结果保存成功后，前端用已有数据评估并调用 `unlockAchievement`
2. **Supabase DB Trigger**：在 `results` 表的 INSERT 触发器中运行 PL/pgSQL 评估逻辑
3. **Edge Function**：Supabase Edge Function 在插入后异步评估

## 决策

选择方案 1（客户端触发）。

评估逻辑封装在 `src/lib/achievements.js`，由 `TypingView` 在成绩保存成功后调用。调用方传入已有的历史成绩和 streak 数据，`achievements.js` 不发起额外网络请求，只写入新解锁的成就。

## 代价

**优点**
- 零服务端代码，不引入 PL/pgSQL 或 Edge Function 的维护负担
- 评估逻辑集中在一个纯函数文件，可单元测试，边界情况易验证
- 解锁失败不阻塞结果页展示（catch 后静默 log）

**缺点**
- 理论上可被客户端篡改触发解锁（刷成就），但本项目无竞技性成就系统，可接受
- 需要在前端拿到完整历史数据才能评估（已通过 `listUserResults` 拉取，数据量可控）

## 后续

若未来引入防刷需求，可在不修改接口的情况下将评估逻辑迁移到 Supabase Edge Function，`achievements.js` 改为调用 Function 即可。
