# Suggestion: Gambit & D20 Stochastic Resolution Engine

> **Status:** Architectural Proposal / Backlog Reference  
> **Domain:** Mechanical Resolution, Skill Checks & Risk Mechanics  
> **Scope:** Micro D20 Stat Checks, Macro 21-Target Blackjack State Machine, 1d100 Chaos Entropy  

---

## 1. Executive Summary

This specification formalizes the two primary mechanical resolution tiers for RPGlitch:
1. **D20 Stat Check Engine (Micro-Resolution):** Point-in-time skill checks tagged to high-stakes action chips with success-with-a-cost thresholds.
2. **Gambit Push-Your-Luck Engine (Macro-Resolution):** A multi-turn Blackjack state machine (target 21) designed to pace escalating tension across sustained encounters.
3. **Entropy & The Chaos Seed Engine (1d100):** Stochastic resolution for environmental volatility and friction.

---

## 2. D20 Stat Check Engine (Micro-Resolution)

### 2.1 Syntax & Formula
- **Tagging Convention:** `[STAT:DC] Action description` (e.g., `[DEX:12] Slip past the sentry`).
- **Base Formula:** `d20 + stat_modifier` evaluated against `DC`.
- **Effortless Threshold:** If `stat_modifier ≥ DC + 6`, bypass rolling and resolve as an automatic effortless success.
- **Success-with-a-Cost:** If the total lands within 3 points below the DC (`total >= DC - 3`), grant partial success with a tactical complication.

### 2.2 Difficulty Ladder

| Difficulty Class | Target Range | Expectation |
| :--- | :---: | :--- |
| **Easy** | **8–10** | Routine baseline under mild pressure. |
| **Moderate** | **11–14** | Competent execution requiring training. |
| **Hard** | **15–18** | High-risk scenario demanding specialized mastery. |
| **Heroic** | **19–20** | Statistically improbable feat operating near human limits. |

### 2.3 Reference Implementation

```javascript
/**
 * Evaluates a d20 stat check against a difficulty class (DC).
 * @param {number} stat_val - Character's attribute modifier
 * @param {number} dc - Target difficulty class
 * @param {number} [forced_roll] - Optional forced roll for testing (1-20)
 * @returns {{ outcome: string, roll: number, total: number, dc: number, cost_incurred: boolean }}
 */
export function evaluate_stat_check(stat_val, dc, forced_roll = null) {
  const roll = forced_roll ?? Math.floor(Math.random() * 20) + 1;
  const total = roll + stat_val;

  if (roll === 20) return { outcome: "critical_success", roll, total, dc, cost_incurred: false };
  if (roll === 1) return { outcome: "critical_failure", roll, total, dc, cost_incurred: true };
  if (total >= dc) return { outcome: "success", roll, total, dc, cost_incurred: false };
  if (total >= dc - 3) return { outcome: "partial", roll, total, dc, cost_incurred: true };
  return { outcome: "failure", roll, total, dc, cost_incurred: true };
}
```

---

## 3. Gambit Engine (Macro-Resolution: Target 21)

A multi-turn push-your-luck state machine:

```text
[ Start Scene ] ──► [ Deal 2 Cards (1–11) ] ──► [ Prompt Choice ]
                                                        │
         ┌────────────────── [DRAWS CARD] ──────────────┤
         │                                              │
         ▼                                              ▼
[ Add Card (1-11) ]                           [STAND] or [BUST]
         │                                              │
         └─────────────► [ Recalculate ] ──────────────► [ Final Narrative Tier ]
```

### Performance Thresholds & Narrative Tiers

| Score Range | Tier Level | Visual Palette | Narrative Execution Tone |
| :--- | :---: | :---: | :--- |
| **21 Exactly** | 🌟 **PERFECT** | `#ffd700` → `#ffaa00` (Gold) | Peak transcendent performance; absolute harmony, flawless execution. |
| **18 – 20** | 🔥 **GREAT** | `#38ef7d` → `#11998e` (Emerald) | High synergy, effortless momentum, strong physical/tactical control. |
| **14 – 17** | 👍 **DECENT** | `#87ceeb` → `#5f9ea0` (Cyan) | Workable execution, stable rhythm, solid baseline delivery. |
| **10 – 13** | 😬 **MEDIOCRE** | `#ffa500` → `#ff8c00` (Orange) | Awkward rhythm, mismatched timing, distracted outcomes. |
| **Below 10** | 😰 **WEAK** | `#ff6b6b` → `#ee5a5a` (Red-Orange) | Heavy friction, failed cohesion, complete detachment. |
| **Over 21** | 💥 **BUST** | `#ff0000` → `#990000` (Crimson) | Catastrophic failure; mechanical failure, physical collapse, or critical exposure. |

---

## 4. Entropy & The Chaos Seed Engine (1d100 Roll)

```text
[1d100 Roll] ──► 01–15: [BACKFIRE]  Critical failure, mechanical jamming, catastrophic external interruption.
             ──► 16–40: [FRICTION]  Awkward positioning, heavy resistance, severe stamina drain.
             ──► 41–75: [STANDARD]  Competent execution, normal kinetic flow, intended baseline effect.
             ──► 76–95: [VISCERAL]  High impact, deep somatic connection, decisive breakthrough.
             ──► 96–100:[SHATTER]   Lethal strike, permanent psychological break, irrevocable trajectory shift.
```
