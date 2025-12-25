# Repository Guidelines

## Project Structure & Module Organization

- `pages/`: uni-app pages (screens). Routes/tabs are defined in `pages.json`.
- `components/`: reusable Vue components (prefer local, feature-focused components).
- `service/`: API domain modules (e.g. auth/device/alarm) that call the request layer.
- `API/`: HTTP/request wrapper and API usage notes (`API/readme.md`, `API/interface.js`).
- `store/`: app state (Vuex-style patterns).
- `lang/`: i18n dictionaries and language switch helpers.
- `static/`: static assets (icons/images/js libs).
- `uni_modules/`: third‑party uni modules (keep vendor edits minimal; patch upstream when possible).
- Platform/config entry points: `App.vue`, `main.js`, `manifest.json`, `uni.scss`.

## Build, Test, and Development Commands

This is a uni-app project typically run via HBuilderX.

- Install dependencies: `pnpm install`
- Reproducible install (CI): `pnpm install --frozen-lockfile`
- Run locally: open the project in HBuilderX → “Run” for your target (App/H5/mini program).

## Coding Style & Naming Conventions

- Indentation: follow existing files (most `.vue` files use tabs).
- Vue SFCs: keep `<template>`, `<script>`, `<style>` sections tidy and minimal; avoid large inline logic in templates.
- Naming:
  - Pages/components: kebab-case filenames (e.g. `pages/fishery-monitor/fishery-monitor.vue`).
  - JS variables/functions: `camelCase`; constants: `SCREAMING_SNAKE_CASE` when appropriate.
- Cross‑platform: avoid platform-specific APIs without guards; use uni-app conditional compilation when needed (`#ifdef ... #endif`).

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
