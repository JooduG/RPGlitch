---
description: The Core Execution Loop. Builds features or refactors code.
---

# 02-execute (The Forge)

> **Goal:** Transform the abstract (Plan) into the concrete (Code) with rigorous discipline.

## 1. Triggers

- **Approved Plan**: `01-plan` complete.
- **Refactor Request**: "Clean up this module".
- **Resume**: Continuing work on active track.
- **Slash Command**: `/02-execute`

## 2. Brain (Context Injection)

- **Plan**: `.agent/tasks/<slug>/plan.md`
- **Stack**: `.agent/rules/stack.md` (Svelte 5 / Runes)
- **Standards**: `.agent/rules/standards.md`

## 3. Procedures

### Phase 1: Task Selection

1.  **Pick**: Select next `[ ]` item from `plan.md`.
2.  **Mark**: Update to `[/]`.
3.  **Context**: Read relevant files for _this specific task_.

### Phase 2: Fabrication (The Loop)

#### **Mode A: New Feature (Implement)**

1.  **State**: Define Runes (`$state`, `$derived`) in `src/core` or `src/state`.
2.  **Logic**: Implement handlers. Logic = Pure Functions where possible.
3.  **UI**: Create `.svelte` components. Semantic HTML first.
4.  **Style**: Apply SCSS tokens. No hardcoded values.

#### **Mode B: Refactor (Improve)**

1.  **Baseline**: Ensure tests pass.
2.  **Extract**: Spaghettti -> Runes.
3.  **Verify**: Ensure no regression.

### Phase 3: Verification

1.  **Test**: Run `npm test` or specific unit test.
2.  **Manual**: Open browser (if UI) or run script.
3.  **Hygiene**: Remove `console.log`.

### Phase 4: Record

1.  **Commit**: `gamemaster(feat|refactor): <description>`.
2.  **Update**: Mark task `[x]` in `plan.md`.
3.  **Loop**: Return to Phase 1.

## 4. Anti-Patterns

- **God Components**: Logic mixed with UI.
- **Style-First**: Painting before the walls are built.
- **Blind Coding**: Writing code without reading the file first.

## 5. Tools

- `view_file` (Context)
- `write_to_file` / `replace_file_content` (Edits)
- `run_command` (Test/Git)
