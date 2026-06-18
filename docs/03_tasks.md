# keylab — 任务清单 v2

每个任务 30–90 分钟完成。验收标准全部通过 + PR 合并到 dev 视为完成。

---

## lib/ 层级约定

```
src/lib/
├── domain/      纯业务规则，不碰数据库、HTTP、文件系统
│   ├── streak.js          Streak 计算（纯函数）
│   ├── achievements.js    成就解锁规则（纯函数）
│   └── lessonRef.js       lesson_ref 解析/构建工具
├── application/ 业务用例编排，调用 domain 和 adapters
│   ├── lessons.js         课程加载 + 格式标准化
│   └── achievementEvaluator.js  触发解锁流程（写 db）
└── adapters/    外部系统实现，仅此层碰 Supabase
    ├── supabase.js        Supabase client 单例（仅供 db.js 导入）
    └── db.js              所有表操作 + 开发 mock
```

界面层（`src/views/`、`src/stores/`、`src/components/`）只能调用 `application/` 和 `adapters/db.js`，**不得直接引用 `adapters/supabase.js`**。

---

## Module: infra/testing

- [ ] T000 安装并配置 Vitest + Vue Test Utils
  - Files: `package.json`, `vite.config.js`, `tests/setup.js`
  - Steps:
    - `npm install -D vitest @vue/test-utils @vitest/coverage-v8 jsdom`
    - 在 `vite.config.js` 中添加 `test: { environment: 'jsdom', setupFiles: ['tests/setup.js'] }`
    - 在 `package.json` scripts 添加 `"test": "vitest run"`
  - Acceptance:
    - `npm run test` 无错误退出（即使 0 个测试文件）
    - `npm run check`

---

## Module: lib/adapters

- [ ] T001 迁移 supabase.js → lib/adapters/supabase.js
  - Files: `src/lib/adapters/supabase.js`（新建），`src/lib/supabase.js`（删除），`src/lib/db.js`（更新 import）
  - Steps: 移动文件，全局替换 import 路径，确认无残留旧路径
  - Acceptance:
    - `npm run build`
    - `npm run check`
    - `grep -r "from.*lib/supabase" src/` 返回空

- [ ] T002 迁移 db.js → lib/adapters/db.js
  - Files: `src/lib/adapters/db.js`（新建），`src/lib/db.js`（删除），所有引用方（更新 import）
  - Steps: 移动文件，全局替换 `@/lib/db` → `@/lib/adapters/db`
  - Acceptance:
    - `npm run build`
    - `npm run check`
    - `grep -r "from.*['\"]@/lib/db['\"]" src/` 返回空

---

## Module: lib/domain

- [ ] T003 实现 domain/lessonRef.js（parse / build 纯函数）
  - Files: `src/lib/domain/lessonRef.js`, `tests/unit/domain/lessonRef.test.js`
  - Acceptance:
    - `npm run test tests/unit/domain/lessonRef.test.js`
    - `npm run check src/lib/domain/lessonRef.js tests/unit/domain/lessonRef.test.js`
  - Tests must cover:
    - `parse('builtin:py-bfs-01')` → `{ type: 'builtin', id: 'py-bfs-01' }`
    - `parse('community:uuid-here')` → `{ type: 'community', id: 'uuid-here' }`
    - `build({ type: 'builtin', id: 'py-bfs-01' })` → `'builtin:py-bfs-01'`
    - parse → build 往返一致
    - 格式非法 → throw

- [ ] T004 实现 domain/streak.js（calcStreak 纯函数）
  - Files: `src/lib/domain/streak.js`, `tests/unit/domain/streak.test.js`
  - Acceptance:
    - `npm run test tests/unit/domain/streak.test.js`
    - `npm run check src/lib/domain/streak.js tests/unit/domain/streak.test.js`
  - Tests must cover:
    - 空数组 → `{ currentStreak: 0, bestStreak: 0, calendarData: {} }`
    - 连续 7 天 → `currentStreak: 7`
    - 断一天后 → `currentStreak: 1`
    - UTC+8 边界：UTC 15:59 归当天，UTC 16:00 归次日
    - 无效时间戳 → 跳过，不 throw

- [ ] T005 实现 domain/achievements.js（纯规则函数）
  - Files: `src/lib/domain/achievements.js`, `tests/unit/domain/achievements.test.js`
  - Acceptance:
    - `npm run test tests/unit/domain/achievements.test.js`
    - `npm run check src/lib/domain/achievements.js tests/unit/domain/achievements.test.js`
  - Tests must cover（每个成就一个 test case）:
    - `first-finish`: `allResults.length === 1`
    - `wpm-100`: `latestResult.wpm >= 100`
    - `perfect-accuracy`: `latestResult.accuracy === 100`
    - `streak-7`: `currentStreak >= 7`
    - `multilingual`: distinct languages in allResults `>= 3`
    - `practice-50`: `allResults.length >= 50`
    - 已解锁 → 不返回（`alreadyUnlocked` 过滤）

---

## Module: lib/application

- [ ] T006 实现 application/lessons.js（LessonLoader）
  - Files: `src/lib/application/lessons.js`, `tests/unit/application/lessons.test.js`
  - Dependencies: T002（adapters/db.js），T003（lessonRef.js）
  - Acceptance:
    - `npm run test tests/unit/application/lessons.test.js`
    - `npm run check src/lib/application/lessons.js`
  - Tests must cover:
    - v1 格式（无 `variants`）→ 自动包装为单变体 v2
    - `listLessons({ language: 'javascript' })` 只返回有 JS 变体的课程
    - `getLessonById('builtin:py-bfs-01')` 返回含 `variants[]` 的对象
    - `community:<uuid>` 不存在 → 返回 `null`（不 throw）
    - Supabase 查询失败 → 降级为纯内置，不 throw

- [ ] T007 实现 application/achievementEvaluator.js
  - Files: `src/lib/application/achievementEvaluator.js`, `tests/unit/application/achievementEvaluator.test.js`
  - Dependencies: T005（domain/achievements.js），T002（adapters/db.js）
  - Acceptance:
    - `npm run test tests/unit/application/achievementEvaluator.test.js`
    - `npm run check src/lib/application/achievementEvaluator.js`
  - Tests must cover:
    - 首次完成 → `evaluateAndUnlock(...)` 返回 `['first-finish']`
    - WPM ≥ 100 → 返回包含 `'wpm-100'`
    - `unlockAchievement` PK 冲突 → 静默忽略，返回值不含该 id
    - 已全部解锁 → 返回 `[]`

---

## Module: components/TypingEngine

- [ ] T010 浮动光标（CSS ::before → getBoundingClientRect div）
  - Files: `src/components/TypingEngine/useCursor.js`（新建），`src/components/TypingEngine/TypingEngine.vue`
  - Acceptance:
    - `npm run check src/components/TypingEngine/`
    - 手动验证：`\n` 处光标跳到下一行行首，`\t` 处光标宽度正确
    - 手动验证：光标 blink 动画保留

- [ ] T011 安装 Prism.js + 语法高亮 token 层
  - Files: `src/components/TypingEngine/TypingEngine.vue`
  - Steps: `npm install prismjs`，在 TypingEngine 中 tokenize text，将 token className 叠加到字符 span
  - Acceptance:
    - `npm run check src/components/TypingEngine/TypingEngine.vue`
    - 手动验证：Python `def`/`return`/`for` 有高亮色
    - 手动验证：`language='xyz'`（不支持）→ 降级 plaintext，不报错

- [ ] T012 行号组件 LineNumbers.vue
  - Files: `src/components/TypingEngine/LineNumbers.vue`（新建），`src/components/TypingEngine/TypingEngine.vue`
  - Acceptance:
    - `npm run check src/components/TypingEngine/`
    - 手动验证：行号数量等于代码行数，与代码行对齐
    - 手动验证：当前行有微亮背景色

- [ ] T013 useTypingState.js — Enter 自动缩进
  - Files: `src/components/TypingEngine/useTypingState.js`（新建/重构），`tests/unit/components/useTypingState.test.js`
  - Acceptance:
    - `npm run test tests/unit/components/useTypingState.test.js`
    - Tests must cover:
      - Enter 后 cursor 自动越过下一行前置 4 个空格
      - 跳过的字符 `typedCharCount` 不增加
      - 无前置空白时 Enter 正常换行

- [ ] T014 useTypingState.js — Tab 跳过缩进块
  - Files: `src/components/TypingEngine/useTypingState.js`, `tests/unit/components/useTypingState.test.js`
  - Dependencies: T013（同文件）
  - Acceptance:
    - `npm run test tests/unit/components/useTypingState.test.js`
    - Tests must cover:
      - Tab 跳过 4 个连续空格
      - Space 可替代 Tab 匹配缩进字符（接受 Space 视为匹配）
      - Tab 越过后 `typedCharCount` 不增加

- [ ] T015 useWpm.js — WPM 分母排除自动跳过字符
  - Files: `src/components/TypingEngine/useWpm.js`（新建/重构），`tests/unit/components/useWpm.test.js`
  - Acceptance:
    - `npm run test tests/unit/components/useWpm.test.js`
    - Tests must cover:
      - `typedCharCount`（WPM 分母）独立于 `cursorIndex`（位置）
      - 跳过 4 个缩进字符后 cursorIndex+4，typedCharCount 不变
      - WPM = `(typedCharCount / 5) / (elapsedMinutes)`

---

## Module: components/LessonSelect

- [ ] T016 VariantSelector.vue + TypingView 接入
  - Files: `src/components/LessonSelect/VariantSelector.vue`（新建），`src/views/TypingView.vue`
  - Dependencies: T006（application/lessons.js），T010–T015（TypingEngine 重构完成）
  - Acceptance:
    - `npm run check src/components/LessonSelect/VariantSelector.vue src/views/TypingView.vue`
    - 手动验证：多变体题目顶部显示选择器，切换后代码更新，打字进度重置
    - 手动验证：单变体题目不显示选择器
    - 手动验证：结果保存时 payload 含 `variant_id`

---

## Module: content

- [ ] T017 将现有 JSON 题目迁移至 v2 多变体格式
  - Files: `src/lessons/**/*.json`，`src/lessons/index.js`
  - Dependencies: T006（lessons.js 定义新格式）
  - Acceptance:
    - `npm run test tests/unit/application/lessons.test.js`（T006 测试全通过）
    - `node -e "import('./src/lessons/index.js').then(m => console.log(m.default[0].variants))"` 输出数组

- [ ] T018 为 ≥ 3 道算法题添加 JavaScript 变体
  - Files: `src/lessons/**/*.json`
  - Dependencies: T017
  - Acceptance:
    - 手动验证：`listLessons({ language: 'javascript' })` 返回 ≥ 3 条
    - 手动验证：VariantSelector 在这 3 道题上可切换 Python ↔ JavaScript

---

## Module: stores/streak

- [ ] T019 streak Pinia store（接入 domain/streak.js）
  - Files: `src/stores/streak.js`（新建）
  - Dependencies: T004（domain/streak.js）
  - Acceptance:
    - `npm run check src/stores/streak.js`
    - store 暴露 `currentStreak`、`bestStreak`、`calendarData`、`refresh(userId)` action
    - `refresh` 调用 `db.listUserResults` 后传入 `calcStreak`，不自行计算

- [ ] T020 StreakCalendar.vue
  - Files: `src/components/Profile/StreakCalendar.vue`，`src/views/ProfileView.vue`
  - Dependencies: T019
  - Acceptance:
    - `npm run check src/components/Profile/StreakCalendar.vue`
    - 手动验证：个人主页显示类 GitHub 日历，有记录的格子着色
    - 手动验证：显示当前连续天数 + 最长连续天数
    - 手动验证：完成一次练习后刷新，今天格子点亮

---

## Module: achievements

- [ ] T021 AchievementBadges.vue + 个人主页集成
  - Files: `src/components/Profile/AchievementBadges.vue`（新建），`src/views/ProfileView.vue`
  - Dependencies: T002（db.listUserAchievements），T005（domain/achievements.js 成就元数据）
  - Acceptance:
    - `npm run check src/components/Profile/AchievementBadges.vue`
    - 手动验证：个人主页显示全部 7 个成就，已解锁高亮，未解锁灰色
    - 手动验证：hover 显示成就名称和解锁条件

- [ ] T022 TypingView 完成后触发解锁 Toast
  - Files: `src/views/TypingView.vue`
  - Dependencies: T007（achievementEvaluator），T021（AchievementBadges 先完成）
  - Acceptance:
    - `npm run check src/views/TypingView.vue`
    - 手动验证：首次完成练习弹出「起步」解锁提示
    - 手动验证：WPM ≥ 100 时弹出「百键侠」
    - 手动验证：重复完成不重复弹出已解锁成就

---

## Module: paths

- [ ] T023 Supabase paths + path_items 表 schema + seed
  - Files: `supabase/migrations/<timestamp>_create_paths.sql`
  - Steps: 建表（`paths`、`path_items`），插入 ≥ 2 条系统路径数据
  - Acceptance:
    - `supabase db reset` 后 `supabase db query "select count(*) from paths"` 返回 ≥ 2
    - `npm run check`

- [ ] T024 PathsView.vue + 路径进度计算
  - Files: `src/views/PathsView.vue`（新建），`src/components/Paths/PathList.vue`（新建），`src/components/Paths/PathDetail.vue`（新建），`src/router/index.js`
  - Dependencies: T023，T006（getLessonById 解析 lesson_ref）
  - Acceptance:
    - `npm run check src/views/PathsView.vue src/components/Paths/`
    - 手动验证：导航可进入路径列表，显示进度 N/M
    - 手动验证：完成路径内某道题后该题标记为已完成，百分比更新
    - 手动验证：`lesson_ref` 指向不存在课程 → 显示「题目已下架」

---

## Module: collections

- [ ] T025 collections DB 函数（adapters/db.js）
  - Files: `src/lib/adapters/db.js`（新增 collections 函数组）
  - Dependencies: T002
  - Acceptance:
    - `npm run check src/lib/adapters/db.js`
    - 手动验证（需登录）：`createCollection`、`addToCollection`、`removeFromCollection`、`deleteCollection` 均正常

- [ ] T026 CollectionManager.vue + 收藏按钮
  - Files: `src/components/Profile/CollectionManager.vue`（新建），`src/views/ProfileView.vue`，`src/components/LessonSelect/LessonCard.vue`
  - Dependencies: T025
  - Acceptance:
    - `npm run check src/components/Profile/CollectionManager.vue`
    - 手动验证：题目卡片显示收藏按钮，点击弹出收藏夹选择器
    - 手动验证：个人主页「我的收藏」展示收藏夹，可顺序进入练习

---

## Module: community

- [ ] T027 SubmitView.vue + db.submitLesson
  - Files: `src/views/SubmitView.vue`（新建），`src/lib/adapters/db.js`（submitLesson），`src/router/index.js`
  - Acceptance:
    - `npm run check src/views/SubmitView.vue`
    - 手动验证：登录用户填表提交后状态显示「等待审核」
    - 手动验证：未登录访问 /submit → 跳转 /login

- [ ] T028 AdminReviewView.vue + db.reviewLesson
  - Files: `src/views/AdminReviewView.vue`（新建），`src/lib/adapters/db.js`（reviewLesson），`src/router/index.js`
  - Dependencies: T027
  - Acceptance:
    - `npm run check src/views/AdminReviewView.vue`
    - 手动验证：admin 账号点击通过后，题库列表可见该题
    - 手动验证：非 admin 访问 /admin/review → 跳转首页

- [ ] T029 MySubmissions 标签页（ProfileView）
  - Files: `src/components/Profile/MySubmissions.vue`（新建），`src/views/ProfileView.vue`
  - Dependencies: T027
  - Acceptance:
    - `npm run check src/components/Profile/MySubmissions.vue`
    - 手动验证：个人主页「我的投稿」标签显示历史投稿及状态
    - 手动验证：被拒绝投稿显示拒绝原因

---

## 任务依赖关系

```
T000 ──────────────────────────────── 所有含 npm run test 的任务
T001 → T002

T002 ┬→ T006 → T017 → T018
     └→ T025 → T026

T003 → T006
T004 → T019 → T020
T005 → T007 → T022

T006 → T016

T010 ┐
T011 ┤
T012 ┤→ T016
T013 ┤
T014 ┤
T015 ┘

T007 → T022

T023 → T024

T025 → T026

T027 ┬→ T028
     └→ T029
```
