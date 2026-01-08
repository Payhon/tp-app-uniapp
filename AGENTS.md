# Repository Guidelines

## 当前技术栈（务必先读）

- 本项目为 **uni-app（HBuilderX）** 项目，当前以 **Vue 3 + TypeScript + Pinia** 为基础能力，处于**渐进迁移**阶段：
  - 新代码优先使用 Vue 3 Composition API / `<script setup lang="ts">`
  - 老页面仍可能保留 Options API/历史写法（为了不改业务逻辑）；迁移时以“行为不变”为第一原则
- 关键兼容配置：
  - `manifest.json` 已设置 `"vueVersion": "3"`（否则会出现 Vue2/Vue3 类型与编译行为混杂）
  - HBuilderX + pnpm 场景下依赖需要 hoist：见 `.npmrc`（`node-linker=hoisted`、`shamefully-hoist=true`）
  - TypeScript/宏声明：`env.d.ts`、`shims-uni.d.ts`

## Project Structure & Module Organization

- `pages/`: uni-app pages (screens). Routes/tabs are defined in `pages.json`.
- `components/`: reusable Vue components (prefer local, feature-focused components).
- `service/`: API domain modules (e.g. auth/device/alarm) that call the request layer.
- `API/`: HTTP/request wrapper and API usage notes (`API/readme.md`, `API/interface.js`).
- `store/`: app state (**Pinia stores live here**; legacy store may still exist during migration).
- `lang/`: i18n dictionaries and language switch helpers.
- `static/`: static assets (icons/images/js libs).
- `uni_modules/`: third‑party uni modules (keep vendor edits minimal; patch upstream when possible).
- Platform/config entry points: `App.vue`, `main.ts`, `manifest.json`, `uni.scss`.

## Build, Test, and Development Commands

This is a uni-app project typically run via HBuilderX.

- Install dependencies: `pnpm install`
- Reproducible install (CI): `pnpm install --frozen-lockfile`
- If pnpm complains about hoist pattern mismatch, run: `pnpm install --force` (recreates `node_modules`)
- Run locally: open the project in HBuilderX → “Run” for your target (App/H5/mini program).

## Coding Style & Naming Conventions

- Indentation: follow existing files (most `.vue` files use tabs).
- Vue SFCs: keep `<template>`, `<script>`, `<style>` sections tidy and minimal; avoid large inline logic in templates.
- i18n: all user-facing text must use multi-language keys (`$t('...')` in `.vue`, `this.$t('...')` in page scripts, and `i18n.t('...')` in non-Vue modules like `API/*.js`).
- Naming:
  - Pages/components: kebab-case filenames (e.g. `pages/fishery-monitor/fishery-monitor.vue`).
  - JS variables/functions: `camelCase`; constants: `SCREAMING_SNAKE_CASE` when appropriate.
- Cross‑platform: avoid platform-specific APIs without guards; use uni-app conditional compilation when needed (`#ifdef ... #endif`).

## Vue 3 / 模板注意事项（高频踩坑）

- **自闭合标签**：Vue3 编译更严格，`<image>` / `<input>` 等请使用自闭合 `/>`（否则会报 `Element is missing end tag`）。
- **`v-model` 限制（Vite/Vue3）**：`v-model` 只能直接用在 `<input>/<textarea>/<select>`（以及支持 `modelValue` 的自定义组件）。
  - 原生 `<picker>`：用 `:value` + `@change`（从 `e.detail.value` 回写）
  - 原生 `<switch>`：用 `:checked` + `@change`（从 `e.detail.value` 回写）
- **`.sync` 已废弃**：Vue3 不支持 `.sync`，统一改为 `v-model:xxx`（如 `v-model:actions`）。

## TypeScript（渐进式强类型）

- 新增/修改核心业务对象时优先补齐类型（放在 `types/` 或就近模块内 `interface`）。
- 允许渐进迁移，但不要滥用 `any`；无法避免时必须解释原因。
- uni-app/宏声明相关类型在 `env.d.ts`、`shims-uni.d.ts`，不要随意删除。

## 状态管理（Pinia）

- Pinia 入口：`store/pinia.ts`；store 文件位于 `store/*.ts`。
- 约束：
  - 组件不要直接“随手改” store state，统一通过 action（保持数据流可追踪）
  - store 定义保持类型完整（`state`/`getter`/`action`）

## i18n（多语言）

- Vue3 下使用 `vue-i18n`（`legacy: false`，`globalInjection: true`），模板里仍可用 `$t(...)`。
- `pages.json` 里标题/TabBar 文案使用 `%xxx%` 占位符，语言字典在 `lang/en-US.js`、`lang/zh-CN.js`。
- TabBar 动态多语言同步在 `lang/index.ts`：
  - **微信小程序**：`uni.setTabBarItem` 只能在 tabBar 页面调用；已做路由保护，新增/调整 tabBar 时需同时更新 `pages.json` 和 `lang/index.ts` 的 keys/paths。

## 模块格式（CJS/UMD/ESM）与小程序兼容

- 小程序构建对 **CJS/UMD 与 ESM 混用**很敏感，常见报错是 `default is not exported` / `__esModule of undefined`。
- 规则：
  - 优先使用 npm 包（例如 `moment`），避免直接从 `static/js/*.js` 引 UMD/UMD bundle。
  - 如必须引用 CJS 文件：
    - 统一做“导出形态兼容”（提供 default/具名导出）或使用 `.cjs` 包装/适配。
  - 第三方 `uni_modules/` 尽量不改；确需修改请最小化并记录原因（便于后续升级/回滚）。

## 小程序开发者工具常见提示

- `工具未校验合法域名...`：这是开发者工具提示你关闭了域名/TLS/HTTPS 校验；本地调试可忽略，真机/线上需在微信后台配置合法域名。

## Testing Guidelines

No automated test framework is currently configured in this repo. If you add tests, keep them isolated (e.g. `tests/`) and include a clear run command in the PR.

## Commit & Pull Request Guidelines

- Commits: recent history mostly follows Conventional Commits (e.g. `feat: ...`, `fix: ...`, `refactor(scope): ...`). Prefer that format and keep messages imperative and scoped.
- PRs:
  - Describe behavior changes and affected platforms (App/H5/mini program).
  - Include screenshots/screen recordings for UI changes.
  - Link related issues/tickets where applicable.

## Security & Configuration Tips

- Do not commit secrets or environment-specific endpoints.
- Server/base URL can be influenced by local storage (`serverAddress`) and defaults in `common/config.js` / `API/interface.js`; keep production changes intentional and reviewed.
