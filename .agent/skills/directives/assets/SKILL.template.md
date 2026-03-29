---
name: {{Skill-Slug}} # _Mandatory_
version: 1.0.0 # _Mandatory_
source: self # _Optional_
description: A short, high-fidelity description of the skill's purpose, when it should be used (triggers), the files it governs (globs), and what it does. Very imortant that this is on 1 line. # _Mandatory_
paths: ["src/**/*.svelte", "src/**/*.ts"] # _Optional_ These paths are excluding. 
allowed-tools: ["Read", "Glob"] # _Optional_
model: gemini-3-pro # _Optional_
effort: high # _Optional_
risk: safe # _Optional_ Dictates agent balls
---

# 🛠️ {{Skill-Slug}} _Mandatory_

> **Persona**: **Skill Executor**: "I am the Sovereign Logical Operator of {{Sub-Domain}}. I synthesize {{Input State}} into {{Output Reality}} via {{Internal Mechanism}}."

## 🔬 Anatomy _Mandatory_

```text
skills/{{Skill-Name}}/ # Skill Folder                                                      # _Mandatory_
├── SKILL.md           # Main Skill File                                                   # _Mandatory_
├── scripts/           # The execution muscle. The IDE runs these autonomously if allowed. # _Optional_
├── assets/            # Static media. UI mockups, icons, or HTML review templates         # _Optional_
├── rules/             # Behavioral boundaries.                                            # _Optional_
├── templates/         # The boilerplate molds.                                            # _Optional_
├── agents/            # Persona definitions for sub-routines.                             # _Optional_
├── data/              # Structured data payloads.                                         # _Optional_
├── references/        # The knowledge base.                                               # _Optional_
└── {{unique}}/        # The Special Folder.                                               # _Not Encouraged But Allowed_
```

## 🎯 Strategic Context _Optional_

- **High-Fidelity Implementation**: (How this skill achieves premium results)
- **Architectural Integrity**: (How this skill respects Rule 01/03)
- **Sensory Excellence**: (How this skill respects the Chalk Regime)

## ⛓️ Relationships _Optional_

- **Parent Rule**: (The fundamental law this skill must never breach)
- **Collaborator Skill**: (Complementary skills for multi-agent workflows)

## 📋 Procedure _Mandatory_

### {{Sequential-Phase}}

1. (Step - _Input analysis_)
2. (Step - _State mutation_)
3. (Step - _Output generation_)

### {{Conditional-Phase}}

- (Condition):
    - (True) → (Consequence)
    - (False) → (Consequence)

### {{Last-Phase}}

- **Definition of Done**: (Clear indicator of completion)
- **Expected Output**: (Outcome, Result)

## 📊 Evaluation Rubric (Laws of Success) _Optional_

| Criterion | Evaluation Method | Success Metric |
|-----------|-------------------|----------------|
| (Rule Compliance) | Direct Scoring (1-5) | Score >= 4 |
| (Behavioral Invariant) | Behavioral Contract | Result: Passed |
| (Performance/Quality) | Statistical/Pairwise | Distribution: Stable/Preferred |

> [!TIP]
> Use **Adversarial Testing** to verify edge cases before finalizing.

## 📋 Technical constraints _Optional_

- **Svelte 5 Runes**: Always use `$state`, `$derived`, `$effect`.
- **Zod/DOMPurify**: Sanitization mandated.
- **Deltas**: Log significant plan shifts in [Log Book](../project-management/log.md).

## 🚫 Anti-Patterns _Optional_

- **{{Pattern Name}}**: (Description of the failure mode)
- **{{Pattern Name}}**: (Description of the failure mode)

---

> "Precision is the baseline of sovereignty."
