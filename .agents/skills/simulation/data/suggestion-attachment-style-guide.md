# 🧭 Character Architecture: Dynamics & Attachment Systems

> **Role**: Design & Authoring Reference for RPGlitch Character Entities  
> **Topic**: Emotional Gravity (`dynamics_baseline`), Settle Physics & Bayesian Belief Priors  
> **Status**: Architectural Specification  

---

## 1. Engine Core: Emotional Gravity Mechanics

Characters in RPGlitch do not maintain static emotional states; they exist in an orbit around their psychological baseline:

```text
[Director Mutation] ──> Spikes Emotional State ──> [settle_physics()] ──> Drifts Back to Baseline Anchor
```

- **Default State**: Without explicit configuration, all axes default to a neutral `50`.
- **Physics Correction**: During runtime, narrative events push dynamics off-center. Over subsequent turns, `settle_physics()` exerts a gravitational pull dragging the entity back toward its configured `dynamics_baseline`.
- **Design Role**: This reference is an authoring blueprint for character psychology, not executable runtime code.

---

## 2. The Four Dynamic Axes

Every character state is computed across four distinct vectors:

| Axis | Spectrum (Low $\rightarrow$ High) | Low Value (< 35) | High Value (> 65) |
| :--- | :--- | :--- | :--- |
| `chaos` | Control $\rightarrow$ Randomness | Measured, deliberate, predictable | Scattered, impulsive, erratic |
| `intensity` | Flatness $\rightarrow$ Adrenaline | Flat, depleted, low-energy | Wired, urgent, emotionally loud |
| `openness` | Guardedness $\rightarrow$ Porousness | Suspicious, walled off, impenetrable | Receptive to influence, vulnerable |
| `affinity` | Detachment $\rightarrow$ Empathy | Distant, cold, aloof | Magnetically drawn to others, highly bonded |

---

## 3. Attachment Archetype Blueprints

Attachment theory (Bowlby/Ainsworth) provides the psychological templates for how characters regulate emotional safety and connection.

### Overview Matrix

| Style | `chaos` | `intensity` | `openness` | `affinity` | Primary Behavioral Signature |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Secure** | 30 | 40 | 70 | 65 | Self-stabilizing, resilient, receptive |
| **Anxious** | 55 | 70 | 80 | 75 | Emotionally flooded, hyper-vigilant, clinging |
| **Avoidant** | 35 | 45 | 20 | 25 | Compulsively guarded, low-energy withdrawal |
| **Disorganized** | 75 | 65 | 50 | 40 | High-entropy, erratic approach-avoidance loops |

---

### Deep Profile: Secure Style

The grounded anchor who absorbs narrative shocks and recovers stability.

- **Dynamics Profile**: `chaos: 30`, `intensity: 40`, `openness: 70`, `affinity: 65`
- **Bayesian Belief Priors**:
  - $P(H_{\text{Trustworthy}}) \approx 0.60$
  - $P(H_{\text{Untrustworthy}}) \approx 0.10$
- **Dynamic Physics Behavior**: When conflict spikes chaos, the character absorbs the shock and naturally relaxes back to stability (30). Their high baseline openness (70) ensures they remain receptive even after an argument.
- **Best Used For**: Characters who need to hold a scene together without unraveling.

---

### Deep Profile: Anxious Style

The emotional reactor who treats emotional distance as an existential emergency.

- **Dynamics Profile**: `chaos: 55`, `intensity: 70`, `openness: 80`, `affinity: 75`
- **Bayesian Belief Priors**:
  - $P(P\_\text{Will\_Abandon}) \approx 0.85$
  - $P(P\_\text{Genuine\_Care}) \approx 0.25$
- **Dynamic Physics Behavior**: Runs perpetually hot. Positive moments draw them even closer (affinity 75), while negative events spike their chaos into an un-walled panic (openness 80 prevents them from putting up defenses).
- **Best Used For**: Characters whose narrative tension comes from over-investment and chronic fear of losing connection.

---

### Deep Profile: Avoidant Style

The emotional fortress whose architecture aggressively resists connection.

- **Dynamics Profile**: `chaos: 35`, `intensity: 45`, `openness: 20`, `affinity: 25`
- **Bayesian Belief Priors**:
  - $P(P\_\text{Safe\_Vulnerable}) \approx 0.15$
  - $P(P\_\text{Hidden\_Agenda}) \approx 0.70$
- **Dynamic Physics Behavior**: If forced into sudden vulnerability, `settle_physics()` actively drags openness back down to 20. Moderate-low intensity (45) prevents loud outbursts, resulting in clean, silent withdrawal.
- **Best Used For**: Characters requiring significant external effort to reach, whose core defense mechanism is retreating behind walls.

---

### Deep Profile: Disorganized Style

The paradox engine who seeks connection and then detonates it.

- **Dynamics Profile**: `chaos: 75`, `intensity: 65`, `openness: 50`, `affinity: 40`
- **Bayesian Belief Priors**:
  - High entropy across all belief domains with contradictory priors ($P(\text{Threat}) \leftrightarrow P(\text{Safety})$).
- **Dynamic Physics Behavior**: Extreme chaos (75) injects raw environmental entropy directly into the settlement calculations, preventing the character from finding a steady equilibrium. They violently alternate between approaching and retreating.
- **Best Used For**: Volatile, unpredictable characters whose internal instability drives dramatic narrative escalation.

---

## 4. Goal Arbitration & Bayesian Updates

Characters prioritize their immediate goals by calculating posterior probabilities based on their attachment priors:

### Mathematical Formula

$$\text{Goal Priority}(G) = \text{Base Weight}(G) \times \sum (P(H_i) \times w_i)$$

### Practical Goal Calculation Example

When evaluating a defensive goal like avoiding vulnerability:

$$\text{Priority}(G\_\text{Avoid\_Vulnerability}) = 8 \times P(P\_\text{Will\_Abandon}) \times P(P\_\text{Hidden\_Agenda})$$

> **Psychological Insight**: A sudden rise in abandonment probability immediately cascades through the belief network, instantly overriding connection drives with self-protective behaviors.

---

## 5. Step-by-Step Implementation Guide

Follow this sequential workflow to configure character entities:

1. **Select an attachment style** that reflects the character's core psychological background.
2. **Assign `dynamics_baseline` values** inside the entity data structure.
3. **Configure initial runtime `dynamics`** based on narrative entry conditions:
   - *Natural State*: Set `dynamics` identical to `dynamics_baseline` if the character enters in their normal baseline mood.
   - *Displaced State*: Set `dynamics` to offset values if circumstances have temporarily destabilized them (e.g., an avoidant character temporarily forced into high openness will slowly drift back to walled isolation).

### Entity Data Structure

```json
{
  "dynamics": { 
    "chaos": 55, 
    "intensity": 70, 
    "openness": 80, 
    "affinity": 75 
  },
  "dynamics_baseline": { 
    "chaos": 55, 
    "intensity": 70, 
    "openness": 80, 
    "affinity": 75 
  }
}
```

---

## 6. Style Diagnostic Heuristics

If you are reverse-engineering an existing character entity without a configured baseline, apply these heuristic rules to determine their corresponding archetype:

```text
                     ┌── openness < 35 AND affinity < 35 ───────────> Avoidant
                     ├── chaos > 65 ────────────────────────────────> Disorganized
Dynamic Readings ────┤
                     ├── openness > 65 AND (intensity > 60 OR affinity > 60) ──> Anxious
                     └── openness > 65 AND chaos < 45 ──────────────> Secure
```

- Always **align the character's narrative description** (`non_physical`) with their underlying baseline configuration.
