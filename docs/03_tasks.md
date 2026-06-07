# TypeLab — 任务清单

每个任务对应一个功能模块，由一名成员负责。
任务完成 = 验收命令全部通过 + PR 合并到 dev。

---

## T01 — 项目骨架（Tech Lead 完成，不分配）

**负责人**：Tech Lead
**分支**：`main`（直接初始化）

- [x] `npm create vue@latest`，选 Vue Router + Pinia，不选 TypeScript
- [x] 安装 Tailwind CSS、ECharts、Supabase JS SDK
- [x] 配置 `src/lib/supabase.js`（从环境变量读 URL 和 key）
- [x] 配置 `src/lib/db.js`（统一数据访问入口，未配置 Supabase 时使用 mock 数据）
- [x] 配置 `src/router/index.js`（所有路由，页面组件暂为空占位）
- [x] 配置 `src/stores/user.js`（Pinia，存 session 和 user 对象）
- [x] 创建所有组件目录和空的 `index.vue` 文件
- [x] 配置 Vercel 部署；Supabase 环境变量仅上线或真实后端联调时配置
- [x] 验证：`npm run dev` 能启动，所有路由跳转不报错

---

## T02 — Layout 与导航

**负责人**：Yang
**分支**：`feature/layout`  
**文件范围**：`src/components/Layout/`、`src/App.vue`

- [x] 顶部导航栏：Logo + 链接（首页、排行榜、个人主页）
- [x] 已登录显示用户邮箱和退出按钮，未登录显示登录按钮
- [x] 导航栏登录状态从 Pinia user store 读取
- [x] 整体页面布局（居中容器、最大宽度限制）

验收：
```
- 访问 / 能看到导航栏
- 导航栏所有链接点击后路由正确跳转
- 未登录时不显示"个人主页"链接
```

---

## T03 — 用户认证

**负责人**：Yang 
**分支**：`feature/auth`  
**文件范围**：`src/components/Auth/`、`src/views/LoginView.vue`、`src/main.js`

- [x] 登录表单（邮箱 + 密码）
- [x] 注册表单（邮箱 + 密码 + 确认密码）
- [x] 通过 `src/lib/db.js` 调用 `supabase.auth.signInWithPassword()` 和 `supabase.auth.signUp()`
- [x] 成功后更新 Pinia user store，跳转首页
- [x] 失败时在表单下方显示错误信息（不用 alert）
- [x] 退出登录调用 `supabase.auth.signOut()`
- [x] 启动时读取当前 session，刷新页面后恢复 Pinia user store
- [x] 监听 Supabase auth state change，同步更新 Pinia user store

验收：
```
- 用新邮箱注册后能登录
- 错误密码显示"邮箱或密码错误"
- 登录后刷新页面仍保持登录状态
- 退出后 Pinia user store 清空
```

---

## T04 — 课程选择

**负责人**：Kalin
**分支**：`feature/lesson-select`  
**文件范围**：`src/components/LessonSelect/`、`src/views/HomeView.vue`、`src/lessons/index.js`

- [x] 从 `src/lessons/index.js` 读取所有课程元数据（id、title、category、difficulty）
- [x] 网格布局展示课程卡片
- [x] 按类别筛选（warmup / 排序 / 树 / DP / 图 / JS / 概念）
- [x] 每张卡片显示标题、类别标签、难度星级
- [x] 点击卡片跳转 `/lesson/:id`

验收：
```
- 首页能看到至少 5 个课程卡片
- 筛选按钮点击后只显示对应类别的课程
- 点击任意卡片能跳转到打字页面
```

---

## T05 — 打字引擎（核心）

**负责人**：Frank  
**分支**：`feature/typing-engine`  
**文件范围**：`src/components/TypingEngine/index.vue`

组件接口（不能改）：
```javascript
// Props
text: String  // 必传，要打的完整文本

// Emits
complete: { wpm: Number, accuracy: Number, duration: Number, errors: Number }
```

- [x] 将 `text` 拆分为字符数组，每个字符有状态：`pending` / `correct` / `wrong`
- [x] 键盘输入实时对比当前字符，更新状态
- [x] 正确字符绿色，错误字符红色，未到达字符灰色，当前光标位置下划线
- [ ] Tab 键输入制表符（阻止默认的焦点切换行为）
- [ ] 第一次按键时记录开始时间
- [ ] 每 5 秒更新并显示实时 WPM
- [ ] 打完最后一个字符，计算最终结果，emit `complete`
- [ ] WPM 计算公式：`(总字符数 / 5) / (用时分钟数)`

验收：
```
npm run test -- TypingEngine   （Vitest 单元测试）

手动验收：
- 输入正确字符变绿，输入错误字符变红
- Tab 键能输入制表符
- 打完后 complete 事件被触发，携带正确的 wpm 和 accuracy 数值
- WPM 在打字过程中实时变化
```

---

## T06 — 成绩结果页

**负责人**：Eve
**分支**：`feature/result`  
**文件范围**：`src/components/Result/`、`src/views/ResultView.vue`

- [ ] 从路由 state 接收 `{ wpm, accuracy, duration, errors, lessonId }`
- [ ] 显示本次成绩：WPM、准确率、用时、错误数
- [ ] 已登录：通过 `src/lib/db.js` 查询本课程历史最佳 WPM（开发阶段 mock，上线阶段 Supabase）
- [ ] 两个按钮：再来一次（跳回同一课程）、选其他课程（跳回首页）
- [ ] 未登录时显示"登录后成绩将自动保存"的提示

验收：
```
- 完成打字后结果页数据正确
- 已登录用户能看到历史最佳对比
- 两个按钮路由跳转正确
```

---

## T07 — 排行榜

**负责人**：Sy
**分支**：`feature/leaderboard`  
**文件范围**：`src/components/Leaderboard/`、`src/views/LeaderboardView.vue`

- [ ] 通过 `src/lib/db.js` 查询排行榜数据（开发阶段 mock 聚合，上线阶段 Supabase 聚合）
- [ ] 展示前 20 名：排名、邮箱（只显示 @ 前的部分）、最高 WPM、准确率
- [ ] 当前登录用户的行高亮
- [ ] 每 30 秒自动刷新
- [ ] 加载时显示 loading 状态

验收：
```
- 完成一次打字后，排行榜能看到自己的成绩
- 同一用户多次完成，排行榜只显示最高分
- 30秒后数据自动更新
```

---

## T08 — 个人主页

**负责人**：Luna & Chen
**分支**：`feature/profile`  
**文件范围**：`src/components/Profile/`、`src/views/ProfileView.vue`

- [ ] 未登录访问时跳转 `/login`（路由守卫）
- [ ] 通过 `src/lib/db.js` 查询当前用户的所有 results 记录，按时间倒序
- [ ] 表格展示历史记录：课程名、WPM、准确率、时间
- [ ] ECharts 折线图：横轴为时间，纵轴为 WPM，展示进步趋势
- [ ] 统计卡片：总练习次数、平均 WPM、最高 WPM

验收：
```
- 未登录访问 /profile 自动跳转 /login
- 登录后能看到所有历史成绩
- 折线图随历史数据变化
```

---

## T09 — 题库内容（持续）

**负责人** Gong  
**分支**：`content/xxx`  
**文件范围**：`src/lessons/` 目录

初期目标（MVP 前必须完成）：
- [ ] `warmup/01-home-row.json`：5条 home row 练习
- [ ] `code/python/sorting.json`：快排、归并、冒泡实现各1条
- [ ] `code/python/trees.json`：BFS、DFS、BST 插入各1条
- [ ] `concepts/complexity.json`：3条时间复杂度分析文段

每条课程 JSON 格式：
```json
{
  "id": "py-quicksort-01",
  "title": "快速排序（Python）",
  "category": "sorting",
  "difficulty": 3,
  "text": "def quicksort(arr):\n    if len(arr) <= 1:\n        return arr",
  "note": "平均 O(n log n)，最坏 O(n²)，原地排序"
}
```

验收：
```
- 新增 JSON 文件后，首页课程列表能看到新课程
- 点击课程能正常进入打字界面
- text 字段中的 \n 在打字界面正确显示为换行
```
