# 📄 Agent Skills: Format Specification

> **Definition:** Agent Skills are a lightweight, open format for extending AI agent capabilities with specialized knowledge and workflows.

## 1. Directory Structure

A skill is a directory containing at minimum a `SKILL.md` file:

```text
skill-name/
└── SKILL.md          # Required: instructions + metadata
├── scripts/          # Optional: executable code
├── references/       # Optional: documentation
└── assets/           # Optional: templates, resources
```

## 2. The SKILL.md Format

The `SKILL.md` file must contain YAML frontmatter followed by Markdown content.

### Frontmatter Fields

| Field           | Required | Constraints                                                                                                                                                         |
| --------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`          | Yes      | Max 64 characters. Kebab-case only. Must match directory name.                                                                                                      |
| `description`   | Yes      | Max 1024 characters. **MANDATORY**: Must include semantic keywords (Triggers) and clear "When to use" scenarios to ensure discovery during initial intent analysis. |
| `license`       | No       | Name or reference to a bundled license file.                                                                                                                        |
| `compatibility` | No       | Max 500 characters. Indicates environment requirements.                                                                                                             |
| `metadata`      | No       | Arbitrary key-value mapping.                                                                                                                                        |
| `allowed-tools` | No       | Space-delimited list of pre-approved tools (Experimental).                                                                                                          |

## 3. Progressive Disclosure

Skills use a 3-layer loading mechanism to manage context efficiently:

1. **Discovery (~100 tokens)**: Agents load only `name` and `description` at startup.
2. **Activation (< 5000 tokens)**: The full `SKILL.md` body is loaded when the skill is relevant.
3. **Execution (as needed)**: Scripts, references, or assets are loaded only when required.

## 4. Best Practices

- **Keep it Slim**: Main `SKILL.md` should be under 500 lines.
- **Reference Deeply**: Move technical details to `references/` or `assets/`.
- **Instructional Focus**: Use step-by-step instructions, examples of inputs/outputs, and common edge cases.
- **Trigger Saturation**: The frontmatter `description` is the primary discovery mechanism. Saturate it with synonyms and specific tasks (e.g., instead of "Testing", use "Unit testing, integration testing, linting, security audits").
