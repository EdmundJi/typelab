# CONTRIBUTING.md — 如何参与开发

## 第一次设置

```bash
# 1. 克隆仓库
git clone [仓库地址]
cd typelab

# 2. 安装依赖
npm install

# 3. 配置环境变量（向项目维护者获取这两个值）
# 在项目根目录新建 .env.local 文件，写入：
# VITE_SUPABASE_URL=xxx
# VITE_SUPABASE_ANON_KEY=xxx

# 4. 启动开发服务器
npm run dev
# 浏览器打开 http://localhost:5173
```

---

## 每次开发的流程

```bash
# 第一步：拉最新代码
git checkout dev
git pull origin dev

# 第二步：切到自己的分支（第一次需要创建）
git checkout -b feature/你的模块名   # 第一次
git checkout feature/你的模块名     # 之后每次

# 第三步：写代码
# ...

# 第四步：提交
git add .
git commit -m "新增：xxx"

# 第五步：推送
git push origin feature/你的模块名
```

---

## 开 PR

1. 推送后去 CNB 仓库页面
2. 点击「新建合并请求」
3. 源分支：`feature/你的模块名`，目标分支：`dev`
4. 填写 PR 描述（见下方模板）
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
