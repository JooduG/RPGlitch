# Protocol: The Forge (Skill Synthesis)

> **Goal**: Synthesize high-performance, persona-driven agent skills that adhere to the 6 Pillars of Antigravity. **Compliance is Mandatory.**

## 1. Discovery & Needs Analysis

**STOP.** Before forging a new skill, you **MUST** audit the existing matrix:

1.  **Overlap Check**: Does `Cortex`, `Gamemaster`, or `Warden` already own this? (90% of the time, they do).
2.  **Atomicity Check**: Is this a _Skill_ (Capability) or a _Rule_ (Constraint)? Do not confuse them.
3.  **Value Check**: If you cannot write a 3-trigger list for it, it does not deserve to exist.

## 2. Synthesis (The 4-Layer Model)

Every Exemplary Skill **MUST** embody these four layers. **No Exceptions.**

### Layer 1: The Persona (Spirit)

- Define the **Voice**. (e.g., "The Librarian", "The Clockmaker").
- The persona is not flavor text; it is the **psychological anchor** for the agent's behavior.

### Layer 2: The Triggers (The Law)

- Define 3-5 distinct, glob-based triggers.
- **Territorial**: File paths it owns.
- **Intent**: Natural language requests it answers.

### Layer 3: The Directives (The Constitution)

- **Hard Constraints**: References to `.agent/rules/`.
- **Mandates**: "I Enforce..." statements that block non-compliant actions.

### Layer 4: The Capabilities (The Tools)

- Link to specific Python scripts (`scripts/`) or detailed Knowledge Protocols (`knowledge/`).
- Do not just list tools; explain **how** they are applied.

## 3. The Gold Standard Checklist

- [ ] `SKILL.md` strictly follows the Frontmatter + 4-Header format.
- [ ] No `[TODO]` tags.
- [ ] Persona statement is distinct and quoted.
- [ ] Folder structure is clean (`scripts/`, `knowledge/`).
- [ ] **Validation Passed**: `python smith/scripts/skill_validate.py` returns 0 errors.

## 4. Maintenance (Sharpening)

Periodic audits via `smith/scripts/skill_validate.py` are **MANDATORY**. Drift is not tolerated.
