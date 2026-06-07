# TypeLab

面向程序员的打字练习网站，通过打出算法实现来同时训练手速和算法记忆。

## 技术栈

- Vue 3 + Vite
- Vue Router
- Pinia
- Tailwind CSS
- ECharts
- Supabase JS SDK（上线阶段接入）
- Biome（代码格式化与检查）

## 本地开发

开发阶段默认使用 `src/lib/db.js` 中的 mock 数据，不需要配置自己的 `.env.local`，也不需要连接 Supabase。

```bash
npm install
npm run dev
```

浏览器打开：

```text
http://localhost:5173
```

## 数据访问说明

项目统一通过 `src/lib/db.js` 访问数据：

- 开发阶段：不配置 Supabase 环境变量时，自动使用 mock 数据。
- 上线阶段：配置 Supabase 环境变量后，`src/lib/db.js` 会切换到真实 Supabase 数据。
- 组件、页面、store 不应直接调用 `src/lib/supabase.js` 或 `supabase.from(...)`，避免数据访问逻辑分散。

## Supabase 上线配置

只有部署或联调真实后端时才需要配置环境变量。

在部署平台或本地 `.env.local` 中配置：

```bash
VITE_SUPABASE_URL=你的 Supabase 项目 URL
VITE_SUPABASE_ANON_KEY=你的 Supabase anon key
```

注意：

- `.env.local` 不要提交到仓库。
- 开发阶段如果只是做页面、组件、交互和 mock 数据流程，不需要配置以上变量。

## 常用命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run preview      # 本地预览生产构建
npm run check        # 使用 Biome 检查格式和代码问题
npm run check:fix    # 使用 Biome 自动修复可修复问题
npm run format       # 使用 Biome 格式化代码
npm run lint         # 使用 Biome 检查 lint 问题
```

提交 PR 前至少执行：

```bash
npm run check
npm run build
```

## 协作规范

请阅读：

- `CONTRIBUTING.md`：开发流程、PR、代码风格、可读性规范
- `AGENT.md`：Agent / AI 助手操作规范
- `docs/03_tasks.md`：任务拆分和文件范围
- `SPEC.md`：产品和技术规格，修改前需要 Tech Lead 审批
