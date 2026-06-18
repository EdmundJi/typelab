# 0001 — 使用 Supabase 而非自定义后端

## 状态

已采纳

## 背景

项目需要用户认证和数据持久化（保存成绩、排行榜）。
团队8人，均为学生，没有服务器运维经验。
初期需要零成本部署。

## 决策

使用 Supabase 作为 BaaS（Backend as a Service）：
- Supabase Auth 处理注册、登录、session
- Supabase PostgreSQL 存储 results 表
- Supabase JS SDK 在前端直接调用，无需自定义后端

## 代价

**优点**
- 免费 tier 足够支撑团队初期使用
- Auth 开箱即用，不需要自己写 JWT 逻辑
- 前端直接调用，省去整个后端层
- 有 Vercel 集成，部署简单

**缺点**
- 业务逻辑（如防止刷榜）只能在前端做，安全性有限
- 如果后期迁移到自定义后端，Supabase 特定 API 需要重写
- Row Level Security 配置有一定学习成本

## 后续

如果后期需要 LLM 生成题目等复杂后端逻辑，加 Vercel Serverless Functions 或 FastAPI，与 Supabase 并存，不冲突。
