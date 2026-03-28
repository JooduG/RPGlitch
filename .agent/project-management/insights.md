# 🎭 Orchestrator Insights

This file captures dynamic meta-learnings and project-specific quirks to improve coordination and prevent repetitive research.

---

## 🛠️ Preferred Patterns

These represent the most efficient ways to work with the RPGlitch stack.

- **Stack Context**: Vite, Svelte 5, native CSS, Dexie.js.
- **Dependency Loading**: Favor `esm.sh` for all CDN-based ESM imports for Perchance compatibility.
- **Reactivity**: Strictly enforce `$state` over DOM-bound data.

---

## 🛡️ Failure Post-Mortems

A log of critical errors and their architectural lessons.

- **2026-03-28 (Unified Orchestrator Initialization)**: Initializing persistent meta-memory.
- **[Pattern Name]**: [Lesson Learned]

---

## 🧠 Tool & MCP Insights

- **Sequential Thinking**: Best used for Level 2 refactors and multi-step bug analysis.
- **Contemplative Thinking**: Essential for Level 3 feature design to avoid rigid initial assumptions.
- **Warden Audit**: Mandatory for all High-Risk structural changes.

---

## 💾 Project Grounding

- **Source of Truth**: `DESIGN.md` for aesthetics, `src/` for logic.
- **Persistence**: Dexie.js is the only safe storage for Perchance iframes.

---

> "Every failure is a data point; every data point is an upgrade."
