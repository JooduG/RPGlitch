---
name: 01-resonance
description: Awareness & Intake. Synchronizes the mental model with current reality.
---

# 01-resonance (The Intake)

> **Goal:** Establish a single source of truth at the start of every session or after an interruption.

## 1. Triggers
- **Session Start**: Any greeting or "Status check".
- **Interruption Recovery**: Resuming work after a long gap.
- **Slash Command**: `/01-resonance`

## 2. Brain (Context Injection)
- **Master Baton**: `.agent/state/global.md` (The high-level mission goal).
- **Track Board**: `.agent/state/tracks.md` (The registry of active/completed tasks).
- **Execution Shard**: `.agent/state/next-prompt.md` (The immediate baton for autonomous loops).
- **Physics**: `.agent/rules/01-foundation.md` and `.agent/rules/02-motion.md`.

## 3. Procedures

### Phase 1: Context Alignment
1. **Read Global**: Inspect `.agent/state/global.md` for the overarching directive.
2. **Scan Tracks**: Read `.agent/state/tracks.md`. Identify the track marked `[/]`.
3. **Load Shard**: Read `.agent/state/next-prompt.md` to see if a specific sub-task was queued.

### Phase 2: Resonance Check
1. **Verify Integrity**: Do the files agree? (e.g., If `next-prompt` asks for a fix that `tracks` says is done, alert the user).
2. **Acknowledge**: State current status clearly: "Resonated. Active track is [Track Name]. Ready for [Next Step]."

### Phase 3: Transition
- If no active track exists, offer the next priority item from `tracks.md`.
- If an active track exists, transition immediately to `/02-genesis` (if planning) or `/03-fabrication` (if executing).

## 4. Anti-Patterns
- **Guessing**: Acting before reading the `.agent/state/` directory.
- **Amnesia**: Forgetting the previous session's progress.
