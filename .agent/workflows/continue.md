---
description: Resilience Protocol. Analyzes broken state, fixes syntax errors caused by interruption, and resumes the active task.
---

# 🔄 Resilience & Recovery Protocol

This workflow triggers when the Agent or User detects an interruption (e.g., "Network Error", "Max Tokens", or a crashed output).

## 1. State Analysis (Turbo)

First, identify which file was left in a "zombie" state.

1. **Check Status:**
   - Run command:

     ```bash
     // turbo
     git status
     ```

2. **Identify Target:** Look for the modified file that matches the user's last request.

## 2. Syntax Repair (The Tourniquet)

Interruptions often leave unclosed brackets `}` or broken strings. We must fix the structure before adding logic.

1. **Auto-Repair:**
   - Run the linter to attempt an auto-close of blocks:

     ```bash
     // turbo
     npm run lint:fix
     ```

2. **Manual Check:**
   - If `lint:fix` fails, read the **last 20 lines** of the target file.
   - **Action:** Manually append the missing `});` or closing tags to make the file valid.

## 3. Context Re-Acquisition

1. **Read Artifacts:** Review the active **Task List Artifact**. Which box is unchecked?
2. **Resume:**
   - **DO NOT** rewrite the entire file.
   - **DO** generate a `Diff` that starts exactly where the previous code cut off.
   - **Prompt:** "Resuming task [X] from line [Y]..."
