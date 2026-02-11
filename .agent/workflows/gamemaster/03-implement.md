---
description: Executes the implementation plan for a defined track.
constraints:
    - "MUST execute Rule 07: Clarity Gate before any file generation."
    - "MUST adopt the Gamemaster Persona."
---

# 🎮 Gamemaster: Apex Implementation Protocol

> **Goal:** High-fidelity execution of the implementation plan via autonomous task queuing, specialist dispatching, and multi-agent validation gates.

## 1. Intelligence Synchronization & Initialization

1.  **Select Track**: Load the first incomplete track from [.agent/tasks/tracks.md](../../tasks/tracks.md).
2.  **Load Continuity**: Read any active handoffs in `.agent/tasks/handoffs/`.
3.  **Plan Sync**: Parse the track's `plan.md` to identify unchecked `[ ]` tasks.

## 2. The Specialist Execution Loop (Loki Pattern)

For each unchecked task `[ ]` in the track's `plan.md`:

### A. Dispatch Phase

1.  **Identify Persona**:
    - **Artificer**: UI/UX, Svelte Components, Scaffolding.
    - **Warden**: Logic, Security, Performance, Reverts.
    - **Scholar**: Lore, Knowledge sync, Documentation.
2.  **Adopt Persona**: Switch to the identified skill persona via its `SKILL.md` triggers.
3.  **Isolation (Optional)**: If the task is high-risk, create a git worktree: `git worktree add .agent/worktrees/<task-id>`.

### B. Implementation Phase

1.  **Status Update**: Change task status to `[/]` (Active).
2.  **Core Execution**:
    - Apply [01-prime-directive.md](../../rules/01-prime-directive.md).
    - **State Check**: If modifying global stores, create new `.svelte.js` state modules using Svelte 5 Runes (`$state`, `$derived`).
    - **Tech Audit**: Ensure Svelte 5 runes (`$state`, `$derived`, `$effect`) are utilized over legacy patterns.

### C. Quality Control Gate (The Review Loop)

1.  **Scholar Verification**: Invoke `scholar/review.md`.
    - Verify against `knowledge/tech/svelte-5.md` and Lorebooks.
2.  **Warden Audit**: Invoke `warden/audit.md`.
    - Check for unsanitized `innerHTML`, dead code, or aesthetic drift from [06-aesthetic.md](../../rules/06-aesthetic.md).
3.  **Circuit Breaker**: If logic fails validation 3 times, the Gamemaster MUST halt and re-evaluate the `spec.md`.

### D. Completion

1.  **Verify**: Run `npm test` or specific Vitest files.
2.  **Handoff**: Write a completion report to `.agent/tasks/handoffs/<task-id>_done.md`.
3.  **Mark Done**: Update `plan.md` to `[x]`.

## 3. Checkpoint & Anchor (GameMaster Protocol)

1.  **Verification Report**:
    - **Automated**: Capture test logs.
    - **Manual**: Provide a 3-step verification plan for the User (URL -> Action -> Expected Result).
2.  **User Consent**: Await explicit user confirmation before anchoring state.
3.  **Checkpoint Commit**:
    - Stage all changes.
    - Commit: `gamemaster(checkpoint): Track <Name> - Phase <X> complete`.
    - **Persistence**: Run `git notes add -m "$(cat .agent/tasks/handoffs/summary.md)" HEAD`.
4.  **Update Registry**: Update SHA in `tracks.md`.
