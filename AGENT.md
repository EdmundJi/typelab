# AGENT.md — Agent 操作规范

本文件用于约束 Pi / AI Agent 在 TypeLab 仓库中的操作方式。所有自动化修改都应优先遵守本文件，其次遵守 `CONTRIBUTING.md`、`docs/03_tasks.md` 和 `SPEC.md`。

## 基本原则

- 先读规范，再改代码：涉及功能实现前，先查看 `docs/03_tasks.md` 的任务范围和 `SPEC.md` 的约束。
- 修改后同步文档：功能、任务状态、验收方式或协作流程发生变化时，必须同步更新 `docs/` 下相关文档，尤其是 `docs/03_tasks.md`。
- 小步修改：一次只完成当前用户要求的事情，避免顺手重构无关文件。
- 文件范围优先：不要修改其他任务负责人负责的文件，除非用户明确要求。
- 不直接修改 `SPEC.md`，除非用户明确说明已获得 Tech Lead 审批。
- 不提交 `.env.local`、密钥、token、Supabase 私有配置等敏感信息。

## 开发阶段数据规范

开发阶段不需要配置自己的环境变量，不需要连接 Supabase。

- 默认使用 `src/lib/db.js` 中的 mock 数据开发。
- 页面、组件、store 必须通过 `src/lib/db.js` 访问数据。
- 不要在组件中直接调用 `supabase.from(...)`、`supabase.auth...`。
- `src/lib/supabase.js` 只负责创建 Supabase client，不承载业务查询逻辑。
- 如果需要新增数据读写能力，应先在 `src/lib/db.js` 中封装函数，再由组件调用。

上线或真实后端联调阶段才接入 Supabase：

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## 代码风格与检查

本项目统一使用 Biome 做格式化和代码检查。

修改代码后应执行：

```bash
npm run check
npm run build
```

如果 Biome 报告可自动修复问题，可执行：

```bash
npm run check:fix
```

注意：

- 不要为了通过检查而进行无关大范围格式化。
- 如果 `check:fix` 修改了无关文件，应确认这些改动合理，否则回退无关改动。
- 复杂逻辑应主动拆函数、拆组件，避免超过 3 层嵌套。

## Git 与 PR 操作

- 外部协作者应先 fork 主仓库，再从自己的 fork 创建功能分支并提交 PR。
- 默认在主仓库 `dev` 分支上集成开发。
- 新功能使用 `feature/模块名` 分支。
- PR 目标分支应为主仓库 `dev`。
- PR 标题使用动作式中文，例如：
  - `新增：Layout 与顶部导航栏`
  - `修复：登录状态丢失问题`
  - `更新：排行榜数据读取逻辑`
- PR 描述使用 `.github/pull_request_template.md`。

## Agent 修改前检查清单

修改前：

- [ ] 当前分支是否正确？
- [ ] 用户要求是否明确？
- [ ] 是否需要先读取 `docs/03_tasks.md`、`SPEC.md` 或相关源码？
- [ ] 是否会触碰无关文件？

修改后：

- [ ] 是否只改了当前任务相关文件？
- [ ] 如功能、任务状态、验收方式或协作流程有变化，是否已同步更新 `docs/` 相关文档？
- [ ] 是否没有引入 `.env.local` 或敏感信息？
- [ ] 是否通过 `npm run check`？
- [ ] 是否通过 `npm run build`？
- [ ] 是否向用户说明已修改文件和验证结果？
