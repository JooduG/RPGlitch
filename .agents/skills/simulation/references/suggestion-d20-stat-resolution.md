# Suggestion: D20 Micro-Resolution & Stat Check Engine

> **Status:** Backlog Proposal  
> **Domain:** Mechanical Resolution, Action Stakes & Skill Checks  
> **Scope:** `evaluate_stat_check` Engine, Difficulty Class (DC) Ladder, Partial Success (Success-with-a-Cost)  

---

## 1. Core Thesis

Narrative tension is enhanced when high-stakes user actions (lockpicking, persuasion, physical leaps) resolve through clear stochastic risk rather than purely deterministic AI prose.

This specification introduces a lightweight, pure functional **D20 Stat Check Engine** (`evaluate_stat_check`) that evaluates action chips against Difficulty Classes with explicit **success-with-a-cost** thresholds.

---

## 2. Mathematical Model & Syntax

### 2.1 Action Tag Syntax
- Format: `[STAT:DC] Action description`
- Examples:
  - `[AGI:12] Vault over the electrified security barrier`
  - `[CHA:15] Convince the investigator your credentials are authentic`

### 2.2 Resolution Formula
- **Base Roll:** `d20 + stat_modifier` vs `DC`.
- **Natural 20:** Critical Success (flawless outcome, no cost).
- **Natural 1:** Critical Failure (severe complication, total failure).
- **Standard Success:** `total >= DC` (intended outcome achieved cleanly).
- **Success-with-a-Cost (Partial):** `total >= DC - 3` (outcome achieved, but with a tactical cost, injury, or noise complication).
- **Failure:** `total < DC - 3` (action fails, situation escalates).

### 2.3 Difficulty Class (DC) Ladder

| Difficulty Class | Target Range | Narrative Scenario |
| :--- | :---: | :--- |
| **Easy** | **8–10** | Routine baseline under mild pressure. |
| **Moderate** | **11–14** | Competent execution requiring skill or focus. |
| **Hard** | **15–18** | High-risk scenario demanding specialized mastery. |
| **Heroic** | **19–20** | Statistically improbable feat operating near human limits. |

---

## 3. Pure Reference Implementation (`src/utils/dice.js`)

```javascript
/**
 * Evaluates a d20 stat check against a target difficulty class (DC).
 * Pure function with deterministic test injection.
 *
 * @param {number} stat_mod - Character attribute modifier
 * @param {number} dc - Target difficulty class
 * @param {number|null} [forced_roll=null] - Optional forced roll for unit tests (1-20)
 * @returns {{ outcome: "critical_success" | "success" | "partial" | "failure" | "critical_failure", roll: number, total: number, dc: number, cost_incurred: boolean }}
 */
export function evaluate_stat_check(stat_mod = 0, dc = 10, forced_roll = null) {
  const roll = forced_roll ?? Math.floor(Math.random() * 20) + 1;
  const total = roll + stat_mod;

  if (roll === 20) return { outcome: "critical_success", roll, total, dc, cost_incurred: false };
  if (roll === 1) return { outcome: "critical_failure", roll, total, dc, cost_incurred: true };
  if (total >= dc) return { outcome: "success", roll, total, dc, cost_incurred: false };
  if (total >= dc - 3) return { outcome: "partial", roll, total, dc, cost_incurred: true };
  return { outcome: "failure", roll, total, dc, cost_incurred: true };
}
```

---

## 4. Execution Pipeline Integration

1. **Shot 1 (Director)**:
   - Director evaluates player action tag, calculates `evaluate_stat_check`, and writes the mechanical outcome to `_thought_process`.
2. **Shot 2 (Character / Narrator)**:
   - System passes outcome (`success` / `partial` / `failure`) to prompt task, guiding prose delivery without exposing spreadsheet math.
