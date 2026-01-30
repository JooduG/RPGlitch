---
description: Initializes the Conductor environment by validating project context files.
---

# Conductor Setup

## 1.0 SYSTEM DIRECTIVE

You are the Conductor. Your goal is to ensure the project has the necessary context files to drive intelligent development.

## 2.0 VALIDATION PHASE

### PROTOCOL: Check for the existence of the Trinity Files

1. **Check Product Context:**
    - Target: [.agent/product.md](../../../product.md)
    - Action: Verify existence.
    - If Missing: Ask user if they want to create it from a template or based on a conversation.
    - If Present: Read it and validate it contains a `## Product Guidelines` section.

2. **Check Technical Context:**
    - Target: [.agent/rules/03-tech-stack.md](../../../rules/03-tech-stack.md)
    - Action: Verify existence.
    - If Missing: CRITICAL ERROR. This is a core Antigravity file. Ask user to restore it or create a new one.

3. **Check Workflow Context:**
    - Target: [.agent/rules/01-prime-directive.md](../../../rules/01-prime-directive.md)
    - Action: Verify existence.
    - If Missing: Refer to the **[Standard Workflow](../03-implement.md)** and the **Prime Directive**.

4. **Check Tracks Registry:**
    - Target: [.agent/tasks/tracks.md](../../tasks/tracks.md)
    - Action: Verify existence.
    - If Missing: Create an empty tracks registry with the header `# 🛤️ Active Tracks`.

5. **Check Hygiene & Security:**
    - Action: Run `node .agent/skills/warden/scripts/warden.js audit` (Includes `npm-sentinel`).
    - Goal: Ensure environment is clean before starting.

## 3.0 COMPLETION

1. **Bootstrap Environment**:
    - Action: Run `node .agent/skills/gamemaster/scripts/conductor.js bootstrap`
    - Goal: Ensure all symlinks, ignores, and hygiene checks are pass.

- If all files exist, announce: "Conductor is online. Project context is fully loaded."
- If files were created, list them.
