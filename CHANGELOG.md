# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [1.3.0] - 2026-06-20

### Added
- Built-in lesson manifest generation and Supabase sync scripts for database-backed lesson publishing.
- Expanded built-in question bank with arrays, foundations, recursion/backtracking, searching, stack/queue, strings, and refreshed Python/JavaScript lessons.
- Supabase migrations for built-in lesson content and lesson metadata tables.

### Changed
- Lesson loading now prefers Supabase-backed lessons with local lesson files as a fallback.
- Lesson selection, typing, result, profile history, and adapter flows were updated for database-backed lesson metadata.
- Package version bumped to `1.3.0` for this release.

### Fixed
- Improved lesson data boundaries and manifest checks to keep bundled content and database sync consistent.

## [1.2.0] - 2026-06-20

### Changed
- Refined theme initialization with system preference fallback and responsive layout tokens.
- Improved home page, lesson discovery, filters, and lesson card presentation.
- Polished typing session UI with denser controls and focused practice layout.
- Updated leaderboard and learning path pages for clearer responsive presentation.

## [1.1.0] - 2026-06-20

### Added
- Learning paths with progress tracking, path detail pages, and built-in path seed data.
- Collections, streak calendar, achievement badges, and profile submission management.
- Community submission and admin review flows backed by Supabase adapters.
- Multi-variant lesson selector, expanded lesson content, and JavaScript variants.
- Vitest coverage, router/store/domain tests, and GitHub CI verification.
- Supabase migrations for paths, app tables, RLS policies, and data integrity constraints.

### Changed
- Typing experience now uses line numbers, floating caret, syntax highlighting, WPM composables, and resilient lesson text rendering.
- Frontend data access is split into domain, application, and adapter layers with TypeScript entry points.
- UI is refreshed across home, lessons, leaderboard, profile, result, auth, and layout surfaces.
- Package lock is synchronized for CI npm compatibility.

### Fixed
- Canonical `lesson_ref` handling for built-in/community lessons, result persistence, path completion, and retry/recommendation routes.
- `get_leaderboard` migration now drops the old function before recreating it with the new return type.
- Typing page layout now keeps the real exercise text visible above shortcut help.
- Documentation trailing whitespace and merge conflicts from syncing `dev` into `main`.

## [1.0.0] - 2026-06-20

### Added
- Home page narrative for guests and dashboard cards for logged-in users.
- Community-approved lessons in discovery via application `listLessons()`.
- Search, category, language filters, lesson language tags, and per-lesson PB display.
- 404 page, compact footer, skeleton loading components, leaderboard empty state/current rank.
- Result page record feedback, next-lesson recommendation, and copy result action.
- TypeScript config, shared business types, DbAdapter, MemoryAdapter, SupabaseAdapter, and CI workflow.

### Changed
- Version updated to 1.0.0 while preserving package name `typelab`.
- Application services support adapter injection for tests.
- Vue SFC scripts and core modules migrated to TypeScript.

### Fixed
- `Variant` documentation now uses `variant_id` to match existing JSON and code.
- Typing screen supports Esc reset and line progress text.
- Loading states use skeleton placeholders instead of plain loading text where required.
