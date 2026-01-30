---
description: Resilience Protocol. Analyzes broken state, fixes syntax errors caused by interruption, and resumes the active task.
---

# 🔄 Resilience & Recovery Protocol

> **Goal:** Recover context after an interruption or token limit cut.

## 1. State Analysis

1. **Check Status:** Run `git status` or list active files.
2. **Reload Rules (CRITICAL):**
    - You **MUST** read [.agent/rules/02-architecture.md](../../rules/02-architecture.md) and [.agent/skills/artificer/SKILL.md](../../skills/artificer/SKILL.md) before writing a single line of code.
    - _Reason:_ Without this, you might hallucinate legacy syntax or patterns.

## 2. Syntax Repair

Interruptions often leave unclosed brackets.

1. **Auto-Repair:** Run `npm run lint:fix`.
2. **Manual Check:** If the last file ended abruptly, close the blocks manually (`}});`).

## 3. Resume Operation

1. **Identify the Task:** Read [task.md](../../../../brain/task.md) or the last user prompt.
2. **Continue:**
    - **DO NOT** rewrite the whole file if it's large.
    - **DO** use `sed` or `append` if possible, OR rewrite only the missing chunk.
    - **Prompt:** "Resuming [Task Name]..."
