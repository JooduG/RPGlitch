---
name: track-agent-governance-evolutions
description: Codify adopted agent governance evolutions (Prose Detox, Prompt Complexity Triage, Epistemic Cartography, Tool-Call Discipline, and Conductor CDD Proof Matrix) into active repo tools and rules.
status: active
last_synchronized: 2026-09-24
references: tmp/AGENT-GOVERNANCE-INVENTORY.md
---

# 🎯 Track: Sovereign Agent Governance Evolutions & Context-Driven Harmonization

## 1.0 Vision & High-Level Architecture

Harmonize our sovereign pair-programming governance, repository tooling, and simulation engine text generation with the four battle-tested evolutions synthesized in **Section 6** of `AGENT-GOVERNANCE-INVENTORY.md`:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        AGENT GOVERNANCE SUITE                          │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Engine & Output Prose Detox (writ-SKILL.md)                         │
│    - Expand src/utils/styles.js and definitions with Wikipedia tells   │
│    - Filter tacked-on -ing clauses, stock filler, false contrasts      │
├────────────────────────────────────────────────────────────────────────┤
│ 2. Prompt Complexity Triage Matrix (complexity-triage-SKILL.md)        │
│    - Add .agents/skills/simulation/scripts/triage-prompt.js            │
│    - 5-Dimension (D1-D5) + R1 parameter density scoring tool           │
├────────────────────────────────────────────────────────────────────────┤
│ 3. Epistemic Context Cartography & CDD Proof Matrix (Conductor)        │
│    - Standardize Quad-Layer Fact Separation in planning blueprints     │
│    - Add Auditable Proof Matrix template to Phase 5 in all future tracks│
├────────────────────────────────────────────────────────────────────────┤
│ 4. Tool-Call Discipline & Anti-Hallucination Guard                     │
│    - Add Stop hook in hooks.js verifying track drift / handoff         │
│    - Ensure compaction resilience across long-running loops            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2.0 Architectural Modules & Invariants

### 2.1 Engine & Agent Prose Detox (`src/utils/styles.js`)

Extend `detox_prose` in `src/utils/styles.js` and `src/data/definitions/speaking-styles.js` to catch:

- Stock AI filler: `tapestry`, `realm`, `vital role`, `serves as a testament`, `stands as a reminder`, `seamless`, `holistic`, `in today's fast-paced world`.
- Tacked-on trailing significance participial phrases (`...underscoring its...`, `...highlighting the...`).
- False rhetorical contrasts (`It's not just X, it's Y`).

### 2.2 Prompt Complexity Triage Utility (`.agents/skills/simulation/scripts/triage-prompt.js`)

A deterministic, lightweight CLI utility allowing the agent or user to score any prompt candidate before editing:

- Computes D1 (Completeness), D2 (Ambiguity), D3 (Structure), D4 (Reasoning), D5 (Stakes), and R1 (Token Density).
- Outputs recommended Tier (Tier 0 Leave As-Is, Tier 1 Light Touch, Tier 2 Structured Rewrite, Tier 3 Full Rebuild).

### 2.3 Conductor CDD Proof Matrix & Epistemic Separation

Update `GEMINI.md` and `.gemini/config/skills/planning/SKILL.md` to:

- Require the 4-quadrant fact breakdown (**User Facts**, **Repo Evidence**, **Inferences**, **Unknowns**) in non-trivial diagnostic/planning turns.
- Mandate the 3-column **Auditable Proof Matrix** in track completion milestones.

### 2.4 Tool-Call Discipline Hook Gate (`hooks.js`)

Add a lint check or hook guard that audits assistant outputs or turn handoffs to ensure any modified source files align with the declared scope in the active track blueprint in `tasks/future/<track>.md`.

---

## 3.0 Implementation Playbook

### Phase 1: Test-Driven Red Suite (Prose Detox & Triage Tooling)

- [x] `task-1.1`: Extend `src/utils/styles.test.js` with failing test cases for Wikipedia AI tells (stock vocabulary clusters like 'realm' / 'seamless', dangling significance participial clauses, and false contrast phrases).
- [x] `task-1.2`: Create `.agents/skills/simulation/scripts/triage-prompt.test.js` verifying the D1–D5 scoring rules, R1 technical parameter density caps, and tier assignments.

### Phase 2: Prose Detox Engine Hardening (GREEN)

- [x] `task-2.1`: Implement the expanded detox filters in `src/utils/styles.js` and `src/data/definitions/speaking-styles.js`, and verify all tests pass green in `src/utils/styles.test.js`.
- [x] `task-2.2`: Implement `.agents/skills/simulation/scripts/triage-prompt.js` with pure Node/ESM logic and CLI execution support (`npm run tool:triage-prompt`).

### Phase 3: Planning & Governance Rule Synchronization (GREEN)

- [x] `task-3.1`: Update `GEMINI.md` (Operational Behaviors & Phase 1/Phase 3) with Epistemic Context Cartography (User Facts, Repo Evidence, Inferences, Unknowns) and Conductor Auditable Proof Matrix requirements.
- [x] `task-3.2`: Update `.gemini/config/skills/planning/SKILL.md` and `.agents/skills/simulation/SKILL.md` to reference the prompt complexity triage matrix when modifying prompt layers.

### Phase 4: Lifecycle Hook & Tool-Call Discipline Verification (GREEN)

- [x] `task-4.1`: Add unit tests in `.agents/skills/local-scripts/scripts/hooks.test.js` verifying anti-hallucination discipline and track drift detection.
- [x] `task-4.2`: Wire track drift detection in `hooks.js` to ensure files modified in a commit align with the active track specification.

### Phase 5: Quality Gate & Verification

- [x] `task-5.1`: Run `npm run verify` ensuring 0 lint errors, 0 test regressions across all 61+ suites, and 100% hook contract compliance.
- [x] `task-5.2`: Run `npm run build` confirming clean production bundle.

## 4.0 Auditable Proof Matrix

| Requirement / Criterion                          | Implementation Location (file:line)                                                                                                                                                                                                                                                                                                                       | Automated Test / Verification Proof (test:line or command)                                                                                                                                       |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Wikipedia AI Tells & Prose Detox Formulas 7 & 8  | [`src/utils/styles.js:130-170`](file:///c:/Users/johng/source/repos/RPGlitch/src/utils/styles.js#L130-L170), [`src/data/definitions/speaking-styles.js:120-150`](file:///c:/Users/johng/source/repos/RPGlitch/src/data/definitions/speaking-styles.js#L120-L150)                                                                                          | [`src/utils/styles.test.js:174-210`](file:///c:/Users/johng/source/repos/RPGlitch/src/utils/styles.test.js#L174-L210) (`npm run test:unit`)                                                      |
| Prompt Complexity Triage CLI Utility (D1–D5, R1) | [`.agents/skills/simulation/scripts/triage-prompt.js:1-210`](file:///c:/Users/johng/source/repos/RPGlitch/.agents/skills/simulation/scripts/triage-prompt.js#L1-L210)                                                                                                                                                                                     | [`.agents/skills/simulation/scripts/triage-prompt.test.js:1-75`](file:///c:/Users/johng/source/repos/RPGlitch/.agents/skills/simulation/scripts/triage-prompt.test.js#L1-L75) (`npm test`)       |
| Epistemic Cartography & CDD Proof Matrix Rules   | [`GEMINI.md:382-392`](file:///c:/Users/johng/source/repos/RPGlitch/GEMINI.md#L382-L392), [`.gemini/config/skills/planning/SKILL.md:25-50`](file:///C:/Users/johng/.gemini/config/skills/planning/SKILL.md#L25-L50), [`.agents/skills/simulation/SKILL.md:40-60`](file:///c:/Users/johng/source/repos/RPGlitch/.agents/skills/simulation/SKILL.md#L40-L60) | Clean audit pass in `npm run audit:hygiene` & `npm run verify`                                                                                                                                   |
| Spec-to-Code Drift Detection Hook Gate           | [`.agents/skills/local-scripts/scripts/hooks.js:875-890`](file:///c:/Users/johng/source/repos/RPGlitch/.agents/skills/local-scripts/scripts/hooks.js#L875-L890)                                                                                                                                                                                           | [`.agents/skills/local-scripts/scripts/hooks.test.js:210-224`](file:///c:/Users/johng/source/repos/RPGlitch/.agents/skills/local-scripts/scripts/hooks.test.js#L210-L224) (`npm run test:hooks`) |
| Monolith Build & Bundle Vault Integrity          | Singlefile Vite bundle in `dist/index.html` (1,410 kB)                                                                                                                                                                                                                                                                                                    | `npm run build` exited with code 0                                                                                                                                                               |

<!-- CHANGELOG
  - 2026-09-24: Initialized track blueprint for Agent Governance Evolutions & Context-Driven Harmonization synthesized from inspiration audit.
  - 2026-09-24: Implemented all tasks across Phases 1–5, verified 100% test coverage and 0 lint errors, and established the Auditable Proof Matrix.
-->
