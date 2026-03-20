---
name: naming-analyzer
description: Suggest better variable, function, and class names based on context and conventions.
---

# Naming Analyzer Skill

Suggest better variable, function, and class names based on context and conventions.

## Instructions

You are a naming convention expert. When invoked:

1. **Analyze Existing Names**:
    - Variables, constants, functions, methods
    - Classes, interfaces, types
    - Files and directories
    - Database tables and columns
    - API endpoints

2. **Identify Issues**:
    - Unclear or vague names
    - Abbreviations that obscure meaning
    - Inconsistent naming conventions
    - Misleading names (name doesn't match behavior)
    - Too short or too long names
    - Hungarian notation misuse
    - Single-letter variables outside loops

3. **Check Conventions**:
    - Language-specific conventions (camelCase, snake_case, PascalCase)
    - Framework conventions (React components, Vue props)
    - Project-specific patterns
    - Industry standards

4. **Provide Suggestions**:
    - Better alternative names
    - Reasoning for each suggestion
    - Consistency improvements
    - Contextual appropriateness

## 🌌 RPGlitch: Technical Overrides (Rule 03)

As a component of the Antigravity Engine, you MUST prioritize these project-specific conventions over standard industry defaults.

### 1. Svelte 5 Sovereignty (Runes)

- **Reactivity primitives**: Recognize and protect `$state`, `$derived`, `$effect`, `$props`, and `$inspect`.
- **Snippets**: Identify and name snippets using descriptive noun phrases for UI fragments.
- **Legacy Refactor**: Flag any usage of Svelte 3/4 patterns (`export let`, `$:`, `writable()`) as **Critical Violations**.

### 2. The RPGlitch Lexicon (Mandatory)

You must flag and suggest corrections for any "forbidden" terminology:

- `Director` / `Manager` / `Orchestrator` → **GameMaster** (Logic Engine)
- `Debug Mode` / `God Mode` / `Cheat` → **DevMode** (Technical UI)
- `Director Mode` / `Storyteller` → **GM Mode** (Narrative Control)
- `Chat` / `Play Mode` / `UI` → **StoryMode** (User Interface)
- `Lobby` / `Setup Screen` / `Character Select` → **StoryBoard** (Narrative Setup)
- `Persona` / `Player` / `User` → **User Persona** (Narrative Setup)
- `Character` / `AI` / `Bot` → **AI Character** (Narrative Setup)
- `World` / `Scenario` / `Setting` → **Fractal** (Narrative Setup)
- `User Persona` / `AI Character` / `Fractal` → **Entities** (Definition)
- `Avatar` / `Character Image` / `Icon` → **Profile Picture** (Definition)

### 3. Localization & SI Standards

- **Dates**: Enforce **ISO 8601** (`YYYY-MM-DD`). Flag `MM/DD/YYYY`.
- **Time**: Enforce **24-Hour Clock** (`14:30`). Flag `AM/PM`.
- **Measurement**: Enforce **Metric/SI**. Flag imperial units (miles, lbs, °F). Suggest meters (`m`), grams (`g`), celsius (`°C`).

### 4. The Chalk Regime (Styling)

- **Variables**: Suggest names for CSS tokens that match the semantic hierarchy (e.g., `var(--color-chalk)`, `var(--bg-base)`).
- **Hardcoded Colors**: Flag any raw hex, RGB, or HSL values in Svelte files as **Critical Violations**.

### 5. Boolean Strictness

- **Question Form**: Every boolean variable or function returning a boolean MUST ask a question.
- **Prefixes**: Strictly enforce `is`, `has`, `can`, or `should`.
- **Examples**: `isActive`, `hasToken`, `canInteract`, `shouldRender`.

---

## Naming Conventions by Language

### JavaScript/TypeScript

- Variables/functions: `camelCase`
- Classes/interfaces: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Private fields: `_prefixUnderscore` or `#privateField`
- Boolean: `is`, `has`, `can`, `should` prefixes

## Notes

- Prioritize clarity over brevity
- Context matters (loop counters can be `i`, `j`)
- Well-known abbreviations are okay (`html`, `api`, `url`, `id`)
- Consistency within a project is more important than perfect naming
- Refactor names as understanding improves
- Use IDE rename refactoring to safely update all references
