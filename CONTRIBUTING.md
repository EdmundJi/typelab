# CONTRIBUTING.md — 如何参与开发

## 第一次设置

```bash
# 1. 先在 GitHub 上 fork 主仓库到自己的账号

# 2. 克隆自己的 fork
git clone [你的 fork 地址]
cd typelab

# 3. 添加主仓库为 upstream，方便同步最新 dev 分支
git remote add upstream [主仓库地址]

# 4. 安装依赖
npm install

# 5. 启动开发服务器
npm run dev
# 浏览器打开 http://localhost:5173
```

开发阶段默认使用 `src/lib/db.js` 中的 mock 数据，不需要配置自己的 `.env.local`，也不需要连接 Supabase。只有上线部署或真实后端联调时，才需要配置 Supabase 环境变量。

---

## 每次开发的流程

```bash
# 第一步：同步主仓库 dev 分支
git fetch upstream
git checkout -B dev upstream/dev

# 第二步：推送最新 dev 到自己的 fork
git push origin dev

# 第三步：切到自己的功能分支（第一次需要创建）
git checkout -b feature/你的模块名   # 第一次
git checkout feature/你的模块名     # 之后每次

# 第四步：写代码
# ...

# 第五步：提交
git add .
git commit -m "新增：xxx"

# 第六步：推送到自己的 fork
git push origin feature/你的模块名
```

---

## 开 PR

1. 推送后去 GitHub 仓库页面
2. 从自己的 fork 发起 Pull Request
3. 源分支：`你的 GitHub 用户名:feature/你的模块名`，目标分支：主仓库 `dev`
4. 填写 PR 描述（GitHub 会自动带出 `.github/pull_request_template.md`）
5. 提交后等待项目维护者或同学 review

**PR 描述模板：**

```
## 做了什么
（一句话说清楚）

## 怎么验证
（怎么测试你做的功能，Vercel 预览链接在哪）

## 有什么问题
（遇到没解决的问题，或者不确定的地方）
```

---

## 代码风格与自动检查

代码格式和常见代码问题统一交给 Biome 处理，review 时不围绕个人偏好争论空格、换行、引号等细节。

- 使用 Biome 统一格式化代码、检查 lint 问题。
- 提交前至少执行：

```bash
npm run check
npm run build
```

- 如果需要自动修复格式和可自动修复的问题，执行：

```bash
npm run check:fix
```

- 也可以按需单独执行：

```bash
npm run format        # 自动格式化
npm run format:check  # 只检查格式，不修改文件
npm run lint          # 只检查 lint 问题
```

- 不手动大范围调整无关文件格式，避免 PR diff 变大。
- Biome 能修复的问题，优先用 `npm run check:fix` 修复；Biome 不能判断的问题，再交给 reviewer 判断。

---

## 代码可读性规范

代码应优先保证清晰、简单、容易 review。功能可以先做小，不要为了“一次写完”把逻辑写复杂。

- 单个函数尽量只做一件事。
- 逻辑嵌套建议不超过 3 层；超过时优先考虑 early return、拆函数、拆组件。
- Vue 组件不要承担过多职责：页面结构放 view，复用 UI 放 components，跨页面状态放 Pinia store，通用逻辑可拆成工具函数或 composable。
- 不在 template 中写复杂表达式；复杂判断应放到 `computed` 或函数中。
- 避免复制粘贴大段重复代码；重复出现 2 次以上时考虑抽成函数或组件。
- 命名要表达意图，避免使用 `data`、`temp`、`foo` 这类含义不清的名字。
- PR 中只修改当前任务相关文件；无关重构、格式化、文档修正应单独提交或单独 PR。

示例：

```js
// 不推荐：嵌套太深
if (user) {
  if (user.session) {
    if (route.meta.requiresAuth) {
      // ...
    }
  }
}

// 推荐：优先返回，降低嵌套
if (!user?.session) return
if (!route.meta.requiresAuth) return
// ...
```

---

## Commit 格式

```
动作：做了什么
```

| 动作 | 用于 |
|---|---|
| `新增` | 加了新功能或新文件 |
| `修复` | 修了 bug |
| `更新` | 改进已有的东西 |
| `删除` | 删掉了某个文件或功能 |

示例：
```
新增：排行榜基础结构和 Supabase 查询
修复：Tab 键在打字界面切换焦点的问题
更新：WPM 计算改为每5秒刷新一次
```

---

## 不能做的事

- 不直接推送到 `main` 分支（受保护）
- 不修改其他人负责的组件（见 `docs/03_tasks.md` 的文件范围）
- 不修改 `SPEC.md`（需要 Tech Lead 审批）
- 不把 `.env.local` 文件提交到仓库（已在 `.gitignore` 里）

---

## 遇到问题怎么办

1. 先问 Pi（你的 Agent）
2. Pi 解决不了，发群里
3. 群里没人知道，等下次课讨论
