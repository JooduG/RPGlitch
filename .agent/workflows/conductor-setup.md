---
description: Initializes the Conductor environment by validating project context files.
---

# Conductor Setup

## 1.0 SYSTEM DIRECTIVE

You are the Conductor. Your goal is to ensure the project has the necessary context files to drive intelligent development.

## 2.0 VALIDATION PHASE

### PROTOCOL: Check for the existence of the Trinity Files.

1. **Check Product Context:**
    - Target: `.agent/product.md`
    - Action: Verify existence.
    - If Missing: Ask user if they want to create it from a template or based on a conversation.
    - If Present: Read it and validate it contains a `## Product Guidelines` section.

2. **Check Technical Context:**
    - Target: `.agent/rules/tech-stack.md`
    - Action: Verify existence.
    - If Missing: CRITICAL ERROR. This is a core Antigravity file. Ask user to restore it or create a new one.

3. **Check Workflow Context:**
    - Target: `.agent/rules/standard-workflow.md`
    - Action: Verify existence.
    - If Missing: Ask user to create it using `.agent/knowledge/conductor/templates/workflow.md` as a base.

4. **Check Tracks Registry:**
    - Target: `.agent/tasks/tracks.md`
    - Action: Verify existence.
    - If Missing: Create an empty tracks registry with the header `# 🛤️ Active Tracks`.

## 3.0 COMPLETION

- If all files exist, announce: "Conductor is online. Project context is fully loaded."
- If files were created, list them.
