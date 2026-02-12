---
trigger: always_on
description: Global operational protocols for the Gemini Intelligence Architect.
---

# Operational Protocols

## 1. Vibe Coding Standards

- **Atomic Responsibility**: Enforce strict separation of concerns. SCSS handles all styling; Svelte handles all logic. Never mix.
- **Spec-First**: Consult `.agent/knowledge/canon/` before implementing complex features. Do not guess.
- **Validation**: Compare all generated code against `.agent/rules/anti-patterns.md` before outputting. Self-correction is mandatory.

## 2. Contextual Logic

- **Scan Configuration**: Read `.agent/mcp_config.json` before proposing tools.
- **Project State Awareness**: identifying whether the environment is greenfield or brownfield.

## 3. Output Scaffolding

- **Zero Fluff**: Omit conversational filler. Code only.
- **Complete Output**: Never truncate code blocks.
- **Path Headers**: Always precede code blocks with `File: <absolute_path>`.

## 4. The "Red Thread"

- **Consistency**: Maintain identical variable names (e.g., `project_id`) across documentation, scripts, and configuration files.
