# keylab — 需求文档 v2

## 背景

见 `docs/00_proposal.md`。

## 用户角色

| 角色 | 描述 |
|---|---|
| 访客 | 未登录，可以打字但成绩不保存、不上榜、无法投稿 |
| 练习者 | 登录后使用全部功能：打字、成绩记录、Streak、成就、学习路径、投稿 |
| 管理员 | Supabase 管理员角色，审核社区投稿，管理题库 |

---

## F01 — 用户认证（已完成，小幅扩展）

- 邮箱 + 密码注册 / 登录 / 退出
- 登录状态刷新后保持
- 用户可设置**显示名（username）**，用于排行榜展示（默认取邮箱 @ 前的部分）
- 未登录用户可以打字，成绩不保存，Streak/成就/投稿均不可用

---

## F02 — 课程选择（重构）

### F02.1 题库列表
- 展示所有可用课程（内置 JSON + 已审核社区题目）
- 支持按 topic 筛选（warmup / 排序 / 树 / DP / 图 / JS / 概念）
- 支持按语言筛选（Python / JavaScript / Go / 全部）
- 课程卡片显示：标题、topic 标签、难度、可用语言图标、用户历史最佳 WPM（已登录时；从未打过该题显示 `--`）
- 点击卡片进入题目页，**变体选择在题目页进行，不在卡片处**

### F02.2 学习路径入口
- 首页单独展示「学习路径」区域
- 系统预置路径列举，每条路径显示进度（已完成 N / 总计 M）
- 用户可进入路径按顺序练习

---

## F03 — 打字引擎（核心重构）

### F03.1 变体选择
- 进入题目页后，顶部显示变体选择器（Tab 样式或下拉）
- 变体维度：语言（Python / JS 等）× 风格（详细版 / 精简版 / 带注释版）× 难度步骤（step1 骨架 → step2 核心逻辑 → step3 完整实现）
- 切换变体会重置当前打字进度
- 变体信息作为成绩的一部分保存（`variant_id`）

### F03.2 IDE 体验
- **语法高亮**：使用 Prism.js 对目标代码按语言着色（keyword / string / number / comment / operator 等 token 颜色）
- **行号 gutter**：左侧固定列显示行号，随代码行数动态生成
- **当前行高亮**：当前光标所在行背景微亮
- **语言徽章**：右上角显示当前变体语言标识（Python / JS 等）
- **精准光标**：使用 `getBoundingClientRect()` 定位浮动光标元素，解决 `\n`/`\t` 错位问题
- **自动缩进**：按 Enter 后自动跳过下一行的前置空白字符（不需要逐个敲）
- **智能 Tab**：按 Tab 跳过当前位置起的一个完整缩进块（4 个空格或一个 `\t`）
- **空格替代 Tab**：允许用空格键代替 Tab 键匹配缩进字符

### F03.3 实时统计
- 实时 WPM（每次按键更新）
- 实时准确率
- 进度条
- 计时器（第一次按键后启动，用户中途停止敲键不暂停，持续计时）

**WPM 计算口径**：分母为用户实际按键次数对应的字符数，自动缩进和智能 Tab 跳过的字符**不计入**分母。同一题目在相同字符总数下，关闭快捷键的用户 WPM 会更低——这是预期行为，不视为 bug。

### F03.4 完成逻辑
- 打完最后一个字符自动触发完成
- 计算 WPM / 准确率 / 用时 / 错误数，跳转结果页

---

## F04 — 成绩结果页（扩展）

- 显示本次 WPM、准确率、用时、错误数
- 显示本题目 + 当前变体的历史最佳 WPM（已登录）
- **错误字符回放**：高亮显示本次打错最多的前 5 个字符
- **知识点提示**：展示当前变体的 `note` 字段（打完才出现）
- 已登录用户成绩自动保存（含 `variant_id`）
- 按钮：再来一次 / 换个变体 / 返回题库

---

## F05 — 排行榜（重构为分题目排行榜）

- **按题目独立排行**：每道题目（`lesson_id`）单独一张排行榜，不跨题目合并比较
- 排行榜入口：题目页完成后的结果页 + 题目详情页顶部
- 展示字段：排名、显示名、WPM、准确率、变体（语言 + 风格 + 难度步骤）、时间
- 每人只取该题目下的历史最高 WPM 一条
- 当前登录用户的行高亮
- 数据按需加载（进入题目页时拉取），不做全局轮询

---

## F06 — 个人主页（重构扩展）

### F06.1 Streak 日历
- 类似 GitHub contribution calendar，按日期显示练习记录
- 每日至少完成 1 次练习，当天格子点亮
- **时区**：固定 UTC+8（北京时间）。`created_at` 写入 UTC，前端展示时转换为 UTC+8 判断所属日期
- 显示当前连续天数和历史最长连续天数

### F06.2 成就徽章（5-8 个，最小集）

| 徽章 | 解锁条件 |
|---|---|
| 起步 | 完成第一次练习 |
| 百键侠 | 单次 WPM ≥ 100 |
| 完美主义者 | 单次准确率 100% |
| 坚持七天 | Streak 连续 ≥ 7 天 |
| 多面手 | 完成 3 种不同语言的练习（同一题目的不同语言变体均计入，各语言至少完成 1 次） |
| 内容贡献者 | 投稿被采纳 1 道题目 |
| 题海战术 | 累计完成 50 次练习 |

### F06.3 历史成绩
- 表格展示所有历史记录：题目名 + 变体、WPM、准确率、时间
- ECharts 折线图：横轴时间、纵轴 WPM，展示进步趋势

### F06.4 统计卡片
- 总练习次数、平均 WPM、最高 WPM、最长 Streak

---

## F07 — 学习路径（新增）

### F07.1 系统预置路径
- 编辑者预设有序的题目序列，附路径名称和描述
- 示例路径：「算法面试基础」「Python 刷题入门」「JS 高频手写」
- 路径展示进度（已完成 / 总计），已完成的题目打勾

### F07.2 用户自定义收藏
- 题目页和列表页均有「收藏」按钮
- 用户可创建多个收藏夹，将题目加入收藏夹
- 可在个人主页「我的收藏」下查看和调整顺序
- 可按收藏夹顺序依次练习（类似播放列表）

---

## F08 — 社区投稿（新增）

### F08.1 投稿流程
- 登录用户访问 `/submit` 填写投稿表单
- 表单字段：题目标题、topic、语言、风格标签、难度步骤、代码文本、知识点说明
- 提交后状态为 `pending`，显示「已提交，等待审核」

### F08.2 审核机制
- 管理员通过 Supabase Dashboard 或内置审核页（`/admin/review`）查看待审题目
- 可预览投稿内容（标题、代码高亮、note）
- 操作：通过（`approved`）/ 拒绝（`rejected`，附拒绝原因）
- 通过后题目出现在题库列表，来源标注「社区」

### F08.3 投稿者反馈
- 个人主页「我的投稿」标签页展示历史投稿及状态
- 拒绝时可看到拒绝原因

---

## 非功能需求

- **性能**：打字引擎输入延迟 < 16ms（不卡键）
- **兼容性**：Chrome 110+、Edge 110+
- **部署**：Vercel 自动部署，每个 PR 生成预览链接
- **成本**：Vercel 免费 + Supabase 免费 tier，月费用为零
- **可访问性**：打字区域键盘焦点管理正确，不依赖鼠标

---

## 数据模型

### 现有表（保持）

```
results
  id, user_id, lesson_id, wpm, accuracy, duration, errors, created_at
  新增: variant_id text（记录使用的变体）
```

### 新增表

```sql
-- 社区投稿
community_lessons
  id uuid PK
  submitted_by uuid → auth.users
  title text
  topic text
  language text
  style text           -- verbose | concise | annotated
  step integer         -- 1 难度骨架, 2 核心逻辑, 3 完整实现
  label text           -- 变体显示名
  text text            -- 代码文本
  note text
  status text          -- pending | approved | rejected
  reject_reason text
  reviewed_by uuid → auth.users
  reviewed_at timestamptz
  created_at timestamptz

-- 成就定义（静态，可用代码维护）
achievements
  id text PK           -- 如 "first-finish"
  name text
  description text
  icon text

-- 用户成就
user_achievements
  user_id uuid → auth.users
  achievement_id text → achievements
  unlocked_at timestamptz
  PRIMARY KEY (user_id, achievement_id)

-- 系统学习路径
paths
  id uuid PK
  title text
  description text
  order integer        -- 展示顺序

-- 路径中的题目（有序）
path_items
  id uuid PK
  path_id uuid → paths
  lesson_ref text      -- 格式见下方 lesson_ref 规范
  variant_hint text    -- 推荐的变体id（可选）
  position integer

-- 用户自定义收藏夹
collections
  id uuid PK
  user_id uuid → auth.users
  name text
  created_at timestamptz

-- 收藏夹内容
collection_items
  id uuid PK
  collection_id uuid → collections
  lesson_ref text      -- 格式见下方 lesson_ref 规范
  variant_hint text
  position integer
```

---

## `lesson_ref` 格式规范

`lesson_ref` 是 `path_items` 和 `collection_items` 中用于统一引用课程的字符串字段，格式如下：

| 课程来源 | 格式 | 示例 |
|---|---|---|
| JSON 内置课程 | `builtin:<lesson_id>` | `builtin:bubble_sort` |
| 社区审核课程 | `community:<uuid>` | `community:d4f2e1a0-...` |

加载器根据前缀区分来源，UUID 格式的 `community:<uuid>` 中 uuid 即 `community_lessons.id`。

---

## 内置课程 JSON 新格式

见 `SPEC.md` 中的课程格式定义。变体字段向前兼容：无 `variants` 的旧格式由加载器自动包装为单变体。

---

## 边界情况

| 情况 | 处理 |
|---|---|
| 用户打到一半刷新 | 成绩丢失，重新开始，不保存不完整记录 |
| 切换变体 | 重置打字进度，重置统计 |
| 网络提交成绩失败 | 显示「成绩保存失败」提示，本地结果正常展示 |
| 访客完成练习 | 结果页正常展示，提示「登录后自动保存成绩」 |
| 同一用户同一变体多次完成 | 全部保存，排行榜只取最高分 |
| 投稿代码包含 XSS | 前端展示时使用语法高亮渲染（不 innerHTML 原始文本），Supabase RLS 隔离数据 |
| 变体组合不存在 | 禁用该变体 Tab/选项（灰显），不跳转、不报错 |
| 用户同时有内置和社区课程的历史记录 | `results.lesson_id` 存储 `lesson_ref` 格式字符串（`builtin:xxx` 或 `community:uuid`），统一查询 |
