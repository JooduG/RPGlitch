# Suggestion: Dynamic Somatic Tell Engine & Attachment Psychodynamics

> **Status:** Architectural Proposal / Backlog Reference  
> **Domain:** Character Psychology, Non-Verbal Physics & Reactive Telemetry  
> **Scope:** The 4 Dynamic Axes, Attachment Archetypes, Somatic Micro-Expressions, Svelte 5 DynamicsHUD  

---

## 1. Executive Summary

Realistic character embodiment requires emotional states to express themselves through involuntary bodily physics rather than explicit exposition. This specification formalizes:
1. **The 4 Dynamic Axes:** `chaos`, `intensity`, `openness`, `affinity` (0–100 scales governed by `settle_physics()`).
2. **Dynamic Somatic Tell Engine:** Directly binds shifts in dynamic axes to visceral physical responses (intercostal breathing, masseter clenches, pupillary response).
3. **The 4 Attachment Archetypes:** Modulates relationship trajectories and behavioral vectors under relational stress.

---

## 2. The 4 Dynamic Axes Architecture

```text
       HIGH INTENSITY (Arousal / Adrenaline)
                      ▲
                      │
   CHAOS (Volatility) │   OPENNESS (Receptivity)
   ◄──────────────────┼──────────────────►
                      │
                      ▼
        LOW INTENSITY (Calm / Lethargy)
                      
   AFFINITY (Relational Valence / Warmth): 0 (Hostile) ◄────► 100 (Devoted)
```

- **`chaos` (0–100):** Unpredictability, emotional volatility, and situational entropy.
- **`intensity` (0–100):** Sympathetic nervous system activation, cognitive focus, adrenaline load.
- **`openness` (0–100):** Willingness to share vulnerability, receive input, and disclose private facts.
- **`affinity` (0–100):** Interpersonal bond strength, trust baseline, and emotional warmth.

---

## 3. Dynamic Somatic Tell Engine

Characters never declare their statistics. When dynamic states shift, the model renders matching physical reactions:

```text
[Dynamic Shift: Intensity +25] ──► Autonomic Reaction (Intercostal breath hitch)
[Dynamic Shift: Openness -30]  ──► Defensive Posture (Averted eye contact, crossed arms)
[Dynamic Shift: Chaos +40]     ──► Kinetic Fidgeting (Weight shift, rapid micro-glance)
```

### Dynamic-to-Somatic Mapping Matrix

| Dynamic State | Axis Level | Observable Somatic Reactions |
| :--- | :--- | :--- |
| **High Intensity + Low Openness** | `intensity > 70`, `openness < 30` | Masseter clench; locked jaw; shallow clavicular breathing; rigid thoracic spine; unblinking stare. |
| **High Intensity + High Openness** | `intensity > 70`, `openness > 70` | Rapid speech cadence; dilated pupils; animated hand gestures; leaning forward into personal space. |
| **High Chaos + Low Affinity** | `chaos > 65`, `affinity < 30` | Sudden defensive repositioning; fingers hovering near weapons/pockets; micro-scowls; clipped 1-word responses. |
| **Low Chaos + High Affinity** | `chaos < 25`, `affinity > 70` | Dropped shoulder tension; slow diaphragmatic exhalations; held gentle gaze; unguarded physical stance. |

---

## 4. Attachment Style Archetypes in Simulation

| Attachment Style | Baseline Dynamics | Reaction to Relational Threat | Recovery Behavior |
| :--- | :--- | :--- | :--- |
| **Secure** | Balanced `openness` & `affinity`, low `chaos` | Direct communication, calm boundary setting. | Restores equilibrium smoothly after conflict. |
| **Anxious-Preoccupied** | High `affinity`, high `chaos`, volatile `intensity` | Hyper-vigilance, reassurance-seeking, over-explaining. | Clings or escalates until validation is received. |
| **Dismissive-Avoidant** | Low `openness`, low `affinity`, low `chaos` | Cold emotional withdrawal, intellectualization, silence. | Distances physically to restore independence. |
| **Fearful-Avoidant (Disorganized)** | Volatile spikes in all 4 axes simultaneously | Alternating desperate proximity and aggressive pushback. | Severe somatic friction (shuddering breath, flight). |

---

## 5. Reactive Telemetry & State Snapshot Format

Characters emit their dynamic states at the conclusion of each narrative turn:

```markdown
<state_snapshot>
☉ KAELEN STATE: Hyper-Vigilant ↳ Internal Truth: Guarded & Suspicious
REL: Trust=24% | Intimacy=08% | Power=Defensive
DYNAMICS: Chaos=35 | Intensity=65 | Openness=20 | Affinity=25
SOMA: Masseter clench, intercostal breath hitch.
</state_snapshot>
```
