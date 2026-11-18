<!--
  Changelog Format (Keep a Changelog 1.1.0 + SemVer 2.0.0):
  - Keep `## [Unreleased]` at the top for in-progress changes.
  - Cut releases as `## [X.Y.Z] - YYYY-MM-DD` (pre-1.0 uses `0.y.z`; no backticks).
  - Group new entries under `### Added`, `### Changed`, `### Deprecated`, `### Removed`, `### Fixed`, `### Security`.
-->

# Changelog

All notable changes to **RPGlitch** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## `[Unreleased]`

### Added

- `engine-atoms.md`: Stage 1 Goldfish atom inventory for `src/engine/` and coupled `@utils` modules.
- `.github/dependabot.yml`: Weekly `github-actions` update schedule.

### Changed

- `.agents/skills/graph-it-live/`: Consolidated the 5 `graph-it-*` skills into 1 RPGlitch-scoped skill (`SKILL.md`, `PITFALLS.md`, and 1-hop `references/`), aligned with `agent-customization`, `agy-customizations`, `deslop`, and `graphit.architecture.json`.
- `.github/workflows/ci.yml`: Added least-privilege `permissions`, SHA-pinned Actions (`checkout`, `setup-node`, `graph-it-review-gate`), dropped `--legacy-peer-deps`, added `<= 4.00 MB` Perchance bundle ceiling check, and added PR-only `graph-review` job.
- `src/engine/runner.test.js`: Inlined `create_contract_fixtures()` directly into the test suite.

### Removed

- `src/simulation/fixtures.test-util.js`: Removed standalone fixture file after inlining into its sole consumer (`src/engine/runner.test.js`).
- `.agents/skills/graph-it-{dead-code-hunter,refactor,pr-review,onboarding-express}/`: Removed merged skill directories.

## `[0.2.0]` - 2026-11-16

- Full pre-beta architecture refactor, UI/primitives cleanup, design-system alignment, and EGM `README.md` contract sync.
- Full historical details for `0.1.0`–`0.2.0` archived in `tmp/archive/CHANGELOG-0.1-0.2-ARCHIVE.md`.
