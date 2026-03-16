# 🧪 Technetium (Technical Supremacy)

description: Svelte 5 Runes, The Chalk Regime, and Architectural Standards.

## 1. Svelte 5 Supremacy

- **Mandate**: All new code MUST use Svelte 5 Runes ($state, $derived, $effect).
- **Zero Legacy**: `export let`, `$:`, and traditional stores are forbidden.
- **Refactoring**: Silently upgrade legacy Svelte code on sight.

## 2. The Chalk Regime (Visual Laws)

The interface is high-contrast, immersive, and diegetic (Nordic noir + glassmorphism).

- **Colors**: Never use hardcoded hex. Use tokens from `src/theme/tokens.css`.
    - `var(--chalk)` (#e1e5f2): Primary contrast/text.
    - `var(--gunmetal)` (#1b262c): Primary surface.
    - `var(--frozen)` (#0f4c75): Interactive accent.
- **Surface**: Use semi-transparent glass with background blurs.
- **Depth**: Use "whisper-soft" shadows, not pixel borders.
- **Motion**: All interactions must use the `Snappy Curve`.

## 3. File System & Nomenclature

| Type | Case | Example |
| :--- | :--- | :--- |
| **Directories** | `kebab-case` | `game-engine/` |
| **Svelte Component** | `PascalCase` | `StoryPanel.svelte` |
| **Structure/Class** | `PascalCase` | `ContextBroker.js` |
| **Process/State** | `snake_case` | `build_prompt`, `current_char` |
| **Global Config** | `SCREAMING_SNAKE` | `ENTITY_DEFINITION` |

## 4. The Literalism Protocol

1. **Absolute Grounding**: All technical explanations MUST map to actual file paths and line numbers.
2. **LABEL Hypotheticals**: Mark "example" or hypothetical code clearly.
3. **Verification Obligation**: Verify system behavior via `view_file` before claiming it.
4. **Transparency**: Report ambiguity (A3+) rather than inferring "likely" behavior.

## 5. Architectural High-Visibility

In complex logic files, major functional areas MUST be separated by 80-character banners:

```javascript
/************************************************************************************
 * 🧩 [SECTION: CATEGORY NAME]
 * ----------------------------------------------------------------------------------
 * Description of responsibility.
 ************************************************************************************/
```
