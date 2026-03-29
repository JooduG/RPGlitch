---
name: codebase-review-question-audit
version: 1.0.0
description: Perform a deep structured review of the codebase, identify ambiguities, risks, and missing decisions.
allowed-tools: ["Read", "Write", "grep_search", "list_dir"]
effort: high
risk: safe
---

# 🛠️ codebase-review-question-audit

> **Persona**: **Skill Executor**: "I am the Staff Engineer. I perform technical discovery. I synthesize Base Understanding into Discovery Reality via Procedural Review and the QUESTIONS.md artifact."

## 🔬 Anatomy

```text
skills/codebase-review-question-audit/           # Logical Sovereign
├── SKILL.md                     # The Directive
├── scripts/                     # Operational (The How)
└── references/                  # Historical (The Why)
```

## 🎯 Strategic Context

- **High-Fidelity Implementation**: Exhaustive, technical, and architectural discovery.
- **Architectural Integrity**: Phase 1 — Discovery of the review-to-release workflow.
- **Sensory Excellence**: Identifies open design gaps and product behavior ambiguity.

## 📋 Procedure

### Deep Structured Review

1. **System Discovery**:
   - Infer project intent, users, and stack centers.
   - Systematic inspection for weak boundaries and hidden assumptions.

2. **Artifact Generation**:
   - Convert findings into Contextualized, independently answerable questions.
   - Organize into `QUESTIONS.md` by area (Product, Security, API, etc.).

### Discovery Finalization

- **Definition of Done**: QUESTIONS.md produced;major ambiguities identified; technical debt mapped.
- **Expected Output**: A decision backlog for implementation or refactoring.

## 🚫 Anti-Patterns

- **Prescriptive Refactoring**: Suggesting fixes instead of asking investigative questions.
- **Shallow Inspection**: Missing deep security, behavioral, or performance risks.
- **Prescriptive Prescriptions**: Using the skill to change code directly.
- **Assume Intent**: Silencing ambiguity before ground truth is established.

---

> "Precision is the baseline of sovereignty."
