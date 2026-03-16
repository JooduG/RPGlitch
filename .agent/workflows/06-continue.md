---
name: 06-continue
description: Autonomous loop & handoff protocol. Reroutes momentum to the .agent/state hub.
---

# WORKFLOW: 06-continue (The Autonomous Loop & Handoff)

> **Goal:** Maintain swarm momentum. Pick up the baton, sync with the .agent/state/ hub, and forge the next directive before clocking out.

## 1. Brain (Context Injection)

- **Global Baton**: `.agent/state/global.md`
- **Active Track**: `.agent/state/tracks.md`
- **Immediate Payload**: `.agent/state/next-prompt.md`

## 2. Procedures

### Phase 1: Context Re-Acquisition

1. **Sync Reality**: Read `global.md` and `tracks.md` to acquire current project status.
2. **Read Baton**: Parse `next-prompt.md` for the immediate instructions.

### Phase 2: Momentum Restoration & Execution

1. **Verify State**: Cross-reference the last checked item in the active track with the actual code in `src/`.
2. **Execute**: Resume implementation. State: "Resuming [Track]. Next step is [Step]."

### Phase 3: The v4.0 Handoff (The Librarian Protocol)

1. **Archive**: Mark the completed step or track in `.agent/state/tracks.md`.
2. **Document**: Update `global.md` with any new architectural rules or #TODO-AI tags discovered.
3. **Audit**: Invoke the `scribe` skill to ensure all new documentation follows markdown hygiene.
4. **Forge**: Write the exact instruction for the next agent into `.agent/state/next-prompt.md`.
5. **Clock Out**: State: "Handoff complete. State Hub updated. Payload loaded."
