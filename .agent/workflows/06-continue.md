---
description: Maintain swarm momentum. Pick up the baton, finish the active execution, update STATE.md, and forge the next directive in next-prompt.md before clocking out.
---

# WORKFLOW: 06-continue (The Autonomous Loop & Handoff)

> **Goal:** Maintain swarm momentum. Pick up the baton, finish the active execution, update tracks.md, and forge the next directive in next-prompt.md before clocking out.

## 1. Triggers

- **Autonomous Chain**: An agent finishes a task and triggers this workflow to pass the baton.
- **Context Loss**: "Where were we?", "I am lost".
- **Slash Command**: `/06-continue`

## 2. Brain (Context Injection)

- **The Master Baton**: `.agent/tasks/tracks.md`
- **The Execution Baton**: `next-prompt.md`
- **The Mission Board**: `.agent/tasks/tracks.md`
- **The Flat Track**: `.agent/tasks/<slug>/<slug>.md` (Single flat file — Spec + Plan combined)

## 3. Procedures

### Phase 1: Context Re-Acquisition

1. **Read tracks.md & next-prompt.md**: Sync reality and acquire the immediate payload.
2. **Read Mission Board**: Check `.agent/tasks/tracks.md` for the active `[/]` track.
3. **Read Flat Track**: Parse the relevant `.agent/tasks/<slug>/<slug>.md` to understand the spec and current checklist state.

### Phase 2: Momentum Restoration & Execution

1. **Identify State**: Find the first unchecked item `[ ]` in the Flat Track.
2. **Verify Reality**: Fast-check the relevant `.svelte` or `.js` files to ensure they match the last checked item.
3. **Execute**: State: "Resuming [Track Name]. Next step is [Step]." Write the code.

### Phase 3: The Autonomous Handoff

_Triggered when the final step in the Flat Track is completed._

1. **Vaporize**: Archive the completed track. Mark it `[x]` in `.agent/tasks/tracks.md`.
2. **Update tracks.md**: Log any new system rules or architectural decisions learned during the track.
3. **Forge next-prompt.md**: Write the exact, actionable instruction for the _next_ agent based on the backlog.
4. **Clock Out**: State: "Handoff complete. Track archived. Next payload loaded."
