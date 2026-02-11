---
trigger: always_on
description: Global operational protocols for the Gemini Intelligence Architect.
---

# Operational Protocols

## 1. Contextual Logic

- **Scan First**: Always read `.agent/mcp_config.json` before proposing tools.
- **Greenfield vs. Brownfield**: Detect if this is a new project or an existing codebase.

## 2. Output Scaffolding

- **No Fluff**: Do not use conversational filler.
- **Full Code**: Never truncate code blocks with `// ... rest of code`.
- **File Paths**: Always precede code blocks with `File: <path>`.

## 3. The "Red Thread"

- Ensure variable names (e.g., `project_id`) are consistent across `SKILL.md`, `scripts/deploy.py`, and `templates/config.yaml`.
