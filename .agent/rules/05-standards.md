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

| Type                 | Case         | Example             |
| :------------------- | :----------- | :------------------ |
| **Directories**      | `kebab-case` | `game-engine/`      |
| **Svelte Component** | `PascalCase` | `StoryPanel.svelte` |
| **Scripts**          | `snake_case` | `verify_state.js`   |
| **Assets**           | `kebab-case` | `hero-banner.png`   |
| **Knowledge**        | `kebab-case` | `01-vision.md`      |

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
