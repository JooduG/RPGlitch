---
description: Comprehensive review workflow — audits wiring, identifies defects/regressions, validates layer boundaries, and flags high-impact improvements.
---

# 🔍 General Review Protocol (`/review`)

> **Objective**: Perform a clinical, end-to-end review of targeted files, recent changes, or active modules. Inspect system wiring, unearth latent bugs, verify architectural compliance, and propose concrete, high-leverage improvements.

---

## 1.0 Review Scope & Focus

Execute a multi-dimensional assessment covering:

1. **Wiring & Integration Integrity**:
   - Trace data flow from UI down to persistence (`src/ui` ➔ `src/state` ➔ `src/intelligence` ➔ `src/data` ➔ `src/platform`).
   - Verify event listeners, reactive bindings, store subscriptions, and async handlers are correctly attached and torn down.
   - Confirm all imports and exports resolve cleanly with zero missing barrels or circular dependencies.

2. **Bug & Edge-Case Detection**:
   - Spot null/undefined hazards, unhandled promise rejections, race conditions, or state desynchronization.
   - Audit error boundaries, fallback values, and defensive guards.
   - Flag silent failures, infinite effect loops, or memory leaks (e.g., untracked timers, unclosed audio contexts).

3. **Sovereignty & Code Standards**:
   - **Svelte 5 Runes**: Pure `$state()`, `$derived()`, `$effect()`, `{@render}` (zero legacy stores or `export let`).
   - **Lexical Rules**: Strict compliance with the Full-Name & Anti-Abbreviation Mandate and kebab-case file conventions.
   - **Pre-Beta Purity (P4)**: Zero backwards-compatibility ballast, shims, or dead legacy fallbacks.

4. **Undeniable Areas for Improvement**:
   - Identify high-leverage architectural cleanups, unnecessary complexity, duplicate logic, or performance bottlenecks.
   - Focus on tangible, undeniable upgrades; avoid superficial style nitpicks.

---

## 2.0 Execution Steps

1. **Scope Definition**: Identify target files, active git diff (`git diff HEAD~1` or uncommitted edits), or the user's active context.
2. **Automated Sanity Check**: Run static checks and targeted tests to establish the baseline health:

   ```bash
   npm run verify
   ```

3. **Forensic Analysis**: Read the code line-by-line, quoting exact lines and mapping all observations to clickable file links.
4. **Report & Recommendations**: Group findings clearly by severity and present actionable solutions.

---

## 3.0 Report Format

Provide a concise, categorized summary:

- 🔴 **Critical / Broken Wiring**: Real bugs, unhandled crashes, or disconnected logic.
- 🟡 **Subtle Risks & Edge Cases**: Race conditions, missing guards, or state desyncs.
- 💡 **Undeniable Improvements**: High-leverage refactorings, cleaner abstractions, or performance gains.
- ✅ **Strengths**: What is working cleanly and solidly.
