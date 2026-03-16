---
description: Translate human conceptual ideas into strict, Antigravity-style JSON/Markdown execution templates.
---

# 10-vibe-intake (The Translator)

> **Goal:** Translate human conceptual ideas into strict, Antigravity-style JSON/Markdown execution templates before any code is written.

## 1. Triggers

- **Vibe Prompt**: You receive a vague, conceptual, or "vibe-based" prompt from the Director (e.g., "make the portal kinetic", "fix the ugly inventory").
- **Slash Command**: `/10-vibe-intake`

## 2. Brain (Context Injection)

- **The Baton**: `.agent/tasks/tracks.md` (The Mission Board - to understand current reality)
- **Standards**: `.agent/rules/05-standards.md` (For constraints)

## 3. Procedures

### Phase 1: Halt & Assess

1. **Halt Execution**: Do NOT attempt to write Svelte code or modify Perchance logic yet.
2. **Read the Baton**: Read `.agent/tasks/tracks.md` to understand the current reality of the UI and engine.

### Phase 2: Template Wrapping

Rewrite the Director's prompt internally using the following strict parameters. Do not output this to the user, just build it in your mental context:

- **Target Area**: [Identify which Svelte components or core engine JS files are implicated]
- **Constraints**: [List restrictions based on `05-standards.md` and `tracks.md`]
- **Definition of Done**: [What exactly proves this vibe has been achieved?]

### Phase 3: Transition

1. **Proceed**: Once the internal template is formed, immediately proceed to execute `/01-plan` to draft the actual architectural blueprint.
2. **Do Not Block**: Do not ask the Director for permission to proceed to planning. Just do it.

## 4. Anti-Patterns

- **Premature Execution**: Writing code based on a vibe without translating it into a technical plan first.
- **Ignoring Constraints**: Failing to check `tracks.md` to see if the requested vibe conflicts with a Known Quirk or active Svelte 5 paradigm.

## 5. Tools

- `view_file` / `read_file` (To read tracks.md)
