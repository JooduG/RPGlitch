# Task List - Sovereign Alignment

> **Status**: `[ACTIVE]`
> **Last Update**: 2026-04-20 (Stockholm Sync)
> **Current Milestone**: Milestone 1 (The Foundry)

## 🗺️ Project Roadmap

### Milestone 1: The Foundry (v0.5) - [ACTIVE]

- [x] Core Runes Foundation (Svelte 5)
- [x] The Data Pillar (Dexie.js)
- [x] Diegetic UI Base (Nordic Regime)
- [x] Chrono Kinetics (Simulation Cycle)
- [x] Security Protocol (Warden/DOMPurify)
- [x] Round Stability & Hygiene (Patch [037])
- [x] InputBar Layout & Control Panel Wiring ([039])
- [ ] Release Candidate Stability Audit ([043])
- [x] Documentation Sync & Infrastructure Hygiene ([044])

---

### [044] Documentation Sync & Infrastructure Hygiene - [DONE]

#### **Track 1: Documentation Sync**

- [x] Analyze last 20 commits for architectural drift
- [x] Sync `SPEC.md` for v0.6.0 (The Forge)
- [x] Update Rule 04 (Aesthetics) with Ghost tokens & Registry
- [x] Update Rule 05 (Intelligence) with Temporal Engine Lexicon

#### **Track 2: Infrastructure Hygiene**

- [x] Initialize `tasks/plan.md` to resolve rule violations
- [x] Sync `tasks/todo.md` with recent missions and skill logs

---

### [043] Release Candidate Prep - [ACTIVE]

#### **Track 1: Stability Audit**

- [ ] Run full `deploy:prepare` suite
- [ ] Resolve any lingering audit advice or debt
- [ ] Verify build integrity and asset inlining

---

### [037] State Atomicity & Token Asphyxiation Patch - [COMPLETED]

#### **Track 1: Hygiene (Stripping)**

- [x] Implement `strip_cognition_blocks` in `text-parser.js` (Regex-based)
- [x] Integrate into `llm-service.js` sanitization pipeline
- [x] Verify stripping via `text-parser.test.js`

#### **Track 2: Control (Atomicity)**

- [x] Add `isProcessing` flag and locking methods to `session.svelte.js`
- [x] Wrap `advance_turn` in `session.svelte.js` with lock logic
- [x] Purge redundant `runtime.round` increments (session-driver, intelligence-kernel)
- [x] Verify atomic round stability in browser DevMode

---

### [042] Ghost Token Audit & Profile UI Stabilization - [COMPLETED]

#### **Phase 1: Ghost Token Audit**

- [x] List all valid tokens from `tokens.css`
- [x] Search for usage of legacy/ghost tokens (e.g., `--motion-slow`, `--motion-fast`)
- [x] Repair components using ghost tokens

#### **Phase 2: Profile UI Stabilization**

- [x] Update `tokens.css`: Set `--font-size-xxxxxl` to `5rem` (80px)
- [x] Update `EntityHeader.svelte`: Harmonize `.name` font size and add stability
- [x] Update `Profile.svelte`: Replace elastic easing with stable easing for layout shifts

#### **Phase 3: Verification**

- [x] Run `npm run verify`
- [x] Manual verification of Profile transitions

---

## 🏁 Completed Missions (Recent)

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

| Timestamp (ISO 8601)      | Task                                                             | Skill Invoked                              | Outcome     |
| ------------------------- | ---------------------------------------------------------------- | ------------------------------------------ | ----------- |
| 2026-04-12T12:10+02:00    | Agent OS Refactor (orchestration absorption)                     | `using-agent-skills`, `directives`         | ✅ Done     |
| 2026-04-12T17:45+02:00    | Skill Standardization (Sovereign Template)                       | `directives`, `using-agent-skills`         | ✅ Done     |
| 2026-04-13T06:24+00:00    | Resolve MCP ReDOS and Data Leak Vulns                            | `security-and-hardening`                   | ✅ Done     |
| 2026-04-14T17:03+02:00    | Fix InputBar Overlap & Panel Wiring                              | `incremental-implementation`               | ✅ Resolved |
| 2026-04-15T20:10+02:00    | Manifest Modifiers & Stabilize VisualWing                        | `directives`, `incremental-implementation` | ✅ Done     |
| 2026-04-15T21:46:00Z      | Commit Audit & Restoration Patch                                 | `debugging-and-error-recovery`             | ✅ Resolved |
| 2026-04-17T02:44:00+02:00 | Rule & Workflow Refactoring (Standardization)                    | `directives`, `warden`, `github-copilot`   | ✅ PR #132  |
| 2026-04-16T01:41:23+00:00 | Rule 06 Compliance Sweep                                         | `security-and-hardening`                   | ✅ Done     |
| 2026-04-15T20:03:20+00:00 | State Atomicity & Token Asphyxiation Patch                       | `debugging-and-error-recovery`             | ✅ Resolved |
| 2026-04-15T19:58+00:00    | Add unit tests for entity-fragments.js                           | `test-driven-development`                  | ✅ Done     |
| 2026-04-15T19:59+02:00    | 🔒 Security Fix: Unsafe JSON Parsing in Memory                   | `security-and-hardening`                   | ✅ Done     |
| 2026-04-15T05:29+00:00    | Refactor duplicated random selection logic                       | `incremental-implementation`               | ✅ Done     |
| 2026-04-15T21:05+00:00    | Add vector lifecycle management auto-resolution                  | `debugging-and-error-recovery`             | ✅ Done     |
| 2026-04-16T12:00+00:00    | Fix ReDoS in text parser via Rule 06 compliance                  | `security-and-hardening`                   | ✅ Done     |
| 2026-04-16T06:24:14+00:00 | Fix Heresy / Hardcoded Colors in CSS                             | `security-and-hardening`                   | ✅ Done     |
| 2026-04-16T06:24:14+00:00 | Fix Naming Convention SIMPLIFY-IGNORE.md                         | `security-and-hardening`                   | ✅ Done     |
| 2026-04-16T07:18:10+00:00 | Rule 06: Remove temporary bot artifacts                          | `security-and-hardening`                   | ✅ Done     |
| 2026-04-16T08:28:03+00:00 | Rule 06: Remove tasks/plan.md temporary scratchpad               | `security-and-hardening`                   | ✅ Done     |
| 2026-04-18T05:47:12.314Z  | Fix Rule 06 Compliance regarding SKILL.md TODO-AI false positive | `security-and-hardening`                   | ✅ Done     |
| 2026-04-18T12:00:00Z      | Fresh Session Initialization (/boot)                             | `using-agent-skills`, `data`, `warden`     | ✅ Resonant |
| 2026-04-19T15:05:00Z      | Fix Signature Color grid selection for premades                  | `frontend-ui-engineering`                  | ✅ Done     |
| 2026-04-19T15:11:00Z      | Clean up signature color swatch tooltips                         | `frontend-ui-engineering`                  | ✅ Done     |
| 2026-04-19T15:25:00Z      | Storyboard UI Stabilization                                      | `frontend-ui-engineering`                  | ✅ Done     |
| 2026-04-20T02:18:10+02:00 | Project Timezone Sync (Europe/Stockholm)                         | `directives`, `simulation`                 | ✅ Done     |
| 2026-04-20T10:14:00+02:00 | Documentation Sync (v0.6.0)                                      | `frontend-ui-engineering`, `directives`    | ✅ Done     |
| 2026-04-20T10:16:00+02:00 | Infrastructure Hygiene (plan/todo sync)                          | `security-and-hardening`, `directives`     | ✅ Resolved |
| 2026-04-22T05:19:28Z      | Implement `content-normaliser.test.js` and fix tag edge case     | `test-driven-development`                  | ✅ Done     |

## 🧹 Backlog (Automated)

<!-- BACKLOG_START -->

> **Last Swept**: 2026-04-18 11:41:00

✅ No outstanding AI debt.

<!-- BACKLOG_END -->
