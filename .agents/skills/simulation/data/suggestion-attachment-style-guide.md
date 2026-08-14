# Attachment Style → Dynamics Baseline Guide

This is a design reference, not runtime code. Use it when designing characters to decide what `dynamics_baseline` values to set and how Bayesian belief priors govern their goal hierarchies.

---

## The Four Attachment Styles

Attachment theory (Bowlby/Ainsworth) describes how early relational patterns shape adult emotional regulation. In RPGlitch, these patterns map to **dynamics_baseline** — the gravitational center that `settle_physics()` pulls dynamics back toward after the Director applies mutations.

If you don't set a `dynamics_baseline`, all axes default to 50 (neutral). Setting one gives a character a "home" they drift back to.

---

## Preset Values

| Style | chaos | intensity | openness | affinity |
| :--- | :--- | :--- | :--- | :--- |
| **secure** | 30 | 40 | 70 | 65 |
| **anxious** | 55 | 70 | 80 | 75 |
| **avoidant** | 35 | 45 | 20 | 25 |
| **disorganized** | 75 | 65 | 50 | 40 |

---

## What Each Axis Means

- **chaos** — Randomness vs Control. High = scattered, impulsive. Low = measured, deliberate.
- **intensity** — Internal Energy / Adrenaline. High = wired, urgent. Low = flat, depleted.
- **openness** — Receptivity vs Guardedness. High = open to influence, porous. Low = walled off, suspicious.
- **affinity** — Inter-Entity Bond / Empathy. High = drawn toward the other person. Low = distant, cold.

---

## How Each Style Behaves Over Time

### Secure (chaos 30, intensity 40, openness 70, affinity 65)

The character starts grounded and warm. When the Director pushes dynamics away (e.g. a threat spikes chaos to 60), the physics engine gradually pulls chaos back toward 30 over subsequent turns. The character _naturally recovers_ stability. Openness stays high — they remain receptive even after conflict. This is your "well-adjusted" baseline.

**Best for:** Characters who can hold their own in a scene without spiraling. They react to events but bounce back.

### Anxious (chaos 55, intensity 70, openness 80, affinity 75)

The character runs hot — high intensity, high openness, high affinity. They're hyper-vigilant to connection signals and prone to emotional flooding (intensity 70 + chaos 55). After a positive interaction, affinity pulls them _even closer_ (baseline 75). After a negative one, chaos spikes but they can't wall off (openness baseline 80 keeps pulling them back to being open). They oscillate between clinging and panic.

**Best for:** Characters whose drama comes from over-investment. They can't help caring too much, even when it hurts them.

### Avoidant (chaos 35, intensity 45, openness 20, affinity 25)

The character runs cool and walled. If a scene forces openness up (e.g. the Director pushes +20), `settle_physics()` will gradually drag it back toward 20. They _can't stay open_ — their baseline resists it. Affinity at 25 means even after bonding moments, they drift back to emotional distance. Low intensity (45) means they won't get too energized by conflict. They withdraw.

**Best for:** Characters whose tension comes from refusing connection. The system enforces their walls — the user has to actively fight against the gravity to get through.

### Disorganized (chaos 75, intensity 65, openness 50, affinity 40)

The most volatile pattern. Chaos at 75 means the physics engine itself is unstable — `settle_physics()` adds variance proportional to world entropy, and with chaos this high, the character's internal state is noisy. They oscillate between approach (openness 50 is neutral) and withdrawal (affinity 40 is low). Intensity at 65 means they're energized but not consistently. This is the "I want connection but I destroy it when I get it" pattern.

**Best for:** Characters whose unpredictability is the drama. The system makes them genuinely unstable — their dynamics won't settle cleanly.

---

## Bayesian Attachment Priors & Belief States

Characters do not hold static trust scores. In advanced Bayesian psychological modeling, their baseline expectations are governed by a belief system seeded by their **Attachment Style**:

- **Secure Attachment**: Sets balanced priors that favor safety and trust:
  - $P(H_{Trustworthy}) \approx 0.60$
  - $P(H_{Untrustworthy}) \approx 0.10$
- **Anxious Attachment**: Sets high priors for abandonment and rejection:
  - $P(P\_Will\_Abandon) \approx 0.85$
  - $P(P\_Genuine\_Care) \approx 0.25$
- **Avoidant Attachment**: Sets low priors for vulnerability and high priors for hidden agendas:
  - $P(P\_Safe\_Vulnerable) \approx 0.15$
  - $P(P\_Hidden\_Agenda) \approx 0.70$
- **Disorganized Attachment**: Characterized by high entropy (uncertainty) and conflicting priors across all domains.

---

## Goal Arbitration Formula

Goal priority is dynamically recalculated using the current posterior probabilities of core beliefs:

$$\text{Goal Priority}(G) = \text{Base Weight}(G) \times \sum (P(H_i) \times w_i)$$

### Example Calculation

$$\text{Priority}(G\_Avoid\_Vulnerability) = 8 \times P(P\_Will\_Abandon) \times P(P\_Hidden\_Agenda)$$

A sharp rise in abandonment probability instantly shifts the entire goal hierarchy, forcing avoidant behaviors to override connection drives.

---

## How to Use This

1. Pick an attachment style for your character based on their psychology
2. Set the `dynamics_baseline` on the entity to the preset values above (or adjust them — these are starting points)
3. The physics engine will automatically pull dynamics toward these baselines each turn after Director mutations

```json
{
  "dynamics": { "chaos": 55, "intensity": 70, "openness": 80, "affinity": 75 },
  "dynamics_baseline": { "chaos": 55, "intensity": 70, "openness": 80, "affinity": 75 }
}
```

Set `dynamics` to the same values as `dynamics_baseline` for a character who starts in their natural state. Or set `dynamics` differently to start them in a displaced state (e.g. an avoidant character forced into high openness by circumstances — they'll start open but drift back to closed over time).

---

## Inferring Style From Dynamics

If you have a character with existing dynamics but no baseline, you can infer which style fits:

- `openness < 35` + `affinity < 35` → **avoidant**
- `openness > 65` + (`intensity > 60` or `affinity > 60`) → **anxious**
- `openness > 65` + `chaos < 45` → **secure**
- `chaos > 65` → **disorganized**

This is just a heuristic — use your judgment. The character's eternal/non_physical description should align with whatever baseline you choose.
