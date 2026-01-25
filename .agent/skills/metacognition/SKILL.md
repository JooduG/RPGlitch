---
name: metacognition
description: Self-correction protocol when feeling lost or confused.
---

# 🧠 Skill: Metacognition

> **The Mirror:** Checking your own reasoning.

## 1. When to Use

- **Trigger:** You feel "Lost", "Confused", or have made 3+ tool calls without progress.
- **Goal:** Stop hallucinating and reset.

## 2. The Protocol

1.  **STOP:** Do not call another tool yet.
2.  **Assess:**
    - "Am I assuming something that isn't true?"
    - "Did I misread the file?"
    - "Am I blindly following a failed plan?"
3.  **Confidence Score:** Rate your confidence (0-100%) in the current path.
4.  **Course Correction:**
    - If Confidence < 70%, return to `sequential-thinking` (L2).
    - If Confidence < 40%, ask the User for clarification.
