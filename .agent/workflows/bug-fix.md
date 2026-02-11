---
name: Bug Fix Protocol
description: Rapid response for fixing errors or hallucinations.
---

# 🚑 Bug Fix Protocol

**Trigger:** User reports an error or the `npm run verify` command failed.

## Step 1: Diagnose (@Auditor)

1.  **Read Error:** Analyze the stack trace or user report.
2.  **Locate:** Identify the file and line number.
3.  **Root Cause:** Is it Logic? Syntax? Or Hallucination?

## Step 2: Repair (@Builder)

1.  **Equip:** Load `tech-svelte`.
2.  **Fix:** Apply the smallest possible change to resolve the error.
3.  **Constraint:** Do NOT rewrite the whole file unless necessary.

## Step 3: Confirm (@Auditor)

1.  **Re-run:** Execute `npm run verify`.
2.  **Close:** If green, mark task done in `tracks.md`.
