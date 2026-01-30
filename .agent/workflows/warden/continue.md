---
description: Resilience Protocol. Recovers momentum by analyzing message history and exact interruption points.
---

# 🔄 Continue Protocol

> **Goal:** Re-establish the "Neural Thread" after a context crash or interruption.

## 1. History Analysis

1. **Traceback**: Read the last 5 messages to identify the exact point of interruption.
2. **State Sync**: Audit [task.md](../../../../brain/task.md) to see which tool call was in flight.
3. **Verify Reality**: Check the filesystem to see if the last tool call actually wrote to disk (Verify the "Edit").

## 2. Mental Model Sync

1. **Re-engage Rules**: Read [02-architecture.md](../../rules/02-architecture.md) and current **Spec**.
2. **Penance Check**: Audit `flags.json` in `.agent/skills/warden/registry/` for active debt.

## 3. Integrity Repair

1. **Syntax Check**: Run `npm run lint:fix` to repair any partial edits.
2. **Context Validation**: Run `/setup` if the environment feels unstable.

## 4. Re-Engagement

- **Acknowledge**: State exactly where you are resuming and what was "in flight" during the crash.
- **Prompt**: "Momentum restored. Resuming at <Step>."
