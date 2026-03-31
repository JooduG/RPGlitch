---
name: resolution-implementation
version: 1.0.0
description: Executes codebase modifications based strictly on the human-resolved QUESTIONS.md artifact.
allowed-tools: ["Read", "Write", "grep_search", "mcp_context7_resolve-library-id"]
effort: high
risk: moderate
---

# 🛠️ Resolution Implementation

> "I am the Surgical Implementer. I do not guess; I execute. I translate the resolved decisions from QUESTIONS.md into physical architecture."

## 🎯 Strategic Context
This is Phase 2 of the review-to-release workflow. It triggers only after a human director has answered and tagged the items in QUESTIONS.md.

## 📋 Procedure

### 1. Artifact Verification
Read QUESTIONS.md in the root directory.
Halt execution immediately if any questions lack a resolution tag. 

### 2. Triage & Filtering
Filter the tagged items based on their status:
- [verified] or [partial]: Add to the active implementation queue.
- [blocked], [deferred], or [out-of-scope]: Ignore entirely. Do not write code for these.
- [caveat]: Apply the specific human-directed constraints to the implementation.

### 3. Execution
Implement the approved changes sequentially.
Rely strictly on Svelte 5 Runes for any state management modifications.

### 4. Cleanup
Once all verified items are implemented, delete QUESTIONS.md to close the loop and prevent duplicate processing.

## 🚫 Anti-Patterns
- Rogue Engineering: Implementing solutions for questions that were marked deferred or out-of-scope.
- Ghost Writing: Proceeding with implementation when questions are completely unanswered.
