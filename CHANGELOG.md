# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

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
