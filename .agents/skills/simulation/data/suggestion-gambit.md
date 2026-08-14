# 🎲 Suggestion: Gambit, Dice & Stat Check Mechanics

> **Role**: Reference Minigame & RPG Resolution Mechanics
> **Source**: `gambit.json` (Chub Lorebook) & D&D Stat Check Mechanics
> **Status**: Reference / Backlog Idea for Mini-game Dice & Risk Mechanics

---

## 1. Overview & Concept

A modular suite of deterministic and semi-randomized risk-reward resolution engines for RPGlitch:

1. **Gambit / Blackjack Push-Your-Luck Engine**: Card draws, rolling totals, threshold-based outcomes (`[DRAWS CARD]`, `[STAND]`).
2. **D&D-Style Stat Checks (`[STAT:DC]`)**: Optional difficulty tags on risky choices with d20 rolls, partial success (*success-with-a-cost*), and auto-pass thresholds.

---

## 2. D&D-Style Stat Checks (`[STAT:DC]`)

### Concept & Choice Tagging

The AI Director stamps difficulty tags on high-stakes user choices or suggested action chips (e.g. `[DEX:12] Slip past the sentry`, `[CHA:15] Persuade the guard captain`).

### Resolution Mechanics

- **Roll Formula**: `d20 + stat_modifier` vs `DC`.
- **Partial Success (Success-with-a-Cost)**:
  - If roll is within 3 of the DC (e.g. rolled 11 vs DC 13), narrate a *partial success*—the character succeeds at their goal, but incurs a tactical, physical, or narrative cost (e.g. unlocked the security door, but triggered a silent alert).
- **Don't-Roll Threshold**:
  - If `stat_modifier ≥ DC + 6`, automatically resolve as an effortless success without prompting a dice roll.
- **Standard DC Ladder**:
  - **8–10**: Easy / Routine under pressure.
  - **11–14**: Moderate / Requires training.
  - **15–18**: Hard / High stakes.
  - **19–20**: Near Impossible / Heroic feat.

### Pure Engine Signature (`src/engine/stats.js` or `src/utils/dice.js`)

```javascript
/**
 * Evaluates a d20 stat check against a difficulty class (DC).
 * @param {number} stat_val - The character's relevant attribute/modifier
 * @param {number} dc - Target difficulty class
 * @param {number} [roll_d20] - Optional forced roll for deterministic testing (1-20)
 * @returns {{ outcome: "critical_success" | "success" | "partial" | "failure" | "critical_failure", roll: number, total: number, dc: number, cost_incurred: boolean }}
 */
export function evaluate_stat_check(stat_val, dc, roll_d20 = null) {
  const roll = roll_d20 ?? Math.floor(Math.random() * 20) + 1;
  const total = roll + stat_val;

  if (roll === 20) return { outcome: "critical_success", roll, total, dc, cost_incurred: false };
  if (roll === 1) return { outcome: "critical_failure", roll, total, dc, cost_incurred: true };
  if (total >= dc) return { outcome: "success", roll, total, dc, cost_incurred: false };
  if (total >= dc - 3) return { outcome: "partial", roll, total, dc, cost_incurred: true };
  return { outcome: "failure", roll, total, dc, cost_incurred: true };
}
```

---

## 3. Gambit / Pounding Blackjack Minigame

### Initial Deal

When the scene begins, automatically deal the participant 2 random cards (values 1–11):

- Display rolling sequence:

  ```text
  🎰 Rolling... {{random:1,2,3,4,5,6,7,8,9,10,11}}... drawn [X] card!
  🎰 Rolling... {{random:1,2,3,4,5,6,7,8,9,10,11}}... drawn [Y] card!
  ```

- Render the current score box with the initial total.

### Mid-Scene Draws (`[DRAWS CARD]`)

When the user includes `[DRAWS CARD]` in their prompt:
1. Roll a new card (`1–11`).
2. Add the result to the running total.
3. Update and display the summary box.
4. Narrate consequences that strictly reflect the current performance tier.

### Scene Resolution (`[STAND]` or End of Action)

When the participant calls `[STAND]` or reaches completion:
1. Display the final result and performance tier.
2. The card display vanishes in subsequent messages until a new round begins.
3. `[NEW ROUND]` resets totals for a new sequence.

---

## 4. Performance Thresholds & Narrative Tiers

| Score | Tier | Visual Gradient | Narrative Tone |
| :--- | :--- | :--- | :--- |
| **21 Exactly** | 🌟 **PERFECT** | `#ffd700` → `#ffaa00` (Gold) | Peak transcendent performance. Absolute harmony, overwhelming sensory climax. |
| **18 – 20** | 🔥 **GREAT** | `#38ef7d` → `#11998e` (Emerald) | High chemistry, effortless rhythm, quaking physical intensity. |
| **14 – 17** | 👍 **DECENT** | `#87ceeb` → `#5f9ea0` (Cyan) | Solid execution, positive feedback, serviceable momentum. |
| **10 – 13** | 😬 **MEDIOCRE** | `#ffa500` → `#ff8c00` (Orange) | Awkward angle, mismatched rhythm, polite but distracted reactions. |
| **Below 10** | 😰 **WEAK** | `#ff6b6b` → `#ee5a5a` (Red-Orange) | Unfortunate timing, awkward friction, mentally disengaged. |
| **Over 21** | 💥 **BUST** | `#ff0000` → `#990000` (Crimson) | Catastrophic failure (loss of balance, cramp, clumsy slip, sudden interruption). Humiliating and disruptive. |

---

## 5. Fate Branching & Tarot Narrative Archetypes

At the conclusion of pivotal scenes or risk sequences, the Director compiles three divergent choice trajectories grounded in classic Tarot narrative dynamics:

```xml
<FATE_BRANCHING>
  <ARCHETYPE name="THE_STAR" theme="Hope / Revelation">A vulnerable path offering sudden clarity or emotional truth.</ARCHETYPE>
  <ARCHETYPE name="THE_TOWER" theme="Catastrophe / Rupture">A high-risk escalation that shatters the current status quo.</ARCHETYPE>
  <ARCHETYPE name="THE_DEVIL" theme="Temptation / Entanglement">A compromising shortcut with severe long-term costs.</ARCHETYPE>
  <ARCHETYPE name="THE_HANGED_MAN" theme="Sacrifice / Surrender">A tactical retreat or yielding of pride to gain leverage.</ARCHETYPE>
  <ARCHETYPE name="DEATH" theme="Transformation / Severance">An irrevocable closure or permanent severance of ties.</ARCHETYPE>
  <ARCHETYPE name="THE_SUN" theme="Triumph / Exposure">A bold, high-visibility gamble driven by raw confidence.</ARCHETYPE>
  <ARCHETYPE name="THE_WORLD" theme="Mastery / Integration">A calculated maneuver resolving multiple narrative threads.</ARCHETYPE>
  <ARCHETYPE name="JUDGEMENT" theme="Reckoning / Truth">A direct confrontation demanding accountability for past actions.</ARCHETYPE>
  <ARCHETYPE name="THE_MOON" theme="Illusion / Paranoia">A shadowy, deceptive move operating in uncertainty.</ARCHETYPE>
  <ARCHETYPE name="TEMPERANCE" theme="Balance / Negotiation">A patient, de-escalating diplomatic maneuver.</ARCHETYPE>
</FATE_BRANCHING>
```

---

## 6. Enforcement & Prompt Rules

- **Deterministic Results**: Output narration quality must strictly match the calculated numerical tier — no ignoring low scores or busts.
- **Rolling Visibility**: Always show the roll animation text prior to revealing the card or dice value.
- **Strict Move Requirement**: If a scene is designated under gambling mechanics, user actions must include `[DRAWS CARD]` or `[STAND]` to proceed.

---

## 7. Generalization in RPGlitch

While originally formulated for intimate or gambling scenes, the underlying Blackjack/push-your-luck, Stat Check, and Tarot Branching algorithms generalize to:
- **Lockpicking / Infiltration**: Drawing security bypasses until threshold or alarm trip (>21).
- **Combat Combos**: Chaining attacks for momentum multipliers vs. risking a counterattack bust.
- **Interrogation & Social Bluffing**: Pushing high-stakes questioning before a suspect walks out or lashes out.
- **Tactical Skill Checks**: Rolling d20 stat challenges during exploratory fractal choices.
- **Dramatic Fate Branching**: Providing 3 highly divergent choice chips at the end of crucial narrative turns.
