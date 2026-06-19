# keylab — 项目提案 v3

## 为什么做

程序员打代码的速度远慢于打普通文字，根本原因是括号、下划线、冒号、缩进、换行等代码输入要素在标准打字练习中几乎不出现。现有打字网站（Monkeytype、keybr）主要针对英文散文优化，对真实代码场景帮助有限。

keylab 的目标是成为**为程序员设计的代码打字训练器**：用户通过输入真实算法代码，同时训练编程手速、符号输入熟练度和算法实现记忆。产品体验对标 Monkeytype 的沉浸式打字反馈，但内容全部来自真实、有意义、可复用的代码片段。

## 产品定位

keylab 不是在线判题系统，也不是代码编辑器，而是介于「打字练习」和「算法记忆」之间的训练产品：

- 用真实算法代码替代随机单词
- 用多语言、多风格、多难度变体覆盖不同用户水平
- 用成绩、Streak、成就、排行榜和学习路径把一次性练习变成持续习惯
- 用社区投稿补充内容，让题库可持续增长

## 给谁用

- **主要用户**：计算机专业学生、算法面试准备者，希望提升代码输入速度和算法熟练度
- **次要用户**：任何想提升代码手速、熟悉符号输入和键盘流畅度的开发者
- **内容贡献者**：登录用户可提交练习内容，经管理员审核后进入题库
- **管理员**：负责审核投稿、维护内容质量和平台基础数据

## 当前基础

v1 已完成基础 MVP：

- 打字引擎与 WPM / 准确率统计
- 课程列表与课程练习流程
- Supabase 登录、成绩记录与排行榜
- 基础主题、路由和页面结构

v2 已扩展核心功能：

- 课程变体：同一算法支持多语言 / 多风格 / 多步骤
- Prism.js 语法高亮
- Streak 日历与连续打卡
- 成就系统与解锁提示
- 收藏夹
- 学习路径（Paths）
- 社区投稿与管理员审核
- 全局最佳 WPM 排行榜

## 新一轮升级目标

接下来升级分为两条主线：

1. **工程化升级**：补全 TypeScript、测试、CI、数据库适配器隔离和版本发布基础，让项目更稳定、可维护、可扩展。
2. **UI / 产品完善**：补齐首页叙事、登录用户 Dashboard、练习完成页、Footer、404、Loading、搜索筛选等产品闭环，让网站从「课程列表工具」升级为完整训练产品。

## 核心产品升级

### 1. 首页重构

首页按用户状态分两路渲染。

**游客视图**强调产品价值：

- Hero：为程序员设计的打字练习
- 副标题：通过打出真实算法代码，同时训练手速和算法记忆
- CTA：开始练习、注册账号
- 三个卖点：真实代码、多语言变体、算法记忆
- 下方保留课程列表入口

**登录用户视图**强调今日行动：

- Dashboard：当前 Streak、今日是否已练、总练习次数、本周练习次数、个人最佳 WPM
- 继续上次练习或推荐入门课程
- 学习路径入口
- 下方保留课程列表

### 2. 课程发现升级

课程列表不再只依赖静态 `lessonMetas`，而是调用应用层 `listLessons()`，确保审核通过的社区课程能出现在首页。

课程列表增加：

- 搜索框：按课程标题实时过滤
- 分类 Tabs：保留现有分类筛选
- 语言下拉：按 Python / JavaScript / Go 等语言过滤
- 语言标签：课程卡片展示可选语言
- 个人最佳 WPM：登录用户可在卡片看到该课程 PB
- Skeleton loading：替代简单「加载中」文字

### 3. 练习完成页升级

当前结果页只有数字和按钮，缺少完成感。升级后增加：

- 新纪录高亮：WPM 数字突出显示并带「新纪录」标签
- 首次完成提示
- 未破纪录时显示「距最佳 -X wpm」
- 推荐下一课：从同类别课程中推荐未完成或随机课程
- 复制成绩：一键复制分享文本

### 4. 基础结构补全

- 新增 Footer：品牌说明、练习 / 路径 / 排行榜 / GitHub 链接、版本号
- 新增 404 页面
- 登录页增加价值说明：成绩保存、Streak、成就、排行榜
- 排行榜增加「你的排名」提示和空状态 CTA
- 打字界面增加 Esc 重置快捷键、当前行 / 总行数显示
- 统一 SkeletonCard / SkeletonRow loading 组件

## 工程化升级

### 1. TypeScript 迁移

引入 TypeScript 和 `vue-tsc`，新增：

- `tsconfig.json`
- `tsconfig.app.json`
- `tsconfig.node.json`
- `npm run typecheck`

迁移范围：

- `src/lib/**`
- application 层
- adapters 层
- stores
- router
- composables
- `main` 与 `vite.config`
- 所有 Vue SFC 的 `<script setup lang="ts">`

新增中心类型声明 `src/types/index.ts`，统一定义：

- Lesson / Variant / RawLesson / NormalizedLesson
- TypingResult / UserResult / LeaderboardEntry
- Collection / Path / CommunityLesson
- Achievement / CheckContext
- Session / AuthResponse

> 勘误：Variant 字段以现有代码和 JSON 的 `variant_id` 为准，同步修正文档中误写的 `id`。

### 2. 数据库适配器重构

当前 `db.js` 同时包含 Supabase 实现和 mock 分支，导致生产代码打包 mock 数据、测试难以验证真实行为。升级后拆为：

```text
src/lib/adapters/
  types.ts
  supabase.ts
  SupabaseAdapter.ts
  MemoryAdapter.ts
  db.ts
```

目标：

- `DbAdapter` 定义统一数据访问接口
- `SupabaseAdapter` 封装所有 Supabase 调用
- `MemoryAdapter` 提供纯内存实现，用于开发和测试
- `db.ts` 根据环境选择适配器，并继续导出旧的具名函数，保证现有 View / Store 不需要大规模改动
- application 层函数支持注入 adapter，方便单元测试

### 3. 测试补全

现有测试迁移为 TypeScript，并新增覆盖：

- `MemoryAdapter` 所有主要行为
- `getAvatar` 纯函数
- streak store
- user store
- router guards
- lessons / achievementEvaluator 改为注入 `MemoryAdapter` 测试

覆盖率目标：

- `src/lib/**`
- `src/stores/**`
- `src/router/**`
- 行覆盖率 80%
- 函数覆盖率 80%

`SupabaseAdapter` 排除在单元测试覆盖率外，由后续集成测试或真实环境验证。

### 4. CI 与发布基础

新增 GitHub Actions CI：

```text
typecheck → check → test → build
```

同时补充：

- `CHANGELOG.md`，采用 Keep a Changelog 格式
- `package.json` 版本从 `0.0.0` 升至 `1.0.0`
- 保留现有 `leaderboard.yml`

## 成功标准

### 产品指标

- 新用户进入首页后能在 10 秒内理解「这是什么、为什么用、怎么开始」
- 登录用户能在首页明确看到今天该做什么
- 每次练习完成后有明确的终点感和下一步行动
- 审核通过的社区课程能出现在首页课程列表
- 课程可通过搜索、分类和语言快速找到

### 训练指标

- 用户在 4 周内代码打字 WPM 提升 20% 以上
- 日活用户中超过 50% 有连续打卡记录（Streak ≥ 3 天）
- 社区投稿渠道每月产生有效投稿
- 题库最终扩展到每个 category ≥ 5 道，总数 ≥ 30 道

### 工程指标

- TypeScript typecheck 通过
- CI 在 push / PR 上稳定运行
- 核心 lib / store / router 覆盖率达到 80%
- Mock 与 Supabase 数据访问通过 adapter 隔离
- 生产包不再包含开发 mock 数据

## 不做什么

### 产品边界

- 不做代码执行和判题：keylab 不是 OJ，不需要沙箱
- 不做自由作答：答案必须是预设文本之一
- 不做团队 / 小组功能：留到未来版本
- 不做移动端打字优化：无实体键盘时体验不符合产品目标
- 不做付费墙：当前所有功能免费
- 不做视频教程或图文课程
- 不做 Landing Page 动画 / 视频背景：与 monospace 极简风格不符
- 不做好友、动态流等社交功能
- 不做复杂推荐算法：当前内容规模较小，规则推荐足够

### 工程边界

- 不在单元测试中覆盖真实 Supabase 网络交互
- 不测试依赖 DOM layout 的 `useCursor` 和完整 `TypingEngine` 布局行为
- 不在本轮补充大量课程内容；内容扩充作为 UI 完成后的独立任务

## 技术约束

- 部署成本保持为零：Vercel 免费层 + Supabase 免费层
- 技术栈保持 Vue 3 + Supabase + Vercel
- 不引入新前端框架
- 代码练习内容只做渲染和输入校验，不提供执行环境
- UI 继续保持极简、monospace、偏开发者工具风格

## 执行优先级

```text
1. 修复社区课程不出现在首页的问题
2. 新增 404 页面
3. 首页分游客 / 登录用户两路重构
4. TypeScript 基础设施与中心类型
5. db adapter 重构
6. 测试补全与覆盖率目标
7. CI workflow
8. 成绩页升级
9. Footer、登录页、排行榜、打字页等 UI 打磨
10. CHANGELOG 与 1.0.0 版本发布
```
