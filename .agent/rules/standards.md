---
trigger: always_on
description: Global standards for naming, formatting, and operational parameters.
---

# 📏 Standards (The Law)

## 1. Global Operating Parameters (Cognitive Sliders)

- **CREATIVITY**: 0/10 (Strict adherence to docs. No inventing APIs.)
- **VERBOSITY**: 1/10 (Code only. Do not explain unless asked.)
- **SAFETY**: 10/10 (Zero-trust on user input. Sanitize everything.)
- **MEMORY**: 10/10 (Always consult `.agent/knowledge` before answering.)

## 2. Performance Standards

- **Zero Fluff**: Omit conversational filler. Do not use persona-based language.
- **Complete Output**: Never truncate code blocks.
- **Path Headers**: Always precede code blocks with `File: <absolute_path>`.
- **Consistency**: Maintain identical variable names across documentation and code.

## 3. Visual Laws (The Aesthetic Code)

> Reference: Look up exact values in `.agent/skills/scss/docs/reference.md`.

1.  **No Borders**: Use shadows and depth to define hierarchy.
2.  **Soft Depth**: All elements must use layered shadows, not outlines.
3.  **Texture Mandatory**: Backgrounds must have a 2% grain overlay.
4.  **Motion Mandatory**: All interactions must use the `Snappy Curve`.

## 4. File System Nomenclature

Agents must strictly adhere to these casing standards.

| Type                 | Case         | Pattern                          | Example             |
| :------------------- | :----------- | :------------------------------- | :------------------ |
| **Directories**      | `kebab-case` | `^[a-z0-9-]+$`                   | `game-engine/`      |
| **Svelte Component** | `PascalCase` | `^[A-Z][a-zA-Z0-9]+\.svelte$`    | `StoryPanel.svelte` |
| **Scripts**          | `snake_case` | `^[a-z0-9_]+\.(js\|ts)$`         | `verify_state.js`   |
| **Assets**           | `kebab-case` | `^[a-z0-9_-]+\.(png\|jpg\|svg)$` | `hero-banner.png`   |
| **Knowledge**        | `kebab-case` | `^[a-z0-9-]+\.md$`               | `01-stack.md`       |

## 5. Localization & Units (SI Standard)

- **Time:** ISO 8601 (`YYYY-MM-DD`, `HH:MM:SS`). **NO** `MM/DD/YYYY`.
- **Distance:** Meters (`m`), Kilometers (`km`). **NO** Feet/Miles.
- **Weight:** Grams (`g`), Kilograms (`kg`). **NO** Lbs/Oz.
- **Temperature:** Celsius (`°C`). **NO** Fahrenheit.

## 6. Definition of Done (The Gold Standard)

> **Directive:** A task is not finished when the code is written; it is finished when reality matches the spec with auditable proof.

### ✅ Implementation Standards

- [ ] Code is implemented strictly to the `spec.md` / `task.md`.
- [ ] Logic follows the **Five Pillars** (Pure IO where possible).
- [ ] Svelte components use **Runes** exclusively (`$state`, `$derived`, `$props`).
- [ ] Styling adheres to **The Chalk Regime**.

### 🛡️ Integrity & Quality Gates

- [ ] **Test Coverage**: Unit tests exist and pass for all new logic.
- [ ] **Security**: All dynamic input/HTML is sanitized via Warden.
- [ ] **Hygiene**: No `console.log`, `FIXME`, or dead comments remain.
- [ ] **Accessibility**: Unique IDs and ARIA labels.

### 📝 Auditability

- [ ] Git commit messages follow `gamemaster(type): description`.
- [ ] Changes are verified in the `walkthrough.md`.

## 7. Domain Terminology (The Project Lexicon)

### 🏛️ The Five Pillars (Architecture)

1.  **GameMaster (The Engine)**: Logic execution, time progression (`src/core/engine/`).
2.  **Artificer (The UI)**: Svelte components, layout (`src/ui/`).
3.  **Mesmer (The Senses)**: CSS, Audio, Motion, Media (`src/theme/`, `src/media/`).
4.  **Scholar (The Memory)**: Dexie.js persistence, State management (`src/data/`).
5.  **Warden (The Shield)**: Security, Validation, Testing (`src/core/security/`).

### 🧩 Core Concepts

| Concept               | Definition                                              |
| :-------------------- | :------------------------------------------------------ |
| **Chrono Kinetics**   | Time progression system based on input density.         |
| **Entropy Engine**    | Randomizer system for "Fail-Forward" logic.             |
| **Resonance Monitor** | HUD tracking Trust, Will, and Tension.                  |
| **Lorebook (ANEX)**   | Speculative knowledge injection system.                 |
| **Silent Stage**      | Design philosophy: Minimize UI noise, maximize text.    |
| **Echo**              | A persistent memory fragment stored by the Scholar.     |
| **Fractal**           | Speculative branching narrative path.                   |
| **DevMode**           | Analysis interface. **NEVER** "God Mode".               |
| **StoryMode**         | Primary User Interface.                                 |
| **GM Mode**           | Narrative Control Interface. **NEVER** "Director Mode". |
