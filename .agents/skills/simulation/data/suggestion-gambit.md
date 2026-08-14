# 🎲 Unified Risk & Resolution Architecture

> **Role**: Reference Minigame, Risk & Resolution Mechanics for RPGlitch  
> **Source**: Chub Lorebook (`gambit.json`), D20 Stat Check Systems & Tarot Fate Branching  
> **Status**: Architectural Specification & Reference Implementation  

---

## 📋 Mechanical Hierarchy

The resolution framework operates across three distinct mechanical altitudes:

```text
[ Micro-Resolution ]  ──▶  D20 Stat Checks (Instantaneous point-in-time skill tests)
[ Macro-Resolution ]  ──▶  Gambit Engine (Multi-turn Blackjack push-your-luck sequences)
[ Meta-Resolution  ]  ──▶  Tarot Fate Branching (Macro-level 3-way narrative pivots)
```

---

## 1. D20 Stat Check Engine (Micro-Resolution)

Used for point-in-time checks tagged directly to high-stakes action choices or dynamic choice chips.

### Tagging Syntax & Mechanics

- **Action Tagging Convention**: `[STAT:DC] Action description` (e.g., `[DEX:12] Slip past the sentry`, `[CHA:15] Persuade the guard captain`).
- **Base Formula**: `d20 + stat_modifier` evaluated against `DC`.
- **Effortless Threshold**: If `stat_modifier ≥ DC + 6`, bypass dice checks and resolve automatically as an effortless success.
- **Success-with-a-Cost**: If the final roll total lands within 3 points below the DC (`total >= DC - 3`), grant a partial success where the primary goal is achieved, but a narrative or tactical complication is introduced.

### Standard Difficulty Ladder

| Difficulty Class | Target Range | Scope & Expectation |
| :--- | :---: | :--- |
| **Easy** | **8–10** | Routine baseline under mild pressure. |
| **Moderate** | **11–14** | Competent execution requiring training. |
| **Hard** | **15–18** | High-risk scenario demanding specialized mastery. |
| **Heroic** | **19–20** | Statistically improbable feat operating near human limits. |

### Reference Engine Implementation

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

## 2. Gambit Engine (Macro-Resolution)

A multi-turn Blackjack/push-your-luck state machine designed for pacing escalating tension across ongoing encounters.

```text
[ Start Scene ] ──▶ [ Deal 2 Cards (1–11) ] ──▶ [ Prompt Choice ]
                                                        │
         ┌────────────────── [DRAWS CARD] ──────────────┤
         │                                              │
         ▼                                              ▼
[ Add Card (1-11) ]                           [STAND] or [BUST]
         │                                              │
         └─────────────▶ [ Recalculate ] ──────────────▶ [ Final Narrative Tier ]
```

### Lifecycle & State Transitions

1. **Initialization**:
   - **Deal 2 cards**: Generate two random values between 1 and 11 upon scene trigger.
   - **Render roll feed**:

     ```text
     🎰 Rolling... {{random:1,2,3,4,5,6,7,8,9,10,11}}... drawn [X] card!
     🎰 Rolling... {{random:1,2,3,4,5,6,7,8,9,10,11}}... drawn [Y] card!
     ```
     
   - **Display score UI**: Output the cumulative total box.

2. **Mid-Sequence Interaction**:
   - Trigger token: `[DRAWS CARD]`.
   - **Roll next card**: Draw a single card value (`1–11`) and add it to the running sum.
   - **Update narrative context**: Reflect immediate physical/tactical feedback corresponding to the updated score tier.

3. **Sequence Conclusion**:
   - Trigger token: `[STAND]` or natural termination.
   - **Lock final score**: Match final total against narrative performance tiers.
   - **Purge interface**: Hide card UI during subsequent narrative beats until `[NEW ROUND]` is invoked.

### Performance Thresholds & Narrative Tiers

| Score Range | Tier Level | Visual Palette | Narrative Execution Tone |
| :--- | :---: | :---: | :--- |
| **21 Exactly** | 🌟 **PERFECT** | `#ffd700` → `#ffaa00` (Gold) | Peak transcendent performance; absolute harmony, flawless execution. |
| **18 – 20** | 🔥 **GREAT** | `#38ef7d` → `#11998e` (Emerald) | High synergy, effortless momentum, strong physical/tactical control. |
| **14 – 17** | 👍 **DECENT** | `#87ceeb` → `#5f9ea0` (Cyan) | Workable execution, stable rhythm, solid baseline delivery. |
| **10 – 13** | 😬 **MEDIOCRE** | `#ffa500` → `#ff8c00` (Orange) | Awkward rhythm, mismatched timing, distracted and uncoordinated outcomes. |
| **Below 10** | 😰 **WEAK** | `#ff6b6b` → `#ee5a5a` (Red-Orange) | Friction, failed cohesion, flat execution, complete detachment. |
| **Over 21** | 💥 **BUST** | `#ff0000` → `#990000` (Crimson) | Catastrophic failure; mechanical failure, physical collapse, or critical exposure. |

---

## 3. Tarot Fate Branching (Meta-Resolution)

A macro-level story structuring tool deployed at the climax of significant scenes to produce three distinct narrative trajectories based on archetype profiles:

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

### Prompt Choice Payload Example (`<choices>`)

```xml
<choices>
  <opt1>front-sun | 🜂 Knight of Wands | The Direct Assault | Step from the shadows and demand answers openly. | back-sun</opt1>
  <opt2>front-moon | 🜁 Seven of Swords | The Subterfuge | Slip through the drainage conduit unnoticed while the guard is distracted. | back-moon</opt2>
  <opt3>front-hanged | 🜄 Four of Cups | The Patient Vigil | Remain motionless behind the iron grate and wait for them to reveal their contact. | back-hanged</opt3>
</choices>
```

---

## 4. Entropy & The Chaos Seed Engine (1d100 Roll)

When environmental chaos, mechanical risks, or volatile actions occur outside discrete stat checks, resolve systemic friction via a `1d100` roll:

```text
[1d100 Roll] ──► 01–15: [BACKFIRE]  Critical failure, mechanical jamming, catastrophic external interruption.
             ──► 16–40: [FRICTION]  Awkward positioning, heavy resistance, severe stamina drain.
             ──► 41–75: [STANDARD]  Competent execution, normal kinetic flow, intended baseline effect.
             ──► 76–95: [VISCERAL]  High impact, deep somatic connection, decisive breakthrough.
             ──► 96–100:[SHATTER]   Lethal strike, permanent psychological break, irrevocable trajectory shift.
```

---

## 5. Operational Directives & Application Matrix

### System Directives

- **Enforce Deterministic Parity**: Scene narration must strictly align with mathematical tiers; do not soften busts or downplay criticals.
- **Maintain Roll Transparency**: Prepend action outcomes with visual rolling strings prior to showing final numerical totals.
- **Enforce Command Tokens**: When an encounter mode is active, require `[DRAWS CARD]` or `[STAND]` to progress the state machine.

### Gameplay Generalization

```text
               ┌──▶ Infiltration & Bypass (Threshold tracking vs. alarm trigger >21)
               ├──▶ Combat Momentum (Combo chains vs. counter-attack bust risks)
GAMBIT ENGINE  ├──▶ Social Interrogation (Escalating pressure vs. breakdown/walkout)
               ├──▶ Chaos Entropy Events (1d100 stochastic friction tests)
               ├──▶ Fractal Skill Tests (Point-in-time d20 checks under pressure)
               └──▶ Narrative Scene Pivots (Tarot-based 3-path branching anchors)
```
