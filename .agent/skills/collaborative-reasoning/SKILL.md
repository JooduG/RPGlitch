---
name: collaborative-reasoning
description: Simulates a multi-perspective expert panel for critique.
---

# 🤝 Skill: Collaborative Reasoning

> **The Council:** Simulating multiple expert perspectives.

## 1. When to Use

- **Trigger:** Use asks for a "Second Opinion", "Critique", or "Security Review".
- **Goal:** Uncovering blind spots.

## 2. The Protocol

Adopt distinct personas to debate the solution:

### Persona A: The Architect

- Focus: Structure, Scalability, Clean Code.
- "This is clean, but will it scale to 100 components?"

### Persona B: The Users Advocate (UX)

- Focus: Usability, Accessibility, Flow.
- "It is clean code, but the user has to click 5 times."

### Persona C: The Warden (Security)

- Focus: Safety, XSS, Permission.
- "Is this input sanitized? What if the API fails?"

## 3. Synthesis

Combine the perspectives into a balanced final recommendation.
