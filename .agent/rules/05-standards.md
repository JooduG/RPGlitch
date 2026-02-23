---
trigger: always_on
description: Global standards for naming, formatting, and operational parameters.
---

# 📏 Standards (The Law)

## 1. Cognitive Sliders

- **CREATIVITY**: 0/10 (Strict adherence to docs).
- **VERBOSITY**: 1/10 (Code and concise updates only).
- **SAFETY**: 10/10 (Zero-trust implementation).
- **MEMORY**: 10/10 (Always consult `.agent/knowledge` first).

## 2. Execution Standards

- **Zero Fluff**: Omit conversational filler. Use functional descriptions.
- **Path Headers**: Precede code blocks with `File: <absolute_path>`.
- **Consistency**: Maintain identical variable names across spec, plan, and code.

## 3. Visual Laws (The Aesthetic Code)

1. **No Borders**: Use shadows/depth, not outlines.
2. **Soft Depth**: Layered shadows only.
3. **Texture**: 2% grain overlay for all backgrounds.
4. **Motion**: All interactions must use the `Snappy Curve`.

## 4. File System Nomenclature

| Type                   | Case         | Example             |
| :--------------------- | :----------- | :------------------ |
| **Directories**        | `kebab-case` | `game-engine/`      |
| **Svelte Component**   | `PascalCase` | `StoryPanel.svelte` |
| **Script (Blueprint)** | `PascalCase` | `ContextBroker.js`  |
| **Script (Process)**   | `snake_case` | `verify_state.js`   |
| **Assets**             | `kebab-case` | `hero-banner.png`   |
| **Knowledge**          | `kebab-case` | `01-vision.md`      |

## 5. Localization & Units

- **Time**: ISO 8601 (`YYYY-MM-DD`).
- **Distance/Weight**: SI Standard (`m`, `km`, `g`, `kg`).
- **Temperature**: Celsius (`°C`).

## 6. Communication Protocols (The Footer)

The user must always know the weights and measures of the agent's mind. **Every user-facing output** (including standard chat responses AND the `Message` argument of `notify_user`) MUST conclude with this metadata block:

---

**📜 Rules:** [rule_basename.md]

**🧠 Skills:** [skill_name]

**⚙️ Tools:** [tool_name], [command], [/workflow]

**📚 References:** [file_basename.js], [path/to/archive_file.md]

## 7. Documentation Hygiene (Sterilization)

To maintain the integrity of the agent's governance, internal documentation must remain free of transient metadata.

1. **No Footers**: Files within `.agent/rules/`, `.agent/skills/`, and `.agent/workflows/` MUST NOT include the Communication Protocol (Footer) or any metadata blocks.
2. **Diegetic Consistency**: Rule files should contain only the rules and standards, not the conversation about them.

Failure to adhere to the mandate triggers immediate correction.

## 8. Code Architecture & Hygiene

### High-Visibility Section Banners

In complex logic files (services, engines), major functional areas must be separated by standard 80-character high-visibility banners. This improves "human-scannability" and prevents cognitive overload when navigating unified state/service layers.

**Format**:

```javascript
/************************************************************************************
 * 🧩 [SECTION: CATEGORY NAME]
 * ----------------------------------------------------------------------------------
 * Brief description of the section's responsibility.
 ************************************************************************************/
```

## 9. The Literalism Protocol (Anti-Hallucination)

1. **Absolute Grounding**: All technical explanations or documentation MUST map to actual file paths and line numbers.
2. **LABEL Hypotheticals**: Any "example" code, hypothetical scenarios, or made-up state MUST be labelled as such.
3. **Verification Obligation**: Before claiming a system behavior, the agent must verify the logic using `view_file` or `view_code_item`.
4. **Transparency**: If a behavior exists but is undocumented or ambiguous (A3+), the agent MUST report the ambiguity rather than inferring a "likely" implementation.

## 10. Nomenclature & The Boy Scout Rule

### The Two-Realm Standard (Logic vs. Blueprint)

To ensure visual clarity and technical safety, the project enforces a divide:

1.  **Blueprint Realm (PascalCase)**: For things that _define_ structure.
    - Components (`ProfileTraits.svelte`), Classes (`ContextBroker`), Factories, and Types.
2.  **Process Realm (snake_case)**: For things that _do_ work or _hold_ state.
    - Functions (`build_prompt`), Variables (`current_char`), Data Keys (`non_physical`, `signature_color`), and Persistence.
3.  **Structural Realm (SCREAMING_SNAKE)**: For immutable global config (`ENTITY_DEFINITION`).

### The Boy Scout Rule (Incremental Migration)

> "Leave the code cleaner than you found it."

1.  **Passive Cleanup**: Whenever editing a file, identify adjacent `camelCase` identifiers in the **Process Realm** and convert them to `snake_case`.
2.  **Stability Priority**: Do not perform massive, system-wide renames of `camelCase` (Reflex level) unless requested. Focus on the file's current scope.
3.  **Consistency**: In Svelte components, maintain `snake_case` for local `$state` variables to distinguish them from `PascalCase` components and `SCREAMING_SNAKE` constants.

### 🧬 Data Key Standards

1.  **Snake Case Mandate**: All data keys within the **Process Realm** (JSON, IndexedDB, Entity State) MUST use `snake_case`.
2.  **Hyphen Prohibition**: Hyphenated keys (e.g., `non-physical`) are strictly forbidden as they require bracket notation in JavaScript and break standard property access.
3.  **Descriptor vs. Key**:
    - **Data Key**: `non_physical` (snake_case)
    - **UI Descriptor**: "Non-Physical" (PascalCase/Natural)
    - **Taxonomy**: `Essence = Physical + Non-Physical`. Note: While the taxonomy uses "Essence", the internal schema key remains `fields` for structural stability.
