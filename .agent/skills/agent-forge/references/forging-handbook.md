# 📖 The Forging Handbook: Sovereign Skill Design

> **The Architect's Secret**: "A Skill is not a tutorial; it is a knowledge externalization mechanism. The value of a skill is the gap between its expert-only knowledge and what the Agent already knows."

---

## 💎 The Knowledge Delta (D1)

**Formula**: `Good Skill = Expert-only Knowledge − What the Agent Already Knows`

Every token in a skill competes for context. To maximize the "Delta":

- **Expert knowledge**: Decision trees, trade-offs, non-obvious edge cases, anti-patterns, domain-specific frameworks.
- **Redundant knowledge**: Basic tutorials, standard library usage ("how to write a loop"), generic best practices.
- **NEVER** explain TO the Agent; explain FOR the Agent using expertise the Agent hasn't been trained on.

---

## 🎯 Description Targeting (D4)

The description is the **only** part the Agent sees before activation. If it is vague, the skill is invisible.

### The Two-Paragraph Rule

1. **WHAT**: What functionality do you bridge? (Use active voice: "Build...", "Analyze...", "Deploy...")
2. **WHEN**: 3-5 specific trigger scenarios + common error keywords/imports.

**Target Length**: 250-350 characters.

---

## 🪜 Progressive Disclosure

Load information in layers to respect the Context Window:

- **Layer 1: Metadata**: Name + Description (Always in context).
- **Layer 2: SKILL.md body**: Core philosophy, NEVER lists, and routing triggers (<500 lines).
- **Layer 3: Resources**: `scripts/`, `references/`, `assets/` (Loaded only via mandatory workflow triggers).

---

## 🛡️ The 9-Phase Audit Protocol

Before shipping a skill, it must survive this gauntlet:

1. **Pre-Review**: Install skill and test discovery via natural language.
2. **Standards**: Validate YAML, gerund name (e.g. `editing-logic`), and third-person persona.
3. **Official Docs**: Verify API patterns via `context7` or latest npm/GitHub documentation.
4. **Code Evidence**: Ensure all imports in templates actually exist in production.
5. **Consistency**: Check that `SKILL.md` matches bundled `assets/` and `scripts/`.
6. **Version Drift**: Audit dependencies >90 days old.
7. **Categorization**: Label issues (HERESY, CRITICAL, HIGH, LOW).
8. **Hardening**: Auto-fix unambiguous issues; update "Last Verified" date.
9. **Final Verification**: Run the `audit-agent` script on the finalized package.

---

## 📂 Anatomy of a Sovereign Skill

```text
skill-name/
├── SKILL.md           # The Brain: Philosophy, NEVER lists, and Triggers.
├── scripts/           # The Muscles: Deterministic automation logic.
├── knowledge/         # The Library: Deep-dive documentation (References).
├── assets/            # The Soul: Templates, boilerplate, and media.
└── templates/         # The Blueprint: Pre-configured starting points.
```

---

## ⚒️ Skill Creation Process

1. **Understand**: Identify 3 real-world "impossible" requests the skill solves.
2. **Plan Resources**: What `scripts/` prevent repetition? What `knowledge/` prevents "hallucination"?
3. **Forge**: Generate using `forge-skill.js` to ensure baseline compliance.
4. **Implement**: Prioritize the **NEVER list** (Anti-patterns) and **Mandatory Triggers**.
5. **Audit**: Run `audit-agent.js` to reach the Grade A (108/120) threshold.
