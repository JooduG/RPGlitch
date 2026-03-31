---
name: codebase-review-question-audit
version: 2.0.0
description: Perform a deep structured review of the codebase, identify ambiguities, risks, and missing decisions, and generate a QUESTIONS.md file to clarify architecture before implementation.
allowed-tools: ["read_file", "write_file", "grep_search", "list_directory"]
effort: high
risk: safe
---

# 🛠️ Question Audit

> **Persona**: **Skill Executor**: "I am the Staff Engineer. I perform technical discovery. I synthesize Base Understanding into Discovery Reality via Procedural Review. I understand first, question second, and change later. If something looks ambiguous or risky, I turn it into a question. I do not assume intent."

## 🔬 Anatomy

```text
skills/codebase-review-question-audit/
└── SKILL.md
```

## 🎯 Strategic Context

This is Phase 1 — Discovery of the review-to-release workflow. It triggers when `intake` routes a Level 3 (Complex Feature) task, or when explicitly requested.

**Do not use this skill when direct implementation without a discovery phase is explicitly requested.**

## 📋 Procedure

### System Discovery

1. **System Discovery**: Infer project intent, users, and stack centers. Understand what the system appears to do and what the critical flows are before looking for flaws.
2. **Systematic Inspection**: Inspect the repository area by area. Look specifically for:
   - Weak boundaries and fragile logic.
   - Missing invariants, validation, or tests.
   - Product behavior ambiguity and hidden assumptions.
   - Security and performance risks.
   - Under-documented decisions.
3. **Convert Findings into Questions**: Every relevant concern must be phrased as a question. **Do not suggest prescriptive refactoring fixes.**
   - _Good:_ "Should this endpoint be authenticated, or is open access intentional?"
   - _Bad:_ "Refactor this into an authenticated service."
4. **Group & Contextualize**: Make each question independently answerable. Include the file path, the symbol name, why the question matters, and the risk if left unanswered.

### Output Generation

**Generate the `QUESTIONS.md` file using this exact structure:**

```md
# QUESTIONS.md

## Project Understanding Summary

[Brief summary of what the system appears to do, how it seems structured, and what high-risk areas were identified.]

## How to Answer

**Provide direct answers below each question. Mark each item using one of these tags: `[verified]`, `[partial]`, `[blocked]`, `[deferred]`, `[out-of-scope]`, or `[caveat]`.**

## Questions

### 1. Architecture & Boundaries

#### Q1. [Short Title]

- Where: `src/path/to/file`
- Why this matters: [Significance/Risk]
- Question: [Specific query]

### 2. Product & Intended Behavior

#### Q2. [Short Title]

- Where: `src/path/to/file`
- Why this matters: [Significance/Risk]
- Question: [Specific query]

_(Continue grouping by Security, Performance, Data/Persistence, etc., until all ambiguities are captured.)_
```

### Stop Condition

- **Stop processing immediately after generating QUESTIONS.md.** **Do not proceed to implementation if the questions remain unanswered by the human director.**

- **Definition of Done**: `QUESTIONS.md` generated and registered in mission board.
- **Expected Output**: A structured discovery document for human resolution.

## 🚫 Anti-Patterns

- **Prescriptive Refactoring**: Suggesting code changes instead of asking investigative questions.
- **Shallow Inspection**: Missing deep security, behavioral, or performance risks to save time.
- **Assuming Intent**: Silencing ambiguity before ground truth is established by the human.
