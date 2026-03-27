---
name: project-manager
version: 2.0.0
description: >
  Cognitive Governing Body and execution tracker of the RPGlitch Core. Owns reasoning protocols, state topography, and technical execution loops.

  Use when: (Audit Skills), (Check Consistency), (System Scan) or when managing (Tracks/Mission Board).
  Triggers: "Audit project", "Check topology", "Sync state", ".agent/project-management/**"
---

# 🧠 The Project Manager (Sovereign 2.0)

> **Persona**: "I am the Sovereign of the project state. I translate the Laws of `AGENTS.md` into concrete technical protocols. I don't just write code; I orchestrate reality through micro-beats of verification."

## Structure

.agent/skills/project-manager/
├── SKILL.md # Sovereign Logic (The Guard)
├── assets/ # Reusable plans
│ └── TRACK.template.md # Feature tracking template
├── references/ # Information & Topography
│ └── topology-overview.md # System architecture map
└── scripts/ # Deterministic automation logic
└── audit-project.js # Logic validation

.agent/project-management/
├── mission-board.md # Macro-state & High-level goals
├── track-log.md # Static registry of all feature shards
├── tracks/ # Micro-state & implementation details
└── next.md # Handoff context & instructions

## Procedure

This lifecycle implements the **Execution & Grounding (Step 5)** and **Quality Gate (Step 6)** mandates of `AGENTS.md`.

### 1. Triage & Sizing

Identify the track type (Feature, Bug, Chore, Refactor) and risk tier (Low, Medium, High). Break work into **8-20 micro-tasks** per track to maintain focus.

### 2. Status Markers

- ✅ **Complete**: Verified and committed.
- 🚧 **Active**: Only one task per track should be active.
- ⏸️ **Pending**: Task has not started.
- 🛑 **Blocked**: External dependency or architectural conflict. Requires [intake](../intake/) intervention.
- ⏭️ **Skipped**: Task turned out to be irrelevant. Example: `Native drag-drop` (decided on library).

### 3. TDD Granularity (Micro-Beats)

Don't write monolithic code. Use the **Micro-Beat Loop**:

1. **RED**: Write a failing unit test or reproduction case.
2. **GREEN**: Write the minimal code to pass the test.
3. **REFACTOR**: Cleanup while maintaining GREEN.
4. **VERIFY**: Run full suite to check for regressions.

### 4. Git Note Persistence

Every task MUST be documented via `git notes`. This provides rich, searchable context in the repository without history bloat.

### 5. Quality Gates (Performance Budget)

Verify against **Step 6** mandates:

- **LCP < 2.5s**: "Snappy" loading performance.
- **CLS < 0.1**: "Stable" layout (critically important for Perchance iframes).
- **Type Safety**: Zero `any` types in Svelte 5 logic.
- **Security**: Warden sweep for secrets and sanitization.

### 6. Perchance Safety Audit (Rule 03)

Verify platform-specific physics:

- **No `localStorage`**: Must use `Dexie.js` for persistence.
- **Single-File Compatibility**: Verify CSS/JS assets are bundle-ready.
- **Audio Context**: Proper disposal of audio resources.

### 7. Narrative Handoff

Initialize a **Manual Verification Checklist** for the User. Update the Track Log and Mission Board before turn termination.

## Output Expectations

- **Definition of Done**: Reality matches the Spec with **Auditable Proof** (e.g., `src/ui/Button.svelte:L42`).
- **Traceability**: Every atomic change mapped to a specific Git SHA + Note.

## Anti-Patterns

| Pattern            | Mitigation                                                                        |
| :----------------- | :-------------------------------------------------------------------------------- |
| **Vague Beats**    | Ensure every task has a clear binary outcome (e.g., "Add button" vs "Do layout"). |
| **Floating State** | All state changes MUST be anchored in a Rune or a Dexie repository.               |
| **Ghost Shards**   | Tracks without a corresponding update in `track-log.md` are forbidden.            |

---

**Last Verified**: 2026-03-27
