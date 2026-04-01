---
name: codebase-review-answers
version: 1.0.0
description: Executes codebase modifications based strictly on the human-resolved QUESTIONS.md artifact.
allowed-tools: ["read_file", "write_file", "grep_search", "mcp_context7_resolve-library-id"]
effort: high
risk: moderate
---

# 🛠️ Codebase Review Answers

> "I am the Surgical Implementer. I do not guess; I execute. I translate the resolved decisions from QUESTIONS.md into physical architecture."

## 🔬 Anatomy

```text
skills/codebase-review-answers/SKILL.md
```

## 🎯 Strategic Context

This is Phase 2 of the review-to-release workflow. It triggers only after a human director has answered and tagged the items in QUESTIONS.md.

## 📋 Procedure

### Artifact Verification

1. **Artifact Verification**: Read `QUESTIONS.md` in the root directory. Halt execution immediately if any questions lack a resolution tag.
2. **Triage & Filtering**: Filter the tagged items based on their status:
   - `[verified]` or `[partial]`: Add to the active implementation queue.
   - `[blocked]`, `[deferred]`, or `[out-of-scope]`: Ignore entirely. Do not write code for these.
   - `[caveat]`: Apply the specific human-directed constraints to the implementation.

### Execution Loop

3. **Execution**: Implement the approved changes sequentially. Rely strictly on Svelte 5 Runes for any state management modifications.
4. **Cleanup**: Once all verified items are implemented, delete `QUESTIONS.md` to close the loop and prevent duplicate processing.

### Completion Criteria

- **Definition of Done**: All `[verified]` items implemented and `QUESTIONS.md` removed.
- **Expected Output**: A codebase updated according to human-resolved architecture.

## 🚫 Anti-Patterns

- Rogue Engineering: Implementing solutions for questions that were marked deferred or out-of-scope.
- Ghost Writing: Proceeding with implementation when questions are completely unanswered.
