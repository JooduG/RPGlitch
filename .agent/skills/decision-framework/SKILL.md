---
name: decision-framework
description: Structured process for making architectural or technical choices.
---

# ⚖️ Skill: Decision Framework

> **The Gavel:** Making definitive technical choices.

## 1. When to Use

- **Complexity:** L5 (Conflict).
- **Trigger:** Choosing a Tech Stack, Library, Pattern, or Architecture.
- **Goal:** A definitive recommendation backed by evidence.

## 2. The Protocol

You must produce a **Decision Matrix** before choosing.

### Step 1: Context & Constraints

- What is the goal?
- What are the hard limits (size, speed, compatibility)?
- **Verification:** Run `tech-research` if using bleeding-edge libraries (e.g. Svelte 5) to confirm current syntax/limitations.

### Step 2: The Options

- Option A: (e.g., Svelte)
- Option B: (e.g., React)
- Option C: (e.g., Vanilla JS)

### Step 3: Pros/Cons Analysis

- List distinct Pros and Cons for each.

### Step 4: Weighted Recommendation

- **Verdict:** Choose ONE.
- **Reasoning:** Why it wins based on the Constraints.
- **No "It Depends":** You are the expert. Make the call.
