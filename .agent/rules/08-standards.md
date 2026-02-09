---
trigger: always_on
---

# 📏 08: Nomenclature & Standards

> "Ambiguity is the enemy of execution. We speak in absolute truths: ISO dates, Metric units, and Strict casing."

## 1. File System Nomenclature

Agents must strictly adhere to these casing standards when creating or renaming files.

| Type            | Case          | Pattern                                 | Example                                | Reasoning                                           |
| :-------------- | :------------ | :-------------------------------------- | :------------------------------------- | :-------------------------------------------------- |
| **Directories** | `kebab-case`  | `^[a-z0-9-]+$`                          | `game-engine/`, `qa-security/`         | URL-safe, standard for system paths.                |
| **Scripts**     | `snake_case`  | `^[a-z0-9_]+\.(js\|py\|sh)$`            | `verify_ui.js`, `analyze_css.js`       | Distinguishes executable tools from static content. |
| **Knowledge**   | `kebab-case`  | `^[a-z0-9-]+\.md$`                      | `zero-trust.md`, `svelte-5.md`         | Treating knowledge as "Wiki Pages".                 |
| **Templates**   | `UPPER_SNAKE` | `^[A-Z0-9_]+\.md$`                      | `BUG_REPORT.md`, `TEST_PLAN.md`        | Visually distinct. Signals "Fill this out".         |
| **Config**      | `kebab-case`  | `^[a-z0-9-]+\.(json\|yml\|config\.js)$` | `package.json`, `playwright.config.js` | Industry standard.                                  |
| **Components**  | `PascalCase`  | `^[A-Z][a-zA-Z0-9]+\.svelte$`           | `StoryPanel.svelte`                    | Framework requirement.                              |

## 2. Localization & Units (Swedish/SI Standard)

All agents, logs, and game mechanics must adhere to this locale standard to prevent conversion errors.

### 📅 Time & Date

- **Date Format**: **ISO 8601** (`YYYY-MM-DD`).
    - _Allowed_: `2026-02-02`
    - _Forbidden_: `02/02/2026`, `2nd Feb 2026`.
- **Time Format**: **24-Hour Clock** (`HH:MM` or `HH:MM:SS`).
    - _Allowed_: `14:30`, `09:15`
    - _Forbidden_: `2:30 PM`, `9:15 am`.
- **Week Start**: Monday.

### 📐 Measurements (Metric/SI)

- **Distance**: Meters (`m`), Kilometers (`km`). _Never miles/feet._
- **Weight**: Grams (`g`), Kilograms (`kg`). _Never pounds/ounces._
- **Temperature**: Celsius (`°C`). _Never Fahrenheit._
- **Volume**: Liters (`l`), Milliliters (`ml`).

## 3. Pathing & Structure

- **Logic Isolation**: Heavy logic (>50 lines) moves to `scripts/`.
- **Asset Colocation**: Images used by a Skill belong in `assets/`.

## 4. Domain Terminology (Ubiquitous Language)

To prevent cognitive drift, the following terms are **MANDATORY**. (See [Glossary](../knowledge/vision/glossary.md) for full definitions).

| Concept               | Standard Term  | ❌ Forbidden Terms              | Definition                                       |
| :-------------------- | :------------- | :------------------------------ | :----------------------------------------------- |
| **The Engine**        | **GameMaster** | Director, Orchestrator, Manager | The Logic/Turn Engine.                           |
| **Debug UI**          | **DevMode**    | Debug Mode, God Mode, Cheat     | The technical HUD for state inspection/bypass.   |
| **Narrative Control** | **GM Mode**    | **Director Mode**, Storyteller  | The in-world interface for controlling the plot. |
| **User Interface**    | **StoryMode**  | Chat, Play Mode                 | The primary player interface.                    |
