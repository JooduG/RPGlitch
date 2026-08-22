# Suggestion: Cognitive Architecture, Bayesian Beliefs & Psychodynamics

> **Status:** Architectural Proposal / Backlog Reference  
> **Domain:** Agent Epistemology, Probabilistic Belief Updating, Attachment Archetypes & Automated Somatics  
> **Scope:** Bayesian Updating ($P(H|E)$), Confidence Intervals, 4 Attachment Schemas, Automated Dynamic-to-Somatic Rules, DynamicsHUD UI  

---

## 1. Executive Summary

Realistic character embodiment in long-running simulations requires agents to maintain calibrated certainty under ambiguity and express psychological trauma through involuntary bodily physics.

While RPGlitch has implemented baseline 0–100 dynamic axes (`chaos`, `intensity`, `openness`, `affinity`), physics settlement (`settle_physics`), and basic `<think>` tags, this specification formalizes **probabilistic cognitive architecture and relational psychodynamics**:
1. **Mathematical Bayesian Belief Updating:** Computing posterior trust and suspicion ($P(H|E)$) in response to ambiguous player actions.
2. **The 3-Tier Confidence Interval Matrix:** Calibrating verbal assertiveness across Empirical (95%), Inferred (75%), and Speculative (40%) tiers.
3. **The 4 Attachment Style Archetypes:** Adding explicit attachment schemas (`secure`, `anxious`, `dismissive`, `fearful_avoidant`) to Entity models to drive long-term relationship trajectories and threat recovery.
4. **Automated Dynamic-to-Somatic Threshold Rules:** Procedurally injecting visceral physical tells from numerical axis intersections rather than manual keyword selection.
5. **The `DynamicsHUD.svelte` Component:** Visualizing real-time character dynamics, somatic stress pulses, and relational vectors.

---

## 2. Bayesian Belief Updating ($P(H|E)$)

When an agent observes ambiguous player actions (e.g., catching the user pocketing an item or hearing a hesitant voice), they update their working hypothesis using Bayes' theorem:

$$P(H|E) = \frac{P(E|H) \cdot P(H)}{P(E)}$$

- **Prior Hypothesis $P(H)$:** Baseline trust or suspicion established by prior interactions.
- **Likelihood $P(E|H)$:** How probable the observed evidence is given the hypothesis.
- **Posterior Probability $P(H|E)$:** Updated belief level dictating character demeanor.

```text
[Prior Suspicion: P(H) = 0.30]
         │
         ▼ (Observes user hiding an item: P(E|H) = 0.85)
[Posterior Suspicion: P(H|E) = 0.68] ──► Triggers guarded somatic tell
```

---

## 3. Epistemic Confidence Interval Matrix

Agents categorize their working beliefs across three distinct certainty tiers to calibrate assertiveness vs. hesitation:

| Tier | Category | Confidence Interval | Verification Requirement | Behavioral Expression |
| :--- | :--- | :---: | :--- | :--- |
| **Tier 1** | **Empirical Truth** | **95–100%** | Direct visual/auditory witness or physical evidence. | Speaks with direct assertion; takes decisive action. |
| **Tier 2** | **Inferred Deduction** | **65–85%** | Logical deduction from observable clues. | Cautious questioning; tests hypothesis through conversational bait. |
| **Tier 3** | **Speculative Bias** | **30–50%** | Emotional projection, paranoia, or second-hand rumor. | Expresses doubt; easily shaken by counter-evidence. |

### Sino-Logic Reasoning Trace (`<think>` Execution)

```markdown
<think>
L1_AGENCY_SCAN: Verified. No user actions or spoken dialogue generated.
L2_BAYESIAN_UPDATE:
  - Prior Trust: P(Trust) = 0.40
  - Evidence: User handed over the cipher key unprompted.
  - Posterior Trust: P(Trust|Key) = 0.65 [Inferred Confidence: 75%]
L3_WORLD_TICK: Time=+3 minutes | Ambient temp dropping | Distant footsteps.
L3_SOMA: Reduced masseter tension, lowered defensive shoulders.
</think>
```

---

## 4. Attachment Style Archetypes (Entity Schema Proposal)

Add an `attachment_style` property to the `Entity` schema:

```javascript
/**
 * @typedef {"secure" | "anxious" | "dismissive" | "fearful_avoidant"} AttachmentStyle
 */
```

### Archetype Behavioral Rules & Threat Responses

| Attachment Style | Relational Threat Reaction | Defense Mechanism | Recovery Curve |
| :--- | :--- | :--- | :--- |
| **`secure`** | Direct verbal boundary setting, proportional friction. | Seeks collaborative clarification without panic. | Fast equilibrium restore after turn resolution. |
| **`anxious`** | Hyper-vigilance, reassurance-seeking, verbal over-explaining. | Clings or raises emotional stakes to force engagement. | Requires explicit affirmation to lower `chaos` and `intensity`. |
| **`dismissive`** | Cold emotional detachment, intellectualization, silence. | Physical/spatial withdrawal; lowers `openness` to 0. | Restores baseline slowly only when left unpressured. |
| **`fearful_avoidant`** | Volatile oscillation between desperate proximity and hostility. | Severe somatic friction (tremors, sudden flight, lash-outs). | Highly volatile recovery; prone to relational relapse. |

---

## 5. Automated Dynamic-to-Somatic Threshold Rules

Instead of relying on manual keyword selection each turn, the engine evaluates active dynamic axis intersections and injects matching somatic directives:

```text
[intensity > 70 ∧ openness < 30] ──► Inject: "Masseter clench; locked jaw; shallow clavicular breathing."
[intensity > 70 ∧ openness > 70] ──► Inject: "Rapid speech cadence; dilated pupils; leaning forward."
[chaos > 65 ∧ affinity < 30]     ──► Inject: "Defensive repositioning; micro-scowls; clipped cadence."
[chaos < 25 ∧ affinity > 70]     ──► Inject: "Dropped shoulder tension; slow diaphragmatic exhalations."
```

### Reference Implementation

```javascript
/**
 * Evaluates dynamic axis values and returns automatic somatic directives.
 * @param {Record<string, number>} dynamics - Entity dynamics { chaos, intensity, openness, affinity }
 * @returns {string[]} Array of somatic behavioral directives
 */
export function evaluate_automatic_somatics(dynamics) {
  const { intensity = 50, openness = 50, chaos = 50, affinity = 50 } = dynamics;
  const tells = [];

  if (intensity > 70 && openness < 30) {
    tells.push("Jaw locked tight; masseter muscle jump; shallow upper-chest respiration; unblinking gaze.");
  }
  if (intensity > 70 && openness > 70) {
    tells.push("Accelerated speech tempo; dilated pupils; animated gestures; closing physical distance.");
  }
  if (chaos > 65 && affinity < 30) {
    tells.push("Defensive micro-shifts; hand hovering near pockets/weapons; abrupt one-word answers.");
  }
  if (chaos < 25 && affinity > 70) {
    tells.push("Shoulders relaxed; slow measured breathing; sustained unguarded eye contact.");
  }

  return tells;
}
```

---

## 6. Proposed `DynamicsHUD.svelte` Component

A compact, ambient UI widget for the bottom console or character drawer:
- **Visual Display:** 4 micro-meters (Chaos, Intensity, Openness, Affinity) rendered with theme-aware accent colors.
- **Somatic Pulse:** Pulses when autonomic thresholds are breached (`intensity > 70`), indicating character physiological stress to the player without breaking narrative immersion.
- **Attachment Badge:** Displays active archetype icon (`🛡️ Secure`, `⚡ Anxious`, `❄️ Dismissive`, `🌪️ Disorganized`).
