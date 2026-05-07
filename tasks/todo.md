# Task List - Sovereign Alignment

> **Status**: `[ACTIVE]`
> **Last Update**: 2026-04-30 (Stockholm Sync)
> **Current Milestone**: Milestone 1 (The Foundry)

## 🗺️ Project Roadmap

### Milestone 1: The Foundry (v0.5) - [ACTIVE]

- [x] **[071]** VisualWing Grid Refinement [DONE]
- [x] Core Runes Foundation (Svelte 5)

- [x] The Data Pillar (Dexie.js)
- [x] Diegetic UI Base (Nordic Regime)
- [x] Chrono Kinetics (Simulation Cycle)
- [x] Security Protocol (Warden/DOMPurify)
- [x] Round Stability & Hygiene (Patch [037])
- [x] InputBar Layout & Control Panel Wiring ([039])
- [x] Documentation Sync & Infrastructure Hygiene ([044])
- [ ] Release Candidate Stability Audit ([043]) - [ACTIVE]
- [x] Profile Modal Aesthetic Overhaul ([055])
- [x] Final UI Polishing & Aesthetics ([050])
  - [x] Refine `Button` primary variant ("pure" style, borderless)
  - [x] Update Nordic tokens (off-white → `--color-white: #f7f9fc` Nordic Ivory)
  - [x] Migrate hard-coded `1px` borders to `var(--spacing-px)` token
  - [x] Polish `Drawer` "Create New" card (question mark avatar, no tooltip, no glow, glass-s surface)
  - [x] Fix `LibraryCard` signature bar bottom radius clipping
  - [x] Remove border from danger/invisible button default state
- [x] Hidden Dynamics Logs & Telemetry UI ([051])
- [x] Session Driver Restoration ([053])
  - [x] Update broken skill references in GEMINI.md
  - [x] Initialize fresh Mission Plan (tasks/plan.md)
  - [x] Verify globally via npm run verify

- [x] UI Architecture Restructuring & Import Aliasing ([054])
  - [x] Create feature directories in `src/ui/`
  - [x] Move files to feature folders (atoms, core, storymode, etc.)
  - [x] Update `jsconfig.json` path mappings
  - [x] Create `src/ui/shell/Background.svelte`
  - [x] Update `vite.config.js` aliases for `@shell`
  - [x] Refactor `App.svelte` to use `Background`
  - [x] Cleanup `globals.css` and `index.html` redundant styles
  - [x] Synchronize `vite.config.js` and `vitest.config.js` aliases
  - [x] Systemic import refactor & relative path fixup
  - [x] Verify with `npm run test:unit`

- **[055]** Profile Modal Aesthetic Overhaul [DONE]
  - [x] Redesign placeholder initials (texture + identity strip)
  - [x] Unified scrolling for header, body, and footer
  - [x] Restore "Edit" button layout and styling (spacer + fullWidth)
  - [x] Unify wing scrolling into a single container (removed multiple scrollbars)
  - [x] Fix 1020px viewport squashing bug
  - [x] Implement mobile edge-to-edge layout for profile modal
  - [x] Enhance transparency by de-layering glass containers
  - [x] Harden identity aesthetics (white initials, high-contrast header)

- **[056]** Storyboard Mobile Layout [DONE]
  - [x] Fix 768px layout overlapping on title and cards
  - [x] Un-hide AI character and User persona cards on mobile
  - [x] Re-architect universal grid to 5-row stack for mobile
  - [x] Enable vertical scrolling for the storyboard stack
  - [x] Verify visual integrity with browser screenshot

- **[059]** Responsive Profile Grid Hardening [DONE]
  - [x] Implement flexible portrait grid (`minmax(200px, 30%)`)
  - [x] Refine name typography (`maxSize: 64`, `lineHeight: 1.0`)
  - [x] Optimize mobile breakpoint (`850px`)
  - [x] Implement flexible fragment labels (`minmax(60px, 80px)`)
  - [x] Verify visual integrity via unit tests and layout audit

- [x] **[060]** TextField & VectorArray Stabilization [DONE]
  - [x] Remove unused `is_hovered` state and "hover expansion" logic
  - [x] Eliminate "hover bullshit" triggers in VectorArray
  - [x] Refine header background vibrancy and vertical alignment
  - [x] Verify zero-drift and zero-lint via npm run verify

- [x] **[067]** UI Architecture Simplification [DONE]
  - [x] Consolidate Tooltip into a single Atom (`@atoms/Tooltip.svelte`)
  - [x] Purge `TooltipRenderer.svelte` and `tooltip.svelte.js`
  - [x] Consolidate Lightbox into `@atoms/Lightbox.svelte`
  - [x] Rename Lightbox to ImagePreview for intuitive naming
  - [x] Purge `Background.svelte` into `App.svelte`
  - [x] Update system-wide imports to the new pattern

- [x] **[068]** Profile Wing Cluster Refactor [DONE]
  - [x] Harden focus-out logic in Profile/VisualWing
  - [x] Renamed Wing.svelte .scroller to .body
  - [x] Move leaked global styles to DevWing
  - [x] Eager voice initialization in AudioWing
  - [x] Fix prop mismatch in App.svelte
  - [x] Verify zero-drift and zero-lint via npm run verify

- [x] **[069]** TextField Class Normalization [DONE]
  - [x] Standardize `ControlPanel.svelte` to use `text-area custom-field`
  - [x] Verify zero-drift and zero-lint via npm run verify

- [x] **[070]** ControlPanel Type Tightening [DONE]
  - [x] Add JSDoc `@typedef` for `Story` and `MockRole`
  - [x] Annotate `stories_list` as `Story[]`
  - [x] Type `handleAction`, `loadStory`, and `mock_generation` parameters
  - [x] Verify zero-drift via `npm run verify` (31 files · 264 tests · exit 0)

---

### [046] Skill Rewiring & Script Realignment - [DONE]

#### **Track 1: Documentation Sync**

- [x] Audit all `SKILL.md` files for hallucinated scripts
- [x] Rewire `designer/SKILL.md` as an orchestrator for sensory modules
- [x] Align all audit commands with `package.json` and `warden.js`

#### **Track 2: Infrastructure Hygiene**

- [x] Verify `npm run verify` passes globally
- [x] Manual verification of skill invocation accuracy

---

## 🏁 Completed Missions (Recent)

- **[052]** Engine Hygiene & Aesthetic Restoration [DONE]
- **[049]** UI Refactoring & CSS Cleanup [DONE]
- **[048]** StoryCard Refinement & Control Panel Mocks [DONE]
- **[047]** Unified Dialog System & Modal Standardization
- **[046]** Skill Rewiring & Script Realignment (Complete)
- **[045]** UI Stabilization & Alignment
- **[044]** Documentation Sync & Infrastructure Hygiene
- **[043]** Release Candidate Prep (In Progress)
- **[042]** Ghost Token Audit & Profile UI Stabilization
- **[041]** Rule & Workflow Template Standardization (PR #132)
- **[040]** Git Ignore Fixes & .playwright-auth Untracking
- **[039]** Control Panel Wiring & Mock Controls
- **[038]** Skill Standardization & Sovereign Alignment (34 Skills)
- **[036]** Nordic UI Component Harmonization
- **[035]** Profile Field Aesthetics
- **[027]** Interaction Engine Canonization
- **[025]** Glass Audit & Polish

---

## 🧠 Skill Log

| Timestamp (ISO 8601)      | Task                                                                                  | Skill Invoked                                                                            | Outcome     |
| ------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------- |
| 2026-05-06T19:44+02:00    | VisualWing Aesthetic Restoration                                                      | `css`, `designer`, `quality`                                                             | ✅ Done     |
| 2026-05-06T18:34+02:00    | VisualWing Grid Refinement [071]                                                      | `planning`, `css`, `svelte`, `quality`                                                   | ✅ Done     |
| 2026-05-06T18:16+02:00    | ControlPanel Type Tightening [070]                                                    | `svelte`, `quality`, `test-driven-development`                                           | ✅ Done     |
| 2026-05-06T15:57+02:00    | ControlPanel Type Tightening                                                          | planning                                                                                 | ✅ Resolved |
| 2026-05-06T15:54+02:00    | TextField Class Normalization                                                         | design-normalization                                                                     | ✅ Resolved |
| 2026-05-06T15:41:00+02:00 | Create PR for UI Refactor ([176])                                                     | `github`, `using-agent-skills`                                                           | ✅ Created  |
| 2026-05-06T13:05:00+02:00 | Consolidate Entity Enhancement Logic                                                  | `simulation`, `image-generation`, `02-simulation`, `05-intelligence`, `entity-fragments` | ✅ Resolved |
| 2026-05-06T08:18:00+02:00 | Profile Wing Cluster Refactor ([068])                                                 | `using-agent-skills`, `svelte`, `css`, `designer`, `warden`                              | ✅ Resolved |
| 2026-05-06T06:52:00+02:00 | Move Wing.svelte to @profile                                                          | `using-agent-skills`, `svelte`                                                           | ✅ Done     |
| 2026-05-06T06:48:00+02:00 | Merge profile-config into entity-fragments                                            | `using-agent-skills`, `svelte`                                                           | ✅ Done     |
| 2026-05-06T05:51:00+02:00 | TextField & VectorArray Stabilization ([060])                                         | `using-agent-skills`, `svelte`, `css`, `designer`                                        | ✅ Resolved |
| 2026-05-05T16:15:00+02:00 | Type Safety & Implicit Any Fixes (VisualWing/VectorArray)                             | `test-driven-development`, `svelte`                                                      | ✅ Resolved |
| 2026-05-03T10:45:00+02:00 | TextField Flattening Refactor ([060])                                                 | `using-agent-skills`, `svelte`, `css`, `designer`, `test-driven-development`             | ✅ Resolved |
| 2026-05-05T20:17:00+02:00 | Background Rendering Refactor                                                         | `simulation`, `svelte`, `css`                                                            | ✅ Done     |
| 2026-05-05T18:46:00+02:00 | VectorArray Deep-Dive Refactor                                                        | `planning`, `svelte`, `css`                                                              | ✅ Done     |
| 2026-05-03T08:40:00+02:00 | TextField Deep Dive Refactor ([060])                                                  | `using-agent-skills`, `svelte`, `css`, `designer`, `test-driven-development`             | ✅ Resolved |
| 2026-05-01T23:20:00+02:00 | Profile Responsiveness & Transparency Refinement                                      | `using-agent-skills`, `css`, `svelte`, `browser-testing-with-devtools`                   | ✅ Resolved |
| 2026-05-01T22:43:00+02:00 | Unified Wing Scrolling                                                                | `using-agent-skills`, `css`, `svelte`                                                    | ✅ Resolved |
| 2026-05-01T22:30:00+02:00 | Profile Modal Scrolling & Regression Fix                                              | `using-agent-skills`, `css`, `svelte`                                                    | ✅ Resolved |
| 2026-05-01T20:45:00+02:00 | Profile Modal Aesthetic Overhaul ([055])                                              | `using-agent-skills`, `planning`, `designer`, `css`, `svelte`                            | 🔄 Active   |
| 2026-05-01T02:15:00+02:00 | Release Candidate Stability Audit ([043])                                             | `specification`, `planning`, `warden`                                                    | 🔄 Active   |
| 2026-05-01T02:00:00+02:00 | UI Architecture Restructuring & Import Aliasing ([054])                               | `using-agent-skills`, `planning`, `warden`                                               | ✅ Resolved |
| 2026-04-30T22:30:00+02:00 | Session Driver Restoration ([053])                                                    | `using-agent-skills`, `specification`                                                    | ✅ Done     |
| 2026-04-30T18:14:00+02:00 | Engine Hygiene & Aesthetic Restoration ([052])                                        | `debugging-and-error-recovery`, `warden`                                                 | ✅ Done     |
| 2026-04-30T13:40:00+02:00 | Fix Telemetry Test Mocks & Robust Mapping ([051])                                     | `test-driven-development`, `svelte`                                                      | ✅ Done     |
| 2026-04-30T13:16:00+02:00 | Fix Telemetry UI Lints ([051])                                                        | `frontend-ui-engineering`, `css`                                                         | ✅ Done     |
| 2026-04-30T12:56:00+02:00 | Session Boot ([/boot]) — Mental Model & Context Sync                                  | `using-agent-skills`, `data`, `warden`                                                   | ✅ Done     |
| 2026-04-29T23:03:00+02:00 | Final UI Polishing ([050]) — Create New card, danger/invisible borders, Nordic tokens | `css`, `frontend-ui-engineering`                                                         | ✅ Done     |
| 2026-04-29T19:45:00Z      | UI Refactoring & CSS Cleanup ([049])                                                  | `css`, `frontend-ui-engineering`                                                         | ✅ Done     |
| 2026-04-25T21:25:00Z      | Skill Rewiring & Script Realignment ([046])                                           | `directives`, `using-agent-skills`, `warden`                                             | ✅ Done     |
| 2026-04-25T17:18:00+02:00 | Apply custom scrollbar to `.left-panel` for UI consistency                            | `css`                                                                                    | ✅ Done     |

## 🧹 Backlog (Automated)

<!-- BACKLOG_START -->

> **Last Swept**: 2026-04-18 11:41:00

✅ No outstanding AI debt.

<!-- BACKLOG_END -->
